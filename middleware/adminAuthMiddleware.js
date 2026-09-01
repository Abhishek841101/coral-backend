import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protectAdmin = async (req, res, next) => {
  try {
    const token = req.cookies?.coral_admin_token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Admin authentication required.",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing in .env");

      return res.status(500).json({
        success: false,
        message:
          "Server authentication configuration error.",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (!decoded?.id) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin token.",
      });
    }

    if (decoded.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required.",
      });
    }

    const admin = await User.findOne({
      _id: decoded.id,
      role: "admin",
      isActive: true,
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message:
          "Admin account not found or disabled.",
      });
    }

    req.admin = admin;

    // Existing controllers ke liye compatibility
    req.user = admin;

    next();
  } catch (error) {
    console.error(
      "Admin authentication error:",
      error.message
    );

    if (
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Admin session expired. Please login again.",
      });
    }

    if (
      error.name === "JsonWebTokenError"
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid admin authentication.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Admin authentication failed.",
    });
  }
};