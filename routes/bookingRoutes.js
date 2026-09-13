

// import express from "express";

// import {
//   createBooking,
//   getMyBookings,
//   getBookingById,
//   cancelBooking,
// } from "../controllers/bookingController.js";

// import { protect } from "../middleware/authMiddleware.js";

// const router = express.Router();

// /* =====================================================
//    CUSTOMER AUTHENTICATION
// ===================================================== */

// router.use(protect);

// /* =====================================================
//    CREATE BOOKING

//    POST /api/bookings
// ===================================================== */

// router.post("/", createBooking);

// /* =====================================================
//    GET MY BOOKINGS

//    GET /api/bookings/my
// ===================================================== */

// router.get("/my", getMyBookings);

// /* =====================================================
//    GET SINGLE BOOKING

//    GET /api/bookings/:id
// ===================================================== */

// router.get("/:id", getBookingById);

// /* =====================================================
//    CANCEL BOOKING

//    PATCH /api/bookings/:id/cancel
// ===================================================== */

// router.patch("/:id/cancel", cancelBooking);

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

Existing customer JWT cookie authentication
remains completely unchanged.

protect middleware reads:
req.cookies.coral_token
===================================================== */

router.use(protect);

/* =====================================================
CREATE BOOKING REQUEST

POST /api/bookings

Customer submits:

property
checkIn
checkOut
guests
guestName
guestPhone
guestEmail
specialRequest

Result:
status = pending

This is a booking REQUEST.
It is NOT immediately confirmed.
===================================================== */

router.post(
"/",
createBooking
);

/* =====================================================
GET MY BOOKINGS

GET /api/bookings/my

Returns bookings belonging to logged-in customer.
===================================================== */

router.get(
"/my",
getMyBookings
);

/* =====================================================
GET SINGLE BOOKING

GET /api/bookings/:id

Returns booking details for logged-in customer.
===================================================== */

router.get(
"/:id",
getBookingById
);

/* =====================================================
CUSTOMER CANCELLATION

PATCH /api/bookings/:id/cancel

Stage 2 customer feature.

Route is intentionally kept for backend
compatibility, but Stage 1 frontend should
NOT expose a cancel button.
===================================================== */

router.patch(
"/:id/cancel",
cancelBooking
);

/* =====================================================
EXPORT
===================================================== */

export default router;