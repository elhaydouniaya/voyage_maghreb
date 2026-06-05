import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { emailButton } from "@/lib/email-template";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

const baseUrl = () => process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const limited = rateLimit(`newsletter:${ip}`, 5, 60 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez plus tard." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const email = String(body.email || "")
      .trim()
      .toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Email invalide." }, { status: 400 });
    }

    const source = String(body.source || "homepage").slice(0, 40);

    await prisma.newsletterSubscriber.upsert({
      where: { email },
      create: { email, source },
      update: { source },
    });

    await sendEmail({
      to: email,
      subject: "Bienvenue dans l'aventure MaghrebVoyage",
      title: "Newsletter",
      html: `
        <p>Merci pour votre inscription !</p>
        <p>Vous recevrez nos meilleurs itinéraires et offres au Maghreb.</p>
        ${emailButton(`${baseUrl()}/voyages`, "Découvrir les voyages")}
        ${emailButton(`${baseUrl()}/recherche`, "Configurer mon voyage avec l'IA")}
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/newsletter/subscribe", error);
    return NextResponse.json(
      { error: "Inscription impossible pour le moment." },
      { status: 500 }
    );
  }
}
