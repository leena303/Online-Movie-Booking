const ShowtimeModel = require("../models/showtime.model");

const showtimeController = {
  async getAllShowtimes(req, res) {
    try {
      const data = await ShowtimeModel.getAll();

      return res.json({
        message: "Get available showtimes successfully",
        data,
      });
    } catch (error) {
      console.error("Get all showtimes error:", error);

      return res.status(500).json({
        message: "Server error",
        error: error.message,
      });
    }
  },

  async getShowtimesByMovieId(req, res) {
    try {
      const { movieId } = req.params;

      if (!movieId || Number.isNaN(Number(movieId))) {
        return res.status(400).json({
          message: "movieId không hợp lệ",
        });
      }

      const data = await ShowtimeModel.getByMovieId(movieId);

      return res.json({
        message: "Get available showtimes by movie successfully",
        data,
      });
    } catch (error) {
      console.error("Get showtimes by movie error:", error);

      return res.status(500).json({
        message: "Server error",
        error: error.message,
      });
    }
  },
};

module.exports = showtimeController;
