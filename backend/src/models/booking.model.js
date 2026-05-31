const pool = require("../config/db");

const BookingModel = {
  async createBooking(
    userId,
    showtimeId,
    totalPrice,
    seatPrices,
    name,
    phone,
    email,
    paymentMethod,
    cardNumber,
  ) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const bookingResult = await client.query(
        `
        INSERT INTO bookings 
        (user_id, showtime_id, total_price, status, name, phone, email, payment_method, card_number)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
        `,
        [
          userId,
          showtimeId,
          totalPrice,
          "pending",
          name,
          phone,
          email,
          paymentMethod,
          cardNumber,
        ],
      );

      const bookingId = bookingResult.rows[0].id;

      for (const seat of seatPrices) {
        await client.query(
          `
          INSERT INTO booking_details (booking_id, seat_id, price) 
          VALUES ($1, $2, $3)
          `,
          [bookingId, seat.seatId, seat.price],
        );
      }

      await client.query("COMMIT");
      return bookingId;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  async getSeatsByIds(seatIds) {
    const result = await pool.query(
      `
      SELECT id, room_id, row_label, col_number, type
      FROM seats
      WHERE id = ANY($1)
      `,
      [seatIds],
    );

    return result.rows;
  },

  async getUserBookings(userId) {
    const result = await pool.query(
      `
      SELECT 
        b.id AS booking_id,
        b.total_price,
        b.status,
        b.name,
        b.phone,
        b.email,
        b.payment_method,
        b.created_at,
        m.title AS movie_title,
        s.start_time,
        r.name AS room_name,
        STRING_AGG(
          se.row_label || se.col_number::TEXT,
          ', ' ORDER BY se.row_label, se.col_number
        ) AS seat_names,
        CASE
          WHEN LOWER(COALESCE(b.payment_method, '')) = 'cod' AND b.status = 'confirmed' THEN 'paid'
          WHEN LOWER(COALESCE(b.payment_method, '')) = 'cod' THEN 'unpaid'
          WHEN LOWER(COALESCE(b.payment_method, '')) IN ('momo', 'vnpay') THEN 'paid'
          ELSE 'pending'
        END AS payment_status
      FROM bookings b
      JOIN showtimes s ON b.showtime_id = s.id
      JOIN movies m ON s.movie_id = m.id
      JOIN rooms r ON s.room_id = r.id
      LEFT JOIN booking_details bd ON b.id = bd.booking_id
      LEFT JOIN seats se ON bd.seat_id = se.id
      WHERE b.user_id = $1
      GROUP BY 
        b.id,
        b.total_price,
        b.status,
        b.name,
        b.phone,
        b.email,
        b.payment_method,
        b.created_at,
        m.title,
        s.start_time,
        r.name
      ORDER BY b.created_at DESC
      `,
      [userId],
    );

    return result.rows;
  },

  async getPaymentSummary(showtimeId, seatIds) {
    const showtimeResult = await pool.query(
      `
    SELECT 
      st.id AS showtime_id,
      st.start_time,
      st.room_id,
      m.title AS movie_title,
      r.name AS room_name
    FROM showtimes st
    JOIN movies m ON st.movie_id = m.id
    JOIN rooms r ON st.room_id = r.id
    WHERE st.id = $1
    LIMIT 1
    `,
      [showtimeId],
    );

    const showtime = showtimeResult.rows[0] || null;

    if (!showtime) {
      return null;
    }

    const seatsResult = await pool.query(
      `
    SELECT 
      id,
      room_id,
      row_label,
      col_number,
      type,
      CASE
        WHEN type = 'vip' THEN 120000
        ELSE 90000
      END AS price
    FROM seats
    WHERE id = ANY($1)
    ORDER BY row_label, col_number
    `,
      [seatIds],
    );

    const seats = seatsResult.rows;

    return {
      ...showtime,
      seats,
      total_price: seats.reduce((sum, seat) => sum + Number(seat.price), 0),
    };
  },

  async getSeatLabelsByIds(seatIds) {
    const result = await pool.query(
      `
    SELECT 
      id,
      row_label,
      col_number,
      type
    FROM seats
    WHERE id = ANY($1)
    ORDER BY row_label, col_number
    `,
      [seatIds],
    );

    return result.rows.map((seat) => ({
      id: seat.id,
      seatLabel: `${seat.row_label}${seat.col_number}`,
      type: seat.type,
    }));
  },

  async getBookingForCancel(bookingId, userId) {
    const result = await pool.query(
      `
      SELECT 
        b.id,
        b.user_id,
        b.status,
        b.showtime_id,
        b.created_at,
        s.start_time,
        m.title AS movie_title,
        r.name AS room_name
      FROM bookings b
      JOIN showtimes s ON b.showtime_id = s.id
      JOIN movies m ON s.movie_id = m.id
      JOIN rooms r ON s.room_id = r.id
      WHERE b.id = $1 
        AND b.user_id = $2
      LIMIT 1
      `,
      [bookingId, userId],
    );

    return result.rows[0] || null;
  },

  async cancelBooking(bookingId, userId) {
    const result = await pool.query(
      `
      UPDATE bookings
      SET status = 'cancelled'
      WHERE id = $1
        AND user_id = $2
        AND status = 'pending'
      RETURNING id, status
      `,
      [bookingId, userId],
    );

    return result.rows[0] || null;
  },

  async getBookingForUpdate(bookingId, userId) {
    const result = await pool.query(
      `
    SELECT 
      b.id,
      b.user_id,
      b.status,
      b.showtime_id,
      b.name,
      b.phone,
      b.email,
      b.created_at,
      s.start_time,
      m.title AS movie_title
    FROM bookings b
    JOIN showtimes s ON b.showtime_id = s.id
    JOIN movies m ON s.movie_id = m.id
    WHERE b.id = $1 
      AND b.user_id = $2
    LIMIT 1
    `,
      [bookingId, userId],
    );

    return result.rows[0] || null;
  },

  async updateBookingInfo(bookingId, userId, data) {
    const { name, phone, email, ticketDelivery, note } = data;

    const result = await pool.query(
      `
    UPDATE bookings
    SET name = $1,
        phone = $2,
        email = $3,
        ticket_delivery = $4,
        note = $5
    WHERE id = $6
      AND user_id = $7
      AND status = 'pending'
    RETURNING id, name, phone, email, ticket_delivery, note, status
    `,
      [
        name,
        phone,
        email,
        ticketDelivery || null,
        note || null,
        bookingId,
        userId,
      ],
    );

    return result.rows[0] || null;
  },

  async getBookedSeatIdsByShowtime(showtimeId) {
    const result = await pool.query(
      `
      SELECT bd.seat_id
      FROM booking_details bd
      JOIN bookings b ON bd.booking_id = b.id
      WHERE b.showtime_id = $1 AND b.status IN ('pending', 'confirmed')
      `,
      [showtimeId],
    );

    return result.rows.map((item) => item.seat_id);
  },
};

module.exports = BookingModel;
