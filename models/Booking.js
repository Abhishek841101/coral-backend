
import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    /* ================= USER ================= */

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /* ================= PROPERTY ================= */

    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      index: true,
    },

    /* ================= DATES ================= */

    checkIn: {
      type: Date,
      required: true,
    },

    checkOut: {
      type: Date,
      required: true,
    },

    /* ================= GUESTS ================= */

    guests: {
      type: Number,
      required: true,
      min: 1,
    },

    rooms: {
      type: Number,
      default: 1,
      min: 1,
    },

    /* ================= PRICE SNAPSHOT ================= */

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

    /* ================= CUSTOMER ================= */

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
      lowercase: true,
      trim: true,
    },

    specialRequest: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    /* ================= BOOKING STATUS ================= */

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

    /* ================= PAYMENT ================= */

    paymentStatus: {
      type: String,
      enum: [
        "pending",
        "paid",
        "failed",
        "refunded",
      ],
      default: "pending",
      index: true,
    },

    paymentMethod: {
      type: String,
      enum: [
        "online",
        "cash",
        "not_selected",
      ],
      default: "not_selected",
    },

    paymentId: {
      type: String,
      default: "",
      trim: true,
    },

    /* ================= ADMIN ================= */

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
      trim: true,
      default: "",
    },

    cancellationReason: {
      type: String,
      trim: true,
      default: "",
    },

    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/* ================= INDEXES ================= */

bookingSchema.index({
  property: 1,
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

const Booking = mongoose.model(
  "Booking",
  bookingSchema
);

export default Booking;
