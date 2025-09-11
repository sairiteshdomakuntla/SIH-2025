const mongoose = require('mongoose');
const DailyQuestion = require('../models/DailyQuestion');

async function fixDailyQuestionsIndex() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    
    console.log('Connected to MongoDB');
    
    // Get the collection
    const collection = DailyQuestion.collection;
    
    // Get existing indexes
    const indexes = await collection.listIndexes().toArray();
    console.log('Existing indexes:', indexes.map(idx => ({ name: idx.name, key: idx.key })));
    
    // Drop the problematic single date index if it exists
    try {
      await collection.dropIndex('date_1');
      console.log('Dropped old date_1 index');
    } catch (error) {
      if (error.message.includes('index not found')) {
        console.log('date_1 index not found (already removed or never existed)');
      } else {
        console.log('Error dropping date_1 index:', error.message);
      }
    }
    
    // Ensure the compound index exists
    try {
      await collection.createIndex({ date: 1, grade: 1 }, { unique: true });
      console.log('Created/ensured compound index on date + grade');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('Compound index already exists');
      } else {
        console.log('Error creating compound index:', error.message);
      }
    }
    
    // List final indexes
    const finalIndexes = await collection.listIndexes().toArray();
    console.log('Final indexes:', finalIndexes.map(idx => ({ name: idx.name, key: idx.key })));
    
    console.log('Index fix completed successfully');
    
  } catch (error) {
    console.error('Error fixing indexes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Check if this script is being run directly
if (require.main === module) {
  // Load environment variables
  require('dotenv').config();
  fixDailyQuestionsIndex();
}

module.exports = fixDailyQuestionsIndex;
