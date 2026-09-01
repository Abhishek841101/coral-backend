import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import Property from "../models/Property.js";

/* =====================================================
   GET ALL BOOKINGS
   GET /api/admin/bookings
===================================================== */

export const getAdminBookings = async (req, res) => {
  try {
    const {
      status,
      paymentStatus,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }

    const pageNumber = Math.max(Number(page), 1);

    const limitNumber = Math.min(
      Math.max(Number(limit), 1),
      100
    );

    const skip =
      (pageNumber - 1) * limitNumber;

    const [bookings, total] =
      await Promise.all([
        Booking.find(filter)
          .populate(
            "user",
            "name email phone avatar"
          )
          .populate(
            "property",
            "title city locality rent images owner"
          )
          .populate(
            "confirmedBy",
            "name email"
          )
          .sort({
            createdAt: -1,
          })
          .skip(skip)
          .limit(limitNumber)
          .lean(),

        Booking.countDocuments(filter),
      ]);

    return res.status(200).json({
      success: true,
      count: bookings.length,
      total,
      page: pageNumber,
      pages: Math.ceil(
        total / limitNumber
      ),
      bookings,
    });
  } catch (error) {
    console.error(
      "Admin get bookings error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch bookings.",
    });
  }
};

/* =====================================================
   GET PENDING BOOKINGS
   GET /api/admin/bookings/pending
===================================================== */

export const getPendingBookings = async (
  req,
  res
) => {
  try {
    const bookings =
      await Booking.find({
        status: "pending",
      })
        .populate(
          "user",
          "name email phone"
        )
        .populate(
          "property",
          "title city locality rent images owner"
        )
        .sort({
          createdAt: 1,
        })
        .lean();

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error(
      "Get pending bookings error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch pending bookings.",
    });
  }
};

/* =====================================================
   CONFIRM BOOKING
   PATCH /api/admin/bookings/:id/confirm
===================================================== */

export const confirmBooking = async (
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
      await Booking.findById(
        req.params.id
      );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({
        success: false,
        message:
          "Only pending bookings can be confirmed.",
      });
    }

    /* ================= DATE RECHECK ================= */

    /*
      Re-check availability before confirmation.
      This prevents two pending bookings from
      getting confirmed for the same dates.
    */

    const conflictingBooking =
      await Booking.findOne({
        _id: {
          $ne: booking._id,
        },

        property: booking.property,

        status: "confirmed",

        checkIn: {
          $lt: booking.checkOut,
        },

        checkOut: {
          $gt: booking.checkIn,
        },
      });

    if (conflictingBooking) {
      booking.status = "rejected";

      booking.rejectionReason =
        "Property is no longer available for the selected dates.";

      await booking.save();

      return res.status(409).json({
        success: false,
        message:
          "Property is already booked for these dates. Booking rejected.",
      });
    }

    /* ================= CONFIRM ================= */

    booking.status = "confirmed";

    booking.confirmedBy =
      req.admin._id;

    booking.confirmedAt = new Date();

    booking.rejectionReason = "";

    await booking.save();

    return res.status(200).json({
      success: true,
      message:
        "Booking confirmed successfully.",
      booking,
    });
  } catch (error) {
    console.error(
      "Confirm booking error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to confirm booking.",
    });
  }
};

/* =====================================================
   REJECT BOOKING
   PATCH /api/admin/bookings/:id/reject
===================================================== */

export const rejectBooking = async (
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

    const {
      reason = "",
    } = req.body;

    const booking =
      await Booking.findById(
        req.params.id
      );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({
        success: false,
        message:
          "Only pending bookings can be rejected.",
      });
    }

    booking.status = "rejected";

    booking.rejectionReason =
      reason.trim() ||
      "Booking rejected by admin.";

    await booking.save();

    return res.status(200).json({
      success: true,
      message:
        "Booking rejected successfully.",
      booking,
    });
  } catch (error) {
    console.error(
      "Reject booking error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to reject booking.",
    });
  }
};

/* =====================================================
   CANCEL BOOKING BY ADMIN
   PATCH /api/admin/bookings/:id/cancel
===================================================== */

export const cancelBookingByAdmin = async (
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

    const {
      reason = "",
    } = req.body;

    const booking =
      await Booking.findById(
        req.params.id
      );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

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

    booking.status = "cancelled";

    booking.cancellationReason =
      reason.trim() ||
      "Cancelled by admin.";

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
      "Admin cancel booking error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to cancel booking.",
    });
  }
};

/* =====================================================
   COMPLETE BOOKING
   PATCH /api/admin/bookings/:id/complete
===================================================== */

export const completeBooking = async (
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
      await Booking.findById(
        req.params.id
      );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    if (booking.status !== "confirmed") {
      return res.status(400).json({
        success: false,
        message:
          "Only confirmed bookings can be completed.",
      });
    }

    booking.status = "completed";

    await booking.save();

    return res.status(200).json({
      success: true,
      message:
        "Booking marked as completed.",
      booking,
    });
  } catch (error) {
    console.error(
      "Complete booking error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to complete booking.",
    });
  }
};

/* =====================================================
   BOOKING STATS
   GET /api/admin/bookings/stats
===================================================== */

export const getBookingStats = async (
  req,
  res
) => {
  try {
    const [
      total,
      pending,
      confirmed,
      rejected,
      cancelled,
      completed,
      paid,
      unpaid,
    ] = await Promise.all([
      Booking.countDocuments(),

      Booking.countDocuments({
        status: "pending",
      }),

      Booking.countDocuments({
        status: "confirmed",
      }),

      Booking.countDocuments({
        status: "rejected",
      }),

      Booking.countDocuments({
        status: "cancelled",
      }),

      Booking.countDocuments({
        status: "completed",
      }),

      Booking.countDocuments({
        paymentStatus: "paid",
      }),

      Booking.countDocuments({
        paymentStatus: "pending",
      }),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        total,
        pending,
        confirmed,
        rejected,
        cancelled,
        completed,
        paid,
        unpaid,
      },
    });
  } catch (error) {
    console.error(
      "Booking stats error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch booking statistics.",
    });
  }
};