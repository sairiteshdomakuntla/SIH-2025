const express = require('express');
const Note = require('../models/Note');
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

// Get all notes for user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { subject, tags, search, favorite } = req.query;
    const filter = { userId: req.user.userId };

    if (subject && subject !== 'all') {
      filter.subject = subject;
    }

    if (tags) {
      filter.tags = { $in: tags.split(',') };
    }

    if (favorite === 'true') {
      filter.isFavorite = true;
    }

    let notes = await Note.find(filter)
      .sort({ lastModified: -1 })
      .lean();

    // Search in title and content
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      notes = notes.filter(note => 
        searchRegex.test(note.title) || 
        JSON.stringify(note.content).toLowerCase().includes(search.toLowerCase())
      );
    }

    res.json({ success: true, notes });
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notes' });
  }
});

// Get note by slug
router.get('/slug/:slug', authenticateToken, async (req, res) => {
  try {
    const note = await Note.findOne({ 
      slug: req.params.slug, 
      $or: [
        { userId: req.user.userId },
        { 'sharedWith.userId': req.user.userId }
      ]
    });

    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    res.json(note);
  } catch (error) {
    console.error('Error fetching note by slug:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch note' });
  }
});

// Get single note
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const note = await Note.findOne({ 
      _id: req.params.id, 
      $or: [
        { userId: req.user.userId },
        { 'sharedWith.userId': req.user.userId }
      ]
    });

    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    res.json({ success: true, note });
  } catch (error) {
    console.error('Error fetching note:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch note' });
  }
});

// Create new note
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, content, subject, tags, isPublic } = req.body;

    const note = new Note({
      title: title || 'Untitled Note',
      content: content || { blocks: [], version: "2.28.2" },
      userId: req.user.userId,
      subject: subject || 'General',
      tags: tags || [],
      isPublic: isPublic || false
    });

    await note.save();
    res.status(201).json({ success: true, note });
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ success: false, message: 'Failed to create note' });
  }
});

// Update note
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, content, subject, tags, isPublic, isFavorite } = req.body;

    const note = await Note.findOneAndUpdate(
      { 
        _id: req.params.id, 
        $or: [
          { userId: req.user.userId },
          { 'sharedWith.userId': req.user.userId, 'sharedWith.permission': 'edit' }
        ]
      },
      {
        title,
        content,
        subject,
        tags,
        isPublic,
        isFavorite,
        lastModified: Date.now()
      },
      { new: true }
    );

    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found or no permission' });
    }

    res.json({ success: true, note });
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ success: false, message: 'Failed to update note' });
  }
});

// Delete note
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.user.userId 
    });

    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    res.json({ success: true, message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ success: false, message: 'Failed to delete note' });
  }
});

// Share note
router.post('/:id/share', authenticateToken, async (req, res) => {
  try {
    const { userEmail, permission } = req.body;
    
    // Find user to share with
    const User = require('../models/User');
    const userToShare = await User.findOne({ email: userEmail });
    
    if (!userToShare) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      {
        $addToSet: {
          sharedWith: {
            userId: userToShare._id,
            permission: permission || 'view'
          }
        }
      },
      { new: true }
    );

    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    res.json({ success: true, message: 'Note shared successfully' });
  } catch (error) {
    console.error('Error sharing note:', error);
    res.status(500).json({ success: false, message: 'Failed to share note' });
  }
});

module.exports = router;