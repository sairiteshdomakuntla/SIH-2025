const DailyQuestion = require('../models/DailyQuestion');
const DailySubmission = require('../models/DailySubmission');
const User = require('../models/User');

class DailyQuestionService {
  constructor() {
    // Use the same Gemini API configuration as quizService
    this.geminiApiKey = process.env.GEMINI_API_KEY;
    this.geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.geminiApiKey}`;
  }

  /**
   * Get today's date in YYYY-MM-DD format
   */
  getTodayDateString() {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  /**
   * Generate daily questions for all grades
   */
  async generateDailyQuestions() {
    const grades = ['5th Grade', '6th Grade', '7th Grade', '8th Grade', '9th Grade', '10th Grade', '11th Grade', '12th Grade'];
    const subjects = ['math', 'science', 'english', 'history', 'geography'];
    const difficulties = ['easy', 'medium', 'hard'];
    const today = this.getTodayDateString();

    console.log(`Generating daily questions for ${today}`);

    for (const grade of grades) {
      try {
        // Check if question already exists for today and this specific grade
        const existingQuestion = await DailyQuestion.findOne({
          date: today,
          grade: grade
        });

        if (existingQuestion) {
          console.log(`Question already exists for ${grade} on ${today}`);
          continue;
        }

        // Random subject and difficulty
        const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];
        const randomDifficulty = difficulties[Math.floor(Math.random() * difficulties.length)];

        const question = await this.generateQuestionForGrade(grade, randomSubject, randomDifficulty);
        
        if (question) {
          try {
            // Use findOneAndUpdate with upsert to handle potential race conditions
            await DailyQuestion.findOneAndUpdate(
              { date: today, grade: grade },
              {
                date: today,
                grade: grade,
                ...question
              },
              { 
                upsert: true, 
                new: true,
                setDefaultsOnInsert: true
              }
            );
            console.log(`Generated daily question for ${grade} - ${randomSubject} (${randomDifficulty})`);
          } catch (dbError) {
            // Handle duplicate key error gracefully
            if (dbError.code === 11000) {
              console.log(`Question already exists for ${grade} on ${today} (race condition handled)`);
            } else {
              throw dbError;
            }
          }
        }

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`Error generating question for ${grade}:`, error);
        // Continue with other grades even if one fails
      }
    }
  }

  /**
   * Generate a single question for a specific grade using same API as quiz service
   */
  async generateQuestionForGrade(grade, subject, difficulty) {
    try {
      const prompt = `Generate a single ${difficulty} level ${subject} question suitable for ${grade} students.

Requirements:
- One clear, educational question
- Exactly 4 multiple choice options (A, B, C, D)
- One correct answer
- Include a brief explanation
- Make it challenging but appropriate for the grade level
- Focus on core concepts for daily practice

Format your response as JSON:
{
  "question": "Your question here",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "answer": "Correct option text (must match one of the options exactly)",
  "subject": "${subject}",
  "difficulty": "${difficulty}",
  "explanation": "Brief explanation of why this answer is correct"
}`;

      // Use the same API call method as quiz service
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
      
      // Parse response similar to quiz service
      const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!responseText) {
        throw new Error("No response text from Gemini API");
      }

      // Clean and parse JSON with improved error handling
      let cleanedText = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      // Try to fix common JSON issues
      try {
        // First attempt - parse as is
        const parsedQuestion = JSON.parse(cleanedText);
        
        // Validate the question structure
        if (this.validateQuestionStructure(parsedQuestion)) {
          return parsedQuestion;
        } else {
          throw new Error('Invalid question structure');
        }
      } catch (parseError) {
        console.log('First JSON parse attempt failed, trying to fix common issues...');
        
        try {
          // Try to fix common JSON formatting issues
          cleanedText = this.fixJsonFormatting(cleanedText);
          const parsedQuestion = JSON.parse(cleanedText);
          
          if (this.validateQuestionStructure(parsedQuestion)) {
            return parsedQuestion;
          } else {
            throw new Error('Invalid question structure after JSON fix');
          }
        } catch (secondParseError) {
          console.error('JSON parsing failed completely:', secondParseError.message);
          console.error('Response text:', responseText.substring(0, 500));
          throw new Error(`Failed to parse AI response as JSON: ${secondParseError.message}`);
        }
      }

    } catch (error) {
      console.error('Error generating question:', error);
      return this.getFallbackQuestion(grade, subject, difficulty);
    }
  }

  /**
   * Get today's daily question for a user
   */
  async getTodayQuestion(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const today = this.getTodayDateString();

      const dailyQuestion = await DailyQuestion.findOne({
        date: today,
        grade: user.grade
      });

      if (!dailyQuestion) {
        // Try to generate question for today if it doesn't exist
        await this.generateDailyQuestions();
        
        // Try again
        const newQuestion = await DailyQuestion.findOne({
          date: today,
          grade: user.grade
        });
        
        if (!newQuestion) {
          return null;
        }
        
        return await this.checkUserSubmission(userId, newQuestion, today);
      }

      return await this.checkUserSubmission(userId, dailyQuestion, today);

    } catch (error) {
      console.error('Error getting today question:', error);
      throw error;
    }
  }

  /**
   * Check if user has submitted and return appropriate data
   */
  async checkUserSubmission(userId, question, today) {
    const submission = await DailySubmission.findOne({
      userId: userId,
      date: today
    });

    return {
      question: {
        _id: question._id,
        question: question.question,
        options: question.options,
        subject: question.subject,
        difficulty: question.difficulty,
        date: question.date
      },
      hasSubmitted: !!submission,
      submission: submission ? {
        userAnswer: submission.userAnswer,
        isCorrect: submission.isCorrect,
        submittedAt: submission.submittedAt
      } : null
    };
  }

  /**
   * Submit daily question answer
   */
  async submitDailyAnswer(userId, questionId, userAnswer) {
    try {
      const today = this.getTodayDateString();

      // Check if already submitted today
      const existingSubmission = await DailySubmission.findOne({
        userId: userId,
        date: today
      });

      if (existingSubmission) {
        throw new Error('You have already submitted today\'s question');
      }

      const question = await DailyQuestion.findById(questionId);
      if (!question) {
        throw new Error('Question not found');
      }

      const isCorrect = userAnswer === question.answer;

      // Create submission
      const submission = await DailySubmission.create({
        userId: userId,
        questionId: questionId,
        userAnswer: userAnswer,
        isCorrect: isCorrect,
        date: today
      });

      // Update user streak
      await this.updateUserStreak(userId, isCorrect, today);

      return {
        submission,
        isCorrect,
        correctAnswer: question.answer,
        explanation: question.explanation
      };

    } catch (error) {
      console.error('Error submitting daily answer:', error);
      throw error;
    }
  }

  /**
   * Update user streak based on submission
   */
  async updateUserStreak(userId, isCorrect, today) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      if (isCorrect) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayString = yesterday.toISOString().split('T')[0];

        // Check if user maintained streak (submitted yesterday)
        if (user.lastDailySubmission === yesterdayString || user.currentStreak === 0) {
          user.currentStreak = (user.currentStreak || 0) + 1;
        } else {
          // Streak broken, start new
          user.currentStreak = 1;
        }

        // Update longest streak
        if (user.currentStreak > (user.longestStreak || 0)) {
          user.longestStreak = user.currentStreak;
        }

        // Award points
        user.points = (user.points || 0) + 10; // Base points for correct answer
        
        // Streak bonuses
        if (user.currentStreak >= 7) {
          user.points += 5; // Weekly streak bonus
        }
        if (user.currentStreak >= 30) {
          user.points += 10; // Monthly streak bonus
        }
      }

      user.lastDailySubmission = today;
      await user.save();

      return user;

    } catch (error) {
      console.error('Error updating user streak:', error);
      throw error;
    }
  }

  /**
   * Get user's streak statistics
   */
  async getUserStreakStats(userId) {
    try {
      const user = await User.findById(userId);
      const today = this.getTodayDateString();

      // Get total daily submissions
      const totalSubmissions = await DailySubmission.countDocuments({
        userId: userId
      });

      // Get correct submissions
      const correctSubmissions = await DailySubmission.countDocuments({
        userId: userId,
        isCorrect: true
      });

      // Check if submitted today
      const todaySubmission = await DailySubmission.findOne({
        userId: userId,
        date: today
      });

      return {
        currentStreak: user.currentStreak || 0,
        longestStreak: user.longestStreak || 0,
        totalSubmissions,
        correctSubmissions,
        accuracy: totalSubmissions > 0 ? Math.round((correctSubmissions / totalSubmissions) * 100) : 0,
        submittedToday: !!todaySubmission,
        lastSubmission: user.lastDailySubmission
      };

    } catch (error) {
      console.error('Error getting streak stats:', error);
      throw error;
    }
  }

  /**
   * Validate question structure
   */
  validateQuestionStructure(question) {
    return question && 
           question.question && 
           question.options && 
           Array.isArray(question.options) &&
           question.options.length === 4 &&
           question.answer &&
           question.options.includes(question.answer) &&
           question.subject &&
           question.difficulty;
  }

  /**
   * Fix common JSON formatting issues
   */
  fixJsonFormatting(text) {
    // Remove any trailing commas before closing brackets/braces
    text = text.replace(/,(\s*[}\]])/g, '$1');
    
    // Fix quotes around property names
    text = text.replace(/(\w+):/g, '"$1":');
    
    // Fix single quotes to double quotes
    text = text.replace(/'/g, '"');
    
    // Remove any extra commas at the end of arrays
    text = text.replace(/,(\s*])/g, '$1');
    
    // Try to extract JSON from response if it's embedded in other text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      text = jsonMatch[0];
    }
    
    return text;
  }

  /**
   * Fallback question if AI generation fails
   */
  getFallbackQuestion(grade, subject, difficulty) {
    const fallbackQuestions = {
      math: {
        question: "What is 25 + 37?",
        options: ["62", "61", "63", "60"],
        answer: "62",
        explanation: "25 + 37 = 62. Adding these two numbers step by step: 25 + 30 = 55, then 55 + 7 = 62."
      },
      science: {
        question: "What gas do plants absorb from the air during photosynthesis?",
        options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Hydrogen"],
        answer: "Carbon Dioxide",
        explanation: "Plants absorb carbon dioxide (CO2) from the air and use it along with sunlight and water to make glucose during photosynthesis."
      },
      english: {
        question: "Which of the following is a noun?",
        options: ["Run", "Beautiful", "Cat", "Quickly"],
        answer: "Cat",
        explanation: "A noun is a word that names a person, place, thing, or idea. 'Cat' is a thing, so it's a noun."
      },
      history: {
        question: "Who was the first President of India?",
        options: ["Mahatma Gandhi", "Dr. Rajendra Prasad", "Jawaharlal Nehru", "Dr. A.P.J. Abdul Kalam"],
        answer: "Dr. Rajendra Prasad",
        explanation: "Dr. Rajendra Prasad was the first President of India, serving from 1950 to 1962."
      },
      geography: {
        question: "Which is the largest continent in the world?",
        options: ["Africa", "Asia", "North America", "Europe"],
        answer: "Asia",
        explanation: "Asia is the largest continent by both area and population, covering about 30% of Earth's land area."
      }
    };

    const fallback = fallbackQuestions[subject] || fallbackQuestions.math;
    return {
      ...fallback,
      subject,
      difficulty
    };
  }
}

module.exports = new DailyQuestionService();