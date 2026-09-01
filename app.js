import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/authRoutes.js";
import propertyRoutes from "./routes/propertyRoutes.js";

import adminRoutes from "./routes/adminRoutes.js";
import adminBookingRoutes from "./routes/adminBookingRoutes.js";
import adminEnquiryRoutes from "./routes/adminEnquiryRoutes.js";

import bookingRoutes from "./routes/bookingRoutes.js";
import enquiryRoutes from "./routes/enquiryRoutes.js";

const app = express();
app.set("trust proxy", 1);

/* =====================================================
   CORS
===================================================== */
const allowedOrigins = [
  "http://localhost:5173",
  "https://coral-pearl.vercel.app",
  "https://coral-9fvtny4ts-abhishek841101s-projects.vercel.app",
  "https://coral-git-main-abhishek841101s-projects.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

/* =====================================================
   BODY PARSER
===================================================== */

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

/* =====================================================
   COOKIE
===================================================== */

app.use(cookieParser());

/* =====================================================
   HEALTH
===================================================== */

app.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Coral API is running",
  });
});

app.get("/api/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Coral backend is healthy",
  });
});

/* =====================================================
   USER AUTH
===================================================== */

app.use(
  "/api/auth",
  authRoutes
);

/* =====================================================
   USER PROPERTIES
===================================================== */

app.use(
  "/api/properties",
  propertyRoutes
);

/* =====================================================
   USER BOOKINGS
===================================================== */

app.use(
  "/api/bookings",
  bookingRoutes
);

/* =====================================================
   USER ENQUIRIES
===================================================== */

app.use(
  "/api/enquiries",
  enquiryRoutes
);

/* =====================================================
   ADMIN
===================================================== */

app.use(
  "/api/admin",
  adminRoutes
);

app.use(
  "/api/admin/bookings",
  adminBookingRoutes
);

app.use(
  "/api/admin/enquiries",
  adminEnquiryRoutes
);

/* =====================================================
   404
===================================================== */

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

/* =====================================================
   ERROR HANDLER
===================================================== */

app.use((error, req, res, next) => {
  console.error("Express error:", error);

  return res.status(
    error.status || 500
  ).json({
    success: false,
    message:
      error.message ||
      "Internal server error.",
  });
});

export default app;