const mongoose = require("mongoose");

const simulationSchema = new mongoose.Schema({
	title: {
		type: String,
		required: true,
		trim: true,
	},
	slug: {
		type: String,
		required: true,
		unique: true,
		trim: true,
	},
	subject: {
		type: String,
		required: true,
		enum: ["Physics", "Chemistry", "Biology", "Mathematics"],
	},
	category: {
		type: String,
		required: true,
		trim: true,
	},
	iframeUrl: {
		type: String,
		required: true,
	},
	downloadUrl: {
		type: String,
		required: true,
	},
	description: {
		type: String,
		default: "",
	},
	tags: [String],
	difficulty: {
		type: String,
		enum: ["Beginner", "Intermediate", "Advanced"],
		default: "Beginner",
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
});

// Function to generate slug from title
function generateSlug(title) {
	return title
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, '') // Remove special characters
		.replace(/\s+/g, '-') // Replace spaces with hyphens
		.replace(/-+/g, '-') // Replace multiple hyphens with single
		.trim('-'); // Remove leading/trailing hyphens
}

// Pre-save middleware to generate slug
simulationSchema.pre('save', function(next) {
	if (this.isModified('title') || this.isNew) {
		this.slug = generateSlug(this.title);
	}
	next();
});

// Create index for better search performance
simulationSchema.index({ title: "text", category: "text", tags: "text" });

module.exports = mongoose.model("Simulation", simulationSchema);
