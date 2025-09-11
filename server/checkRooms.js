const mongoose = require('mongoose');
require('dotenv').config();

const checkRooms = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const Room = require('./models/Room');
    const rooms = await Room.find({}).select('roomCode code status createdAt').limit(10);
    
    console.log(`\nFound ${rooms.length} rooms:`);
    rooms.forEach(room => {
      console.log(`  ID: ${room._id}`);
      console.log(`  roomCode: ${room.roomCode}`);
      console.log(`  code: ${room.code}`);
      console.log(`  status: ${room.status}`);
      console.log(`  created: ${room.createdAt}`);
      console.log('  ---');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkRooms();