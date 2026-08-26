/**
 * Errors whose message is written for the customer, not for the logs.
 *
 * Everything else thrown by a route is treated as an internal fault and
 * answered with a generic apology, so database and upstream details never
 * reach the browser. Business rules ("pay on delivery is Nairobi only") are
 * not faults — the customer needs to read them to fix their order, so they
 * carry this type and are passed through verbatim.
 */
export class PublicError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "PublicError";
    this.status = status;
  }
}

export function isPublicError(err: unknown): err is PublicError {
  return err instanceof PublicError;
}
