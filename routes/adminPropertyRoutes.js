import express from "express";

import {
  getAdminProperties,
  getPendingProperties,
  approveProperty,
  rejectProperty,
  activateProperty,
  deactivateProperty,
  deleteAdminProperty,
  getPropertyStats,
} from "../controllers/adminPropertyController.js";

import {
  protectAdmin,
} from "../middleware/adminAuthMiddleware.js";

const router = express.Router();

/* =====================================================
   ADMIN AUTHENTICATION
   Every property route below requires admin login.
===================================================== */

router.use(protectAdmin);

/* =====================================================
   PROPERTY STATS
   GET /api/admin/properties/stats
===================================================== */

router.get(
  "/stats",
  getPropertyStats
);

/* =====================================================
   PENDING PROPERTIES
   GET /api/admin/properties/pending
===================================================== */

router.get(
  "/pending",
  getPendingProperties
);

/* =====================================================
   ALL PROPERTIES
   GET /api/admin/properties
===================================================== */

router.get(
  "/",
  getAdminProperties
);

/* =====================================================
   APPROVE PROPERTY
   PATCH /api/admin/properties/:id/approve
===================================================== */

router.patch(
  "/:id/approve",
  approveProperty
);

/* =====================================================
   REJECT PROPERTY
   PATCH /api/admin/properties/:id/reject
===================================================== */

router.patch(
  "/:id/reject",
  rejectProperty
);

/* =====================================================
   ACTIVATE PROPERTY
   PATCH /api/admin/properties/:id/activate
===================================================== */

router.patch(
  "/:id/activate",
  activateProperty
);

/* =====================================================
   DEACTIVATE PROPERTY
   PATCH /api/admin/properties/:id/deactivate
===================================================== */

router.patch(
  "/:id/deactivate",
  deactivateProperty
);

/* =====================================================
   DELETE PROPERTY
   DELETE /api/admin/properties/:id
===================================================== */

router.delete(
  "/:id",
  deleteAdminProperty
);

export default router;