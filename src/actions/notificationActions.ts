"use server";

import { revalidatePath } from "next/cache";
import {
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/lib/notifications";

export async function markNotificationAsReadAction(formData: FormData) {
  const notificationId = formData.get("notificationId");

  if (typeof notificationId !== "string" || !notificationId.trim()) {
    return;
  }

  await markNotificationAsRead(notificationId);
  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/notifications");
}

export async function markAllNotificationsAsReadAction() {
  await markAllNotificationsAsRead();
  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/notifications");
}
