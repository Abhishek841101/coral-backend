import mongoose from "mongoose";

const enquirySchema = new mongoose.Schema(
  {
    /* ================= USER ================= */

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    /* ================= PROPERTY ================= */

    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      index: true,
    },

    /* ================= CONTACT ================= */

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    /* ================= MESSAGE ================= */

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    /* ================= ENQUIRY STATUS ================= */

    status: {
      type: String,
      enum: [
        "new",
        "contacted",
        "follow_up",
        "closed",
        "cancelled",
      ],
      default: "new",
      index: true,
    },

    /* ================= ADMIN NOTES ================= */

    adminNote: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },

    contactedAt: {
      type: Date,
      default: null,
    },

    closedAt: {
      type: Date,
      default: null,
    },

    /* ================= SOURCE ================= */

    source: {
      type: String,
      enum: [
        "website",
        "property_page",
        "search",
        "other",
      ],
      default: "website",
    },
  },
  {
    timestamps: true,
  }
);

/* ================= INDEXES ================= */

enquirySchema.index({
  property: 1,
  createdAt: -1,
});

enquirySchema.index({
  status: 1,
  createdAt: -1,
});

enquirySchema.index({
  user: 1,
  createdAt: -1,
});

const Enquiry = mongoose.model(
  "Enquiry",
  enquirySchema
);

export default Enquiry;