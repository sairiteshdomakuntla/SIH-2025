const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const createTestRoom = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const Room = require('./models/Room');
    
    // Create a test room
    const testRoom = new Room({
      roomCode: uuidv4(),
      capacity: 2,
      subject: 'Mathematics',
      difficulty: 'medium',
      status: 'waiting',
      players: [],
      participants: []
    });
    
    await testRoom.save();
    
    console.log('\n🎉 Test room created successfully!');
    console.log(`📋 Room Code: ${testRoom.roomCode}`);
    console.log(`🎯 Subject: ${testRoom.subject}`);
    console.log(`⚡ Difficulty: ${testRoom.difficulty}`);
    console.log(`👥 Capacity: ${testRoom.capacity}`);
    console.log(`📊 Status: ${testRoom.status}`);
    console.log('\n💡 Use this room code to test joining!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating test room:', error);
    process.exit(1);
  }
};

createTestRoom();