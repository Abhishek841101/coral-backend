// import express from "express";

// import {
//   createProperty,
//   getProperties,
//   getPropertyById,
//   updateProperty,
//   deleteProperty,
//   getMyProperties,
// } from "../controllers/propertyController.js";

// import {
//   protect,
//   protectAdmin,
// } from "../middleware/authMiddleware.js";

// import upload from "../middleware/uploadMiddleware.js";

// const router = express.Router();

// /* =====================================================
//    PUBLIC PROPERTIES
// ===================================================== */

// router.get(
//   "/",
//   getProperties
// );


// /* =====================================================
//    MY PROPERTIES
// ===================================================== */

// router.get(
//   "/my",
//   protect,
//   getMyProperties
// );


// /* =====================================================
//    CREATE PROPERTY - ADMIN
// ===================================================== */

// router.post(
//   "/",
//   protectAdmin,
//   upload.array("images", 10),
//   createProperty
// );


// /* =====================================================
//    SINGLE PROPERTY
// ===================================================== */

// router.get(
//   "/:id",
//   getPropertyById
// );


// /* =====================================================
//    UPDATE PROPERTY - ADMIN
// ===================================================== */

// router.put(
//   "/:id",
//   protectAdmin,
//   upload.array("images", 10),
//   updateProperty
// );


// /* =====================================================
//    DELETE PROPERTY - ADMIN
// ===================================================== */

// router.delete(
//   "/:id",
//   protectAdmin,
//   deleteProperty
// );

// export default router;





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

import { protectAdmin } from "../middleware/adminAuthMiddleware.js";

import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

/* =====================================================
PUBLIC PROPERTIES

GET /api/properties
===================================================== */

router.get(
"/",
getProperties
);

/* =====================================================
MY PROPERTIES

GET /api/properties/my

Customer authentication
===================================================== */

router.get(
"/my",
protect,
getMyProperties
);

/* =====================================================
CREATE PROPERTY - ADMIN

POST /api/properties

Admin Bearer Token required
===================================================== */

router.post(
"/",
protectAdmin,
upload.array("images", 10),
createProperty
);

/* =====================================================
SINGLE PROPERTY

GET /api/properties/:id
===================================================== */

router.get(
"/:id",
getPropertyById
);

/* =====================================================
UPDATE PROPERTY - ADMIN

PUT /api/properties/:id

Admin Bearer Token required
===================================================== */

router.put(
"/:id",
protectAdmin,
upload.array("images", 10),
updateProperty
);

/* =====================================================
DELETE PROPERTY - ADMIN

DELETE /api/properties/:id

Admin Bearer Token required
===================================================== */

router.delete(
"/:id",
protectAdmin,
deleteProperty
);

export default router;
