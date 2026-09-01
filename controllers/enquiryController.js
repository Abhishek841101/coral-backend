import mongoose from "mongoose";
import Enquiry from "../models/Enquiry.js";
import Property from "../models/Property.js";

/* =====================================================
   CREATE ENQUIRY
   POST /api/enquiries
===================================================== */

export const createEnquiry = async (req, res) => {
  try {
    const {
      propertyId,
      name,
      email,
      phone,
      message,
      source = "website",
    } = req.body;

    /* ================= VALIDATION ================= */

    if (
      !propertyId ||
      !name ||
      !email ||
      !phone ||
      !message
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Property, name, email, phone and message are required.",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        propertyId
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid property ID.",
      });
    }

    /* ================= PROPERTY ================= */

    const property = await Property.findOne({
      _id: propertyId,
      approvalStatus: "approved",
      status: "active",
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message:
          "Property is not available.",
      });
    }

    /* ================= CREATE ================= */

    const enquiry = await Enquiry.create({
      user: req.user?._id || null,

      property: property._id,

      name: name.trim(),

      email: email
        .toLowerCase()
        .trim(),

      phone: phone.trim(),

      message: message.trim(),

      source,

      status: "new",
    });

    /* ================= PROPERTY COUNT ================= */

    property.enquiriesCount += 1;

    await property.save();

    /* ================= RESPONSE ================= */

    const populatedEnquiry =
      await Enquiry.findById(
        enquiry._id
      ).populate(
        "property",
        "title city locality images"
      );

    return res.status(201).json({
      success: true,
      message:
        "Your enquiry has been submitted successfully.",
      enquiry: populatedEnquiry,
    });
  } catch (error) {
    console.error(
      "Create enquiry error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to submit enquiry.",
    });
  }
};

/* =====================================================
   GET MY ENQUIRIES
   GET /api/enquiries/my
===================================================== */

export const getMyEnquiries = async (
  req,
  res
) => {
  try {
    const enquiries =
      await Enquiry.find({
        user: req.user._id,
      })
        .populate(
          "property",
          "title city locality images rent"
        )
        .sort({
          createdAt: -1,
        })
        .lean();

    return res.status(200).json({
      success: true,
      count: enquiries.length,
      enquiries,
    });
  } catch (error) {
    console.error(
      "Get my enquiries error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch enquiries.",
    });
  }
};