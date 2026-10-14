
import mongoose from "mongoose";

const chargePeriods = ["perNight", "perStay", "perMonth"];

const extraGuestChargeSchema = new mongoose.Schema(
  {
    count: {
      type: Number,
      default: 0,
      min: 0,
    },
    pricePerPerson: {
      type: Number,
      default: 0,
      min: 0,
    },
    chargePeriod: {
      type: String,
      enum: chargePeriods,
      default: "perNight",
    },
    amount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const sleepingArrangementChargeSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "extra-bed",
        "mattress",
        "folding-bed",
        "floor-bedding",
        "sofa-bed",
        "other",
      ],
      required: true,
    },
    label: {
      type: String,
      default: "",
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    pricePerUnit: {
      type: Number,
      default: 0,
      min: 0,
    },
    chargePeriod: {
      type: String,
      enum: chargePeriods,
      default: "perStay",
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const petChargeSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["dog", "cat", "bird", "rabbit", "other"],
      required: true,
    },
    label: {
      type: String,
      default: "",
      trim: true,
    },
    count: {
      type: Number,
      required: true,
      min: 1,
    },
    pricePerPet: {
      type: Number,
      default: 0,
      min: 0,
    },
    chargePeriod: {
      type: String,
      enum: chargePeriods,
      default: "perStay",
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

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

    // Legacy field: base property's price per night.
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

    // Base rent only, excluding additional charges.
    baseAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // Additional guests beyond the property's normal maxGuests.
    extraGuestCharges: {
      type: extraGuestChargeSchema,
      default: () => ({}),
    },

    // Selected extra beds, mattresses, and other arrangements.
    sleepingArrangementCharges: {
      type: [sleepingArrangementChargeSchema],
      default: [],
    },

    // Selected pets and their charges.
    petCharges: {
      type: [petChargeSchema],
      default: [],
    },

    // Base rent + extra guest + sleeping arrangement + pet charges.
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

    // PAYMENT
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

    // CUSTOMER DOCUMENTS
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

// Validate booking dates.
bookingSchema.pre("validate", function (next) {
  if (
    this.checkIn &&
    this.checkOut &&
    this.checkOut <= this.checkIn
  ) {
    return next(
      new Error("Check-out date must be after check-in date.")
    );
  }

  next();
});

// INDEXES
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
