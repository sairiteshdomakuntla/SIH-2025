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

// Import the Simulation model
const Simulation = require('./models/Simulation');

// Function to generate slug from title
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim('-'); // Remove leading/trailing hyphens
}

// Migration function
const migrateSimulations = async () => {
  try {
    await connectDB();
    
    // Find all simulations that don't have slugs
    const simulations = await Simulation.find({ 
      $or: [
        { slug: { $exists: false } },
        { slug: null },
        { slug: '' }
      ]
    });
    
    console.log(`Found ${simulations.length} simulations without slugs`);
    
    for (let simulation of simulations) {
      const slug = generateSlug(simulation.title);
      
      // Check if slug already exists
      const existingSlug = await Simulation.findOne({ slug, _id: { $ne: simulation._id } });
      
      if (existingSlug) {
        // If slug exists, add a number suffix
        let counter = 1;
        let newSlug = `${slug}-${counter}`;
        
        while (await Simulation.findOne({ slug: newSlug, _id: { $ne: simulation._id } })) {
          counter++;
          newSlug = `${slug}-${counter}`;
        }
        
        simulation.slug = newSlug;
      } else {
        simulation.slug = slug;
      }
      
      await simulation.save();
      console.log(`Updated simulation: ${simulation.title} -> ${simulation.slug}`);
    }
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

// Run the migration
migrateSimulations();
