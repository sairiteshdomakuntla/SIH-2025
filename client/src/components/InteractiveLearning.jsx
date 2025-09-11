import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Brain, BookOpen, Target, Clock, Play, Pause, RotateCcw, 
  Volume2, VolumeX, Lightbulb, Zap, Star, Trophy, 
  ChevronRight, ChevronLeft, Eye, EyeOff, Shuffle,
  ArrowLeft, Settings, BarChart3, Timer, Check, X,
  Sparkles, Gamepad2, Layers, Activity, Bookmark,
  Plus, Minus, Edit, Trash2, Link, Unlink, Save,
  Download, Upload, Palette, Type, Circle, Square
} from 'lucide-react';
import AutoText from './AutoText';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const InteractiveLearning = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Learning Tools State
  const [activeTab, setActiveTab] = useState('flashcards');
  const [flashcards, setFlashcards] = useState([]);
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  
  // Mind Map State
  const [mindMapNodes, setMindMapNodes] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [connections, setConnections] = useState([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingFrom, setConnectingFrom] = useState(null);
  const [editingNode, setEditingNode] = useState(null);
  const [mindMapScale, setMindMapScale] = useState(1);
  const [mindMapOffset, setMindMapOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNode, setDraggedNode] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [nodeColors] = useState([
    '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#F97316', '#06B6D4'
  ]);
  
  // Pomodoro Timer State
  const [timerMode, setTimerMode] = useState('work'); // 'work', 'break', 'longbreak'
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [cycles, setCycles] = useState(0);
  
  // Settings
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [studyStats, setStudyStats] = useState({
    totalStudyTime: 0,
    cardsReviewed: 0,
    accuracy: 0,
    streak: 0
  });

  const timerRef = useRef(null);
  const mindMapRef = useRef(null);

  // Sample flashcards data
  useEffect(() => {
    const sampleCards = [
      {
        id: 1,
        subject: 'Physics',
        question: 'What is Newton\'s Second Law of Motion?',
        answer: 'F = ma (Force equals mass times acceleration)',
        difficulty: 'easy',
        lastReviewed: null,
        correctCount: 0,
        totalAttempts: 0
      },
      {
        id: 2,
        subject: 'Chemistry',
        question: 'What is the chemical formula for water?',
        answer: 'H₂O (Two hydrogen atoms and one oxygen atom)',
        difficulty: 'easy',
        lastReviewed: null,
        correctCount: 0,
        totalAttempts: 0
      },
      {
        id: 3,
        subject: 'Mathematics',
        question: 'What is the quadratic formula?',
        answer: 'x = (-b ± √(b² - 4ac)) / 2a',
        difficulty: 'medium',
        lastReviewed: null,
        correctCount: 0,
        totalAttempts: 0
      },
      {
        id: 4,
        subject: 'Biology',
        question: 'What is photosynthesis?',
        answer: 'The process by which plants convert light energy into chemical energy (glucose) using CO₂ and H₂O',
        difficulty: 'medium',
        lastReviewed: null,
        correctCount: 0,
        totalAttempts: 0
      }
    ];
    setFlashcards(sampleCards);

    // Initialize with a sample mind map
    const sampleMindMap = [
      {
        id: 'central',
        text: 'Physics',
        x: 400,
        y: 300,
        color: '#8B5CF6',
        isCenter: true,
        size: 'large'
      },
      {
        id: 'mechanics',
        text: 'Mechanics',
        x: 200,
        y: 200,
        color: '#EC4899',
        size: 'medium'
      },
      {
        id: 'thermodynamics',
        text: 'Thermodynamics',
        x: 600,
        y: 200,
        color: '#10B981',
        size: 'medium'
      },
      {
        id: 'waves',
        text: 'Waves',
        x: 400,
        y: 100,
        color: '#F59E0B',
        size: 'medium'
      }
    ];
    
    const sampleConnections = [
      { from: 'central', to: 'mechanics' },
      { from: 'central', to: 'thermodynamics' },
      { from: 'central', to: 'waves' }
    ];

    setMindMapNodes(sampleMindMap);
    setConnections(sampleConnections);
  }, []);

  // Pomodoro Timer Effect
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    }
    
    return () => clearTimeout(timerRef.current);
  }, [isRunning, timeLeft]);

  const handleTimerComplete = () => {
    setIsRunning(false);
    
    if (soundEnabled) {
      // Play notification sound (you can add actual audio file)
      console.log('Timer complete!');
    }
    
    if (timerMode === 'work') {
      setCycles(cycles + 1);
      if ((cycles + 1) % 4 === 0) {
        setTimerMode('longbreak');
        setTimeLeft(15 * 60); // 15 minutes long break
      } else {
        setTimerMode('break');
        setTimeLeft(5 * 60); // 5 minutes break
      }
    } else {
      setTimerMode('work');
      setTimeLeft(25 * 60); // 25 minutes work
    }

    toast.success(timerMode === 'work' ? '🎉 Work session complete! Great job!' : '⏰ Break time over! Ready to focus?');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCardResponse = (isCorrect) => {
    const updatedCards = [...flashcards];
    const card = updatedCards[currentCard];
    
    card.totalAttempts += 1;
    if (isCorrect) {
      card.correctCount += 1;
    }
    card.lastReviewed = new Date();
    
    setFlashcards(updatedCards);
    
    // Update stats
    setStudyStats(prev => ({
      ...prev,
      cardsReviewed: prev.cardsReviewed + 1,
      accuracy: Math.round((prev.accuracy * (prev.cardsReviewed - 1) + (isCorrect ? 100 : 0)) / prev.cardsReviewed),
      streak: isCorrect ? prev.streak + 1 : 0
    }));
    
    if (isCorrect && studyStats.streak > 0 && studyStats.streak % 5 === 0) {
      toast.success(`🔥 ${studyStats.streak} streak! You're on fire!`);
    }
    
    if (autoAdvance) {
      setTimeout(() => nextCard(), 1500);
    }
  };

  const nextCard = () => {
    setCurrentCard((prev) => (prev + 1) % flashcards.length);
    setIsFlipped(false);
    setShowAnswer(false);
  };

  const prevCard = () => {
    setCurrentCard((prev) => (prev - 1 + flashcards.length) % flashcards.length);
    setIsFlipped(false);
    setShowAnswer(false);
  };

  const shuffleCards = () => {
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
    setFlashcards(shuffled);
    setCurrentCard(0);
    setIsFlipped(false);
    setShowAnswer(false);
  };

  // Mind Map Functions
  const generateNodeId = () => `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const addNode = useCallback((x, y, text = 'New Node') => {
    const newNode = {
      id: generateNodeId(),
      text,
      x: x || 400 + (Math.random() - 0.5) * 200,
      y: y || 300 + (Math.random() - 0.5) * 200,
      color: nodeColors[Math.floor(Math.random() * nodeColors.length)],
      size: 'medium'
    };
    
    setMindMapNodes(prev => [...prev, newNode]);
    toast.success('Node added! Double-click to edit.');
    return newNode.id;
  }, [nodeColors]);

  const updateNode = useCallback((nodeId, updates) => {
    setMindMapNodes(prev => 
      prev.map(node => 
        node.id === nodeId ? { ...node, ...updates } : node
      )
    );
  }, []);

  const deleteNode = useCallback((nodeId) => {
    if (mindMapNodes.find(n => n.id === nodeId)?.isCenter) {
      toast.error('Cannot delete the center node!');
      return;
    }
    
    setMindMapNodes(prev => prev.filter(node => node.id !== nodeId));
    setConnections(prev => prev.filter(conn => conn.from !== nodeId && conn.to !== nodeId));
    setSelectedNode(null);
    toast.success('Node deleted!');
  }, [mindMapNodes]);

  // Enhanced Mind Map Functions for better connection handling
  const createConnection = useCallback((fromId, toId) => {
    if (fromId === toId) {
      toast.error('Cannot connect a node to itself!');
      return;
    }
    
    const existingConnection = connections.find(
      conn => (conn.from === fromId && conn.to === toId) || (conn.from === toId && conn.to === fromId)
    );
    
    if (existingConnection) {
      toast.error('Connection already exists!');
      return;
    }
    
    setConnections(prev => [...prev, { from: fromId, to: toId, id: `conn_${Date.now()}` }]);
    toast.success('Connection created!');
  }, [connections]);

  const deleteConnection = useCallback((connectionId) => {
    setConnections(prev => prev.filter(conn => conn.id !== connectionId));
    toast.success('Connection deleted!');
  }, []);

  const handleNodeClick = useCallback((nodeId, event) => {
    event.stopPropagation();
    
    if (isConnecting) {
      if (connectingFrom) {
        if (connectingFrom !== nodeId) {
          createConnection(connectingFrom, nodeId);
        }
        setIsConnecting(false);
        setConnectingFrom(null);
      } else {
        setConnectingFrom(nodeId);
        toast('Now select the target node to connect to', {
          icon: '🎯',
        });
      }
    } else {
      setSelectedNode(nodeId);
    }
  }, [isConnecting, connectingFrom, createConnection]);

  // Enhanced connection visualization - Fixed to properly render connections
  const renderConnections = useCallback(() => {
    return connections.map((connection, index) => {
      const fromNode = mindMapNodes.find(n => n.id === connection.from);
      const toNode = mindMapNodes.find(n => n.id === connection.to);
      
      if (!fromNode || !toNode) return null;
      
      // Calculate connection points (edge of nodes instead of center)
      const dx = toNode.x - fromNode.x;
      const dy = toNode.y - fromNode.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance === 0) return null; // Avoid division by zero
      
      const fromRadius = fromNode.size === 'large' ? 60 : fromNode.size === 'medium' ? 45 : 30;
      const toRadius = toNode.size === 'large' ? 60 : toNode.size === 'medium' ? 45 : 30;
      
      const fromX = fromNode.x + (dx / distance) * fromRadius;
      const fromY = fromNode.y + (dy / distance) * fromRadius;
      const toX = toNode.x - (dx / distance) * toRadius;
      const toY = toNode.y - (dy / distance) * toRadius;
      
      return (
        <g key={connection.id || `${connection.from}-${connection.to}-${index}`}>
          {/* Connection line with better visibility */}
          <line
            x1={fromX}
            y1={fromY}
            x2={toX}
            y2={toY}
            stroke="#8B5CF6"
            strokeWidth="3"
            strokeDasharray="8,4"
            className="hover:stroke-purple-300 transition-colors duration-200"
            style={{ cursor: 'pointer' }}
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm('Delete this connection?')) {
                deleteConnection(connection.id || `${connection.from}-${connection.to}`);
              }
            }}
          />
          
          {/* Arrow head */}
          <polygon
            points={`${toX},${toY} ${toX - 10},${toY - 5} ${toX - 10},${toY + 5}`}
            fill="#8B5CF6"
            transform={`rotate(${Math.atan2(dy, dx) * 180 / Math.PI} ${toX} ${toY})`}
          />
          
          {/* Connection delete button */}
          <circle
            cx={(fromX + toX) / 2}
            cy={(fromY + toY) / 2}
            r="10"
            fill="rgba(239, 68, 68, 0.8)"
            className="opacity-0 hover:opacity-100 transition-opacity duration-200 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              deleteConnection(connection.id || `${connection.from}-${connection.to}`);
            }}
          />
          <text
            x={(fromX + toX) / 2}
            y={(fromY + toY) / 2 + 4}
            textAnchor="middle"
            fontSize="12"
            fill="white"
            className="pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-200 font-bold"
          >
            ×
          </text>
        </g>
      );
    });
  }, [connections, mindMapNodes, deleteConnection]);

  // Enhanced canvas interaction for connecting
  const handleCanvasClick = useCallback((event) => {
    if (isConnecting) {
      setIsConnecting(false);
      setConnectingFrom(null);
      toast('Connection mode cancelled', {
        icon: '❌',
      });
    }
    setSelectedNode(null);
  }, [isConnecting]);

  // Fixed handleCanvasDoubleClick to properly calculate coordinates
  const handleCanvasDoubleClick = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (mindMapRef.current) {
      const rect = mindMapRef.current.getBoundingClientRect();
      const x = (event.clientX - rect.left - mindMapOffset.x) / mindMapScale;
      const y = (event.clientY - rect.top - mindMapOffset.y) / mindMapScale;
      
      // Ensure coordinates are within canvas bounds
      const clampedX = Math.max(50, Math.min(750, x));
      const clampedY = Math.max(50, Math.min(550, y));
      
      addNode(clampedX, clampedY);
    }
  }, [mindMapScale, mindMapOffset, addNode]);

  const handleNodeDoubleClick = useCallback((nodeId) => {
    setEditingNode(nodeId);
  }, []);

  const handleNodeDragStart = useCallback((nodeId, event) => {
    setIsDragging(true);
    setDraggedNode(nodeId);
    
    const node = mindMapNodes.find(n => n.id === nodeId);
    const rect = event.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    });
  }, [mindMapNodes]);

  const handleMouseMove = useCallback((event) => {
    if (isDragging && draggedNode && mindMapRef.current) {
      const rect = mindMapRef.current.getBoundingClientRect();
      const x = (event.clientX - rect.left - dragOffset.x) / mindMapScale;
      const y = (event.clientY - rect.top - dragOffset.y) / mindMapScale;
      
      updateNode(draggedNode, { x, y });
    }
  }, [isDragging, draggedNode, dragOffset, mindMapScale, updateNode]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDraggedNode(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const saveMindMap = useCallback(() => {
    const mindMapData = {
      nodes: mindMapNodes,
      connections: connections,
      metadata: {
        created: new Date(),
        title: mindMapNodes.find(n => n.isCenter)?.text || 'Untitled Mind Map'
      }
    };
    
    localStorage.setItem('savedMindMap', JSON.stringify(mindMapData));
    toast.success('Mind map saved!');
  }, [mindMapNodes, connections]);

  const loadMindMap = useCallback(() => {
    try {
      const saved = localStorage.getItem('savedMindMap');
      if (saved) {
        const data = JSON.parse(saved);
        setMindMapNodes(data.nodes || []);
        setConnections(data.connections || []);
        toast.success('Mind map loaded!');
      } else {
        toast.error('No saved mind map found!');
      }
    } catch (error) {
      toast.error('Error loading mind map!');
    }
  }, []);

  const exportMindMap = useCallback(() => {
    const mindMapData = {
      nodes: mindMapNodes,
      connections: connections,
      metadata: {
        exported: new Date(),
        title: mindMapNodes.find(n => n.isCenter)?.text || 'Untitled Mind Map'
      }
    };
    
    const dataStr = JSON.stringify(mindMapData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `mindmap_${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    toast.success('Mind map exported!');
  }, [mindMapNodes, connections]);

  const clearMindMap = useCallback(() => {
    setMindMapNodes([{
      id: 'central',
      text: 'Main Topic',
      x: 400,
      y: 300,
      color: '#8B5CF6',
      isCenter: true,
      size: 'large'
    }]);
    setConnections([]);
    setSelectedNode(null);
    toast.success('Mind map cleared!');
  }, []);

  // FlashcardComponent definition
  const FlashcardComponent = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <AutoText 
          tag="h2"
          className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"
        >
          Interactive Flashcards
        </AutoText>
        <p className="text-white/70">Master concepts with spaced repetition</p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="backdrop-blur-xl bg-white/5 border border-purple-500/30 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">{studyStats.cardsReviewed}</div>
          <div className="text-xs text-white/60">Cards Reviewed</div>
        </div>
        <div className="backdrop-blur-xl bg-white/5 border border-green-500/30 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{studyStats.accuracy}%</div>
          <div className="text-xs text-white/60">Accuracy</div>
        </div>
        <div className="backdrop-blur-xl bg-white/5 border border-orange-500/30 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-orange-400">{studyStats.streak}</div>
          <div className="text-xs text-white/60">Current Streak</div>
        </div>
        <div className="backdrop-blur-xl bg-white/5 border border-cyan-500/30 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-cyan-400">{flashcards.length}</div>
          <div className="text-xs text-white/60">Total Cards</div>
        </div>
      </div>

      {/* Card Controls */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={shuffleCards}
          className="flex items-center space-x-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 rounded-xl px-4 py-2 text-purple-300 hover:text-purple-200 transition-all duration-200"
        >
          <Shuffle className="w-4 h-4" />
          <span>Shuffle</span>
        </button>
        <button
          onClick={() => setAutoAdvance(!autoAdvance)}
          className={`flex items-center space-x-2 border rounded-xl px-4 py-2 transition-all duration-200 ${
            autoAdvance 
              ? 'bg-green-600/20 border-green-500/40 text-green-300' 
              : 'bg-gray-600/20 border-gray-500/40 text-gray-300'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Auto Advance</span>
        </button>
      </div>

      {/* Flashcard */}
      {flashcards.length > 0 && (
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            {/* Card Counter */}
            <div className="text-center mb-4">
              <span className="text-white/60">
                {currentCard + 1} of {flashcards.length}
              </span>
            </div>

            {/* Card */}
            <div 
              className={`relative w-full h-80 cursor-pointer transition-transform duration-700 transform-style-preserve-3d ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
              onClick={() => setIsFlipped(!isFlipped)}
            >
              {/* Front of card */}
              <div className="absolute inset-0 backface-hidden backdrop-blur-xl bg-purple-600/20 border border-purple-500/30 rounded-2xl p-8 flex flex-col justify-center items-center text-center shadow-2xl">
                <div className="mb-4">
                  <span className="bg-purple-500/30 text-purple-200 px-3 py-1 rounded-full text-xs font-medium">
                    {flashcards[currentCard]?.subject}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">
                  {flashcards[currentCard]?.question}
                </h3>
                <p className="text-white/60 text-sm">Click to reveal answer</p>
              </div>

              {/* Back of card */}
              <div className="absolute inset-0 backface-hidden rotate-y-180 backdrop-blur-xl bg-green-600/20 border border-green-500/30 rounded-2xl p-8 flex flex-col justify-center items-center text-center shadow-2xl">
                <div className="mb-4">
                  <Lightbulb className="w-8 h-8 text-green-400 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-4">
                
                  {flashcards[currentCard]?.answer}
                </h3>
                <p className="text-white/60 text-sm">How did you do?</p>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center mt-6">
              <button
                onClick={prevCard}
                className="flex items-center space-x-2 bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/40 rounded-xl px-4 py-2 text-gray-300 hover:text-white transition-all duration-200"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              {/* Answer Buttons (show when flipped) */}
              {isFlipped && (
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleCardResponse(false)}
                    className="flex items-center space-x-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 rounded-xl px-4 py-2 text-red-300 hover:text-red-200 transition-all duration-200"
                  >
                    <X className="w-4 h-4" />
                    <span>Hard</span>
                  </button>
                  <button
                    onClick={() => handleCardResponse(true)}
                    className="flex items-center space-x-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500/40 rounded-xl px-4 py-2 text-green-300 hover:text-green-200 transition-all duration-200"
                  >
                    <Check className="w-4 h-4" />
                    <span>Easy</span>
                  </button>
                </div>
              )}

              <button
                onClick={nextCard}
                className="flex items-center space-x-2 bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/40 rounded-xl px-4 py-2 text-gray-300 hover:text-white transition-all duration-200"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // PomodoroComponent definition
  const PomodoroComponent = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <AutoText 
          tag="h2"
          className="text-3xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent"
        >
          Pomodoro Timer
        </AutoText>
        <p className="text-white/70">Stay focused with timed study sessions</p>
      </div>

      {/* Timer Display */}
      <div className="max-w-md mx-auto">
        <div className="backdrop-blur-xl bg-white/5 border border-purple-500/30 rounded-3xl p-8 text-center space-y-6">
          {/* Mode Indicator */}
          <div className="flex justify-center">
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${
              timerMode === 'work' 
                ? 'bg-red-500/30 text-red-200'
                : timerMode === 'break'
                ? 'bg-green-500/30 text-green-200'
                : 'bg-blue-500/30 text-blue-200'
            }`}>
              {timerMode === 'work' ? 'Work Time' : timerMode === 'break' ? 'Short Break' : 'Long Break'}
            </span>
          </div>

          {/* Timer */}
          <div className="relative">
            <div className="text-6xl font-mono font-bold text-white">
              {formatTime(timeLeft)}
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div 
                className="w-32 h-32 rounded-full border-4 border-purple-500/30"
                style={{
                  background: `conic-gradient(from 0deg, purple ${((timerMode === 'work' ? 25*60 : timerMode === 'break' ? 5*60 : 15*60) - timeLeft) / (timerMode === 'work' ? 25*60 : timerMode === 'break' ? 5*60 : 15*60) * 360}deg, transparent 0deg)`
                }}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`p-4 rounded-full transition-all duration-200 ${
                isRunning 
                  ? 'bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300'
                  : 'bg-green-600/20 hover:bg-green-600/30 border border-green-500/40 text-green-300'
              }`}
            >
              {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </button>
            
            <button
              onClick={() => {
                setIsRunning(false);
                setTimeLeft(timerMode === 'work' ? 25*60 : timerMode === 'break' ? 5*60 : 15*60);
              }}
              className="p-4 rounded-full bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/40 text-gray-300 hover:text-white transition-all duration-200"
            >
              <RotateCcw className="w-6 h-6" />
            </button>
            
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-4 rounded-full border transition-all duration-200 ${
                soundEnabled 
                  ? 'bg-purple-600/20 border-purple-500/40 text-purple-300'
                  : 'bg-gray-600/20 border-gray-500/40 text-gray-300'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-purple-400">{cycles}</div>
              <div className="text-xs text-white/60">Cycles Complete</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-cyan-400">{Math.floor(studyStats.totalStudyTime / 60)}</div>
              <div className="text-xs text-white/60">Minutes Studied</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Updated MindMapComponent with better connection UI and fixed Add Node
  const MindMapComponent = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <AutoText 
          tag="h2"
          className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent"
        >
          Interactive Mind Map
        </AutoText>
        <p className="text-white/70">Visualize and connect your ideas</p>
      </div>

      {/* Enhanced Toolbar */}
      <div className="flex flex-wrap justify-center gap-3 mb-6">
        <button
          onClick={() => {
            // Fixed Add Node to work properly
            const centerX = 400;
            const centerY = 300;
            const randomX = centerX + (Math.random() - 0.5) * 300;
            const randomY = centerY + (Math.random() - 0.5) * 300;
            addNode(randomX, randomY);
          }}
          className="flex items-center space-x-2 bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 rounded-xl px-4 py-2 text-cyan-300 hover:text-cyan-200 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>Add Node</span>
        </button>
        
        <button
          onClick={() => {
            setIsConnecting(!isConnecting);
            setConnectingFrom(null);
            if (!isConnecting) {
              toast('Connection mode activated! Click two nodes to connect them.', {
                icon: '🔗',
              });
            }
          }}
          className={`flex items-center space-x-2 border rounded-xl px-4 py-2 transition-all duration-200 ${
            isConnecting 
              ? 'bg-green-600/20 border-green-500/40 text-green-300 ring-2 ring-green-500/50' 
              : 'bg-blue-600/20 border-blue-500/40 text-blue-300 hover:bg-blue-600/30'
          }`}
        >
          <Link className="w-4 h-4" />
          <span>{isConnecting ? 'Connecting Mode ON' : 'Connect Nodes'}</span>
        </button>

        {/* Connection info */}
        {isConnecting && (
          <div className="flex items-center space-x-2 bg-yellow-600/20 border border-yellow-500/40 rounded-xl px-4 py-2 text-yellow-300">
            <span className="animate-pulse">●</span>
            <span className="text-sm">
              {connectingFrom ? 'Select target node' : 'Select first node'}
            </span>
          </div>
        )}

        {selectedNode && !isConnecting && (
          <button
            onClick={() => deleteNode(selectedNode)}
            className="flex items-center space-x-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 rounded-xl px-4 py-2 text-red-300 hover:text-red-200 transition-all duration-200"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Node</span>
          </button>
        )}

        {connections.length > 0 && (
          <div className="flex items-center space-x-2 bg-purple-600/20 border border-purple-500/40 rounded-xl px-4 py-2 text-purple-300">
            <Link className="w-4 h-4" />
            <span className="text-sm">{connections.length} connections</span>
          </div>
        )}

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setMindMapScale(Math.max(0.5, mindMapScale - 0.1))}
            className="p-2 bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/40 rounded-lg text-gray-300 hover:text-white transition-all duration-200"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="text-white/70 text-sm min-w-[60px] text-center">
            {Math.round(mindMapScale * 100)}%
          </span>
          <button
            onClick={() => setMindMapScale(Math.min(2, mindMapScale + 0.1))}
            className="p-2 bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/40 rounded-lg text-gray-300 hover:text-white transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={saveMindMap}
          className="flex items-center space-x-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 rounded-xl px-4 py-2 text-purple-300 hover:text-purple-200 transition-all duration-200"
        >
          <Save className="w-4 h-4" />
          <span>Save</span>
        </button>

        <button
          onClick={loadMindMap}
          className="flex items-center space-x-2 bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/40 rounded-xl px-4 py-2 text-orange-300 hover:text-orange-200 transition-all duration-200"
        >
          <Upload className="w-4 h-4" />
          <span>Load</span>
        </button>

        <button
          onClick={exportMindMap}
          className="flex items-center space-x-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500/40 rounded-xl px-4 py-2 text-green-300 hover:text-green-200 transition-all duration-200"
        >
          <Download className="w-4 h-4" />
          <span>Export</span>
        </button>

        <button
          onClick={clearMindMap}
          className="flex items-center space-x-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 rounded-xl px-4 py-2 text-red-300 hover:text-red-200 transition-all duration-200"
        >
          <Trash2 className="w-4 h-4" />
          <span>Clear</span>
        </button>
      </div>

      {/* Enhanced Instructions */}
      <div className="text-center text-white/60 text-sm space-y-1">
        <p>🎯 Double-click canvas to add nodes • Double-click nodes to edit • Drag to move</p>
        <p>🔗 Click "Connect Nodes" then click two nodes to link them • Click connection lines to delete</p>
        {isConnecting && (
          <p className="text-yellow-400 font-medium animate-pulse">
            Connection mode active! {connectingFrom ? 'Select target node' : 'Select first node'}
          </p>
        )}
      </div>

      {/* Mind Map Canvas - Fixed to show connections properly */}
      <div className="relative">
        <div 
          ref={mindMapRef}
          className="backdrop-blur-xl bg-white/5 border border-cyan-500/30 rounded-2xl relative overflow-hidden"
          style={{ 
            height: '600px',
            cursor: isConnecting ? 'crosshair' : 'default'
          }}
          onDoubleClick={handleCanvasDoubleClick}
          onClick={handleCanvasClick}
        >
          {/* Fixed SVG for connections */}
          <svg 
            className="absolute inset-0 w-full h-full"
            style={{ 
              transform: `scale(${mindMapScale}) translate(${mindMapOffset.x}px, ${mindMapOffset.y}px)`,
              transformOrigin: '0 0',
              pointerEvents: 'none'
            }}
            viewBox="0 0 800 600"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Enhanced connection rendering with proper pointer events */}
            <g style={{ pointerEvents: 'all' }}>
              {renderConnections()}
            </g>
            
            {/* Temporary connection line while connecting */}
            {isConnecting && connectingFrom && (
              <line
                x1={mindMapNodes.find(n => n.id === connectingFrom)?.x || 0}
                y1={mindMapNodes.find(n => n.id === connectingFrom)?.y || 0}
                x2={400}
                y2={300}
                stroke="rgba(255, 255, 0, 0.8)"
                strokeWidth="3"
                strokeDasharray="5,5"
                className="animate-pulse"
              />
            )}
          </svg>

          {/* Enhanced node rendering */}
          <div 
            className="absolute inset-0"
            style={{ 
              transform: `scale(${mindMapScale}) translate(${mindMapOffset.x}px, ${mindMapOffset.y}px)`,
              transformOrigin: '0 0'
            }}
          >
            {mindMapNodes.map((node) => (
              <div
                key={node.id}
                className={`absolute cursor-pointer transition-all duration-200 transform ${
                  selectedNode === node.id ? 'scale-110 shadow-2xl' : 'hover:scale-105'
                } ${
                  node.isCenter ? 'z-20' : 'z-10'
                } ${
                  isConnecting ? 'hover:ring-4 hover:ring-yellow-400/50' : ''
                }`}
                style={{
                  left: node.x - (node.size === 'large' ? 60 : node.size === 'medium' ? 45 : 30),
                  top: node.y - (node.size === 'large' ? 30 : node.size === 'medium' ? 22.5 : 15),
                  width: node.size === 'large' ? '120px' : node.size === 'medium' ? '90px' : '60px',
                  height: node.size === 'large' ? '60px' : node.size === 'medium' ? '45px' : '30px',
                }}
                onClick={(e) => handleNodeClick(node.id, e)}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  handleNodeDoubleClick(node.id);
                }}
                onMouseDown={(e) => !isConnecting && handleNodeDragStart(node.id, e)}
              >
                <div
                  className={`w-full h-full rounded-xl flex items-center justify-center text-white font-medium border-2 transition-all duration-200 ${
                    selectedNode === node.id 
                      ? 'border-white shadow-lg' 
                      : 'border-transparent hover:border-white/50'
                  } ${
                    isConnecting && connectingFrom === node.id 
                      ? 'ring-4 ring-yellow-400/80 border-yellow-400' 
                      : ''
                  } ${
                    isConnecting && connectingFrom && connectingFrom !== node.id
                      ? 'ring-2 ring-green-400/50 border-green-400/50'
                      : ''
                  }`}
                  style={{
                    backgroundColor: node.color,
                    fontSize: node.size === 'large' ? '14px' : node.size === 'medium' ? '12px' : '10px'
                  }}
                >
                  {editingNode === node.id ? (
                    <input
                      type="text"
                      defaultValue={node.text}
                      className="bg-transparent text-white text-center outline-none w-full"
                      style={{ fontSize: 'inherit' }}
                      autoFocus
                      onBlur={(e) => {
                        updateNode(node.id, { text: e.target.value });
                        setEditingNode(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          updateNode(node.id, { text: e.target.value });
                          setEditingNode(null);
                        }
                        if (e.key === 'Escape') {
                          setEditingNode(null);
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="text-center px-2 break-words">
                      {node.text}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Enhanced status indicators */}
          {selectedNode && !isConnecting && (
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-sm">
              Selected: {mindMapNodes.find(n => n.id === selectedNode)?.text}
            </div>
          )}

          {isConnecting && (
            <div className="absolute top-4 right-4 bg-yellow-600/80 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-sm flex items-center space-x-2">
              <span className="animate-pulse">⚡</span>
              <span>
                {connectingFrom 
                  ? `Connecting "${mindMapNodes.find(n => n.id === connectingFrom)?.text}" → Select target`
                  : 'Select first node to connect'
                }
              </span>
            </div>
          )}

          {/* Debug info for connections */}
          {connections.length > 0 && (
            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-xs">
              Connections: {connections.length}
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl px-4 py-2 text-cyan-300">
          🎯 Interactive Nodes
        </div>
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl px-4 py-2 text-purple-300">
          🔗 Smart Connections
        </div>
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-2 text-green-300">
          ✨ Drag & Drop
        </div>
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl px-4 py-2 text-blue-300">
          💾 Save & Export
        </div>
      </div>

      {/* Connection Statistics */}
      {connections.length > 0 && (
        <div className="text-center text-white/60 text-sm">
          <p>Mind map has {mindMapNodes.length} nodes and {connections.length} connections</p>
        </div>
      )}
    </div>
  );

  // Add this to save study stats to user profile
  const saveStudySession = async (sessionData) => {
    try {
      // You can integrate this with your existing API
      const response = await fetch('/api/study-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          userId: user?.id,
          sessionType: activeTab,
          duration: sessionData.duration,
          cardsReviewed: sessionData.cardsReviewed,
          accuracy: sessionData.accuracy,
          timestamp: new Date()
        })
      });
      
      if (response.ok) {
        console.log('Study session saved successfully');
      }
    } catch (error) {
      console.error('Error saving study session:', error);
    }
  };


  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-purple-500/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-purple-900/10 to-pink-900/10" />
      </div>

      {/* Header */}
      <div className="relative z-10 p-6">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white/70 hover:text-white transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          
          <AutoText 
            tag="h1"
            className="text-2xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent"
          >
            Interactive Learning Tools
          </AutoText>
          
          <div className="w-20" /> {/* Spacer */}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="relative z-10 px-6 mb-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center space-x-2 backdrop-blur-xl bg-black/40 border border-purple-500/30 rounded-2xl p-2">
            <button
              onClick={() => setActiveTab('flashcards')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                activeTab === 'flashcards'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <Brain className="w-4 h-4" />
              <span>Flashcards</span>
            </button>
            
            <button
              onClick={() => setActiveTab('pomodoro')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                activeTab === 'pomodoro'
                  ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <Timer className="w-4 h-4" />
              <span>Pomodoro</span>
            </button>
            
            <button
              onClick={() => setActiveTab('mindmap')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                activeTab === 'mindmap'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Mind Map</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-6 pb-12">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'flashcards' && <FlashcardComponent />}
          {activeTab === 'pomodoro' && <PomodoroComponent />}
          {activeTab === 'mindmap' && <MindMapComponent />}
        </div>
      </div>
    </div>
  );
};

export default InteractiveLearning;