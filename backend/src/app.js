const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
require("dotenv").config();

const app = express();

/* ---------------- CORS CONFIG ---------------- */

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://krishnamedicose.in",
  "https://www.krishnamedicose.in",
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests without origin (Postman, mobile apps, curl)
    if (!origin) return callback(null, true);

    // Allow localhost, custom domain, and all vercel deployments
    if (allowedOrigins.includes(origin) || origin.includes("vercel.app")) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

const mongoSanitize = require("express-mongo-sanitize");
const rateLimit = require("express-rate-limit");

/* ---------------- SECURITY & RATE LIMITING ---------------- */

// General API Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  message: {
    message: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict Auth Rate Limiter (Login, Forgot Password, Verification)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 attempts per 15 minutes
  message: {
    message:
      "Too many authentication attempts. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/* ---------------- MIDDLEWARES ---------------- */

// CORS (must be first)
app.use(cors(corsOptions));

app.use(cookieParser());
app.use(express.json());

// Express 5 compatible NoSQL input sanitizer
app.use((req, res, next) => {
  if (req.body) mongoSanitize.sanitize(req.body);
  if (req.params) mongoSanitize.sanitize(req.params);
  if (req.query) mongoSanitize.sanitize(req.query);
  next();
});

// Apply rate limiters
app.use("/api/", apiLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/forgot-password", authLimiter);
app.use("/api/auth/verify-otp", authLimiter);
app.use("/api/auth/reset-password", authLimiter);

// Static uploads
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

/* ---------------- ROUTES ---------------- */

const authRoutes = require("./routes/authRoutes");
const contentRoutes = require("./routes/contentRoutes");
const enquiryRoutes = require("./routes/enquiryRoutes");
const userRoutes = require("./routes/userRoutes");
const assetRoutes = require("./routes/assetRoutes");
const offerRoutes = require("./routes/offerRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const medicineBundleRoutes = require("./routes/medicineBundleRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/enquiry", enquiryRoutes);
app.use("/api/users", userRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/medicine-bundle", medicineBundleRoutes);

/* ---------------- HEALTH CHECK ---------------- */

app.get("/", (req, res) => {
  res.send("API is running...");
});

/* ---------------- ERROR HANDLER ---------------- */

app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);

  // CORS error handling (clean response instead of crash)
  if (err.message.includes("CORS")) {
    return res.status(403).json({
      message: "CORS Error",
      error: err.message,
    });
  }

  res.status(500).json({
    message: "Something went wrong!",
    error: err.message,
  });
});

module.exports = app;
