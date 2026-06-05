import { sendEmail } from "@/lib/email";
import { emailButton } from "@/lib/email-template";
import { resolveAdminNotifyEmail } from "@/lib/email-config";

const baseUrl = () => process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function sendAgencyRegistrationEmails(input: {
  agencyEmail: string;
  agencyName: string;
  managerName: string;
}) {
  await sendEmail({
    to: input.agencyEmail,
    subject: "Inscription reçue — MaghrebVoyage",
    title: "Inscription agence",
    html: `
      <p>Bonjour ${input.managerName},</p>
      <p>Nous avons bien reçu le dossier de l'agence <strong>${input.agencyName}</strong>.</p>
      <p>Notre équipe va l'examiner sous 48 h. Vous recevrez un email dès que votre compte sera activé.</p>
      ${emailButton(`${baseUrl()}/agency/login`, "Accéder à l'espace agence")}
    `,
  });

  const adminEmail = await resolveAdminNotifyEmail();
  if (adminEmail) {
    await sendEmail({
      to: adminEmail,
      subject: `Nouvelle agence à valider : ${input.agencyName}`,
      title: "Nouvelle agence",
      html: `
        <p>Une nouvelle agence s'est inscrite : <strong>${input.agencyName}</strong></p>
        <p>Contact : ${input.managerName} — ${input.agencyEmail}</p>
        ${emailButton(`${baseUrl()}/admin/agencies`, "Valider dans l'admin")}
      `,
    });
  }
}

export async function sendAgencyAccountReadyEmail(input: {
  agencyEmail: string;
  agencyName: string;
  managerName: string;
}) {
  await sendEmail({
    to: input.agencyEmail,
    subject: "Votre espace agence est prêt — MaghrebVoyage",
    title: "Compte agence actif",
    html: `
      <p>Bonjour ${input.managerName},</p>
      <p>Votre compte agence <strong>${input.agencyName}</strong> est créé. Connectez-vous pour gérer vos voyages.</p>
      ${emailButton(`${baseUrl()}/agency/dashboard`, "Ouvrir mon tableau de bord")}
    `,
  });
}

export async function sendTripPublishedEmail(input: {
  agencyEmail: string;
  agencyName: string;
  tripTitle: string;
  magicLink: string;
}) {
  await sendEmail({
    to: input.agencyEmail,
    subject: `Voyage publié — ${input.tripTitle}`,
    html: `
      <p>Bonjour ${input.agencyName},</p>
      <p>Votre voyage <strong>${input.tripTitle}</strong> est maintenant en ligne.</p>
      <p><strong>Lien magique :</strong><br/>
      <a href="${input.magicLink}">${input.magicLink}</a></p>
      <p>Partagez ce lien sur WhatsApp, Instagram ou par email pour recevoir des réservations.</p>
      <p><a href="${baseUrl()}/agency/trips">Gérer mes voyages</a></p>
    `,
  });
}

export async function sendAgencyAiMatchLeadEmail(input: {
  agencyEmail: string;
  agencyName: string;
  managerName: string;
  clientName: string;
  clientEmail: string;
  destination: string;
  travelers: number;
  budgetMax: number;
  summary?: string;
  matchedTrips: { title: string; compatibility?: number }[];
  travelRequestId?: string;
}) {
  const leadsUrl = input.travelRequestId
    ? `${baseUrl()}/agency/leads?request=${encodeURIComponent(input.travelRequestId)}`
    : `${baseUrl()}/agency/leads`;

  const tripsList = input.matchedTrips
    .map(
      (t) =>
        `<li><strong>${t.title}</strong>${t.compatibility != null ? ` — ${t.compatibility}% compatibilité` : ""}</li>`
    )
    .join("");

  await sendEmail({
    to: input.agencyEmail,
    subject: `Nouveau prospect IA — ${input.destination}`,
    title: "Prospect configurateur IA",
    html: `
      <p>Bonjour ${input.managerName},</p>
      <p>Un voyageur a utilisé le configurateur IA et correspond à <strong>${input.matchedTrips.length}</strong> de vos voyages :</p>
      <ul>${tripsList}</ul>
      <p><strong>Client :</strong> ${input.clientName} (${input.clientEmail})<br/>
      <strong>Destination recherchée :</strong> ${input.destination}<br/>
      <strong>Voyageurs :</strong> ${input.travelers}<br/>
      <strong>Budget max :</strong> ${Math.round(input.budgetMax)}€</p>
      ${input.summary ? `<p><em>${input.summary}</em></p>` : ""}
      <p>Le client peut réserver directement sur la plateforme. Retrouvez ce prospect dans votre espace agence.</p>
      ${emailButton(leadsUrl, "Voir mes prospects IA")}
      ${emailButton(`${baseUrl()}/agency/bookings`, "Mes réservations")}
      ${emailButton(`${baseUrl()}/agency/trips`, "Mes voyages")}
    `,
  });
}

export async function sendAgencyConnectPayoutEmail(input: {
  agencyEmail: string;
  agencyName: string;
  tripTitle: string;
  confirmationCode: string;
  grossCents: number;
  platformFeeCents: number;
  agencyNetCents: number;
  currency?: string;
}) {
  const currency = (input.currency || "EUR").toUpperCase();
  const fmt = (cents: number) =>
    `${(cents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency === "EUR" ? "€" : currency}`;

  await sendEmail({
    to: input.agencyEmail,
    subject: `Paiement reçu — ${input.tripTitle}`,
    title: "Virement Stripe Connect",
    html: `
      <p>Bonjour ${input.agencyName},</p>
      <p>L'acompte pour <strong>${input.tripTitle}</strong> (${input.confirmationCode}) a été encaissé via Stripe Connect.</p>
      <ul>
        <li><strong>Montant client :</strong> ${fmt(input.grossCents)}</li>
        <li><strong>Commission plateforme :</strong> ${fmt(input.platformFeeCents)}</li>
        <li><strong>Net versé sur votre compte Stripe :</strong> ${fmt(input.agencyNetCents)}</li>
      </ul>
      <p>Le virement vers votre compte bancaire suit le calendrier Stripe (générallement 2–7 jours ouvrés).</p>
      ${emailButton(`${baseUrl()}/agency/bookings`, "Voir mes réservations")}
    `,
  });
}

export async function sendPartnerNewsletterEmail(input: {
  agencyEmail: string;
  agencyName: string;
  managerName: string;
  digest: {
    periodDays: number;
    newTrips: number;
    confirmedBookings: number;
    aiLeads: number;
    publishedTrips: number;
  };
}) {
  const { digest } = input;
  await sendEmail({
    to: input.agencyEmail,
    subject: `MaghrebVoyage partenaires — activité ${digest.periodDays} jours`,
    title: "Newsletter partenaires",
    html: `
      <p>Bonjour ${input.managerName},</p>
      <p>Voici un récapitulatif de l'activité sur <strong>MaghrebVoyage</strong> ces ${digest.periodDays} derniers jours :</p>
      <ul>
        <li><strong>${digest.newTrips}</strong> nouveau(x) voyage(s) publié(s)</li>
        <li><strong>${digest.confirmedBookings}</strong> réservation(s) confirmée(s)</li>
        <li><strong>${digest.aiLeads}</strong> prospect(s) IA qualifié(s)</li>
        <li><strong>${digest.publishedTrips}</strong> départ(s) actuellement en ligne</li>
      </ul>
      <p>Publiez vos prochains départs, connectez Stripe Connect et consultez vos leads depuis votre espace agence.</p>
      ${emailButton(`${baseUrl()}/agency/dashboard`, "Mon tableau de bord")}
      ${emailButton(`${baseUrl()}/agency/trips/new`, "Publier un voyage")}
      <p style="font-size:11px;color:#64748b;margin-top:24px">
        Vous recevez cet email car l'option « Newsletter partenaires » est activée dans vos paramètres agence.
      </p>
    `,
  });
}

export async function sendAgencyStatusEmail(input: {
  agencyEmail: string;
  agencyName: string;
  status: "VERIFIED" | "REJECTED" | "SUSPENDED";
  note?: string;
}) {
  if (input.status === "VERIFIED") {
    await sendEmail({
      to: input.agencyEmail,
      subject: "Votre agence est vérifiée — MaghrebVoyage",
      title: "Agence vérifiée",
      html: `
        <p>Bonne nouvelle ! L'agence <strong>${input.agencyName}</strong> est maintenant vérifiée.</p>
        <p>Vous pouvez publier vos voyages depuis votre tableau de bord.</p>
        ${emailButton(`${baseUrl()}/agency/trips/new`, "Créer un voyage")}
      `,
    });
    return;
  }

  await sendEmail({
    to: input.agencyEmail,
    subject: "Mise à jour de votre dossier — MaghrebVoyage",
    title: "Mise à jour dossier",
    html: `
      <p>Le statut de l'agence <strong>${input.agencyName}</strong> a été mis à jour : ${input.status}.</p>
      ${input.note ? `<p>Motif : ${input.note}</p>` : ""}
      <p>Contact : contact@maghrebvoyage.com</p>
    `,
  });
}
