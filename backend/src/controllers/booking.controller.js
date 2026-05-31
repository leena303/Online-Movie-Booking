const BookingModel = require("../models/booking.model");
const ShowtimeModel = require("../models/showtime.model");

const bookingController = {
  async getPaymentSummary(req, res) {
    try {
      const { showtimeId, seatIds } = req.query;

      if (!showtimeId) {
        return res.status(400).json({
          message: "showtimeId is required",
        });
      }

      if (!seatIds) {
        return res.status(400).json({
          message: "seatIds is required",
        });
      }

      const parsedSeatIds = String(seatIds)
        .split(",")
        .map((id) => Number(id))
        .filter((id) => Number.isInteger(id) && id > 0);

      if (parsedSeatIds.length === 0) {
        return res.status(400).json({
          message: "seatIds is invalid",
        });
      }

      const summary = await BookingModel.getPaymentSummary(
        Number(showtimeId),
        parsedSeatIds,
      );

      if (!summary) {
        return res.status(404).json({
          message: "Showtime not found",
        });
      }

      if (summary.seats.length !== parsedSeatIds.length) {
        return res.status(400).json({
          message: "Some selected seats do not exist",
        });
      }

      const invalidRoomSeat = summary.seats.some(
        (seat) => Number(seat.room_id) !== Number(summary.room_id),
      );

      if (invalidRoomSeat) {
        return res.status(400).json({
          message: "Some selected seats do not belong to this showtime room",
        });
      }

      const bookedSeatIds = await BookingModel.getBookedSeatIdsByShowtime(
        Number(showtimeId),
      );

      const hasBookedSeat = parsedSeatIds.some((seatId) =>
        bookedSeatIds.includes(seatId),
      );

      if (hasBookedSeat) {
        return res.status(400).json({
          message: "Some selected seats have already been booked",
        });
      }

      return res.json({
        message: "Get payment summary successfully",
        data: {
          showtimeId: summary.showtime_id,
          movieTitle: summary.movie_title,
          startTime: summary.start_time,
          roomName: summary.room_name,
          totalPrice: summary.total_price,
          seats: summary.seats.map((seat) => ({
            id: seat.id,
            seatLabel: `${seat.row_label}${seat.col_number}`,
            type: seat.type,
            price: Number(seat.price),
          })),
        },
      });
    } catch (error) {
      console.error("Get payment summary error:", error);

      return res.status(500).json({
        message: "Server error",
        error: error.message,
      });
    }
  },

  async createBooking(req, res) {
    try {
      const userId = req.user.id;

      if (req.user.role?.toLowerCase() === "admin") {
        return res.status(403).json({
          message: "Admin không được phép đặt vé",
        });
      }
      const {
        showtimeId,
        seatIds,
        name,
        phone,
        email,
        paymentMethod,
        cardNumber,
        paymentVerified,
      } = req.body;

      if (!showtimeId || !Array.isArray(seatIds) || seatIds.length === 0) {
        return res.status(400).json({
          message: "showtimeId and seatIds are required",
        });
      }

      if (!name || !phone || !email) {
        return res.status(400).json({
          message: "Missing customer information",
        });
      }

      const finalPaymentMethod = paymentMethod || "cod";
      const onlinePaymentMethods = ["momo", "vnpay"];

      if (!["cod", "momo", "vnpay"].includes(finalPaymentMethod)) {
        return res.status(400).json({
          message: "Phương thức thanh toán không hợp lệ",
        });
      }

      if (onlinePaymentMethods.includes(finalPaymentMethod)) {
        if (!cardNumber || !String(cardNumber).trim()) {
          return res.status(400).json({
            message: "Vui lòng nhập thông tin thanh toán",
          });
        }

        if (finalPaymentMethod === "momo") {
          const momoPhoneRegex = /^(0|\+84)[0-9]{9,10}$/;

          if (!momoPhoneRegex.test(String(cardNumber).trim())) {
            return res.status(400).json({
              message: "Số điện thoại Momo không hợp lệ",
            });
          }
        }

        if (finalPaymentMethod === "vnpay") {
          const vnpayCodeRegex = /^[A-Za-z0-9_-]{6,30}$/;

          if (!vnpayCodeRegex.test(String(cardNumber).trim())) {
            return res.status(400).json({
              message: "Mã giao dịch VNPay không hợp lệ",
            });
          }
        }

        if (paymentVerified !== true) {
          return res.status(400).json({
            message: "Vui lòng xác minh thanh toán trước khi đặt vé",
          });
        }
      }

      const showtime = await ShowtimeModel.getById(showtimeId);
      if (!showtime) {
        return res.status(404).json({ message: "Showtime not found" });
      }

      const bookedSeatIds =
        await BookingModel.getBookedSeatIdsByShowtime(showtimeId);

      const hasBookedSeat = seatIds.some((seatId) =>
        bookedSeatIds.includes(seatId),
      );

      if (hasBookedSeat) {
        return res.status(400).json({
          message: "Some selected seats have already been booked",
        });
      }

      const selectedSeats = await BookingModel.getSeatsByIds(seatIds);

      if (selectedSeats.length !== seatIds.length) {
        return res.status(400).json({
          message: "Some selected seats do not exist",
        });
      }

      const invalidRoomSeat = selectedSeats.some(
        (seat) => Number(seat.room_id) !== Number(showtime.room_id),
      );

      if (invalidRoomSeat) {
        return res.status(400).json({
          message: "Some selected seats do not belong to this showtime room",
        });
      }

      const seatPrices = selectedSeats.map((seat) => {
        const price = seat.type === "vip" ? 120000 : 90000;
        return {
          seatId: seat.id,
          price,
          ...seat,
        };
      });

      const totalPrice = seatPrices.reduce((sum, s) => sum + s.price, 0);

      const bookingId = await BookingModel.createBooking(
        userId,
        Number(showtimeId),
        totalPrice,
        seatPrices,
        name,
        phone,
        email,
        finalPaymentMethod,
        onlinePaymentMethods.includes(finalPaymentMethod)
          ? String(cardNumber).trim()
          : null,
      );

      return res.status(201).json({
        message: "Booking created successfully",
        data: {
          bookingId,
          totalPrice,
          status: "pending",
          movieTitle: showtime.movie_title || showtime.title || null,
          startTime: showtime.start_time || null,
          roomName: showtime.room_name || null,
          seats: seatPrices.map((seat) => ({
            id: seat.seatId,
            seatLabel: `${seat.row_label}${seat.col_number}`,
            type: seat.type,
            price: seat.price,
          })),
        },
      });
    } catch (error) {
      console.error("Create booking error:", error);
      return res.status(500).json({
        message: "Server error",
        error: error.message,
      });
    }
  },

  async getMyBookings(req, res) {
    try {
      const userId = req.user.id;
      const bookings = await BookingModel.getUserBookings(userId);

      return res.json({
        message: "Get my bookings successfully",
        data: bookings,
      });
    } catch (error) {
      console.error("Get my bookings error:", error);
      return res.status(500).json({
        message: "Server error",
        error: error.message,
      });
    }
  },

  async cancelMyBooking(req, res) {
    try {
      const userId = req.user.id;
      const bookingId = Number(req.params.id);

      if (req.user.role?.toLowerCase() === "admin") {
        return res.status(403).json({
          message: "Admin không được phép hủy vé của user",
        });
      }

      if (!Number.isInteger(bookingId) || bookingId <= 0) {
        return res.status(400).json({
          message: "Mã booking không hợp lệ",
        });
      }

      const booking = await BookingModel.getBookingForCancel(bookingId, userId);

      if (!booking) {
        return res.status(404).json({
          message: "Không tìm thấy vé hoặc vé không thuộc tài khoản của bạn",
        });
      }

      if (booking.status === "cancelled") {
        return res.status(400).json({
          message: "Vé này đã được hủy trước đó",
        });
      }

      if (booking.status === "confirmed") {
        return res.status(400).json({
          message:
            "Vé đã được xác nhận, vui lòng liên hệ rạp để được hỗ trợ hủy vé",
        });
      }

      if (booking.status !== "pending") {
        return res.status(400).json({
          message: "Chỉ có thể hủy vé đang chờ xác nhận",
        });
      }

      const showtimeTime = new Date(booking.start_time).getTime();

      if (Number.isNaN(showtimeTime)) {
        return res.status(400).json({
          message: "Thời gian suất chiếu không hợp lệ",
        });
      }

      if (showtimeTime <= Date.now()) {
        return res.status(400).json({
          message: "Không thể hủy vé vì suất chiếu đã bắt đầu hoặc đã qua",
        });
      }

      const cancelledBooking = await BookingModel.cancelBooking(
        bookingId,
        userId,
      );

      if (!cancelledBooking) {
        return res.status(400).json({
          message:
            "Không thể hủy vé. Vé có thể đã được xác nhận hoặc đã bị hủy",
        });
      }

      return res.json({
        message: "Hủy vé thành công",
        data: cancelledBooking,
      });
    } catch (error) {
      console.error("Cancel booking error:", error);

      return res.status(500).json({
        message: error.message || "Server error",
      });
    }
  },

  async updateMyBookingInfo(req, res) {
    try {
      const userId = req.user.id;
      const bookingId = Number(req.params.id);

      const { name, phone, email, ticketDelivery, note } = req.body;

      if (req.user.role?.toLowerCase() === "admin") {
        return res.status(403).json({
          message: "Admin không được phép chỉnh sửa vé của user",
        });
      }

      if (!Number.isInteger(bookingId) || bookingId <= 0) {
        return res.status(400).json({
          message: "Mã booking không hợp lệ",
        });
      }

      if (!name || !name.trim()) {
        return res.status(400).json({
          message: "Vui lòng nhập họ tên",
        });
      }

      if (!phone || !phone.trim()) {
        return res.status(400).json({
          message: "Vui lòng nhập số điện thoại",
        });
      }

      if (!email || !email.trim()) {
        return res.status(400).json({
          message: "Vui lòng nhập email",
        });
      }

      const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;

      if (!phoneRegex.test(phone.trim())) {
        return res.status(400).json({
          message: "Số điện thoại không hợp lệ",
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({
          message: "Email không hợp lệ",
        });
      }

      const booking = await BookingModel.getBookingForUpdate(bookingId, userId);

      if (!booking) {
        return res.status(404).json({
          message: "Không tìm thấy vé hoặc vé không thuộc tài khoản của bạn",
        });
      }

      if (booking.status === "cancelled") {
        return res.status(400).json({
          message: "Vé đã hủy không thể chỉnh sửa",
        });
      }

      if (booking.status === "confirmed") {
        return res.status(400).json({
          message: "Vé đã được xác nhận, không thể chỉnh sửa thông tin",
        });
      }

      if (booking.status !== "pending") {
        return res.status(400).json({
          message: "Chỉ có thể chỉnh sửa vé đang chờ xác nhận",
        });
      }

      const showtimeTime = new Date(booking.start_time).getTime();

      if (Number.isNaN(showtimeTime)) {
        return res.status(400).json({
          message: "Thời gian suất chiếu không hợp lệ",
        });
      }

      if (showtimeTime <= Date.now()) {
        return res.status(400).json({
          message:
            "Không thể chỉnh sửa vé vì suất chiếu đã bắt đầu hoặc đã qua",
        });
      }

      const updatedBooking = await BookingModel.updateBookingInfo(
        bookingId,
        userId,
        {
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          ticketDelivery: ticketDelivery || "email",
          note: note ? note.trim() : "",
        },
      );

      if (!updatedBooking) {
        return res.status(400).json({
          message:
            "Không thể cập nhật vé. Vé có thể đã được xác nhận hoặc đã hủy",
        });
      }

      return res.json({
        message: "Cập nhật thông tin đặt vé thành công",
        data: updatedBooking,
      });
    } catch (error) {
      console.error("Update booking info error:", error);

      return res.status(500).json({
        message: error.message || "Server error",
      });
    }
  },
};

module.exports = bookingController;
