

// import mongoose from "mongoose";

// const bookingSchema = new mongoose.Schema(
// {
// /* =====================================================
// USER
// ===================================================== */

// user: {
//   type: mongoose.Schema.Types.ObjectId,
//   ref: "User",
//   required: true,
//   index: true,
// },

// /* =====================================================
//    PROPERTY / FLAT
// ===================================================== */

// property: {
//   type: mongoose.Schema.Types.ObjectId,
//   ref: "Property",
//   required: true,
//   index: true,
// },

// /* =====================================================
//    DATES

//    checkIn  = occupied from this date
//    checkOut = NOT occupied on this date

//    Example:
//    10 Sep → 15 Sep = 5 nights
//    Occupied: 10, 11, 12, 13, 14
//    15 Sep is checkout and available.
// ===================================================== */

// checkIn: {
//   type: Date,
//   required: true,
// },

// checkOut: {
//   type: Date,
//   required: true,
// },

// /* =====================================================
//    GUESTS

//    Actual maximum guest limit comes from:
//    Property.maxGuests

//    No rooms field.
// ===================================================== */

// guests: {
//   type: Number,
//   required: true,
//   min: 1,
// },

// /* =====================================================
//    PRICE SNAPSHOT

//    Coral pricing:

//    property rent × nights

//    No room multiplier.
//    No automatic 5% tax.
// ===================================================== */

// pricePerNight: {
//   type: Number,
//   required: true,
//   min: 0,
// },

// nights: {
//   type: Number,
//   required: true,
//   min: 1,
// },

// subtotal: {
//   type: Number,
//   required: true,
//   min: 0,
// },

// /* =====================================================
//    TAXES

//    Kept for compatibility.

//    Coral does NOT automatically calculate tax.
//    Admin can handle GST/payment manually later.
// ===================================================== */

// taxes: {
//   type: Number,
//   default: 0,
//   min: 0,
// },

// /* =====================================================
//    TOTAL AMOUNT

//    Stage 1:

//    totalAmount = subtotal + taxes

//    Since automatic taxes are not applied,
//    normally totalAmount = subtotal.
// ===================================================== */

// totalAmount: {
//   type: Number,
//   required: true,
//   min: 0,
// },

// /* =====================================================
//    CUSTOMER DETAILS
// ===================================================== */

// guestName: {
//   type: String,
//   required: true,
//   trim: true,
//   maxlength: 150,
// },

// guestPhone: {
//   type: String,
//   required: true,
//   trim: true,
//   maxlength: 30,
// },

// guestEmail: {
//   type: String,
//   required: true,
//   lowercase: true,
//   trim: true,
//   maxlength: 254,
// },

// /* =====================================================
//    SPECIAL REQUEST
// ===================================================== */

// specialRequest: {
//   type: String,
//   trim: true,
//   maxlength: 1000,
//   default: "",
// },

// /* =====================================================
//    BOOKING STATUS

//    pending
//      Customer submitted request.
//      Does NOT block property dates.

//    confirmed
//      Admin confirmed booking.
//      BLOCKS property dates.

//    rejected
//      Request rejected.
//      Does NOT block dates.

//    cancelled
//      Booking cancelled.
//      Does NOT block dates.

//    completed
//      Stay completed.
//      Does NOT block future availability.
// ===================================================== */

// status: {
//   type: String,
//   enum: [
//     "pending",
//     "confirmed",
//     "rejected",
//     "cancelled",
//     "completed",
//   ],
//   default: "pending",
//   index: true,
// },

// /* =====================================================
//    ADMIN CONFIRMATION
// ===================================================== */

// confirmedBy: {
//   type: mongoose.Schema.Types.ObjectId,
//   ref: "User",
//   default: null,
// },

// confirmedAt: {
//   type: Date,
//   default: null,
// },

// /* =====================================================
//    REJECTION
// ===================================================== */

// rejectionReason: {
//   type: String,
//   trim: true,
//   maxlength: 1000,
//   default: "",
// },

// /* =====================================================
//    CANCELLATION
// ===================================================== */

// cancellationReason: {
//   type: String,
//   trim: true,
//   maxlength: 1000,
//   default: "",
// },

// cancelledAt: {
//   type: Date,
//   default: null,
// },

// },
// {
// timestamps: true,
// }
// );

// /* =====================================================
// VALIDATION
// ===================================================== */

// /*
// Check-out must be after check-in.

// This validation prevents invalid booking ranges.
// */

// bookingSchema.pre("validate", function (next) {
// if (this.checkIn && this.checkOut) {
// if (this.checkOut <= this.checkIn) {
// return next(
// new Error("Check-out date must be after check-in date.")
// );
// }
// }

// next();
// });

// /* =====================================================
// INDEXES
// ===================================================== */

// /*
// Property/date lookup.

// Used for checking confirmed booking conflicts.

// IMPORTANT:
// Application logic checks only:
// status: "confirmed"
// */

// bookingSchema.index({
// property: 1,
// status: 1,
// checkIn: 1,
// checkOut: 1,
// });

// /*
// Customer booking history.
// */

// bookingSchema.index({
// user: 1,
// createdAt: -1,
// });

// /*
// Admin booking dashboard.
// */

// bookingSchema.index({
// status: 1,
// createdAt: -1,
// });

// /*
// Property booking history.
// */

// bookingSchema.index({
// property: 1,
// createdAt: -1,
// });

// /* =====================================================
// MODEL
// ===================================================== */

// const Booking = mongoose.model(
// "Booking",
// bookingSchema
// );

// export default Booking;






import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
{
user: {
type: mongoose.Schema.Types.ObjectId,
ref: "User",
required: true,
},

property: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Property",
  required: true,
},

checkIn: {
  type: Date,
  required: true,
},

checkOut: {
  type: Date,
  required: true,
},

guests: {
  type: Number,
  required: true,
  min: 1,
},

pricePerNight: {
  type: Number,
  required: true,
  min: 0,
},

nights: {
  type: Number,
  required: true,
  min: 1,
},

subtotal: {
  type: Number,
  required: true,
  min: 0,
},

taxes: {
  type: Number,
  default: 0,
  min: 0,
},

totalAmount: {
  type: Number,
  required: true,
  min: 0,
},

guestName: {
  type: String,
  required: true,
  trim: true,
},

guestPhone: {
  type: String,
  required: true,
  trim: true,
},

guestEmail: {
  type: String,
  required: true,
  trim: true,
  lowercase: true,
},

specialRequest: {
  type: String,
  default: "",
  trim: true,
},

status: {
  type: String,
  enum: [
    "pending",
    "confirmed",
    "rejected",
    "cancelled",
    "completed",
  ],
  default: "pending",
  index: true,
},

confirmedBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  default: null,
},

confirmedAt: {
  type: Date,
  default: null,
},

rejectionReason: {
  type: String,
  default: "",
  trim: true,
},

cancellationReason: {
  type: String,
  default: "",
  trim: true,
},

cancelledAt: {
  type: Date,
  default: null,
},

/* =====================================================
   PAYMENT
===================================================== */

paymentStatus: {
  type: String,
  enum: ["pending", "partial", "paid", "refunded"],
  default: "pending",
  index: true,
},

paymentMethod: {
  type: String,
  default: "",
  trim: true,
},

paymentAmount: {
  type: Number,
  default: 0,
  min: 0,
},

paymentReference: {
  type: String,
  default: "",
  trim: true,
},

paymentNote: {
  type: String,
  default: "",
  trim: true,
},

paymentUpdatedAt: {
  type: Date,
  default: null,
},

/* =====================================================
   CUSTOMER DOCUMENTS
===================================================== */

documents: [
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    url: {
      type: String,
      required: true,
    },

    publicId: {
      type: String,
      default: "",
    },

    resourceType: {
      type: String,
      default: "auto",
    },

    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
],

},
{
timestamps: true,
}
);

/* =====================================================
VALIDATION
===================================================== */

bookingSchema.pre("validate", function (next) {
if (this.checkIn && this.checkOut) {
if (this.checkOut <= this.checkIn) {
return next(
new Error("Check-out date must be after check-in date.")
);
}
}

next();
});

/* =====================================================
INDEXES
===================================================== */

bookingSchema.index({
property: 1,
status: 1,
checkIn: 1,
checkOut: 1,
});

bookingSchema.index({
user: 1,
createdAt: -1,
});

bookingSchema.index({
status: 1,
createdAt: -1,
});

bookingSchema.index({
property: 1,
createdAt: -1,
});

bookingSchema.index({
paymentStatus: 1,
});

export default mongoose.model("Booking", bookingSchema);