const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const quizRoutes = require("./routes/quizRoutes");
const profileRoutes = require("./routes/profileRoutes");
const simulationRoutes = require("./routes/simulationRoutes");

// Load environment variables
dotenv.config();

// Initialize app
const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());

// Connect DB
connectDB();

// Middleware
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.send("Rural Learning Platform API 🚀");
});

app.use("/api/auth", authRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/simulations", simulationRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
