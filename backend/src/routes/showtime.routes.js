const express = require("express");
const router = express.Router();

const showtimeController = require("../controllers/showtime.controller");

router.get("/", showtimeController.getAllShowtimes);
router.get("/movie/:movieId", showtimeController.getShowtimesByMovieId);

module.exports = router;
