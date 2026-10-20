import { prisma } from "@/lib/db";

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { userId, isRead: false },
  });
}

export async function getUserNotifications(userId: string, limit = 20) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { branch: { select: { name: true } } },
  });
}

export async function markNotificationRead(notificationId: string, userId: string) {
  return prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true },
  });
}

export async function markAllNotificationsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}

export async function createNotification(data: {
  orgId: string;
  branchId?: string;
  userId: string;
  title: string;
  message: string;
  type: "LOW_STOCK" | "OUT_OF_STOCK" | "EXPIRY" | "APPROVAL" | "TRANSFER" | "REFUND" | "SYSTEM" | "ORDER";
  link?: string;
}) {
  return prisma.notification.create({ data });
}
