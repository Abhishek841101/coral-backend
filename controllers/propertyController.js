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

/* =====================================================
   CREATE PROPERTY
   POST /api/properties
===================================================== */

export const createProperty = async (req, res) => {
  try {
    /* =================================================
       AUTH CHECK
    ================================================= */

    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    /* =================================================
       BODY
       Multer + FormData ke baad body yahan milega.
    ================================================= */

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
      guests,
      amenities,
      rules,
      availableFrom,
    } = body;

    /* =================================================
       REQUIRED FIELDS
    ================================================= */

    if (!title?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Property title is required.",
      });
    }

    if (!description?.trim()) {
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

    if (!city?.trim()) {
      return res.status(400).json({
        success: false,
        message: "City is required.",
      });
    }

    if (!locality?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Locality is required.",
      });
    }

    if (!address?.trim()) {
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

    const rentNumber = Number(rent);

    if (Number.isNaN(rentNumber) || rentNumber < 0) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid rent.",
      });
    }

    /* =================================================
       PARSE ARRAYS
    ================================================= */

    const parsedAmenities = parseArray(
      amenities
    );

    const parsedRules = parseArray(rules);

    /* =================================================
       UPLOAD IMAGES
    ================================================= */

    const uploadedImages = [];

    if (
      Array.isArray(req.files) &&
      req.files.length > 0
    ) {
      for (const file of req.files) {
        try {
          const result =
            await uploadToCloudinary(
              file.buffer
            );

          uploadedImages.push({
            url: result.secure_url,
            publicId: result.public_id,
            isPrimary:
              uploadedImages.length === 0,
          });
        } catch (uploadError) {
          console.error(
            "Cloudinary upload error:",
            uploadError
          );

          return res.status(500).json({
            success: false,
            message:
              "Unable to upload property image.",
          });
        }
      }
    }

    /* =================================================
       CREATE PROPERTY
    ================================================= */

    const property = await Property.create({
      owner: req.user._id,

      title: title.trim(),

      description: description.trim(),

      propertyType,

      bhk: toNumberOrNull(bhk),

      city: city.trim(),

      locality: locality.trim(),

      address: address.trim(),

      landmark:
        landmark?.trim() || "",

      pincode:
        pincode?.trim() || "",

      location: {
        latitude:
          toNumberOrNull(latitude),

        longitude:
          toNumberOrNull(longitude),
      },

      rent: rentNumber,

      rentPeriod:
        rentPeriod || "month",

      securityDeposit:
        toNumberOrNull(
          securityDeposit
        ) ?? 0,

      maintenance:
        toNumberOrNull(
          maintenance
        ) ?? 0,

      maintenancePeriod:
        maintenancePeriod ||
        "included",

      area:
        toNumberOrNull(area),

      areaUnit:
        areaUnit || "sqft",

      bedrooms:
        toNumberOrNull(bedrooms) ?? 0,

      bathrooms:
        toNumberOrNull(bathrooms) ?? 0,

      balconies:
        toNumberOrNull(balconies) ?? 0,

      floor:
        toNumberOrNull(floor),

      totalFloors:
        toNumberOrNull(totalFloors),

      furnishing:
        furnishing ||
        "unfurnished",

      guests:
        toNumberOrNull(guests) ?? 1,

      amenities:
        parsedAmenities,

      rules:
        parsedRules,

      availableFrom:
        availableFrom || null,

      /* ===============================================
         ADMIN APPROVAL FLOW
      =============================================== */

      approvalStatus: "pending",

      status: "draft",

      availability: "available",

      /* ===============================================
         IMAGES
      =============================================== */

      images: uploadedImages,
    });

    /* =================================================
       SUCCESS
    ================================================= */

    return res.status(201).json({
      success: true,

      message:
        "Property created successfully and sent for admin approval.",

      property,
    });
  } catch (error) {
    console.error(
      "Create property error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        "Unable to create property.",
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
      search,
      page = 1,
      limit = 12,
    } = req.query;

    const filter = {
      approvalStatus: "approved",
      status: "active",
    };

    /* CITY */

    if (city) {
      filter.city = new RegExp(
        `^${city.trim()}$`,
        "i"
      );
    }

    /* LOCALITY */

    if (locality) {
      filter.locality = new RegExp(
        locality.trim(),
        "i"
      );
    }

    /* PROPERTY TYPE */

    if (propertyType) {
      filter.propertyType =
        propertyType;
    }

    /* BHK */

    if (bhk) {
      filter.bhk = Number(bhk);
    }

    /* FURNISHING */

    if (furnishing) {
      filter.furnishing =
        furnishing;
    }

    /* RENT */

    if (minRent || maxRent) {
      filter.rent = {};

      if (minRent) {
        filter.rent.$gte =
          Number(minRent);
      }

      if (maxRent) {
        filter.rent.$lte =
          Number(maxRent);
      }
    }

    /* GUESTS */

    if (guests) {
      filter.guests = {
        $gte: Number(guests),
      };
    }

    /* SEARCH */

    if (search) {
      filter.$text = {
        $search: search,
      };
    }

    const pageNumber = Math.max(
      Number(page),
      1
    );

    const limitNumber = Math.min(
      Math.max(Number(limit), 1),
      50
    );

    const skip =
      (pageNumber - 1) *
      limitNumber;

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
          createdAt: -1,
        })
        .skip(skip)
        .limit(limitNumber)
        .lean(),

      Property.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,

      count: properties.length,

      total,

      page: pageNumber,

      pages: Math.ceil(
        total / limitNumber
      ),

      properties,
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
    const property =
      await Property.findOne({
        _id: req.params.id,
        approvalStatus: "approved",
        status: "active",
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

    property.views += 1;

    await property.save();

    return res.status(200).json({
      success: true,
      property,
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

export const updateProperty = async (
  req,
  res
) => {
  try {
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

    if (
      property.owner.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not allowed to edit this property.",
      });
    }

    const body = req.body || {};

    const allowedFields = [
      "title",
      "description",
      "propertyType",
      "bhk",
      "city",
      "locality",
      "address",
      "landmark",
      "pincode",
      "rent",
      "rentPeriod",
      "securityDeposit",
      "maintenance",
      "maintenancePeriod",
      "area",
      "areaUnit",
      "bedrooms",
      "bathrooms",
      "balconies",
      "floor",
      "totalFloors",
      "furnishing",
      "guests",
      "amenities",
      "rules",
      "availableFrom",
      "availability",
    ];

    allowedFields.forEach(
      (field) => {
        if (
          body[field] !== undefined
        ) {
          property[field] =
            body[field];
        }
      }
    );

    if (
      body.latitude !== undefined ||
      body.longitude !== undefined
    ) {
      property.location = {
        latitude:
          body.latitude ??
          property.location
            ?.latitude ??
          null,

        longitude:
          body.longitude ??
          property.location
            ?.longitude ??
          null,
      };
    }

    /* =================================================
       OPTIONAL NEW IMAGES
    ================================================= */

    if (
      Array.isArray(req.files) &&
      req.files.length > 0
    ) {
      for (const file of req.files) {
        const result =
          await uploadToCloudinary(
            file.buffer
          );

        property.images.push({
          url: result.secure_url,
          publicId: result.public_id,
          isPrimary:
            property.images.length === 0,
        });
      }
    }

    /* =================================================
       SEND BACK FOR ADMIN REVIEW
    ================================================= */

    property.approvalStatus =
      "pending";

    property.status = "draft";

    property.approvedBy = null;

    property.approvedAt = null;

    await property.save();

    return res.status(200).json({
      success: true,

      message:
        "Property updated and sent for admin approval.",

      property,
    });
  } catch (error) {
    console.error(
      "Update property error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        "Unable to update property.",
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

    property.status =
      "deleted";

    await property.save();

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
    const properties =
      await Property.find({
        owner: req.user._id,

        status: {
          $ne: "deleted",
        },
      })
        .sort({
          createdAt: -1,
        })
        .lean();

    return res.status(200).json({
      success: true,

      count: properties.length,

      properties,
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