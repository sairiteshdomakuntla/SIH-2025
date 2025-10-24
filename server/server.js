const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const quizRoutes = require("./routes/quizRoutes");
const quizRoomRoutes = require("./routes/quizRoomRoutes"); // Add this line
const profileRoutes = require("./routes/profileRoutes");
const simulationRoutes = require("./routes/simulationRoutes"); // 1. Import the router
const geminiRoutes = require("./routes/geminiRoutes");
const communityRoutes = require("./routes/communityRoutes");
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
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());

// Connect DB
connectDB();

// Initialize Socket Handler
const socketHandler = new SocketHandler(io);

// Add authentication middleware to socket.io
io.use((socket, next) => {
  socketHandler.authenticateSocket(socket, next);
});

socketHandler.initialize();

// Middleware
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.send("Rural Learning Platform API 🚀");
});

app.use('/api/auth', authRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/quiz-room', quizRoomRoutes); // Add this line
app.use('/api/profile', profileRoutes);
app.use('/api/simulations', simulationRoutes); // FIX: Was '/api/simulation'
app.use('/api/gemini', geminiRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/daily-question', dailyQuestionRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/xp', require('./routes/xpRoutes'));

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
