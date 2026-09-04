import express from "express";

import {
  createProperty,
  getProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
  getMyProperties,
} from "../controllers/propertyController.js";

import {
  protect,
  protectAdmin,
} from "../middleware/authMiddleware.js";

import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

/* =====================================================
   PUBLIC PROPERTIES
===================================================== */

router.get(
  "/",
  getProperties
);


/* =====================================================
   MY PROPERTIES
===================================================== */

router.get(
  "/my",
  protect,
  getMyProperties
);


/* =====================================================
   CREATE PROPERTY - ADMIN
===================================================== */

router.post(
  "/",
  protectAdmin,
  upload.array("images", 10),
  createProperty
);


/* =====================================================
   SINGLE PROPERTY
===================================================== */

router.get(
  "/:id",
  getPropertyById
);


/* =====================================================
   UPDATE PROPERTY - ADMIN
===================================================== */

router.put(
  "/:id",
  protectAdmin,
  upload.array("images", 10),
  updateProperty
);


/* =====================================================
   DELETE PROPERTY - ADMIN
===================================================== */

router.delete(
  "/:id",
  protectAdmin,
  deleteProperty
);

export default router;