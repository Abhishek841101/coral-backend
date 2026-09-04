// import express from "express";

// import {
//   createBooking,
//   getMyBookings,
//   getBookingById,
//   cancelBooking,
// } from "../controllers/bookingController.js";

// import { protect } from "../middleware/authMiddleware.js";

// const router = express.Router();

// /* ================= ALL BOOKINGS REQUIRE LOGIN ================= */

// router.use(protect);

// /* ================= CREATE ================= */

// router.post(
//   "/",
//   createBooking
// );

// /* ================= MY BOOKINGS ================= */

// router.get(
//   "/my",
//   getMyBookings
// );

// /* ================= SINGLE BOOKING ================= */

// router.get(
//   "/:id",
//   getBookingById
// );

// /* ================= CANCEL ================= */

// router.patch(
//   "/:id/cancel",
//   cancelBooking
// );

// export default router;





import express from "express";

import {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
} from "../controllers/bookingController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/* =====================================================
   CUSTOMER AUTHENTICATION
   All booking routes require logged-in customer
===================================================== */

router.use(protect);

/* =====================================================
   CREATE BOOKING
   POST /api/bookings
===================================================== */

router.post(
  "/",
  createBooking
);

/* =====================================================
   GET MY BOOKINGS
   GET /api/bookings/my
===================================================== */

router.get(
  "/my",
  getMyBookings
);

/* =====================================================
   GET SINGLE BOOKING
   GET /api/bookings/:id
===================================================== */

router.get(
  "/:id",
  getBookingById
);

/* =====================================================
   CANCEL BOOKING
   PATCH /api/bookings/:id/cancel
===================================================== */

router.patch(
  "/:id/cancel",
  cancelBooking
);

export default router;

