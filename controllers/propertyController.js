import Property from "../models/Property.js";
import cloudinary from "../config/cloudinary.js";
import { Readable } from "stream";

/* =====================================================
CLOUDINARY IMAGE UPLOAD
===================================================== */

const uploadToCloudinary = (buffer) => {
return new Promise((resolve, reject) => {
const stream = cloudinary.uploader.upload_stream(
{
folder: "coral/properties",
resource_type: "image",
},
(error, result) => {
if (error) {
reject(error);
} else {
resolve(result);
}
}
);

Readable.from(buffer).pipe(stream);

});
};

/* =====================================================
SAFE NUMBER
===================================================== */

const toNumberOrNull = (value) => {
if (
value === undefined ||
value === null ||
value === "" ||
value === "null" ||
value === "undefined"
) {
return null;
}

const number = Number(value);

return Number.isNaN(number) ? null : number;
};

/* =====================================================
SAFE INTEGER
===================================================== */

const toIntegerOrNull = (value) => {
const number = toNumberOrNull(value);

if (number === null) {
return null;
}

if (!Number.isInteger(number)) {
return null;
}

return number;
};

/* =====================================================
SAFE ARRAY
===================================================== */

const parseArray = (value) => {
if (!value) {
return [];
}

if (Array.isArray(value)) {
return value;
}

if (typeof value === "string") {
try {
const parsed = JSON.parse(value);

  if (Array.isArray(parsed)) {
    return parsed;
  }
} catch {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

}

return [];
};
const CHARGE_PERIODS = ["perNight", "perStay", "perMonth"];

const SLEEPING_TYPES = [
  "extra-bed",
  "mattress",
  "folding-bed",
  "floor-bedding",
  "sofa-bed",
  "other",
];

const PET_TYPES = ["dog", "cat", "bird", "rabbit", "other"];

const parseObject = (value, fallback = {}) => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // Invalid JSON is handled by the fallback.
    }
  }

  return fallback;
};

const parseBoolean = (value, fallback = false) => {
  if (typeof value === "boolean") return value;
  if (value === "true" || value === "1" || value === 1) return true;
  if (value === "false" || value === "0" || value === 0) return false;

  return fallback;
};

const parseNonNegativeNumber = (value, fieldName) => {
  if (
    value === undefined ||
    value === null ||
    value === "" ||
    !Number.isFinite(Number(value)) ||
    Number(value) < 0
  ) {
    throw new Error(`${fieldName} must be a valid non-negative number.`);
  }

  return Number(value);
};

const parseCapacitySettings = (body, existing = {}) => {
  const minGuests = toIntegerOrNull(
    body.minGuests ?? existing.minGuests ?? 1
  );

  const maxGuests = toIntegerOrNull(
    body.maxGuests ??
      body.guests ??
      existing.maxGuests ??
      existing.guests ??
      1
  );

  if (minGuests === null || minGuests < 1) {
    throw new Error("Minimum guests must be at least 1.");
  }

  if (maxGuests === null || maxGuests < 1) {
    throw new Error("Maximum guests must be at least 1.");
  }

  if (minGuests > maxGuests) {
    throw new Error("Minimum guests cannot exceed maximum guests.");
  }

  return { minGuests, maxGuests };
};

const parseExtraGuestPolicy = (value, existing = {}) => {
  const data = {
    ...existing,
    ...parseObject(value),
  };

  const enabled = parseBoolean(data.enabled, false);
  const maxExtraGuests = toIntegerOrNull(data.maxExtraGuests ?? 0);
  const pricePerPerson = parseNonNegativeNumber(
    data.pricePerPerson ?? 0,
    "Extra guest price"
  );

  const chargePeriod = data.chargePeriod ?? "perNight";

  if (maxExtraGuests === null || maxExtraGuests < 0) {
    throw new Error("Maximum extra guests cannot be negative.");
  }

  if (!CHARGE_PERIODS.includes(chargePeriod)) {
    throw new Error("Invalid extra guest charge period.");
  }

  if (enabled && maxExtraGuests < 1) {
    throw new Error("Maximum extra guests must be at least 1 when enabled.");
  }

  return {
    enabled,
    maxExtraGuests: enabled ? maxExtraGuests : 0,
    pricePerPerson: enabled ? pricePerPerson : 0,
    chargePeriod,
  };
};

const parseSleepingArrangements = (value) => {
  const arrangements = parseArray(value);

  return arrangements.map((item, index) => {
    const arrangement = parseObject(item);
    const type = arrangement.type;

    if (!SLEEPING_TYPES.includes(type)) {
      throw new Error(
        `Invalid sleeping arrangement type at item ${index + 1}.`
      );
    }

    const quantity = toIntegerOrNull(arrangement.quantity ?? 1);

    if (quantity === null || quantity < 1) {
      throw new Error("Sleeping arrangement quantity must be at least 1.");
    }

    const isPaid = parseBoolean(arrangement.isPaid, false);
    const price = parseNonNegativeNumber(
      arrangement.price ?? 0,
      "Sleeping arrangement price"
    );

    const chargePeriod = arrangement.chargePeriod ?? "perStay";

    if (!CHARGE_PERIODS.includes(chargePeriod)) {
      throw new Error("Invalid sleeping arrangement charge period.");
    }

    return {
      type,
      label: String(arrangement.label ?? type).trim(),
      quantity,
      isPaid,
      price: isPaid ? price : 0,
      chargePeriod,
    };
  });
};

const parsePetPolicy = (value, existing = {}) => {
  const data = {
    ...existing,
    ...parseObject(value),
  };

  const allowed = parseBoolean(data.allowed, false);
  const maxPets = toIntegerOrNull(data.maxPets ?? 0);
  const types = parseArray(data.types);

  if (maxPets === null || maxPets < 0) {
    throw new Error("Maximum pets cannot be negative.");
  }

  if (!allowed) {
    return {
      allowed: false,
      maxPets: 0,
      types: [],
    };
  }

  if (maxPets < 1) {
    throw new Error("Maximum pets must be at least 1 when pets are allowed.");
  }

  const parsedTypes = types.map((item, index) => {
    const pet = parseObject(item);

    if (!PET_TYPES.includes(pet.type)) {
      throw new Error(`Invalid pet type at item ${index + 1}.`);
    }

    const charge = parseNonNegativeNumber(
      pet.charge ?? 0,
      "Pet charge"
    );

    const chargePeriod = pet.chargePeriod ?? "perStay";

    if (!CHARGE_PERIODS.includes(chargePeriod)) {
      throw new Error("Invalid pet charge period.");
    }

    return {
      type: pet.type,
      label: String(pet.label ?? pet.type).trim(),
      charge,
      chargePeriod,
    };
  });

  if (parsedTypes.length === 0) {
    throw new Error("Select at least one pet type.");
  }

  return {
    allowed: true,
    maxPets,
    types: parsedTypes,
  };
};

/* =====================================================
CREATE PROPERTY
POST /api/properties
===================================================== */

export const createProperty = async (req, res) => {
  try {
    /* ================================================
       AUTH CHECK
    ================================================ */

    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    /* ================================================
       REQUEST BODY
    ================================================ */

    const body = req.body || {};

    const {
      title,
      description,
      propertyType,
      bhk,
      city,
      locality,
      address,
      landmark,
      pincode,
      latitude,
      longitude,
      rent,
      rentPeriod,
      securityDeposit,
      maintenance,
      maintenancePeriod,
      area,
      areaUnit,
      bedrooms,
      bathrooms,
      balconies,
      floor,
      totalFloors,
      furnishing,
      amenities,
      rules,
      availableFrom,
    } = body;

    /* ================================================
       REQUIRED FIELD VALIDATION
    ================================================ */

    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Property title is required.",
      });
    }

    if (
      typeof description !== "string" ||
      !description.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Property description is required.",
      });
    }

    if (!propertyType) {
      return res.status(400).json({
        success: false,
        message: "Property type is required.",
      });
    }

    if (typeof city !== "string" || !city.trim()) {
      return res.status(400).json({
        success: false,
        message: "City is required.",
      });
    }

    if (
      typeof locality !== "string" ||
      !locality.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Locality is required.",
      });
    }

    if (
      typeof address !== "string" ||
      !address.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Address is required.",
      });
    }

    if (
      rent === undefined ||
      rent === null ||
      rent === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "Rent is required.",
      });
    }

    /* ================================================
       RENT VALIDATION
    ================================================ */

    const rentNumber = Number(rent);

    if (
      !Number.isFinite(rentNumber) ||
      rentNumber < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid rent.",
      });
    }

    /* ================================================
       GUEST CAPACITY

       minGuests: minimum allowed guests
       maxGuests: regular included guest capacity
       guests: legacy compatibility field
    ================================================ */

    const { minGuests, maxGuests: finalMaxGuests } =
      parseCapacitySettings(body);

    /* ================================================
       EXTRA GUEST POLICY
    ================================================ */

    const extraGuestPolicy = parseExtraGuestPolicy(
      body.extraGuestPolicy
    );

    /* ================================================
       SLEEPING ARRANGEMENTS
    ================================================ */

    const sleepingArrangements =
      parseSleepingArrangements(
        body.sleepingArrangements
      );

    /* ================================================
       PET POLICY
    ================================================ */

    const petPolicy = parsePetPolicy(
      body.petPolicy
    );

    /* ================================================
       PARSE AMENITIES AND RULES
    ================================================ */

    const parsedAmenities = parseArray(amenities);
    const parsedRules = parseArray(rules);

    /* ================================================
       UPLOAD IMAGES TO CLOUDINARY
    ================================================ */

    const uploadedImages = [];

    if (Array.isArray(req.files) && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const result = await uploadToCloudinary(
            file.buffer
          );

          uploadedImages.push({
            url: result.secure_url,
            publicId: result.public_id,
            isPrimary: uploadedImages.length === 0,
          });
        } catch (uploadError) {
          console.error(
            "Cloudinary upload error:",
            uploadError
          );

          return res.status(500).json({
            success: false,
            message: "Unable to upload property image.",
          });
        }
      }
    }

    /* ================================================
       CREATE PROPERTY
    ================================================ */
console.log("CREATE PROPERTY BODY:", req.body);
console.log("MIN GUESTS:", req.body.minGuests);
console.log("EXTRA POLICY:", req.body.extraGuestPolicy);
console.log("SLEEPING:", req.body.sleepingArrangements);
console.log("PET POLICY:", req.body.petPolicy);
    const property = await Property.create({
      /* OWNER */
      owner: req.user._id,

      /* BASIC DETAILS */
      title: title.trim(),
      description: description.trim(),
      propertyType,
      bhk: toNumberOrNull(bhk),

      /* LOCATION */
      city: city.trim(),
      locality: locality.trim(),
      address: address.trim(),
      landmark:
        typeof landmark === "string"
          ? landmark.trim()
          : "",
      pincode:
        typeof pincode === "string"
          ? pincode.trim()
          : "",

      location: {
        latitude: toNumberOrNull(latitude),
        longitude: toNumberOrNull(longitude),
      },

      /* RENT */
      rent: rentNumber,
      rentPeriod: rentPeriod || "month",
      securityDeposit:
        toNumberOrNull(securityDeposit) ?? 0,
      maintenance:
        toNumberOrNull(maintenance) ?? 0,
      maintenancePeriod:
        maintenancePeriod || "included",

      /* PROPERTY DETAILS */
      area: toNumberOrNull(area),
      areaUnit: areaUnit || "sqft",
      bedrooms: toNumberOrNull(bedrooms) ?? 0,
      bathrooms: toNumberOrNull(bathrooms) ?? 0,
      balconies: toNumberOrNull(balconies) ?? 0,
      floor: toNumberOrNull(floor),
      totalFloors: toNumberOrNull(totalFloors),
      furnishing: furnishing || "unfurnished",

      /* GUEST CAPACITY */
      minGuests,
      maxGuests: finalMaxGuests,

      // Keep the old field synchronized.
      guests: finalMaxGuests,

      /* EXTRA GUEST CHARGES */
      extraGuestPolicy,

      /* EXTRA SLEEPING ARRANGEMENTS */
      sleepingArrangements,

      /* PET POLICY AND CHARGES */
      petPolicy,

      /* AMENITIES AND RULES */
      amenities: parsedAmenities,
      rules: parsedRules,
      availableFrom: availableFrom || null,

      /* ADMIN APPROVAL */
      approvalStatus: "pending",
      status: "draft",
      availability: "available",

      /* IMAGES */
      images: uploadedImages,
    });

    /* ================================================
       SUCCESS RESPONSE
    ================================================ */

    return res.status(201).json({
      success: true,
      message:
        "Property created successfully and sent for admin approval.",
      property,
    });
  } catch (error) {
    console.error("Create property error:", error);

    return res.status(400).json({
      success: false,
      message:
        error.message || "Unable to create property.",
    });
  }
};
/* =====================================================
GET ALL PUBLIC PROPERTIES
GET /api/properties
===================================================== */

export const getProperties = async (
req,
res
) => {
try {
const {
city,
locality,
propertyType,
bhk,
furnishing,
minRent,
maxRent,
guests,
maxGuests,
search,
page = 1,
limit = 12,
} = req.query;

/* =================================================
   ONLY PUBLIC PROPERTIES
   
   Property must be:
   approved + active
================================================= */

const filter = {
  approvalStatus:
    "approved",

  status:
    "active",
};

/* =================================================
   CITY
================================================= */

if (city) {
  filter.city =
    new RegExp(
      `^${city.trim()}$`,
      "i"
    );
}

/* =================================================
   LOCALITY
================================================= */

if (locality) {
  filter.locality =
    new RegExp(
      locality.trim(),
      "i"
    );
}

/* =================================================
   PROPERTY TYPE
================================================= */

if (propertyType) {
  filter.propertyType =
    propertyType;
}

/* =================================================
   BHK
================================================= */

if (bhk) {
  const bhkNumber =
    Number(bhk);

  if (
    !Number.isNaN(
      bhkNumber
    )
  ) {
    filter.bhk =
      bhkNumber;
  }
}

/* =================================================
   FURNISHING
================================================= */

if (furnishing) {
  filter.furnishing =
    furnishing;
}

/* =================================================
   RENT
================================================= */

if (
  minRent ||
  maxRent
) {
  filter.rent = {};

  if (minRent) {
    const minimum =
      Number(minRent);

    if (
      !Number.isNaN(
        minimum
      )
    ) {
      filter.rent.$gte =
        minimum;
    }
  }

  if (maxRent) {
    const maximum =
      Number(maxRent);

    if (
      !Number.isNaN(
        maximum
      )
    ) {
      filter.rent.$lte =
        maximum;
    }
  }
}

/* =================================================
   GUEST CAPACITY
   
   New:
   maxGuests

   Compatibility:
   guests
================================================= */

const requestedGuests =
  maxGuests ??
  guests;

if (
  requestedGuests !==
  undefined
) {
  const guestNumber =
    Number(
      requestedGuests
    );

  if (
    Number.isInteger(
      guestNumber
    ) &&
    guestNumber >= 1
  ) {
    /*
      New properties use maxGuests.

      Existing properties may only have guests.

      $or supports both.
    */

    filter.$or = [
      {
        maxGuests: {
          $gte:
            guestNumber,
        },
      },
      {
        maxGuests: null,
        guests: {
          $gte:
            guestNumber,
        },
      },
    ];
  }
}

/* =================================================
   SEARCH
================================================= */

if (search) {
  filter.$text = {
    $search:
      search,
  };
}

/* =================================================
   PAGINATION
================================================= */

const pageNumber =
  Math.max(
    Number(page) || 1,
    1
  );

const limitNumber =
  Math.min(
    Math.max(
      Number(limit) || 12,
      1
    ),
    50
  );

const skip =
  (pageNumber - 1) *
  limitNumber;

/* =================================================
   DATABASE QUERY
================================================= */

const [
  properties,
  total,
] = await Promise.all([
  Property.find(filter)
    .populate(
      "owner",
      "name avatar"
    )
    .sort({
      createdAt:
        -1,
    })
    .skip(skip)
    .limit(
      limitNumber
    )
    .lean(),

  Property.countDocuments(
    filter
  ),
]);

/* =================================================
   NORMALIZE CAPACITY FOR FRONTEND
   
   Existing properties may only have:
   guests

   Frontend gets:
   maxGuests
================================================= */

const normalizedProperties =
  properties.map(
    (property) => ({
      ...property,

      maxGuests:
        property.maxGuests ??
        property.guests ??
        1,
    })
  );

/* =================================================
   RESPONSE
================================================= */

return res.status(200).json({
  success: true,

  count:
    normalizedProperties.length,

  total,

  page:
    pageNumber,

  pages:
    Math.ceil(
      total /
        limitNumber
    ),

  properties:
    normalizedProperties,
});

} catch (error) {
console.error(
"Get properties error:",
error
);

return res.status(500).json({
  success: false,

  message:
    "Unable to fetch properties.",
});

}
};

/* =====================================================
GET SINGLE PROPERTY
GET /api/properties/:id
===================================================== */

export const getPropertyById = async (
req,
res
) => {
try {
/* =================================================
VALIDATE PROPERTY ID
================================================= */

if (
  !req.params.id
) {
  return res.status(400).json({
    success: false,
    message:
      "Property ID is required.",
  });
}

/* =================================================
   FIND PUBLIC PROPERTY
================================================= */

const property =
  await Property.findOne({
    _id:
      req.params.id,

    approvalStatus:
      "approved",

    status:
      "active",
  }).populate(
    "owner",
    "name avatar"
  );

if (!property) {
  return res.status(404).json({
    success: false,

    message:
      "Property not found.",
  });
}

/* =================================================
   NORMALIZE MAX GUESTS
================================================= */

const propertyObject =
  property.toObject();

propertyObject.maxGuests =
  property.maxGuests ??
  property.guests ??
  1;

/* =================================================
   VIEWS
================================================= */

property.views += 1;

await property.save();

/* =================================================
   RESPONSE
================================================= */

return res.status(200).json({
  success: true,

  property:
    propertyObject,
});

} catch (error) {
console.error(
"Get property error:",
error
);

return res.status(500).json({
  success: false,

  message:
    "Unable to fetch property.",
});

}
};

/* =====================================================
UPDATE OWN PROPERTY
PUT /api/properties/:id
===================================================== */

export const updateProperty = async (req, res) => {
  try {
    /* ================================================
       FIND PROPERTY
    ================================================ */

    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found.",
      });
    }

    /* ================================================
       OWNER CHECK
    ================================================ */

    if (
      !req.user?._id ||
      property.owner.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to edit this property.",
      });
    }

    /* ================================================
       REQUEST BODY
    ================================================ */

    const body = req.body || {};

    /* ================================================
       BASIC FIELDS
    ================================================ */

    if (body.title !== undefined) {
      if (
        typeof body.title !== "string" ||
        !body.title.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Property title is required.",
        });
      }

      property.title = body.title.trim();
    }

    if (body.description !== undefined) {
      if (
        typeof body.description !== "string" ||
        !body.description.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Property description is required.",
        });
      }

      property.description = body.description.trim();
    }

    if (body.propertyType !== undefined) {
      property.propertyType = body.propertyType;
    }

    /* ================================================
       BHK
    ================================================ */

    if (body.bhk !== undefined) {
      const value = toNumberOrNull(body.bhk);

      if (
        value !== null &&
        ![1, 2, 3, 4, 5].includes(value)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid BHK value.",
        });
      }

      property.bhk = value;
    }

    /* ================================================
       LOCATION
    ================================================ */

    if (body.city !== undefined) {
      if (
        typeof body.city !== "string" ||
        !body.city.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "City is required.",
        });
      }

      property.city = body.city.trim();
    }

    if (body.locality !== undefined) {
      if (
        typeof body.locality !== "string" ||
        !body.locality.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Locality is required.",
        });
      }

      property.locality = body.locality.trim();
    }

    if (body.address !== undefined) {
      if (
        typeof body.address !== "string" ||
        !body.address.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Address is required.",
        });
      }

      property.address = body.address.trim();
    }

    if (body.landmark !== undefined) {
      property.landmark =
        typeof body.landmark === "string"
          ? body.landmark.trim()
          : "";
    }

    if (body.pincode !== undefined) {
      property.pincode =
        typeof body.pincode === "string"
          ? body.pincode.trim()
          : "";
    }

    /* ================================================
       LOCATION COORDINATES
    ================================================ */

    if (
      body.latitude !== undefined ||
      body.longitude !== undefined
    ) {
      property.location = {
        latitude:
          body.latitude !== undefined
            ? toNumberOrNull(body.latitude)
            : property.location?.latitude ?? null,

        longitude:
          body.longitude !== undefined
            ? toNumberOrNull(body.longitude)
            : property.location?.longitude ?? null,
      };
    }

    /* ================================================
       RENT
    ================================================ */

    if (body.rent !== undefined) {
      const rentNumber = Number(body.rent);

      if (
        body.rent === "" ||
        !Number.isFinite(rentNumber) ||
        rentNumber < 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid rent.",
        });
      }

      property.rent = rentNumber;
    }

    if (body.rentPeriod !== undefined) {
      if (!["day", "month", "year"].includes(body.rentPeriod)) {
        return res.status(400).json({
          success: false,
          message: "Invalid rent period.",
        });
      }

      property.rentPeriod = body.rentPeriod;
    }

    /* ================================================
       SECURITY DEPOSIT
    ================================================ */

    if (body.securityDeposit !== undefined) {
      const value = toNumberOrNull(body.securityDeposit);

      if (value === null || value < 0) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid security deposit.",
        });
      }

      property.securityDeposit = value;
    }

    /* ================================================
       MAINTENANCE
    ================================================ */

    if (body.maintenance !== undefined) {
      const value = toNumberOrNull(body.maintenance);

      if (value === null || value < 0) {
        return res.status(400).json({
          success: false,
          message: "Please enter valid maintenance.",
        });
      }

      property.maintenance = value;
    }

    if (body.maintenancePeriod !== undefined) {
      if (
        !["included", "monthly", "yearly"].includes(
          body.maintenancePeriod
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid maintenance period.",
        });
      }

      property.maintenancePeriod = body.maintenancePeriod;
    }

    /* ================================================
       PROPERTY DETAILS
    ================================================ */

    const numericFields = [
      "area",
      "bedrooms",
      "bathrooms",
      "balconies",
      "floor",
      "totalFloors",
    ];

    for (const field of numericFields) {
      if (body[field] !== undefined) {
        const value = toNumberOrNull(body[field]);

        if (value !== null && value < 0) {
          return res.status(400).json({
            success: false,
            message: `${field} cannot be negative.`,
          });
        }

        if (
          value === null &&
          body[field] !== "" &&
          body[field] !== null
        ) {
          return res.status(400).json({
            success: false,
            message: `Please enter a valid ${field}.`,
          });
        }

        property[field] = value;
      }
    }

    if (body.areaUnit !== undefined) {
      if (!["sqft", "sqm"].includes(body.areaUnit)) {
        return res.status(400).json({
          success: false,
          message: "Invalid area unit.",
        });
      }

      property.areaUnit = body.areaUnit;
    }

    if (body.furnishing !== undefined) {
      if (
        ![
          "fully-furnished",
          "semi-furnished",
          "unfurnished",
        ].includes(body.furnishing)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid furnishing type.",
        });
      }

      property.furnishing = body.furnishing;
    }

    /* ================================================
       GUEST CAPACITY

       minGuests = minimum guests allowed
       maxGuests = normal included guest capacity
       guests = old compatibility field
    ================================================ */

    if (
      body.minGuests !== undefined ||
      body.maxGuests !== undefined ||
      body.guests !== undefined
    ) {
      const capacityBody = {
        minGuests:
          body.minGuests !== undefined
            ? body.minGuests
            : property.minGuests ?? 1,

        maxGuests:
          body.maxGuests !== undefined
            ? body.maxGuests
            : body.guests !== undefined
              ? body.guests
              : property.maxGuests ?? property.guests ?? 1,
      };

      const {
        minGuests,
        maxGuests: finalMaxGuests,
      } = parseCapacitySettings(capacityBody);

      property.minGuests = minGuests;
      property.maxGuests = finalMaxGuests;
      property.guests = finalMaxGuests;
    }

    /* ================================================
       EXTRA GUEST POLICY
    ================================================ */

    if (body.extraGuestPolicy !== undefined) {
      property.extraGuestPolicy = parseExtraGuestPolicy(
        body.extraGuestPolicy,
        property.extraGuestPolicy?.toObject?.() ??
          property.extraGuestPolicy
      );
    }

    /* ================================================
       SLEEPING ARRANGEMENTS
    ================================================ */

    if (body.sleepingArrangements !== undefined) {
      property.sleepingArrangements =
        parseSleepingArrangements(
          body.sleepingArrangements
        );
    }

    /* ================================================
       PET POLICY
    ================================================ */

    if (body.petPolicy !== undefined) {
      property.petPolicy = parsePetPolicy(
        body.petPolicy,
        property.petPolicy?.toObject?.() ??
          property.petPolicy
      );
    }

    /* ================================================
       AMENITIES
    ================================================ */

    if (body.amenities !== undefined) {
      property.amenities = parseArray(body.amenities);
    }

    /* ================================================
       RULES
    ================================================ */

    if (body.rules !== undefined) {
      property.rules = parseArray(body.rules);
    }

    /* ================================================
       AVAILABLE FROM
    ================================================ */

    if (body.availableFrom !== undefined) {
      property.availableFrom = body.availableFrom || null;
    }

    /* ================================================
       AVAILABILITY
    ================================================ */

    if (body.availability !== undefined) {
      if (
        !["available", "occupied", "unavailable"].includes(
          body.availability
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid availability status.",
        });
      }

      property.availability = body.availability;
    }

    /* ================================================
       OPTIONAL NEW IMAGES
    ================================================ */

    if (Array.isArray(req.files) && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const result = await uploadToCloudinary(file.buffer);

          property.images.push({
            url: result.secure_url,
            publicId: result.public_id,
            isPrimary: property.images.length === 0,
          });
        } catch (uploadError) {
          console.error(
            "Cloudinary upload error:",
            uploadError
          );

          return res.status(500).json({
            success: false,
            message: "Unable to upload property image.",
          });
        }
      }
    }

    /* ================================================
       LEGACY GUEST CAPACITY COMPATIBILITY
    ================================================ */

    if (
      property.maxGuests === null ||
      property.maxGuests === undefined
    ) {
      const oldGuests = toIntegerOrNull(property.guests);

      property.maxGuests =
        oldGuests !== null && oldGuests >= 1
          ? oldGuests
          : 1;
    }

    if (
      property.minGuests === null ||
      property.minGuests === undefined
    ) {
      property.minGuests = 1;
    }

    if (property.minGuests > property.maxGuests) {
      return res.status(400).json({
        success: false,
        message:
          "Minimum guests cannot exceed maximum guests.",
      });
    }

    property.guests = property.maxGuests;

    /* ================================================
       SEND BACK FOR ADMIN REVIEW
    ================================================ */

    property.approvalStatus = "pending";
    property.status = "draft";
    property.approvedBy = null;
    property.approvedAt = null;
    property.rejectionReason = "";

    /* ================================================
       SAVE PROPERTY
    ================================================ */

    await property.save();

    /* ================================================
       SUCCESS RESPONSE
    ================================================ */

    return res.status(200).json({
      success: true,
      message: "Property updated and sent for admin approval.",
      property,
    });
  } catch (error) {
    console.error("Update property error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to update property.",
    });
  }
};
/* =====================================================
DELETE OWN PROPERTY
DELETE /api/properties/:id
===================================================== */

export const deleteProperty = async (
req,
res
) => {
try {
/* =================================================
FIND PROPERTY
================================================= */

const property =
  await Property.findById(
    req.params.id
  );

if (!property) {
  return res.status(404).json({
    success: false,

    message:
      "Property not found.",
  });
}

/* =================================================
   OWNER CHECK
================================================= */

if (
  property.owner.toString() !==
  req.user._id.toString()
) {
  return res.status(403).json({
    success: false,

    message:
      "You are not allowed to delete this property.",
  });
}

/* =================================================
   SOFT DELETE
================================================= */

property.status =
  "deleted";

await property.save();

/* =================================================
   RESPONSE
================================================= */

return res.status(200).json({
  success: true,

  message:
    "Property deleted successfully.",
});

} catch (error) {
console.error(
"Delete property error:",
error
);

return res.status(500).json({
  success: false,

  message:
    "Unable to delete property.",
});

}
};

/* =====================================================
GET MY PROPERTIES
GET /api/properties/my
===================================================== */

export const getMyProperties = async (
req,
res
) => {
try {
/* =================================================
AUTH CHECK
================================================= */

if (!req.user?._id) {
  return res.status(401).json({
    success: false,
    message:
      "Authentication required.",
  });
}

/* =================================================
   GET OWNER PROPERTIES
================================================= */

const properties =
  await Property.find({
    owner:
      req.user._id,

    status: {
      $ne:
        "deleted",
    },
  })
    .sort({
      createdAt:
        -1,
    })
    .lean();

/* =================================================
   NORMALIZE MAX GUESTS
================================================= */

const normalizedProperties =
  properties.map(
    (property) => ({
      ...property,

      maxGuests:
        property.maxGuests ??
        property.guests ??
        1,
    })
  );

/* =================================================
   RESPONSE
================================================= */

return res.status(200).json({
  success: true,

  count:
    normalizedProperties.length,

  properties:
    normalizedProperties,
});

} catch (error) {
console.error(
"Get my properties error:",
error
);

return res.status(500).json({
  success: false,

  message:
    "Unable to fetch your properties.",
});

}
};