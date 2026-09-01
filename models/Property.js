import mongoose from "mongoose";

const propertySchema = new mongoose.Schema(
  {
    /* =====================================================
       OWNER
    ===================================================== */

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /* =====================================================
       BASIC INFORMATION
    ===================================================== */

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },

    propertyType: {
      type: String,
      enum: [
        "room",
        "pg",
        "flat",
        "apartment",
        "house",
        "villa",
        "studio",
      ],
      required: true,
      index: true,
    },

    bhk: {
      type: Number,
      enum: [1, 2, 3, 4, 5],
      default: null,
    },

    /* =====================================================
       LOCATION
    ===================================================== */

    city: {
      type: String,
      required: true,
      trim: true,
      default: "Nagpur",
      index: true,
    },

    locality: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    landmark: {
      type: String,
      trim: true,
      default: "",
    },

    pincode: {
      type: String,
      trim: true,
      default: "",
    },

    location: {
      latitude: {
        type: Number,
        default: null,
      },

      longitude: {
        type: Number,
        default: null,
      },
    },

    /* =====================================================
       RENT & MONEY
    ===================================================== */

    rent: {
      type: Number,
      required: true,
      min: 0,
    },

    rentPeriod: {
      type: String,
      enum: ["day", "month", "year"],
      default: "month",
    },

    securityDeposit: {
      type: Number,
      default: 0,
      min: 0,
    },

    maintenance: {
      type: Number,
      default: 0,
      min: 0,
    },

    maintenancePeriod: {
      type: String,
      enum: ["included", "monthly", "yearly"],
      default: "included",
    },

    /* =====================================================
       PROPERTY DETAILS
    ===================================================== */

    area: {
      type: Number,
      default: null,
      min: 0,
    },

    areaUnit: {
      type: String,
      enum: ["sqft", "sqm"],
      default: "sqft",
    },

    bedrooms: {
      type: Number,
      default: 0,
      min: 0,
    },

    bathrooms: {
      type: Number,
      default: 0,
      min: 0,
    },

    balconies: {
      type: Number,
      default: 0,
      min: 0,
    },

    floor: {
      type: Number,
      default: null,
    },

    totalFloors: {
      type: Number,
      default: null,
    },

    furnishing: {
      type: String,
      enum: [
        "fully-furnished",
        "semi-furnished",
        "unfurnished",
      ],
      default: "unfurnished",
    },

    /* =====================================================
       CAPACITY
    ===================================================== */

    guests: {
      type: Number,
      default: 1,
      min: 1,
    },

    /* =====================================================
       AMENITIES
    ===================================================== */

    amenities: [
      {
        type: String,
        trim: true,
      },
    ],

    /* =====================================================
       PROPERTY IMAGES
    ===================================================== */

    images: [
      {
        url: {
          type: String,
          required: true,
        },

        publicId: {
          type: String,
          required: true,
        },

        isPrimary: {
          type: Boolean,
          default: false,
        },
      },
    ],

    /* =====================================================
       AVAILABILITY
    ===================================================== */

    availability: {
      type: String,
      enum: [
        "available",
        "occupied",
        "unavailable",
      ],
      default: "available",
      index: true,
    },

    availableFrom: {
      type: Date,
      default: null,
    },

    /* =====================================================
       PROPERTY RULES
    ===================================================== */

    rules: [
      {
        type: String,
        trim: true,
      },
    ],

    /* =====================================================
       APPROVAL
    ===================================================== */

    approvalStatus: {
      type: String,
      enum: [
        "pending",
        "approved",
        "rejected",
      ],
      default: "pending",
      index: true,
    },

    rejectionReason: {
      type: String,
      trim: true,
      default: "",
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    /* =====================================================
       PUBLIC STATUS
    ===================================================== */

    status: {
      type: String,
      enum: [
        "draft",
        "active",
        "inactive",
        "rented",
        "deleted",
      ],
      default: "draft",
      index: true,
    },

    /* =====================================================
       STATS
    ===================================================== */

    views: {
      type: Number,
      default: 0,
      min: 0,
    },

    favoritesCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    enquiriesCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    bookingsCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    /* =====================================================
       RATING
    ===================================================== */

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    reviewsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

/* =====================================================
   INDEXES
===================================================== */

propertySchema.index({
  city: 1,
  locality: 1,
});

propertySchema.index({
  propertyType: 1,
  bhk: 1,
});

propertySchema.index({
  rent: 1,
});

propertySchema.index({
  approvalStatus: 1,
  status: 1,
});

propertySchema.index({
  title: "text",
  description: "text",
  locality: "text",
  address: "text",
});

/* =====================================================
   MODEL
===================================================== */

const Property = mongoose.model(
  "Property",
  propertySchema
);

export default Property;