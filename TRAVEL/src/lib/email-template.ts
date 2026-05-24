const baseUrl = () => process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export function wrapEmailHtml(title: string, bodyHtml: string) {
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" /></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Segoe UI,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #e2e8f0">
        <tr>
          <td style="background:#0f172a;padding:28px 32px;text-align:center">
            <p style="margin:0;font-size:22px;font-weight:800;color:#ffffff">
              Maghreb<span style="color:#f97316">Voyage</span>
            </p>
            <p style="margin:8px 0 0;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.15em">
              ${title}
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;color:#0f172a;font-size:15px;line-height:1.6">
            ${bodyHtml}
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px 28px;font-size:11px;color:#94a3b8;line-height:1.5">
            <a href="${baseUrl()}/legal/cgu" style="color:#f97316">CGU</a> ·
            <a href="${baseUrl()}/legal/confidentialite" style="color:#f97316">Confidentialité</a> ·
            <a href="${baseUrl()}/legal/remboursements" style="color:#f97316">Remboursements</a>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function emailButton(href: string, label: string) {
  return `<p style="margin:24px 0">
    <a href="${href}" style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;font-weight:700;font-size:13px;padding:14px 28px;border-radius:999px">
      ${label}
    </a>
  </p>`;
}
