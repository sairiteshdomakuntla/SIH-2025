import React, { useState, useEffect } from 'react';
import { Calendar, Trophy, Target, Clock, CheckCircle, XCircle, Flame } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DailyQuestion = () => {
  const [dailyQuestion, setDailyQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [streakStats, setStreakStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const { user } = useAuth();
  const API_URL = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    fetchDailyQuestion();
    fetchStreakStats();
  }, []);

  const fetchDailyQuestion = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/daily-question/today`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setDailyQuestion(data.question);
        setHasSubmitted(data.hasSubmitted);
        if (data.submission) {
          setSubmissionResult({
            isCorrect: data.submission.isCorrect,
            userAnswer: data.submission.userAnswer,
            correctAnswer: data.submission.correctAnswer, // Make sure this is set
            explanation: data.submission.explanation
          });
          setSelectedAnswer(data.submission.userAnswer);
        }
      }
    } catch (error) {
      console.error('Error fetching daily question:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStreakStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/daily-question/streak`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setStreakStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching streak stats:', error);
    }
  };

  const submitAnswer = async () => {
    if (!selectedAnswer || !dailyQuestion) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/daily-question/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          questionId: dailyQuestion._id,
          answer: selectedAnswer
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setSubmissionResult({
          isCorrect: data.isCorrect,
          correctAnswer: data.correctAnswer,
          explanation: data.explanation,
          userAnswer: selectedAnswer
        });
        setHasSubmitted(true);
        // Refresh streak stats
        await fetchStreakStats();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      alert('Failed to submit answer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400 bg-green-500/20 border-green-500/40';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/40';
      case 'hard': return 'text-red-400 bg-red-500/20 border-red-500/40';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/40';
    }
  };

  const getSubjectIcon = (subject) => {
    const icons = {
      math: '🔢',
      science: '🔬',
      english: '📚',
      history: '📜',
      geography: '🌍'
    };
    return icons[subject] || '📖';
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="backdrop-blur-xl bg-black/40 border border-purple-500/30 rounded-3xl p-8 shadow-2xl">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-3/4 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2 mx-auto mb-8"></div>
            <div className="space-y-4">
              <div className="h-16 bg-gray-700 rounded"></div>
              <div className="h-12 bg-gray-700 rounded"></div>
              <div className="h-12 bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!dailyQuestion) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="backdrop-blur-xl bg-black/40 border border-purple-500/30 rounded-3xl p-8 shadow-2xl text-center">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">No Daily Question Available</h2>
          <p className="text-gray-400">Come back tomorrow for a new challenge!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header with Streak Stats */}
      <div className="text-center mb-8">
        <div className="flex justify-center items-center mb-4 space-x-4">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-full shadow-lg">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          {streakStats && (
            <div className="flex items-center space-x-2 bg-orange-500/20 border border-orange-500/40 rounded-full px-4 py-2">
              <Flame className="w-5 h-5 text-orange-400" />
              <span className="text-orange-200 font-bold">{streakStats.currentStreak} day streak</span>
            </div>
          )}
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent mb-2">
          Daily Challenge
        </h1>
        <p className="text-white/80 text-lg">
          Challenge yourself with today's question • Build your streak!
        </p>
      </div>

      {/* Streak Statistics */}
      {streakStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-orange-500/20 border border-orange-500/40 rounded-xl p-4 text-center">
            <Flame className="w-6 h-6 text-orange-400 mx-auto mb-2" />
            <p className="text-orange-200 text-sm">Current Streak</p>
            <p className="text-2xl font-bold text-orange-400">{streakStats.currentStreak}</p>
          </div>
          <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-xl p-4 text-center">
            <Trophy className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <p className="text-yellow-200 text-sm">Best Streak</p>
            <p className="text-2xl font-bold text-yellow-400">{streakStats.longestStreak}</p>
          </div>
          <div className="bg-blue-500/20 border border-blue-500/40 rounded-xl p-4 text-center">
            <Target className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <p className="text-blue-200 text-sm">Accuracy</p>
            <p className="text-2xl font-bold text-blue-400">{streakStats.accuracy}%</p>
          </div>
          <div className="bg-green-500/20 border border-green-500/40 rounded-xl p-4 text-center">
            <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <p className="text-green-200 text-sm">Completed</p>
            <p className="text-2xl font-bold text-green-400">{streakStats.totalSubmissions}</p>
          </div>
        </div>
      )}

      {/* Daily Question */}
      <div className="backdrop-blur-xl bg-black/40 border border-purple-500/30 rounded-3xl p-8 shadow-2xl">
        {/* Question Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-4">
            <div className="bg-purple-500/20 border border-purple-500/40 rounded-full px-4 py-2">
              <span className="text-purple-200 text-sm font-medium">
                {getSubjectIcon(dailyQuestion.subject)} {dailyQuestion.subject.charAt(0).toUpperCase() + dailyQuestion.subject.slice(1)}
              </span>
            </div>
            <div className={`rounded-full px-4 py-2 border ${getDifficultyColor(dailyQuestion.difficulty)}`}>
              <span className="text-sm font-medium capitalize">{dailyQuestion.difficulty}</span>
            </div>
          </div>
          <div className="bg-blue-500/20 border border-blue-500/40 rounded-full px-4 py-2">
            <span className="text-blue-200 text-sm font-medium">
              {new Date(dailyQuestion.date).toDateString()}
            </span>
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
            {dailyQuestion.question}
          </h2>
        </div>

        {/* Options */}
        <div className="space-y-4 mb-8">
          {dailyQuestion.options.map((option, index) => {
            const isSelected = selectedAnswer === option;
            const isCorrectAnswer = hasSubmitted && submissionResult && option === submissionResult.correctAnswer;
            const isUserWrongChoice = hasSubmitted && submissionResult && isSelected && !submissionResult.isCorrect;
            
            console.log(`Option: ${option}, isCorrectAnswer: ${isCorrectAnswer}, correctAnswer: ${submissionResult?.correctAnswer}`); // Debug log
            
            let buttonClass = "w-full p-4 rounded-xl border-2 text-left transition-all duration-300 ";
            
            if (hasSubmitted && submissionResult) {
              if (isCorrectAnswer) {
                buttonClass += "bg-green-500/30 border-green-400/80 text-green-200";
              } else if (isUserWrongChoice) {
                buttonClass += "bg-red-500/30 border-red-400/80 text-red-200";
              } else {
                buttonClass += "bg-gray-700/50 border-gray-600/50 text-gray-300";
              }
            } else {
              if (isSelected) {
                buttonClass += "bg-purple-600/30 border-purple-400/80 text-purple-200 shadow-lg shadow-purple-500/20";
              } else {
                buttonClass += "bg-gray-800/50 border-gray-600/50 text-gray-300 hover:border-purple-500/50 hover:bg-gray-700/50";
              }
            }

            return (
              <button
                key={index}
                onClick={() => !hasSubmitted && setSelectedAnswer(option)}
                disabled={hasSubmitted}
                className={buttonClass}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'border-purple-400 bg-purple-600/30' : 'border-gray-500'
                    }`}>
                      {isSelected && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <span className="text-lg">{option}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* Show icons and labels */}
                    {isCorrectAnswer && (
                      <>
                      
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      </>
                    )}
                    {isUserWrongChoice && (
                      <>
                        <XCircle className="w-5 h-5 text-red-400" />
                      </>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Submit Button or Result */}
        {!hasSubmitted ? (
          <div className="text-center">
            <button
              onClick={submitAnswer}
              disabled={!selectedAnswer || submitting}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              <div className="flex items-center space-x-2">
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Trophy className="w-5 h-5" />
                    <span>Submit Answer</span>
                  </>
                )}
              </div>
            </button>
          </div>
        ) : (
          <div className="text-center">
            <div className={`inline-flex items-center space-x-2 px-6 py-3 rounded-xl border ${
              submissionResult?.isCorrect 
                ? 'bg-green-500/20 border-green-500/40 text-green-200' 
                : 'bg-red-500/20 border-red-500/40 text-red-200'
            }`}>
              {submissionResult?.isCorrect ? (
                <CheckCircle className="w-6 h-6" />
              ) : (
                <XCircle className="w-6 h-6" />
              )}
              <span className="font-bold text-lg">
                {submissionResult?.isCorrect ? 'Correct!' : 'Incorrect'}
              </span>
            </div>
            
            {submissionResult?.explanation && (
              <div className="mt-4 p-4 bg-blue-500/20 border border-blue-500/40 rounded-xl">
                <p className="text-blue-200">
                  <strong>Explanation:</strong> {submissionResult.explanation}
                </p>
              </div>
            )}

            <p className="text-white/60 mt-4">
              Come back tomorrow for a new challenge!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyQuestion;