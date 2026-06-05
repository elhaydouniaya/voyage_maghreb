import { wrapEmailHtml } from "@/lib/email-template";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  /** Titre affiché dans l'en-tête du template */
  title?: string;
  /** Si false, n'enveloppe pas dans le template (déjà fait) */
  wrap?: boolean;
};

export { isEmailConfigured } from "@/lib/email-config";

export async function sendEmail({
  to,
  subject,
  html,
  title = "MaghrebVoyage",
  wrap = true,
}: SendEmailInput) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.RESEND_FROM?.trim() || "MaghrebVoyage <onboarding@resend.dev>";
  const isDev = process.env.NODE_ENV !== "production";
  const devRedirect = process.env.RESEND_DEV_TO?.trim();

  let recipient = to;
  let finalHtml = wrap ? wrapEmailHtml(title, html) : html;

  if (isDev && devRedirect && devRedirect.toLowerCase() !== to.toLowerCase()) {
    recipient = devRedirect;
    finalHtml =
      `<p style="background:#fff7ed;padding:12px;border-radius:8px;font-size:13px"><strong>[Dev]</strong> Destinataire prévu : ${to}</p>` +
      finalHtml;
  }

  if (!apiKey) {
    console.log(`[email:dev] To: ${recipient}${recipient !== to ? ` (was ${to})` : ""}`);
    console.log(`[email:dev] Subject: ${subject}`);
    return { ok: true, dev: true };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [recipient], subject, html: finalHtml }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Resend error:", err);

    if (
      isDev &&
      (err.includes("validation_error") || err.includes("403"))
    ) {
      console.log(`[email:dev-fallback] To: ${to} | Subject: ${subject}`);
      console.log(
        "[email:dev-fallback] Tip: set RESEND_DEV_TO to your verified Resend email in .env"
      );
      return { ok: true, dev: true };
    }

    throw new Error("Envoi d'email impossible.");
  }

  return { ok: true };
}
