import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protectAdmin = async (req, res, next) => {
  try {
    /* =====================================================
       CHECK JWT SECRET
    ===================================================== */

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing in .env");

      return res.status(500).json({
        success: false,
        message: "Server authentication configuration error.",
      });
    }

    /* =====================================================
       GET BEARER TOKEN
       
       Expected:
       Authorization: Bearer <token>
    ===================================================== */

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Admin authentication required.",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Admin authentication required.",
      });
    }

    /* =====================================================
       VERIFY TOKEN
    ===================================================== */

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    /* =====================================================
       CHECK TOKEN PAYLOAD
    ===================================================== */

    if (!decoded?.id) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin token.",
      });
    }

    /* =====================================================
       CHECK ADMIN ROLE
    ===================================================== */

    if (decoded.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required.",
      });
    }

    /* =====================================================
       FIND ACTIVE ADMIN
    ===================================================== */

    const admin = await User.findOne({
      _id: decoded.id,
      role: "admin",
      isActive: true,
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Admin account not found or disabled.",
      });
    }

    /* =====================================================
       ATTACH ADMIN TO REQUEST
       
       req.admin → admin controllers
       req.user  → existing controller compatibility
    ===================================================== */

    req.admin = admin;
    req.user = admin;

    next();
  } catch (error) {
    console.error(
      "Admin authentication error:",
      error.message
    );

    /* =====================================================
       TOKEN EXPIRED
    ===================================================== */

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message:
          "Admin session expired. Please login again.",
      });
    }

    /* =====================================================
       INVALID TOKEN
    ===================================================== */

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid admin authentication.",
      });
    }

    /* =====================================================
       INVALID TOKEN FORMAT
    ===================================================== */

    if (error.name === "NotBeforeError") {
      return res.status(401).json({
        success: false,
        message: "Admin authentication is not active yet.",
      });
    }

    /* =====================================================
       OTHER ERROR
    ===================================================== */

    return res.status(500).json({
      success: false,
      message: "Admin authentication failed.",
    });
  }
};