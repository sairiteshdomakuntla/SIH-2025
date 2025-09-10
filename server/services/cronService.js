const cron = require('node-cron');
const DailyChallenge = require('../models/DailyChallenge');

class CronService {
  constructor() {
    this.geminiApiKey = process.env.GEMINI_API_KEY;
    this.geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.geminiApiKey}`;
    this.grades = ['5th', '6th', '7th', '8th', '9th', '10th'];
    this.subjects = ['math', 'science', 'english', 'hindi', 'socialStudies'];
  }

  // Start the cron job - runs every day at 12:00 AM
  startDailyChallengeGeneration() {
    console.log('🕛 Daily Challenge Cron Job initialized...');
    
    // Run at 12:00 AM every day
    cron.schedule('0 0 * * *', async () => {
      console.log('🚀 Generating daily challenges for all grades...');
      await this.generateDailyChallengesForAllGrades();
    });

    // Also run immediately if no challenge exists for today (for testing)
    this.checkAndGenerateTodaysChallenge();
  }

  async checkAndGenerateTodaysChallenge() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      const existingChallenge = await DailyChallenge.findOne({ date: today });
      
      if (!existingChallenge) {
        console.log('📚 No challenge found for today, generating...');
        await this.generateDailyChallengesForAllGrades();
      } else {
        console.log('✅ Daily challenge already exists for today');
      }
    } catch (error) {
      console.error('❌ Error checking today\'s challenge:', error);
    }
  }

  async generateDailyChallengesForAllGrades() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      // Check if already generated for today
      const existingChallenge = await DailyChallenge.findOne({ date: today });
      if (existingChallenge) {
        console.log('✅ Challenge already exists for today');
        return;
      }

      const challenges = {};
      
      // Generate one question for each grade
      for (const grade of this.grades) {
        console.log(`📖 Generating challenge for grade ${grade}...`);
        
        try {
          const challenge = await this.generateChallengeForGrade(grade);
          challenges[grade] = challenge;
          
          // Small delay between API calls to avoid rate limiting
          await this.sleep(1000);
          
        } catch (error) {
          console.error(`❌ Failed to generate challenge for grade ${grade}:`, error);
          // Use fallback for this grade
          challenges[grade] = this.getFallbackChallenge(grade);
        }
      }

      // Save all challenges for today
      const dailyChallenge = new DailyChallenge({
        date: today,
        challenges
      });

      await dailyChallenge.save();
      console.log('✅ Successfully generated daily challenges for all grades!');

    } catch (error) {
      console.error('❌ Error generating daily challenges:', error);
    }
  }

  async generateChallengeForGrade(grade) {
    const gradeNum = parseInt(grade.replace(/\D/g, ''));
    const randomSubject = this.subjects[Math.floor(Math.random() * this.subjects.length)];
    const difficulty = this.getDifficultyForGrade(gradeNum);

    const prompt = this.buildPromptForGrade(grade, randomSubject, difficulty);
    
    try {
      const apiResponse = await this.callGeminiAPI(prompt);
      const parsedResponse = this.parseGeminiResponse(apiResponse, {
        grade,
        subject: randomSubject,
        difficulty
      });

      return {
        ...parsedResponse,
        pointsValue: this.calculatePoints(difficulty)
      };

    } catch (error) {
      console.error(`API call failed for grade ${grade}:`, error);
      throw error;
    }
  }

  buildPromptForGrade(grade, subject, difficulty) {
    return `Generate one multiple-choice question for ${grade} grade students, subject=${subject}, difficulty=${difficulty}.

Requirements:
- Make it appropriate for rural/village students in India
- Use practical, real-world examples when possible
- Create exactly 4 options (A, B, C, D)
- Provide clear explanation
- Make it educational and engaging

Respond in strict JSON format:
{
  "question": "Your question here",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "answer": "Correct option text (must match one of the options exactly)",
  "explanation": "Brief explanation of the correct answer",
  "subject": "${subject}",
  "difficulty": "${difficulty}"
}

Make sure the answer exactly matches one of the options provided.`;
  }

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

    return await response.json();
  }

  parseGeminiResponse(apiResponse, metadata) {
    try {
      const responseText = apiResponse?.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!responseText) {
        throw new Error("No response text from Gemini API");
      }

      const cleanedText = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const questionData = JSON.parse(cleanedText);

      // Validate required fields
      const requiredFields = ['question', 'options', 'answer'];
      for (const field of requiredFields) {
        if (!questionData[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Validate options array
      if (!Array.isArray(questionData.options) || questionData.options.length !== 4) {
        throw new Error("Options must be an array of exactly 4 items");
      }

      // Validate that answer is one of the options
      if (!questionData.options.includes(questionData.answer)) {
        throw new Error("Answer must be one of the provided options");
      }

      return {
        question: questionData.question,
        options: questionData.options,
        answer: questionData.answer,
        explanation: questionData.explanation || "Correct answer explanation.",
        subject: questionData.subject || metadata.subject,
        difficulty: questionData.difficulty || metadata.difficulty
      };

    } catch (error) {
      console.error("Failed to parse Gemini response:", error);
      throw error;
    }
  }

  getDifficultyForGrade(gradeNum) {
    if (gradeNum <= 6) return 'easy';
    if (gradeNum <= 8) return 'medium';
    return 'hard';
  }

  calculatePoints(difficulty) {
    switch (difficulty) {
      case 'easy': return 15;
      case 'medium': return 25;
      case 'hard': return 35;
      default: return 20;
    }
  }

  getFallbackChallenge(grade) {
    const gradeNum = parseInt(grade.replace(/\D/g, ''));
    
    const fallbacks = {
      5: {
        question: "A farmer has 12 chickens. If he buys 8 more chickens, how many chickens does he have in total?",
        options: ["18", "20", "22", "24"],
        answer: "20",
        explanation: "12 + 8 = 20 chickens in total",
        subject: "math",
        difficulty: "easy"
      },
      6: {
        question: "If one notebook costs ₹15, how much will 4 notebooks cost?",
        options: ["₹45", "₹50", "₹60", "₹65"],
        answer: "₹60",
        explanation: "15 × 4 = 60 rupees",
        subject: "math",
        difficulty: "easy"
      },
      7: {
        question: "What is the area of a rectangular field that is 25 meters long and 20 meters wide?",
        options: ["400 sq m", "450 sq m", "500 sq m", "550 sq m"],
        answer: "500 sq m",
        explanation: "Area = length × width = 25 × 20 = 500 square meters",
        subject: "math",
        difficulty: "medium"
      },
      8: {
        question: "If the population of a village increases from 1000 to 1200, what is the percentage increase?",
        options: ["15%", "20%", "25%", "30%"],
        answer: "20%",
        explanation: "Increase = (200/1000) × 100 = 20%",
        subject: "math",
        difficulty: "medium"
      },
      9: {
        question: "A shopkeeper buys 50 kg of wheat at ₹30 per kg and sells it at ₹36 per kg. What is his total profit?",
        options: ["₹250", "₹300", "₹350", "₹400"],
        answer: "₹300",
        explanation: "Profit per kg = ₹36 - ₹30 = ₹6. Total profit = 50 × ₹6 = ₹300",
        subject: "math",
        difficulty: "hard"
      },
      10: {
        question: "If a loan of ₹10,000 is taken at 12% simple interest per annum for 2 years, what is the total interest?",
        options: ["₹2000", "₹2200", "₹2400", "₹2600"],
        answer: "₹2400",
        explanation: "Simple Interest = (Principal × Rate × Time) / 100 = (10000 × 12 × 2) / 100 = ₹2400",
        subject: "math",
        difficulty: "hard"
      }
    };

    const fallback = fallbacks[gradeNum] || fallbacks[10];
    return {
      ...fallback,
      pointsValue: this.calculatePoints(fallback.difficulty)
    };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new CronService();