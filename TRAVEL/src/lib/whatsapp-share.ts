/**
 * Opens WhatsApp Web in the browser — avoids the native-app permission popup
 * triggered by wa.me / api.whatsapp.com deep links on desktop.
 */
export function openWhatsAppShare(text: string): void {
  const url = `https://web.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}
