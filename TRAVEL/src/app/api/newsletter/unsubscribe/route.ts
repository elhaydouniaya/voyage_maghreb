import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

function normalizeEmail(raw: unknown) {
  const email = String(raw || "")
    .trim()
    .toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

async function unsubscribeEmail(email: string) {
  await prisma.newsletterSubscriber.deleteMany({ where: { email } });
}

/** One-click unsubscribe from welcome emails (?email=). */
export async function GET(req: Request) {
  const ip = getClientIp(req);
  const limited = rateLimit(`newsletter-unsub:${ip}`, 20, 60 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez plus tard." },
      { status: 429 }
    );
  }

  const email = normalizeEmail(new URL(req.url).searchParams.get("email"));
  if (!email) {
    return NextResponse.json({ error: "Email invalide." }, { status: 400 });
  }

  try {
    await unsubscribeEmail(email);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("GET /api/newsletter/unsubscribe", error);
    return NextResponse.json(
      { error: "Désinscription impossible pour le moment." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const limited = rateLimit(`newsletter-unsub:${ip}`, 10, 60 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez plus tard." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const email = normalizeEmail(body.email);
    if (!email) {
      return NextResponse.json({ error: "Email invalide." }, { status: 400 });
    }

    await unsubscribeEmail(email);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/newsletter/unsubscribe", error);
    return NextResponse.json(
      { error: "Désinscription impossible pour le moment." },
      { status: 500 }
    );
  }
}
