import "server-only";
import { SITE } from "./site";
import { channelLabel, formatKES } from "./utils";
import { getZone } from "./delivery";

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
  payOnDelivery?: boolean;
  items: { name: string; qty: number; price: number; color?: string | null; size?: string | null }[];
};

function itemsTable(items: OrderEmailData["items"]) {
  return items
    .map(
      (i) =>
        `<tr><td style="padding:6px 0">${i.name}${
          i.size ? ` — ${i.size}` : ""
        }${i.color ? `, ${i.color}` : ""} ×${i.qty}</td><td style="padding:6px 0;text-align:right">${formatKES(
          i.price * i.qty
        )}</td></tr>`
    )
    .join("");
}

/**
 * Sends order-notification emails to the business (and a confirmation to the
 * customer) via Resend. If RESEND_API_KEY is not set, it logs to the console
 * and resolves — so checkout never fails just because email isn't configured.
 */
export async function sendOrderEmails(order: OrderEmailData): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const notify = process.env.ORDER_NOTIFY_EMAIL || SITE.email;

  const zone = getZone(order.deliveryZone);

  const businessHtml = `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:auto;color:#2c2b30">
      <h2 style="font-family:Georgia,serif">New order · ${order.ref}</h2>
      <p><strong>Payment:</strong> ${channelLabel(order.channel)}${
        order.payOnDelivery ? " — collect cash/M-Pesa on delivery" : ""
      }</p>
      <p><strong>Delivery:</strong> ${zone.label}${
        order.deliveryArea ? ` — ${order.deliveryArea}` : ""
      }<br/>
      <span style="color:#4f4f51">${zone.feeNote}</span></p>
      <p><strong>Customer:</strong> ${order.customerName}<br/>
      <strong>Phone:</strong> ${order.phone}<br/>
      <strong>Email:</strong> ${order.email}<br/>
      ${order.address ? `<strong>Address:</strong> ${order.address}, ${order.city ?? ""}<br/>` : ""}
      ${order.notes ? `<strong>Notes:</strong> ${order.notes}` : ""}</p>
      <table style="width:100%;border-top:1px solid #eee;border-bottom:1px solid #eee;margin:12px 0">
        ${itemsTable(order.items)}
      </table>
      <p style="text-align:right;font-size:18px"><strong>Total: ${formatKES(order.total)}</strong></p>
    </div>`;

  if (!key) {
    console.log(
      `[email] RESEND_API_KEY not set — order ${order.ref} not emailed. Would notify: ${notify}`
    );
    return;
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(key);
    const from = `${SITE.name} <orders@${new URL(SITE.url).hostname}>`;

    await resend.emails.send({
      from,
      to: notify,
      subject: `New order ${order.ref} — ${formatKES(order.total)}`,
      html: businessHtml,
    });

    if (order.email) {
      await resend.emails.send({
        from,
        to: order.email,
        subject: `We've received your order — ${order.ref}`,
        html: `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:auto;color:#2c2b30">
          <h2 style="font-family:Georgia,serif">Thank you, ${order.customerName}!</h2>
          <p>We've received your order <strong>${order.ref}</strong> and will be in touch shortly to confirm details${
            order.channel === "whatsapp" ? " on WhatsApp" : ""
          }.</p>
          <table style="width:100%;border-top:1px solid #eee;border-bottom:1px solid #eee;margin:12px 0">${itemsTable(
            order.items
          )}</table>
          <p style="text-align:right"><strong>Total: ${formatKES(order.total)}</strong></p>
          <p style="background:#faf7f4;padding:12px 14px;border-radius:10px;color:#4f4f51">
            <strong style="color:#2c2b30">Delivery — ${zone.label}</strong><br/>${zone.feeNote}
          </p>
          <p style="color:#4f4f51">— ${SITE.name}</p>
        </div>`,
      });
    }
  } catch (err) {
    console.error("[email] failed to send order emails:", err);
  }
}
