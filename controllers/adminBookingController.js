// import mongoose from "mongoose";
// import Booking from "../models/Booking.js";
// import Property from "../models/Property.js";

// /* =====================================================
//    GET ALL BOOKINGS
//    GET /api/admin/bookings
// ===================================================== */

// export const getAdminBookings = async (req, res) => {
//   try {
//     const {
//       status,
//       paymentStatus,
//       page = 1,
//       limit = 20,
//     } = req.query;

//     const filter = {};

//     if (status) {
//       filter.status = status;
//     }

//     if (paymentStatus) {
//       filter.paymentStatus = paymentStatus;
//     }

//     const pageNumber = Math.max(Number(page), 1);

//     const limitNumber = Math.min(
//       Math.max(Number(limit), 1),
//       100
//     );

//     const skip =
//       (pageNumber - 1) * limitNumber;

//     const [bookings, total] =
//       await Promise.all([
//         Booking.find(filter)
//           .populate(
//             "user",
//             "name email phone avatar"
//           )
//           .populate(
//             "property",
//             "title city locality rent images owner"
//           )
//           .populate(
//             "confirmedBy",
//             "name email"
//           )
//           .sort({
//             createdAt: -1,
//           })
//           .skip(skip)
//           .limit(limitNumber)
//           .lean(),

//         Booking.countDocuments(filter),
//       ]);

//     return res.status(200).json({
//       success: true,
//       count: bookings.length,
//       total,
//       page: pageNumber,
//       pages: Math.ceil(
//         total / limitNumber
//       ),
//       bookings,
//     });
//   } catch (error) {
//     console.error(
//       "Admin get bookings error:",
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message:
//         "Unable to fetch bookings.",
//     });
//   }
// };

// /* =====================================================
//    GET PENDING BOOKINGS
//    GET /api/admin/bookings/pending
// ===================================================== */

// export const getPendingBookings = async (
//   req,
//   res
// ) => {
//   try {
//     const bookings =
//       await Booking.find({
//         status: "pending",
//       })
//         .populate(
//           "user",
//           "name email phone"
//         )
//         .populate(
//           "property",
//           "title city locality rent images owner"
//         )
//         .sort({
//           createdAt: 1,
//         })
//         .lean();

//     return res.status(200).json({
//       success: true,
//       count: bookings.length,
//       bookings,
//     });
//   } catch (error) {
//     console.error(
//       "Get pending bookings error:",
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message:
//         "Unable to fetch pending bookings.",
//     });
//   }
// };

// /* =====================================================
//    CONFIRM BOOKING
//    PATCH /api/admin/bookings/:id/confirm
// ===================================================== */

// export const confirmBooking = async (
//   req,
//   res
// ) => {
//   try {
//     if (
//       !mongoose.Types.ObjectId.isValid(
//         req.params.id
//       )
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid booking ID.",
//       });
//     }

//     const booking =
//       await Booking.findById(
//         req.params.id
//       );

//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: "Booking not found.",
//       });
//     }

//     if (booking.status !== "pending") {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Only pending bookings can be confirmed.",
//       });
//     }

//     /* ================= DATE RECHECK ================= */

//     /*
//       Re-check availability before confirmation.
//       This prevents two pending bookings from
//       getting confirmed for the same dates.
//     */

//     const conflictingBooking =
//       await Booking.findOne({
//         _id: {
//           $ne: booking._id,
//         },

//         property: booking.property,

//         status: "confirmed",

//         checkIn: {
//           $lt: booking.checkOut,
//         },

//         checkOut: {
//           $gt: booking.checkIn,
//         },
//       });

//     if (conflictingBooking) {
//       booking.status = "rejected";

//       booking.rejectionReason =
//         "Property is no longer available for the selected dates.";

//       await booking.save();

//       return res.status(409).json({
//         success: false,
//         message:
//           "Property is already booked for these dates. Booking rejected.",
//       });
//     }

//     /* ================= CONFIRM ================= */

//     booking.status = "confirmed";

//     booking.confirmedBy =
//       req.admin._id;

//     booking.confirmedAt = new Date();

//     booking.rejectionReason = "";

//     await booking.save();

//     return res.status(200).json({
//       success: true,
//       message:
//         "Booking confirmed successfully.",
//       booking,
//     });
//   } catch (error) {
//     console.error(
//       "Confirm booking error:",
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message:
//         "Unable to confirm booking.",
//     });
//   }
// };

// /* =====================================================
//    REJECT BOOKING
//    PATCH /api/admin/bookings/:id/reject
// ===================================================== */

// export const rejectBooking = async (
//   req,
//   res
// ) => {
//   try {
//     if (
//       !mongoose.Types.ObjectId.isValid(
//         req.params.id
//       )
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid booking ID.",
//       });
//     }

//     const {
//       reason = "",
//     } = req.body;

//     const booking =
//       await Booking.findById(
//         req.params.id
//       );

//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: "Booking not found.",
//       });
//     }

//     if (booking.status !== "pending") {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Only pending bookings can be rejected.",
//       });
//     }

//     booking.status = "rejected";

//     booking.rejectionReason =
//       reason.trim() ||
//       "Booking rejected by admin.";

//     await booking.save();

//     return res.status(200).json({
//       success: true,
//       message:
//         "Booking rejected successfully.",
//       booking,
//     });
//   } catch (error) {
//     console.error(
//       "Reject booking error:",
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message:
//         "Unable to reject booking.",
//     });
//   }
// };

// /* =====================================================
//    CANCEL BOOKING BY ADMIN
//    PATCH /api/admin/bookings/:id/cancel
// ===================================================== */

// export const cancelBookingByAdmin = async (
//   req,
//   res
// ) => {
//   try {
//     if (
//       !mongoose.Types.ObjectId.isValid(
//         req.params.id
//       )
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid booking ID.",
//       });
//     }

//     const {
//       reason = "",
//     } = req.body;

//     const booking =
//       await Booking.findById(
//         req.params.id
//       );

//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: "Booking not found.",
//       });
//     }

//     if (
//       [
//         "cancelled",
//         "completed",
//         "rejected",
//       ].includes(booking.status)
//     ) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "This booking cannot be cancelled.",
//       });
//     }

//     booking.status = "cancelled";

//     booking.cancellationReason =
//       reason.trim() ||
//       "Cancelled by admin.";

//     booking.cancelledAt = new Date();

//     await booking.save();

//     return res.status(200).json({
//       success: true,
//       message:
//         "Booking cancelled successfully.",
//       booking,
//     });
//   } catch (error) {
//     console.error(
//       "Admin cancel booking error:",
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message:
//         "Unable to cancel booking.",
//     });
//   }
// };

// /* =====================================================
//    COMPLETE BOOKING
//    PATCH /api/admin/bookings/:id/complete
// ===================================================== */

// export const completeBooking = async (
//   req,
//   res
// ) => {
//   try {
//     if (
//       !mongoose.Types.ObjectId.isValid(
//         req.params.id
//       )
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid booking ID.",
//       });
//     }

//     const booking =
//       await Booking.findById(
//         req.params.id
//       );

//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: "Booking not found.",
//       });
//     }

//     if (booking.status !== "confirmed") {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Only confirmed bookings can be completed.",
//       });
//     }

//     booking.status = "completed";

//     await booking.save();

//     return res.status(200).json({
//       success: true,
//       message:
//         "Booking marked as completed.",
//       booking,
//     });
//   } catch (error) {
//     console.error(
//       "Complete booking error:",
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message:
//         "Unable to complete booking.",
//     });
//   }
// };

// /* =====================================================
//    BOOKING STATS
//    GET /api/admin/bookings/stats
// ===================================================== */

// export const getBookingStats = async (
//   req,
//   res
// ) => {
//   try {
//     const [
//       total,
//       pending,
//       confirmed,
//       rejected,
//       cancelled,
//       completed,
//       paid,
//       unpaid,
//     ] = await Promise.all([
//       Booking.countDocuments(),

//       Booking.countDocuments({
//         status: "pending",
//       }),

//       Booking.countDocuments({
//         status: "confirmed",
//       }),

//       Booking.countDocuments({
//         status: "rejected",
//       }),

//       Booking.countDocuments({
//         status: "cancelled",
//       }),

//       Booking.countDocuments({
//         status: "completed",
//       }),

//       Booking.countDocuments({
//         paymentStatus: "paid",
//       }),

//       Booking.countDocuments({
//         paymentStatus: "pending",
//       }),
//     ]);

//     return res.status(200).json({
//       success: true,
//       stats: {
//         total,
//         pending,
//         confirmed,
//         rejected,
//         cancelled,
//         completed,
//         paid,
//         unpaid,
//       },
//     });
//   } catch (error) {
//     console.error(
//       "Booking stats error:",
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message:
//         "Unable to fetch booking statistics.",
//     });
//   }
// };




import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import Property from "../models/Property.js";

/* =====================================================
   DATE HELPERS
   ===================================================== */

const startOfDay = (date) => {
  const value = new Date(date);

  value.setHours(0, 0, 0, 0);

  return value;
};

const endOfDay = (date) => {
  const value = new Date(date);

  value.setHours(23, 59, 59, 999);

  return value;
};

const startOfMonth = (year, month) => {
  return new Date(year, month, 1, 0, 0, 0, 0);
};

const endOfMonth = (year, month) => {
  return new Date(
    year,
    month + 1,
    0,
    23,
    59,
    59,
    999
  );
};

/* =====================================================
   ACTIVE BOOKING STATUSES
   ===================================================== */

const ACTIVE_BOOKING_STATUSES = [
  "pending",
  "confirmed",
];

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

    const pageNumber = Math.max(
      Number(page) || 1,
      1
    );

    const limitNumber = Math.min(
      Math.max(Number(limit) || 20, 1),
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
            "title city locality rent images owner guests"
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
          "title city locality rent images owner guests"
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
    const { id } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID.",
      });
    }

    const booking =
      await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message:
          "Booking not found.",
      });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({
        success: false,
        message:
          `Booking cannot be confirmed because its current status is ${booking.status}.`,
      });
    }

    /* ===============================================
       CHECK OVERLAPPING CONFIRMED BOOKINGS
       =============================================== */

    const conflictingBooking =
      await Booking.findOne({
        _id: {
          $ne: booking._id,
        },

        property: booking.property,

        status: {
          $in: ["confirmed"],
        },

        checkIn: {
          $lt: booking.checkOut,
        },

        checkOut: {
          $gt: booking.checkIn,
        },
      }).lean();

    if (conflictingBooking) {
      booking.status = "rejected";

      booking.rejectionReason =
        "Property is already booked for the selected dates.";

      await booking.save();

      return res.status(409).json({
        success: false,
        message:
          "Property is already booked for the selected dates.",
        booking,
      });
    }

    booking.status = "confirmed";

    booking.confirmedBy =
      req.admin?._id || null;

    booking.confirmedAt = new Date();

    booking.rejectionReason = "";

    await booking.save();

    const populatedBooking =
      await Booking.findById(
        booking._id
      )
        .populate(
          "user",
          "name email phone avatar"
        )
        .populate(
          "property",
          "title city locality rent images owner guests"
        )
        .populate(
          "confirmedBy",
          "name email"
        )
        .lean();

    return res.status(200).json({
      success: true,
      message:
        "Booking confirmed successfully.",
      booking: populatedBooking,
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
    const { id } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID.",
      });
    }

    const booking =
      await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message:
          "Booking not found.",
      });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({
        success: false,
        message:
          "Only pending bookings can be rejected.",
      });
    }

    const reason =
      typeof req.body?.reason === "string"
        ? req.body.reason.trim()
        : "";

    booking.status = "rejected";

    booking.rejectionReason =
      reason ||
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
    const { id } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID.",
      });
    }

    const booking =
      await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message:
          "Booking not found.",
      });
    }

    if (
      ["cancelled", "completed", "rejected"].includes(
        booking.status
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          `Booking is already ${booking.status}.`,
      });
    }

    const reason =
      typeof req.body?.reason === "string"
        ? req.body.reason.trim()
        : "";

    booking.status = "cancelled";

    booking.cancellationReason =
      reason ||
      "Booking cancelled by admin.";

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
    const { id } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID.",
      });
    }

    const booking =
      await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message:
          "Booking not found.",
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
        "Booking completed successfully.",
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
    const now = new Date();

    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    const [
      total,
      pending,
      confirmed,
      rejected,
      cancelled,
      completed,
      paid,
      unpaid,
      todayCreated,
      todayActive,
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
        paymentStatus: {
          $ne: "paid",
        },
      }),

      /* BOOKINGS CREATED TODAY */

      Booking.countDocuments({
        createdAt: {
          $gte: todayStart,
          $lte: todayEnd,
        },
      }),

      /* BOOKINGS ACTIVE TODAY */

      Booking.countDocuments({
        status: {
          $in: ACTIVE_BOOKING_STATUSES,
        },

        checkIn: {
          $lt: todayEnd,
        },

        checkOut: {
          $gt: todayStart,
        },
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

        todayBookings: todayCreated,

        todayActiveBookings:
          todayActive,
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
        "Unable to fetch booking stats.",
    });
  }
};

/* =====================================================
   BOOKING CALENDAR
   GET /api/admin/bookings/calendar
   =====================================================

   Query:
   ?year=2026&month=8

   month is 1-12
   ===================================================== */

export const getBookingCalendar = async (
  req,
  res
) => {
  try {
    const now = new Date();

    let year = Number(req.query.year);
    let month = Number(req.query.month);

    if (
      !Number.isInteger(year) ||
      year < 2000 ||
      year > 2100
    ) {
      year = now.getFullYear();
    }

    if (
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12
    ) {
      month = now.getMonth() + 1;
    }

    const monthIndex = month - 1;

    const monthStart =
      startOfMonth(
        year,
        monthIndex
      );

    const monthEnd =
      endOfMonth(
        year,
        monthIndex
      );

    /*
      Find every booking which touches
      this calendar month.

      Important:
      checkOut is exclusive.

      Example:
      checkIn  = 10 Sep
      checkOut = 12 Sep

      Occupied:
      10 Sep
      11 Sep

      Available again:
      12 Sep
    */

    const bookings =
      await Booking.find({
        status: {
          $in: ACTIVE_BOOKING_STATUSES,
        },

        checkIn: {
          $lt: monthEnd,
        },

        checkOut: {
          $gt: monthStart,
        },
      })
        .populate(
          "property",
          "title city locality guests rent images"
        )
        .populate(
          "user",
          "name email phone"
        )
        .sort({
          checkIn: 1,
        })
        .lean();

    /* =================================================
       CREATE DAILY CALENDAR
       ================================================= */

    const days = {};

    const cursor = new Date(
      monthStart
    );

    while (cursor <= monthEnd) {
      const key =
        `${cursor.getFullYear()}-${String(
          cursor.getMonth() + 1
        ).padStart(2, "0")}-${String(
          cursor.getDate()
        ).padStart(2, "0")}`;

      days[key] = {
        date: key,
        bookingCount: 0,
        bookedRooms: 0,
        bookings: [],
        status: "AVAILABLE",
      };

      cursor.setDate(
        cursor.getDate() + 1
      );
    }

    /* =================================================
       ADD BOOKINGS TO EACH OCCUPIED DAY
       ================================================= */

    for (const booking of bookings) {
      const checkIn = startOfDay(
        booking.checkIn
      );

      const checkOut = startOfDay(
        booking.checkOut
      );

      const bookingRooms =
        Math.max(
          Number(booking.rooms) || 1,
          1
        );

      const propertyId =
        booking.property?._id?.toString() ||
        booking.property?.toString();

      const propertyTitle =
        booking.property?.title ||
        "Property";

      /*
        Start from check-in.
        Checkout date is NOT occupied.
      */

      const dayCursor =
        new Date(checkIn);

      while (
        dayCursor < checkOut
      ) {
        if (
          dayCursor >= monthStart &&
          dayCursor <= monthEnd
        ) {
          const key =
            `${dayCursor.getFullYear()}-${String(
              dayCursor.getMonth() + 1
            ).padStart(2, "0")}-${String(
              dayCursor.getDate()
            ).padStart(2, "0")}`;

          if (days[key]) {
            days[key].bookingCount += 1;

            days[key].bookedRooms +=
              bookingRooms;

            days[key].bookings.push({
              _id: booking._id,

              propertyId,

              propertyTitle,

              guestName:
                booking.guestName ||
                booking.user?.name ||
                "Guest",

              guestPhone:
                booking.guestPhone ||
                booking.user?.phone ||
                "",

              guestEmail:
                booking.guestEmail ||
                booking.user?.email ||
                "",

              checkIn:
                booking.checkIn,

              checkOut:
                booking.checkOut,

              rooms:
                bookingRooms,

              guests:
                Number(
                  booking.guests
                ) || 1,

              status:
                booking.status,

              paymentStatus:
                booking.paymentStatus,

              totalAmount:
                booking.totalAmount,
            });
          }
        }

        dayCursor.setDate(
          dayCursor.getDate() + 1
        );
      }
    }

    /* =================================================
       FINAL DAY STATUS
       ================================================= */

    Object.values(days).forEach(
      (day) => {
        /*
          Current system treats one property
          as one bookable unit.

          Therefore if any active booking
          occupies the property, day becomes FULL.

          Later, if Property gets totalRooms,
          this can be upgraded to:
          bookedRooms >= totalRooms.
        */

        if (
          day.bookingCount > 0
        ) {
          day.status = "FULL";
        } else {
          day.status = "AVAILABLE";
        }
      }
    );

    const dayList =
      Object.values(days);

    const todayKey =
      `${now.getFullYear()}-${String(
        now.getMonth() + 1
      ).padStart(2, "0")}-${String(
        now.getDate()
      ).padStart(2, "0")}`;

    const today =
      days[todayKey] || {
        date: todayKey,
        bookingCount: 0,
        bookedRooms: 0,
        bookings: [],
        status: "AVAILABLE",
      };

    const totalBookings =
      bookings.length;

    const bookedDays =
      dayList.filter(
        (day) =>
          day.bookingCount > 0
      ).length;

    const availableDays =
      dayList.filter(
        (day) =>
          day.bookingCount === 0
      ).length;

    const fullDays =
      dayList.filter(
        (day) =>
          day.status === "FULL"
      ).length;

    return res.status(200).json({
      success: true,

      calendar: {
        year,
        month,

        monthStart,
        monthEnd,

        today,

        totalBookings,

        bookedDays,

        availableDays,

        fullDays,

        days: dayList,
      },
    });
  } catch (error) {
    console.error(
      "Booking calendar error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch booking calendar.",
    });
  }
};