import mongoose from "mongoose";
import Enquiry from "../models/Enquiry.js";

/* =====================================================
   GET ALL ENQUIRIES
   GET /api/admin/enquiries
===================================================== */

export const getAdminEnquiries = async (
  req,
  res
) => {
  try {
    const {
      status,
      property,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (
      property &&
      mongoose.Types.ObjectId.isValid(property)
    ) {
      filter.property = property;
    }

    const pageNumber = Math.max(
      Number(page),
      1
    );

    const limitNumber = Math.min(
      Math.max(Number(limit), 1),
      100
    );

    const skip =
      (pageNumber - 1) *
      limitNumber;

    const [enquiries, total] =
      await Promise.all([
        Enquiry.find(filter)
          .populate(
            "user",
            "name email phone avatar"
          )
          .populate(
            "property",
            "title city locality rent images owner"
          )
          .sort({
            createdAt: -1,
          })
          .skip(skip)
          .limit(limitNumber)
          .lean(),

        Enquiry.countDocuments(filter),
      ]);

    return res.status(200).json({
      success: true,
      count: enquiries.length,
      total,
      page: pageNumber,
      pages: Math.ceil(
        total / limitNumber
      ),
      enquiries,
    });
  } catch (error) {
    console.error(
      "Admin get enquiries error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch enquiries.",
    });
  }
};

/* =====================================================
   GET SINGLE ENQUIRY
   GET /api/admin/enquiries/:id
===================================================== */

export const getAdminEnquiryById = async (
  req,
  res
) => {
  try {
    if (
      !mongoose.Types.ObjectId.isValid(
        req.params.id
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid enquiry ID.",
      });
    }

    const enquiry =
      await Enquiry.findById(
        req.params.id
      )
        .populate(
          "user",
          "name email phone avatar"
        )
        .populate(
          "property",
          "title description city locality address rent images owner"
        );

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: "Enquiry not found.",
      });
    }

    return res.status(200).json({
      success: true,
      enquiry,
    });
  } catch (error) {
    console.error(
      "Admin enquiry error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch enquiry.",
    });
  }
};

/* =====================================================
   UPDATE ENQUIRY STATUS
   PATCH /api/admin/enquiries/:id/status
===================================================== */

export const updateEnquiryStatus = async (
  req,
  res
) => {
  try {
    const {
      status,
      adminNote = "",
    } = req.body;

    const allowedStatuses = [
      "new",
      "contacted",
      "follow_up",
      "closed",
      "cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid enquiry status.",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        req.params.id
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid enquiry ID.",
      });
    }

    const enquiry =
      await Enquiry.findById(
        req.params.id
      );

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: "Enquiry not found.",
      });
    }

    enquiry.status = status;

    if (adminNote !== undefined) {
      enquiry.adminNote =
        adminNote.trim();
    }

    if (status === "contacted") {
      enquiry.contactedAt =
        enquiry.contactedAt ||
        new Date();
    }

    if (status === "closed") {
      enquiry.closedAt =
        enquiry.closedAt ||
        new Date();
    }

    await enquiry.save();

    return res.status(200).json({
      success: true,
      message:
        "Enquiry status updated successfully.",
      enquiry,
    });
  } catch (error) {
    console.error(
      "Update enquiry status error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to update enquiry.",
    });
  }
};

/* =====================================================
   ENQUIRY STATS
   GET /api/admin/enquiries/stats
===================================================== */

export const getEnquiryStats = async (
  req,
  res
) => {
  try {
    const [
      total,
      newCount,
      contacted,
      followUp,
      closed,
      cancelled,
    ] = await Promise.all([
      Enquiry.countDocuments(),

      Enquiry.countDocuments({
        status: "new",
      }),

      Enquiry.countDocuments({
        status: "contacted",
      }),

      Enquiry.countDocuments({
        status: "follow_up",
      }),

      Enquiry.countDocuments({
        status: "closed",
      }),

      Enquiry.countDocuments({
        status: "cancelled",
      }),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        total,
        new: newCount,
        contacted,
        followUp,
        closed,
        cancelled,
      },
    });
  } catch (error) {
    console.error(
      "Enquiry stats error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch enquiry statistics.",
    });
  }
};