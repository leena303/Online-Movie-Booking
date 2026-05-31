const express = require("express");
const router = express.Router();

const bookingController = require("../controllers/booking.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.get(
  "/payment-summary",
  authMiddleware,
  bookingController.getPaymentSummary,
);
router.post("/", authMiddleware, bookingController.createBooking);
router.get("/my-bookings", authMiddleware, bookingController.getMyBookings);
router.put("/:id/cancel", authMiddleware, bookingController.cancelMyBooking);
router.put("/:id", authMiddleware, bookingController.updateMyBookingInfo);
module.exports = router;
