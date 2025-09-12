// const express = require('express');
// const router = express.Router();
// const Note = require('../models/Note');
// const authenticateToken = require('../middleware/authMiddleware');

// // Get all notes for a user
// router.get('/', authenticateToken, async (req, res) => {
//   try {
//     const { subject, search, page = 1, limit = 10 } = req.query;
//     const userId = req.user.userId || req.user.id;

//     // Build query
//     const query = { userId };
    
//     if (subject && subject !== 'all') {
//       query.subject = subject;
//     }
    
//     if (search) {
//       query.$or = [
//         { title: { $regex: search, $options: 'i' } },
//         { content: { $regex: search, $options: 'i' } },
//         { tags: { $in: [new RegExp(search, 'i')] } }
//       ];
//     }

//     const notes = await Note.find(query)
//       .sort({ updatedAt: -1 })
//       .limit(limit * 1)
//       .skip((page - 1) * limit)
//       .lean();

//     const total = await Note.countDocuments(query);

//     res.json({
//       success: true,
//       notes,
//       pagination: {
//         current: page,
//         pages: Math.ceil(total / limit),
//         total
//       }
//     });
//   } catch (error) {
//     console.error('Get notes error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch notes',
//       error: error.message
//     });
//   }
// });

// // Get note by slug
// router.get('/slug/:slug', authenticateToken, async (req, res) => {
//   try {
//     const note = await Note.findOne({ 
//       slug: req.params.slug, 
//       $or: [
//         { userId: req.user.userId },
//         { 'sharedWith.userId': req.user.userId }
//       ]
//     });

//     if (!note) {
//       return res.status(404).json({ success: false, message: 'Note not found' });
//     }

//     res.json(note);
//   } catch (error) {
//     console.error('Error fetching note by slug:', error);
//     res.status(500).json({ success: false, message: 'Failed to fetch note' });
//   }
// });
// // Get public notes
// router.get('/public', async (req, res) => {
//   try {
//     const { subject, search, page = 1, limit = 10 } = req.query;

//     // Build query for public notes
//     const query = { isPrivate: false };
    
//     if (subject && subject !== 'all') {
//       query.subject = subject;
//     }
    
//     if (search) {
//       query.$or = [
//         { title: { $regex: search, $options: 'i' } },
//         { content: { $regex: search, $options: 'i' } },
//         { tags: { $in: [new RegExp(search, 'i')] } }
//       ];
//     }

//     const notes = await Note.find(query)
//       .populate('userId', 'name level avatar')
//       .sort({ updatedAt: -1 })
//       .limit(limit * 1)
//       .skip((page - 1) * limit)
//       .lean();

//     const total = await Note.countDocuments(query);

//     res.json({
//       success: true,
//       notes,
//       pagination: {
//         current: page,
//         pages: Math.ceil(total / limit),
//         total
//       }
//     });
//   } catch (error) {
//     console.error('Get public notes error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch public notes',
//       error: error.message
//     });
//   }
// });

// // Get a single note
// router.get('/:id', authenticateToken, async (req, res) => {
//   try {
//     const noteId = req.params.id;
//     const userId = req.user.userId || req.user.id;

//     const note = await Note.findById(noteId).populate('userId', 'name level avatar');

//     if (!note) {
//       return res.status(404).json({
//         success: false,
//         message: 'Note not found'
//       });
//     }

//     // Check if user can access this note
//     if (note.isPrivate && note.userId._id.toString() !== userId) {
//       return res.status(403).json({
//         success: false,
//         message: 'Access denied'
//       });
//     }

//     res.json({
//       success: true,
//       note
//     });
//   } catch (error) {
//     console.error('Get note error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch note',
//       error: error.message
//     });
//   }
// });

// // Create a new note
// router.post('/', authenticateToken, async (req, res) => {
//   try {
//     const { title, content, subject, tags, isPrivate } = req.body;
//     const userId = req.user.userId || req.user.id;

//     // Validate required fields
//     if (!title || !content || !subject) {
//       return res.status(400).json({
//         success: false,
//         message: 'Title, content, and subject are required'
//       });
//     }

//     // Create note
//     const note = new Note({
//       title: title.trim(),
//       content: content.trim(),
//       subject,
//       tags: tags || [],
//       isPrivate: isPrivate || false,
//       userId
//     });

//     await note.save();
//     await note.populate('userId', 'name level avatar');

//     console.log('Note created successfully:', note._id);

//     res.status(201).json({
//       success: true,
//       message: 'Note created successfully',
//       note
//     });
//   } catch (error) {
//     console.error('Create note error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to create note',
//       error: error.message
//     });
//   }
// });

// // Update a note
// router.put('/:id', authenticateToken, async (req, res) => {
//   try {
//     const noteId = req.params.id;
//     const { title, content, subject, tags, isPrivate } = req.body;
//     const userId = req.user.userId || req.user.id;

//     // Validate required fields
//     if (!title || !content || !subject) {
//       return res.status(400).json({
//         success: false,
//         message: 'Title, content, and subject are required'
//       });
//     }

//     // Find note
//     const note = await Note.findById(noteId);

//     if (!note) {
//       return res.status(404).json({
//         success: false,
//         message: 'Note not found'
//       });
//     }

//     // Check ownership
//     if (note.userId.toString() !== userId) {
//       return res.status(403).json({
//         success: false,
//         message: 'Access denied'
//       });
//     }

//     // Update note
//     note.title = title.trim();
//     note.content = content.trim();
//     note.subject = subject;
//     note.tags = tags || [];
//     note.isPrivate = isPrivate || false;
//     note.updatedAt = new Date();

//     await note.save();
//     await note.populate('userId', 'name level avatar');

//     console.log('Note updated successfully:', note._id);

//     res.json({
//       success: true,
//       message: 'Note updated successfully',
//       note
//     });
//   } catch (error) {
//     console.error('Update note error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to update note',
//       error: error.message
//     });
//   }
// });

// // Delete a note
// router.delete('/:id', authenticateToken, async (req, res) => {
//   try {
//     const noteId = req.params.id;
//     const userId = req.user.userId || req.user.id;

//     const note = await Note.findById(noteId);

//     if (!note) {
//       return res.status(404).json({
//         success: false,
//         message: 'Note not found'
//       });
//     }

//     // Check ownership
//     if (note.userId.toString() !== userId) {
//       return res.status(403).json({
//         success: false,
//         message: 'Access denied'
//       });
//     }

//     await Note.findByIdAndDelete(noteId);

//     console.log('Note deleted successfully:', noteId);

//     res.json({
//       success: true,
//       message: 'Note deleted successfully'
//     });
//   } catch (error) {
//     console.error('Delete note error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to delete note',
//       error: error.message
//     });
//   }
// });

// module.exports = router;

const express = require("express");
const Note = require("../models/Note");
const authenticateToken = require("../middleware/authMiddleware");
const xpService = require("../services/xpService");
const badgeService = require("../services/badgeService");

const router = express.Router();

// Helper function to convert old Editor.js content to plain text
const convertContentToText = (content) => {
	if (!content) return "";

	// If already a string, return as is
	if (typeof content === "string") return content;

	// If it's the old Editor.js format (object with blocks)
	if (
		typeof content === "object" &&
		content.blocks &&
		Array.isArray(content.blocks)
	) {
		return content.blocks
			.map((block) => {
				if (block.data?.text) return block.data.text;
				if (block.data?.items && Array.isArray(block.data.items)) {
					return block.data.items.join("\n");
				}
				return "";
			})
			.filter((text) => text.length > 0)
			.join("\n\n");
	}

	return "";
};

// Get all notes for user
router.get("/", authenticateToken, async (req, res) => {
	try {
		const { subject, search, favorite } = req.query;
		const filter = { userId: req.user.userId };

		if (subject && subject !== "all") {
			filter.subject = subject;
		}

		if (favorite === "true") {
			filter.isFavorite = true;
		}

		let notes = await Note.find(filter).sort({ updatedAt: -1 }).lean();

		// Convert old content format for all notes
		notes = notes.map((note) => ({
			...note,
			content: convertContentToText(note.content),
		}));

		// Simple text search
		if (search) {
			const searchRegex = new RegExp(search, "i");
			notes = notes.filter(
				(note) => searchRegex.test(note.title) || searchRegex.test(note.content)
			);
		}

		res.json({ success: true, notes });
	} catch (error) {
		console.error("Error fetching notes:", error);
		res.status(500).json({ success: false, message: "Failed to fetch notes" });
	}
});

// Get single note
router.get("/:id", authenticateToken, async (req, res) => {
	try {
		const note = await Note.findOne({
			_id: req.params.id,
			userId: req.user.userId,
		});

		if (!note) {
			return res
				.status(404)
				.json({ success: false, message: "Note not found" });
		}

		// Convert old content format to plain text if needed
		const noteObj = note.toObject();
		noteObj.content = convertContentToText(noteObj.content);

		res.json({ success: true, note: noteObj });
	} catch (error) {
		console.error("Error fetching note:", error);
		res.status(500).json({ success: false, message: "Failed to fetch note" });
	}
});

// Create new note
router.post("/", authenticateToken, async (req, res) => {
	try {
		const { title, content, subject } = req.body;

		const note = new Note({
			title: title || "Untitled Note",
			content: content || "",
			userId: req.user.userId,
			subject: subject || "General",
		});

		await note.save();

		// Award XP for writing a note
		try {
			const xpResult = await xpService.awardXP(req.user.userId, "note_written");
			const newBadges = await badgeService.checkAndAwardBadges(req.user.userId);

			res.status(201).json({
				success: true,
				note,
				xpAwarded: xpResult?.xpAwarded || 0,
				levelInfo: xpResult?.levelInfo,
				leveledUp: xpResult?.leveledUp || false,
				newBadges: newBadges || [],
			});
		} catch (xpError) {
			console.warn("XP/Badge error:", xpError);
			res.status(201).json({
				success: true,
				note,
				xpAwarded: 0,
				leveledUp: false,
				newBadges: [],
			});
		}
	} catch (error) {
		console.error("Error creating note:", error);
		res.status(500).json({ success: false, message: "Failed to create note" });
	}
});

// Update note
router.put("/:id", authenticateToken, async (req, res) => {
	try {
		const { title, content, subject, isFavorite } = req.body;

		// Ensure content is always saved as string
		const contentString = convertContentToText(content);

		const note = await Note.findOneAndUpdate(
			{
				_id: req.params.id,
				userId: req.user.userId,
			},
			{
				title,
				content: contentString,
				subject,
				isFavorite,
				updatedAt: Date.now(),
			},
			{ new: true }
		);

		if (!note) {
			return res
				.status(404)
				.json({ success: false, message: "Note not found" });
		}

		res.json({ success: true, note });
	} catch (error) {
		console.error("Error updating note:", error);
		res.status(500).json({ success: false, message: "Failed to update note" });
	}
});

// Delete note
router.delete("/:id", authenticateToken, async (req, res) => {
	try {
		const note = await Note.findOneAndDelete({
			_id: req.params.id,
			userId: req.user.userId,
		});

		if (!note) {
			return res
				.status(404)
				.json({ success: false, message: "Note not found" });
		}

		res.json({ success: true, message: "Note deleted successfully" });
	} catch (error) {
		console.error("Error deleting note:", error);
		res.status(500).json({ success: false, message: "Failed to delete note" });
	}
});

module.exports = router;
