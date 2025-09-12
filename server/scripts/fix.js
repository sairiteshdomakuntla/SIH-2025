const mongoose = require('mongoose');
const crypto = require('crypto');
const Animation = require('../models/Animation'); // adjust path if needed

// 🔹 MongoDB connection string
const MONGO_URI = 'mongodb+srv://mdarbazking7_db_user:Mdarbaz123@cluster0.fkvjubg.mongodb.net/demodb123'; // replace with your DB URI

// 🔹 Helper function to generate hash from prompt
function generateHash(prompt) {
  return crypto.createHash('sha256').update(prompt).digest('hex');
}

async function insertAnimation() {
  try {
    // Connect to DB
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB Connected');

    // Example input
    const prompt = "Explain projectile motion";
    const video_url = "https://kowxqvwyhckwxbkqfljq.supabase.co/storage/v1/object/public/manim-videos/ProjectileMotion.mp4";

    // Create new doc
    const newAnimation = new Animation({
      prompt,
      promptHash: generateHash(prompt),
      video_url
      // userId: "64f2e6a12c1d5f7d9c9a1234" // optional if you want to link to a user
    });

    // Save doc
    const savedDoc = await newAnimation.save();
    console.log('🎉 Document inserted:', savedDoc);

    // Close connection
    await mongoose.disconnect();
    console.log('🔌 MongoDB Disconnected');
  } catch (err) {
    console.error('❌ Error inserting document:', err);
    process.exit(1);
  }
}

insertAnimation();
