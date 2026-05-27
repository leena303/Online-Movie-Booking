const pool = require("../config/db");

function toPostgresDateTime(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    const error = new Error("Ngày giờ chiếu không hợp lệ");
    error.status = 400;
    throw error;
  }

  return date;
}

const AdminModel = {
  // ================= MOVIES =================
  async getMovieById(id) {
    const result = await pool.query("SELECT * FROM movies WHERE id = $1", [id]);
    return result.rows[0] || null;
  },

  async findMovieByTitle(title) {
    const result = await pool.query(
      `
    SELECT id, title
    FROM movies
    WHERE LOWER(TRIM(title)) = LOWER(TRIM($1))
    LIMIT 1
    `,
      [title],
    );

    return result.rows[0] || null;
  },

  async findMovieByTitleExceptId(title, id) {
    const result = await pool.query(
      `
    SELECT id, title
    FROM movies
    WHERE LOWER(TRIM(title)) = LOWER(TRIM($1))
      AND id <> $2
    LIMIT 1
    `,
      [title, id],
    );

    return result.rows[0] || null;
  },

  async getAllMovies() {
    const result = await pool.query("SELECT * FROM movies ORDER BY id DESC");
    return result.rows;
  },

  async createMovie(data) {
    const {
      title,
      genre,
      duration_min,
      description,
      poster_url,
      status,
      release_date,
      director,
    } = data;

    const result = await pool.query(
      `
      INSERT INTO movies 
      (title, genre, duration_min, description, poster_url, status, release_date, director)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
      `,
      [
        title,
        genre,
        duration_min,
        description,
        poster_url,
        status,
        release_date || null,
        director,
      ],
    );

    return {
      insertId: result.rows[0].id,
      rowCount: result.rowCount,
    };
  },

  async updateMovie(id, data) {
    const {
      title,
      genre,
      duration_min,
      description,
      poster_url,
      status,
      release_date,
      director,
    } = data;

    const result = await pool.query(
      `
      UPDATE movies
      SET title = $1,
          genre = $2,
          duration_min = $3,
          description = $4,
          poster_url = $5,
          status = $6,
          release_date = $7,
          director = $8
      WHERE id = $9
      `,
      [
        title,
        genre,
        duration_min,
        description,
        poster_url,
        status,
        release_date || null,
        director,
        id,
      ],
    );

    return {
      rowCount: result.rowCount,
    };
  },

  async deleteMovie(id) {
    const result = await pool.query("DELETE FROM movies WHERE id = $1", [id]);

    return {
      rowCount: result.rowCount,
    };
  },

  // ================= SHOWTIMES =================
  async getAllShowtimes() {
    const result = await pool.query(`
      SELECT 
        s.*,
        m.title AS movie_title,
        r.name AS room_name
      FROM showtimes s
      JOIN movies m ON s.movie_id = m.id
      JOIN rooms r ON s.room_id = r.id
      ORDER BY s.start_time DESC
    `);

    return result.rows;
  },

  async createShowtime(data) {
    const { movie_id, room_id, start_time, price, subtitle } = data;

    if (!movie_id || !room_id || !start_time) {
      const error = new Error("movie_id, room_id và start_time là bắt buộc");
      error.status = 400;
      throw error;
    }

    const pgStartTime = toPostgresDateTime(start_time);

    const movieResult = await pool.query(
      "SELECT id FROM movies WHERE id = $1",
      [movie_id],
    );

    if (!movieResult.rows[0]) {
      const error = new Error("Phim không tồn tại");
      error.status = 404;
      throw error;
    }

    const roomResult = await pool.query("SELECT id FROM rooms WHERE id = $1", [
      room_id,
    ]);

    if (!roomResult.rows[0]) {
      const error = new Error("Phòng không tồn tại");
      error.status = 404;
      throw error;
    }

    const duplicateResult = await pool.query(
      `
      SELECT id
      FROM showtimes
      WHERE room_id = $1 AND start_time = $2
      LIMIT 1
      `,
      [room_id, pgStartTime],
    );

    if (duplicateResult.rows[0]) {
      const error = new Error("Phòng này đã có suất chiếu ở thời gian đã chọn");
      error.status = 409;
      throw error;
    }

    const finalPrice = Number.isFinite(Number(price)) ? Number(price) : 0;
    const finalSubtitle = subtitle || "Phụ đề";

    const result = await pool.query(
      `
      INSERT INTO showtimes 
      (movie_id, room_id, start_time, price, subtitle)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
      `,
      [movie_id, room_id, pgStartTime, finalPrice, finalSubtitle],
    );

    return {
      insertId: result.rows[0].id,
      rowCount: result.rowCount,
    };
  },

  async updateShowtime(id, data) {
    const { movie_id, room_id, start_time, price, subtitle } = data;

    if (!movie_id || !room_id || !start_time) {
      const error = new Error("movie_id, room_id và start_time là bắt buộc");
      error.status = 400;
      throw error;
    }

    const pgStartTime = toPostgresDateTime(start_time);

    const movieResult = await pool.query(
      "SELECT id FROM movies WHERE id = $1",
      [movie_id],
    );

    if (!movieResult.rows[0]) {
      const error = new Error("Phim không tồn tại");
      error.status = 404;
      throw error;
    }

    const roomResult = await pool.query("SELECT id FROM rooms WHERE id = $1", [
      room_id,
    ]);

    if (!roomResult.rows[0]) {
      const error = new Error("Phòng không tồn tại");
      error.status = 404;
      throw error;
    }

    const duplicateResult = await pool.query(
      `
      SELECT id
      FROM showtimes
      WHERE room_id = $1 AND start_time = $2 AND id <> $3
      LIMIT 1
      `,
      [room_id, pgStartTime, id],
    );

    if (duplicateResult.rows[0]) {
      const error = new Error("Phòng này đã có suất chiếu ở thời gian đã chọn");
      error.status = 409;
      throw error;
    }

    const finalPrice = Number.isFinite(Number(price)) ? Number(price) : 0;
    const finalSubtitle = subtitle || "Phụ đề";

    const result = await pool.query(
      `
      UPDATE showtimes
      SET movie_id = $1,
          room_id = $2,
          start_time = $3,
          price = $4,
          subtitle = $5
      WHERE id = $6
      `,
      [movie_id, room_id, pgStartTime, finalPrice, finalSubtitle, id],
    );

    return {
      rowCount: result.rowCount,
    };
  },

  async deleteShowtime(id) {
    const result = await pool.query("DELETE FROM showtimes WHERE id = $1", [
      id,
    ]);

    return {
      rowCount: result.rowCount,
    };
  },

  // ================= ROOMS =================
  async getAllRooms() {
    const result = await pool.query("SELECT * FROM rooms ORDER BY id DESC");
    return result.rows;
  },

  async createRoom(data) {
    const { name, total_rows, total_cols } = data;

    const result = await pool.query(
      `
      INSERT INTO rooms 
      (name, total_rows, total_cols)
      VALUES ($1, $2, $3)
      RETURNING id
      `,
      [name, total_rows, total_cols],
    );

    return {
      insertId: result.rows[0].id,
      rowCount: result.rowCount,
    };
  },

  async updateRoom(id, data) {
    const { name, total_rows, total_cols } = data;

    const result = await pool.query(
      `
      UPDATE rooms
      SET name = $1,
          total_rows = $2,
          total_cols = $3
      WHERE id = $4
      `,
      [name, total_rows, total_cols, id],
    );

    return {
      rowCount: result.rowCount,
    };
  },

  async deleteRoom(id) {
    const result = await pool.query("DELETE FROM rooms WHERE id = $1", [id]);

    return {
      rowCount: result.rowCount,
    };
  },

  // ================= SEATS =================
  async getSeatsByRoom(roomId) {
    const result = await pool.query(
      `
      SELECT *
      FROM seats
      WHERE room_id = $1
      ORDER BY row_label, col_number
      `,
      [roomId],
    );

    return result.rows;
  },

  async createSeat(roomId, data) {
    const { row_label, col_number, type } = data;

    const result = await pool.query(
      `
      INSERT INTO seats 
      (room_id, row_label, col_number, type)
      VALUES ($1, $2, $3, $4)
      RETURNING id
      `,
      [roomId, row_label, col_number, type],
    );

    return {
      insertId: result.rows[0].id,
      rowCount: result.rowCount,
    };
  },

  async updateSeat(id, data) {
    const { row_label, col_number, type } = data;

    const result = await pool.query(
      `
      UPDATE seats
      SET row_label = $1,
          col_number = $2,
          type = $3
      WHERE id = $4
      `,
      [row_label, col_number, type, id],
    );

    return {
      rowCount: result.rowCount,
    };
  },

  async deleteSeat(id) {
    const result = await pool.query("DELETE FROM seats WHERE id = $1", [id]);

    return {
      rowCount: result.rowCount,
    };
  },

  // ================= ADMIN PROFILE =================
  async getAdminProfileById(id) {
    const result = await pool.query(
      `
      SELECT id, name, email, phone, address, role, created_at
      FROM users
      WHERE id = $1 AND role = 'admin'
      LIMIT 1
      `,
      [id],
    );

    return result.rows[0] || null;
  },

  async updateAdminProfile(id, data) {
    const { name, phone, address } = data;

    const result = await pool.query(
      `
      UPDATE users
      SET name = $1,
          phone = $2,
          address = $3
      WHERE id = $4 AND role = 'admin'
      `,
      [name, phone || null, address || null, id],
    );

    return {
      rowCount: result.rowCount,
    };
  },

  async getAdminPasswordById(id) {
    const result = await pool.query(
      `
      SELECT id, password_hash
      FROM users
      WHERE id = $1 AND role = 'admin'
      LIMIT 1
      `,
      [id],
    );

    return result.rows[0] || null;
  },

  async updateAdminPassword(id, passwordHash) {
    const result = await pool.query(
      `
      UPDATE users
      SET password_hash = $1
      WHERE id = $2 AND role = 'admin'
      `,
      [passwordHash, id],
    );

    return {
      rowCount: result.rowCount,
    };
  },

  // ================= USERS =================
  async getAllUsers() {
    const result = await pool.query(
      `
      SELECT id, name, email, phone, address, role, created_at
      FROM users
      ORDER BY id DESC
      `,
    );

    return result.rows;
  },

  async createUser(data) {
    const { name, email, password_hash, phone, address, role } = data;

    const result = await pool.query(
      `
      INSERT INTO users 
      (name, email, password_hash, phone, address, role)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
      `,
      [
        name,
        email,
        password_hash,
        phone || null,
        address || null,
        role || "user",
      ],
    );

    return {
      insertId: result.rows[0].id,
      rowCount: result.rowCount,
    };
  },

  async updateUser(id, data) {
    const fields = [];
    const values = [];

    if (data.name !== undefined) {
      values.push(data.name);
      fields.push(`name = $${values.length}`);
    }

    if (data.email !== undefined) {
      values.push(data.email);
      fields.push(`email = $${values.length}`);
    }

    if (data.phone !== undefined) {
      values.push(data.phone);
      fields.push(`phone = $${values.length}`);
    }

    if (data.address !== undefined) {
      values.push(data.address);
      fields.push(`address = $${values.length}`);
    }

    if (data.role !== undefined) {
      values.push(data.role);
      fields.push(`role = $${values.length}`);
    }

    if (fields.length === 0) {
      const error = new Error("No fields to update");
      error.status = 400;
      throw error;
    }

    values.push(id);

    const result = await pool.query(
      `
      UPDATE users
      SET ${fields.join(", ")}
      WHERE id = $${values.length}
      `,
      values,
    );

    return {
      rowCount: result.rowCount,
    };
  },

  async updateUserRole(id, role) {
    const result = await pool.query(
      `
      UPDATE users
      SET role = $1
      WHERE id = $2
      `,
      [role, id],
    );

    return {
      rowCount: result.rowCount,
    };
  },

  async deleteUser(id) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      await client.query(
        `
        DELETE FROM booking_details
        WHERE booking_id IN (
          SELECT id FROM bookings WHERE user_id = $1
        )
        `,
        [id],
      );

      await client.query("DELETE FROM bookings WHERE user_id = $1", [id]);

      const result = await client.query("DELETE FROM users WHERE id = $1", [
        id,
      ]);

      await client.query("COMMIT");

      return {
        rowCount: result.rowCount,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  // ================= BOOKINGS =================
  async getAllBookings() {
    const result = await pool.query(`
      SELECT
        b.id AS booking_id,
        b.total_price,
        b.status,
        b.created_at,
        b.payment_method,
        b.phone,
        u.name AS user_name,
        COALESCE(b.email, u.email) AS email,
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
      JOIN users u ON b.user_id = u.id
      JOIN showtimes s ON b.showtime_id = s.id
      JOIN movies m ON s.movie_id = m.id
      JOIN rooms r ON s.room_id = r.id
      LEFT JOIN booking_details bd ON b.id = bd.booking_id
      LEFT JOIN seats se ON bd.seat_id = se.id
      GROUP BY
        b.id,
        b.total_price,
        b.status,
        b.created_at,
        b.payment_method,
        b.phone,
        b.email,
        u.name,
        u.email,
        m.title,
        s.start_time,
        r.name
      ORDER BY b.created_at DESC
    `);

    return result.rows;
  },

  async updateBookingStatus(id, status) {
    const result = await pool.query(
      `
      UPDATE bookings
      SET status = $1
      WHERE id = $2
      `,
      [status, id],
    );

    return {
      rowCount: result.rowCount,
    };
  },
};

module.exports = AdminModel;
