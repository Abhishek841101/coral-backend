import express from "express";

import {
  createProperty,
  getProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
  getMyProperties,
} from "../controllers/propertyController.js";

import { protect } from "../middleware/authMiddleware.js";

import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

/* =====================================================
   PUBLIC PROPERTIES
===================================================== */

/*
   GET /api/properties
*/

router.get(
  "/",
  getProperties
);


/* =====================================================
   MY PROPERTIES
===================================================== */

/*
   IMPORTANT:
   /my ko /:id se pehle rakhna hai.
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

   FormData field:

   images

   Maximum 10 images.
*/

router.post(
  "/",
  protect,
  upload.array("images", 10),
  createProperty
);


/* =====================================================
   SINGLE PROPERTY
===================================================== */

/*
   GET /api/properties/:id
*/

router.get(
  "/:id",
  getPropertyById
);


/* =====================================================
   UPDATE PROPERTY
===================================================== */

router.put(
  "/:id",
  protect,
  upload.array("images", 10),
  updateProperty
);


/* =====================================================
   DELETE PROPERTY
===================================================== */

router.delete(
  "/:id",
  protect,
  deleteProperty
);

export default router;