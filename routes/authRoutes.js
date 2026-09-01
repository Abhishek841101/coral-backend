import express from "express";

import {
  register,
  login,
  getMe,
  logout,
} from "../controllers/authController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/* Public */

router.post("/register", register);
router.post("/login", login);

/* Protected */

router.get("/me", protect, getMe);

router.post("/logout", logout);

export default router;