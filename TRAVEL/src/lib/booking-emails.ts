import { sendEmail } from "@/lib/email";
import { emailButton } from "@/lib/email-template";
import { resolveAdminNotifyEmail } from "@/lib/email-config";

const baseUrl = () => process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function sendWelcomeClientEmail(input: {
  to: string;
  firstName: string;
}) {
  await sendEmail({
    to: input.to,
    subject: "Bienvenue sur MaghrebVoyage",
    title: "Bienvenue",
    html: `
      <p>Bonjour ${input.firstName},</p>
      <p>Votre compte voyageur est actif. Découvrez le Maghreb :</p>
      <ul>
        <li>Catalogue des voyages</li>
        <li>Recherche IA personnalisée</li>
        <li>Réservation en ligne</li>
      </ul>
      ${emailButton(`${baseUrl()}/voyages`, "Explorer les voyages")}
      ${emailButton(`${baseUrl()}/recherche`, "Lancer la recherche IA")}
    `,
  });
}

export async function sendTravelRequestReceivedEmail(input: {
  to: string;
  clientName: string;
  destination: string;
  summary?: string;
  travelRequestId?: string;
}) {
  const voyagesUrl = input.travelRequestId
    ? `${baseUrl()}/voyages?matched=true&request=${encodeURIComponent(input.travelRequestId)}`
    : `${baseUrl()}/voyages?matched=true`;

  await sendEmail({
    to: input.to,
    subject: "Votre demande est bien reçue — MaghrebVoyage",
    title: "Demande reçue",
    html: `
      <p>Bonjour ${input.clientName},</p>
      <p>Nous avons bien reçu votre demande de voyage${input.destination ? ` vers <strong>${input.destination}</strong>` : ""}.</p>
      ${input.summary ? `<p><em>${input.summary}</em></p>` : ""}
      <p>Notre moteur IA a analysé vos critères.</p>
      ${emailButton(voyagesUrl, "Voir les voyages recommandés")}
    `,
  });
}

export async function sendBookingConfirmationEmail(input: {
  to: string;
  clientName: string;
  confirmationCode: string;
  tripTitle: string;
  destination: string;
  startDate: string;
  endDate: string;
  depositPaid: number;
  totalAmount: number;
  remainingOnSite: number;
  agencyName: string;
  agencyEmail: string;
  agencyPhone: string;
  meetingPoint?: string | null;
  cancellationToken: string;
}) {
  const cancelUrl = `${baseUrl()}/booking/cancel?token=${encodeURIComponent(input.cancellationToken)}`;
  const receiptUrl = `${baseUrl()}/booking/receipt/${encodeURIComponent(input.confirmationCode)}`;

  await sendEmail({
    to: input.to,
    subject: `Réservation confirmée — ${input.tripTitle}`,
    title: "Réservation confirmée",
    html: `
      <p>Bonjour ${input.clientName},</p>
      <p style="font-size:28px;font-weight:bold;letter-spacing:2px">${input.confirmationCode}</p>
      <p>Votre réservation est confirmée.</p>
      <ul>
        <li><strong>Voyage :</strong> ${input.tripTitle}</li>
        <li><strong>Destination :</strong> ${input.destination}</li>
        <li><strong>Dates :</strong> ${input.startDate} — ${input.endDate}</li>
        <li><strong>Acompte payé :</strong> ${input.depositPaid}€</li>
        <li><strong>Reste à régler sur place :</strong> ${input.remainingOnSite}€</li>
        ${input.meetingPoint ? `<li><strong>Point de rendez-vous :</strong> ${input.meetingPoint}</li>` : ""}
      </ul>
      <p><strong>Agence :</strong> ${input.agencyName}<br/>
      Email : ${input.agencyEmail}<br/>
      Tél : ${input.agencyPhone}</p>
      ${emailButton(receiptUrl, "Voir mon reçu")}
      <p><a href="${cancelUrl}" style="color:#f97316">Annuler ma réservation</a></p>
    `,
  });
}

export async function sendAgencyNewBookingEmail(input: {
  to: string;
  agencyName: string;
  tripTitle: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string | null;
  numberOfSeats: number;
  depositPaid: number;
  confirmationCode: string;
}) {
  await sendEmail({
    to: input.to,
    subject: `Nouvelle réservation — ${input.tripTitle}`,
    html: `
      <p>Bonjour ${input.agencyName},</p>
      <p>Nouvelle réservation sur <strong>${input.tripTitle}</strong>.</p>
      <ul>
        <li><strong>Client :</strong> ${input.clientName}</li>
        <li><strong>Email :</strong> ${input.clientEmail}</li>
        ${input.clientPhone ? `<li><strong>Tél :</strong> ${input.clientPhone}</li>` : ""}
        <li><strong>Places :</strong> ${input.numberOfSeats}</li>
        <li><strong>Acompte :</strong> ${input.depositPaid}€</li>
        <li><strong>Code :</strong> ${input.confirmationCode}</li>
      </ul>
      <p><a href="${baseUrl()}/agency/bookings">Voir mes réservations</a></p>
    `,
  });
}

export async function sendClientCancellationEmail(input: {
  to: string;
  clientName: string;
  tripTitle: string;
  confirmationCode: string;
}) {
  await sendEmail({
    to: input.to,
    subject: `Annulation confirmée — ${input.tripTitle}`,
    html: `
      <p>Bonjour ${input.clientName},</p>
      <p>Votre annulation pour <strong>${input.tripTitle}</strong> (${input.confirmationCode}) est confirmée.</p>
      <p>Le remboursement de votre acompte sera traité dans les meilleurs délais.</p>
    `,
  });
}

export async function sendAgencyClientCancelledEmail(input: {
  to: string;
  agencyName: string;
  tripTitle: string;
  clientName: string;
  confirmationCode: string;
}) {
  await sendEmail({
    to: input.to,
    subject: `Annulation client — ${input.tripTitle}`,
    html: `
      <p>Bonjour ${input.agencyName},</p>
      <p>Un client a annulé sa réservation sur <strong>${input.tripTitle}</strong>.</p>
      <ul>
        <li><strong>Client :</strong> ${input.clientName}</li>
        <li><strong>Code :</strong> ${input.confirmationCode}</li>
      </ul>
      <p><a href="${baseUrl()}/agency/bookings">Mes réservations</a></p>
    `,
  });
}

export async function sendTripCancelledToClientEmail(input: {
  to: string;
  clientName: string;
  tripTitle: string;
  cancelReason?: string | null;
}) {
  await sendEmail({
    to: input.to,
    subject: `Votre voyage a été annulé — ${input.tripTitle}`,
    html: `
      <p>Bonjour ${input.clientName},</p>
      <p>Votre voyage <strong>${input.tripTitle}</strong> a été annulé par l'agence organisatrice.</p>
      ${input.cancelReason ? `<p>Motif : ${input.cancelReason}</p>` : ""}
      <p>Vous serez remboursé de votre acompte dans les meilleurs délais.</p>
    `,
  });
}

export async function sendPreTripReminderEmail(input: {
  to: string;
  clientName: string;
  tripTitle: string;
  destination: string;
  startDate: string;
  meetingPoint?: string | null;
  agencyName: string;
  agencyPhone: string;
}) {
  await sendEmail({
    to: input.to,
    subject: `Rappel — votre voyage ${input.tripTitle} dans 7 jours`,
    html: `
      <p>Bonjour ${input.clientName},</p>
      <p>Votre départ pour <strong>${input.tripTitle}</strong> (${input.destination}) approche : <strong>${input.startDate}</strong>.</p>
      ${input.meetingPoint ? `<p><strong>Point de rendez-vous :</strong> ${input.meetingPoint}</p>` : ""}
      <p><strong>Organisateur :</strong> ${input.agencyName} — ${input.agencyPhone}</p>
      <p>Pensez à régler le solde restant sur place selon les conditions de l'agence.</p>
      <p>Bon voyage !</p>
    `,
  });
}

/** E10 — Admin : remboursement à traiter après annulation client. */
export async function sendAdminRefundPendingEmail(input: {
  tripTitle: string;
  clientName: string;
  confirmationCode: string;
  amount: number;
}) {
  const adminEmail = await resolveAdminNotifyEmail();
  if (!adminEmail) return;

  await sendEmail({
    to: adminEmail,
    subject: `Remboursement à traiter — ${input.confirmationCode}`,
    title: "Remboursement en attente",
    html: `
      <p>Un client a annulé sa réservation. Traitez le remboursement Stripe puis marquez la réservation comme remboursée.</p>
      <ul>
        <li><strong>Voyage :</strong> ${input.tripTitle}</li>
        <li><strong>Client :</strong> ${input.clientName}</li>
        <li><strong>Code :</strong> ${input.confirmationCode}</li>
        <li><strong>Acompte :</strong> ${input.amount}€</li>
      </ul>
      ${emailButton(`${baseUrl()}/admin/bookings`, "Ouvrir les réservations")}
    `,
  });
}

/** E12 — Admin : voyage annulé par l'agence (liste clients à rembourser). */
export async function sendAdminTripCancelledEmail(input: {
  tripTitle: string;
  agencyName: string;
  cancelReason: string;
  clientCount: number;
}) {
  const adminEmail = await resolveAdminNotifyEmail();
  if (!adminEmail) return;

  await sendEmail({
    to: adminEmail,
    subject: `Voyage annulé — ${input.tripTitle}`,
    title: "Annulation voyage agence",
    html: `
      <p>L'agence <strong>${input.agencyName}</strong> a annulé le voyage <strong>${input.tripTitle}</strong>.</p>
      <p><strong>Motif :</strong> ${input.cancelReason}</p>
      <p><strong>${input.clientCount}</strong> réservation(s) confirmée(s) à rembourser.</p>
      ${emailButton(`${baseUrl()}/admin/bookings`, "Gérer les remboursements")}
    `,
  });
}

export async function sendRefundProcessedEmail(input: {
  to: string;
  clientName: string;
  confirmationCode: string;
  tripTitle: string;
  amount: number;
  stripeProcessed: boolean;
}) {
  await sendEmail({
    to: input.to,
    subject: `Remboursement ${input.confirmationCode} — MaghrebVoyage`,
    html: `
      <p>Bonjour ${input.clientName},</p>
      <p>Votre remboursement pour <strong>${input.tripTitle}</strong> a été traité.</p>
      <ul>
        <li><strong>Code :</strong> ${input.confirmationCode}</li>
        <li><strong>Montant :</strong> ${input.amount}€</li>
        <li><strong>Stripe :</strong> ${input.stripeProcessed ? "Remboursement automatique" : "Traitement manuel (5–10 jours ouvrés)"}</li>
      </ul>
    `,
  });
}
