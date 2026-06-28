import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Editable preference keys and their defaults (mirrors the Prisma model). */
const PREFERENCE_DEFAULTS = {
  bookingUpdates: true,
  promotions: false,
  newsletter: false,
  smsReminders: false,
} as const;

type PreferenceKey = keyof typeof PREFERENCE_DEFAULTS;
const PREFERENCE_KEYS = Object.keys(PREFERENCE_DEFAULTS) as PreferenceKey[];

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  const prefs = await prisma.notificationPreferences.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json({
    preferences: prefs
      ? {
          bookingUpdates: prefs.bookingUpdates,
          promotions: prefs.promotions,
          newsletter: prefs.newsletter,
          smsReminders: prefs.smsReminders,
        }
      : { ...PREFERENCE_DEFAULTS },
  });
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  // Only accept known boolean keys; ignore anything else.
  const updates: Record<PreferenceKey, boolean> = { ...PREFERENCE_DEFAULTS };
  for (const key of PREFERENCE_KEYS) {
    if (typeof body[key] === "boolean") {
      updates[key] = body[key] as boolean;
    }
  }

  try {
    const prefs = await prisma.notificationPreferences.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id, ...updates },
      update: updates,
    });

    return NextResponse.json({
      preferences: {
        bookingUpdates: prefs.bookingUpdates,
        promotions: prefs.promotions,
        newsletter: prefs.newsletter,
        smsReminders: prefs.smsReminders,
      },
    });
  } catch (error) {
    console.error("PUT /api/user/notifications", error);
    return NextResponse.json({ error: "Mise à jour impossible." }, { status: 500 });
  }
}