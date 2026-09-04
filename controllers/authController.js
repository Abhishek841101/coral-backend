
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

/* =====================================================
   CREATE JWT
===================================================== */

const createToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

/* =====================================================
   COOKIE OPTIONS

   IMPORTANT:
   Frontend:
   https://coral-pearl.vercel.app

   Backend:
   https://coral-backend-ozif.onrender.com

   These are different origins, so production requires:
   secure: true
   sameSite: "none"
===================================================== */

const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

/* =====================================================
   REGISTER USER
   POST /api/auth/register
===================================================== */

export const register = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
    } = req.body;

    /* =================================================
       VALIDATION
    ================================================= */

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email and password are required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 6 characters.",
      });
    }

    /* =================================================
       NORMALIZE EMAIL
    ================================================= */

    const normalizedEmail = email
      .toLowerCase()
      .trim();

    /* =================================================
       CHECK EXISTING USER
    ================================================= */

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this email already exists.",
      });
    }

    /* =================================================
       HASH PASSWORD
    ================================================= */

    const hashedPassword = await bcrypt.hash(
      password,
      12
    );

    /* =================================================
       CREATE USER

       Registration ALWAYS creates normal USER.
    ================================================= */

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone?.trim() || "",
      password: hashedPassword,
      role: "user",
    });

    /* =================================================
       CREATE JWT
    ================================================= */

    const token = createToken(user);

    /* =================================================
       SET AUTH COOKIE
    ================================================= */

    res.cookie(
      "coral_token",
      token,
      cookieOptions
    );

    /* =================================================
       RESPONSE
    ================================================= */

    return res.status(201).json({
      success: true,
      message:
        "Account created successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error(
      "[AUTH REGISTER] ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to create account.",
    });
  }
};

/* =====================================================
   LOGIN USER
   POST /api/auth/login

   IMPORTANT:
   ADMIN USERS ARE NOT ALLOWED HERE.

   Admin must use:
   POST /api/admin/login
===================================================== */

export const login = async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    /* =================================================
       VALIDATION
    ================================================= */

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Email and password are required.",
      });
    }

    /* =================================================
       NORMALIZE EMAIL
    ================================================= */

    const normalizedEmail = email
      .toLowerCase()
      .trim();

    /* =================================================
       FIND NORMAL USER ONLY

       This prevents admin accounts from using
       the normal customer login.
    ================================================= */

    const user = await User.findOne({
      email: normalizedEmail,
      role: "user",
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password.",
      });
    }

    /* =================================================
       ACTIVE CHECK
    ================================================= */

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message:
          "Your account has been disabled.",
      });
    }

    /* =================================================
       PASSWORD CHECK
    ================================================= */

    const passwordMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password.",
      });
    }

    /* =================================================
       UPDATE LAST LOGIN
    ================================================= */

    user.lastLogin = new Date();

    await user.save();

    /* =================================================
       CREATE JWT
    ================================================= */

    const token = createToken(user);

    /* =================================================
       SET AUTH COOKIE

       This is the important production fix.
    ================================================= */

    res.cookie(
      "coral_token",
      token,
      cookieOptions
    );

    /* =================================================
       RESPONSE USER
    ================================================= */

    const responseUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
    };

    /* =================================================
       RESPONSE
    ================================================= */

    return res.status(200).json({
      success: true,
      message:
        "Login successful.",
      user: responseUser,
    });
  } catch (error) {
    console.error(
      "[AUTH LOGIN] ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to login.",
    });
  }
};

/* =====================================================
   GET CURRENT USER
   GET /api/auth/me
===================================================== */

export const getMe = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required.",
      });
    }

    const user = await User.findById(
      req.user.id
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error(
      "[AUTH ME] ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch user.",
    });
  }
};

/* =====================================================
   LOGOUT
   POST /api/auth/logout
===================================================== */

export const logout = async (req, res) => {
  try {
    /* =================================================
       IMPORTANT:
       clearCookie options must match cookie settings.
    ================================================= */

    res.clearCookie(
      "coral_token",
      {
        httpOnly: true,
        secure: true,
        sameSite: "none",
      }
    );

    return res.status(200).json({
      success: true,
      message:
        "Logged out successfully.",
    });
  } catch (error) {
    console.error(
      "[AUTH LOGOUT] ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to logout.",
    });
  }
};

