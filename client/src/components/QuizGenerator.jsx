import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { Brain, Sparkles, Trophy, BookOpen, Zap, Target, Clock, CheckCircle, XCircle, Users, Plus } from 'lucide-react';
import BadgeNotification from './BadgeNotification';
import CreateQuizRoomModal from './CreateQuizRoomModal';
import JoinQuizRoomModal from './JoinQuizRoomModal';
import MultiplayerQuizRoom from './MultiplayerQuizRoom';

const QuizGenerator = () => {
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [showQuizForm, setShowQuizForm] = useState(false);
  const [quizPreferences, setQuizPreferences] = useState({
    subject: '',
    difficulty: ''
    // Removed classLevel - it will be taken from user model
  });
  
  // Multi-question quiz state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes = 600 seconds
  const [quizStarted, setQuizStarted] = useState(false);
  const [finalResults, setFinalResults] = useState(null);
  const [newBadges, setNewBadges] = useState([]);

  // New multiplayer state
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [showJoinRoomModal, setShowJoinRoomModal] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [searchParams] = useSearchParams();

  const { user } = useAuth();
  const API_URL = import.meta.env.VITE_BACKEND_URL;

  const subjects = [
    { value: 'math', label: 'Mathematics', icon: '🔢' },
    { value: 'science', label: 'Science', icon: '🔬' },
    { value: 'english', label: 'English', icon: '📚' },
    { value: 'history', label: 'History', icon: '📜' },
    { value: 'geography', label: 'Geography', icon: '🌍' }
  ];

  const difficulties = [
    { value: 'easy', label: 'Easy', color: 'green' },
    { value: 'medium', label: 'Medium', color: 'yellow' },
    { value: 'hard', label: 'Hard', color: 'red' }
  ];

  // Timer effect
  useEffect(() => {
    let timer;
    if (quizStarted && timeLeft > 0 && !showResult) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Time's up - submit quiz
            submitQuiz(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [quizStarted, timeLeft, showResult]);

  useEffect(() => {
    // Check for room join parameter in URL
    const joinRoomId = searchParams.get('join');
    if (joinRoomId && !currentRoom) {
      setShowJoinRoomModal(true);
      // You can pre-fill the room ID here if needed
    }
  }, [searchParams]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const generateQuiz = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      let response;
      if (quizPreferences.subject && quizPreferences.difficulty) {
        // Send custom preferences (classLevel will be extracted from user model on backend)
        response = await fetch(`${API_URL}/api/quiz/generate-custom`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            subject: quizPreferences.subject,
            difficulty: quizPreferences.difficulty,
            questionCount: 10
          })
        });
      } else {
        response = await fetch(`${API_URL}/api/quiz/generate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }

      const data = await response.json();
      
      if (data.success && data.questions && data.questions.length > 0) {
        // Add question numbers to each question
        const questionsWithNumbers = data.questions.map((question, index) => ({
          ...question,
          questionNumber: index + 1
        }));

        setQuiz(questionsWithNumbers);
        setCurrentQuestionIndex(0);
        setSelectedAnswer('');
        setShowResult(false);
        setShowQuizForm(false);
        setUserAnswers(new Array(questionsWithNumbers.length).fill(null));
        setTimeLeft(600); // Reset timer to 10 minutes
        setQuizStarted(true);
        setFinalResults(null);
      } else {
        console.error('Failed to generate quiz:', data.message);
        alert('Failed to generate quiz. Please try again later.');
      }
    } catch (error) {
      console.error('Error generating quiz:', error);
      alert('Failed to generate quiz. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const selectAnswer = (answer) => {
    setSelectedAnswer(answer);
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = answer;
    setUserAnswers(newAnswers);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < quiz.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(userAnswers[currentQuestionIndex + 1] || '');
    } else {
      // Last question - submit quiz
      submitQuiz();
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setSelectedAnswer(userAnswers[currentQuestionIndex - 1] || '');
    }
  };

  const submitQuiz = async (timeUp = false) => {
    setQuizStarted(false);
    
    // Calculate results
    let correctAnswers = 0;
    const results = quiz.map((question, index) => {
      const userAnswer = userAnswers[index];
      const isCorrect = userAnswer === question.answer;
      if (isCorrect) correctAnswers++;
      
      return {
        question: question.question,
        correctAnswer: question.answer,
        userAnswer: userAnswer || 'Not answered',
        isCorrect,
        options: question.options
      };
    });

    const score = Math.round((correctAnswers / quiz.length) * 100);
    const timeTaken = 600 - timeLeft;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/quiz/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          score,
          correctAnswers,
          totalQuestions: quiz.length,
          timeTaken,
          timeUp,
          results,
          subject: quiz[0]?.subject
        })
      });

      const data = await response.json();
      
      if (data.success && data.newBadges && data.newBadges.length > 0) {
        setNewBadges(data.newBadges);
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
    }

    setFinalResults({
      score,
      correctAnswers,
      totalQuestions: quiz.length,
      timeTaken,
      timeUp,
      results
    });
    
    setShowResult(true);
  };

  const resetQuiz = () => {
    setQuiz(null);
    setSelectedAnswer('');
    setShowResult(false);
    setShowQuizForm(false);
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setTimeLeft(600);
    setQuizStarted(false);
    setFinalResults(null);
    setQuizPreferences({
      subject: '',
      difficulty: ''
    });
  };

  const handlePreferenceChange = (key, value) => {
    setQuizPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreMessage = (score) => {
    if (score >= 90) return 'Outstanding! 🌟';
    if (score >= 80) return 'Excellent work! 🎉';
    if (score >= 70) return 'Great job! 👏';
    if (score >= 60) return 'Good effort! 👍';
    return 'Keep practicing! 💪';
  };

  // Extract class level from user's grade for display
  const getUserClassLevel = () => {
    if (!user?.grade) return 'Not set';
    const match = user.grade.match(/(\d+)/);
    return match ? `Class ${match[1]}` : user.grade;
  };

  const handleRoomCreated = (room) => {
    setCurrentRoom(room);
    setShowCreateRoomModal(false);
  };

  const handleRoomJoined = (room) => {
    setCurrentRoom(room);
    setShowJoinRoomModal(false);
  };

  const handleLeaveRoom = () => {
    setCurrentRoom(null);
    // Reset any quiz state if needed
    resetQuiz();
  };

  // If in a multiplayer room, show the multiplayer component
  if (currentRoom) {
    return (
      <MultiplayerQuizRoom
        room={currentRoom}
        onLeave={handleLeaveRoom}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Badge Notifications */}
      {newBadges.length > 0 && (
        <BadgeNotification 
          badges={newBadges} 
          onClose={() => setNewBadges([])}
        />
      )}

      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-full shadow-lg">
            <Brain className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent mb-2">
          AI Quiz Generator
        </h1>
        <p className="text-white/80 text-lg">
          10 questions • 10 minutes • Personalized AI quizzes
        </p>
      </div>

      {/* Multiplayer Options */}
      {!quiz && !showQuizForm && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Single Player Quiz */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Single Player</h2>
            <p className="text-gray-300 mb-6">Practice with AI-generated personalized quizzes</p>
            <button
              onClick={() => setShowQuizForm(true)}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2"
            >
              <BookOpen className="w-5 h-5" />
              <span>Start Solo Quiz</span>
            </button>
          </div>

          {/* Multiplayer Quiz */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Multiplayer</h2>
            <p className="text-gray-300 mb-6">Compete with friends in real-time quiz battles</p>
            <div className="space-y-3">
              <button
                onClick={() => setShowCreateRoomModal(true)}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Create Room</span>
              </button>
              <button
                onClick={() => setShowJoinRoomModal(true)}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <Users className="w-5 h-5" />
                <span>Join Room</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Profile Display */}
      {user && !quiz && !showQuizForm && (
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 mb-8">
          <h2 className="text-white font-semibold mb-4">Your Profile</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-gray-400 text-sm">Level</p>
              <p className="text-white font-bold text-lg">{user?.level || 1}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm">Class</p>
              <p className="text-white font-bold text-lg">{getUserClassLevel()}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm">XP</p>
              <p className="text-white font-bold text-lg">{user?.xp || 0}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="bg-blue-500/20 px-3 py-1 rounded-full text-sm text-blue-200">
              Grade: {user?.grade || 'Not set'}
            </span>
            <span className="bg-green-500/20 px-3 py-1 rounded-full text-sm text-green-200">
              Location: {user?.location || 'Not set'}
            </span>
            <span className="bg-yellow-500/20 px-3 py-1 rounded-full text-sm text-yellow-200">
              Interests: {user?.interests?.join(', ') || 'Math'}
            </span>
          </div>
        </div>
      )}

      {/* Quiz Preference Form */}
      {!quiz && !showQuizForm && (
        <div className="text-center mb-8">
          <div className="space-y-4 mb-6">
            <button
              onClick={() => setShowQuizForm(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl relative overflow-hidden group mr-4"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              <div className="relative flex items-center justify-center space-x-3">
                <BookOpen className="w-6 h-6" />
                <span>Choose Subject & Difficulty</span>
              </div>
            </button>
            
            <button
              onClick={generateQuiz}
              disabled={loading}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-lg hover:shadow-xl relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              <div className="relative flex items-center justify-center space-x-3">
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                    <span>Generating 10 Questions...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6" />
                    <span>Quick Quiz (Auto)</span>
                    <Zap className="w-6 h-6" />
                  </>
                )}
              </div>
            </button>
          </div>
          
          {/* User Info */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
            <p className="text-white/80 text-sm mb-2">
              Quiz will be generated based on your profile:
            </p>
            <div className="flex justify-center space-x-4 mt-2">
              <span className="bg-purple-500/20 px-3 py-1 rounded-full text-sm text-purple-200">
                {getUserClassLevel()}
              </span>
              <span className="bg-blue-500/20 px-3 py-1 rounded-full text-sm text-blue-200">
                Level: {user?.level || 1}
              </span>
              <span className="bg-green-500/20 px-3 py-1 rounded-full text-sm text-green-200">
                Location: {user?.location || 'Not set'}
              </span>
              <span className="bg-yellow-500/20 px-3 py-1 rounded-full text-sm text-yellow-200">
                Interests: {user?.interests?.join(', ') || 'Math'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Custom Quiz Form - Removed Class Level Selection */}
      {showQuizForm && !quiz && (
        <div className="backdrop-blur-xl bg-black/40 border border-purple-500/30 rounded-3xl p-8 shadow-2xl mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Customize Your Quiz</h2>
          
          {/* User Class Info */}
          <div className="bg-blue-500/20 border border-blue-500/40 rounded-xl p-4 mb-6">
            <div className="text-center">
              <p className="text-blue-200 text-sm mb-2">Quiz will be generated for:</p>
              <div className="flex justify-center space-x-4">
                <span className="bg-blue-600/30 px-4 py-2 rounded-full text-blue-200 font-medium">
                  {getUserClassLevel()}
                </span>
                <span className="bg-green-600/30 px-4 py-2 rounded-full text-green-200 font-medium">
                  {user?.location || 'Your location'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Subject Selection */}
          <div className="mb-6">
            <label className="block text-white/80 text-sm font-medium mb-3">Select Subject</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {subjects.map((subject) => (
                <button
                  key={subject.value}
                  onClick={() => handlePreferenceChange('subject', subject.value)}
                  className={`p-4 rounded-xl border-2 font-medium transition-all duration-300 ${
                    quizPreferences.subject === subject.value
                      ? 'bg-purple-600/30 border-purple-400/80 text-purple-200 shadow-lg shadow-purple-500/20'
                      : 'bg-gray-800/50 border-gray-600/50 text-gray-300 hover:border-purple-500/50 hover:bg-gray-700/50'
                  }`}
                >
                  <div className="text-2xl mb-2">{subject.icon}</div>
                  <div className="text-sm">{subject.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Selection */}
          <div className="mb-6">
            <label className="block text-white/80 text-sm font-medium mb-3">Select Difficulty</label>
            <div className="grid grid-cols-3 gap-3">
              {difficulties.map((difficulty) => (
                <button
                  key={difficulty.value}
                  onClick={() => handlePreferenceChange('difficulty', difficulty.value)}
                  className={`p-4 rounded-xl border-2 font-medium transition-all duration-300 ${
                    quizPreferences.difficulty === difficulty.value
                      ? `bg-${difficulty.color}-600/30 border-${difficulty.color}-400/80 text-${difficulty.color}-200 shadow-lg shadow-${difficulty.color}-500/20`
                      : 'bg-gray-800/50 border-gray-600/50 text-gray-300 hover:border-purple-500/50 hover:bg-gray-700/50'
                  }`}
                >
                  {difficulty.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={generateQuiz}
              disabled={loading || !quizPreferences.subject || !quizPreferences.difficulty}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              <div className="flex items-center space-x-2">
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Generating 10 Questions...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Generate Custom Quiz</span>
                  </>
                )}
              </div>
            </button>
            
            <button
              onClick={() => setShowQuizForm(false)}
              className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Quiz Display */}
      {quiz && !showResult && (
        <div className="backdrop-blur-xl bg-black/40 border border-purple-500/30 rounded-3xl p-8 shadow-2xl">
          {/* Quiz Header with Timer */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex space-x-4">
              <div className="bg-purple-500/20 border border-purple-500/40 rounded-full px-4 py-2">
                <span className="text-purple-200 text-sm font-medium">
                  {quiz[0].subject.charAt(0).toUpperCase() + quiz[0].subject.slice(1)}
                </span>
              </div>
              <div className="bg-blue-500/20 border border-blue-500/40 rounded-full px-4 py-2">
                <span className="text-blue-200 text-sm font-medium">
                  Question {currentQuestionIndex + 1}/{quiz.length}
                </span>
              </div>
              <div className="bg-green-500/20 border border-green-500/40 rounded-full px-4 py-2">
                <span className="text-green-200 text-sm font-medium">
                  {getUserClassLevel()}
                </span>
              </div>
            </div>
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-full border ${
              timeLeft <= 60 ? 'bg-red-500/20 border-red-500/40 text-red-200' : 'bg-green-500/20 border-green-500/40 text-green-200'
            }`}>
              <Clock className="w-4 h-4" />
              <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / quiz.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Question */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-full p-3">
                <Target className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">
              {quiz[currentQuestionIndex].question}
            </h2>
          </div>

          {/* Options */}
          <div className="space-y-4 mb-8">
            {quiz[currentQuestionIndex].options.map((option, index) => (
              <button
                key={index}
                onClick={() => selectAnswer(option)}
                className={`w-full p-4 rounded-xl border-2 font-medium text-left transition-all duration-300 ${
                  selectedAnswer === option
                    ? 'bg-purple-600/30 border-purple-400/80 text-purple-200 shadow-lg shadow-purple-500/20'
                    : 'bg-gray-800/50 border-gray-600/50 text-gray-300 hover:border-purple-500/50 hover:bg-gray-700/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    selectedAnswer === option
                      ? 'border-purple-400 bg-purple-500'
                      : 'border-gray-500'
                  }`}>
                    {selectedAnswer === option && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <span className="text-lg">{option}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <button
              onClick={prevQuestion}
              disabled={currentQuestionIndex === 0}
              className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300"
            >
              Previous
            </button>
            
            <div className="text-center">
              {currentQuestionIndex === quiz.length - 1 ? (
                <button
                  onClick={submitQuiz}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  <div className="flex items-center space-x-2">
                    <Trophy className="w-5 h-5" />
                    <span>Submit Quiz</span>
                  </div>
                </button>
              ) : (
                <button
                  onClick={nextQuestion}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Next Question
                </button>
              )}
            </div>
          </div>

          {/* Answer Status Grid */}
          <div className="mt-6 pt-6 border-t border-gray-600">
            <p className="text-white/80 text-sm mb-3">Question Status:</p>
            <div className="grid grid-cols-10 gap-2">
              {Array.from({ length: quiz.length }, (_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setCurrentQuestionIndex(i);
                    setSelectedAnswer(userAnswers[i] || '');
                  }}
                  className={`w-10 h-10 rounded-lg border-2 text-sm font-bold transition-all duration-300 ${
                    i === currentQuestionIndex
                      ? 'bg-purple-600/50 border-purple-400 text-white'
                      : userAnswers[i]
                      ? 'bg-green-600/30 border-green-400/80 text-green-200'
                      : 'bg-gray-700/50 border-gray-600 text-gray-400'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Final Results */}
      {showResult && finalResults && (
        <div className="backdrop-blur-xl bg-black/40 border border-purple-500/30 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className={`p-6 rounded-full ${
                finalResults.score >= 80 
                  ? 'bg-green-500/20 border border-green-500/40' 
                  : finalResults.score >= 60
                  ? 'bg-yellow-500/20 border border-yellow-500/40'
                  : 'bg-red-500/20 border border-red-500/40'
              }`}>
                <Trophy className={`w-16 h-16 ${
                  finalResults.score >= 80 ? 'text-green-400' : 
                  finalResults.score >= 60 ? 'text-yellow-400' : 'text-red-400'
                }`} />
              </div>
            </div>

            <h2 className="text-4xl font-bold text-white mb-2">Quiz Complete!</h2>
            <p className={`text-2xl font-bold mb-4 ${getScoreColor(finalResults.score)}`}>
              {finalResults.score}%
            </p>
            <p className="text-lg text-white/80 mb-6">
              {getScoreMessage(finalResults.score)}
            </p>

            {finalResults.timeUp && (
              <div className="bg-red-500/20 border border-red-500/40 rounded-xl p-4 mb-6">
                <p className="text-red-200">⏰ Time's up! Quiz submitted automatically.</p>
              </div>
            )}

            {/* Score Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-green-500/20 border border-green-500/40 rounded-xl p-4">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <span className="text-green-200 font-bold">Correct</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{finalResults.correctAnswers}/{finalResults.totalQuestions}</p>
              </div>
              
              <div className="bg-red-500/20 border border-red-500/40 rounded-xl p-4">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <XCircle className="w-6 h-6 text-red-400" />
                  <span className="text-red-200 font-bold">Incorrect</span>
                </div>
                <p className="text-2xl font-bold text-red-400">{finalResults.totalQuestions - finalResults.correctAnswers}/{finalResults.totalQuestions}</p>
              </div>
              
              <div className="bg-blue-500/20 border border-blue-500/40 rounded-xl p-4">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Clock className="w-6 h-6 text-blue-400" />
                  <span className="text-blue-200 font-bold">Time</span>
                </div>
                <p className="text-2xl font-bold text-blue-400">{formatTime(finalResults.timeTaken)}</p>
              </div>
            </div>
          </div>

          {/* Detailed Results */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-white mb-4">Question Review</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {finalResults.results.map((result, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-xl border-2 ${
                    result.isCorrect 
                      ? 'bg-green-600/20 border-green-500/40' 
                      : 'bg-red-600/20 border-red-500/40'
                  }`}
                >
                  <div className="flex items-start space-x-3 mb-2">
                    {result.isCorrect ? (
                      <CheckCircle className="w-6 h-6 text-green-400 mt-1" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-400 mt-1" />
                    )}
                    <div className="flex-1">
                      <p className="text-white font-medium mb-2">
                        <span className="text-gray-400">Q{index + 1}:</span> {result.question}
                      </p>
                      <div className="text-sm space-y-1">
                        <p className="text-green-400">
                          <span className="font-medium">Correct Answer:</span> {result.correctAnswer}
                        </p>
                        <p className={result.isCorrect ? 'text-green-400' : 'text-red-400'}>
                          <span className="font-medium">Your Answer:</span> {result.userAnswer}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setShowQuizForm(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg"
            >
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5" />
                <span>New Quiz</span>
              </div>
            </button>
            <button
              onClick={resetQuiz}
              className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300"
            >
              Back to Menu
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateQuizRoomModal
        isOpen={showCreateRoomModal}
        onClose={() => setShowCreateRoomModal(false)}
        onRoomCreated={handleRoomCreated}
      />

      <JoinQuizRoomModal
        isOpen={showJoinRoomModal}
        onClose={() => setShowJoinRoomModal(false)}
        onRoomJoined={handleRoomJoined}
        initialRoomId={searchParams.get('join') || ''}
      />
    </div>
  );
};

export default QuizGenerator;