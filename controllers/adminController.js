import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

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

const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

/* =====================================================
   ADMIN LOGIN
   POST /api/admin/login
===================================================== */

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

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

    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: "Admin account is disabled.",
      });
    }

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

    admin.lastLogin = new Date();

    await admin.save();

    const token = createAdminToken(admin);

    res.cookie(
      "coral_admin_token",
      token,
      cookieOptions
    );

    return res.status(200).json({
      success: true,
      message: "Admin login successful.",
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        avatar: admin.avatar,
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
    res.clearCookie("coral_admin_token", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
    });

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