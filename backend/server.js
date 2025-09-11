import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";

// Load environment variables
dotenv.config();


// imports
import redisClient from "./src/config/redis.js";
import connectDB from "./src/config/db.js";
import userRoutes from "./src/routes/userRoutes.js";
import chatRoutes from "./src/routes/chatRoutes.js";
import assessmentRoutes  from "./src/routes/assessmentRoutes.js";
import appointmentRoutes from "./src/routes/appointmentRoutes.js";
import adminRoutes from "./src/routes/adminRoutes.js";

const app = express();

// Middleware
const allowedOrigins = [
  "http://localhost:5173",
  "https://thoda-sukoon-client.vercel.app"
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true); // allow non-browser requests
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("CORS not allowed"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // include OPTIONS for preflight
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Let Express handle OPTIONS requests
app.options("*", cors());

// app.use((req, res, next) => {
//   res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
//   res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
//   next();
// });
app.use(express.json()); // parse JSON bodies
app.use(morgan("dev")); // logs requests for debugging

// Health check route
app.get("/", (req, res) => {
  res.send("🚀 Thoda Sukoon Backend is running...");
});

// Test Redis caching route
app.get("/cache-test", async (req, res) => {
  try {
    // check if cached message exists
    const cached = await redisClient.get("welcomeMsg");

    if (cached) {
      return res.json({ source: "redis", message: cached });
    }

    // if not cached → save in redis
    const message = "🚀 Thoda Sukoon with Redis Cache + MongoDB!";
    await redisClient.setEx("welcomeMsg", 60, message); // expires in 60 sec

    res.json({ source: "server", message });
  } catch (err) {
    console.error("❌ Redis Test Error:", err);
    res.status(500).json({ message: "Redis test failed", error: err.message });
  }
}); 



// Routes
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/assessments", assessmentRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/admin", adminRoutes);


// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ message: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.stack);
  res.status(500).json({ message: "Something went wrong", error: err.message });
});


// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    await redisClient.connect();

    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Startup error:", error.message);
    process.exit(1);
  }
};

startServer();
