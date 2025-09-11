const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Function to drop old roomId index and fix rooms collection
const fixRoomsCollection = async () => {
  try {
    await connectDB();
    
    const db = mongoose.connection.db;
    const roomsCollection = db.collection('rooms');
    
    console.log('Checking existing indexes...');
    const indexes = await roomsCollection.listIndexes().toArray();
    console.log('Current indexes:', indexes.map(idx => idx.name));
    
    // Check if roomId_1 index exists
    const roomIdIndex = indexes.find(idx => idx.name === 'roomId_1');
    
    if (roomIdIndex) {
      console.log('Found old roomId_1 index, dropping it...');
      await roomsCollection.dropIndex('roomId_1');
      console.log('✅ Successfully dropped roomId_1 index');
    } else {
      console.log('No roomId_1 index found');
    }
    
    // Remove any existing roomId fields from documents
    console.log('Removing roomId field from existing documents...');
    const result = await roomsCollection.updateMany(
      { roomId: { $exists: true } },
      { $unset: { roomId: "" } }
    );
    console.log(`✅ Removed roomId field from ${result.modifiedCount} documents`);
    
    // Ensure proper indexes exist
    console.log('Creating proper indexes...');
    await roomsCollection.createIndex({ roomCode: 1 }, { unique: true });
    await roomsCollection.createIndex({ code: 1 }, { unique: true, sparse: true });
    await roomsCollection.createIndex({ status: 1 });
    console.log('✅ Created proper indexes');
    
    console.log('🎉 Rooms collection fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing rooms collection:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the fix
fixRoomsCollection();