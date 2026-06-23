/** Server-side VAPI configuration (webhook + admin status). */

export function isVapiConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY?.trim() &&
      process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID?.trim()
  );
}

export function isVapiWebhookReady(): boolean {
  return Boolean(process.env.VAPI_WEBHOOK_SECRET?.trim());
}

export function getVapiWebhookUrl(): string {
  const base = (
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
  return `${base}/api/vapi/webhook`;
}

/** VAPI tool definitions — configure these in dashboard.vapi.ai on your assistant. */
export const VAPI_SERVER_TOOLS = [
  {
    name: "search_trips",
    description:
      "Recherche des voyages groupés au Maghreb correspondant aux critères du voyageur.",
    parameters: {
      type: "object",
      properties: {
        destination: { type: "string" },
        budgetMax: { type: "number" },
        numberOfTravelers: { type: "number" },
        startDate: { type: "string" },
        endDate: { type: "string" },
        tripType: { type: "array", items: { type: "string" } },
      },
    },
  },
  {
    name: "save_travel_request",
    description:
      "Enregistre une demande de voyage et envoie un email de confirmation au client.",
    parameters: {
      type: "object",
      required: ["clientEmail", "clientName"],
      properties: {
        clientEmail: { type: "string" },
        clientName: { type: "string" },
        destination: { type: "string" },
        budgetMax: { type: "number" },
        numberOfTravelers: { type: "number" },
      },
    },
  },
] as const;
