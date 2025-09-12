import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { Brain, Sparkles, Trophy, BookOpen, Zap, Target, Clock, CheckCircle, XCircle, Users, Wifi, Car, Flag } from 'lucide-react';

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

  // Multiplayer room state
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [roomData, setRoomData] = useState(null);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const [opponentProgress, setOpponentProgress] = useState(null);
  const [multiplayerResults, setMultiplayerResults] = useState(null);

  const { user } = useAuth();
  const { socket } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_BACKEND_URL;

  // Single source of truth for multiplayer race progress
  const [players, setPlayers] = useState([]); // Array of { userId, username, progress }
  const [currentRoomCode, setCurrentRoomCode] = useState(null); // Store current room code
  const [opponentInfo, setOpponentInfo] = useState(null);

  // Define unique car emojis for each player
  const carEmojis = ['🚗', '🏎️', '🚙', '🚕', '🚐', '🚚', '🚛', '🏁'];

  // Helper function to get consistent car emoji for player
  const getPlayerCarEmoji = (playerId) => {
    // Create a simple hash from the playerId to ensure consistent car assignment
    let hash = 0;
    for (let i = 0; i < playerId.length; i++) {
      hash = ((hash << 5) - hash) + playerId.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }
    return carEmojis[Math.abs(hash) % carEmojis.length];
  };

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

  // Multiplayer initialization effect
  useEffect(() => {
    // Check if coming from a room
    if (location.state?.roomCode) {
      setIsMultiplayer(true);
      setRoomData(location.state);
      setQuizPreferences({
        subject: location.state.subject,
        difficulty: location.state.difficulty || 'medium'
      });
      
      // Join quiz room via socket
      if (socket) {
        socket.emit('join_quiz_room', { roomCode: location.state.roomCode });
      }
    }
  }, [location.state, socket]);

  // Socket event listeners for multiplayer
  useEffect(() => {
    if (!socket || !isMultiplayer) return;

    const handleQuizStarted = ({ roomCode, subject, startTime }) => {
      console.log('Quiz started for room:', roomCode);
      generateQuiz();
      
      // Initialize opponent progress if not already set
      if (roomData && !opponentInfo) {
        // We need to get opponent info from room data
        // This will be set when joining the room
      }
    };

    const handleQuizStarting = ({ message, countdown }) => {
      console.log('Quiz starting:', message);
      // You could add a countdown UI here if needed
    };

    const handlePlayerAnswered = ({ userId, questionIndex, playerName }) => {
      if (userId !== user._id) {
        setOpponentProgress(prev => ({
          ...prev,
          currentQuestion: questionIndex + 1,
          playerName
        }));
      }
    };

    const handlePlayerFinished = ({ userId, playerName, finishedAt }) => {
      if (userId !== user._id) {
        setOpponentProgress(prev => ({
          ...prev,
          finished: true,
          finishedAt,
          playerName
        }));
      }
      
      // Set progress to 100% for finished player
      const userIdString = String(userId); // Convert to string
      setPlayers(prev => {
        return prev.map(player => {
          if (player.userId === userIdString) {
            return {
              ...player,
              progress: 100
            };
          }
          return player;
        });
      });
    };

    const handleQuizCompleted = ({ winner, results, completedAt }) => {
      setMultiplayerResults({
        winner,
        results,
        completedAt
      });
      setShowResult(true);
      setQuizStarted(false);
    };

    const handleError = ({ message }) => {
      alert(message);
    };

    const handleQuizRoomJoined = ({ roomCode, room }) => {
      console.log('Quiz room joined:', { roomCode, room });
      setCurrentRoomCode(roomCode); // Store the room code
      
      if (room && room.players) {
        // Create unique players array - remove duplicates by userId
        const uniquePlayers = [];
        const seenUserIds = new Set();
        
        room.players.forEach(player => {
          const userIdString = String(player.userId); // Convert to string to handle ObjectId
          if (!seenUserIds.has(userIdString)) {
            seenUserIds.add(userIdString);
            uniquePlayers.push({
              userId: userIdString, // Ensure it's a string
              username: player.username || player.name,
              progress: player.progress || 0
            });
          }
        });
        
        console.log('Initialized unique players:', uniquePlayers);
        setPlayers(uniquePlayers);
      }
    };

    const handlePlayerConnected = ({ player }) => {
      console.log('Player connected:', player);
      
      // Add to players array if not exists - prevent duplicates
      setPlayers(prev => {
        const userIdString = String(player.userId); // Convert to string
        // Check if player already exists
        const exists = prev.find(p => p.userId === userIdString);
        if (exists) {
          console.log('Player already exists, skipping:', userIdString);
          return prev; // Don't add duplicate
        }
        
        const newPlayer = {
          userId: userIdString, // Ensure it's a string
          username: player.username || player.name,
          progress: 0
        };
        
        console.log('Adding new player:', newPlayer);
        return [...prev, newPlayer];
      });
    };

    const handleProgressUpdate = ({ userId, username, progress, answeredQuestions }) => {
      console.log('Progress update received:', { userId, username, progress, answeredQuestions });
      console.log('Current players before update:', players);
      
      const userIdString = String(userId); // Convert to string
      setPlayers(prev => {
        const updated = prev.map(player => {
          if (player.userId === userIdString) {
            console.log(`Updating player ${username} progress from ${player.progress}% to ${progress}%`);
            return {
              ...player,
              username: username || player.username,
              progress: Math.min(progress || 0, 100)
            };
          }
          return player;
        });
        console.log('Players after update:', updated);
        return updated;
      });
    };

    socket.on('quiz_room_joined', handleQuizRoomJoined);
    socket.on('player_connected', handlePlayerConnected);
    socket.on('progressUpdate', handleProgressUpdate);
    socket.on('quiz_starting', handleQuizStarting);
    socket.on('quiz_started', handleQuizStarted);
    socket.on('player_answered', handlePlayerAnswered);
    socket.on('player_finished', handlePlayerFinished);
    socket.on('quiz_completed', handleQuizCompleted);
    socket.on('error', handleError);

    return () => {
      socket.off('quiz_room_joined', handleQuizRoomJoined);
      socket.off('player_connected', handlePlayerConnected);
      socket.off('progressUpdate', handleProgressUpdate);
      socket.off('quiz_starting', handleQuizStarting);
      socket.off('quiz_started', handleQuizStarted);
      socket.off('player_answered', handlePlayerAnswered);
      socket.off('player_finished', handlePlayerFinished);
      socket.off('quiz_completed', handleQuizCompleted);
      socket.off('error', handleError);
    };
  }, [socket, isMultiplayer, user._id]);

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

    // Emit answer to multiplayer room
    if (isMultiplayer && socket && currentRoomCode) {
      const isCorrect = answer === quiz[currentQuestionIndex].answer;
      socket.emit('quiz_answer_submitted', {
        roomCode: currentRoomCode,
        questionIndex: currentQuestionIndex,
        answer,
        isCorrect
      });
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < quiz.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(userAnswers[currentQuestionIndex + 1] || '');
      
      // Update user's race progress
      if (isMultiplayer && socket && currentRoomCode) {
        const answeredQuestions = currentQuestionIndex + 2;
        const newProgress = (answeredQuestions / quiz.length) * 100;
        
        // Update local state
        const userIdString = String(user._id); // Convert to string
        setPlayers(prev => {
          return prev.map(player => {
            if (player.userId === userIdString) {
              return {
                ...player,
                progress: newProgress
              };
            }
            return player;
          });
        });
        
        // Emit progress update to other players
        console.log('Emitting progress update:', {
          roomCode: currentRoomCode,
          userId: userIdString,
          username: user.name,
          progress: newProgress,
          answeredQuestions: answeredQuestions,
          totalQuestions: quiz.length
        });
        
        socket.emit('quiz_progress_update', {
          roomCode: currentRoomCode,
          userId: userIdString, // Send as string
          username: user.name,
          progress: newProgress,
          answeredQuestions: answeredQuestions,
          totalQuestions: quiz.length
        });
      }
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

  const submitQuiz = (timeUp = false) => {
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

    const quizResults = {
      score,
      correctAnswers,
      totalQuestions: quiz.length,
      timeTaken,
      timeUp,
      results
    };

    if (isMultiplayer && socket && currentRoomCode) {
      // Set user's progress to 100% when finished
      setPlayers(prev => {
        return prev.map(player => {
          if (player.userId === user._id) {
            return {
              ...player,
              progress: 100
            };
          }
          return player;
        });
      });
      
      // Emit completion to multiplayer room
      socket.emit('player_finished_quiz', {
        roomCode: currentRoomCode,
        finalScore: correctAnswers,
        timeTaken,
        answers: userAnswers
      });
      
      // Show waiting message
      setWaitingForOpponent(true);
    } else {
      // Single player mode - show results immediately
      setFinalResults(quizResults);
      setShowResult(true);
    }
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

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-full shadow-lg">
            <Brain className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent mb-2">
          {isMultiplayer ? 'Multiplayer Quiz Battle' : 'AI Quiz Generator'}
        </h1>
        <p className="text-white/80 text-lg">
          {isMultiplayer 
            ? `Room: ${roomData?.roomCode} • ${roomData?.subject} • Real-time battle`
            : '10 questions • 10 minutes • Personalized AI quizzes'
          }
        </p>
        {isMultiplayer && (
          <div className="flex items-center justify-center mt-2 text-sm text-white/60">
            <Users className="w-4 h-4 mr-1" />
            <span>Multiplayer Mode</span>
            <Wifi className="w-4 h-4 ml-2" />
          </div>
        )}
      </div>

      {/* Waiting for opponent (multiplayer) */}
      {waitingForOpponent && !multiplayerResults && (
        <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 text-center mb-8">
          <div className="animate-pulse mb-4">
            <Clock className="w-12 h-12 text-white/60 mx-auto" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Waiting for opponent to finish...</h3>
          <p className="text-white/80 mb-4">You've completed the quiz! Calculating results...</p>
          {opponentProgress && (
            <div className="text-sm text-white/60">
              <p>{opponentProgress.playerName} {opponentProgress.finished ? 'has finished!' : `is on question ${opponentProgress.currentQuestion || 1}`}</p>
            </div>
          )}
        </div>
      )}

      {/* Multiplayer Results */}
      {multiplayerResults && (
        <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 text-center mb-8">
          <div className="mb-6">
            <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-2">Battle Results</h2>
            {multiplayerResults.winner?.result === "draw" ? (
              <p className="text-yellow-400 text-lg font-bold">🤝 It's a Draw!</p>
            ) : (
              <p className="text-green-400 text-lg">🏆 Winner: {multiplayerResults.winner?.name}</p>
            )}
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {multiplayerResults.results.map((player, index) => (
              <div 
                key={player.userId}
                className={`p-6 rounded-2xl border-2 ${
                  multiplayerResults.winner?.result === "draw"
                    ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-blue-400'
                    : player.isWinner 
                      ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-400' 
                      : 'bg-white/5 border-white/20'
                }`}
              >
                {player.isWinner && multiplayerResults.winner?.result !== "draw" && (
                  <div className="text-yellow-400 mb-2">
                    <Trophy className="w-6 h-6 mx-auto" />
                  </div>
                )}
                {multiplayerResults.winner?.result === "draw" && (
                  <div className="text-blue-400 mb-2">
                    🤝
                  </div>
                )}
                <h3 className="text-xl font-bold text-white mb-2">{player.name}</h3>
                <div className="space-y-2 text-sm">
                  <p className="text-white/80">Score: <span className="font-bold text-white">{player.score}/10</span></p>
                  <p className="text-white/80">Correct: <span className="font-bold text-white">{player.correctAnswers}/10</span></p>
                  <p className="text-white/80">Time: <span className="font-bold text-white">{formatTime(player.timeTaken)}</span></p>
                  {player.finalScore && (
                    <p className="text-white/80">Final Score: <span className="font-bold text-yellow-300">{player.finalScore.toFixed(2)}</span></p>
                  )}
                </div>
                {player.isWinner && multiplayerResults.winner?.result !== "draw" && (
                  <div className="mt-2 text-yellow-400 font-bold">WINNER! 🎉</div>
                )}
                {multiplayerResults.winner?.result === "draw" && (
                  <div className="mt-2 text-blue-400 font-bold">DRAW! 🤝</div>
                )}
              </div>
            ))}
          </div>
          
          <button
            onClick={() => navigate('/community')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300"
          >
            Return to Community
          </button>
        </div>
      )}

      {/* Quiz Preference Form */}
      {!quiz && !showQuizForm && !isMultiplayer && (
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

      {/* Multiplayer Waiting Room */}
      {isMultiplayer && !quiz && !quizStarted && !multiplayerResults && (
        <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 text-center mb-8">
          <div className="mb-6">
            <Users className="w-16 h-16 text-white/60 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Quiz Room</h2>
            <p className="text-white/80">Waiting for all players to be ready...</p>
          </div>
          
          <div className="bg-white/5 rounded-2xl p-6 mb-6">
            <h3 className="text-lg font-bold text-white mb-4">Room Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-white/60">Room Code:</p>
                <p className="text-white font-bold">{roomData?.roomCode}</p>
              </div>
              <div>
                <p className="text-white/60">Subject:</p>
                <p className="text-white font-bold">{roomData?.subject}</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              if (socket && (currentRoomCode || roomData?.roomCode)) {
                socket.emit('player_ready', { roomCode: currentRoomCode || roomData.roomCode });
              }
            }}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span>Ready to Start!</span>
            </div>
          </button>
          
          <div className="mt-4">
            <button
              onClick={() => navigate('/community')}
              className="text-white/60 hover:text-white transition-colors duration-300"
            >
              Leave Room
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

          {/* Multiplayer Car Race Progress */}
          {isMultiplayer && players.length > 0 && (
            <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-600/50 rounded-xl p-6 mb-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-white font-semibold flex items-center">
                  <Car className="w-5 h-5 mr-2" />
                  🏁 Live Race Progress ({players.length} racers)
                </h3>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-400">LIVE</span>
                </div>
              </div>
              
              {/* Race Track Container */}
              <div className="space-y-6">
                {players
                  .filter(player => {
                    console.log('Player filter check:', player);
                    return player && player.userId && player.username && typeof player.userId === 'string';
                  })
                  .sort((a, b) => (b.progress || 0) - (a.progress || 0)) // Sort by progress, highest first
                  .map((player, index) => {
                    console.log('Rendering player key:', player.userId, 'Type:', typeof player.userId);
                    const userIdString = String(user._id);
                    const isCurrentUser = player.userId === userIdString;
                    const progress = Math.min(player.progress || 0, 100);
                    const isFinished = progress >= 100;
                    const carEmoji = getPlayerCarEmoji(player.userId);
                    const position = index + 1; // Current race position
                    
                    // Dynamic color based on position and whether it's current user
                    let playerColor, glowColor;
                    if (isCurrentUser) {
                      playerColor = '#3B82F6'; // Blue for current user
                      glowColor = 'rgba(59, 130, 246, 0.3)';
                    } else if (position === 1) {
                      playerColor = '#F59E0B'; // Gold for 1st place
                      glowColor = 'rgba(245, 158, 11, 0.3)';
                    } else if (position === 2) {
                      playerColor = '#6B7280'; // Silver for 2nd place
                      glowColor = 'rgba(107, 114, 128, 0.3)';
                    } else if (position === 3) {
                      playerColor = '#CD7F32'; // Bronze for 3rd place
                      glowColor = 'rgba(205, 127, 50, 0.3)';
                    } else {
                      playerColor = '#EF4444'; // Red for others
                      glowColor = 'rgba(239, 68, 68, 0.3)';
                    }
                    
                    return (
                      <div key={String(player.userId)} className="relative group">
                        {/* Position Badge and Player Info */}
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center space-x-3">
                            {/* Position Badge */}
                            <div className={`
                              w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                              ${position === 1 ? 'bg-yellow-500 text-yellow-900' : 
                                position === 2 ? 'bg-gray-400 text-gray-900' :
                                position === 3 ? 'bg-yellow-600 text-yellow-100' :
                                'bg-gray-600 text-white'}
                            `}>
                              {position}
                            </div>
                            
                            {/* Player Name */}
                            <span className={`text-sm font-medium flex items-center space-x-2 ${isCurrentUser ? 'text-blue-300' : 'text-white/80'}`}>
                              <span>{carEmoji}</span>
                              <span>{player.username} {isCurrentUser ? '(You)' : ''}</span>
                              {isFinished && <span className="text-yellow-400">🏆</span>}
                            </span>
                          </div>
                          
                          {/* Progress Percentage and Speed Indicator */}
                          <div className="flex items-center space-x-3">
                            <span className="text-xs text-white/60">
                              {Math.round(progress)}%
                            </span>
                            {/* Speed indicator based on recent progress */}
                            {!isFinished && progress > 0 && progress < 100 && (
                              <div className="flex space-x-1">
                                <div className="w-1 h-3 bg-blue-400 rounded animate-pulse"></div>
                                <div className="w-1 h-3 bg-blue-400 rounded animate-pulse" style={{animationDelay: '0.1s'}}></div>
                                <div className="w-1 h-3 bg-blue-400 rounded animate-pulse" style={{animationDelay: '0.2s'}}></div>
                              </div>
                            )}
                          </div>
                        </div>
                      
                        {/* Enhanced Race Track */}
                        <div className="relative h-12 bg-gray-700 rounded-full overflow-hidden shadow-inner">
                          {/* Track Surface with checkered pattern */}
                          <div className="absolute inset-0 opacity-10">
                            <div className="flex h-full">
                              {[...Array(20)].map((_, i) => (
                                <div key={i} className={`flex-1 h-full ${i % 2 === 0 ? 'bg-white' : 'bg-black'}`}></div>
                              ))}
                            </div>
                          </div>
                          
                          {/* Progress Bar with gradient */}
                          <div 
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-500 via-yellow-400 to-red-500 transition-all duration-700 ease-out"
                            style={{ 
                              width: `${progress}%`,
                              boxShadow: `0 0 20px ${glowColor}`
                            }}
                          ></div>
                          
                          {/* Track Markers */}
                          <div className="absolute inset-0">
                            {/* 25% marker */}
                            <div className="absolute left-1/4 top-0 w-px h-full bg-white/30"></div>
                            {/* 50% marker */}
                            <div className="absolute left-1/2 top-0 w-px h-full bg-white/30"></div>
                            {/* 75% marker */}
                            <div className="absolute left-3/4 top-0 w-px h-full bg-white/30"></div>
                          </div>
                          
                          {/* Finish Line */}
                          <div className="absolute right-0 top-0 w-3 h-full bg-gradient-to-b from-yellow-400 to-yellow-600 opacity-80">
                            <div className="absolute inset-0 bg-black/20" style={{
                              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, black 2px, black 4px)'
                            }}></div>
                          </div>
                          
                          {/* Car with enhanced animation */}
                          <div 
                            className="absolute top-1/2 transform -translate-y-1/2 transition-all duration-700 ease-out z-10"
                            style={{ 
                              left: `${Math.max(0, Math.min(progress, 100))}%`,
                              transform: `translateX(-50%) translateY(-50%) ${isFinished ? 'scale(1.3)' : 'scale(1)'}`
                            }}
                          >
                            <div 
                              className={`
                                w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold shadow-lg border-2 border-white/30
                                ${isFinished ? 'animate-bounce' : progress > 0 ? 'animate-pulse' : ''}
                              `}
                              style={{ 
                                backgroundColor: playerColor,
                                boxShadow: `0 0 15px ${glowColor}, 0 4px 8px rgba(0,0,0,0.3)`
                              }}
                            >
                              {carEmoji}
                            </div>
                            
                            {/* Exhaust effect when moving */}
                            {!isFinished && progress > 0 && progress < 100 && (
                              <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                                <div className="flex space-x-1">
                                  <div className="w-2 h-1 bg-gray-400 opacity-60 rounded animate-pulse"></div>
                                  <div className="w-1 h-1 bg-gray-300 opacity-40 rounded animate-pulse" style={{animationDelay: '0.1s'}}></div>
                                  <div className="w-1 h-1 bg-gray-200 opacity-20 rounded animate-pulse" style={{animationDelay: '0.2s'}}></div>
                                </div>
                              </div>
                            )}
                            
                            {/* Victory celebration effect */}
                            {isFinished && (
                              <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
                                <div className="text-yellow-400 text-3xl animate-bounce">🏆</div>
                                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 text-xs text-yellow-300 animate-pulse">
                                  WINNER!
                                </div>
                              </div>
                            )}
                            
                            {/* Current position indicator */}
                            {!isFinished && (
                              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                                <div className="text-xs text-white/60 bg-black/50 rounded px-2 py-1">
                                  #{position}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
              
              {/* Enhanced Race Status */}
              <div className="mt-6 text-center">
                {players.some(p => (p.progress || 0) >= 100) ? (
                  <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-lg p-3">
                    <div className="text-yellow-400 text-sm font-medium flex items-center justify-center space-x-2">
                      <span>🏁</span>
                      <span>{players.filter(p => (p.progress || 0) >= 100).length} racer(s) crossed the finish line!</span>
                      <span>🏁</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-blue-500/20 border border-blue-500/40 rounded-lg p-3">
                    <div className="text-blue-400 text-sm flex items-center justify-center space-x-2">
                      <span>�</span>
                      <span>Race in progress...</span>
                      <div className="flex space-x-1">
                        <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce"></div>
                        <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

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
    </div>
  );
};

export default QuizGenerator;