import {
  deleteNotificationController,
  getNotificationDetailController,
  listNotificationsByUserController,
  markAllReadController,
  markOneReadController,
} from "../controllers/notification.controller.js";

export default async function notificationRoutes(app) {
  // 1) Get List Notifikasi (by User)
  app.get("/:user_id", listNotificationsByUserController);

  // 2) Get Detail Notifikasi
  app.get("/detail/:id", getNotificationDetailController);

  // 3) Tandai 1 Notifikasi Dibaca
  app.patch("/:id/read", markOneReadController);

  // 4) Tandai Semua Dibaca
  app.patch("/:user_id/read-all", markAllReadController);

  // 5) Hapus Notifikasi (Hard Delete)
  app.delete("/:id", deleteNotificationController);
}

