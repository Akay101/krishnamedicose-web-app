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

/* ---------------- MIDDLEWARES ---------------- */

// CORS (must be first)
app.use(cors(corsOptions));

// Handle preflight requests
app.options("*", cors(corsOptions));

app.use(cookieParser());
app.use(express.json());

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

app.use("/api/auth", authRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/enquiry", enquiryRoutes);
app.use("/api/users", userRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/analytics", analyticsRoutes);

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
