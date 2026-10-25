
// import mongoose from "mongoose";
// import Booking from "../models/Booking.js";
// import Property from "../models/Property.js";

// /* =====================================================
// DATE HELPERS
// ===================================================== */

// const normalizeDate = (value) => {
// const date = new Date(value);

// if (Number.isNaN(date.getTime())) {
// return null;
// }

// date.setHours(0, 0, 0, 0);

// return date;
// };

// const calculateNights = (checkIn, checkOut) => {
// const difference =
// checkOut.getTime() -
// checkIn.getTime();

// return Math.ceil(
// difference /
// (1000 * 60 * 60 * 24)
// );
// };

// /* =====================================================
// CREATE BOOKING REQUEST
// POST /api/bookings

// CUSTOMER FLOW:

// Customer submits
// ↓
// status = pending
// ↓
// Admin reviews
// ↓
// Admin contacts customer
// ↓
// Payment / documents
// ↓
// Admin confirms or rejects
// ===================================================== */


// export const createBooking = async (req, res) => {
//   try {
//     const {
//       propertyId,
//       checkIn,
//       checkOut,
//       guests,
//       guestName,
//       guestPhone,
//       guestEmail,
//       specialRequest,
//       sleepingArrangements = [],
//       pets = 0,
//     } = req.body || {};

//     // Authentication
//     const userId = req.user?._id || req.user?.id;

//     if (!userId) {
//       return res.status(401).json({
//         success: false,
//         message: "Authentication required.",
//       });
//     }

//     // Validate property ID
//     if (
//       !propertyId ||
//       !mongoose.Types.ObjectId.isValid(propertyId)
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid property.",
//       });
//     }

//     // Validate dates
//     const startDate = normalizeDate(checkIn);
//     const endDate = normalizeDate(checkOut);

//     if (!startDate || !endDate) {
//       return res.status(400).json({
//         success: false,
//         message: "Please provide valid check-in and check-out dates.",
//       });
//     }

//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     if (startDate < today) {
//       return res.status(400).json({
//         success: false,
//         message: "Check-in date cannot be in the past.",
//       });
//     }

//     if (endDate <= startDate) {
//       return res.status(400).json({
//         success: false,
//         message: "Check-out date must be after check-in date.",
//       });
//     }

//     // Validate guest count
//     const guestCount = Number(guests);

//     if (!Number.isInteger(guestCount) || guestCount < 1) {
//       return res.status(400).json({
//         success: false,
//         message: "Guests must be at least 1.",
//       });
//     }

//     // Validate customer details
//     const cleanGuestName =
//       typeof guestName === "string" ? guestName.trim() : "";

//     const cleanGuestPhone =
//       typeof guestPhone === "string" ? guestPhone.trim() : "";

//     const cleanGuestEmail =
//       typeof guestEmail === "string"
//         ? guestEmail.trim().toLowerCase()
//         : "";

//     const cleanSpecialRequest =
//       typeof specialRequest === "string"
//         ? specialRequest.trim()
//         : "";

//     if (!cleanGuestName || !cleanGuestPhone || !cleanGuestEmail) {
//       return res.status(400).json({
//         success: false,
//         message: "Guest name, phone and email are required.",
//       });
//     }

//     if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanGuestEmail)) {
//       return res.status(400).json({
//         success: false,
//         message: "Please provide a valid email address.",
//       });
//     }

//     if (cleanSpecialRequest.length > 1000) {
//       return res.status(400).json({
//         success: false,
//         message: "Special request cannot exceed 1000 characters.",
//       });
//     }

//     // Validate sleeping arrangements
//     if (!Array.isArray(sleepingArrangements)) {
//       return res.status(400).json({
//         success: false,
//         message: "Sleeping arrangements must be an array.",
//       });
//     }

//     // Fetch an approved and active property
//     const property = await Property.findOne({
//       _id: propertyId,
//       approvalStatus: "approved",
//       status: "active",
//     });

//     if (!property) {
//       return res.status(404).json({
//         success: false,
//         message: "Property is not available for booking.",
//       });
//     }

//     // Validate guest capacity
//     const minimumGuests = Number(property.minGuests ?? 1);

//     const maximumGuests = Number(
//       property.maxGuests ?? property.guests ?? 1
//     );

//     if (
//       !Number.isInteger(minimumGuests) ||
//       minimumGuests < 1 ||
//       !Number.isInteger(maximumGuests) ||
//       maximumGuests < minimumGuests
//     ) {
//       return res.status(500).json({
//         success: false,
//         message: "Property guest capacity is not configured correctly.",
//       });
//     }

//     if (guestCount < minimumGuests) {
//       return res.status(400).json({
//         success: false,
//         message: `At least ${minimumGuests} guests are required for this property.`,
//       });
//     }

//     const extraGuestCount = Math.max(
//       0,
//       guestCount - maximumGuests
//     );

//     const extraGuestPolicy = property.extraGuestPolicy || {};

//     if (extraGuestCount > 0) {
//       if (!extraGuestPolicy.enabled) {
//         return res.status(400).json({
//           success: false,
//           message: `Maximum ${maximumGuests} guests are allowed for this property.`,
//         });
//       }

//       const maxExtraGuests = Number(
//         extraGuestPolicy.maxExtraGuests ?? 0
//       );

//       if (
//         !Number.isInteger(maxExtraGuests) ||
//         maxExtraGuests < 0 ||
//         extraGuestCount > maxExtraGuests
//       ) {
//         return res.status(400).json({
//           success: false,
//           message: `Only ${Math.max(0, maxExtraGuests)} additional guests are allowed.`,
//         });
//       }
//     }

//     // Only confirmed bookings block dates
//     const overlappingBooking = await Booking.findOne({
//       property: propertyId,
//       status: "confirmed",
//       checkIn: { $lt: endDate },
//       checkOut: { $gt: startDate },
//     }).lean();

//     if (overlappingBooking) {
//       return res.status(409).json({
//         success: false,
//         message: "This property is already booked for the selected dates.",
//       });
//     }

//     // Calculate booking duration
//     const nights = calculateNights(startDate, endDate);

//     if (!Number.isInteger(nights) || nights <= 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid booking duration.",
//       });
//     }

//     /*
//      * Pricing periods:
//      * perNight = number of nights
//      * perStay  = one charge for the entire booking
//      * perMonth = each started 30-night period
//      */
//     const getPeriodUnits = (period) => {
//       if (period === "perStay") return 1;
//       if (period === "perMonth") return Math.ceil(nights / 30);
//       return nights;
//     };

//     const roundMoney = (amount) =>
//       Math.round((amount + Number.EPSILON) * 100) / 100;

//     // Base property rent
//     const rentPerNight = Number(property.rent);

//     if (!Number.isFinite(rentPerNight) || rentPerNight <= 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Property price is not available.",
//       });
//     }

//     const baseAmount = roundMoney(rentPerNight * nights);

//     // Extra guest pricing
//     let extraGuestAmount = 0;

//     let savedExtraGuestCharges = {
//       count: extraGuestCount,
//       pricePerPerson: 0,
//       chargePeriod: extraGuestPolicy.chargePeriod || "perNight",
//       amount: 0,
//     };

//     if (extraGuestCount > 0) {
//       const pricePerPerson = Number(
//         extraGuestPolicy.pricePerPerson ?? 0
//       );

//       const chargePeriod =
//         extraGuestPolicy.chargePeriod || "perNight";

//       if (
//         !Number.isFinite(pricePerPerson) ||
//         pricePerPerson < 0 ||
//         !["perNight", "perStay", "perMonth"].includes(chargePeriod)
//       ) {
//         return res.status(400).json({
//           success: false,
//           message: "Extra guest pricing is configured incorrectly.",
//         });
//       }

//       extraGuestAmount = roundMoney(
//         extraGuestCount *
//           pricePerPerson *
//           getPeriodUnits(chargePeriod)
//       );

//       savedExtraGuestCharges = {
//         count: extraGuestCount,
//         pricePerPerson,
//         chargePeriod,
//         amount: extraGuestAmount,
//       };
//     }

//     // Sleeping arrangements pricing
//     const configuredArrangements = Array.isArray(
//       property.sleepingArrangements
//     )
//       ? property.sleepingArrangements
//       : [];

//     const savedSleepingArrangements = [];
//     let sleepingArrangementAmount = 0;

//     const selectedSleepingTypes = new Set();

//     for (const selection of sleepingArrangements) {
//       const type = selection?.type;
//       const quantity = Number(selection?.quantity);

//       if (
//         !type ||
//         !Number.isInteger(quantity) ||
//         quantity < 1 ||
//         selectedSleepingTypes.has(type)
//       ) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid sleeping arrangement selection.",
//         });
//       }

//       selectedSleepingTypes.add(type);

//       const configured = configuredArrangements.find(
//         (item) => item.type === type
//       );

//       if (!configured) {
//         return res.status(400).json({
//           success: false,
//           message: `Sleeping arrangement '${type}' is not available.`,
//         });
//       }

//       const availableQuantity = Number(configured.quantity ?? 0);

//       if (quantity > availableQuantity) {
//         return res.status(400).json({
//           success: false,
//           message: `Only ${availableQuantity} unit(s) of '${type}' are available.`,
//         });
//       }

//       const isPaid = Boolean(configured.isPaid);
//       const pricePerUnit = Number(configured.price ?? 0);
//       const chargePeriod = configured.chargePeriod || "perStay";

//       if (
//         !Number.isFinite(pricePerUnit) ||
//         pricePerUnit < 0 ||
//         !["perNight", "perStay", "perMonth"].includes(chargePeriod)
//       ) {
//         return res.status(400).json({
//           success: false,
//           message: `Pricing for '${type}' is configured incorrectly.`,
//         });
//       }

//       const amount = isPaid
//         ? roundMoney(
//             quantity *
//               pricePerUnit *
//               getPeriodUnits(chargePeriod)
//           )
//         : 0;

//       sleepingArrangementAmount = roundMoney(
//         sleepingArrangementAmount + amount
//       );

//       savedSleepingArrangements.push({
//         type,
//         label: configured.label || "",
//         quantity,
//         pricePerUnit: isPaid ? pricePerUnit : 0,
//         chargePeriod,
//         amount,
//       });
//     }

//     // =========================================
//     // PET POLICY — COMMON PRICE FOR ALL PETS
//     // =========================================

//     const petPolicy = property.petPolicy || {};

//     let totalPetCount;

//     /*
//      * New frontend format:
//      * pets: 2
//      *
//      * Temporary legacy format:
//      * pets: [{ type: "dog", count: 2 }]
//      *
//      * The backend always uses the property's saved
//      * common pet price, never a client-supplied price.
//      */

//     if (Array.isArray(pets)) {
//       // Backward compatibility for the previous frontend
//       totalPetCount = 0;

//       for (const selection of pets) {
//         const count = Number(selection?.count);

//         if (!Number.isInteger(count) || count < 1) {
//           return res.status(400).json({
//             success: false,
//             message: "Invalid pet quantity.",
//           });
//         }

//         totalPetCount += count;
//       }
//     } else {
//       totalPetCount = Number(pets);

//       if (
//         !Number.isInteger(totalPetCount) ||
//         totalPetCount < 0
//       ) {
//         return res.status(400).json({
//           success: false,
//           message: "Pet quantity must be a non-negative whole number.",
//         });
//       }
//     }

//     let petAmount = 0;
//     let savedPetCharges = null;

//     if (totalPetCount > 0) {
//       if (!petPolicy.allowed) {
//         return res.status(400).json({
//           success: false,
//           message: "Pets are not allowed at this property.",
//         });
//       }

//       const maxPets = Number(petPolicy.maxPets ?? 0);

//       if (
//         !Number.isInteger(maxPets) ||
//         maxPets < 1 ||
//         totalPetCount > maxPets
//       ) {
//         return res.status(400).json({
//           success: false,
//           message: `Maximum ${Math.max(0, maxPets)} pet(s) are allowed at this property.`,
//         });
//       }

//       // New common rate, with a fallback for legacy property records
//       const legacyPetTypes = Array.isArray(petPolicy.types)
//         ? petPolicy.types
//         : [];

//       const legacyPet = legacyPetTypes[0];

//       const rawPrice =
//         petPolicy.charge !== undefined &&
//         petPolicy.charge !== null &&
//         petPolicy.charge !== ""
//           ? petPolicy.charge
//           : legacyPet?.charge ?? 0;

//       const pricePerPet = Number(rawPrice);

//       const chargePeriod =
//         petPolicy.chargePeriod ||
//         legacyPet?.chargePeriod ||
//         "perNight";

//       if (
//         !Number.isFinite(pricePerPet) ||
//         pricePerPet < 0 ||
//         !["perNight", "perStay", "perMonth"].includes(chargePeriod)
//       ) {
//         return res.status(400).json({
//           success: false,
//           message: "Pet pricing is configured incorrectly.",
//         });
//       }

//       petAmount = roundMoney(
//         totalPetCount *
//           pricePerPet *
//           getPeriodUnits(chargePeriod)
//       );

//       savedPetCharges = {
//         count: totalPetCount,
//         pricePerPet,
//         chargePeriod,
//         amount: petAmount,
//       };
//     }

//     // Calculate final booking total
//     const subtotal = roundMoney(
//       baseAmount +
//         extraGuestAmount +
//         sleepingArrangementAmount +
//         petAmount
//     );

//     const taxes = 0;
//     const totalAmount = roundMoney(subtotal + taxes);

//     // Create pending booking
//     const booking = await Booking.create({
//       user: userId,
//       property: propertyId,
//       checkIn: startDate,
//       checkOut: endDate,
//       guests: guestCount,

//       pricePerNight: rentPerNight,
//       nights,
//       baseAmount,

//       extraGuestCharges: savedExtraGuestCharges,
//       sleepingArrangementCharges: savedSleepingArrangements,
//       petCharges: savedPetCharges,

//       subtotal,
//       taxes,
//       totalAmount,

//       guestName: cleanGuestName,
//       guestPhone: cleanGuestPhone,
//       guestEmail: cleanGuestEmail,
//       specialRequest: cleanSpecialRequest,

//       status: "pending",
//     });

//     const populatedBooking = await Booking.findById(booking._id)
//       .populate("property")
//       .populate("user", "name email phone");

//     return res.status(201).json({
//       success: true,
//       message:
//         "Booking request submitted successfully. Our team will contact you for confirmation.",
//       booking: populatedBooking,
//     });
//   } catch (error) {
//     console.error("Create booking error:", error);

//     // Mongoose validation errors should not appear as generic server errors
//     if (error.name === "ValidationError" || error.name === "CastError") {
//       return res.status(400).json({
//         success: false,
//         message: error.message || "Invalid booking data.",
//       });
//     }

//     return res.status(500).json({
//       success: false,
//       message: "Unable to create booking.",
//     });
//   }
// };

// /* =====================================================
// GET MY BOOKINGS
// GET /api/bookings/my
// ===================================================== */

// export const getMyBookings = async (
// req,
// res
// ) => {
// try {
// /* =================================================
// USER
// ================================================= */

// const userId =
//   req.user?._id ||
//   req.user?.id;

// if (!userId) {
//   return res.status(401).json({
//     success: false,
//     message:
//       "Authentication required.",
//   });
// }

// /* =================================================
//    FETCH CUSTOMER BOOKINGS
// ================================================= */

// const bookings =
//   await Booking.find({
//     user:
//       userId,
//   })
//     .populate(
//       "property"
//     )
//     .sort({
//       createdAt:
//         -1,
//     });

// /* =================================================
//    RESPONSE
// ================================================= */

// return res.status(200).json({
//   success: true,

//   count:
//     bookings.length,

//   bookings,
// });

// } catch (error) {
// console.error(
// "Get my bookings error:",
// error
// );

// return res.status(500).json({
//   success: false,

//   message:
//     error.message ||
//     "Unable to fetch bookings.",
// });

// }
// };

// /* =====================================================
// GET SINGLE BOOKING
// GET /api/bookings/:id

// Customer can only see their own booking.
// ===================================================== */

// export const getBookingById = async (
// req,
// res
// ) => {
// try {
// /* =================================================
// BOOKING ID
// ================================================= */

// const {
//   id,
// } = req.params;

// if (
//   !id ||
//   !mongoose.Types.ObjectId.isValid(
//     id
//   )
// ) {
//   return res.status(400).json({
//     success: false,
//     message:
//       "Invalid booking ID.",
//   });
// }

// /* =================================================
//    USER
// ================================================= */

// const userId =
//   req.user?._id ||
//   req.user?.id;

// if (!userId) {
//   return res.status(401).json({
//     success: false,
//     message:
//       "Authentication required.",
//   });
// }

// /* =================================================
//    FIND CUSTOMER'S BOOKING
// ================================================= */

// const booking =
//   await Booking.findOne({
//     _id:
//       id,

//     user:
//       userId,
//   })
//     .populate(
//       "property"
//     )
//     .populate(
//       "user",
//       "name email phone"
//     );

// if (!booking) {
//   return res.status(404).json({
//     success: false,
//     message:
//       "Booking not found.",
//   });
// }

// /* =================================================
//    RESPONSE
// ================================================= */

// return res.status(200).json({
//   success: true,

//   booking,
// });

// } catch (error) {
// console.error(
// "Get booking error:",
// error
// );

// return res.status(500).json({
//   success: false,

//   message:
//     error.message ||
//     "Unable to fetch booking.",
// });

// }
// };

// /* =====================================================
// CUSTOMER CANCEL BOOKING

// PATCH /api/bookings/:id/cancel

// Stage 2 frontend feature.

// Backend endpoint is retained for compatibility.

// Stage 1 frontend should NOT show
// customer cancellation button.
// ===================================================== */

// export const cancelBooking = async (
// req,
// res
// ) => {
// try {
// /* =================================================
// BOOKING ID
// ================================================= */

// const {
//   id,
// } = req.params;

// if (
//   !id ||
//   !mongoose.Types.ObjectId.isValid(
//     id
//   )
// ) {
//   return res.status(400).json({
//     success: false,
//     message:
//       "Invalid booking ID.",
//   });
// }

// /* =================================================
//    USER
// ================================================= */

// const userId =
//   req.user?._id ||
//   req.user?.id;

// if (!userId) {
//   return res.status(401).json({
//     success: false,
//     message:
//       "Authentication required.",
//   });
// }

// /* =================================================
//    FIND CUSTOMER BOOKING
// ================================================= */

// const booking =
//   await Booking.findOne({
//     _id:
//       id,

//     user:
//       userId,
//   });

// if (!booking) {
//   return res.status(404).json({
//     success: false,
//     message:
//       "Booking not found.",
//   });
// }

// /* =================================================
//    STATUS CHECK
// ================================================= */

// if (
//   [
//     "cancelled",
//     "completed",
//     "rejected",
//   ].includes(
//     booking.status
//   )
// ) {
//   return res.status(400).json({
//     success: false,
//     message:
//       "This booking cannot be cancelled.",
//   });
// }

// /* =================================================
//    CHECK-IN DATE
// ================================================= */

// const bookingCheckIn =
//   normalizeDate(
//     booking.checkIn
//   );

// const today =
//   new Date();

// today.setHours(
//   0,
//   0,
//   0,
//   0
// );

// if (
//   bookingCheckIn &&
//   bookingCheckIn <=
//     today
// ) {
//   return res.status(400).json({
//     success: false,
//     message:
//       "Booking cannot be cancelled after check-in date.",
//   });
// }

// /* =================================================
//    CANCEL
// ================================================= */

// booking.status =
//   "cancelled";

// booking.cancelledAt =
//   new Date();

// const reason =
//   typeof req.body?.reason ===
//   "string"
//     ? req.body.reason.trim()
//     : "";

// booking.cancellationReason =
//   reason ||
//   "Booking cancelled by customer.";

// await booking.save();

// /* =================================================
//    UPDATED BOOKING
// ================================================= */

// const updatedBooking =
//   await Booking.findById(
//     booking._id
//   )
//     .populate(
//       "property"
//     )
//     .populate(
//       "user",
//       "name email phone"
//     );

// /* =================================================
//    RESPONSE
// ================================================= */

// return res.status(200).json({
//   success: true,

//   message:
//     "Booking cancelled successfully.",

//   booking:
//     updatedBooking,
// });

// } catch (error) {
// console.error(
// "Cancel booking error:",
// error
// );

// return res.status(500).json({
//   success: false,

//   message:
//     error.message ||
//     "Unable to cancel booking.",
// });

// }
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
  const difference = checkOut.getTime() - checkIn.getTime();

  return Math.ceil(difference / (1000 * 60 * 60 * 24));
};

/* =====================================================
CREATE BOOKING REQUEST
POST /api/bookings
===================================================== */

export const createBooking = async (req, res) => {
  try {
    const {
      propertyId,
      checkIn,
      checkOut,
      guests,
      guestName,
      guestPhone,
      guestEmail,
      specialRequest,
      sleepingArrangements = [],
      pets = [],
    } = req.body || {};

    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (
      !propertyId ||
      !mongoose.Types.ObjectId.isValid(propertyId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid property.",
      });
    }

    const startDate = normalizeDate(checkIn);
    const endDate = normalizeDate(checkOut);

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid check-in and check-out dates.",
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      return res.status(400).json({
        success: false,
        message: "Check-in date cannot be in the past.",
      });
    }

    if (endDate <= startDate) {
      return res.status(400).json({
        success: false,
        message: "Check-out date must be after check-in date.",
      });
    }

    const guestCount = Number(guests);

    if (!Number.isInteger(guestCount) || guestCount < 1) {
      return res.status(400).json({
        success: false,
        message: "Guests must be at least 1.",
      });
    }

    const cleanGuestName =
      typeof guestName === "string" ? guestName.trim() : "";

    const cleanGuestPhone =
      typeof guestPhone === "string" ? guestPhone.trim() : "";

    const cleanGuestEmail =
      typeof guestEmail === "string"
        ? guestEmail.trim().toLowerCase()
        : "";

    const cleanSpecialRequest =
      typeof specialRequest === "string"
        ? specialRequest.trim()
        : "";

    if (!cleanGuestName || !cleanGuestPhone || !cleanGuestEmail) {
      return res.status(400).json({
        success: false,
        message: "Guest name, phone and email are required.",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanGuestEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    if (cleanSpecialRequest.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Special request cannot exceed 1000 characters.",
      });
    }

    if (!Array.isArray(sleepingArrangements)) {
      return res.status(400).json({
        success: false,
        message: "Sleeping arrangements must be an array.",
      });
    }

    const property = await Property.findOne({
      _id: propertyId,
      approvalStatus: "approved",
      status: "active",
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property is not available for booking.",
      });
    }

    // Validate guest capacity
    const minimumGuests = Number(property.minGuests ?? 1);

    const maximumGuests = Number(
      property.maxGuests ?? property.guests ?? 1
    );

    if (
      !Number.isInteger(minimumGuests) ||
      minimumGuests < 1 ||
      !Number.isInteger(maximumGuests) ||
      maximumGuests < minimumGuests
    ) {
      return res.status(500).json({
        success: false,
        message: "Property guest capacity is not configured correctly.",
      });
    }

    if (guestCount < minimumGuests) {
      return res.status(400).json({
        success: false,
        message: `At least ${minimumGuests} guests are required for this property.`,
      });
    }

    const extraGuestCount = Math.max(
      0,
      guestCount - maximumGuests
    );

    const extraGuestPolicy = property.extraGuestPolicy || {};

    if (extraGuestCount > 0) {
      if (!extraGuestPolicy.enabled) {
        return res.status(400).json({
          success: false,
          message: `Maximum ${maximumGuests} guests are allowed for this property.`,
        });
      }

      const maxExtraGuests = Number(
        extraGuestPolicy.maxExtraGuests ?? 0
      );

      if (
        !Number.isInteger(maxExtraGuests) ||
        maxExtraGuests < 0 ||
        extraGuestCount > maxExtraGuests
      ) {
        return res.status(400).json({
          success: false,
          message: `Only ${Math.max(0, maxExtraGuests)} additional guests are allowed.`,
        });
      }
    }

    // Only confirmed bookings block dates
    const overlappingBooking = await Booking.findOne({
      property: propertyId,
      status: "confirmed",
      checkIn: { $lt: endDate },
      checkOut: { $gt: startDate },
    }).lean();

    if (overlappingBooking) {
      return res.status(409).json({
        success: false,
        message: "This property is already booked for the selected dates.",
      });
    }

    const nights = calculateNights(startDate, endDate);

    if (!Number.isInteger(nights) || nights <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking duration.",
      });
    }

    /*
     * perNight = number of nights
     * perStay  = one charge for the booking
     * perMonth = each started 30-night period
     */
    const getPeriodUnits = (period) => {
      if (period === "perStay") return 1;
      if (period === "perMonth") return Math.ceil(nights / 30);
      return nights;
    };

    const roundMoney = (amount) =>
      Math.round((amount + Number.EPSILON) * 100) / 100;

    // Base property rent
    const rentPerNight = Number(property.rent);

    if (!Number.isFinite(rentPerNight) || rentPerNight <= 0) {
      return res.status(400).json({
        success: false,
        message: "Property price is not available.",
      });
    }

    const baseAmount = roundMoney(rentPerNight * nights);

    // Extra guest pricing
    let extraGuestAmount = 0;

    let savedExtraGuestCharges = {
      count: extraGuestCount,
      pricePerPerson: 0,
      chargePeriod: extraGuestPolicy.chargePeriod || "perNight",
      amount: 0,
    };

    if (extraGuestCount > 0) {
      const pricePerPerson = Number(
        extraGuestPolicy.pricePerPerson ?? 0
      );

      const chargePeriod =
        extraGuestPolicy.chargePeriod || "perNight";

      if (
        !Number.isFinite(pricePerPerson) ||
        pricePerPerson < 0 ||
        !["perNight", "perStay", "perMonth"].includes(chargePeriod)
      ) {
        return res.status(400).json({
          success: false,
          message: "Extra guest pricing is configured incorrectly.",
        });
      }

      extraGuestAmount = roundMoney(
        extraGuestCount *
          pricePerPerson *
          getPeriodUnits(chargePeriod)
      );

      savedExtraGuestCharges = {
        count: extraGuestCount,
        pricePerPerson,
        chargePeriod,
        amount: extraGuestAmount,
      };
    }

    // Sleeping arrangements pricing
    const configuredArrangements = Array.isArray(
      property.sleepingArrangements
    )
      ? property.sleepingArrangements
      : [];

    const savedSleepingArrangements = [];
    let sleepingArrangementAmount = 0;

    const selectedSleepingTypes = new Set();

    for (const selection of sleepingArrangements) {
      const type = selection?.type;
      const quantity = Number(selection?.quantity);

      if (
        !type ||
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        selectedSleepingTypes.has(type)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid sleeping arrangement selection.",
        });
      }

      selectedSleepingTypes.add(type);

      const configured = configuredArrangements.find(
        (item) => item.type === type
      );

      if (!configured) {
        return res.status(400).json({
          success: false,
          message: `Sleeping arrangement '${type}' is not available.`,
        });
      }

      const availableQuantity = Number(configured.quantity ?? 0);

      if (quantity > availableQuantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${availableQuantity} unit(s) of '${type}' are available.`,
        });
      }

      const isPaid = Boolean(configured.isPaid);
      const pricePerUnit = Number(configured.price ?? 0);
      const chargePeriod = configured.chargePeriod || "perStay";

      if (
        !Number.isFinite(pricePerUnit) ||
        pricePerUnit < 0 ||
        !["perNight", "perStay", "perMonth"].includes(chargePeriod)
      ) {
        return res.status(400).json({
          success: false,
          message: `Pricing for '${type}' is configured incorrectly.`,
        });
      }

      const amount = isPaid
        ? roundMoney(
            quantity *
              pricePerUnit *
              getPeriodUnits(chargePeriod)
          )
        : 0;

      sleepingArrangementAmount = roundMoney(
        sleepingArrangementAmount + amount
      );

      savedSleepingArrangements.push({
        type,
        label: configured.label || "",
        quantity,
        pricePerUnit: isPaid ? pricePerUnit : 0,
        chargePeriod,
        amount,
      });
    }
        // =====================================================
    // PET POLICY — TYPE VALIDATION + CUSTOM OTHER PET NAME
    // =====================================================

    if (!Array.isArray(pets)) {
      return res.status(400).json({
        success: false,
        message: "Pets must be an array of pet selections.",
      });
    }

    const petPolicy = property.petPolicy || {};
    

    const supportedPetTypes = new Set([
      "dog",
      "cat",
      "bird",
      "rabbit",
      "other",
    ]);

    const savedPetCharges = [];
    let petAmount = 0;
    let totalPetCount = 0;
    const selectedPetTypes = new Set();

    if (pets.length > 0 && !petPolicy.allowed) {
      return res.status(400).json({
        success: false,
        message: "Pets are not allowed at this property.",
      });
    }

    for (const selection of pets) {
      const type =
        typeof selection?.type === "string"
          ? selection.type.trim().toLowerCase()
          : "";

      const count = Number(selection?.count);

      const customName =
        typeof selection?.customName === "string"
          ? selection.customName.trim()
          : "";

      if (
        !supportedPetTypes.has(type) ||
        !Number.isInteger(count) ||
        count < 1 ||
        selectedPetTypes.has(type)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid pet type or quantity.",
        });
      }

      if (type === "other" && (!customName || customName.length > 100)) {
        return res.status(400).json({
          success: false,
          message:
            "Please provide a valid custom pet name (maximum 100 characters).",
        });
      }

      selectedPetTypes.add(type);
      totalPetCount += count;

      // All supported pet types use the property's common pet pricing.

      // Pet pricing: support current and legacy property records
      const legacyPetType = Array.isArray(petPolicy.types)
        ? petPolicy.types.find((item) => Number(item?.charge) > 0)
        : null;

      const rawPetPrice =
        Number(petPolicy.charge) > 0
          ? petPolicy.charge
          : Number(petPolicy.price) > 0
            ? petPolicy.price
            : legacyPetType?.charge ?? 0;

      const pricePerPet = Number(rawPetPrice);

      const chargePeriod =
        petPolicy.chargePeriod ||
        legacyPetType?.chargePeriod ||
        "perStay";

const amount = roundMoney(
  count * pricePerPet * getPeriodUnits(chargePeriod)
);

petAmount = roundMoney(petAmount + amount);

savedPetCharges.push({
  type,
  label: type === "other" ? customName : type,
  customName: type === "other" ? customName : "",
  count,
  pricePerPet,
  chargePeriod,
  amount,
});
      }

    const maxPets = Number(petPolicy.maxPets ?? 0);

    if (
      totalPetCount > 0 &&
      (
        !Number.isInteger(maxPets) ||
        maxPets < 1 ||
        totalPetCount > maxPets
      )
    ) {
      return res.status(400).json({
        success: false,
        message: `Maximum ${Math.max(0, maxPets)} pet(s) are allowed at this property.`,
      });
    }

    // Calculate final booking total
    const subtotal = roundMoney(
      baseAmount +
        extraGuestAmount +
        sleepingArrangementAmount +
        petAmount
    );

    const taxes = 0;
    const totalAmount = roundMoney(subtotal + taxes);

    // Create pending booking
    const booking = await Booking.create({
      user: userId,
      property: propertyId,
      checkIn: startDate,
      checkOut: endDate,
      guests: guestCount,

      pricePerNight: rentPerNight,
      nights,
      baseAmount,

      extraGuestCharges: savedExtraGuestCharges,
      sleepingArrangementCharges: savedSleepingArrangements,
      petCharges: savedPetCharges,

      subtotal,
      taxes,
      totalAmount,

      guestName: cleanGuestName,
      guestPhone: cleanGuestPhone,
      guestEmail: cleanGuestEmail,
      specialRequest: cleanSpecialRequest,

      status: "pending",
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate("property")
      .populate("user", "name email phone");

    return res.status(201).json({
      success: true,
      message:
        "Booking request submitted successfully. Our team will contact you for confirmation.",
      booking: populatedBooking,
    });
  } catch (error) {
    console.error("Create booking error:", error);

    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: error.message || "Invalid booking data.",
      });
    }

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

export const getMyBookings = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const bookings = await Booking.find({
      user: userId,
    })
      .populate("property")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("Get my bookings error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to fetch bookings.",
    });
  }
};

/* =====================================================
GET SINGLE BOOKING
GET /api/bookings/:id

Customer can only see their own booking.
===================================================== */

export const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID.",
      });
    }

    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const booking = await Booking.findOne({
      _id: id,
      user: userId,
    })
      .populate("property")
      .populate("user", "name email phone");

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
    console.error("Get booking error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to fetch booking.",
    });
  }
};

/* =====================================================
CUSTOMER CANCEL BOOKING
PATCH /api/bookings/:id/cancel
===================================================== */

export const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID.",
      });
    }

    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const booking = await Booking.findOne({
      _id: id,
      user: userId,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    if (
      ["cancelled", "completed", "rejected"].includes(
        booking.status
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "This booking cannot be cancelled.",
      });
    }

    const bookingCheckIn = normalizeDate(booking.checkIn);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (bookingCheckIn && bookingCheckIn <= today) {
      return res.status(400).json({
        success: false,
        message: "Booking cannot be cancelled after check-in date.",
      });
    }

    booking.status = "cancelled";
    booking.cancelledAt = new Date();

    const reason =
      typeof req.body?.reason === "string"
        ? req.body.reason.trim()
        : "";

    booking.cancellationReason =
      reason || "Booking cancelled by customer.";

    await booking.save();

    const updatedBooking = await Booking.findById(booking._id)
      .populate("property")
      .populate("user", "name email phone");

    return res.status(200).json({
      success: true,
      message: "Booking cancelled successfully.",
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Cancel booking error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to cancel booking.",
    });
  }
};