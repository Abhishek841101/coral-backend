import express from "express";

import {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
} from "../controllers/bookingController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/* ================= ALL BOOKINGS REQUIRE LOGIN ================= */

router.use(protect);

/* ================= CREATE ================= */

router.post(
  "/",
  createBooking
);

/* ================= MY BOOKINGS ================= */

router.get(
  "/my",
  getMyBookings
);

/* ================= SINGLE BOOKING ================= */

router.get(
  "/:id",
  getBookingById
);

/* ================= CANCEL ================= */

router.patch(
  "/:id/cancel",
  cancelBooking
);

export default router;