const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const quizRoutes = require("./routes/quizRoutes");
const profileRoutes = require("./routes/profileRoutes");
const simulationRoutes = require("./routes/simulationRoutes");
const dailyQuestionRoutes = require('./routes/dailyQuestionRoutes');
const cronService = require('./services/cronService');

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
app.use('/api/daily', dailyQuestionRoutes);

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Start cron jobs
try {
  cronService.startAllJobs();
} catch (error) {
  console.error('Error starting cron jobs:', error);
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received');
  cronService.stopAllJobs();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received');
  cronService.stopAllJobs();
  process.exit(0);
});
