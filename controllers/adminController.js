import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

/* =====================================================
   CREATE ADMIN JWT
===================================================== */

const createAdminToken = (admin) => {
  return jwt.sign(
    {
      id: admin._id,
      role: "admin",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

/* =====================================================
   ADMIN LOGIN
   POST /api/admin/login
===================================================== */

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    /* Validation */

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    /* JWT secret check */

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing.");

      return res.status(500).json({
        success: false,
        message: "Server authentication configuration error.",
      });
    }

    /* Find ADMIN only */

    const admin = await User.findOne({
      email: email.toLowerCase().trim(),
      role: "admin",
    }).select("+password");

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials.",
      });
    }

    /* Active check */

    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: "Admin account is disabled.",
      });
    }

    /* Password check */

    const passwordMatch = await bcrypt.compare(
      password,
      admin.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials.",
      });
    }

    /* Update last login */

    admin.lastLogin = new Date();

    await admin.save();

    /* Create JWT */

    const token = createAdminToken(admin);

    /* =================================================
       IMPORTANT:
       Bearer authentication use ho raha hai.
       Cookie set nahi kar rahe.
    ================================================= */

    return res.status(200).json({
      success: true,
      message: "Admin login successful.",

      token,

      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
        avatar: admin.avatar,
        isActive: admin.isActive,
        lastLogin: admin.lastLogin,
        createdAt: admin.createdAt,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to login as admin.",
    });
  }
};

/* =====================================================
   ADMIN ME
   GET /api/admin/me
===================================================== */

export const getAdminMe = async (req, res) => {
  try {
    const admin = req.admin;

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Admin authentication required.",
      });
    }

    return res.status(200).json({
      success: true,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
        avatar: admin.avatar,
        isActive: admin.isActive,
        lastLogin: admin.lastLogin,
        createdAt: admin.createdAt,
      },
    });
  } catch (error) {
    console.error("Admin me error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch admin profile.",
    });
  }
};

/* =====================================================
   ADMIN LOGOUT
   POST /api/admin/logout
===================================================== */

export const adminLogout = async (req, res) => {
  try {
    /*
      Bearer token localStorage me stored hai,
      isliye server-side cookie clear karne ki
      zarurat nahi hai.
    */

    return res.status(200).json({
      success: true,
      message: "Admin logged out successfully.",
    });
  } catch (error) {
    console.error("Admin logout error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to logout admin.",
    });
  }
};