


// import express from "express";

// import {
//   getAdminBookings,
//   getPendingBookings,
//   confirmBooking,
//   rejectBooking,
//   cancelBookingByAdmin,
//   completeBooking,
//   getBookingStats,
//   getBookingCalendar,
// } from "../controllers/adminBookingController.js";

// import { protectAdmin } from "../middleware/adminAuthMiddleware.js";

// const router = express.Router();

// /* =====================================================
//    ADMIN AUTH
//    ===================================================== */

// router.use(protectAdmin);

// /* =====================================================
//    STATS
//    GET /api/admin/bookings/stats
//    ===================================================== */

// router.get(
//   "/stats",
//   getBookingStats
// );

// /* =====================================================
//    CALENDAR
//    GET /api/admin/bookings/calendar
//    ===================================================== */

// router.get(
//   "/calendar",
//   getBookingCalendar
// );

// /* =====================================================
//    PENDING
//    GET /api/admin/bookings/pending
//    ===================================================== */

// router.get(
//   "/pending",
//   getPendingBookings
// );

// /* =====================================================
//    ALL BOOKINGS
//    GET /api/admin/bookings
//    ===================================================== */

// router.get(
//   "/",
//   getAdminBookings
// );

// /* =====================================================
//    CONFIRM
//    PATCH /api/admin/bookings/:id/confirm
//    ===================================================== */

// router.patch(
//   "/:id/confirm",
//   confirmBooking
// );

// /* =====================================================
//    REJECT
//    PATCH /api/admin/bookings/:id/reject
//    ===================================================== */

// router.patch(
//   "/:id/reject",
//   rejectBooking
// );

// /* =====================================================
//    CANCEL
//    PATCH /api/admin/bookings/:id/cancel
//    ===================================================== */

// router.patch(
//   "/:id/cancel",
//   cancelBookingByAdmin
// );

// /* =====================================================
//    COMPLETE
//    PATCH /api/admin/bookings/:id/complete
//    ===================================================== */

// router.patch(
//   "/:id/complete",
//   completeBooking
// );

// export default router;


import express from "express";

import {
getAdminBookings,
getPendingBookings,
getAdminBookingById,
confirmBooking,
rejectBooking,
cancelBookingByAdmin,
completeBooking,
getBookingStats,
getBookingCalendar,
} from "../controllers/adminBookingController.js";

import { protectAdmin } from "../middleware/adminAuthMiddleware.js";

const router = express.Router();

/* =====================================================
ADMIN AUTHENTICATION
===================================================== */

router.use(protectAdmin);

/* =====================================================
DASHBOARD
===================================================== */

// Booking statistics
router.get("/stats", getBookingStats);

// Booking calendar
router.get("/calendar", getBookingCalendar);

/* =====================================================
BOOKING LISTS
===================================================== */

// Pending booking requests
router.get("/pending", getPendingBookings);

// All bookings
router.get("/", getAdminBookings);

/* =====================================================
SINGLE BOOKING DETAILS
===================================================== */

// Get one booking by ID
router.get("/:id", getAdminBookingById);

/* =====================================================
BOOKING ACTIONS
===================================================== */

// Confirm pending booking
router.patch("/:id/confirm", confirmBooking);

// Reject pending booking
router.patch("/:id/reject", rejectBooking);

// Cancel booking by admin
router.patch("/:id/cancel", cancelBookingByAdmin);

// Complete confirmed booking
router.patch("/:id/complete", completeBooking);

/* =====================================================
EXPORT
===================================================== */

export default router;