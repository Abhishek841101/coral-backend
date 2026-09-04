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

/*
   GET /api/properties

   Public property listing.
*/

router.get(
  "/",
  getProperties
);


/* =====================================================
   MY PROPERTIES
===================================================== */

/*
   GET /api/properties/my

   Normal logged-in user properties.
*/

router.get(
  "/my",
  protect,
  getMyProperties
);


/* =====================================================
   CREATE PROPERTY
===================================================== */

/*
   POST /api/properties

   Admin authentication required.

   FormData field:
   images

   Maximum 10 images.
*/

router.post(
  "/",
  protectAdmin,
  upload.array("images", 10),
  createProperty
);


/* =====================================================
   SINGLE PROPERTY
===================================================== */

/*
   GET /api/properties/:id

   Public single property.
*/

router.get(
  "/:id",
  getPropertyById
);


/* =====================================================
   UPDATE PROPERTY
===================================================== */

/*
   PUT /api/properties/:id

   Admin authentication required.

   Maximum 10 images.
*/

router.put(
  "/:id",
  protectAdmin,
  upload.array("images", 10),
  updateProperty
);


/* =====================================================
   DELETE PROPERTY
===================================================== */

/*
   DELETE /api/properties/:id

   Admin authentication required.
*/

router.delete(
  "/:id",
  protectAdmin,
  deleteProperty
);


export default router;