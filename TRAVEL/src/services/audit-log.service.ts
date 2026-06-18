import prisma from "@/lib/prisma";

export class AuditLogService {
  static async record(
    action: string,
    details: Record<string, unknown>,
    userId?: string | null
  ) {
    try {
      await prisma.auditLog.create({
        data: {
          action,
          userId: userId ?? null,
          details: JSON.stringify(details),
        },
      });
    } catch (e) {
      console.error("AuditLog:", action, e);
    }
  }

  static async listForAdmin(limit = 100) {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const userIds = [...new Set(logs.map((l) => l.userId).filter(Boolean))] as string[];
    const users =
      userIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true, email: true },
          })
        : [];
    const userMap = new Map(users.map((u) => [u.id, u]));

    return logs.map((log) => {
      let details: Record<string, unknown> = {};
      try {
        details = JSON.parse(log.details) as Record<string, unknown>;
      } catch {
        details = { raw: log.details };
      }
      const user = log.userId ? userMap.get(log.userId) : undefined;
      return {
        id: log.id,
        action: log.action,
        userId: log.userId,
        userName: user?.name || null,
        userEmail: user?.email || null,
        details,
        createdAt: log.createdAt.toISOString(),
        date: log.createdAt.toLocaleString("fr-FR"),
      };
    });
  }
}
