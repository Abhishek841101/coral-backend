import express from "express";

import {
  adminLogin,
  getAdminMe,
  adminLogout,
} from "../controllers/adminController.js";

import {
  getAdminProperties,
  getPendingProperties,
  getPropertyStats,
  approveProperty,
  rejectProperty,
  activateProperty,
  deactivateProperty,
  deleteAdminProperty,
} from "../controllers/adminPropertyController.js";

import {
  protectAdmin,
} from "../middleware/adminAuthMiddleware.js";

const router = express.Router();

/* =====================================================
   ADMIN LOGIN
   POST /api/admin/login
===================================================== */

router.post(
  "/login",
  adminLogin
);

/* =====================================================
   ADMIN ME
   GET /api/admin/me
===================================================== */

router.get(
  "/me",
  protectAdmin,
  getAdminMe
);

/* =====================================================
   ADMIN LOGOUT
   POST /api/admin/logout
===================================================== */

router.post(
  "/logout",
  protectAdmin,
  adminLogout
);

/* =====================================================
   PROPERTY STATS

   IMPORTANT:
   MUST COME BEFORE /properties/:id
===================================================== */

router.get(
  "/properties/stats",
  protectAdmin,
  getPropertyStats
);

/* =====================================================
   PENDING PROPERTIES

   MUST COME BEFORE /properties/:id
===================================================== */

router.get(
  "/properties/pending",
  protectAdmin,
  getPendingProperties
);

/* =====================================================
   ALL PROPERTIES
===================================================== */

router.get(
  "/properties",
  protectAdmin,
  getAdminProperties
);

/* =====================================================
   PROPERTY ACTIONS
===================================================== */

router.patch(
  "/properties/:id/approve",
  protectAdmin,
  approveProperty
);

router.patch(
  "/properties/:id/reject",
  protectAdmin,
  rejectProperty
);

router.patch(
  "/properties/:id/activate",
  protectAdmin,
  activateProperty
);

router.patch(
  "/properties/:id/deactivate",
  protectAdmin,
  deactivateProperty
);

router.delete(
  "/properties/:id",
  protectAdmin,
  deleteAdminProperty
);

export default router;