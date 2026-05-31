const NotificationModel = require("../models/notification.model");

const notificationController = {
  async getMyNotifications(req, res) {
    try {
      const userId = req.user.id;
      const data = await NotificationModel.getByUserId(userId);

      return res.json({
        message: "Get notifications successfully",
        data,
      });
    } catch (error) {
      console.error("Get notifications error:", error);

      return res.status(500).json({
        message: error.message || "Server error",
      });
    }
  },

  async getUnreadCount(req, res) {
    try {
      const userId = req.user.id;
      const count = await NotificationModel.getUnreadCount(userId);

      return res.json({
        message: "Get unread count successfully",
        data: {
          count,
        },
      });
    } catch (error) {
      console.error("Get unread count error:", error);

      return res.status(500).json({
        message: error.message || "Server error",
      });
    }
  },

  async markAsRead(req, res) {
    try {
      const userId = req.user.id;
      const notificationId = Number(req.params.id);

      if (!Number.isInteger(notificationId) || notificationId <= 0) {
        return res.status(400).json({
          message: "Notification ID không hợp lệ",
        });
      }

      const result = await NotificationModel.markAsRead(userId, notificationId);

      if (result.rowCount === 0) {
        return res.status(404).json({
          message: "Không tìm thấy thông báo",
        });
      }

      return res.json({
        message: "Mark notification as read successfully",
      });
    } catch (error) {
      console.error("Mark notification as read error:", error);

      return res.status(500).json({
        message: error.message || "Server error",
      });
    }
  },

  async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;

      await NotificationModel.markAllAsRead(userId);

      return res.json({
        message: "Mark all notifications as read successfully",
      });
    } catch (error) {
      console.error("Mark all notifications as read error:", error);

      return res.status(500).json({
        message: error.message || "Server error",
      });
    }
  },
};

module.exports = notificationController;
