const pool = require("../config/db");

const ShowtimeModel = {
  async getAll() {
    const result = await pool.query(`
      SELECT 
        s.id,
        s.movie_id,
        s.room_id,
        s.start_time,
        s.price,
        s.subtitle,
        m.title AS movie_title,
        r.name AS room_name
      FROM showtimes s
      JOIN movies m ON s.movie_id = m.id
      JOIN rooms r ON s.room_id = r.id
      WHERE s.start_time >= NOW()
      ORDER BY s.start_time ASC
    `);

    return result.rows;
  },

  async getByMovieId(movieId) {
    const result = await pool.query(
      `
      SELECT 
        s.id,
        s.movie_id,
        s.room_id,
        s.start_time,
        s.price,
        s.subtitle,
        m.title AS movie_title,
        r.name AS room_name
      FROM showtimes s
      JOIN movies m ON s.movie_id = m.id
      JOIN rooms r ON s.room_id = r.id
      WHERE s.movie_id = $1
        AND s.start_time >= NOW()
      ORDER BY s.start_time ASC
      `,
      [movieId],
    );

    return result.rows;
  },

  async getById(id) {
    const result = await pool.query(
      `
      SELECT 
        s.id,
        s.movie_id,
        s.room_id,
        s.start_time,
        s.price,
        s.subtitle,
        m.title AS movie_title,
        r.name AS room_name
      FROM showtimes s
      JOIN movies m ON s.movie_id = m.id
      JOIN rooms r ON s.room_id = r.id
      WHERE s.id = $1
        AND s.start_time >= NOW()
      LIMIT 1
      `,
      [id],
    );

    return result.rows[0] || null;
  },
};

module.exports = ShowtimeModel;
