import Property from "../models/Property.js";

/* =====================================================
   GET ALL PROPERTIES FOR ADMIN
   GET /api/admin/properties
===================================================== */

export const getAdminProperties = async (req, res) => {
  try {
    const {
      approvalStatus,
      status,
      availability,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};

    if (approvalStatus) {
      filter.approvalStatus = approvalStatus;
    }

    if (status) {
      filter.status = status;
    }

    if (availability) {
      filter.availability = availability;
    }

    if (search) {
      filter.$text = {
        $search: search,
      };
    }

    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.min(
      Math.max(Number(limit), 1),
      100
    );

    const skip = (pageNumber - 1) * limitNumber;

    const [properties, total] = await Promise.all([
      Property.find(filter)
        .populate(
          "owner",
          "name email phone avatar"
        )
        .populate(
          "approvedBy",
          "name email"
        )
        .sort({ createdAt: -1 })
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
      pages: Math.ceil(total / limitNumber),
      properties,
    });
  } catch (error) {
    console.error(
      "Admin get properties error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to fetch admin properties.",
    });
  }
};

/* =====================================================
   GET PENDING PROPERTIES
   GET /api/admin/properties/pending
===================================================== */

export const getPendingProperties = async (
  req,
  res
) => {
  try {
    const properties = await Property.find({
      approvalStatus: "pending",
    })
      .populate(
        "owner",
        "name email phone avatar"
      )
      .sort({ createdAt: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: properties.length,
      properties,
    });
  } catch (error) {
    console.error(
      "Get pending properties error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch pending properties.",
    });
  }
};

/* =====================================================
   APPROVE PROPERTY
   PATCH /api/admin/properties/:id/approve
===================================================== */


export const approveProperty = async (req, res) => {
  try {
    const property =
      await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found.",
      });
    }

    if (
      property.approvalStatus === "approved"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Property is already approved.",
      });
    }

    property.approvalStatus = "approved";
    property.status = "active";

    // IMPORTANT
    property.approvedBy = req.admin._id;

    property.approvedAt = new Date();
    property.rejectionReason = "";

    await property.save();

    return res.status(200).json({
      success: true,
      message:
        "Property approved successfully.",
      property,
    });
  } catch (error) {
    console.error(
      "Approve property error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to approve property.",
    });
  }
};
/* =====================================================
   REJECT PROPERTY
   PATCH /api/admin/properties/:id/reject
===================================================== */

export const rejectProperty = async (
  req,
  res
) => {
  try {
    const { reason } = req.body;

    const property =
      await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found.",
      });
    }

    property.approvalStatus = "rejected";
    property.status = "inactive";
    property.approvedBy = null;
    property.approvedAt = null;
    property.rejectionReason =
      reason?.trim() || "Rejected by admin.";

    await property.save();

    return res.status(200).json({
      success: true,
      message:
        "Property rejected successfully.",
      property,
    });
  } catch (error) {
    console.error(
      "Reject property error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to reject property.",
    });
  }
};

/* =====================================================
   ACTIVATE PROPERTY
   PATCH /api/admin/properties/:id/activate
===================================================== */

export const activateProperty = async (
  req,
  res
) => {
  try {
    const property =
      await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found.",
      });
    }

    if (
      property.approvalStatus !== "approved"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Only approved properties can be activated.",
      });
    }

    property.status = "active";

    await property.save();

    return res.status(200).json({
      success: true,
      message:
        "Property activated successfully.",
      property,
    });
  } catch (error) {
    console.error(
      "Activate property error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to activate property.",
    });
  }
};

/* =====================================================
   DEACTIVATE PROPERTY
   PATCH /api/admin/properties/:id/deactivate
===================================================== */

export const deactivateProperty = async (
  req,
  res
) => {
  try {
    const property =
      await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found.",
      });
    }

    property.status = "inactive";

    await property.save();

    return res.status(200).json({
      success: true,
      message:
        "Property deactivated successfully.",
      property,
    });
  } catch (error) {
    console.error(
      "Deactivate property error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to deactivate property.",
    });
  }
};

/* =====================================================
   ADMIN DELETE PROPERTY
   DELETE /api/admin/properties/:id
===================================================== */

export const deleteAdminProperty = async (
  req,
  res
) => {
  try {
    const property =
      await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found.",
      });
    }

    property.status = "deleted";

    await property.save();

    return res.status(200).json({
      success: true,
      message:
        "Property deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Admin delete property error:",
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
   ADMIN PROPERTY STATS
   GET /api/admin/properties/stats
===================================================== */

export const getPropertyStats = async (
  req,
  res
) => {
  try {
    const [
      total,
      pending,
      approved,
      rejected,
      active,
      inactive,
      rented,
    ] = await Promise.all([
      Property.countDocuments({
        status: { $ne: "deleted" },
      }),

      Property.countDocuments({
        approvalStatus: "pending",
      }),

      Property.countDocuments({
        approvalStatus: "approved",
      }),

      Property.countDocuments({
        approvalStatus: "rejected",
      }),

      Property.countDocuments({
        status: "active",
      }),

      Property.countDocuments({
        status: "inactive",
      }),

      Property.countDocuments({
        status: "rented",
      }),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        total,
        pending,
        approved,
        rejected,
        active,
        inactive,
        rented,
      },
    });
  } catch (error) {
    console.error(
      "Property stats error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch property statistics.",
    });
  }
};