const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const quizRoutes = require("./routes/quizRoutes");
const profileRoutes = require("./routes/profileRoutes");
const simulationRoutes = require("./routes/simulationRoutes");
const geminiRoutes = require("./routes/geminiRoutes");
const communityRoutes = require("./routes/communityRoutes");
const roomRoutes = require("./routes/roomRoutes");
const SocketHandler = require("./socket/socketHandler");
const dailyQuestionRoutes = require('./routes/dailyQuestionRoutes');
const cronService = require('./services/cronService');
const noteRoutes = require('./routes/noteRoutes');

// Load environment variables
dotenv.config();

// Initialize app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [
      process.env.CLIENT_URL || "http://localhost:3000",
      "http://localhost:5173",  // Vite default port
      "http://localhost:3000"   // React default port
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

const PORT = process.env.PORT || 5000;
app.use(cors());

// Connect DB
connectDB();

// Initialize Socket Handler
const socketHandler = new SocketHandler(io);
socketHandler.initialize();

// Make io available to route handlers
app.set('io', io);

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
app.use("/api/gemini", geminiRoutes);

app.use("/api/community", communityRoutes);
app.use('/api/daily', dailyQuestionRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/rooms', roomRoutes);
// Start server
server.listen(PORT, () => {
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
