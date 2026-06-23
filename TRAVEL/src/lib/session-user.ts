import type { Session } from "next-auth";
import prisma from "@/lib/prisma";

/** Returns user id only if the session user still exists in the database. */
export async function resolveSessionUserId(
  session: Session | null
): Promise<string | undefined> {
  const id = session?.user?.id;
  if (!id) return undefined;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true },
  });
  return user?.id;
}
