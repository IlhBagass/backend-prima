import { sql } from "../../../config/db.js";

export const listNotificationsByUserService = async (
  userId,
  { is_read, type, limit = 50, offset = 0 } = {}
) => {
  const safeLimit = Number.isFinite(Number(limit)) ? Math.max(1, Math.min(200, Number(limit))) : 50;
  const safeOffset = Number.isFinite(Number(offset)) ? Math.max(0, Number(offset)) : 0;

  const where = ["user_id = $1"];
  const params = [userId];

  if (typeof is_read === "boolean") {
    params.push(is_read);
    where.push(`is_read = $${params.length}`);
  }

  if (type) {
    params.push(type);
    where.push(`type = $${params.length}`);
  }

  const unreadRows = await sql.query(
    `
      SELECT COUNT(*)::int AS unread_count
      FROM notifications
      WHERE user_id = $1
        AND is_read = false
    `,
    [userId]
  );
  const unread_count = unreadRows[0]?.unread_count ?? 0;

  params.push(safeLimit);
  const limitParam = `$${params.length}`;
  params.push(safeOffset);
  const offsetParam = `$${params.length}`;

  const notifications = await sql.query(
    `
      SELECT id, user_id, type, title, message, data, is_read, read_at, created_at
      FROM notifications
      WHERE ${where.join(" AND ")}
      ORDER BY created_at DESC
      LIMIT ${limitParam}
      OFFSET ${offsetParam}
    `,
    params
  );

  return { unread_count, notifications };
};

export const getNotificationByIdService = async (id) => {
  const rows = await sql.query(
    `
      SELECT id, user_id, type, title, message, data, is_read, read_at, created_at
      FROM notifications
      WHERE id = $1
      LIMIT 1
    `,
    [id]
  );
  return rows[0] || null;
};

export const markNotificationReadByIdService = async (id) => {
  const rows = await sql.query(
    `
      UPDATE notifications
      SET is_read = true,
          read_at = CASE WHEN read_at IS NULL THEN CURRENT_TIMESTAMP ELSE read_at END
      WHERE id = $1
      RETURNING id, user_id, type, title, message, data, is_read, read_at, created_at
    `,
    [id]
  );
  return rows[0] || null;
};

export const markAllNotificationsReadByUserService = async (userId) => {
  const rows = await sql.query(
    `
      UPDATE notifications
      SET is_read = true,
          read_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
        AND is_read = false
      RETURNING id
    `,
    [userId]
  );

  return { updated_count: rows.length };
};

export const deleteNotificationByIdService = async (id) => {
  const rows = await sql.query(
    `
      DELETE FROM notifications
      WHERE id = $1
      RETURNING id, user_id, type, title, is_read, created_at
    `,
    [id]
  );
  return rows[0] || null;
};

