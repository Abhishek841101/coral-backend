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
updateBookingPayment,
uploadBookingDocuments,
} from "../controllers/adminBookingController.js";

import { protectAdmin } from "../middleware/adminAuthMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

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
PAYMENT
===================================================== */

// Save / update payment details
router.patch(
"/:id/payment",
updateBookingPayment
);

/* =====================================================
CUSTOMER DOCUMENTS
===================================================== */

// Upload customer documents
router.patch(
"/:id/documents",
upload.array("documents", 10),
uploadBookingDocuments
);

/* =====================================================
BOOKING ACTIONS
===================================================== */

// Confirm pending booking
router.patch(
"/:id/confirm",
confirmBooking
);

// Reject pending booking
router.patch(
"/:id/reject",
rejectBooking
);

// Cancel booking by admin
router.patch(
"/:id/cancel",
cancelBookingByAdmin
);

// Complete confirmed booking
router.patch(
"/:id/complete",
completeBooking
);

/* =====================================================
EXPORT
===================================================== */

export default router;