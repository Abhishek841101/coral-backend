import express from "express";

import {
  createEnquiry,
  getMyEnquiries,
} from "../controllers/enquiryController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/*
  User must be logged in for enquiries.
*/

router.use(protect);

/* ================= CREATE ================= */

router.post(
  "/",
  createEnquiry
);

/* ================= MY ENQUIRIES ================= */

router.get(
  "/my",
  getMyEnquiries
);

export default router;