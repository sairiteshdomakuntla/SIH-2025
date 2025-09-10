import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, Clock, Trophy, CheckCircle, XCircle, Target, Flame } from 'lucide-react';

const DailyChallenge = () => {
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [timeSpent, setTimeSpent] = useState(0);

  const { user } = useAuth();
  const API_URL = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    loadTodaysChallenge();
  }, []);

  useEffect(() => {
    let timer;
    if (challenge && !challenge.alreadyAttempted && !submitted) {
      timer = setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [challenge, submitted]);

  const loadTodaysChallenge = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/daily-challenge/today`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setChallenge(data.challenge);
        
        if (data.alreadyAttempted) {
          setSubmitted(true);
          setResult(data.submissionResult);
          setSelectedAnswer(data.submissionResult.userAnswer);
        }
      } else {
        console.error('Failed to load daily challenge:', data.message);
      }
    } catch (error) {
      console.error('Error loading daily challenge:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!selectedAnswer) {
      alert('Please select an answer before submitting!');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/daily-challenge/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          challengeId: challenge.challengeId,
          userAnswer: selectedAnswer,
          timeSpent: timeSpent
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setSubmitted(true);
        setResult({
          isCorrect: data.isCorrect,
          userAnswer: data.userAnswer,
          pointsEarned: data.pointsEarned,
          timeSpent: timeSpent
        });
        
        // Update the challenge to include the correct answer for review
        setChallenge(prev => ({
          ...prev,
          answer: data.correctAnswer,
          explanation: data.explanation
        }));
      } else {
        alert('Failed to submit answer: ' + data.message);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      alert('Error submitting answer. Please try again.');
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 rounded-3xl p-8 text-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-4"></div>
            <p className="text-xl">Loading today's challenge...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-gradient-to-br from-red-600 via-orange-600 to-yellow-600 rounded-3xl p-8 text-white text-center">
          <Calendar className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-4">No Challenge Available</h1>
          <p className="text-xl">Today's challenge is not ready yet. Check back later!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="bg-gradient-to-r from-orange-600 to-red-600 p-4 rounded-full shadow-lg">
            <Calendar className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-orange-200 bg-clip-text text-transparent mb-2">
          Daily Challenge
        </h1>
        <p className="text-white/80 text-lg">
          {submitted ? 'Challenge Complete - Review Your Answer' : 'Test your knowledge with today\'s question!'}
        </p>
      </div>

      {/* Challenge Card */}
      <div className="backdrop-blur-xl bg-black/40 border border-orange-500/30 rounded-3xl p-8 shadow-2xl">
        {/* Challenge Info */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-4">
            <div className="bg-orange-500/20 border border-orange-500/40 rounded-full px-4 py-2">
              <span className="text-orange-200 text-sm font-medium">
                {challenge.subject?.charAt(0).toUpperCase() + challenge.subject?.slice(1) || 'General'}
              </span>
            </div>
            <div className="bg-blue-500/20 border border-blue-500/40 rounded-full px-4 py-2">
              <span className="text-blue-200 text-sm font-medium">
                {challenge.difficulty?.charAt(0).toUpperCase() + challenge.difficulty?.slice(1) || 'Medium'}
              </span>
            </div>
            <div className="bg-green-500/20 border border-green-500/40 rounded-full px-4 py-2">
              <span className="text-green-200 text-sm font-medium">
                {challenge.pointsValue || 20} Points
              </span>
            </div>
          </div>

          {!submitted && (
            <div className="flex items-center space-x-2 bg-purple-500/20 border border-purple-500/40 rounded-full px-4 py-2">
              <Clock className="w-4 h-4 text-purple-200" />
              <span className="text-purple-200 font-mono text-sm">{formatTime(timeSpent)}</span>
            </div>
          )}
        </div>

        {/* Question */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-full p-3">
              <Target className="w-6 h-6 text-yellow-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">
            {challenge.question}
          </h2>
        </div>

        {/* Options */}
        <div className="space-y-4 mb-8">
          {challenge.options?.map((option, index) => (
            <button
              key={index}
              onClick={() => !submitted && setSelectedAnswer(option)}
              disabled={submitted}
              className={`w-full p-4 rounded-xl border-2 font-medium text-left transition-all duration-300 ${
                submitted
                  ? option === challenge.answer
                    ? 'bg-green-600/30 border-green-400/80 text-green-200' // Correct answer
                    : option === selectedAnswer && option !== challenge.answer
                    ? 'bg-red-600/30 border-red-400/80 text-red-200' // Wrong user answer
                    : 'bg-gray-800/50 border-gray-600/50 text-gray-400' // Other options
                  : selectedAnswer === option
                    ? 'bg-orange-600/30 border-orange-400/80 text-orange-200 shadow-lg shadow-orange-500/20'
                    : 'bg-gray-800/50 border-gray-600/50 text-gray-300 hover:border-orange-500/50 hover:bg-gray-700/50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  submitted
                    ? option === challenge.answer
                      ? 'border-green-400 bg-green-500'
                      : option === selectedAnswer && option !== challenge.answer
                      ? 'border-red-400 bg-red-500'
                      : 'border-gray-500'
                    : selectedAnswer === option
                      ? 'border-orange-400 bg-orange-500'
                      : 'border-gray-500'
                }`}>
                  {submitted && option === challenge.answer && (
                    <CheckCircle className="w-4 h-4 text-white" />
                  )}
                  {submitted && option === selectedAnswer && option !== challenge.answer && (
                    <XCircle className="w-4 h-4 text-white" />
                  )}
                  {!submitted && selectedAnswer === option && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
                <span className="text-lg">{option}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Submit Button or Results */}
        {!submitted ? (
          <div className="text-center">
            <button
              onClick={submitAnswer}
              disabled={!selectedAnswer}
              className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              <div className="flex items-center space-x-2">
                <Trophy className="w-5 h-5" />
                <span>Submit Answer</span>
              </div>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Result Summary */}
            <div className={`rounded-xl p-6 border-2 ${
              result.isCorrect 
                ? 'bg-green-600/20 border-green-500/40' 
                : 'bg-red-600/20 border-red-500/40'
            }`}>
              <div className="flex items-center justify-center space-x-4 mb-4">
                {result.isCorrect ? (
                  <CheckCircle className="w-8 h-8 text-green-400" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-400" />
                )}
                <h3 className={`text-2xl font-bold ${
                  result.isCorrect ? 'text-green-400' : 'text-red-400'
                }`}>
                  {result.isCorrect ? 'Correct!' : 'Incorrect'}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="bg-black/20 rounded-lg p-3">
                  <div className="flex items-center justify-center space-x-2 mb-1">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    <span className="text-white/80 text-sm">Points Earned</span>
                  </div>
                  <p className="text-xl font-bold text-yellow-400">{result.pointsEarned}</p>
                </div>
                
                <div className="bg-black/20 rounded-lg p-3">
                  <div className="flex items-center justify-center space-x-2 mb-1">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span className="text-white/80 text-sm">Time Taken</span>
                  </div>
                  <p className="text-xl font-bold text-blue-400">{formatTime(result.timeSpent)}</p>
                </div>
                
                <div className="bg-black/20 rounded-lg p-3">
                  <div className="flex items-center justify-center space-x-2 mb-1">
                    <Flame className="w-4 h-4 text-orange-400" />
                    <span className="text-white/80 text-sm">Status</span>
                  </div>
                  <p className="text-xl font-bold text-orange-400">Complete</p>
                </div>
              </div>
            </div>

            {/* Answer Review */}
            <div className="bg-gray-800/50 border border-gray-600/50 rounded-xl p-6">
              <h4 className="text-lg font-bold text-white mb-4">Answer Review</h4>
              <div className="space-y-3">
                <div>
                  <span className="text-gray-400 text-sm">Your Answer:</span>
                  <p className={`font-medium ${
                    result.isCorrect ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {result.userAnswer}
                  </p>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Correct Answer:</span>
                  <p className="font-medium text-green-400">{challenge.answer}</p>
                </div>
                {challenge.explanation && (
                  <div>
                    <span className="text-gray-400 text-sm">Explanation:</span>
                    <p className="text-white/80">{challenge.explanation}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Come Back Tomorrow */}
            <div className="text-center bg-purple-500/20 border border-purple-500/40 rounded-xl p-6">
              <Calendar className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <h4 className="text-lg font-bold text-white mb-2">Challenge Complete!</h4>
              <p className="text-purple-200">Come back tomorrow for a new challenge!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyChallenge;