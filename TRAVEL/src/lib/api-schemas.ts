import { z } from "zod";

export function formatZodError(error: z.ZodError): string {
  const first = error.issues[0];
  return first?.message || "Données invalides.";
}

export const bookingInitiateSchema = z
  .object({
    groupTripId: z.string().trim().optional(),
    tripId: z.string().trim().optional(),
    clientEmail: z
      .string()
      .trim()
      .min(3, "Email obligatoire.")
      .email("Email invalide."),
    clientName: z
      .string()
      .trim()
      .min(2, "Nom obligatoire (2 caractères min).")
      .max(120),
    clientPhone: z.string().trim().max(40).optional(),
    clientCountry: z.string().trim().max(80).optional(),
    numberOfSeats: z.coerce.number().int().min(1).max(50).default(1),
    notes: z.string().trim().max(2000).optional(),
    travelRequestId: z.string().trim().optional(),
    acceptCgu: z.literal(true, { message: "Vous devez accepter les CGU." }),
    acceptRgpd: z.literal(true, { message: "Vous devez accepter la politique RGPD." }),
  })
  .refine((d) => Boolean(d.groupTripId || d.tripId), {
    message: "Identifiant du voyage manquant.",
    path: ["groupTripId"],
  });

export type BookingInitiateInput = z.infer<typeof bookingInitiateSchema>;

export const aiMatchSchema = z
  .object({
    clientEmail: z.string().trim().max(200).optional(),
    clientName: z.string().trim().max(120).optional(),
    destination: z.string().trim().max(200).optional(),
    numberOfTravelers: z.coerce.number().int().min(1).max(50).optional(),
    budgetMax: z.coerce.number().min(0).max(100_000).optional(),
    tripType: z.union([z.string(), z.array(z.string())]).optional(),
    tripStyle: z.union([z.string(), z.array(z.string())]).optional(),
    startDate: z.string().trim().max(32).optional(),
    endDate: z.string().trim().max(32).optional(),
    duration: z.coerce.number().int().min(1).max(90).optional(),
    isDateFlexible: z.boolean().optional(),
    constraints: z.string().trim().max(4000).optional(),
    language: z.string().trim().max(8).optional(),
    clientPhone: z.string().trim().max(40).optional(),
    clientCountry: z.string().trim().max(80).optional(),
    consentRGPD: z.boolean().optional(),
    acceptCGU: z.boolean().optional(),
  })
  .passthrough();

export type AiMatchInput = z.infer<typeof aiMatchSchema>;

export const guideChatPostSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1, "Message vide.").max(4000),
      })
    )
    .min(1, "Messages invalides.")
    .max(30, "Historique trop long."),
});

export type GuideChatPostInput = z.infer<typeof guideChatPostSchema>;
