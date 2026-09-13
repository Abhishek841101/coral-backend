
// import mongoose from "mongoose";
// import Booking from "../models/Booking.js";
// import Property from "../models/Property.js";

// /* =====================================================
//    BOOKING RULES
// ===================================================== */

// // One room can accommodate maximum 3 guests.
// const MAX_GUESTS_PER_ROOM = 3;

// /* =====================================================
//    HELPERS
// ===================================================== */

// const normalizeDate = (value) => {
//   const date = new Date(value);

//   if (Number.isNaN(date.getTime())) {
//     return null;
//   }

//   date.setHours(0, 0, 0, 0);

//   return date;
// };

// const calculateNights = (checkIn, checkOut) => {
//   const difference =
//     checkOut.getTime() - checkIn.getTime();

//   return Math.ceil(
//     difference / (1000 * 60 * 60 * 24)
//   );
// };

// /* =====================================================
//    CREATE BOOKING
//    POST /api/bookings

//    CUSTOMER FLOW:

//    Customer submits booking
//           ↓
//    status = pending
//           ↓
//    Admin reviews booking
//           ↓
//    Call / WhatsApp customer
//           ↓
//    External payment
//           ↓
//    Admin confirms booking
//           ↓
//    status = confirmed
// ===================================================== */

// export const createBooking = async (req, res) => {
//   try {
//     const {
//       propertyId,
//       checkIn,
//       checkOut,
//       guests,
//       rooms,
//       guestName,
//       guestPhone,
//       guestEmail,
//       specialRequest,
//     } = req.body;

//     /* =================================================
//        USER AUTHENTICATION
//     ================================================= */

//     const userId =
//       req.user?._id ||
//       req.user?.id;

//     if (!userId) {
//       return res.status(401).json({
//         success: false,
//         message: "Authentication required.",
//       });
//     }

//     /* =================================================
//        PROPERTY ID
//     ================================================= */

//     if (
//       !propertyId ||
//       !mongoose.Types.ObjectId.isValid(propertyId)
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid property.",
//       });
//     }

//     /* =================================================
//        DATES
//     ================================================= */

//     const startDate = normalizeDate(checkIn);
//     const endDate = normalizeDate(checkOut);

//     if (!startDate || !endDate) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Please provide valid check-in and check-out dates.",
//       });
//     }

//     if (endDate <= startDate) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Check-out date must be after check-in date.",
//       });
//     }

//     /* =================================================
//        GUESTS & ROOMS
//     ================================================= */

//     const guestCount = Number(guests);
//     const roomCount = Number(rooms || 1);

//     if (
//       !Number.isInteger(guestCount) ||
//       guestCount < 1
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Guests must be at least 1.",
//       });
//     }

//     if (
//       !Number.isInteger(roomCount) ||
//       roomCount < 1
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Rooms must be at least 1.",
//       });
//     }

//     /* =================================================
//        GUEST CAPACITY

//        1 room  = 3 guests
//        2 rooms = 6 guests
//        3 rooms = 9 guests
//     ================================================= */

//     const maximumGuests =
//       MAX_GUESTS_PER_ROOM * roomCount;

//     if (guestCount > maximumGuests) {
//       return res.status(400).json({
//         success: false,
//         message:
//           `Maximum ${maximumGuests} guests are allowed for ${roomCount} room(s).`,
//       });
//     }

//     /* =================================================
//        CUSTOMER DETAILS
//     ================================================= */

//     const cleanGuestName =
//       typeof guestName === "string"
//         ? guestName.trim()
//         : "";

//     const cleanGuestPhone =
//       typeof guestPhone === "string"
//         ? guestPhone.trim()
//         : "";

//     const cleanGuestEmail =
//       typeof guestEmail === "string"
//         ? guestEmail.trim().toLowerCase()
//         : "";

//     const cleanSpecialRequest =
//       typeof specialRequest === "string"
//         ? specialRequest.trim()
//         : "";

//     if (!cleanGuestName) {
//       return res.status(400).json({
//         success: false,
//         message: "Guest name is required.",
//       });
//     }

//     if (!cleanGuestPhone) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Guest phone number is required.",
//       });
//     }

//     if (!cleanGuestEmail) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Guest email is required.",
//       });
//     }

//     /* =================================================
//        EMAIL VALIDATION
//     ================================================= */

//     const emailRegex =
//       /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

//     if (!emailRegex.test(cleanGuestEmail)) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Please provide a valid email address.",
//       });
//     }

//     /* =================================================
//        PROPERTY
//     ================================================= */

//     const property =
//       await Property.findOne({
//         _id: propertyId,
//         approvalStatus: "approved",
//         status: "active",
//       });

//     if (!property) {
//       return res.status(404).json({
//         success: false,
//         message:
//           "Property is not available for booking.",
//       });
//     }

//     /* =================================================
//        DATE AVAILABILITY

//        Pending and confirmed bookings
//        block the selected dates.
//     ================================================= */

//     const overlappingBooking =
//       await Booking.findOne({
//         property: propertyId,

//         status: {
//           $in: [
//             "pending",
//             "confirmed",
//           ],
//         },

//         checkIn: {
//           $lt: endDate,
//         },

//         checkOut: {
//           $gt: startDate,
//         },
//       }).lean();

//     if (overlappingBooking) {
//       return res.status(409).json({
//         success: false,
//         message:
//           "This property is already booked or awaiting confirmation for the selected dates.",
//       });
//     }

//     /* =================================================
//        NIGHTS
//     ================================================= */

//     const nights = calculateNights(
//       startDate,
//       endDate
//     );

//     if (nights <= 0) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Invalid booking duration.",
//       });
//     }

//     /* =================================================
//        PRICE
//     ================================================= */

//     const rentPerNight =
//       Number(property.rent || 0);

//     if (rentPerNight <= 0) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Property price is not available.",
//       });
//     }

//     const subtotal =
//       rentPerNight *
//       nights *
//       roomCount;

//     const taxes =
//       Math.round(
//         subtotal * 0.05 * 100
//       ) / 100;

//     const totalAmount =
//       Math.round(
//         (subtotal + taxes) * 100
//       ) / 100;

//     /* =================================================
//        CREATE BOOKING

//        IMPORTANT:

//        status = pending

//        No online payment.
//        No payment processing.
//        No payment fields.
//     ================================================= */

//     const booking =
//       await Booking.create({
//         user: userId,

//         property: propertyId,

//         checkIn: startDate,

//         checkOut: endDate,

//         guests: guestCount,

//         rooms: roomCount,

//         pricePerNight:
//           rentPerNight,

//         nights,

//         subtotal,

//         taxes,

//         totalAmount,

//         guestName:
//           cleanGuestName,

//         guestPhone:
//           cleanGuestPhone,

//         guestEmail:
//           cleanGuestEmail,

//         specialRequest:
//           cleanSpecialRequest,

//         status: "pending",
//       });

//     /*
//      * IMPORTANT:
//      *
//      * bookingsCount is NOT increased here.
//      *
//      * The booking is only pending.
//      *
//      * It should increase when admin confirms
//      * the booking.
//      */

//     /* =================================================
//        POPULATE BOOKING
//     ================================================= */

//     const populatedBooking =
//       await Booking.findById(
//         booking._id
//       )
//         .populate("property")
//         .populate(
//           "user",
//           "name email phone"
//         );

//     /* =================================================
//        RESPONSE
//     ================================================= */

//     return res.status(201).json({
//       success: true,

//       message:
//         "Booking request created successfully. Our team will contact you for confirmation.",

//       booking:
//         populatedBooking,
//     });
//   } catch (error) {
//     console.error(
//       "Create booking error:",
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message:
//         error.message ||
//         "Unable to create booking.",
//     });
//   }
// };

// /* =====================================================
//    GET MY BOOKINGS
//    GET /api/bookings/my
// ===================================================== */

// export const getMyBookings = async (
//   req,
//   res
// ) => {
//   try {
//     const userId =
//       req.user?._id ||
//       req.user?.id;

//     if (!userId) {
//       return res.status(401).json({
//         success: false,
//         message:
//           "Authentication required.",
//       });
//     }

//     const bookings =
//       await Booking.find({
//         user: userId,
//       })
//         .populate("property")
//         .sort({
//           createdAt: -1,
//         });

//     return res.status(200).json({
//       success: true,
//       count: bookings.length,
//       bookings,
//     });
//   } catch (error) {
//     console.error(
//       "Get my bookings error:",
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message:
//         error.message ||
//         "Unable to fetch bookings.",
//     });
//   }
// };

// /* =====================================================
//    GET BOOKING BY ID
//    GET /api/bookings/:id

//    Customer can only see their own booking.
// ===================================================== */

// export const getBookingById = async (
//   req,
//   res
// ) => {
//   try {
//     const { id } = req.params;

//     /* =================================================
//        VALIDATE BOOKING ID
//     ================================================= */

//     if (
//       !id ||
//       !mongoose.Types.ObjectId.isValid(id)
//     ) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Invalid booking ID.",
//       });
//     }

//     /* =================================================
//        USER
//     ================================================= */

//     const userId =
//       req.user?._id ||
//       req.user?.id;

//     if (!userId) {
//       return res.status(401).json({
//         success: false,
//         message:
//           "Authentication required.",
//       });
//     }

//     /* =================================================
//        FIND BOOKING
//     ================================================= */

//     const booking =
//       await Booking.findOne({
//         _id: id,
//         user: userId,
//       })
//         .populate("property")
//         .populate(
//           "user",
//           "name email phone"
//         );

//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message:
//           "Booking not found.",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       booking,
//     });
//   } catch (error) {
//     console.error(
//       "Get booking error:",
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message:
//         error.message ||
//         "Unable to fetch booking.",
//     });
//   }
// };

// /* =====================================================
//    CANCEL BOOKING
//    PATCH /api/bookings/:id/cancel
// ===================================================== */

// export const cancelBooking = async (
//   req,
//   res
// ) => {
//   try {
//     const { id } = req.params;

//     /* =================================================
//        VALIDATE BOOKING ID
//     ================================================= */

//     if (
//       !id ||
//       !mongoose.Types.ObjectId.isValid(id)
//     ) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Invalid booking ID.",
//       });
//     }

//     /* =================================================
//        USER
//     ================================================= */

//     const userId =
//       req.user?._id ||
//       req.user?.id;

//     if (!userId) {
//       return res.status(401).json({
//         success: false,
//         message:
//           "Authentication required.",
//       });
//     }

//     /* =================================================
//        FIND BOOKING
//     ================================================= */

//     const booking =
//       await Booking.findOne({
//         _id: id,
//         user: userId,
//       });

//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message:
//           "Booking not found.",
//       });
//     }

//     /* =================================================
//        STATUS CHECK
//     ================================================= */

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

//     /* =================================================
//        CHECK-IN DATE
//     ================================================= */

//     const today = new Date();

//     today.setHours(
//       0,
//       0,
//       0,
//       0
//     );

//     const bookingCheckIn =
//       new Date(
//         booking.checkIn
//       );

//     bookingCheckIn.setHours(
//       0,
//       0,
//       0,
//       0
//     );

//     if (
//       bookingCheckIn <= today
//     ) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Booking cannot be cancelled after check-in date.",
//       });
//     }

//     /* =================================================
//        CANCEL BOOKING
//     ================================================= */

//     booking.status =
//       "cancelled";

//     booking.cancelledAt =
//       new Date();

//     const cancellationReason =
//       typeof req.body?.reason ===
//       "string"
//         ? req.body.reason.trim()
//         : "";

//     booking.cancellationReason =
//       cancellationReason ||
//       "Booking cancelled by customer.";

//     await booking.save();

//     /* =================================================
//        UPDATED BOOKING
//     ================================================= */

//     const updatedBooking =
//       await Booking.findById(
//         booking._id
//       )
//         .populate("property")
//         .populate(
//           "user",
//           "name email phone"
//         );

//     /* =================================================
//        RESPONSE
//     ================================================= */

//     return res.status(200).json({
//       success: true,

//       message:
//         "Booking cancelled successfully.",

//       booking:
//         updatedBooking,
//     });
//   } catch (error) {
//     console.error(
//       "Cancel booking error:",
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message:
//         error.message ||
//         "Unable to cancel booking.",
//     });
//   }
// };


import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import Property from "../models/Property.js";

/* =====================================================
DATE HELPERS
===================================================== */

const normalizeDate = (value) => {
const date = new Date(value);

if (Number.isNaN(date.getTime())) {
return null;
}

date.setHours(0, 0, 0, 0);

return date;
};

const calculateNights = (checkIn, checkOut) => {
const difference =
checkOut.getTime() -
checkIn.getTime();

return Math.ceil(
difference /
(1000 * 60 * 60 * 24)
);
};

/* =====================================================
CREATE BOOKING REQUEST
POST /api/bookings

CUSTOMER FLOW:

Customer submits
↓
status = pending
↓
Admin reviews
↓
Admin contacts customer
↓
Payment / documents
↓
Admin confirms or rejects
===================================================== */

export const createBooking = async (
req,
res
) => {
try {
/* =================================================
REQUEST DATA
================================================= */

const {
  propertyId,
  checkIn,
  checkOut,
  guests,
  guestName,
  guestPhone,
  guestEmail,
  specialRequest,
} = req.body || {};

/* =================================================
   USER AUTHENTICATION

   Existing customer authentication remains
   completely unchanged.
================================================= */

const userId =
  req.user?._id ||
  req.user?.id;

if (!userId) {
  return res.status(401).json({
    success: false,
    message:
      "Authentication required.",
  });
}

/* =================================================
   PROPERTY ID
================================================= */

if (
  !propertyId ||
  !mongoose.Types.ObjectId.isValid(
    propertyId
  )
) {
  return res.status(400).json({
    success: false,
    message:
      "Invalid property.",
  });
}

/* =================================================
   DATES
================================================= */

const startDate =
  normalizeDate(checkIn);

const endDate =
  normalizeDate(checkOut);

if (
  !startDate ||
  !endDate
) {
  return res.status(400).json({
    success: false,
    message:
      "Please provide valid check-in and check-out dates.",
  });
}

/* =================================================
   CHECK-IN CANNOT BE IN THE PAST
================================================= */

const today =
  new Date();

today.setHours(
  0,
  0,
  0,
  0
);

if (
  startDate < today
) {
  return res.status(400).json({
    success: false,
    message:
      "Check-in date cannot be in the past.",
  });
}

/* =================================================
   CHECK-OUT MUST BE AFTER CHECK-IN
================================================= */

if (
  endDate <= startDate
) {
  return res.status(400).json({
    success: false,
    message:
      "Check-out date must be after check-in date.",
  });
}

/* =================================================
   GUESTS
================================================= */

const guestCount =
  Number(guests);

if (
  !Number.isInteger(
    guestCount
  ) ||
  guestCount < 1
) {
  return res.status(400).json({
    success: false,
    message:
      "Guests must be at least 1.",
  });
}

/* =================================================
   CUSTOMER DETAILS
================================================= */

const cleanGuestName =
  typeof guestName ===
  "string"
    ? guestName.trim()
    : "";

const cleanGuestPhone =
  typeof guestPhone ===
  "string"
    ? guestPhone.trim()
    : "";

const cleanGuestEmail =
  typeof guestEmail ===
  "string"
    ? guestEmail
        .trim()
        .toLowerCase()
    : "";

const cleanSpecialRequest =
  typeof specialRequest ===
  "string"
    ? specialRequest.trim()
    : "";

/* =================================================
   NAME
================================================= */

if (
  !cleanGuestName
) {
  return res.status(400).json({
    success: false,
    message:
      "Guest name is required.",
  });
}

/* =================================================
   PHONE
================================================= */

if (
  !cleanGuestPhone
) {
  return res.status(400).json({
    success: false,
    message:
      "Guest phone number is required.",
  });
}

/* =================================================
   EMAIL
================================================= */

if (
  !cleanGuestEmail
) {
  return res.status(400).json({
    success: false,
    message:
      "Guest email is required.",
  });
}

const emailRegex =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (
  !emailRegex.test(
    cleanGuestEmail
  )
) {
  return res.status(400).json({
    success: false,
    message:
      "Please provide a valid email address.",
  });
}

/* =================================================
   SPECIAL REQUEST
================================================= */

if (
  cleanSpecialRequest.length >
  1000
) {
  return res.status(400).json({
    success: false,
    message:
      "Special request cannot exceed 1000 characters.",
  });
}

/* =================================================
   PROPERTY

   Only approved + active properties
   can receive booking requests.
================================================= */

const property =
  await Property.findOne({
    _id: propertyId,
    approvalStatus:
      "approved",
    status: "active",
  });

if (!property) {
  return res.status(404).json({
    success: false,
    message:
      "Property is not available for booking.",
  });
}

/* =================================================
   MAXIMUM GUEST CAPACITY

   New properties:
   maxGuests

   Existing properties:
   guests

   Compatibility fallback:
   maxGuests → guests → 1
================================================= */

const maximumGuests =
  Number(
    property.maxGuests ??
    property.guests ??
    1
  );

if (
  !Number.isInteger(
    maximumGuests
  ) ||
  maximumGuests < 1
) {
  return res.status(500).json({
    success: false,
    message:
      "Property maximum guest capacity is not configured.",
  });
}

if (
  guestCount >
  maximumGuests
) {
  return res.status(400).json({
    success: false,
    message:
      `Maximum ${maximumGuests} guests are allowed for this property.`,
  });
}

/* =================================================
   AVAILABILITY

   IMPORTANT CORAL RULE:

   pending
   → DOES NOT BLOCK

   confirmed
   → BLOCKS

   rejected
   → DOES NOT BLOCK

   cancelled
   → DOES NOT BLOCK

   completed
   → DOES NOT BLOCK

   Multiple customers can therefore create
   pending requests for the same property
   and overlapping dates.

   Only a confirmed booking blocks dates.
================================================= */

const overlappingBooking =
  await Booking.findOne({
    property:
      propertyId,

    status:
      "confirmed",

    checkIn: {
      $lt: endDate,
    },

    checkOut: {
      $gt: startDate,
    },
  }).lean();

if (
  overlappingBooking
) {
  return res.status(409).json({
    success: false,
    message:
      "This property is already booked for the selected dates.",
  });
}

/* =================================================
   NIGHTS

   Example:

   Check-in 10 Sep
   Check-out 15 Sep

   Nights = 5

   Occupied:
   10, 11, 12, 13, 14

   Checkout:
   15 Sep
   → available
================================================= */

const nights =
  calculateNights(
    startDate,
    endDate
  );

if (
  !Number.isInteger(
    nights
  ) ||
  nights <= 0
) {
  return res.status(400).json({
    success: false,
    message:
      "Invalid booking duration.",
  });
}

/* =================================================
   PROPERTY RENT

   Coral Stage 1 booking calculation:

   rent × nights

   No room multiplier.
   No automatic GST.
   No automatic 5% tax.
================================================= */

const rentPerNight =
  Number(
    property.rent || 0
  );

if (
  rentPerNight <= 0
) {
  return res.status(400).json({
    success: false,
    message:
      "Property price is not available.",
  });
}

/* =================================================
   PRICE CALCULATION
================================================= */

const subtotal =
  rentPerNight *
  nights;

const taxes = 0;

const totalAmount =
  subtotal + taxes;

/* =================================================
   CREATE BOOKING REQUEST

   IMPORTANT:

   status = pending

   No online payment.
   No payment processing.
   No instant confirmation.
================================================= */

const booking =
  await Booking.create({
    user:
      userId,

    property:
      propertyId,

    checkIn:
      startDate,

    checkOut:
      endDate,

    guests:
      guestCount,

    pricePerNight:
      rentPerNight,

    nights:
      nights,

    subtotal:
      subtotal,

    taxes:
      taxes,

    totalAmount:
      totalAmount,

    guestName:
      cleanGuestName,

    guestPhone:
      cleanGuestPhone,

    guestEmail:
      cleanGuestEmail,

    specialRequest:
      cleanSpecialRequest,

    status:
      "pending",
  });

/* =================================================
   POPULATE BOOKING
================================================= */

const populatedBooking =
  await Booking.findById(
    booking._id
  )
    .populate(
      "property"
    )
    .populate(
      "user",
      "name email phone"
    );

/* =================================================
   RESPONSE

   Important wording:
   "Booking request submitted"

   NOT:
   "Booking confirmed"
================================================= */

return res.status(201).json({
  success: true,

  message:
    "Booking request submitted successfully. Our team will contact you for confirmation.",

  booking:
    populatedBooking,
});

} catch (error) {
console.error(
"Create booking error:",
error
);

return res.status(500).json({
  success: false,

  message:
    error.message ||
    "Unable to create booking.",
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
/* =================================================
USER
================================================= */

const userId =
  req.user?._id ||
  req.user?.id;

if (!userId) {
  return res.status(401).json({
    success: false,
    message:
      "Authentication required.",
  });
}

/* =================================================
   FETCH CUSTOMER BOOKINGS
================================================= */

const bookings =
  await Booking.find({
    user:
      userId,
  })
    .populate(
      "property"
    )
    .sort({
      createdAt:
        -1,
    });

/* =================================================
   RESPONSE
================================================= */

return res.status(200).json({
  success: true,

  count:
    bookings.length,

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
    error.message ||
    "Unable to fetch bookings.",
});

}
};

/* =====================================================
GET SINGLE BOOKING
GET /api/bookings/:id

Customer can only see their own booking.
===================================================== */

export const getBookingById = async (
req,
res
) => {
try {
/* =================================================
BOOKING ID
================================================= */

const {
  id,
} = req.params;

if (
  !id ||
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
   USER
================================================= */

const userId =
  req.user?._id ||
  req.user?.id;

if (!userId) {
  return res.status(401).json({
    success: false,
    message:
      "Authentication required.",
  });
}

/* =================================================
   FIND CUSTOMER'S BOOKING
================================================= */

const booking =
  await Booking.findOne({
    _id:
      id,

    user:
      userId,
  })
    .populate(
      "property"
    )
    .populate(
      "user",
      "name email phone"
    );

if (!booking) {
  return res.status(404).json({
    success: false,
    message:
      "Booking not found.",
  });
}

/* =================================================
   RESPONSE
================================================= */

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
    error.message ||
    "Unable to fetch booking.",
});

}
};

/* =====================================================
CUSTOMER CANCEL BOOKING

PATCH /api/bookings/:id/cancel

Stage 2 frontend feature.

Backend endpoint is retained for compatibility.

Stage 1 frontend should NOT show
customer cancellation button.
===================================================== */

export const cancelBooking = async (
req,
res
) => {
try {
/* =================================================
BOOKING ID
================================================= */

const {
  id,
} = req.params;

if (
  !id ||
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
   USER
================================================= */

const userId =
  req.user?._id ||
  req.user?.id;

if (!userId) {
  return res.status(401).json({
    success: false,
    message:
      "Authentication required.",
  });
}

/* =================================================
   FIND CUSTOMER BOOKING
================================================= */

const booking =
  await Booking.findOne({
    _id:
      id,

    user:
      userId,
  });

if (!booking) {
  return res.status(404).json({
    success: false,
    message:
      "Booking not found.",
  });
}

/* =================================================
   STATUS CHECK
================================================= */

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
      "This booking cannot be cancelled.",
  });
}

/* =================================================
   CHECK-IN DATE
================================================= */

const bookingCheckIn =
  normalizeDate(
    booking.checkIn
  );

const today =
  new Date();

today.setHours(
  0,
  0,
  0,
  0
);

if (
  bookingCheckIn &&
  bookingCheckIn <=
    today
) {
  return res.status(400).json({
    success: false,
    message:
      "Booking cannot be cancelled after check-in date.",
  });
}

/* =================================================
   CANCEL
================================================= */

booking.status =
  "cancelled";

booking.cancelledAt =
  new Date();

const reason =
  typeof req.body?.reason ===
  "string"
    ? req.body.reason.trim()
    : "";

booking.cancellationReason =
  reason ||
  "Booking cancelled by customer.";

await booking.save();

/* =================================================
   UPDATED BOOKING
================================================= */

const updatedBooking =
  await Booking.findById(
    booking._id
  )
    .populate(
      "property"
    )
    .populate(
      "user",
      "name email phone"
    );

/* =================================================
   RESPONSE
================================================= */

return res.status(200).json({
  success: true,

  message:
    "Booking cancelled successfully.",

  booking:
    updatedBooking,
});

} catch (error) {
console.error(
"Cancel booking error:",
error
);

return res.status(500).json({
  success: false,

  message:
    error.message ||
    "Unable to cancel booking.",
});

}
};