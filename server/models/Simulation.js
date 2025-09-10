const mongoose = require("mongoose");

const simulationSchema = new mongoose.Schema({
	title: {
		type: String,
		required: true,
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

// Create index for better search performance
simulationSchema.index({ title: "text", category: "text", tags: "text" });

module.exports = mongoose.model("Simulation", simulationSchema);
