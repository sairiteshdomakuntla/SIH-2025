const User = require("../models/User");
dotenv = require("dotenv");
dotenv.config();

class QuizService {
  constructor() {
    this.geminiApiKey = process.env.GEMINI_API_KEY;
    this.geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.geminiApiKey}`;
    this.maxRetries = 3;
    this.retryDelay = 2000; // 2 seconds
  }

  /**
   * Generate a quiz for a specific user based on their preferences
   * @param {string} userId - MongoDB user ID
   * @returns {Promise<Object>} Quiz object with question, options, and answer
   */
  async generateQuiz(userId) {
    try {
      // 1. Fetch user preferences from MongoDB
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      // Extract user preferences with defaults
      const userPreferences = this.extractUserPreferences(user);
      
      // 2. Build quiz prompt for Gemini API
      const prompt = this.buildQuizPrompt(userPreferences);
      
      // 3. Call Gemini API with retry logic
      const quizData = await this.callGeminiAPIWithRetry(prompt);
      
      // 4. Parse and validate response
      const quiz = this.parseQuizResponse(quizData, userPreferences);
      
      return quiz;
    } catch (error) {
      console.error("Quiz generation error:", error);
      // Return fallback quiz if all retries fail
      const userPreferences = { subject: 'math', classLevel: '10', difficulty: 'medium' };
      return this.getFallbackQuiz(userPreferences);
    }
  }

  /**
   * Extract user preferences from User model
   * @param {Object} user - User document from MongoDB
   * @returns {Object} User preferences for quiz generation
   */
  extractUserPreferences(user) {
    return {
      subject: user.interests?.[0]?.toLowerCase() || 'math',
      classLevel: this.extractClassLevel(user.grade),
      difficulty: this.mapLevelToDifficulty(user.level || 1),
      location: user.location || 'rural'
    };
  }

  /**
   * Extract class level number from grade string
   * @param {string} grade - Grade from user model (e.g., '5th Grade', '10th Grade')
   * @returns {string} Class level number as string
   */
  extractClassLevel(grade) {
    if (!grade) return '10'; // Default fallback
    
    // Extract number from grade strings like '5th Grade', '6th Grade', etc.
    const match = grade.match(/(\d+)/);
    if (match) {
      return match[1];
    }
    
    // If it's already a number, return as string
    if (!isNaN(grade)) {
      return grade.toString();
    }
    
    // Fallback to grade 10
    return '10';
  }

  /**
   * Map user level to difficulty
   * @param {number} level - User level
   * @returns {string} Difficulty level
   */
  mapLevelToDifficulty(level) {
    if (level <= 3) return 'easy';
    if (level <= 6) return 'medium';
    return 'hard';
  }

  /**
   * Build quiz generation prompt for Gemini API
   * @param {Object} preferences - User preferences
   * @returns {string} Formatted prompt for Gemini API
   */
  buildQuizPrompt({ subject, classLevel, difficulty, location }) {
    const locationContext = location.toLowerCase().includes('rural') || 
                           location.toLowerCase().includes('village') ? 
                           'rural/village' : 'urban';
                           
    return `Generate one multiple-choice quiz for subject=${subject}, class=${classLevel}, difficulty=${difficulty}. 
The quiz should be suitable for ${locationContext} students in ${location} and have a single question, 4 options, and exactly 1 correct answer. 
Make the question practical and relevant to ${locationContext} contexts when possible.
Respond in strict JSON format with keys: subject, classLevel, difficulty, question, options, answer.
Ensure the response is valid JSON without any markdown formatting or extra text.

Example format:
{
  "subject": "${subject}",
  "classLevel": "${classLevel}",
  "difficulty": "${difficulty}",
  "question": "Your question here",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "answer": "Correct option text"
}`;
  }

  /**
   * Build quiz generation prompt for Gemini API to generate multiple questions
   * @param {Object} preferences - User preferences
   * @param {number} questionCount - Number of questions to generate (default: 10)
   * @returns {string} Formatted prompt for Gemini API
   */
  buildMultipleQuizPrompt({ subject, classLevel, difficulty, location }, questionCount = 10) {
    const locationContext = location.toLowerCase().includes('rural') || 
                           location.toLowerCase().includes('village') ? 
                           'rural/village' : 'urban';
                           
    return `Generate ${questionCount} multiple-choice quiz questions for subject=${subject}, class=${classLevel}, difficulty=${difficulty}. 
The quiz should be suitable for ${locationContext} students in ${location}. Each question should have 4 options and exactly 1 correct answer. 
Make the questions practical and relevant to ${locationContext} contexts when possible.
Ensure questions are diverse and cover different topics within the subject.
Respond in strict JSON format as an array of question objects.
Ensure the response is valid JSON without any markdown formatting or extra text.

Format:
[
  {
    "subject": "${subject}",
    "classLevel": "${classLevel}",
    "difficulty": "${difficulty}",
    "question": "Question 1 here",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "Correct option text"
  },
  {
    "subject": "${subject}",
    "classLevel": "${classLevel}",
    "difficulty": "${difficulty}",
    "question": "Question 2 here",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "Correct option text"
  }
]`;
  }

  /**
   * Call Gemini API with retry logic and exponential backoff
   * @param {string} prompt - Quiz generation prompt
   * @returns {Promise<Object>} Raw API response
   */
  async callGeminiAPIWithRetry(prompt, retryCount = 0) {
    try {
      return await this.callGeminiAPI(prompt);
    } catch (error) {
      console.error(`Gemini API attempt ${retryCount + 1} failed:`, error.message);
      
      // Check if it's a retryable error (503, 429, etc.)
      const isRetryableError = error.message.includes('503') || 
                              error.message.includes('429') || 
                              error.message.includes('overloaded') ||
                              error.message.includes('UNAVAILABLE');
      
      if (retryCount < this.maxRetries && isRetryableError) {
        const delay = this.retryDelay * Math.pow(2, retryCount); // Exponential backoff
        console.log(`Retrying in ${delay}ms...`);
        await this.sleep(delay);
        return this.callGeminiAPIWithRetry(prompt, retryCount + 1);
      }
      
      throw error; // Re-throw if max retries exceeded or non-retryable error
    }
  }

  /**
   * Call Gemini API with the generated prompt
   * @param {string} prompt - Quiz generation prompt
   * @returns {Promise<Object>} Raw API response
   */
  async callGeminiAPI(prompt) {
    if (!this.geminiApiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    };

    try {
      const response = await fetch(this.geminiApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Gemini API call failed:", error);
      throw error;
    }
  }

  /**
   * Parse and validate Gemini API response
   * @param {Object} apiResponse - Raw Gemini API response
   * @param {Object} preferences - User preferences for fallback
   * @returns {Object} Parsed quiz object
   */
  parseQuizResponse(apiResponse, preferences) {
    try {
      // Extract text from Gemini response structure
      const responseText = apiResponse?.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!responseText) {
        throw new Error("No response text from Gemini API");
      }

      // Clean the response text (remove markdown formatting if present)
      const cleanedText = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      // Parse JSON
      const quizData = JSON.parse(cleanedText);

      // Validate required fields
      const requiredFields = ['subject', 'classLevel', 'difficulty', 'question', 'options', 'answer'];
      for (const field of requiredFields) {
        if (!quizData[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Validate options array
      if (!Array.isArray(quizData.options) || quizData.options.length !== 4) {
        throw new Error("Options must be an array of exactly 4 items");
      }

      // Validate that answer is one of the options
      if (!quizData.options.includes(quizData.answer)) {
        throw new Error("Answer must be one of the provided options");
      }

      return {
        subject: quizData.subject || preferences.subject,
        classLevel: quizData.classLevel || preferences.classLevel,
        difficulty: quizData.difficulty || preferences.difficulty,
        question: quizData.question,
        options: quizData.options,
        answer: quizData.answer,
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error("Failed to parse Gemini response:", error);
      
      // Return fallback quiz if parsing fails
      return this.getFallbackQuiz(preferences);
    }
  }

  /**
   * Parse and validate multiple quiz questions from Gemini API response
   * @param {Object} apiResponse - Raw Gemini API response
   * @param {Object} preferences - User preferences for fallback
   * @param {number} expectedCount - Expected number of questions
   * @returns {Array} Array of parsed quiz objects
   */
  parseMultipleQuizResponse(apiResponse, preferences, expectedCount = 10) {
    try {
      // Extract text from Gemini response structure
      const responseText = apiResponse?.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!responseText) {
        throw new Error("No response text from Gemini API");
      }

      // Clean the response text (remove markdown formatting if present)
      const cleanedText = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      // Parse JSON
      const quizData = JSON.parse(cleanedText);

      // Validate that it's an array
      if (!Array.isArray(quizData)) {
        throw new Error("Response is not an array of questions");
      }

      const validQuestions = [];
      const requiredFields = ['subject', 'classLevel', 'difficulty', 'question', 'options', 'answer'];

      for (let i = 0; i < quizData.length; i++) {
        const question = quizData[i];
        
        try {
          // Validate required fields
          for (const field of requiredFields) {
            if (!question[field]) {
              throw new Error(`Missing required field: ${field} in question ${i + 1}`);
            }
          }

          // Validate options array
          if (!Array.isArray(question.options) || question.options.length !== 4) {
            throw new Error(`Options must be an array of exactly 4 items in question ${i + 1}`);
          }

          // Validate that answer is one of the options
          if (!question.options.includes(question.answer)) {
            throw new Error(`Answer must be one of the provided options in question ${i + 1}`);
          }

          validQuestions.push({
            subject: question.subject || preferences.subject,
            classLevel: question.classLevel || preferences.classLevel,
            difficulty: question.difficulty || preferences.difficulty,
            question: question.question,
            options: question.options,
            answer: question.answer,
            generatedAt: new Date().toISOString()
          });
        } catch (questionError) {
          console.warn(`Skipping invalid question ${i + 1}:`, questionError.message);
        }
      }

      // If we don't have enough valid questions, fill with fallback questions
      while (validQuestions.length < expectedCount) {
        const fallbackQuestion = this.getFallbackQuiz(preferences);
        validQuestions.push({
          ...fallbackQuestion,
          isFallback: true,
          questionNumber: validQuestions.length + 1
        });
      }

      return validQuestions.slice(0, expectedCount);

    } catch (error) {
      console.error("Failed to parse Gemini response:", error);
      
      // Return fallback questions if parsing fails
      const fallbackQuestions = [];
      for (let i = 0; i < expectedCount; i++) {
        fallbackQuestions.push({
          ...this.getFallbackQuiz(preferences),
          isFallback: true,
          questionNumber: i + 1
        });
      }
      return fallbackQuestions;
    }
  }

  /**
   * Provide fallback quiz if API fails
   * @param {Object} preferences - User preferences
   * @returns {Object} Fallback quiz object
   */
  getFallbackQuiz({ subject, classLevel, difficulty }) {
    const classNum = parseInt(classLevel) || 10;
    
    const fallbackQuizzes = {
      math: {
        easy: {
          question: classNum <= 7 ? "What is 2 + 3?" : "What is 15% of 100?",
          options: classNum <= 7 ? ["4", "5", "6", "7"] : ["10", "15", "20", "25"],
          answer: classNum <= 7 ? "5" : "15"
        },
        medium: {
          question: classNum <= 8 ? "What is 12 × 8?" : "What is 15% of 200?",
          options: classNum <= 8 ? ["86", "96", "106", "116"] : ["25", "30", "35", "40"],
          answer: classNum <= 8 ? "96" : "30"
        },
        hard: {
          question: classNum <= 9 ? 
            "If a shopkeeper buys 50 items at ₹20 each and sells them at ₹25 each, what is his profit?" :
            "If a farmer has 120 chickens and sells 25% of them, how many chickens remain?",
          options: classNum <= 9 ? ["₹200", "₹250", "₹300", "₹350"] : ["85", "90", "95", "100"],
          answer: classNum <= 9 ? "₹250" : "90"
        }
      },
      science: {
        easy: {
          question: "What gas do plants absorb from the air?",
          options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Hydrogen"],
          answer: "Carbon Dioxide"
        },
        medium: {
          question: classNum <= 8 ? 
            "What is the boiling point of water?" : 
            "What is the boiling point of water at sea level?",
          options: ["90°C", "95°C", "100°C", "105°C"],
          answer: "100°C"
        },
        hard: {
          question: classNum <= 9 ?
            "Which process helps plants make food using sunlight?" :
            "Which process do plants use to make their own food?",
          options: ["Respiration", "Photosynthesis", "Transpiration", "Germination"],
          answer: "Photosynthesis"
        }
      },
      english: {
        easy: {
          question: classNum <= 7 ?
            "What is the opposite of 'hot'?" :
            "What is the past tense of 'go'?",
          options: classNum <= 7 ? ["Cold", "Warm", "Cool", "Ice"] : ["Gone", "Went", "Going", "Goes"],
          answer: classNum <= 7 ? "Cold" : "Went"
        },
        medium: {
          question: "Which is the correct plural of 'child'?",
          options: ["Childs", "Children", "Childes", "Childrens"],
          answer: "Children"
        },
        hard: {
          question: "What type of sentence is: 'Please close the door.'?",
          options: ["Declarative", "Interrogative", "Imperative", "Exclamatory"],
          answer: "Imperative"
        }
      }
    };

    const subjectQuizzes = fallbackQuizzes[subject] || fallbackQuizzes.math;
    const quiz = subjectQuizzes[difficulty] || subjectQuizzes.medium;

    return {
      subject,
      classLevel,
      difficulty,
      question: quiz.question,
      options: quiz.options,
      answer: quiz.answer,
      generatedAt: new Date().toISOString(),
      isFallback: true
    };
  }

  /**
   * Sleep utility for delays
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise} Promise that resolves after delay
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate multiple quiz questions in a single API call
   * @param {Object} preferences - User preferences
   * @param {number} questionCount - Number of questions to generate
   * @returns {Promise<Array>} Array of quiz questions
   */
  async generateMultipleQuestions(preferences, questionCount = 10) {
    try {
      const prompt = this.buildMultipleQuizPrompt(preferences, questionCount);
      const apiResponse = await this.callGeminiAPIWithRetry(prompt);
      const questions = this.parseMultipleQuizResponse(apiResponse, preferences, questionCount);
      
      return questions;
    } catch (error) {
      console.error("Failed to generate multiple questions:", error);
      
      // Return fallback questions if API fails
      const fallbackQuestions = [];
      for (let i = 0; i < questionCount; i++) {
        fallbackQuestions.push({
          ...this.getFallbackQuiz(preferences),
          isFallback: true,
          questionNumber: i + 1
        });
      }
      return fallbackQuestions;
    }
  }

  /**
   * NEW METHOD FOR SOCKETS: Generate a quiz and wrap it for the socket handler.
   * This ensures a consistent { success, questions, message } response.
   * @param {string} userId - The ID of the user (host) to generate the quiz for.
   * @returns {Promise<Object>} An object with success status, questions array, and a message.
   */
  async generateQuizForSocket(userId) {
    try {
      const User = require("../models/User"); // Local require to avoid circular deps
      const user = await User.findById(userId);
      if (!user) {
        return { success: false, message: "Host user not found." };
      }

      const preferences = this.extractUserPreferences(user);
      console.log(`Generating quiz for user ${user.name} with preferences:`, preferences);

      const questions = await this.generateMultipleQuestions(preferences, 10);

      if (!questions || questions.length === 0) {
        return { success: false, message: "The AI failed to generate questions." };
      }

      // Check if the questions are fallbacks
      const subject = questions[0]?.isFallback ? "General Knowledge (Fallback)" : preferences.subject;

      return {
        success: true,
        questions,
        subject,
        message: "Quiz generated successfully."
      };

    } catch (error) {
      console.error("Error in generateQuizForSocket:", error);
      return { success: false, message: "A server error occurred during quiz generation." };
    }
  }
}

module.exports = new QuizService();