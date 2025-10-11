import express from "express";
import session from "express-session";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";  // ADD THIS
import { fileURLToPath } from "url";  // ADD THIS
import { connectDB } from "./config/database.js";
import authRoutes from "./routes/auth.js";
import diagnosesRoutes from "./routes/diagnoses.js";
import treatmentsRoutes from "./routes/treatments.js";

dotenv.config();

// ADD THESE TWO LINES - needed for ES6 modules to get __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: ["http://localhost:5500", "http://127.0.0.1:5500"],
    credentials: true,
  })
);
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
    },
  })
);

// ADD THIS - Serve static files from frontend folder
app.use(express.static(path.join(__dirname, '../frontend')));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/diagnoses", diagnosesRoutes);
app.use("/api/treatments", treatmentsRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Leaf It to Us API is running" });
});

// ADD THIS - Catch-all route to serve index.html (must be AFTER API routes)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start server
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();