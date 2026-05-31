const express = require("express");
const cors = require("cors");
const path = require("path");

const adminRoutes = require("./routes/admin.routes");
const authRoutes = require("./routes/auth.routes");
const movieRoutes = require("./routes/movie.routes");
const showtimeRoutes = require("./routes/showtime.routes");
const seatRoutes = require("./routes/seat.routes");
const bookingRoutes = require("./routes/booking.routes");
const notificationRoutes = require("./routes/notification.routes");

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "https://movie-booking-yv55.vercel.app",
  "https://movie-booking-cbxi.vercel.app",
];

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/", (req, res) => {
  res.json({
    message: "Movie Booking API is running",
  });
});

app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/showtimes", showtimeRoutes);
app.use("/api/seats", seatRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/notifications", notificationRoutes);

app.use((err, req, res, next) => {
  if (err.message && err.message.includes("CORS blocked")) {
    return res.status(403).json({ message: err.message });
  }

  if (err.message) {
    return res.status(400).json({ message: err.message });
  }

  next(err);
});

module.exports = app;
