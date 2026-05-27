const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

const adminController = require("../controllers/admin.controller");
const authMiddleware = require("../middleware/auth.middleware");
const adminMiddleware = require("../middleware/admin.middleware");

const uploadDir = path.join(__dirname, "../../uploads/movies");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const moviePosterStorage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },

  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    const filename = `movie-${Date.now()}-${Math.round(
      Math.random() * 1e9,
    )}${ext}`;

    cb(null, filename);
  },
});

const uploadMoviePoster = multer({
  storage: moviePosterStorage,
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
  fileFilter(req, file, cb) {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Chỉ được tải lên file hình ảnh"));
    }

    cb(null, true);
  },
});

router.use(authMiddleware, adminMiddleware);

// ================= ADMIN PROFILE =================
router.get("/profile", adminController.getAdminProfile);
router.put("/profile", adminController.updateAdminProfile);
router.put("/change-password", adminController.changeAdminPassword);

// ================= MOVIES =================
router.get("/movies", adminController.getAllMoviesAdmin);

router.post(
  "/movies",
  uploadMoviePoster.single("poster"),
  adminController.createMovie,
);

router.put(
  "/movies/:id",
  uploadMoviePoster.single("poster"),
  adminController.updateMovie,
);

router.delete("/movies/:id", adminController.deleteMovie);

// ================= SHOWTIMES =================
router.get("/showtimes", adminController.getAllShowtimesAdmin);
router.post("/showtimes", adminController.createShowtime);
router.put("/showtimes/:id", adminController.updateShowtime);
router.delete("/showtimes/:id", adminController.deleteShowtime);

// ================= ROOMS =================
router.get("/rooms", adminController.getAllRooms);
router.post("/rooms", adminController.createRoom);
router.put("/rooms/:id", adminController.updateRoom);
router.delete("/rooms/:id", adminController.deleteRoom);

// ================= SEATS =================
router.get("/rooms/:roomId/seats", adminController.getSeatsByRoom);
router.post("/rooms/:roomId/seats", adminController.createSeat);
router.put("/seats/:id", adminController.updateSeat);
router.delete("/seats/:id", adminController.deleteSeat);

// ================= USERS =================
router.get("/users", adminController.getAllUsers);
router.post("/users", adminController.createUser);
router.put("/users/:id", adminController.updateUser);
router.put("/users/:id/role", adminController.updateUserRole);
router.delete("/users/:id", adminController.deleteUser);

// ================= BOOKINGS =================
router.get("/bookings", adminController.getAllBookings);
router.put("/bookings/:id/status", adminController.updateBookingStatus);

module.exports = router;
