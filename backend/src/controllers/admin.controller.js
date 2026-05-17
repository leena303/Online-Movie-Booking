const bcrypt = require("bcryptjs");
const AdminModel = require("../models/admin.model");

function sendError(res, error, fallbackMessage) {
  console.error(fallbackMessage, error);

  return res.status(error.status || 500).json({
    message: error.message || "Server error",
  });
}

function validatePassword(password) {
  if (!password || !password.trim()) {
    return "Vui lòng nhập mật khẩu mới";
  }

  if (password.length < 8) {
    return "Mật khẩu mới phải có ít nhất 8 ký tự";
  }

  if (!/[A-Z]/.test(password)) {
    return "Mật khẩu mới phải có ít nhất 1 chữ hoa";
  }

  if (!/[a-z]/.test(password)) {
    return "Mật khẩu mới phải có ít nhất 1 chữ thường";
  }

  if (!/[0-9]/.test(password)) {
    return "Mật khẩu mới phải có ít nhất 1 số";
  }

  if (!/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\;/`~]/.test(password)) {
    return "Mật khẩu mới phải có ít nhất 1 ký tự đặc biệt";
  }

  return "";
}

const adminController = {
  // ================= ADMIN PROFILE =================
  async getAdminProfile(req, res) {
    try {
      const adminId = req.user.id;

      const admin = await AdminModel.getAdminProfileById(adminId);

      if (!admin) {
        return res.status(404).json({
          message: "Không tìm thấy tài khoản Admin",
        });
      }

      return res.json({
        message: "Get admin profile successfully",
        user: admin,
      });
    } catch (error) {
      return sendError(res, error, "Get admin profile error:");
    }
  },

  async updateAdminProfile(req, res) {
    try {
      const adminId = req.user.id;
      const { name, phone, address } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({
          message: "Vui lòng nhập họ tên Admin",
        });
      }

      if (phone && !/^(0|\+84)[0-9]{9,10}$/.test(phone.trim())) {
        return res.status(400).json({
          message: "Số điện thoại không hợp lệ",
        });
      }

      const result = await AdminModel.updateAdminProfile(adminId, {
        name: name.trim(),
        phone: phone ? phone.trim() : "",
        address: address ? address.trim() : "",
      });

      if (result.rowCount === 0) {
        return res.status(404).json({
          message: "Không tìm thấy tài khoản Admin để cập nhật",
        });
      }

      const updatedAdmin = await AdminModel.getAdminProfileById(adminId);

      return res.json({
        message: "Cập nhật thông tin Admin thành công",
        user: updatedAdmin,
      });
    } catch (error) {
      return sendError(res, error, "Update admin profile error:");
    }
  },

  async changeAdminPassword(req, res) {
    try {
      const adminId = req.user.id;
      const { oldPassword, newPassword } = req.body;

      if (!oldPassword || !oldPassword.trim()) {
        return res.status(400).json({
          message: "Vui lòng nhập mật khẩu cũ",
        });
      }

      const passwordError = validatePassword(newPassword);

      if (passwordError) {
        return res.status(400).json({
          message: passwordError,
        });
      }

      if (oldPassword === newPassword) {
        return res.status(400).json({
          message: "Mật khẩu mới không được trùng mật khẩu cũ",
        });
      }

      const admin = await AdminModel.getAdminPasswordById(adminId);

      if (!admin) {
        return res.status(404).json({
          message: "Không tìm thấy tài khoản Admin",
        });
      }

      const isMatch = await bcrypt.compare(oldPassword, admin.password_hash);

      if (!isMatch) {
        return res.status(400).json({
          message: "Mật khẩu cũ không chính xác",
        });
      }

      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      const result = await AdminModel.updateAdminPassword(
        adminId,
        newPasswordHash,
      );

      if (result.rowCount === 0) {
        return res.status(404).json({
          message: "Không thể cập nhật mật khẩu Admin",
        });
      }

      return res.json({
        message: "Đổi mật khẩu Admin thành công",
      });
    } catch (error) {
      return sendError(res, error, "Change admin password error:");
    }
  },

  // ================= MOVIES =================
  async getAllMoviesAdmin(req, res) {
    try {
      const data = await AdminModel.getAllMovies();

      return res.json({
        message: "Get movies successfully",
        data,
      });
    } catch (error) {
      return sendError(res, error, "Get movies admin error:");
    }
  },

  async createMovie(req, res) {
    try {
      const result = await AdminModel.createMovie(req.body);

      return res.status(201).json({
        message: "Create movie successfully",
        insertId: result.insertId,
      });
    } catch (error) {
      return sendError(res, error, "Create movie error:");
    }
  },

  async updateMovie(req, res) {
    try {
      const result = await AdminModel.updateMovie(req.params.id, req.body);

      if (result.rowCount === 0) {
        return res.status(404).json({
          message: "Không tìm thấy phim để cập nhật",
        });
      }

      return res.json({
        message: "Update movie successfully",
      });
    } catch (error) {
      return sendError(res, error, "Update movie error:");
    }
  },

  async deleteMovie(req, res) {
    try {
      const result = await AdminModel.deleteMovie(req.params.id);

      if (result.rowCount === 0) {
        return res.status(404).json({
          message: "Không tìm thấy phim để xóa",
        });
      }

      return res.json({
        message: "Delete movie successfully",
      });
    } catch (error) {
      return sendError(res, error, "Delete movie error:");
    }
  },

  // ================= SHOWTIMES =================
  async getAllShowtimesAdmin(req, res) {
    try {
      const data = await AdminModel.getAllShowtimes();

      return res.json({
        message: "Get showtimes successfully",
        data,
      });
    } catch (error) {
      return sendError(res, error, "Get showtimes error:");
    }
  },

  async createShowtime(req, res) {
    try {
      const { movie_id, room_id, start_time, price, subtitle } = req.body;

      if (!movie_id || !room_id || !start_time) {
        return res.status(400).json({
          message: "movie_id, room_id và start_time là bắt buộc",
        });
      }

      const result = await AdminModel.createShowtime({
        movie_id,
        room_id,
        start_time,
        price,
        subtitle,
      });

      return res.status(201).json({
        message: "Create showtime successfully",
        insertId: result.insertId,
      });
    } catch (error) {
      return sendError(res, error, "Create showtime error:");
    }
  },

  async updateShowtime(req, res) {
    try {
      const { movie_id, room_id, start_time, price, subtitle } = req.body;

      if (!movie_id || !room_id || !start_time) {
        return res.status(400).json({
          message: "movie_id, room_id và start_time là bắt buộc",
        });
      }

      const result = await AdminModel.updateShowtime(req.params.id, {
        movie_id,
        room_id,
        start_time,
        price,
        subtitle,
      });

      if (result.rowCount === 0) {
        return res.status(404).json({
          message: "Không tìm thấy suất chiếu để cập nhật",
        });
      }

      return res.json({
        message: "Update showtime successfully",
      });
    } catch (error) {
      return sendError(res, error, "Update showtime error:");
    }
  },

  async deleteShowtime(req, res) {
    try {
      const result = await AdminModel.deleteShowtime(req.params.id);

      if (result.rowCount === 0) {
        return res.status(404).json({
          message: "Không tìm thấy suất chiếu để xóa",
        });
      }

      return res.json({
        message: "Delete showtime successfully",
      });
    } catch (error) {
      return sendError(res, error, "Delete showtime error:");
    }
  },

  // ================= ROOMS =================
  async getAllRooms(req, res) {
    try {
      const data = await AdminModel.getAllRooms();

      return res.json({
        message: "Get rooms successfully",
        data,
      });
    } catch (error) {
      return sendError(res, error, "Get rooms error:");
    }
  },

  async createRoom(req, res) {
    try {
      const result = await AdminModel.createRoom(req.body);

      return res.status(201).json({
        message: "Create room successfully",
        insertId: result.insertId,
      });
    } catch (error) {
      return sendError(res, error, "Create room error:");
    }
  },

  async updateRoom(req, res) {
    try {
      const result = await AdminModel.updateRoom(req.params.id, req.body);

      if (result.rowCount === 0) {
        return res.status(404).json({
          message: "Không tìm thấy phòng để cập nhật",
        });
      }

      return res.json({
        message: "Update room successfully",
      });
    } catch (error) {
      return sendError(res, error, "Update room error:");
    }
  },

  async deleteRoom(req, res) {
    try {
      const result = await AdminModel.deleteRoom(req.params.id);

      if (result.rowCount === 0) {
        return res.status(404).json({
          message: "Không tìm thấy phòng để xóa",
        });
      }

      return res.json({
        message: "Delete room successfully",
      });
    } catch (error) {
      return sendError(res, error, "Delete room error:");
    }
  },

  // ================= SEATS =================
  async getSeatsByRoom(req, res) {
    try {
      const data = await AdminModel.getSeatsByRoom(req.params.roomId);

      return res.json({
        message: "Get seats successfully",
        data,
      });
    } catch (error) {
      return sendError(res, error, "Get seats error:");
    }
  },

  async createSeat(req, res) {
    try {
      const result = await AdminModel.createSeat(req.params.roomId, req.body);

      return res.status(201).json({
        message: "Create seat successfully",
        insertId: result.insertId,
      });
    } catch (error) {
      return sendError(res, error, "Create seat error:");
    }
  },

  async updateSeat(req, res) {
    try {
      const result = await AdminModel.updateSeat(req.params.id, req.body);

      if (result.rowCount === 0) {
        return res.status(404).json({
          message: "Không tìm thấy ghế để cập nhật",
        });
      }

      return res.json({
        message: "Update seat successfully",
      });
    } catch (error) {
      return sendError(res, error, "Update seat error:");
    }
  },

  async deleteSeat(req, res) {
    try {
      const result = await AdminModel.deleteSeat(req.params.id);

      if (result.rowCount === 0) {
        return res.status(404).json({
          message: "Không tìm thấy ghế để xóa",
        });
      }

      return res.json({
        message: "Delete seat successfully",
      });
    } catch (error) {
      return sendError(res, error, "Delete seat error:");
    }
  },

  // ================= USERS =================
  async getAllUsers(req, res) {
    try {
      const data = await AdminModel.getAllUsers();

      return res.json({
        message: "Get users successfully",
        data,
      });
    } catch (error) {
      return sendError(res, error, "Get users error:");
    }
  },

  async createUser(req, res) {
    try {
      const { name, email, password, phone, address, role } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({
          message: "Vui lòng nhập họ tên",
        });
      }

      if (!email || !email.trim()) {
        return res.status(400).json({
          message: "Vui lòng nhập email",
        });
      }

      if (!password || !password.trim()) {
        return res.status(400).json({
          message: "Vui lòng nhập mật khẩu",
        });
      }

      const password_hash = await bcrypt.hash(password, 10);

      const result = await AdminModel.createUser({
        name: name.trim(),
        email: email.trim(),
        password_hash,
        phone: phone ? phone.trim() : "",
        address: address ? address.trim() : "",
        role: role || "user",
      });

      return res.status(201).json({
        message: "Create user successfully",
        insertId: result.insertId,
      });
    } catch (error) {
      return sendError(res, error, "Create user error:");
    }
  },

  async updateUser(req, res) {
    try {
      const result = await AdminModel.updateUser(req.params.id, req.body);

      if (result.rowCount === 0) {
        return res.status(404).json({
          message: "Không tìm thấy user để cập nhật",
        });
      }

      return res.json({
        message: "Update user successfully",
      });
    } catch (error) {
      return sendError(res, error, "Update user error:");
    }
  },

  async updateUserRole(req, res) {
    try {
      const { role } = req.body;

      if (!role) {
        return res.status(400).json({
          message: "Role là bắt buộc",
        });
      }

      const result = await AdminModel.updateUserRole(req.params.id, role);

      if (result.rowCount === 0) {
        return res.status(404).json({
          message: "Không tìm thấy user để cập nhật role",
        });
      }

      return res.json({
        message: "Update user role successfully",
      });
    } catch (error) {
      return sendError(res, error, "Update user role error:");
    }
  },

  async deleteUser(req, res) {
    try {
      const userId = req.params.id;
      const result = await AdminModel.deleteUser(userId);

      if (result.rowCount === 0) {
        return res.status(404).json({
          message: "Không tìm thấy user để xóa",
        });
      }

      return res.json({
        message: "Delete user successfully",
        result,
      });
    } catch (error) {
      return sendError(res, error, "Delete user error:");
    }
  },

  // ================= BOOKINGS =================
  async getAllBookings(req, res) {
    try {
      const data = await AdminModel.getAllBookings();

      return res.json({
        message: "Get bookings successfully",
        data,
      });
    } catch (error) {
      return sendError(res, error, "Get bookings error:");
    }
  },

  async updateBookingStatus(req, res) {
    try {
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          message: "Status là bắt buộc",
        });
      }

      const result = await AdminModel.updateBookingStatus(
        req.params.id,
        status,
      );

      if (result.rowCount === 0) {
        return res.status(404).json({
          message: "Không tìm thấy booking để cập nhật",
        });
      }

      return res.json({
        message: "Update booking status successfully",
      });
    } catch (error) {
      return sendError(res, error, "Update booking status error:");
    }
  },
};

module.exports = adminController;
