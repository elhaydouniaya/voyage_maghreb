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
