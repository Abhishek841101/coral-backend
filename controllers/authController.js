import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

/* =====================================================
   DEBUG
===================================================== */

console.log(
  "=================================================="
);

console.log(
  "[AUTH CONTROLLER] authController.js LOADED"
);

console.log(
  "[AUTH CONTROLLER] JWT_SECRET exists:",
  Boolean(process.env.JWT_SECRET)
);

console.log(
  "[AUTH CONTROLLER] NODE_ENV:",
  process.env.NODE_ENV
);

console.log(
  "=================================================="
);

/* =====================================================
   CREATE JWT
===================================================== */

const createToken = (user) => {
  console.log(
    "[AUTH TOKEN] Creating normal user JWT"
  );

  console.log(
    "[AUTH TOKEN] User ID:",
    user._id
  );

  console.log(
    "[AUTH TOKEN] User role:",
    user.role
  );

  const token = jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );

  console.log(
    "[AUTH TOKEN] Token created:",
    Boolean(token)
  );

  return token;
};

/* =====================================================
   COOKIE OPTIONS
===================================================== */

const cookieOptions = {
  httpOnly: true,
  secure:
    process.env.NODE_ENV === "production",

  sameSite:
    process.env.NODE_ENV === "production"
      ? "none"
      : "lax",

  maxAge:
    7 *
    24 *
    60 *
    60 *
    1000,
};

console.log(
  "[AUTH COOKIE] Cookie options:",
  {
    httpOnly:
      cookieOptions.httpOnly,

    secure:
      cookieOptions.secure,

    sameSite:
      cookieOptions.sameSite,

    maxAge:
      cookieOptions.maxAge,
  }
);

/* =====================================================
   REGISTER USER
   POST /api/auth/register
===================================================== */

export const register = async (
  req,
  res
) => {

  console.log(
    "=================================================="
  );

  console.log(
    "[AUTH REGISTER] START"
  );

  try {

    const {
      name,
      email,
      phone,
      password,
    } = req.body;

    console.log(
      "[AUTH REGISTER] Request received:",
      {
        name,
        email,
        phone,
        passwordPresent:
          Boolean(password),
      }
    );

    /* =================================================
       VALIDATION
    ================================================= */

    if (
      !name ||
      !email ||
      !password
    ) {

      console.error(
        "[AUTH REGISTER] Validation failed"
      );

      return res.status(400).json({
        success: false,
        message:
          "Name, email and password are required.",
      });
    }

    if (
      password.length < 6
    ) {

      console.error(
        "[AUTH REGISTER] Password too short"
      );

      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 6 characters.",
      });
    }

    /* =================================================
       NORMALIZE EMAIL
    ================================================= */

    const normalizedEmail =
      email
        .toLowerCase()
        .trim();

    console.log(
      "[AUTH REGISTER] Normalized email:",
      normalizedEmail
    );

    /* =================================================
       CHECK EXISTING USER
    ================================================= */

    console.log(
      "[AUTH REGISTER] Checking existing account..."
    );

    const existingUser =
      await User.findOne({
        email:
          normalizedEmail,
      });

    console.log(
      "[AUTH REGISTER] Existing account:",
      Boolean(existingUser)
    );

    if (existingUser) {

      console.warn(
        "[AUTH REGISTER] Email already exists"
      );

      return res.status(409).json({
        success: false,
        message:
          "An account with this email already exists.",
      });
    }

    /* =================================================
       HASH PASSWORD
    ================================================= */

    console.log(
      "[AUTH REGISTER] Hashing password..."
    );

    const hashedPassword =
      await bcrypt.hash(
        password,
        12
      );

    console.log(
      "[AUTH REGISTER] Password hashed successfully"
    );

    /* =================================================
       CREATE USER
    ================================================= */

    console.log(
      "[AUTH REGISTER] Creating normal USER account"
    );

    const user =
      await User.create({
        name:
          name.trim(),

        email:
          normalizedEmail,

        phone:
          phone?.trim() || "",

        password:
          hashedPassword,

        /* IMPORTANT:
           Registration ALWAYS creates USER */
        role: "user",
      });

    console.log(
      "[AUTH REGISTER] User created:",
      {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    );

    /* =================================================
       CREATE JWT
    ================================================= */

    const token =
      createToken(user);

    console.log(
      "[AUTH REGISTER] Token created:",
      Boolean(token)
    );

    /* =================================================
       SET COOKIE
    ================================================= */

    res.cookie(
      "coral_token",
      token,
      cookieOptions
    );

    console.log(
      "[AUTH REGISTER] coral_token cookie set"
    );

    /* =================================================
       RESPONSE
    ================================================= */

    console.log(
      "[AUTH REGISTER] SUCCESS"
    );

    console.log(
      "=================================================="
    );

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

    console.error(
      "[AUTH REGISTER] Error message:",
      error?.message
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

export const login = async (
  req,
  res
) => {

  console.log(
    "=================================================="
  );

  console.log(
    "[AUTH LOGIN] START"
  );

  try {

    const {
      email,
      password,
    } = req.body;

    console.log(
      "[AUTH LOGIN] Email received:",
      email
    );

    console.log(
      "[AUTH LOGIN] Password present:",
      Boolean(password)
    );

    /* =================================================
       VALIDATION
    ================================================= */

    if (
      !email ||
      !password
    ) {

      console.error(
        "[AUTH LOGIN] Email/password missing"
      );

      return res.status(400).json({
        success: false,
        message:
          "Email and password are required.",
      });
    }

    /* =================================================
       NORMALIZE EMAIL
    ================================================= */

    const normalizedEmail =
      email
        .toLowerCase()
        .trim();

    console.log(
      "[AUTH LOGIN] Normalized email:",
      normalizedEmail
    );

    /* =================================================
       FIND USER

       VERY IMPORTANT:
       role: "user"

       This prevents admin from using
       normal user login.
    ================================================= */

    console.log(
      "[AUTH LOGIN] Searching ONLY for normal user..."
    );

    const user =
      await User.findOne({
        email:
          normalizedEmail,

        role: "user",
      }).select("+password");

    console.log(
      "[AUTH LOGIN] Normal user found:",
      Boolean(user)
    );

    /* =================================================
       IF USER NOT FOUND

       This also covers admin accounts.
    ================================================= */

    if (!user) {

      console.warn(
        "[AUTH LOGIN] Normal user not found"
      );

      console.warn(
        "[AUTH LOGIN] If this is an admin account, it MUST use /api/admin/login"
      );

      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password.",
      });
    }

    console.log(
      "[AUTH LOGIN] User details:",
      {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive:
          user.isActive,
      }
    );

    /* =================================================
       ACTIVE CHECK
    ================================================= */

    if (
      !user.isActive
    ) {

      console.warn(
        "[AUTH LOGIN] User account disabled"
      );

      return res.status(403).json({
        success: false,
        message:
          "Your account has been disabled.",
      });
    }

    console.log(
      "[AUTH LOGIN] User is active"
    );

    /* =================================================
       PASSWORD CHECK
    ================================================= */

    console.log(
      "[AUTH LOGIN] Comparing password..."
    );

    const passwordMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    console.log(
      "[AUTH LOGIN] Password match:",
      passwordMatch
    );

    if (
      !passwordMatch
    ) {

      console.warn(
        "[AUTH LOGIN] Password incorrect"
      );

      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password.",
      });
    }

    /* =================================================
       UPDATE LAST LOGIN
    ================================================= */

    console.log(
      "[AUTH LOGIN] Updating lastLogin..."
    );

    user.lastLogin =
      new Date();

    await user.save();

    console.log(
      "[AUTH LOGIN] lastLogin updated"
    );

    /* =================================================
       CREATE JWT
    ================================================= */

    console.log(
      "[AUTH LOGIN] Creating normal user token..."
    );

    const token =
      createToken(user);

    console.log(
      "[AUTH LOGIN] Token created:",
      Boolean(token)
    );

    /* =================================================
       SET COOKIE
    ================================================= */

    res.cookie(
      "coral_token",
      token,
      cookieOptions
    );

    console.log(
      "[AUTH LOGIN] coral_token cookie set"
    );

    /* =================================================
       RESPONSE
    ================================================= */

    const responseUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
    };

    console.log(
      "[AUTH LOGIN] Response user:",
      responseUser
    );

    console.log(
      "[AUTH LOGIN] SUCCESS - NORMAL USER"
    );

    console.log(
      "=================================================="
    );

    return res.status(200).json({
      success: true,

      message:
        "Login successful.",

      user:
        responseUser,
    });

  } catch (error) {

    console.error(
      "[AUTH LOGIN] ERROR:",
      error
    );

    console.error(
      "[AUTH LOGIN] Error message:",
      error?.message
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

export const getMe = async (
  req,
  res
) => {

  console.log(
    "=================================================="
  );

  console.log(
    "[AUTH ME] START"
  );

  try {

    console.log(
      "[AUTH ME] req.user:",
      req.user
    );

    if (
      !req.user?.id
    ) {

      console.error(
        "[AUTH ME] req.user.id missing"
      );

      return res.status(401).json({
        success: false,
        message:
          "Authentication required.",
      });
    }

    console.log(
      "[AUTH ME] Searching user:",
      req.user.id
    );

    const user =
      await User.findById(
        req.user.id
      );

    console.log(
      "[AUTH ME] User found:",
      Boolean(user)
    );

    if (!user) {

      console.error(
        "[AUTH ME] User not found"
      );

      return res.status(404).json({
        success: false,
        message:
          "User not found.",
      });
    }

    console.log(
      "[AUTH ME] User:",
      {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive:
          user.isActive,
      }
    );

    console.log(
      "[AUTH ME] SUCCESS"
    );

    return res.status(200).json({
      success: true,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        isActive:
          user.isActive,
        lastLogin:
          user.lastLogin,
        createdAt:
          user.createdAt,
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

export const logout = async (
  req,
  res
) => {

  console.log(
    "=================================================="
  );

  console.log(
    "[AUTH LOGOUT] START"
  );

  try {

    console.log(
      "[AUTH LOGOUT] Clearing coral_token cookie"
    );

    res.clearCookie(
      "coral_token",
      {
        httpOnly: true,

        secure:
          process.env.NODE_ENV ===
          "production",

        sameSite:
          process.env.NODE_ENV ===
          "production"
            ? "none"
            : "lax",
      }
    );

    console.log(
      "[AUTH LOGOUT] Cookie cleared"
    );

    console.log(
      "[AUTH LOGOUT] SUCCESS"
    );

    console.log(
      "=================================================="
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