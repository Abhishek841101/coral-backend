import express from "express";

import {
  getAdminEnquiries,
  getAdminEnquiryById,
  updateEnquiryStatus,
  getEnquiryStats,
} from "../controllers/adminEnquiryController.js";

import { protectAdmin } from "../middleware/adminAuthMiddleware.js";

const router = express.Router();

/* ================= ADMIN AUTH ================= */

router.use(protectAdmin);

/* ================= STATS ================= */

router.get(
  "/stats",
  getEnquiryStats
);

/* ================= ALL ================= */

router.get(
  "/",
  getAdminEnquiries
);

/* ================= SINGLE ================= */

router.get(
  "/:id",
  getAdminEnquiryById
);

/* ================= UPDATE STATUS ================= */

router.patch(
  "/:id/status",
  updateEnquiryStatus
);

export default router;