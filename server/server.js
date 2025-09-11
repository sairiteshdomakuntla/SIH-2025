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
const communityRoutes = require("./routes/communityRoutes");
const SocketHandler = require("./socket/socketHandler");

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
app.use(cors());

// Connect DB
connectDB();

// Initialize Socket Handler
const socketHandler = new SocketHandler(io);
socketHandler.initialize();

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
app.use("/api/community", communityRoutes);

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
