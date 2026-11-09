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

// Extra origins can be supplied as a comma-separated list, e.g. CORS_ORIGINS=https://a.com,https://b.com
const extraOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

// Vercel preview deployments: exact https://<slug>.vercel.app hosts only (no substring matching)
const vercelPreviewPattern = /^https:\/\/[a-z0-9-]+\.vercel\.app$/i;

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests without origin (Postman, mobile apps, curl)
    if (!origin) return callback(null, true);

    if (
      allowedOrigins.includes(origin) ||
      extraOrigins.includes(origin) ||
      (process.env.ALLOW_VERCEL_PREVIEWS !== "false" && vercelPreviewPattern.test(origin))
    ) {
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

// Public payment / activation endpoints (brute-force protection)
const bundleAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { message: "Too many attempts. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

/* ---------------- MIDDLEWARES ---------------- */

app.disable("x-powered-by");
// Behind Render/Vercel/Cloudflare there is one proxy hop; override with TRUST_PROXY if different
app.set("trust proxy", process.env.TRUST_PROXY !== undefined ? Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY : 1);

// CORS (must be first)
app.use(cors(corsOptions));

// Baseline security headers (API returns JSON only)
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
});

app.use(cookieParser());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

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
app.use("/api/medicine-bundle/activate", bundleAuthLimiter);
app.use("/api/medicine-bundle/verify-payment", bundleAuthLimiter);
app.use("/api/medicine-bundle/verify-upi", bundleAuthLimiter);
app.use("/api/enquiry", (req, res, next) => (req.method === "POST" ? bundleAuthLimiter(req, res, next) : next()));
app.use("/api/offers/register", bundleAuthLimiter);

// Static uploads: never let the browser sniff/execute uploaded content
app.use(
  "/uploads",
  express.static(path.join(__dirname, "../uploads"), {
    dotfiles: "deny",
    index: false,
    setHeaders: (res, filePath) => {
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Content-Security-Policy", "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox");
      if (!/\.(png|jpe?g|webp|gif|pdf)$/i.test(filePath)) {
        res.setHeader("Content-Disposition", "attachment");
      }
    },
  })
);

/* ---------------- ROUTES ---------------- */

const authRoutes = require("./routes/authRoutes");
const contentRoutes = require("./routes/contentRoutes");
const enquiryRoutes = require("./routes/enquiryRoutes");
const userRoutes = require("./routes/userRoutes");
const assetRoutes = require("./routes/assetRoutes");
const offerRoutes = require("./routes/offerRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const medicineBundleRoutes = require("./routes/medicineBundleRoutes");
const linkRoutes = require("./routes/linkRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const catalogRoutes = require("./routes/catalogRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/enquiry", enquiryRoutes);
app.use("/api/users", userRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/medicine-bundle", medicineBundleRoutes);
app.use("/api/links", linkRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/catalogs", catalogRoutes);

/* ---------------- HEALTH CHECK ---------------- */

app.get("/", (req, res) => {
  res.send("API is running...");
});

/* ---------------- ERROR HANDLER ---------------- */

app.use((err, req, res, next) => {
  console.error("Error:", err.message);

  // CORS error handling (clean response instead of crash)
  if (err.message && err.message.includes("CORS")) {
    return res.status(403).json({ message: "CORS Error" });
  }

  if (err.type === "entity.too.large") {
    return res.status(413).json({ message: "Request payload too large." });
  }

  // Multer / validation errors are safe to surface; everything else stays generic
  if (err.name === "MulterError" || err.status === 400) {
    return res.status(400).json({ message: err.message });
  }

  res.status(err.status || 500).json({
    message: "Something went wrong!",
    ...(process.env.NODE_ENV !== "production" && { error: err.message }),
  });
});

module.exports = app;
