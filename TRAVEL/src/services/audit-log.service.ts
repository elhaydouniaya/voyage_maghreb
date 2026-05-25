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
}
