import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getSystemIntegrationsStatus, resolveAdminNotifyEmail } from "@/lib/email-config";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès réservé aux administrateurs." }, { status: 403 });
  }

  const integrations = getSystemIntegrationsStatus();
  const adminNotifyEmail = await resolveAdminNotifyEmail();

  return NextResponse.json({
    integrations,
    adminNotifyEmail: adminNotifyEmail ? adminNotifyEmail.replace(/(.{2}).+(@.+)/, "$1***$2") : null,
  });
}
