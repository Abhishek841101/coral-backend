// import mongoose from "mongoose";
// import Booking from "../models/Booking.js";
// import Property from "../models/Property.js";

// /* =====================================================
//    CREATE BOOKING
//    POST /api/bookings
// ===================================================== */

// export const createBooking = async (req, res) => {
//   try {
//     const {
//       propertyId,
//       checkIn,
//       checkOut,
//       guests,
//       rooms = 1,
//       guestName,
//       guestPhone,
//       guestEmail,
//       specialRequest = "",
//     } = req.body;

//     /* ================= VALIDATION ================= */

//     if (
//       !propertyId ||
//       !checkIn ||
//       !checkOut ||
//       !guests ||
//       !guestName ||
//       !guestPhone ||
//       !guestEmail
//     ) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Property, dates, guests and guest details are required.",
//       });
//     }

//     if (!mongoose.Types.ObjectId.isValid(propertyId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid property ID.",
//       });
//     }

//     const checkInDate = new Date(checkIn);
//     const checkOutDate = new Date(checkOut);

//     if (
//       Number.isNaN(checkInDate.getTime()) ||
//       Number.isNaN(checkOutDate.getTime())
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid check-in or check-out date.",
//       });
//     }

//     /* Checkout must be after check-in */

//     if (checkOutDate <= checkInDate) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Check-out date must be after check-in date.",
//       });
//     }

//     /* Guests */

//     const guestCount = Number(guests);
//     const roomCount = Number(rooms);

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

//     /* ================= PROPERTY ================= */

//     const property = await Property.findOne({
//       _id: propertyId,
//       approvalStatus: "approved",
//       status: "active",
//     });

//     if (!property) {
//       return res.status(404).json({
//         success: false,
//         message:
//           "Property is not available for booking.",
//       });
//     }

//     /* ================= GUEST LIMIT ================= */

//     const totalGuestCapacity =
//       property.guests * roomCount;

//     if (guestCount > totalGuestCapacity) {
//       return res.status(400).json({
//         success: false,
//         message: `This property allows maximum ${totalGuestCapacity} guests.`,
//       });
//     }

//     /* ================= DATE AVAILABILITY ================= */

//     /*
//       Existing booking overlaps when:

//       existing.checkIn < new.checkOut
//       AND
//       existing.checkOut > new.checkIn
//     */

//     const overlappingBooking =
//       await Booking.findOne({
//         property: property._id,

//         status: {
//           $in: ["pending", "confirmed"],
//         },

//         checkIn: {
//           $lt: checkOutDate,
//         },

//         checkOut: {
//           $gt: checkInDate,
//         },
//       });

//     if (overlappingBooking) {
//       return res.status(409).json({
//         success: false,
//         message:
//           "Property is not available for the selected dates.",
//       });
//     }

//     /* ================= NIGHTS ================= */

//     const millisecondsPerDay =
//       1000 * 60 * 60 * 24;

//     const nights = Math.ceil(
//       (checkOutDate - checkInDate) /
//         millisecondsPerDay
//     );

//     if (nights < 1) {
//       return res.status(400).json({
//         success: false,
//         message: "Booking must be at least one night.",
//       });
//     }

//     /* ================= PRICE ================= */

//     const pricePerNight = Number(property.rent);

//     const subtotal =
//       pricePerNight *
//       nights *
//       roomCount;

//     /*
//       Taxes are currently calculated
//       from the booking subtotal.
//     */

//     const taxRate = 0.05;

//     const taxes = Math.round(
//       subtotal * taxRate
//     );

//     const totalAmount =
//       subtotal + taxes;

//     /* ================= BOOKING ================= */

//     const booking = await Booking.create({
//       user: req.user._id,

//       property: property._id,

//       checkIn: checkInDate,
//       checkOut: checkOutDate,

//       guests: guestCount,
//       rooms: roomCount,

//       pricePerNight,
//       nights,
//       subtotal,
//       taxes,
//       totalAmount,

//       guestName: guestName.trim(),
//       guestPhone: guestPhone.trim(),
//       guestEmail: guestEmail
//         .toLowerCase()
//         .trim(),

//       specialRequest:
//         specialRequest.trim(),

//       status: "pending",

//       paymentStatus: "pending",
//       paymentMethod: "not_selected",
//     });

//     /* ================= UPDATE PROPERTY ================= */

//     property.bookingsCount += 1;

//     await property.save();

//     /* ================= RESPONSE ================= */

//     const populatedBooking =
//       await Booking.findById(
//         booking._id
//       )
//         .populate(
//           "property",
//           "title city locality rent images"
//         )
//         .populate(
//           "user",
//           "name email phone"
//         );

//     return res.status(201).json({
//       success: true,
//       message:
//         "Booking request created successfully.",
//       booking: populatedBooking,
//     });
//   } catch (error) {
//     console.error(
//       "Create booking error:",
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message: "Unable to create booking.",
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
//     const bookings =
//       await Booking.find({
//         user: req.user._id,
//       })
//         .populate(
//           "property",
//           "title city locality rent images propertyType"
//         )
//         .sort({
//           createdAt: -1,
//         })
//         .lean();

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
//         "Unable to fetch your bookings.",
//     });
//   }
// };

// /* =====================================================
//    GET SINGLE BOOKING
//    GET /api/bookings/:id
// ===================================================== */

// export const getBookingById = async (
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
//       await Booking.findOne({
//         _id: req.params.id,
//         user: req.user._id,
//       })
//         .populate(
//           "property",
//           "title description city locality address rent images propertyType"
//         )
//         .populate(
//           "user",
//           "name email phone"
//         );

//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: "Booking not found.",
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

//     const { reason = "" } = req.body;

//     const booking =
//       await Booking.findOne({
//         _id: req.params.id,
//         user: req.user._id,
//       });

//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: "Booking not found.",
//       });
//     }

//     /* Cannot cancel completed/cancelled/rejected */

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

//     /* Cannot cancel past check-in */

//     const now = new Date();

//     if (booking.checkIn <= now) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "A booking cannot be cancelled after check-in.",
//       });
//     }

//     booking.status = "cancelled";

//     booking.cancellationReason =
//       reason.trim();

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
//       "Cancel booking error:",
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message:
//         "Unable to cancel booking.",
//     });
//   }
// };






import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import Property from "../models/Property.js";

/* =====================================================
   BOOKING RULES
===================================================== */

// One room can accommodate maximum 3 guests.
const MAX_GUESTS_PER_ROOM = 3;

/* =====================================================
   HELPERS
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
    checkOut.getTime() - checkIn.getTime();

  return Math.ceil(
    difference / (1000 * 60 * 60 * 24)
  );
};

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
      rooms,
      guestName,
      guestPhone,
      guestEmail,
      specialRequest,
    } = req.body;

    /* ================= USER ================= */

    const userId =
      req.user?._id ||
      req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    /* ================= PROPERTY ID ================= */

    if (
      !propertyId ||
      !mongoose.Types.ObjectId.isValid(propertyId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid property.",
      });
    }

    /* ================= DATES ================= */

    const startDate = normalizeDate(checkIn);
    const endDate = normalizeDate(checkOut);

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide valid check-in and check-out dates.",
      });
    }

    if (endDate <= startDate) {
      return res.status(400).json({
        success: false,
        message:
          "Check-out date must be after check-in date.",
      });
    }

    /* ================= GUESTS & ROOMS ================= */

    const guestCount = Number(guests);
    const roomCount = Number(rooms || 1);

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

    /* =================================================
       GUEST CAPACITY

       1 room  = maximum 3 guests
       2 rooms = maximum 6 guests
       3 rooms = maximum 9 guests
    ================================================= */

    const maximumGuests =
      MAX_GUESTS_PER_ROOM * roomCount;

    if (guestCount > maximumGuests) {
      return res.status(400).json({
        success: false,
        message: `Maximum ${maximumGuests} guests are allowed for ${roomCount} room(s).`,
      });
    }

    /* ================= CUSTOMER DETAILS ================= */

    const cleanGuestName =
      typeof guestName === "string"
        ? guestName.trim()
        : "";

    const cleanGuestPhone =
      typeof guestPhone === "string"
        ? guestPhone.trim()
        : "";

    const cleanGuestEmail =
      typeof guestEmail === "string"
        ? guestEmail.trim().toLowerCase()
        : "";

    const cleanSpecialRequest =
      typeof specialRequest === "string"
        ? specialRequest.trim()
        : "";

    if (!cleanGuestName) {
      return res.status(400).json({
        success: false,
        message: "Guest name is required.",
      });
    }

    if (!cleanGuestPhone) {
      return res.status(400).json({
        success: false,
        message: "Guest phone number is required.",
      });
    }

    if (!cleanGuestEmail) {
      return res.status(400).json({
        success: false,
        message: "Guest email is required.",
      });
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanGuestEmail)) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide a valid email address.",
      });
    }

    /* ================= PROPERTY ================= */

    const property =
      await Property.findOne({
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

    /* ================= AVAILABILITY ================= */

    const overlappingBooking =
      await Booking.findOne({
        property: propertyId,

        status: {
          $in: [
            "pending",
            "confirmed",
          ],
        },

        checkIn: {
          $lt: endDate,
        },

        checkOut: {
          $gt: startDate,
        },
      });

    if (overlappingBooking) {
      return res.status(409).json({
        success: false,
        message:
          "This property is already booked for the selected dates.",
      });
    }

    /* ================= NIGHTS ================= */

    const nights = calculateNights(
      startDate,
      endDate
    );

    if (nights <= 0) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid booking duration.",
      });
    }

    /* ================= PRICE ================= */

    const rentPerNight =
      Number(property.rent || 0);

    if (rentPerNight <= 0) {
      return res.status(400).json({
        success: false,
        message:
          "Property price is not available.",
      });
    }

    const subtotal =
      rentPerNight *
      nights *
      roomCount;

    const taxes =
      Math.round(
        subtotal * 0.05 * 100
      ) / 100;

    const totalAmount =
      Math.round(
        (subtotal + taxes) * 100
      ) / 100;

    /* ================= CREATE BOOKING ================= */

    const booking =
      await Booking.create({
        user: userId,

        property: propertyId,

        checkIn: startDate,

        checkOut: endDate,

        guests: guestCount,

        rooms: roomCount,

        pricePerNight:
          rentPerNight,

        nights,

        subtotal,

        taxes,

        totalAmount,

        guestName:
          cleanGuestName,

        guestPhone:
          cleanGuestPhone,

        guestEmail:
          cleanGuestEmail,

        specialRequest:
          cleanSpecialRequest,

        status: "pending",

        paymentStatus:
          "pending",

        paymentMethod:
          "not_selected",
      });

    /* ================= PROPERTY BOOKING COUNT ================= */

    await Property.findByIdAndUpdate(
      propertyId,
      {
        $inc: {
          bookingsCount: 1,
        },
      }
    );

    /* ================= POPULATE ================= */

    const populatedBooking =
      await Booking.findById(
        booking._id
      )
        .populate("property")
        .populate(
          "user",
          "name email phone"
        );

    return res.status(201).json({
      success: true,
      message:
        "Booking created successfully.",
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

    const bookings =
      await Booking.find({
        user: userId,
      })
        .populate("property")
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,
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
   GET BOOKING BY ID
   GET /api/bookings/:id
===================================================== */

export const getBookingById = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    if (
      !id ||
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid booking ID.",
      });
    }

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

    const booking =
      await Booking.findOne({
        _id: id,
        user: userId,
      })
        .populate("property")
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
   CANCEL BOOKING
   PATCH /api/bookings/:id/cancel
===================================================== */

export const cancelBooking = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    if (
      !id ||
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid booking ID.",
      });
    }

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

    const booking =
      await Booking.findOne({
        _id: id,
        user: userId,
      });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message:
          "Booking not found.",
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

    /* ================= CHECK-IN DATE ================= */

    const today = new Date();

    today.setHours(
      0,
      0,
      0,
      0
    );

    const bookingCheckIn =
      new Date(booking.checkIn);

    bookingCheckIn.setHours(
      0,
      0,
      0,
      0
    );

    if (
      bookingCheckIn <= today
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Booking cannot be cancelled after check-in date.",
      });
    }

    /* ================= CANCEL ================= */

    booking.status =
      "cancelled";

    booking.cancelledAt =
      new Date();

    if (
      typeof req.body?.reason ===
      "string"
    ) {
      booking.cancellationReason =
        req.body.reason.trim();
    }

    await booking.save();

    const updatedBooking =
      await Booking.findById(
        booking._id
      )
        .populate("property")
        .populate(
          "user",
          "name email phone"
        );

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

/* =====================================================
   PAY BOOKING
   PATCH /api/bookings/:id/pay
===================================================== */

export const payBooking = async (
  req,
  res
) => {
  try {
    const userId =
      req.user?._id ||
      req.user?.id;

    const bookingId =
      req.params.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required.",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        bookingId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid booking ID.",
      });
    }

    const booking =
      await Booking.findOne({
        _id: bookingId,
        user: userId,
      });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message:
          "Booking not found.",
      });
    }

    if (
      booking.status ===
      "cancelled"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Cancelled booking cannot be paid.",
      });
    }

    if (
      booking.status ===
      "rejected"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Rejected booking cannot be paid.",
      });
    }

    if (
      booking.paymentStatus ===
      "paid"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Payment has already been completed.",
        booking,
      });
    }

    /* ================= PAYMENT ================= */

    const paymentMethod =
      req.body?.paymentMethod ===
      "online"
        ? "online"
        : "online";

    const paymentId =
      `CORAL-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)
        .toUpperCase()}`;

    booking.paymentStatus =
      "paid";

    booking.paymentMethod =
      paymentMethod;

    booking.paymentId =
      paymentId;

    booking.status =
      "confirmed";

    booking.confirmedAt =
      new Date();

    await booking.save();

    const updatedBooking =
      await Booking.findById(
        booking._id
      )
        .populate(
          "property",
          "title description propertyType city locality address rent rentPeriod guests amenities rules images"
        )
        .populate(
          "user",
          "name email phone avatar"
        );

    return res.status(200).json({
      success: true,
      message:
        "Payment successful. Booking confirmed.",
      booking:
        updatedBooking,
    });
  } catch (error) {
    console.error(
      "Pay booking error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to process payment.",
    });
  }
};

