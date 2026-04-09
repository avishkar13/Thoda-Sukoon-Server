import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import morgan from "morgan";

import connectDB from "./src/config/db.js";
import userRoutes from "./src/routes/userRoutes.js";
import chatRoutes from "./src/routes/chatRoutes.js";
import assessmentRoutes from "./src/routes/assessmentRoutes.js";
import appointmentRoutes from "./src/routes/appointmentRoutes.js";
import adminRoutes from "./src/routes/adminRoutes.js";

const app = express();

// ----------------- CORS -----------------
const allowedOrigins = [
  "http://localhost:5173",
  "https://thoda-sukoon-client.onrender.com"
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true); 
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true, 
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));


// OPTIONS preflight handler
app.options("*", cors());

// ----------------- Middleware -----------------
app.use(express.json());
app.use(morgan("dev"));

// ----------------- Routes -----------------
app.get("/", (req, res) => res.send("🚀 Thoda Sukoon Backend is running..."));

app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/assessments", assessmentRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/admin", adminRoutes);

// ----------------- 404 & Error -----------------
app.use((req, res) => res.status(404).json({ message: "Route not found" }));

app.use((err, req, res, next) => {
  // Use res.statusCode if it has been set, otherwise default to 500
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  console.error(`[Error] ${req.method} ${req.url} - ${statusCode}: ${err.message}`);
  res.status(statusCode).json({
    message: err.message || "Something went wrong",
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

// ----------------- Start Server -----------------
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  if (!process.env.JWT_SECRET) {
    console.error("❌ CRITICAL: JWT_SECRET is not defined in environment variables!");
  }
  try {
    await connectDB();

    app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
  } catch (err) {
    console.error("❌ Startup error:", err.message);
    process.exit(1);
  }
};

startServer();
