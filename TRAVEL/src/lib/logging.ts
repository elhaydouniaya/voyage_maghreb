import prisma from "./prisma";

/**
 * Logs a system action to the AuditLog table for tracking and transparency.
 * Standardizes how we record administrative and agency-level events.
 */
export async function logAction(
  actorUserId: string | null,
  entityType: "TravelRequest" | "Offer" | "Agency" | "Payment",
  entityId: string,
  action: "CREATE" | "UPDATE" | "DELETE" | "STATUS_CHANGE" | "ASSIGN" | "MATCH" | "PAYMENT_SUCCESS",
  metadata?: Record<string, unknown>
) {
  try {
    const detailsObj = {
      entityType,
      entityId,
      metadata
    };
    
    await prisma.auditLog.create({
      data: {
        action,
        userId: actorUserId,
        details: JSON.stringify(detailsObj),
      },
    });
  } catch (error) {
    console.warn("Failed to create audit log (non-blocking):", error);
  }
}
