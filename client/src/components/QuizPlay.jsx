import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Clock, 
  Trophy, 
  Users, 
  CheckCircle, 
  XCircle, 
  ArrowLeft,
  ArrowRight,
  ArrowDown,
  Star,
  Zap,
  Target
} from 'lucide-react';
import AutoText from './AutoText';
import LoadingSpinner from './LoadingSpinner';
import { getRoom, completeRoom } from '../utils/roomApi';

const QuizPlay = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Quiz state
  const [quiz, setQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  // Fetch room data
  const fetchRoomData = async () => {
    try {
      const response = await getRoom(roomCode);
      if (response.success) {
        setRoom(response.room);
        
        // Navigate to result if room is completed
        if (response.room.status === 'completed') {
          navigate(`/result/${roomCode}`);
          return;
        }
        
        // Check if room is still active
        if (response.room.status !== 'active') {
          setError('Room is not active for quiz play');
          return;
        }
        
        // Generate quiz if not already generated
        if (!quiz && response.room.subject && response.room.difficulty) {
          await generateQuiz(response.room.subject, response.room.difficulty);
        }
      } else {
        setError(response.message || 'Failed to fetch room data');
      }
    } catch (err) {
      console.error('Error fetching room:', err);
      setError('Failed to load room data');
    } finally {
      setLoading(false);
    }
  };

  // Generate quiz based on room preferences
  const generateQuiz = async (subject, difficulty) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch(`${API_URL}/api/quiz/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subject: subject || 'general',
          difficulty: difficulty || 'medium'
        })
      });

      const data = await response.json();
      
      if (data.success && data.questions) {
        const questionsWithNumbers = data.questions.map((question, index) => ({
          ...question,
          questionNumber: index + 1
        }));
        
        setQuiz(questionsWithNumbers);
        setUserAnswers(new Array(questionsWithNumbers.length).fill(null));
        setQuizStarted(true);
      } else {
        setError('Failed to generate quiz questions');
      }
    } catch (err) {
      console.error('Error generating quiz:', err);
      setError('Failed to generate quiz');
    }
  };

  // Timer effect
  useEffect(() => {
    let timer;
    if (quizStarted && timeLeft > 0 && !quizCompleted) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            submitQuiz(true); // Time's up
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [quizStarted, timeLeft, quizCompleted]);

  // Initial fetch
  useEffect(() => {
    if (roomCode) {
      fetchRoomData();
    }
  }, [roomCode]);

  // Polling for room status changes
  useEffect(() => {
    if (!roomCode || quizCompleted) return;

    const interval = setInterval(() => {
      fetchRoomData();
    }, 5000); // Check every 5 seconds for room completion

    return () => clearInterval(interval);
  }, [roomCode, quizCompleted]);

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
    if (submitting || quizCompleted) return;
    
    setSubmitting(true);
    setQuizCompleted(true);
    
    try {
      // Calculate results
      let correctAnswers = 0;
      quiz.forEach((question, index) => {
        const userAnswer = userAnswers[index];
        if (userAnswer === question.answer) {
          correctAnswers++;
        }
      });

      const score = Math.round((correctAnswers / quiz.length) * 100);
      const timeTaken = 600 - timeLeft;

      // Submit to room API
      const response = await completeRoom(roomCode, { score, timeTaken });
      
      if (response.success) {
        // Check if room is completed (all players finished)
        if (response.room.status === 'completed') {
          navigate(`/result/${roomCode}`);
        } else {
          // Show waiting message for other players
          setRoom(response.room);
        }
      } else {
        setError(response.message || 'Failed to submit quiz results');
      }
    } catch (err) {
      console.error('Error submitting quiz:', err);
      setError('Failed to submit quiz results');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    if (!quiz) return 0;
    return ((currentQuestionIndex + 1) / quiz.length) * 100;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-red-500/20 border border-red-500/40 rounded-2xl p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            <AutoText>Quiz Error</AutoText>
          </h2>
          <p className="text-red-200 mb-6">{error}</p>
          <button
            onClick={() => navigate(`/room/${roomCode}`)}
            className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-xl transition-colors"
          >
            <AutoText>Back to Lobby</AutoText>
          </button>
        </div>
      </div>
    );
  }

  if (quizCompleted && room?.status !== 'completed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-green-500/20 border border-green-500/40 rounded-2xl p-8 max-w-md text-center">
          <Trophy className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">
            <AutoText>Quiz Completed!</AutoText>
          </h2>
          <p className="text-green-200 mb-6">
            <AutoText>Waiting for other players to finish...</AutoText>
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <Zap className="w-16 h-16 mx-auto mb-4 text-purple-400" />
          <h2 className="text-2xl font-bold mb-2">
            <AutoText>Preparing Quiz...</AutoText>
          </h2>
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  const currentQuestion = quiz[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          >
            <Star className="w-2 h-2 text-purple-400 opacity-60" />
          </div>
        ))}
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(`/room/${roomCode}`)}
            className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <AutoText>Back to Lobby</AutoText>
          </button>
          
          <div className="text-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              <AutoText>Quiz Battle</AutoText>
            </h1>
            <p className="text-gray-300 text-sm">Room: {roomCode}</p>
          </div>
          
          <div className="text-right">
            <div className="flex items-center space-x-2 text-white">
              <Clock className="w-5 h-5 text-blue-400" />
              <span className={`font-mono text-lg ${timeLeft < 60 ? 'text-red-400' : 'text-blue-400'}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-gray-800/50 rounded-full h-3 mb-6 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-purple-500 to-blue-500 h-full transition-all duration-300"
            style={{ width: `${getProgressPercentage()}%` }}
          ></div>
        </div>

        {/* Question Card */}
        <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-gray-600/50 rounded-2xl p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-600/20 rounded-xl p-3">
                <Target className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Question</p>
                <p className="text-xl font-bold text-white">
                  {currentQuestionIndex + 1} of {quiz.length}
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-sm text-gray-400">Subject</p>
              <p className="text-lg font-semibold text-purple-300">
                {room?.subject || 'General'}
              </p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-8 leading-relaxed">
            <AutoText>{currentQuestion.question}</AutoText>
          </h2>

          {/* Options */}
          <div className="space-y-4 mb-8">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => selectAnswer(option)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all transform hover:scale-105 ${
                  selectedAnswer === option
                    ? 'bg-purple-600/30 border-purple-400 text-white'
                    : 'bg-gray-700/50 border-gray-600/40 text-gray-300 hover:bg-gray-600/50 hover:border-gray-500/60'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    selectedAnswer === option
                      ? 'bg-purple-600 border-purple-400'
                      : 'border-gray-500'
                  }`}>
                    {selectedAnswer === option && (
                      <CheckCircle className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <span className="text-lg">{option}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={prevQuestion}
              disabled={currentQuestionIndex === 0}
              className="flex items-center space-x-2 px-6 py-3 bg-gray-600/50 hover:bg-gray-500/50 disabled:bg-gray-700/30 disabled:cursor-not-allowed text-white rounded-xl transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <button
              onClick={nextQuestion}
              disabled={!selectedAnswer}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-xl transition-all transform hover:scale-105 disabled:scale-100"
            >
              <span>
                {currentQuestionIndex === quiz.length - 1 ? 'Submit Quiz' : 'Next'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Players Status */}
        {room && (
          <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-gray-600/50 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-400" />
              <AutoText>Players</AutoText>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {room.players.map((player) => (
                <div
                  key={player.userId}
                  className="flex items-center justify-between p-3 bg-gray-700/50 rounded-xl"
                >
                  <span className="text-white font-medium">{player.username}</span>
                  <div className="flex items-center space-x-2">
                    {player.score > 0 ? (
                      <div className="flex items-center space-x-1 text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">Finished</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1 text-yellow-400">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">Playing</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizPlay;