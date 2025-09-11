const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const crypto = require('crypto');
const Animation = require('../models/Animation');
const Chat = require('../models/Chat');
const Simulation = require('../models/Simulation');
const router = express.Router();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper function to save chat messages
async function saveChatMessage(userId, sessionId, messages) {
  try {
    let chat = await Chat.findOne({ userId, sessionId });
    
    if (!chat) {
      chat = new Chat({
        userId,
        sessionId,
        messages: []
      });
    }
    
    // Add new messages
    chat.messages.push(...messages);
    chat.updatedAt = new Date();
    
    await chat.save();
    console.log('Chat history saved successfully');
  } catch (error) {
    console.error('Error saving chat history:', error);
    throw error;
  }
}

// Helper function to search for related simulations
async function searchRelatedSimulations(message) {
  try {
    // Extract key educational terms from the message
    const keywords = message.toLowerCase().match(/\b\w+\b/g) || [];
    
    // Define educational subject keywords
    const subjectKeywords = {
      physics: ['physics', 'force', 'energy', 'motion', 'gravity', 'electricity', 'magnetism', 'wave', 'light', 'quantum', 'mechanics', 'thermodynamics'],
      chemistry: ['chemistry', 'element', 'compound', 'reaction', 'molecule', 'atom', 'bond', 'organic', 'inorganic', 'periodic', 'acid', 'base'],
      biology: ['biology', 'cell', 'organism', 'dna', 'gene', 'evolution', 'ecosystem', 'photosynthesis', 'respiration', 'anatomy', 'plant', 'animal'],
      mathematics: ['math', 'mathematics', 'equation', 'function', 'algebra', 'geometry', 'calculus', 'trigonometry', 'statistics', 'probability']
    };
    
    // Find matching subject
    let searchTerms = [];
    for (const [subject, terms] of Object.entries(subjectKeywords)) {
      if (terms.some(term => keywords.includes(term))) {
        searchTerms = keywords.filter(keyword => 
          terms.includes(keyword) || 
          keyword.length > 4 // Include longer words that might be topic-specific
        );
        break;
      }
    }
    
    if (searchTerms.length === 0) {
      // If no specific subject match, use all keywords longer than 3 characters
      searchTerms = keywords.filter(word => word.length > 3);
    }
    
    if (searchTerms.length === 0) return [];
    
    // Create search regex
    const searchRegex = new RegExp(searchTerms.join('|'), 'i');
    
    const simulations = await Simulation.find({
      $or: [
        { title: searchRegex },
        { category: searchRegex },
        { tags: { $in: [searchRegex] } },
        { description: searchRegex }
      ]
    })
    .limit(3)
    .select('title subject category description iframeUrl')
    .lean();
    
    return simulations;
  } catch (error) {
    console.error('Error searching related simulations:', error);
    return [];
  }
}

// Chat endpoint for text responses
router.post('/chat', async (req, res) => {
  try {
    console.log('Received chat request:', req.body);
    
    const { message, sessionId, userId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log('Processing message:', message.trim());

    // Check if API key exists
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not found in environment variables');
      return res.status(500).json({
        error: 'Configuration error',
        message: 'Gemini API key not configured'
      });
    }

    // Get the generative model - using the correct model name
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Create a context prompt for educational responses
    const educationalPrompt = `You are an expert educational AI assistant. Your role is to help students learn various subjects in a clear, engaging, and age-appropriate manner. 

Please respond to the following student question with:
1. A clear and comprehensive explanation
2. Examples when helpful
3. Educational context
4. Encouraging and supportive tone

Student Question: ${message}

Please provide a helpful, educational response:`;

    console.log('Sending request to Gemini API...');

    // Generate response with timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 30000); // 30 second timeout
    });

    const result = await Promise.race([
      model.generateContent(educationalPrompt),
      timeoutPromise
    ]);

    console.log('Received response from Gemini API');
    
    const response = await result.response;
    const text = response.text();

    console.log('Successfully processed response');

    // Search for related simulations
    console.log('Searching for related simulations...');
    const relatedSimulations = await searchRelatedSimulations(message.trim());
    console.log('Found related simulations:', relatedSimulations.length);

    // Save chat history if user is authenticated
    if (userId && sessionId) {
      try {
        await saveChatMessage(userId, sessionId, [
          {
            id: `${Date.now()}_user`,
            type: 'user',
            content: message.trim(),
            timestamp: new Date()
          },
          {
            id: `${Date.now()}_bot`,
            type: 'bot-text',
            content: text,
            relatedSimulations: relatedSimulations,
            timestamp: new Date()
          }
        ]);
      } catch (saveError) {
        console.error('Error saving chat history:', saveError);
        // Don't fail the request if saving fails
      }
    }

    res.json({
      success: true,
      response: text,
      relatedSimulations,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Gemini API error:', error);
    console.error('Error stack:', error.stack);
    
    // Handle specific API errors
    if (error.message.includes('API key') || error.message.includes('API_KEY')) {
      return res.status(401).json({ 
        error: 'Invalid API key', 
        message: 'Please check your Gemini API configuration' 
      });
    }
    
    if (error.message.includes('quota') || error.message.includes('QUOTA')) {
      return res.status(429).json({ 
        error: 'API quota exceeded', 
        message: 'Too many requests. Please try again later.' 
      });
    }

    if (error.message.includes('timeout') || error.message.includes('Request timeout')) {
      return res.status(408).json({
        error: 'Request timeout',
        message: 'The request took too long to process. Please try again.'
      });
    }

    res.status(500).json({
      error: 'Failed to generate response',
      message: 'An error occurred while processing your request. Please try again.',
      details: error.message
    });
  }
});

// Subject-specific chat endpoint
router.post('/subject-chat', async (req, res) => {
  try {
    const { message, subject, grade } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Create subject and grade specific prompt
    const subjectPrompt = `You are an expert ${subject || 'general'} teacher for ${grade || 'middle school'} students. 

Your teaching style should be:
- Age-appropriate for ${grade || 'middle school'} level
- Clear and easy to understand
- Engaging with examples and analogies
- Encouraging and supportive
- Focused on ${subject || 'the relevant subject area'}

Student Question: ${message}

Please provide a helpful educational response tailored to a ${grade || 'middle school'} ${subject || 'general education'} student:`;

    const result = await model.generateContent(subjectPrompt);
    const response = await result.response;
    const text = response.text();

    res.json({
      success: true,
      response: text,
      subject: subject || 'general',
      grade: grade || 'middle school',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Gemini subject chat error:', error);
    res.status(500).json({
      error: 'Failed to generate subject-specific response',
      message: 'An error occurred while processing your request. Please try again.'
    });
  }
});

// Quick explanation endpoint
router.post('/explain', async (req, res) => {
  try {
    const { concept, difficulty = 'medium' } = req.body;

    if (!concept || !concept.trim()) {
      return res.status(400).json({ error: 'Concept is required' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const explanationPrompt = `Explain the concept "${concept}" in a ${difficulty} difficulty level for students. 

Requirements:
- Use simple language if difficulty is "easy"
- Include technical details if difficulty is "hard"  
- Provide examples and analogies
- Make it engaging and memorable
- Keep it concise but comprehensive

Please explain: ${concept}`;

    const result = await model.generateContent(explanationPrompt);
    const response = await result.response;
    const text = response.text();

    res.json({
      success: true,
      concept,
      difficulty,
      explanation: text,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Gemini explain error:', error);
    res.status(500).json({
      error: 'Failed to generate explanation',
      message: 'An error occurred while processing your request. Please try again.'
    });
  }
});

// Proxy endpoint for Manim API to avoid CORS issues with caching
router.post('/generate-animation', async (req, res) => {
  try {
    console.log('Received animation request:', req.body);
    
    const { prompt, userId } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Create a hash of the prompt for caching
    const promptHash = crypto.createHash('sha256').update(prompt.trim().toLowerCase()).digest('hex');
    
    // Check if we already have this animation in cache
    const existingAnimation = await Animation.findOne({ promptHash });
    
    if (existingAnimation) {
      console.log('Found cached animation for prompt:', prompt);
      
      // Update access count and last accessed time
      existingAnimation.accessCount += 1;
      existingAnimation.lastAccessed = new Date();
      await existingAnimation.save();
      
      return res.json({
        success: true,
        video_url: existingAnimation.video_url,
        message: existingAnimation.message + ' (from cache)',
        prompt: prompt.trim(),
        timestamp: new Date().toISOString(),
        cached: true
      });
    }

    console.log('No cached animation found. Making request to Manim API with prompt:', prompt);

    // Configure axios request
    const axiosConfig = {
      method: 'POST',
      url: 'https://manim-api.onrender.com/generate-video',
      data: { 
        prompt: prompt.trim()
      },
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Rural-Learning-Platform/1.0'
      },
      timeout: 180000, // 3 minute timeout for animation generation
      validateStatus: function (status) {
        return status < 500; // Don't throw for status codes less than 500
      }
    };

    const response = await axios(axiosConfig);
    console.log('Manim API response status:', response.status);
    console.log('Manim API response data:', response.data);

    if (response.status >= 400) {
      console.error('Manim API error response:', response.data);
      
      return res.status(response.status).json({
        error: 'Animation generation failed',
        message: `Manim API returned status ${response.status}`,
        details: response.data
      });
    }

    const data = response.data;

    // Validate that we have the expected response structure
    if (!data || !data.video_url) {
      console.error('Invalid Manim API response structure:', data);
      return res.status(502).json({
        error: 'Invalid response format',
        message: 'Manim API returned an invalid response format.',
        details: data
      });
    }

    // Only save to database if we have a successful response with video URL
    if (data.video_url && data.video_url.trim()) {
      // Save new animation to cache
      try {
        const newAnimation = new Animation({
          prompt: prompt.trim(),
          promptHash: promptHash,
          video_url: data.video_url,
          message: data.message || 'Video generated and uploaded successfully',
          accessCount: 1,
          lastAccessed: new Date()
        });
        
        await newAnimation.save();
        console.log('Saved new animation to cache');
      } catch (cacheError) {
        console.error('Error saving animation to cache:', cacheError);
        // Don't fail the request if caching fails
      }
    } else {
      console.log('No valid video URL received, skipping database save');
    }

    // Return success response matching expected format
    res.json({
      success: true,
      video_url: data.video_url,
      message: data.message || 'Video generated and uploaded successfully',
      prompt: prompt.trim(),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Manim proxy error:', error);
    console.error('Error details:', error.response?.data || error.message);
    
    // Handle axios-specific errors
    if (error.code === 'ECONNABORTED') {
      return res.status(408).json({
        error: 'Request timeout',
        message: 'Animation generation took too long (over 3 minutes). Please try a simpler prompt or try again later.'
      });
    }

    if (error.code === 'ENOTFOUND') {
      return res.status(503).json({
        error: 'Service unavailable',
        message: 'Animation service is currently unavailable. Please try again later.'
      });
    }

    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        error: 'Connection refused',
        message: 'Could not connect to animation service. Please try again later.'
      });
    }

    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      return res.status(error.response.status).json({
        error: 'Animation API error',
        message: error.response.data?.message || 'Animation service returned an error.',
        details: error.response.data
      });
    }

    res.status(500).json({
      error: 'Failed to generate animation',
      message: 'An error occurred while processing your animation request.',
      details: error.message
    });
  }
});

// Get chat history for a user
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const chats = await Chat.find({ userId })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('sessionId messages createdAt updatedAt');
    
    const total = await Chat.countDocuments({ userId });
    
    res.json({
      success: true,
      chats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({
      error: 'Failed to fetch chat history',
      message: 'An error occurred while fetching your chat history.'
    });
  }
});

// Get specific chat session
router.get('/history/:userId/:sessionId', async (req, res) => {
  try {
    const { userId, sessionId } = req.params;
    
    const chat = await Chat.findOne({ userId, sessionId });
    
    if (!chat) {
      return res.status(404).json({
        error: 'Chat not found',
        message: 'The requested chat session was not found.'
      });
    }
    
    res.json({
      success: true,
      chat
    });
  } catch (error) {
    console.error('Error fetching chat session:', error);
    res.status(500).json({
      error: 'Failed to fetch chat session',
      message: 'An error occurred while fetching the chat session.'
    });
  }
});

// Delete chat history
router.delete('/history/:userId/:sessionId', async (req, res) => {
  try {
    const { userId, sessionId } = req.params;
    
    const result = await Chat.deleteOne({ userId, sessionId });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({
        error: 'Chat not found',
        message: 'The requested chat session was not found.'
      });
    }
    
    res.json({
      success: true,
      message: 'Chat session deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting chat session:', error);
    res.status(500).json({
      error: 'Failed to delete chat session',
      message: 'An error occurred while deleting the chat session.'
    });
  }
});

// Get animation cache stats (admin only)
router.get('/cache-stats', async (req, res) => {
  try {
    const totalAnimations = await Animation.countDocuments();
    const totalUsage = await Animation.aggregate([
      { $group: { _id: null, totalAccess: { $sum: '$accessCount' } } }
    ]);
    
    const mostPopular = await Animation.find()
      .sort({ accessCount: -1 })
      .limit(5)
      .select('prompt accessCount lastAccessed');
    
    res.json({
      success: true,
      stats: {
        totalAnimations,
        totalUsage: totalUsage[0]?.totalAccess || 0,
        mostPopular
      }
    });
  } catch (error) {
    console.error('Error fetching cache stats:', error);
    res.status(500).json({
      error: 'Failed to fetch cache statistics',
      message: 'An error occurred while fetching cache statistics.'
    });
  }
});

module.exports = router;
