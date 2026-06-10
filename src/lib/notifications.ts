import { NotificationType, Prisma, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";

type NotificationDbClient = Prisma.TransactionClient | typeof prisma;

export type NotificationPayload = {
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  href?: string | null;
  metadata?: Prisma.InputJsonValue | null;
};

export type NotificationListItem = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  href: string | null;
  readAt: Date | null;
  createdAt: Date;
  metadata: Prisma.JsonValue | null;
};

async function createNotifications(
  db: NotificationDbClient,
  notifications: NotificationPayload[],
) {
  if (!notifications.length) {
    return { count: 0 };
  }

  const uniqueNotifications = new Map<string, NotificationPayload>();

  for (const notification of notifications) {
    const key = [
      notification.recipientId,
      notification.type,
      notification.title,
      notification.message,
      notification.href ?? "",
    ].join("::");

    if (!uniqueNotifications.has(key)) {
      uniqueNotifications.set(key, notification);
    }
  }

  return db.notification.createMany({
    data: Array.from(uniqueNotifications.values()).map((notification) => ({
      recipientId: notification.recipientId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      href: notification.href ?? null,
      metadata: notification.metadata ?? undefined,
    })),
  });
}

export async function createNotification(
  db: NotificationDbClient,
  notification: NotificationPayload,
) {
  return db.notification.create({
    data: {
      recipientId: notification.recipientId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      href: notification.href ?? null,
      metadata: notification.metadata ?? undefined,
    },
  });
}

export async function createNotificationsForAdmins(
  db: NotificationDbClient,
  notification: Omit<NotificationPayload, "recipientId"> & {
    excludeRecipientIds?: string[];
  },
) {
  const admins = await db.user.findMany({
    where: {
      role: UserRole.ADMIN,
      isActive: true,
      ...(notification.excludeRecipientIds?.length
        ? {
            id: {
              notIn: notification.excludeRecipientIds,
            },
          }
        : {}),
    },
    select: {
      id: true,
    },
  });

  return createNotifications(
    db,
    admins.map((admin) => ({
      recipientId: admin.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      href: notification.href ?? null,
      metadata: notification.metadata ?? null,
    })),
  );
}

export async function createNotificationsForRecipients(
  db: NotificationDbClient,
  recipientIds: string[],
  notification: Omit<NotificationPayload, "recipientId">,
) {
  return createNotifications(
    db,
    recipientIds.map((recipientId) => ({
      recipientId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      href: notification.href ?? null,
      metadata: notification.metadata ?? null,
    })),
  );
}

export async function getNotificationsForUser(
  db: NotificationDbClient,
  recipientId: string,
  limit = 50,
): Promise<NotificationListItem[]> {
  const notifications = await db.notification.findMany({
    where: {
      recipientId,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
    select: {
      id: true,
      type: true,
      title: true,
      message: true,
      href: true,
      readAt: true,
      createdAt: true,
      metadata: true,
    },
  });

  return notifications;
}

export async function getNotificationsForCurrentUser(limit = 50) {
  const actor = await requireAuth("/dashboard/notifications");
  return getNotificationsForUser(prisma, actor.id, limit);
}

export async function getUnreadNotificationCountForUser(
  db: NotificationDbClient,
  recipientId: string,
) {
  return db.notification.count({
    where: {
      recipientId,
      readAt: null,
    },
  });
}

export async function getUnreadNotificationCount() {
  const actor = await requireAuth("/dashboard");
  return getUnreadNotificationCountForUser(prisma, actor.id);
}

export async function markNotificationAsReadForUser(
  db: NotificationDbClient,
  notificationId: string,
  recipientId: string,
) {
  return db.notification.updateMany({
    where: {
      id: notificationId,
      recipientId,
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  });
}

export async function markNotificationAsRead(notificationId: string) {
  const actor = await requireAuth("/dashboard/notifications");
  return markNotificationAsReadForUser(prisma, notificationId, actor.id);
}

export async function markAllNotificationsAsReadForUser(
  db: NotificationDbClient,
  recipientId: string,
) {
  return db.notification.updateMany({
    where: {
      recipientId,
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  });
}

export async function markAllNotificationsAsRead() {
  const actor = await requireAuth("/dashboard/notifications");
  return markAllNotificationsAsReadForUser(prisma, actor.id);
}
