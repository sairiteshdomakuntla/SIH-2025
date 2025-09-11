const mongoose = require('mongoose');
require('dotenv').config();

// Function to generate slug from title
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with dashes
    .replace(/-+/g, '-') // Replace multiple dashes with single dash
    .trim('-'); // Remove leading/trailing dashes
}

async function migrateNotes() {
  try {
    // Connect to MongoDB using the same URI as the main app
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Get the notes collection directly
    const db = mongoose.connection.db;
    const notesCollection = db.collection('notes');

    // Find all notes without slugs
    const notesWithoutSlugs = await notesCollection.find({ slug: { $exists: false } }).toArray();
    console.log(`Found ${notesWithoutSlugs.length} notes without slugs`);

    let updated = 0;
    const slugs = new Set();

    for (const note of notesWithoutSlugs) {
      let baseSlug = generateSlug(note.title);
      let slug = baseSlug;
      let counter = 1;

      // Ensure uniqueness
      while (slugs.has(slug)) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      slugs.add(slug);

      // Update the note with the slug
      await notesCollection.updateOne(
        { _id: note._id },
        { $set: { slug: slug } }
      );

      updated++;
      console.log(`Updated note "${note.title}" with slug: ${slug}`);
    }

    console.log(`Migration completed! Updated ${updated} notes with slugs.`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateNotes();
}

module.exports = migrateNotes;
