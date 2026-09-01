import express from "express";

import {
  getAdminBookings,
  getPendingBookings,
  confirmBooking,
  rejectBooking,
  cancelBookingByAdmin,
  completeBooking,
  getBookingStats,
} from "../controllers/adminBookingController.js";

import { protectAdmin } from "../middleware/adminAuthMiddleware.js";

const router = express.Router();

/* =====================================================
   ALL ADMIN BOOKING ROUTES
===================================================== */

router.use(protectAdmin);

/* ================= STATS ================= */

router.get(
  "/stats",
  getBookingStats
);

/* ================= PENDING ================= */

router.get(
  "/pending",
  getPendingBookings
);

/* ================= ALL ================= */

router.get(
  "/",
  getAdminBookings
);

/* ================= ACTIONS ================= */

router.patch(
  "/:id/confirm",
  confirmBooking
);

router.patch(
  "/:id/reject",
  rejectBooking
);

router.patch(
  "/:id/cancel",
  cancelBookingByAdmin
);

router.patch(
  "/:id/complete",
  completeBooking
);

export default router;