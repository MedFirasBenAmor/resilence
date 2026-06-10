import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { NotificationType, UserRole } from "@prisma/client";
import {
  createNotificationsForAdmins,
  getNotificationsForUser,
  getUnreadNotificationCountForUser,
  markAllNotificationsAsReadForUser,
  markNotificationAsReadForUser,
} from "@/lib/notifications";

test("application creates admin notifications only for active admins", async () => {
  let capturedWhere: unknown = null;
  let createdPayload: Array<Record<string, unknown>> = [];

  const fakeDb = {
    user: {
      findMany: async ({ where }: { where: unknown }) => {
        capturedWhere = where;
        return [{ id: "admin-1" }, { id: "admin-2" }];
      },
    },
    notification: {
      createMany: async ({ data }: { data: Array<Record<string, unknown>> }) => {
        createdPayload = data;
        return { count: data.length };
      },
    },
  };

  const result = await createNotificationsForAdmins(fakeDb as never, {
    type: NotificationType.APPLICATION_SUBMITTED,
    title: "Nouvelle candidature recue",
    message: "Une candidature vient d'arriver.",
    href: "/dashboard/admin/projects/project-1",
  });

  assert.deepEqual(capturedWhere, {
    role: UserRole.ADMIN,
    isActive: true,
  });
  assert.equal(result.count, 2);
  assert.equal(createdPayload.length, 2);
  assert.equal(createdPayload[0]?.recipientId, "admin-1");
  assert.equal(createdPayload[1]?.recipientId, "admin-2");
});

test("user cannot read another user's notifications", async () => {
  let capturedWhere: unknown = null;

  const fakeDb = {
    notification: {
      findMany: async ({ where }: { where: unknown }) => {
        capturedWhere = where;
        return [];
      },
    },
  };

  await getNotificationsForUser(fakeDb as never, "user-a", 20);

  assert.deepEqual(capturedWhere, {
    recipientId: "user-a",
  });
});

test("mark read works only for the recipient", async () => {
  let updateManyArgs: unknown = null;

  const fakeDb = {
    notification: {
      updateMany: async (args: unknown) => {
        updateManyArgs = args;
        return { count: 1 };
      },
    },
  };

  await markNotificationAsReadForUser(fakeDb as never, "notif-1", "user-a");

  assert.deepEqual((updateManyArgs as { where: unknown }).where, {
    id: "notif-1",
    recipientId: "user-a",
    readAt: null,
  });
  assert.ok((updateManyArgs as { data: { readAt: Date } }).data.readAt instanceof Date);
});

test("mark all notifications as read works only for the recipient", async () => {
  let updateManyArgs: unknown = null;

  const fakeDb = {
    notification: {
      updateMany: async (args: unknown) => {
        updateManyArgs = args;
        return { count: 3 };
      },
    },
  };

  await markAllNotificationsAsReadForUser(fakeDb as never, "user-a");

  assert.deepEqual((updateManyArgs as { where: unknown }).where, {
    recipientId: "user-a",
    readAt: null,
  });
  assert.ok((updateManyArgs as { data: { readAt: Date } }).data.readAt instanceof Date);
});

test("unread count works on unread notifications only", async () => {
  let capturedWhere: unknown = null;

  const fakeDb = {
    notification: {
      count: async ({ where }: { where: unknown }) => {
        capturedWhere = where;
        return 4;
      },
    },
  };

  const count = await getUnreadNotificationCountForUser(fakeDb as never, "user-a");

  assert.equal(count, 4);
  assert.deepEqual(capturedWhere, {
    recipientId: "user-a",
    readAt: null,
  });
});

test("application status change notifies student", async () => {
  const source = await readFile("src/actions/applicationActions.ts", "utf8");

  assert.match(source, /NotificationType\.APPLICATION_STATUS_CHANGED/);
  assert.match(source, /recipientId: application\.student\.userId/);
});

test("deliverable submission notifies supervisor", async () => {
  const source = await readFile("src/actions/projectRoomActions.ts", "utf8");

  assert.match(source, /NotificationType\.DELIVERABLE_SUBMITTED/);
  assert.match(source, /roomScope\.supervisorUserId/);
});

test("feedback creation notifies student", async () => {
  const source = await readFile("src/actions/feedbackActions.ts", "utf8");

  assert.match(source, /NotificationType\.FEEDBACK_CREATED/);
  assert.match(source, /recipientId: membership\.student\.userId/);
});

test("certificate issuance notifies student", async () => {
  const source = await readFile("src/actions/certificateActions.ts", "utf8");

  assert.match(source, /NotificationType\.CERTIFICATE_ISSUED/);
  assert.match(source, /recipientId: student\.user\.id/);
});

test("notifications page and topbar expose the in-app notification UI", async () => {
  const topbarSource = await readFile("src/components/layout/dashboard-topbar.tsx", "utf8");
  const pageSource = await readFile("src/app/dashboard/notifications/page.tsx", "utf8");

  assert.match(topbarSource, /href="\/dashboard\/notifications"/);
  assert.match(pageSource, /Tout marquer comme lu/);
  assert.match(pageSource, /Marquer comme lu/);
});
