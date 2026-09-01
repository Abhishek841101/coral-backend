import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import Property from "../models/Property.js";

/* =====================================================
   CREATE BOOKING
   POST /api/bookings
===================================================== */

export const createBooking = async (req, res) => {
  try {
    const {
      propertyId,
      checkIn,
      checkOut,
      guests,
      rooms = 1,
      guestName,
      guestPhone,
      guestEmail,
      specialRequest = "",
    } = req.body;

    /* ================= VALIDATION ================= */

    if (
      !propertyId ||
      !checkIn ||
      !checkOut ||
      !guests ||
      !guestName ||
      !guestPhone ||
      !guestEmail
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Property, dates, guests and guest details are required.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid property ID.",
      });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (
      Number.isNaN(checkInDate.getTime()) ||
      Number.isNaN(checkOutDate.getTime())
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid check-in or check-out date.",
      });
    }

    /* Checkout must be after check-in */

    if (checkOutDate <= checkInDate) {
      return res.status(400).json({
        success: false,
        message:
          "Check-out date must be after check-in date.",
      });
    }

    /* Guests */

    const guestCount = Number(guests);
    const roomCount = Number(rooms);

    if (
      !Number.isInteger(guestCount) ||
      guestCount < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Guests must be at least 1.",
      });
    }

    if (
      !Number.isInteger(roomCount) ||
      roomCount < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Rooms must be at least 1.",
      });
    }

    /* ================= PROPERTY ================= */

    const property = await Property.findOne({
      _id: propertyId,
      approvalStatus: "approved",
      status: "active",
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message:
          "Property is not available for booking.",
      });
    }

    /* ================= GUEST LIMIT ================= */

    const totalGuestCapacity =
      property.guests * roomCount;

    if (guestCount > totalGuestCapacity) {
      return res.status(400).json({
        success: false,
        message: `This property allows maximum ${totalGuestCapacity} guests.`,
      });
    }

    /* ================= DATE AVAILABILITY ================= */

    /*
      Existing booking overlaps when:

      existing.checkIn < new.checkOut
      AND
      existing.checkOut > new.checkIn
    */

    const overlappingBooking =
      await Booking.findOne({
        property: property._id,

        status: {
          $in: ["pending", "confirmed"],
        },

        checkIn: {
          $lt: checkOutDate,
        },

        checkOut: {
          $gt: checkInDate,
        },
      });

    if (overlappingBooking) {
      return res.status(409).json({
        success: false,
        message:
          "Property is not available for the selected dates.",
      });
    }

    /* ================= NIGHTS ================= */

    const millisecondsPerDay =
      1000 * 60 * 60 * 24;

    const nights = Math.ceil(
      (checkOutDate - checkInDate) /
        millisecondsPerDay
    );

    if (nights < 1) {
      return res.status(400).json({
        success: false,
        message: "Booking must be at least one night.",
      });
    }

    /* ================= PRICE ================= */

    const pricePerNight = Number(property.rent);

    const subtotal =
      pricePerNight *
      nights *
      roomCount;

    /*
      Taxes are currently calculated
      from the booking subtotal.
    */

    const taxRate = 0.05;

    const taxes = Math.round(
      subtotal * taxRate
    );

    const totalAmount =
      subtotal + taxes;

    /* ================= BOOKING ================= */

    const booking = await Booking.create({
      user: req.user._id,

      property: property._id,

      checkIn: checkInDate,
      checkOut: checkOutDate,

      guests: guestCount,
      rooms: roomCount,

      pricePerNight,
      nights,
      subtotal,
      taxes,
      totalAmount,

      guestName: guestName.trim(),
      guestPhone: guestPhone.trim(),
      guestEmail: guestEmail
        .toLowerCase()
        .trim(),

      specialRequest:
        specialRequest.trim(),

      status: "pending",

      paymentStatus: "pending",
      paymentMethod: "not_selected",
    });

    /* ================= UPDATE PROPERTY ================= */

    property.bookingsCount += 1;

    await property.save();

    /* ================= RESPONSE ================= */

    const populatedBooking =
      await Booking.findById(
        booking._id
      )
        .populate(
          "property",
          "title city locality rent images"
        )
        .populate(
          "user",
          "name email phone"
        );

    return res.status(201).json({
      success: true,
      message:
        "Booking request created successfully.",
      booking: populatedBooking,
    });
  } catch (error) {
    console.error(
      "Create booking error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to create booking.",
    });
  }
};

/* =====================================================
   GET MY BOOKINGS
   GET /api/bookings/my
===================================================== */

export const getMyBookings = async (
  req,
  res
) => {
  try {
    const bookings =
      await Booking.find({
        user: req.user._id,
      })
        .populate(
          "property",
          "title city locality rent images propertyType"
        )
        .sort({
          createdAt: -1,
        })
        .lean();

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error(
      "Get my bookings error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch your bookings.",
    });
  }
};

/* =====================================================
   GET SINGLE BOOKING
   GET /api/bookings/:id
===================================================== */

export const getBookingById = async (
  req,
  res
) => {
  try {
    if (
      !mongoose.Types.ObjectId.isValid(
        req.params.id
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID.",
      });
    }

    const booking =
      await Booking.findOne({
        _id: req.params.id,
        user: req.user._id,
      })
        .populate(
          "property",
          "title description city locality address rent images propertyType"
        )
        .populate(
          "user",
          "name email phone"
        );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    return res.status(200).json({
      success: true,
      booking,
    });
  } catch (error) {
    console.error(
      "Get booking error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch booking.",
    });
  }
};

/* =====================================================
   CANCEL BOOKING
   PATCH /api/bookings/:id/cancel
===================================================== */

export const cancelBooking = async (
  req,
  res
) => {
  try {
    if (
      !mongoose.Types.ObjectId.isValid(
        req.params.id
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID.",
      });
    }

    const { reason = "" } = req.body;

    const booking =
      await Booking.findOne({
        _id: req.params.id,
        user: req.user._id,
      });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    /* Cannot cancel completed/cancelled/rejected */

    if (
      [
        "cancelled",
        "completed",
        "rejected",
      ].includes(booking.status)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This booking cannot be cancelled.",
      });
    }

    /* Cannot cancel past check-in */

    const now = new Date();

    if (booking.checkIn <= now) {
      return res.status(400).json({
        success: false,
        message:
          "A booking cannot be cancelled after check-in.",
      });
    }

    booking.status = "cancelled";

    booking.cancellationReason =
      reason.trim();

    booking.cancelledAt = new Date();

    await booking.save();

    return res.status(200).json({
      success: true,
      message:
        "Booking cancelled successfully.",
      booking,
    });
  } catch (error) {
    console.error(
      "Cancel booking error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to cancel booking.",
    });
  }
};