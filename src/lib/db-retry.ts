import "server-only";

/**
 * Riding out transient database blips.
 *
 * Supabase fronts Postgres with a connection pooler (Supavisor). It
 * occasionally becomes briefly unreachable — a redeploy on their side, a cold
 * pooler, a network hiccup — and Prisma surfaces that as a hard error. On a
 * checkout that means a customer fills in the whole form and is told the order
 * failed, which is the worst possible moment for a one-second outage.
 *
 * These faults are transient by definition, so the fix is to try again rather
 * than give up. Only connection-level errors are retried; a genuine constraint
 * violation or bad query fails immediately, because repeating it would just
 * fail the same way.
 */

/** Prisma codes that mean "the database was unreachable", not "the query was wrong". */
const TRANSIENT_CODES = new Set([
  "P1001", // can't reach database server
  "P1002", // server reached but timed out
  "P1008", // operation timed out
  "P1017", // server has closed the connection
  "P2024", // timed out fetching a connection from the pool
]);

export function isTransientDbError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: string; name?: string; message?: string };

  if (e.code && TRANSIENT_CODES.has(e.code)) return true;
  // Initialization errors carry no code but always mean "couldn't connect".
  if (e.name === "PrismaClientInitializationError") return true;
  return Boolean(
    e.message &&
      /can't reach database server|connection pool|server has closed the connection|ECONNRESET|ETIMEDOUT/i.test(
        e.message
      )
  );
}

const DELAYS_MS = [250, 750, 1500];

/**
 * Run a database operation, retrying transient connection failures.
 *
 * `label` only appears in server logs, so a failure that exhausts the retries
 * can be traced to the operation that gave up.
 */
export async function withDbRetry<T>(operation: () => Promise<T>, label: string): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= DELAYS_MS.length; attempt++) {
    try {
      return await operation();
    } catch (err) {
      lastError = err;
      if (!isTransientDbError(err) || attempt === DELAYS_MS.length) break;

      const wait = DELAYS_MS[attempt];
      console.warn(
        `[db] ${label}: transient failure (attempt ${attempt + 1}), retrying in ${wait}ms`
      );
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
  }

  console.error(`[db] ${label}: failed`, lastError);
  throw lastError;
}
