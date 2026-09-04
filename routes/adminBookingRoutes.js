// import express from "express";

// import {
//   getAdminBookings,
//   getPendingBookings,
//   confirmBooking,
//   rejectBooking,
//   cancelBookingByAdmin,
//   completeBooking,
//   getBookingStats,
// } from "../controllers/adminBookingController.js";

// import { protectAdmin } from "../middleware/adminAuthMiddleware.js";

// const router = express.Router();

// /* =====================================================
//    ALL ADMIN BOOKING ROUTES
// ===================================================== */

// router.use(protectAdmin);

// /* ================= STATS ================= */

// router.get(
//   "/stats",
//   getBookingStats
// );

// /* ================= PENDING ================= */

// router.get(
//   "/pending",
//   getPendingBookings
// );

// /* ================= ALL ================= */

// router.get(
//   "/",
//   getAdminBookings
// );

// /* ================= ACTIONS ================= */

// router.patch(
//   "/:id/confirm",
//   confirmBooking
// );

// router.patch(
//   "/:id/reject",
//   rejectBooking
// );

// router.patch(
//   "/:id/cancel",
//   cancelBookingByAdmin
// );

// router.patch(
//   "/:id/complete",
//   completeBooking
// );

// export default router;




import express from "express";

import {
  getAdminBookings,
  getPendingBookings,
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
   ADMIN AUTH
   ===================================================== */

router.use(protectAdmin);

/* =====================================================
   STATS
   GET /api/admin/bookings/stats
   ===================================================== */

router.get(
  "/stats",
  getBookingStats
);

/* =====================================================
   CALENDAR
   GET /api/admin/bookings/calendar
   ===================================================== */

router.get(
  "/calendar",
  getBookingCalendar
);

/* =====================================================
   PENDING
   GET /api/admin/bookings/pending
   ===================================================== */

router.get(
  "/pending",
  getPendingBookings
);

/* =====================================================
   ALL BOOKINGS
   GET /api/admin/bookings
   ===================================================== */

router.get(
  "/",
  getAdminBookings
);

/* =====================================================
   CONFIRM
   PATCH /api/admin/bookings/:id/confirm
   ===================================================== */

router.patch(
  "/:id/confirm",
  confirmBooking
);

/* =====================================================
   REJECT
   PATCH /api/admin/bookings/:id/reject
   ===================================================== */

router.patch(
  "/:id/reject",
  rejectBooking
);

/* =====================================================
   CANCEL
   PATCH /api/admin/bookings/:id/cancel
   ===================================================== */

router.patch(
  "/:id/cancel",
  cancelBookingByAdmin
);

/* =====================================================
   COMPLETE
   PATCH /api/admin/bookings/:id/complete
   ===================================================== */

router.patch(
  "/:id/complete",
  completeBooking
);

export default router;