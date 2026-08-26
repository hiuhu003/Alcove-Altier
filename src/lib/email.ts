import "server-only";
import { SITE } from "./site";
import { formatKES } from "./utils";
import { DELIVERY_POLICY, zoneLabel } from "./delivery";
import {
  TRACK_STEPS,
  channelLabel,
  statusDescription,
  statusHeadline,
  stepIndex,
} from "./order-status";

/**
 * Transactional email.
 *
 * Every sender here is best-effort: it logs and resolves rather than throwing,
 * because none of these are worth failing a customer's order or an admin's save
 * over. With RESEND_API_KEY unset the message is logged instead of sent, so the
 * whole flow still works on a deployment that has no email provider yet.
 */

const BRAND = {
  charcoal: "#2c2b30",
  graphite: "#4f4f51",
  pink: "#ef6592",
  coral: "#f58f7c",
  cream: "#faf7f4",
  sand: "#f2ede8",
};

export type OrderEmailData = {
  ref: string;
  customerName: string;
  email: string;
  phone: string;
  address?: string | null;
  city?: string | null;
  notes?: string | null;
  channel: string;
  total: number;
  deliveryZone?: string | null;
  deliveryArea?: string | null;
  deliveryFee?: number;
  payOnDelivery?: boolean;
  items: { name: string; qty: number; price: number; color?: string | null; size?: string | null }[];
};

// --- Plumbing ----------------------------------------------------------------

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

/** Sends one email. Never throws — callers treat email as fire-and-forget. */
async function send(to: string, subject: string, html: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`[email] not configured - would send "${subject}" to ${to}`);
    return false;
  }
  if (!to) return false;

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(key);
    const from =
      process.env.EMAIL_FROM || `${SITE.name} <orders@${new URL(SITE.url).hostname}>`;
    const { error } = await resend.emails.send({ from, to, subject, html });
    if (error) {
      console.error(`[email] "${subject}" to ${to} rejected:`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[email] "${subject}" to ${to} failed:`, err);
    return false;
  }
}

/** Order values come from customers, so they are escaped before templating. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Shared shell so every message looks like it came from the same shop. */
function layout(opts: {
  heading: string;
  intro?: string;
  body: string;
  cta?: { label: string; url: string };
}) {
  return `
  <div style="margin:0;padding:24px 12px;background:${BRAND.sand};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif">
    <div style="max-width:560px;margin:0 auto;background:${BRAND.cream};border-radius:18px;overflow:hidden">
      <div style="padding:26px 28px 0">
        <p style="margin:0;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:${BRAND.graphite}">
          ${SITE.name}
        </p>
      </div>
      <div style="padding:14px 28px 28px">
        <h1 style="margin:0 0 10px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:500;color:${BRAND.charcoal}">
          ${opts.heading}
        </h1>
        ${opts.intro ? `<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:${BRAND.graphite}">${opts.intro}</p>` : ""}
        ${opts.body}
        ${
          opts.cta
            ? `<p style="margin:26px 0 0">
                 <a href="${opts.cta.url}" style="display:inline-block;background:${BRAND.pink};color:#fff;text-decoration:none;padding:13px 26px;border-radius:999px;font-size:15px;font-weight:600">
                   ${opts.cta.label}
                 </a>
               </p>`
            : ""
        }
      </div>
      <div style="padding:18px 28px 26px;border-top:1px solid rgba(0,0,0,0.07)">
        <p style="margin:0;font-size:12px;line-height:1.6;color:${BRAND.graphite}">
          ${SITE.name} · ${SITE.city}, ${SITE.country}<br/>
          Questions? Reply to this email or message us on WhatsApp.
        </p>
      </div>
    </div>
  </div>`;
}

function itemsTable(items: OrderEmailData["items"]) {
  const rows = items
    .map(
      (i) =>
        `<tr>
           <td style="padding:8px 0;font-size:14px;color:${BRAND.charcoal}">
             ${escapeHtml(i.name)}${i.size ? ` — ${escapeHtml(i.size)}` : ""}${
               i.color ? `, ${escapeHtml(i.color)}` : ""
             }
             <span style="color:${BRAND.graphite}">×${i.qty}</span>
           </td>
           <td style="padding:8px 0;text-align:right;font-size:14px;white-space:nowrap;color:${BRAND.charcoal}">
             ${formatKES(i.price * i.qty)}
           </td>
         </tr>`
    )
    .join("");
  return `<table style="width:100%;border-collapse:collapse;border-top:1px solid rgba(0,0,0,0.08);border-bottom:1px solid rgba(0,0,0,0.08)">${rows}</table>`;
}

function refBlock(ref: string) {
  return `<div style="background:${BRAND.sand};border-radius:12px;padding:14px 18px;margin:0 0 18px">
    <p style="margin:0;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${BRAND.graphite}">Order reference</p>
    <p style="margin:4px 0 0;font-family:Georgia,serif;font-size:24px;letter-spacing:1px;color:${BRAND.charcoal}">${escapeHtml(ref)}</p>
  </div>`;
}

const trackUrl = (ref: string) => `${SITE.url}/track?ref=${encodeURIComponent(ref)}`;

// --- Order placed -------------------------------------------------------------

/** Confirmation to the customer, plus the new-order alert to the shop. */
export async function sendOrderEmails(order: OrderEmailData): Promise<void> {
  const notify = process.env.ORDER_NOTIFY_EMAIL || SITE.email;
  const grand = order.total + (order.deliveryFee ?? 0);

  const paymentLine = order.payOnDelivery
    ? "You'll pay when your order arrives — cash or M-Pesa to the rider."
    : order.channel === "mpesa"
      ? `We'll confirm your M-Pesa payment to Paybill ${SITE.mpesa.paybill} (Acc ${SITE.mpesa.account}) shortly.`
      : "We'll confirm payment details with you shortly.";

  await send(
    order.email,
    `We've got your order — ${order.ref}`,
    layout({
      heading: `Thank you, ${escapeHtml(order.customerName.split(" ")[0])}`,
      intro:
        "We've received your order and we'll be in touch shortly to confirm the details and delivery.",
      body: `
        ${refBlock(order.ref)}
        ${itemsTable(order.items)}
        <table style="width:100%;margin-top:12px">
          <tr><td style="font-size:14px;color:${BRAND.graphite}">Items</td>
              <td style="text-align:right;font-size:14px">${formatKES(order.total)}</td></tr>
          <tr><td style="font-size:14px;color:${BRAND.graphite}">Delivery</td>
              <td style="text-align:right;font-size:14px">${
                order.deliveryFee && order.deliveryFee > 0
                  ? formatKES(order.deliveryFee)
                  : "Confirmed with you"
              }</td></tr>
          <tr><td style="padding-top:8px;font-size:16px;font-weight:600">Total</td>
              <td style="padding-top:8px;text-align:right;font-size:16px;font-weight:600">${formatKES(grand)}</td></tr>
        </table>
        <p style="margin:18px 0 0;font-size:14px;line-height:1.6;color:${BRAND.graphite}">${paymentLine}</p>
        <p style="margin:10px 0 0;font-size:14px;line-height:1.6;color:${BRAND.graphite}">
          ${escapeHtml(zoneLabel(order.deliveryZone))}${order.deliveryArea ? ` · ${escapeHtml(order.deliveryArea)}` : ""}.
          ${DELIVERY_POLICY.short}
        </p>`,
      cta: { label: "Track your order", url: trackUrl(order.ref) },
    })
  );

  await send(
    notify,
    `New order ${order.ref} — ${formatKES(grand)}`,
    layout({
      heading: `New order · ${escapeHtml(order.ref)}`,
      intro: `${escapeHtml(order.customerName)} placed an order via ${escapeHtml(channelLabel(order.channel))}.`,
      body: `
        ${itemsTable(order.items)}
        <p style="margin:16px 0 0;font-size:14px;line-height:1.7;color:${BRAND.charcoal}">
          <strong>Total:</strong> ${formatKES(grand)}<br/>
          <strong>Phone:</strong> ${escapeHtml(order.phone)}<br/>
          <strong>Email:</strong> ${escapeHtml(order.email)}<br/>
          <strong>Delivery:</strong> ${escapeHtml(zoneLabel(order.deliveryZone))}${
            order.deliveryArea ? ` · ${escapeHtml(order.deliveryArea)}` : ""
          }${order.address ? `<br/><strong>Address:</strong> ${escapeHtml(order.address)}` : ""}
          ${order.notes ? `<br/><strong>Notes:</strong> ${escapeHtml(order.notes)}` : ""}
        </p>`,
      cta: { label: "Open in the dashboard", url: `${SITE.url}/admin/orders` },
    })
  );
}

// --- Order status changed ------------------------------------------------------

/**
 * Tells the customer their order moved along. Sent when the admin changes an
 * order's status, so "where is my order?" is answered before it is asked.
 */
export async function sendOrderStatusEmail(order: {
  ref: string;
  customerName: string;
  email: string;
  status: string;
  total: number;
  deliveryFee?: number;
  payOnDelivery?: boolean;
}): Promise<void> {
  const current = stepIndex(order.status);
  const cancelled = order.status === "cancelled";

  const progress = cancelled
    ? ""
    : `<table style="width:100%;margin:4px 0 18px"><tr>${TRACK_STEPS.map((step, i) => {
        const done = i <= current;
        return `<td style="text-align:center;font-size:12px;color:${done ? BRAND.charcoal : BRAND.graphite}">
          <div style="width:26px;height:26px;line-height:26px;margin:0 auto 6px;border-radius:50%;background:${
            done ? BRAND.pink : "rgba(0,0,0,0.08)"
          };color:${done ? "#fff" : BRAND.graphite};font-weight:700">${done ? "&#10003;" : i + 1}</div>
          ${step.label}
        </td>`;
      }).join("")}</tr></table>`;

  const owed =
    order.payOnDelivery && order.status === "confirmed"
      ? `<p style="margin:14px 0 0;font-size:14px;color:${BRAND.graphite}">
           Please have <strong>${formatKES(order.total + (order.deliveryFee ?? 0))}</strong> ready for the rider — cash or M-Pesa.
         </p>`
      : "";

  await send(
    order.email,
    `${statusHeadline(order.status)} — ${order.ref}`,
    layout({
      heading: statusHeadline(order.status),
      intro: `Hi ${escapeHtml(order.customerName.split(" ")[0])}, here's an update on order ${escapeHtml(order.ref)}.`,
      body: `${progress}
        <p style="margin:0;font-size:15px;line-height:1.6;color:${BRAND.graphite}">${statusDescription(order.status)}</p>
        ${owed}`,
      cta: { label: "View your order", url: trackUrl(order.ref) },
    })
  );
}

// --- Review invitation ---------------------------------------------------------

/**
 * Asks for a star rating once an order has been delivered.
 *
 * The link carries a signed token, so only someone who received this email can
 * review — no sign-in required, and no open form for strangers.
 */
export async function sendReviewRequestEmail(order: {
  ref: string;
  customerName: string;
  email: string;
  reviewUrl: string;
  items: { name: string }[];
}): Promise<void> {
  const stars = `<p style="margin:0 0 6px;font-size:26px;letter-spacing:6px;color:${BRAND.coral}">&#9733;&#9733;&#9733;&#9733;&#9733;</p>`;
  const pieces = order.items
    .map(
      (i) =>
        `<li style="margin:0 0 4px;font-size:14px;color:${BRAND.charcoal}">${escapeHtml(i.name)}</li>`
    )
    .join("");

  await send(
    order.email,
    `How did we do? — ${order.ref}`,
    layout({
      heading: "How did we do?",
      intro: `Hi ${escapeHtml(order.customerName.split(" ")[0])}, your order has been delivered. If you have a minute, a star rating helps other people shopping for the same piece.`,
      body: `${stars}<ul style="margin:14px 0 0;padding-left:18px">${pieces}</ul>`,
      cta: { label: "Leave a review", url: order.reviewUrl },
    })
  );
}

// --- Admin invitation ----------------------------------------------------------

/**
 * Tells someone they've been given admin access, with the credentials set for
 * them.
 *
 * Emailing a password is not ideal — it is the trade-off for letting the client
 * add a colleague without building a password-reset flow. The message says to
 * change it, and the account can be removed from the dashboard at any time.
 */
export async function sendAdminInviteEmail(invite: {
  name: string;
  email: string;
  password: string;
  invitedBy: string;
}): Promise<boolean> {
  return send(
    invite.email,
    `You now have admin access to ${SITE.name}`,
    layout({
      heading: "You've been given admin access",
      intro: `${escapeHtml(invite.invitedBy)} has given you access to the ${SITE.name} dashboard, where you can manage products, orders and reports.`,
      body: `
        <div style="background:${BRAND.sand};border-radius:12px;padding:16px 18px">
          <p style="margin:0 0 10px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${BRAND.graphite}">Your sign-in details</p>
          <p style="margin:0;font-size:14px;line-height:1.8;color:${BRAND.charcoal}">
            <strong>Email:</strong> ${escapeHtml(invite.email)}<br/>
            <strong>Password:</strong> <code style="background:#fff;padding:2px 6px;border-radius:4px">${escapeHtml(invite.password)}</code>
          </p>
        </div>
        <p style="margin:16px 0 0;font-size:14px;line-height:1.6;color:${BRAND.graphite}">
          Sign in at <a href="${SITE.url}/signin" style="color:${BRAND.pink}">${SITE.url}/signin</a> and you'll be taken
          straight to the dashboard. Please change this password once you're in, and don't forward this email.
        </p>`,
      cta: { label: "Sign in to the dashboard", url: `${SITE.url}/signin` },
    })
  );
}
