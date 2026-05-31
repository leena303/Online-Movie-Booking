const pool = require("../config/db");

const NotificationModel = {
  async create({ userId, bookingId, title, message, type = "booking" }) {
    const result = await pool.query(
      `
      INSERT INTO notifications
      (user_id, booking_id, title, message, type)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [userId, bookingId || null, title, message, type],
    );

    return result.rows[0] || null;
  },

  async getByUserId(userId) {
    const result = await pool.query(
      `
      SELECT 
        id,
        user_id,
        booking_id,
        title,
        message,
        type,
        is_read,
        created_at
      FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 30
      `,
      [userId],
    );

    return result.rows;
  },

  async getUnreadCount(userId) {
    const result = await pool.query(
      `
      SELECT COUNT(*)::int AS count
      FROM notifications
      WHERE user_id = $1
        AND is_read = FALSE
      `,
      [userId],
    );

    return result.rows[0]?.count || 0;
  },

  async markAsRead(userId, notificationId) {
    const result = await pool.query(
      `
      UPDATE notifications
      SET is_read = TRUE
      WHERE id = $1
        AND user_id = $2
      `,
      [notificationId, userId],
    );

    return {
      rowCount: result.rowCount,
    };
  },

  async markAllAsRead(userId) {
    const result = await pool.query(
      `
      UPDATE notifications
      SET is_read = TRUE
      WHERE user_id = $1
        AND is_read = FALSE
      `,
      [userId],
    );

    return {
      rowCount: result.rowCount,
    };
  },
};

module.exports = NotificationModel;
