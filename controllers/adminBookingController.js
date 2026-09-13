

// import mongoose from "mongoose";
// import Booking from "../models/Booking.js";

// /* =====================================================
//    DATE HELPERS
// ===================================================== */

// const startOfDay = (date) => {
//   const value = new Date(date);

//   value.setHours(0, 0, 0, 0);

//   return value;
// };

// const endOfDay = (date) => {
//   const value = new Date(date);

//   value.setHours(23, 59, 59, 999);

//   return value;
// };

// const startOfMonth = (year, month) => {
//   return new Date(
//     year,
//     month,
//     1,
//     0,
//     0,
//     0,
//     0
//   );
// };

// const endOfMonth = (year, month) => {
//   return new Date(
//     year,
//     month + 1,
//     0,
//     23,
//     59,
//     59,
//     999
//   );
// };

// /* =====================================================
//    ACTIVE BOOKING STATUSES

//    ONLY CONFIRMED BOOKING BLOCKS PROPERTY.

//    pending   -> NOT BLOCKED
//    confirmed -> BLOCKED
//    rejected  -> NOT BLOCKED
//    cancelled -> NOT BLOCKED
//    completed -> NOT BLOCKED
// ===================================================== */

// const ACTIVE_BOOKING_STATUSES = [
//   "confirmed",
// ];

// /* =====================================================
//    POPULATE HELPER
// ===================================================== */

// const populateBooking = (query) => {
//   return query
//     .populate(
//       "user",
//       "name email phone avatar"
//     )
//     .populate(
//       "property",
//       "title city locality rent images owner maxGuests"
//     )
//     .populate(
//       "confirmedBy",
//       "name email"
//     );
// };

// /* =====================================================
//    GET ALL BOOKINGS
//    GET /api/admin/bookings
// ===================================================== */

// export const getAdminBookings = async (
//   req,
//   res
// ) => {
//   try {
//     const {
//       status,
//       page = 1,
//       limit = 20,
//     } = req.query;

//     const filter = {};

//     /* =================================================
//        STATUS FILTER
//     ================================================= */

//     if (status) {
//       filter.status = status;
//     }

//     /* =================================================
//        PAGINATION
//     ================================================= */

//     const pageNumber = Math.max(
//       Number(page) || 1,
//       1
//     );

//     const limitNumber = Math.min(
//       Math.max(
//         Number(limit) || 20,
//         1
//       ),
//       100
//     );

//     const skip =
//       (pageNumber - 1) *
//       limitNumber;

//     /* =================================================
//        FETCH BOOKINGS + TOTAL
//     ================================================= */

//     const [
//       bookings,
//       total,
//     ] = await Promise.all([
//       populateBooking(
//         Booking.find(filter)
//       )
//         .sort({
//           createdAt: -1,
//         })
//         .skip(skip)
//         .limit(limitNumber)
//         .lean(),

//       Booking.countDocuments(
//         filter
//       ),
//     ]);

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
//       await populateBooking(
//         Booking.find({
//           status: "pending",
//         })
//       )
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



// export const confirmBooking = async (
//   req,
//   res
// ) => {
//   try {
//     const { id } =
//       req.params;

//     /* =================================================
//        VALIDATE BOOKING ID
//     ================================================= */

//     if (
//       !mongoose.Types.ObjectId.isValid(
//         id
//       )
//     ) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Invalid booking ID.",
//       });
//     }

//     /* =================================================
//        FIND BOOKING
//     ================================================= */

//     const booking =
//       await Booking.findById(id);

//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message:
//           "Booking not found.",
//       });
//     }

//     /* =================================================
//        ONLY PENDING CAN BE CONFIRMED
//     ================================================= */

//     if (
//       booking.status !==
//       "pending"
//     ) {
//       return res.status(400).json({
//         success: false,
//         message:
//           `Booking cannot be confirmed because its current status is ${booking.status}.`,
//       });
//     }

//     /* =================================================
//        CHECK CONFIRMED BOOKING CONFLICT
//     ================================================= */

//     const conflictingBooking =
//       await Booking.findOne({
//         _id: {
//           $ne: booking._id,
//         },

//         property:
//           booking.property,

//         status:
//           "confirmed",

//         checkIn: {
//           $lt:
//             booking.checkOut,
//         },

//         checkOut: {
//           $gt:
//             booking.checkIn,
//         },
//       }).lean();

//     /* =================================================
//        ALREADY BOOKED
//     ================================================= */

//     if (
//       conflictingBooking
//     ) {
//       booking.status =
//         "rejected";

//       booking.rejectionReason =
//         "Property is already booked for the selected dates.";

//       await booking.save();

//       return res.status(409).json({
//         success: false,
//         message:
//           "Property is already booked for the selected dates.",
//         booking,
//       });
//     }

//     /* =================================================
//        CONFIRM SELECTED BOOKING
//     ================================================= */

//     booking.status =
//       "confirmed";

//     booking.confirmedBy =
//       req.admin?._id ||
//       req.user?._id ||
//       null;

//     booking.confirmedAt =
//       new Date();

//     booking.rejectionReason =
//       "";

//     await booking.save();

//     /* =================================================
//        REJECT OTHER OVERLAPPING PENDING REQUESTS

//        Same property
//        +
//        overlapping dates
//        +
//        pending status
//        +
//        different booking ID
//     ================================================= */

//     const rejectionResult =
//       await Booking.updateMany(
//         {
//           _id: {
//             $ne:
//               booking._id,
//           },

//           property:
//             booking.property,

//           status:
//             "pending",

//           checkIn: {
//             $lt:
//               booking.checkOut,
//           },

//           checkOut: {
//             $gt:
//               booking.checkIn,
//           },
//         },
//         {
//           $set: {
//             status:
//               "rejected",

//             rejectionReason:
//               "Property is already booked for the selected dates.",
//           },
//         }
//       );

//     /* =================================================
//        GET POPULATED CONFIRMED BOOKING
//     ================================================= */

//     const populatedBooking =
//       await populateBooking(
//         Booking.findById(
//           booking._id
//         )
//       ).lean();

//     return res.status(200).json({
//       success: true,

//       message:
//         "Booking confirmed successfully.",

//       booking:
//         populatedBooking,

//       rejectedPendingRequests:
//         rejectionResult.modifiedCount ||
//         0,
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
//     const { id } =
//       req.params;

//     /* =================================================
//        VALIDATE ID
//     ================================================= */

//     if (
//       !mongoose.Types.ObjectId.isValid(
//         id
//       )
//     ) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Invalid booking ID.",
//       });
//     }

//     /* =================================================
//        FIND BOOKING
//     ================================================= */

//     const booking =
//       await Booking.findById(id);

//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message:
//           "Booking not found.",
//       });
//     }

//     /* =================================================
//        ONLY PENDING CAN BE REJECTED
//     ================================================= */

//     if (
//       booking.status !==
//       "pending"
//     ) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Only pending bookings can be rejected.",
//       });
//     }

//     /* =================================================
//        REJECTION REASON
//     ================================================= */

//     const reason =
//       typeof req.body?.reason ===
//       "string"
//         ? req.body.reason.trim()
//         : "";

//     booking.status =
//       "rejected";

//     booking.rejectionReason =
//       reason ||
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

// export const cancelBookingByAdmin =
//   async (
//     req,
//     res
//   ) => {
//     try {
//       const { id } =
//         req.params;

//       /* ===============================================
//          VALIDATE ID
//       =============================================== */

//       if (
//         !mongoose.Types.ObjectId.isValid(
//           id
//         )
//       ) {
//         return res.status(400).json({
//           success: false,
//           message:
//             "Invalid booking ID.",
//         });
//       }

//       /* ===============================================
//          FIND BOOKING
//       =============================================== */

//       const booking =
//         await Booking.findById(
//           id
//         );

//       if (!booking) {
//         return res.status(404).json({
//           success: false,
//           message:
//             "Booking not found.",
//         });
//       }

//       /* ===============================================
//          CHECK CURRENT STATUS
//       =============================================== */

//       if (
//         [
//           "cancelled",
//           "completed",
//           "rejected",
//         ].includes(
//           booking.status
//         )
//       ) {
//         return res.status(400).json({
//           success: false,
//           message:
//             `Booking is already ${booking.status}.`,
//         });
//       }

//       /* ===============================================
//          CANCELLATION REASON
//       =============================================== */

//       const reason =
//         typeof req.body?.reason ===
//         "string"
//           ? req.body.reason.trim()
//           : "";

//       booking.status =
//         "cancelled";

//       booking.cancellationReason =
//         reason ||
//         "Booking cancelled by admin.";

//       booking.cancelledAt =
//         new Date();

//       await booking.save();

//       return res.status(200).json({
//         success: true,

//         message:
//           "Booking cancelled successfully.",

//         booking,
//       });
//     } catch (error) {
//       console.error(
//         "Admin cancel booking error:",
//         error
//       );

//       return res.status(500).json({
//         success: false,
//         message:
//           "Unable to cancel booking.",
//       });
//     }
//   };

// /* =====================================================
//    COMPLETE BOOKING
//    PATCH /api/admin/bookings/:id/complete
// ===================================================== */

// export const completeBooking =
//   async (
//     req,
//     res
//   ) => {
//     try {
//       const { id } =
//         req.params;

//       /* ===============================================
//          VALIDATE ID
//       =============================================== */

//       if (
//         !mongoose.Types.ObjectId.isValid(
//           id
//         )
//       ) {
//         return res.status(400).json({
//           success: false,
//           message:
//             "Invalid booking ID.",
//         });
//       }

//       /* ===============================================
//          FIND BOOKING
//       =============================================== */

//       const booking =
//         await Booking.findById(
//           id
//         );

//       if (!booking) {
//         return res.status(404).json({
//           success: false,
//           message:
//             "Booking not found.",
//         });
//       }

//       /* ===============================================
//          ONLY CONFIRMED CAN BE COMPLETED
//       =============================================== */

//       if (
//         booking.status !==
//         "confirmed"
//       ) {
//         return res.status(400).json({
//           success: false,
//           message:
//             "Only confirmed bookings can be completed.",
//         });
//       }

//       booking.status =
//         "completed";

//       await booking.save();

//       return res.status(200).json({
//         success: true,

//         message:
//           "Booking completed successfully.",

//         booking,
//       });
//     } catch (error) {
//       console.error(
//         "Complete booking error:",
//         error
//       );

//       return res.status(500).json({
//         success: false,
//         message:
//           "Unable to complete booking.",
//       });
//     }
//   };

// /* =====================================================
//    BOOKING STATS
//    GET /api/admin/bookings/stats
// ===================================================== */

// export const getBookingStats =
//   async (
//     req,
//     res
//   ) => {
//     try {
//       const now =
//         new Date();

//       const todayStart =
//         startOfDay(now);

//       const todayEnd =
//         endOfDay(now);

//       /* ===============================================
//          RUN COUNTS TOGETHER
//       =============================================== */

//       const [
//         total,
//         pending,
//         confirmed,
//         rejected,
//         cancelled,
//         completed,
//         todayBookings,
//         todayActiveBookings,
//       ] = await Promise.all([
//         /* TOTAL */

//         Booking.countDocuments(),

//         /* PENDING */

//         Booking.countDocuments({
//           status:
//             "pending",
//         }),

//         /* CONFIRMED */

//         Booking.countDocuments({
//           status:
//             "confirmed",
//         }),

//         /* REJECTED */

//         Booking.countDocuments({
//           status:
//             "rejected",
//         }),

//         /* CANCELLED */

//         Booking.countDocuments({
//           status:
//             "cancelled",
//         }),

//         /* COMPLETED */

//         Booking.countDocuments({
//           status:
//             "completed",
//         }),

//         /* CREATED TODAY */

//         Booking.countDocuments({
//           createdAt: {
//             $gte:
//               todayStart,

//             $lte:
//               todayEnd,
//           },
//         }),

//         /* ACTIVE TODAY */

//         Booking.countDocuments({
//           status: {
//             $in:
//               ACTIVE_BOOKING_STATUSES,
//           },

//           checkIn: {
//             $lt:
//               todayEnd,
//           },

//           checkOut: {
//             $gt:
//               todayStart,
//           },
//         }),
//       ]);

//       return res.status(200).json({
//         success: true,

//         stats: {
//           total,

//           pending,

//           confirmed,

//           rejected,

//           cancelled,

//           completed,

//           todayBookings,

//           todayActiveBookings,
//         },
//       });
//     } catch (error) {
//       console.error(
//         "Booking stats error:",
//         error
//       );

//       return res.status(500).json({
//         success: false,
//         message:
//           "Unable to fetch booking stats.",
//       });
//     }
//   };

// /* =====================================================
//    BOOKING CALENDAR
//    GET /api/admin/bookings/calendar

//    Example:

//    /api/admin/bookings/calendar?year=2026&month=9

//    month = 1 - 12

//    ONLY CONFIRMED BOOKINGS ARE SHOWN
//    AS BOOKED.

//    CHECKOUT DATE IS NOT OCCUPIED.
// ===================================================== */

// export const getBookingCalendar =
//   async (
//     req,
//     res
//   ) => {
//     try {
//       const now =
//         new Date();

//       let year =
//         Number(
//           req.query.year
//         );

//       let month =
//         Number(
//           req.query.month
//         );

//       /* ===============================================
//          VALIDATE YEAR
//       =============================================== */

//       if (
//         !Number.isInteger(
//           year
//         ) ||
//         year < 2000 ||
//         year > 2100
//       ) {
//         year =
//           now.getFullYear();
//       }

//       /* ===============================================
//          VALIDATE MONTH
//       =============================================== */

//       if (
//         !Number.isInteger(
//           month
//         ) ||
//         month < 1 ||
//         month > 12
//       ) {
//         month =
//           now.getMonth() + 1;
//       }

//       const monthIndex =
//         month - 1;

//       const monthStart =
//         startOfMonth(
//           year,
//           monthIndex
//         );

//       const monthEnd =
//         endOfMonth(
//           year,
//           monthIndex
//         );

//       /* ===============================================
//          GET CONFIRMED BOOKINGS ONLY

//          pending   -> NOT BOOKED
//          confirmed -> BOOKED
//          rejected  -> NOT BOOKED
//          cancelled -> NOT BOOKED
//          completed -> NOT BOOKED
//       =============================================== */

//       const bookings =
//         await Booking.find({
//           status:
//             "confirmed",

//           checkIn: {
//             $lt:
//               monthEnd,
//           },

//           checkOut: {
//             $gt:
//               monthStart,
//           },
//         })
//           .populate(
//             "property",
//             "title city locality maxGuests rent images"
//           )
//           .populate(
//             "user",
//             "name email phone"
//           )
//           .sort({
//             checkIn: 1,
//           })
//           .lean();

//       /* ===============================================
//          CREATE EVERY DAY OF MONTH
//       =============================================== */

//       const days = {};

//       const cursor =
//         new Date(
//           monthStart
//         );

//       while (
//         cursor <= monthEnd
//       ) {
//         const key =
//           `${cursor.getFullYear()}-${String(
//             cursor.getMonth() + 1
//           ).padStart(2, "0")}-${String(
//             cursor.getDate()
//           ).padStart(2, "0")}`;

//         days[key] = {
//           date: key,

//           bookingCount: 0,

//           bookings: [],

//           status:
//             "AVAILABLE",
//         };

//         cursor.setDate(
//           cursor.getDate() +
//             1
//         );
//       }

//       /* ===============================================
//          ADD CONFIRMED BOOKINGS TO DAYS
//       =============================================== */

//       for (
//         const booking of bookings
//       ) {
//         const checkIn =
//           startOfDay(
//             booking.checkIn
//           );

//         const checkOut =
//           startOfDay(
//             booking.checkOut
//           );

//         const propertyId =
//           booking.property?._id
//             ?.toString() ||
//           "";

//         const propertyTitle =
//           booking.property?.title ||
//           "Property";

//         const dayCursor =
//           new Date(
//             checkIn
//           );

//         /* =============================================
//            CHECKOUT DATE IS NOT OCCUPIED
//         ============================================= */

//         while (
//           dayCursor <
//           checkOut
//         ) {
//           if (
//             dayCursor >=
//               monthStart &&
//             dayCursor <=
//               monthEnd
//           ) {
//             const key =
//               `${dayCursor.getFullYear()}-${String(
//                 dayCursor.getMonth() + 1
//               ).padStart(2, "0")}-${String(
//                 dayCursor.getDate()
//               ).padStart(2, "0")}`;

//             if (days[key]) {
//               days[key]
//                 .bookingCount +=
//                 1;

//               days[key]
//                 .bookings.push({
//                   _id:
//                     booking._id,

//                   propertyId,

//                   propertyTitle,

//                   guestName:
//                     booking.guestName ||
//                     booking.user?.name ||
//                     "Guest",

//                   guestPhone:
//                     booking.guestPhone ||
//                     booking.user?.phone ||
//                     "",

//                   guestEmail:
//                     booking.guestEmail ||
//                     booking.user?.email ||
//                     "",

//                   checkIn:
//                     booking.checkIn,

//                   checkOut:
//                     booking.checkOut,

//                   guests:
//                     Number(
//                       booking.guests
//                     ) || 1,

//                   status:
//                     booking.status,

//                   pricePerNight:
//                     booking.pricePerNight,

//                   nights:
//                     booking.nights,

//                   subtotal:
//                     booking.subtotal,

//                   taxes:
//                     booking.taxes ||
//                     0,

//                   totalAmount:
//                     booking.totalAmount,
//                 });
//             }
//           }

//           dayCursor.setDate(
//             dayCursor.getDate() +
//               1
//           );
//         }
//       }

//       /* ===============================================
//          SET DAY STATUS
//       =============================================== */

//       Object.values(
//         days
//       ).forEach(
//         (day) => {
//           day.status =
//             day.bookingCount >
//             0
//               ? "FULL"
//               : "AVAILABLE";
//         }
//       );

//       /* ===============================================
//          DAY LIST
//       =============================================== */

//       const dayList =
//         Object.values(
//           days
//         );

//       /* ===============================================
//          TODAY
//       =============================================== */

//       const todayKey =
//         `${now.getFullYear()}-${String(
//           now.getMonth() + 1
//         ).padStart(2, "0")}-${String(
//           now.getDate()
//         ).padStart(2, "0")}`;

//       const today =
//         days[todayKey] || {
//           date:
//             todayKey,

//           bookingCount:
//             0,

//           bookings: [],

//           status:
//             "AVAILABLE",
//         };

//       /* ===============================================
//          CALENDAR SUMMARY
//       =============================================== */

//       const totalBookings =
//         bookings.length;

//       const bookedDays =
//         dayList.filter(
//           (day) =>
//             day.bookingCount >
//             0
//         ).length;

//       const availableDays =
//         dayList.filter(
//           (day) =>
//             day.bookingCount ===
//             0
//         ).length;

//       const fullDays =
//         dayList.filter(
//           (day) =>
//             day.status ===
//             "FULL"
//         ).length;

//       /* ===============================================
//          RESPONSE
//       =============================================== */

//       return res.status(200).json({
//         success: true,

//         year,

//         month,

//         monthStart,

//         monthEnd,

//         today,

//         totalBookings,

//         bookedDays,

//         availableDays,

//         fullDays,

//         calendar:
//           dayList,
//       });
//     } catch (error) {
//       console.error(
//         "Booking calendar error:",
//         error
//       );

//       return res.status(500).json({
//         success: false,
//         message:
//           "Unable to fetch booking calendar.",
//       });
//     }
//   };


//   export const getAdminBookingById = async (req, res) => {
// try {
// const { id } = req.params;

// if (!mongoose.Types.ObjectId.isValid(id)) {
//   return res.status(400).json({
//     success: false,
//     message: "Invalid booking ID.",
//   });
// }

// const booking = await populateBooking(
//   Booking.findById(id)
// );

// if (!booking) {
//   return res.status(404).json({
//     success: false,
//     message: "Booking not found.",
//   });
// }

// return res.status(200).json({
//   success: true,
//   booking,
// });

// } catch (error) {
// console.error("Admin get booking by id error:", error);

// return res.status(500).json({
//   success: false,
//   message: "Unable to fetch booking details.",
// });

// }
// };




import mongoose from "mongoose";
import { Readable } from "stream";
import Booking from "../models/Booking.js";
import cloudinary from "../config/cloudinary.js";

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
  return new Date(
    year,
    month,
    1,
    0,
    0,
    0,
    0
  );
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

   ONLY CONFIRMED BOOKING BLOCKS PROPERTY.

   pending   -> NOT BLOCKED
   confirmed -> BLOCKED
   rejected  -> NOT BLOCKED
   cancelled -> NOT BLOCKED
   completed -> NOT BLOCKED
===================================================== */

const ACTIVE_BOOKING_STATUSES = [
  "confirmed",
];

/* =====================================================
   POPULATE HELPER
===================================================== */

const populateBooking = (query) => {
  return query
    .populate(
      "user",
      "name email phone avatar"
    )
    .populate(
      "property",
      "title city locality rent images owner maxGuests"
    )
    .populate(
      "confirmedBy",
      "name email"
    );
};

/* =====================================================
   GET ALL BOOKINGS
   GET /api/admin/bookings
===================================================== */

export const getAdminBookings = async (
  req,
  res
) => {
  try {
    const {
      status,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};

    /* =================================================
       STATUS FILTER
    ================================================= */

    if (status) {
      filter.status = status;
    }

    /* =================================================
       PAGINATION
    ================================================= */

    const pageNumber = Math.max(
      Number(page) || 1,
      1
    );

    const limitNumber = Math.min(
      Math.max(
        Number(limit) || 20,
        1
      ),
      100
    );

    const skip =
      (pageNumber - 1) *
      limitNumber;

    /* =================================================
       FETCH BOOKINGS + TOTAL
    ================================================= */

    const [
      bookings,
      total,
    ] = await Promise.all([
      populateBooking(
        Booking.find(filter)
      )
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limitNumber)
        .lean(),

      Booking.countDocuments(
        filter
      ),
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
      await populateBooking(
        Booking.find({
          status: "pending",
        })
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



export const confirmBooking = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    /* =================================================
       VALIDATE BOOKING ID
    ================================================= */

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid booking ID.",
      });
    }

    /* =================================================
       FIND BOOKING
    ================================================= */

    const booking =
      await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message:
          "Booking not found.",
      });
    }

    /* =================================================
       ONLY PENDING CAN BE CONFIRMED
    ================================================= */

    if (
      booking.status !==
      "pending"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Booking cannot be confirmed because its current status is " +
          booking.status +
          ".",
      });
    }

    if (booking.paymentStatus !== "paid") {
      return res.status(400).json({
        success: false,
        message:
          "Please complete payment before confirming the booking.",
      });
    }

    if (
      !Array.isArray(booking.documents) ||
      booking.documents.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please upload customer documents before confirming the booking.",
      });
    }

    /* =================================================
       CHECK CONFIRMED BOOKING CONFLICT
    ================================================= */

    const conflictingBooking =
      await Booking.findOne({
        _id: {
          $ne: booking._id,
        },

        property:
          booking.property,

        status:
          "confirmed",

        checkIn: {
          $lt:
            booking.checkOut,
        },

        checkOut: {
          $gt:
            booking.checkIn,
        },
      }).lean();

    /* =================================================
       ALREADY BOOKED
    ================================================= */

    if (
      conflictingBooking
    ) {
      booking.status =
        "rejected";

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

    /* =================================================
       CONFIRM SELECTED BOOKING
    ================================================= */

    booking.status =
      "confirmed";

    booking.confirmedBy =
      req.admin?._id ||
      req.user?._id ||
      null;

    booking.confirmedAt =
      new Date();

    booking.rejectionReason =
      "";

    await booking.save();

    /* =================================================
       REJECT OTHER OVERLAPPING PENDING REQUESTS

       Same property
       +
       overlapping dates
       +
       pending status
       +
       different booking ID
    ================================================= */

    const rejectionResult =
      await Booking.updateMany(
        {
          _id: {
            $ne:
              booking._id,
          },

          property:
            booking.property,

          status:
            "pending",

          checkIn: {
            $lt:
              booking.checkOut,
          },

          checkOut: {
            $gt:
              booking.checkIn,
          },
        },
        {
          $set: {
            status:
              "rejected",

            rejectionReason:
              "Property is already booked for the selected dates.",
          },
        }
      );

    /* =================================================
       GET POPULATED CONFIRMED BOOKING
    ================================================= */

    const populatedBooking =
      await populateBooking(
        Booking.findById(
          booking._id
        )
      ).lean();

    return res.status(200).json({
      success: true,

      message:
        "Booking confirmed successfully.",

      booking:
        populatedBooking,

      rejectedPendingRequests:
        rejectionResult.modifiedCount ||
        0,
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
    const { id } =
      req.params;

    /* =================================================
       VALIDATE ID
    ================================================= */

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid booking ID.",
      });
    }

    /* =================================================
       FIND BOOKING
    ================================================= */

    const booking =
      await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message:
          "Booking not found.",
      });
    }

    /* =================================================
       ONLY PENDING CAN BE REJECTED
    ================================================= */

    if (
      booking.status !==
      "pending"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Only pending bookings can be rejected.",
      });
    }

    /* =================================================
       REJECTION REASON
    ================================================= */

    const reason =
      typeof req.body?.reason ===
      "string"
        ? req.body.reason.trim()
        : "";

    booking.status =
      "rejected";

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

export const cancelBookingByAdmin =
  async (
    req,
    res
  ) => {
    try {
      const { id } =
        req.params;

      /* ===============================================
         VALIDATE ID
      =============================================== */

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid booking ID.",
        });
      }

      /* ===============================================
         FIND BOOKING
      =============================================== */

      const booking =
        await Booking.findById(
          id
        );

      if (!booking) {
        return res.status(404).json({
          success: false,
          message:
            "Booking not found.",
        });
      }

      /* ===============================================
         CHECK CURRENT STATUS
      =============================================== */

      if (
        [
          "cancelled",
          "completed",
          "rejected",
        ].includes(
          booking.status
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Booking is already ${booking.status}.`,
        });
      }

      /* ===============================================
         CANCELLATION REASON
      =============================================== */

      const reason =
        typeof req.body?.reason ===
        "string"
          ? req.body.reason.trim()
          : "";

      booking.status =
        "cancelled";

      booking.cancellationReason =
        reason ||
        "Booking cancelled by admin.";

      booking.cancelledAt =
        new Date();

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

export const completeBooking =
  async (
    req,
    res
  ) => {
    try {
      const { id } =
        req.params;

      /* ===============================================
         VALIDATE ID
      =============================================== */

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid booking ID.",
        });
      }

      /* ===============================================
         FIND BOOKING
      =============================================== */

      const booking =
        await Booking.findById(
          id
        );

      if (!booking) {
        return res.status(404).json({
          success: false,
          message:
            "Booking not found.",
        });
      }

      /* ===============================================
         ONLY CONFIRMED CAN BE COMPLETED
      =============================================== */

      if (
        booking.status !==
        "confirmed"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Only confirmed bookings can be completed.",
        });
      }

      booking.status =
        "completed";

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

export const getBookingStats =
  async (
    req,
    res
  ) => {
    try {
      const now =
        new Date();

      const todayStart =
        startOfDay(now);

      const todayEnd =
        endOfDay(now);

      /* ===============================================
         RUN COUNTS TOGETHER
      =============================================== */

      const [
        total,
        pending,
        confirmed,
        rejected,
        cancelled,
        completed,
        todayBookings,
        todayActiveBookings,
      ] = await Promise.all([
        /* TOTAL */

        Booking.countDocuments(),

        /* PENDING */

        Booking.countDocuments({
          status:
            "pending",
        }),

        /* CONFIRMED */

        Booking.countDocuments({
          status:
            "confirmed",
        }),

        /* REJECTED */

        Booking.countDocuments({
          status:
            "rejected",
        }),

        /* CANCELLED */

        Booking.countDocuments({
          status:
            "cancelled",
        }),

        /* COMPLETED */

        Booking.countDocuments({
          status:
            "completed",
        }),

        /* CREATED TODAY */

        Booking.countDocuments({
          createdAt: {
            $gte:
              todayStart,

            $lte:
              todayEnd,
          },
        }),

        /* ACTIVE TODAY */

        Booking.countDocuments({
          status: {
            $in:
              ACTIVE_BOOKING_STATUSES,
          },

          checkIn: {
            $lt:
              todayEnd,
          },

          checkOut: {
            $gt:
              todayStart,
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

          todayBookings,

          todayActiveBookings,
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

   Example:

   /api/admin/bookings/calendar?year=2026&month=9

   month = 1 - 12

   ONLY CONFIRMED BOOKINGS ARE SHOWN
   AS BOOKED.

   CHECKOUT DATE IS NOT OCCUPIED.
===================================================== */

export const getBookingCalendar =
  async (
    req,
    res
  ) => {
    try {
      const now =
        new Date();

      let year =
        Number(
          req.query.year
        );

      let month =
        Number(
          req.query.month
        );

      /* ===============================================
         VALIDATE YEAR
      =============================================== */

      if (
        !Number.isInteger(
          year
        ) ||
        year < 2000 ||
        year > 2100
      ) {
        year =
          now.getFullYear();
      }

      /* ===============================================
         VALIDATE MONTH
      =============================================== */

      if (
        !Number.isInteger(
          month
        ) ||
        month < 1 ||
        month > 12
      ) {
        month =
          now.getMonth() + 1;
      }

      const monthIndex =
        month - 1;

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

      /* ===============================================
         GET CONFIRMED BOOKINGS ONLY

         pending   -> NOT BOOKED
         confirmed -> BOOKED
         rejected  -> NOT BOOKED
         cancelled -> NOT BOOKED
         completed -> NOT BOOKED
      =============================================== */

      const bookings =
        await Booking.find({
          status:
            "confirmed",

          checkIn: {
            $lt:
              monthEnd,
          },

          checkOut: {
            $gt:
              monthStart,
          },
        })
          .populate(
            "property",
            "title city locality maxGuests rent images"
          )
          .populate(
            "user",
            "name email phone"
          )
          .sort({
            checkIn: 1,
          })
          .lean();

      /* ===============================================
         CREATE EVERY DAY OF MONTH
      =============================================== */

      const days = {};

      const cursor =
        new Date(
          monthStart
        );

      while (
        cursor <= monthEnd
      ) {
        const key =
          `${cursor.getFullYear()}-${String(
            cursor.getMonth() + 1
          ).padStart(2, "0")}-${String(
            cursor.getDate()
          ).padStart(2, "0")}`;

        days[key] = {
          date: key,

          bookingCount: 0,

          bookings: [],

          status:
            "AVAILABLE",
        };

        cursor.setDate(
          cursor.getDate() +
            1
        );
      }

      /* ===============================================
         ADD CONFIRMED BOOKINGS TO DAYS
      =============================================== */

      for (
        const booking of bookings
      ) {
        const checkIn =
          startOfDay(
            booking.checkIn
          );

        const checkOut =
          startOfDay(
            booking.checkOut
          );

        const propertyId =
          booking.property?._id
            ?.toString() ||
          "";

        const propertyTitle =
          booking.property?.title ||
          "Property";

        const dayCursor =
          new Date(
            checkIn
          );

        /* =============================================
           CHECKOUT DATE IS NOT OCCUPIED
        ============================================= */

        while (
          dayCursor <
          checkOut
        ) {
          if (
            dayCursor >=
              monthStart &&
            dayCursor <=
              monthEnd
          ) {
            const key =
              `${dayCursor.getFullYear()}-${String(
                dayCursor.getMonth() + 1
              ).padStart(2, "0")}-${String(
                dayCursor.getDate()
              ).padStart(2, "0")}`;

            if (days[key]) {
              days[key]
                .bookingCount +=
                1;

              days[key]
                .bookings.push({
                  _id:
                    booking._id,

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

                  guests:
                    Number(
                      booking.guests
                    ) || 1,

                  status:
                    booking.status,

                  pricePerNight:
                    booking.pricePerNight,

                  nights:
                    booking.nights,

                  subtotal:
                    booking.subtotal,

                  taxes:
                    booking.taxes ||
                    0,

                  totalAmount:
                    booking.totalAmount,
                });
            }
          }

          dayCursor.setDate(
            dayCursor.getDate() +
              1
          );
        }
      }

      /* ===============================================
         SET DAY STATUS
      =============================================== */

      Object.values(
        days
      ).forEach(
        (day) => {
          day.status =
            day.bookingCount >
            0
              ? "FULL"
              : "AVAILABLE";
        }
      );

      /* ===============================================
         DAY LIST
      =============================================== */

      const dayList =
        Object.values(
          days
        );

      /* ===============================================
         TODAY
      =============================================== */

      const todayKey =
        `${now.getFullYear()}-${String(
          now.getMonth() + 1
        ).padStart(2, "0")}-${String(
          now.getDate()
        ).padStart(2, "0")}`;

      const today =
        days[todayKey] || {
          date:
            todayKey,

          bookingCount:
            0,

          bookings: [],

          status:
            "AVAILABLE",
        };

      /* ===============================================
         CALENDAR SUMMARY
      =============================================== */

      const totalBookings =
        bookings.length;

      const bookedDays =
        dayList.filter(
          (day) =>
            day.bookingCount >
            0
        ).length;

      const availableDays =
        dayList.filter(
          (day) =>
            day.bookingCount ===
            0
        ).length;

      const fullDays =
        dayList.filter(
          (day) =>
            day.status ===
            "FULL"
        ).length;

      /* ===============================================
         RESPONSE
      =============================================== */

      return res.status(200).json({
        success: true,

        year,

        month,

        monthStart,

        monthEnd,

        today,

        totalBookings,

        bookedDays,

        availableDays,

        fullDays,

        calendar:
          dayList,
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

/* =====================================================
   GET BOOKING BY ID
   GET /api/admin/bookings/:id
===================================================== */

export const getAdminBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID.",
      });
    }

    const booking = await populateBooking(
      Booking.findById(id)
    ).lean();

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
      "Admin get booking by id error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to fetch booking details.",
    });
  }
};


/* =====================================================
   UPDATE BOOKING PAYMENT
   PATCH /api/admin/bookings/:id/payment
===================================================== */

export const updateBookingPayment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID.",
      });
    }

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    const {
      paymentStatus,
      paymentMethod,
      paymentAmount,
      paymentReference,
      paymentNote,
    } = req.body || {};

    const allowedStatuses = [
      "pending",
      "partial",
      "paid",
      "refunded",
    ];

    if (
      paymentStatus !== undefined &&
      !allowedStatuses.includes(paymentStatus)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment status.",
      });
    }

    if (paymentAmount !== undefined) {
      const amount = Number(paymentAmount);

      if (!Number.isFinite(amount) || amount < 0) {
        return res.status(400).json({
          success: false,
          message: "Payment amount must be a valid non-negative number.",
        });
      }

      booking.paymentAmount = amount;
    }

    if (paymentStatus !== undefined) {
      booking.paymentStatus = paymentStatus;
    }

    if (paymentMethod !== undefined) {
      booking.paymentMethod = String(paymentMethod).trim();
    }

    if (paymentReference !== undefined) {
      booking.paymentReference =
        String(paymentReference).trim();
    }

    if (paymentNote !== undefined) {
      booking.paymentNote =
        String(paymentNote).trim();
    }

    booking.paymentUpdatedAt = new Date();

    await booking.save();

    const populatedBooking = await populateBooking(
      Booking.findById(booking._id)
    ).lean();

    return res.status(200).json({
      success: true,
      message: "Payment details saved successfully.",
      booking: populatedBooking,
    });
  } catch (error) {
    console.error(
      "Update booking payment error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to save payment details.",
      error: error.message,
    });
  }
};


/* =====================================================
   UPLOAD BOOKING DOCUMENTS
   PATCH /api/admin/bookings/:id/documents
===================================================== */

export const uploadBookingDocuments = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID.",
      });
    }

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    if (
      !req.files ||
      !Array.isArray(req.files) ||
      req.files.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one document.",
      });
    }

    const uploadedDocuments = [];

    for (const file of req.files) {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "coral/booking-documents",
            resource_type: "auto",
          },
          (error, uploadResult) => {
            if (error) {
              reject(error);
              return;
            }

            resolve(uploadResult);
          }
        );

        Readable.from(file.buffer).pipe(uploadStream);
      });

      uploadedDocuments.push({
        name: file.originalname,
        url: result.secure_url,
        publicId: result.public_id,
        resourceType: result.resource_type || "auto",
        uploadedAt: new Date(),
      });
    }

    booking.documents = [
      ...(Array.isArray(booking.documents)
        ? booking.documents
        : []),
      ...uploadedDocuments,
    ];

    await booking.save();

    const populatedBooking = await populateBooking(
      Booking.findById(booking._id)
    ).lean();

    return res.status(200).json({
      success: true,
      message: "Documents uploaded successfully.",
      booking: populatedBooking,
      documents: populatedBooking.documents || [],
    });
  } catch (error) {
    console.error(
      "Upload booking documents error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to upload booking documents.",
      error: error.message,
    });
  }
};
