import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import redisClient from "./src/config/redis.js";
import connectDB from "./src/config/db.js";
import userRoutes from "./src/routes/userRoutes.js";
import chatRoutes from "./src/routes/chatRoutes.js";
import assessmentRoutes from "./src/routes/assessmentRoutes.js";
import appointmentRoutes from "./src/routes/appointmentRoutes.js";
import adminRoutes from "./src/routes/adminRoutes.js";

dotenv.config();
const app = express();

// ----------------- CORS -----------------
const allowedOrigins = [
  "http://localhost:5173",
  "https://thoda-sukoon-client.vercel.app"
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
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
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong", error: err.message });
});

// ----------------- Start Server -----------------
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    await redisClient.connect();
    app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
  } catch (err) {
    console.error("❌ Startup error:", err.message);
    process.exit(1);
  }
};

startServer();
