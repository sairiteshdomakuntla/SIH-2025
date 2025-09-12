// const mongoose = require('mongoose');

// // Function to generate slug from title
// function generateSlug(title) {
//   return title
//     .toLowerCase()
//     .replace(/[^\w\s-]/g, '') // Remove special characters
//     .replace(/\s+/g, '-') // Replace spaces with dashes
//     .replace(/-+/g, '-') // Replace multiple dashes with single dash
//     .trim('-'); // Remove leading/trailing dashes
// }

// const noteSchema = new mongoose.Schema({
//   title: {
//     type: String,
//     required: true,
//     trim: true,
//     maxlength: 200
//   },
//   slug: {
//     type: String,
//     unique: true,
//     lowercase: true,
//     trim: true
//   },
//   content: {
//     type: mongoose.Schema.Types.Mixed, // Store Editor.js blocks
//     default: { blocks: [], version: "2.28.2" }
//   },
//   userId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   tags: [{
//     type: String,
//     trim: true,
//     maxlength: 50
//   }],
//   subject: {
//     type: String,
//     enum: ['Math', 'Science', 'English', 'Hindi', 'Social Studies', 'Computer Science', 'Art', 'Music', 'General','Biology','Chemistry','Physics','History','Geography','Economics,Mathematics'],
//     default: 'General'
//   },
//   isPublic: {
//     type: Boolean,
//     default: false
//   },
//   sharedWith: [{
//     userId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'User'
//     },
//     permission: {
//       type: String,
//       enum: ['view', 'edit'],
//       default: 'view'
//     }
//   }],
//   isFavorite: {
//     type: Boolean,
//     default: false
//   },
//   lastModified: {
//     type: Date,
//     default: Date.now
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// // Indexes for better performance
// noteSchema.index({ userId: 1, createdAt: -1 });
// noteSchema.index({ userId: 1, subject: 1 });
// noteSchema.index({ userId: 1, tags: 1 });
// noteSchema.index({ title: 'text', tags: 'text' });

// // Generate slug before saving
// noteSchema.pre('save', async function(next) {
//   this.lastModified = Date.now();
  
//   // Generate slug if it doesn't exist or title changed
//   if (!this.slug || this.isModified('title')) {
//     let baseSlug = generateSlug(this.title);
//     let slug = baseSlug;
//     let counter = 1;
    
//     // Check for existing slugs and append number if needed
//     while (await this.constructor.findOne({ slug: slug, _id: { $ne: this._id } })) {
//       slug = `${baseSlug}-${counter}`;
//       counter++;
//     }
    
//     this.slug = slug;
//   }
  
//   next();
// });

// module.exports = mongoose.model('Note', noteSchema);

const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema({
	title: {
		type: String,
		required: true,
		trim: true,
		default: "Untitled Note",
	},
	content: {
		type: String,
		default: "",
	},
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true,
	},
	subject: {
		type: String,
		enum: [
			"Math",
			"Science",
			"English",
			"Hindi",
			"Social Studies",
			"Computer Science",
			"Art",
			"Music",
			"General",
		],
		default: "General",
	},
	isFavorite: {
		type: Boolean,
		default: false,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
	updatedAt: {
		type: Date,
		default: Date.now,
	},
});

// Update timestamp on save
noteSchema.pre("save", function (next) {
	this.updatedAt = Date.now();
	next();
});

// Indexes for better performance
noteSchema.index({ userId: 1, createdAt: -1 });
noteSchema.index({ userId: 1, subject: 1 });

module.exports = mongoose.model("Note", noteSchema);
