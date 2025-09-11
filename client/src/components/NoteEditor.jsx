import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Save, X, Star, Share2, Lock, Eye, Book, Tag, Plus, Minus,
  Type, Image, List, Quote, Code, Link2, FileText, Palette,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  Undo, Redo, Download, Upload, Settings, Sparkles, Trophy,
  Zap, Shield, Crown, BookOpen, PenTool, Edit3, Layers,
  MoreHorizontal, ChevronDown, Hash, Heading1, Heading2, Heading3
} from 'lucide-react';
import AutoText from './AutoText';

const NoteEditor = ({ note, onSave, onCancel }) => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const editorRef = useRef(null);
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || { blocks: [], version: "2.28.2" });
  const [subject, setSubject] = useState(note?.subject || 'General');
  const [tags, setTags] = useState(note?.tags || []);
  const [isPublic, setIsPublic] = useState(note?.isPublic || false);
  const [isFavorite, setIsFavorite] = useState(note?.isFavorite || false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(note?.lastModified ? new Date(note.lastModified) : null);
  const [showTagInput, setShowTagInput] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [activeBlock, setActiveBlock] = useState(null);
  const [showToolbar, setShowToolbar] = useState(false);
  const [blocks, setBlocks] = useState([
    { id: 1, type: 'paragraph', content: '' }
  ]);

  const subjects = ['General', 'Math', 'Science', 'English', 'Hindi', 'Social Studies', 'Computer Science', 'Art', 'Music'];

  const blockTypes = [
    { type: 'paragraph', icon: Type, label: 'Text', shortcut: 'P' },
    { type: 'heading1', icon: Heading1, label: 'Heading 1', shortcut: 'H1' },
    { type: 'heading2', icon: Heading2, label: 'Heading 2', shortcut: 'H2' },
    { type: 'heading3', icon: Heading3, label: 'Heading 3', shortcut: 'H3' },
    { type: 'list', icon: List, label: 'Bullet List', shortcut: 'UL' },
    { type: 'numbered', icon: Hash, label: 'Numbered List', shortcut: 'OL' },
    { type: 'quote', icon: Quote, label: 'Quote', shortcut: 'Q' },
    { type: 'code', icon: Code, label: 'Code Block', shortcut: 'C' },
    { type: 'divider', icon: Minus, label: 'Divider', shortcut: 'D' }
  ];

  const formatButtons = [
    { action: 'bold', icon: Bold, shortcut: 'Ctrl+B' },
    { action: 'italic', icon: Italic, shortcut: 'Ctrl+I' },
    { action: 'underline', icon: Underline, shortcut: 'Ctrl+U' },
    { action: 'link', icon: Link2, shortcut: 'Ctrl+K' }
  ];

  // Auto-save functionality
  const scheduleAutoSave = useCallback(() => {
    const timer = setTimeout(() => {
      handleSave(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, [title, content, subject, tags, isPublic, isFavorite]);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setSubject(note.subject);
      setTags(note.tags);
      setIsPublic(note.isPublic);
      setIsFavorite(note.isFavorite);
    }
  }, [note]);

  const handleSave = async (isAutoSave = false) => {
    if (!isAutoSave) setSaving(true);

    try {
      const noteData = {
        title: title || 'Untitled Note',
        content,
        subject,
        tags,
        isPublic,
        isFavorite
      };

      const result = await onSave(noteData);
      if (result.success) {
        setLastSaved(new Date());
      }
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      if (!isAutoSave) setSaving(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
      setShowTagInput(false);
      scheduleAutoSave();
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
    scheduleAutoSave();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      addTag();
    } else if (e.key === 'Escape') {
      setShowTagInput(false);
      setNewTag('');
    }
  };

  const addBlock = (type, afterId = null) => {
    const newBlock = {
      id: Date.now(),
      type,
      content: getDefaultContent(type)
    };

    if (afterId) {
      const index = blocks.findIndex(b => b.id === afterId);
      const newBlocks = [...blocks];
      newBlocks.splice(index + 1, 0, newBlock);
      setBlocks(newBlocks);
    } else {
      setBlocks([...blocks, newBlock]);
    }
    
    setActiveBlock(newBlock.id);
  };

  const getDefaultContent = (type) => {
    switch (type) {
      case 'heading1': return 'Heading 1';
      case 'heading2': return 'Heading 2';
      case 'heading3': return 'Heading 3';
      case 'quote': return 'Quote text here...';
      case 'code': return 'console.log("Hello, World!");';
      case 'list': return ['List item 1', 'List item 2'];
      case 'numbered': return ['First item', 'Second item'];
      case 'divider': return null;
      default: return 'Type something...';
    }
  };

  const updateBlockContent = (id, newContent) => {
    setBlocks(blocks.map(block => 
      block.id === id ? { ...block, content: newContent } : block
    ));
    scheduleAutoSave();
  };

  const deleteBlock = (id) => {
    if (blocks.length > 1) {
      setBlocks(blocks.filter(block => block.id !== id));
      scheduleAutoSave();
    }
  };

  const renderBlock = (block) => {
    const isActive = activeBlock === block.id;
    const isEmpty = !block.content || block.content.trim() === '';
    
    switch (block.type) {
      case 'heading1':
        return (
          <h1 
            className={`text-4xl font-bold mb-4 outline-none px-3 py-2 rounded-lg transition-all duration-200 min-h-[3rem] ${
              isActive 
                ? 'bg-white/5 ring-2 ring-purple-500/50 text-white' 
                : isEmpty 
                  ? 'text-white/30 hover:text-white/50 hover:bg-white/5' 
                  : 'text-white hover:bg-white/5'
            }`}
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => updateBlockContent(block.id, e.target.textContent)}
            onFocus={() => setActiveBlock(block.id)}
            onBlur={() => setActiveBlock(null)}
            data-placeholder="Heading 1"
          >
            {block.content}
          </h1>
        );
      
      case 'heading2':
        return (
          <h2 
            className={`text-3xl font-semibold mb-3 outline-none px-3 py-2 rounded-lg transition-all duration-200 min-h-[2.5rem] ${
              isActive 
                ? 'bg-white/5 ring-2 ring-purple-500/50 text-white' 
                : isEmpty 
                  ? 'text-white/30 hover:text-white/50 hover:bg-white/5' 
                  : 'text-white hover:bg-white/5'
            }`}
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => updateBlockContent(block.id, e.target.textContent)}
            onFocus={() => setActiveBlock(block.id)}
            onBlur={() => setActiveBlock(null)}
            data-placeholder="Heading 2"
          >
            {block.content}
          </h2>
        );
      
      case 'heading3':
        return (
          <h3 
            className={`text-2xl font-medium mb-2 outline-none px-3 py-2 rounded-lg transition-all duration-200 min-h-[2rem] ${
              isActive 
                ? 'bg-white/5 ring-2 ring-purple-500/50 text-white' 
                : isEmpty 
                  ? 'text-white/30 hover:text-white/50 hover:bg-white/5' 
                  : 'text-white hover:bg-white/5'
            }`}
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => updateBlockContent(block.id, e.target.textContent)}
            onFocus={() => setActiveBlock(block.id)}
            onBlur={() => setActiveBlock(null)}
            data-placeholder="Heading 3"
          >
            {block.content}
          </h3>
        );
      
      case 'quote':
        return (
          <blockquote 
            className={`border-l-4 border-purple-500 italic mb-4 outline-none px-4 py-3 rounded-r-lg transition-all duration-200 min-h-[2.5rem] ${
              isActive 
                ? 'bg-purple-500/10 ring-2 ring-purple-500/50 text-gray-200 border-purple-400' 
                : isEmpty 
                  ? 'text-gray-500 hover:text-gray-400 hover:bg-purple-500/5 hover:border-purple-400' 
                  : 'text-gray-300 hover:bg-purple-500/5 hover:border-purple-400'
            }`}
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => updateBlockContent(block.id, e.target.textContent)}
            onFocus={() => setActiveBlock(block.id)}
            onBlur={() => setActiveBlock(null)}
            data-placeholder="Quote text here..."
          >
            {block.content}
          </blockquote>
        );
      
      case 'code':
        return (
          <div className={`rounded-lg p-4 mb-4 transition-all duration-200 ${
            isActive 
              ? 'bg-gray-800 ring-2 ring-purple-500/50' 
              : 'bg-gray-800/80 hover:bg-gray-800'
          }`}>
            <code 
              className={`font-mono outline-none block whitespace-pre-wrap min-h-[1.5rem] ${
                isEmpty 
                  ? 'text-green-400/40' 
                  : 'text-green-400'
              }`}
              contentEditable
              suppressContentEditableWarning
              onInput={(e) => updateBlockContent(block.id, e.target.textContent)}
              onFocus={() => setActiveBlock(block.id)}
              onBlur={() => setActiveBlock(null)}
              data-placeholder="Type your code here..."
            >
              {block.content}
            </code>
          </div>
        );
      
      case 'list':
        return (
          <ul 
            className={`list-disc list-inside mb-4 outline-none px-3 py-2 rounded-lg transition-all duration-200 min-h-[2rem] ${
              isActive 
                ? 'bg-white/5 ring-2 ring-purple-500/50 text-white' 
                : isEmpty 
                  ? 'text-white/30 hover:text-white/50 hover:bg-white/5' 
                  : 'text-white hover:bg-white/5'
            }`}
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => updateBlockContent(block.id, e.target.textContent)}
            onFocus={() => setActiveBlock(block.id)}
            onBlur={() => setActiveBlock(null)}
            data-placeholder="• List item"
          >
            {block.content}
          </ul>
        );
      
      case 'numbered':
        return (
          <ol 
            className={`list-decimal list-inside mb-4 outline-none px-3 py-2 rounded-lg transition-all duration-200 min-h-[2rem] ${
              isActive 
                ? 'bg-white/5 ring-2 ring-purple-500/50 text-white' 
                : isEmpty 
                  ? 'text-white/30 hover:text-white/50 hover:bg-white/5' 
                  : 'text-white hover:bg-white/5'
            }`}
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => updateBlockContent(block.id, e.target.textContent)}
            onFocus={() => setActiveBlock(block.id)}
            onBlur={() => setActiveBlock(null)}
            data-placeholder="1. Numbered list item"
          >
            {block.content}
          </ol>
        );

      case 'divider':
        return (
          <div className="flex items-center justify-center my-6">
            <hr className={`border-purple-500/50 w-full transition-all duration-200 ${
              isActive ? 'border-purple-400' : 'hover:border-purple-400/70'
            }`} 
            onClick={() => setActiveBlock(block.id)} />
          </div>
        );
      
      default:
        return (
          <div 
            className={`mb-4 outline-none px-3 py-2 rounded-lg transition-all duration-200 min-h-[2rem] leading-relaxed ${
              isActive 
                ? 'bg-white/5 ring-2 ring-purple-500/50 text-white' 
                : isEmpty 
                  ? 'text-white/30 hover:text-white/50 hover:bg-white/5' 
                  : 'text-white hover:bg-white/5'
            }`}
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => updateBlockContent(block.id, e.target.textContent)}
            onFocus={() => setActiveBlock(block.id)}
            onBlur={() => setActiveBlock(null)}
            data-placeholder="Start writing..."
          >
            {block.content}
          </div>
        );
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-4 relative">
      {/* Custom styles for contentEditable placeholders */}
      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: rgba(255, 255, 255, 0.3);
          pointer-events: none;
          position: absolute;
        }
        [contenteditable]:focus:empty:before {
          color: rgba(255, 255, 255, 0.4);
        }
        [contenteditable] {
          position: relative;
        }
        /* Add smooth transitions for all interactive elements */
        [contenteditable]:hover {
          transform: translateY(-1px);
        }
        [contenteditable]:focus {
          transform: translateY(-1px);
          box-shadow: 0 4px 20px rgba(147, 51, 234, 0.1);
        }
      `}</style>
      
      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className={`absolute animate-pulse`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          >
            <div className={`w-2 h-2 rounded-full ${
              i % 4 === 0 ? 'bg-purple-400' : 
              i % 4 === 1 ? 'bg-pink-400' : 
              i % 4 === 2 ? 'bg-blue-400' : 'bg-green-400'
            } opacity-60`}></div>
          </div>
        ))}
      </div>

      {/* Floating decorative elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-full blur-xl animate-bounce"></div>
      <div className="absolute bottom-20 right-10 w-24 h-24 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute top-1/3 right-20 w-16 h-16 bg-gradient-to-r from-pink-600/20 to-red-600/20 rounded-full blur-lg animate-ping"></div>

      {/* Main container */}
      <div className="backdrop-blur-xl bg-black/40 border border-purple-500/30 rounded-3xl shadow-2xl relative overflow-hidden w-full max-w-7xl h-full max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-white/10 backdrop-blur-sm border-b border-purple-500/30">
          {/* Left side - Title and status */}
          <div className="flex items-center space-x-4">
            <div className="group relative">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-2xl shadow-lg transform hover:scale-110 transition-transform duration-300">
                <Edit3 className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 flex space-x-1">
                {isFavorite && (
                  <div className="bg-yellow-500 rounded-full p-1">
                    <Star className="w-3 h-3 text-white fill-current" />
                  </div>
                )}
                {isPublic && (
                  <div className="bg-green-500 rounded-full p-1">
                    <Eye className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
            </div>

            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  scheduleAutoSave();
                }}
                placeholder="Untitled Note"
                className="text-2xl font-bold bg-transparent text-white placeholder-white/30 outline-none border-b-2 border-transparent focus:border-purple-500 hover:border-purple-500/30 transition-all duration-300 min-w-[300px] px-2 py-1 rounded-t-lg focus:bg-white/5"
              />
              <div className="flex items-center space-x-2 mt-1">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <AutoText className="text-sm text-green-300">Live editing</AutoText>
                </div>
                {lastSaved && (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <AutoText className="text-sm text-gray-400">
                      Last saved: {lastSaved.toLocaleTimeString()}
                    </AutoText>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right side - Action buttons */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                setIsFavorite(!isFavorite);
                scheduleAutoSave();
              }}
              className={`group relative p-3 rounded-xl transition-all duration-300 transform hover:scale-110 ${
                isFavorite
                  ? 'bg-gradient-to-r from-yellow-500/30 to-orange-500/30 border-yellow-400/50 text-yellow-200 shadow-lg shadow-yellow-500/25'
                  : 'bg-white/10 hover:bg-gradient-to-r hover:from-yellow-500/20 hover:to-orange-500/20 border-white/20 hover:border-yellow-400/50 text-white hover:text-yellow-200'
              } border backdrop-blur-sm`}
            >
              <Star className={`w-5 h-5 transition-all duration-500 ${isFavorite ? 'fill-current rotate-12 scale-125' : 'group-hover:rotate-12 group-hover:scale-110'}`} />
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-green-600/50 disabled:to-emerald-600/50 text-white px-6 py-3 rounded-xl transition-all duration-300 font-medium shadow-lg transform hover:scale-105 disabled:hover:scale-100"
            >
              <Save className="w-5 h-5" />
              <AutoText>{saving ? 'Saving...' : 'Save'}</AutoText>
            </button>

            <button
              onClick={onCancel}
              className="flex items-center space-x-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-6 py-3 rounded-xl transition-all duration-300 font-medium shadow-lg transform hover:scale-105"
            >
              <X className="w-5 h-5" />
              <AutoText>Close</AutoText>
            </button>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Editor area */}
          <div className="flex-1 flex flex-col">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 bg-white/5 border-b border-purple-500/20">
              {/* Block type buttons */}
              <div className="flex items-center space-x-2">
                <AutoText className="text-sm text-white/70 mr-2">Add:</AutoText>
                {blockTypes.slice(0, 6).map((blockType) => {
                  const Icon = blockType.icon;
                  return (
                    <button
                      key={blockType.type}
                      onClick={() => addBlock(blockType.type)}
                      className="flex items-center space-x-1 px-3 py-2 bg-white/10 hover:bg-purple-600/30 border border-white/20 hover:border-purple-500/50 rounded-lg transition-all duration-200 text-white hover:text-purple-200"
                      title={`${blockType.label} (${blockType.shortcut})`}
                    >
                      <Icon className="w-4 h-4" />
                      <AutoText className="text-sm">{blockType.shortcut}</AutoText>
                    </button>
                  );
                })}
                
                <div className="w-px h-6 bg-white/20 mx-2"></div>
                
                {/* Format buttons */}
                {formatButtons.map((format) => {
                  const Icon = format.icon;
                  return (
                    <button
                      key={format.action}
                      className="p-2 bg-white/10 hover:bg-purple-600/30 border border-white/20 hover:border-purple-500/50 rounded-lg transition-all duration-200 text-white hover:text-purple-200"
                      title={format.shortcut}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>

              {/* View options */}
              <div className="flex items-center space-x-2">
                <button className="flex items-center space-x-2 px-3 py-2 bg-white/10 hover:bg-purple-600/30 border border-white/20 hover:border-purple-500/50 rounded-lg transition-all duration-200 text-white hover:text-purple-200">
                  <Settings className="w-4 h-4" />
                  <AutoText className="text-sm">Settings</AutoText>
                </button>
              </div>
            </div>

            {/* Content editor */}
            <div className="flex-1 p-6 overflow-auto">
              <div className="max-w-4xl mx-auto">
                {blocks.map((block, index) => (
                  <div 
                    key={block.id}
                    className={`group relative mb-2 transition-all duration-200 ${
                      activeBlock === block.id 
                        ? 'bg-white/5 rounded-lg ring-2 ring-purple-500/30' 
                        : 'hover:bg-white/5 hover:rounded-lg'
                    }`}
                  >
                    {/* Block separator - shows between blocks on hover */}
                    {index > 0 && (
                      <div className="absolute -top-1 left-0 right-0 h-2 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
                        <button
                          onClick={() => {
                            const prevBlock = blocks[index - 1];
                            addBlock('paragraph', prevBlock.id);
                          }}
                          className="w-8 h-4 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 hover:border-purple-400/50 rounded-full flex items-center justify-center text-purple-300 hover:text-purple-200 transition-all duration-200 backdrop-blur-sm"
                          title="Add block here"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {/* Block content with integrated controls */}
                    <div className="relative p-2">
                      {/* Block controls - positioned inside the block */}
                      <div className={`absolute top-2 right-2 z-10 flex items-center space-x-1 transition-opacity duration-200 ${
                        activeBlock === block.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}>
                        <button
                          onClick={() => addBlock('paragraph', block.id)}
                          className="w-7 h-7 bg-black/60 hover:bg-purple-600/80 border border-white/20 hover:border-purple-400/50 rounded-lg flex items-center justify-center text-white hover:text-purple-200 transition-all duration-200 backdrop-blur-sm"
                          title="Add block below"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        {blocks.length > 1 && (
                          <button
                            onClick={() => deleteBlock(block.id)}
                            className="w-7 h-7 bg-black/60 hover:bg-red-600/80 border border-white/20 hover:border-red-400/50 rounded-lg flex items-center justify-center text-white hover:text-red-200 transition-all duration-200 backdrop-blur-sm"
                            title="Delete block"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Block content */}
                      <div className="pr-16">
                        {renderBlock(block)}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add new block button */}
                <button
                  onClick={() => addBlock('paragraph')}
                  className="flex items-center space-x-2 px-4 py-3 bg-white/5 hover:bg-purple-600/20 border border-dashed border-white/30 hover:border-purple-500/50 rounded-xl transition-all duration-300 text-white/70 hover:text-purple-200 w-full"
                >
                  <Plus className="w-5 h-5" />
                  <AutoText>Add a block</AutoText>
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-80 bg-white/5 backdrop-blur-sm border-l border-purple-500/30 p-6 overflow-auto">
            <div className="space-y-6">
              {/* Subject */}
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
                <label className="flex items-center space-x-2 text-white font-medium mb-3">
                  <Book className="w-4 h-4" />
                  <AutoText>Subject</AutoText>
                </label>
                <select
                  value={subject}
                  onChange={(e) => {
                    setSubject(e.target.value);
                    scheduleAutoSave();
                  }}
                  className="w-full bg-white/10 hover:bg-white/15 border border-white/20 hover:border-white/30 focus:border-purple-500 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:bg-white/15 appearance-none cursor-pointer transition-all duration-200 shadow-lg"
                >
                  {subjects.map(sub => (
                    <option key={sub} value={sub} className="bg-gray-800 text-white">
                      {sub}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tags */}
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center space-x-2 text-white font-medium">
                    <Tag className="w-4 h-4" />
                    <AutoText>Tags</AutoText>
                  </label>
                  <button
                    onClick={() => setShowTagInput(!showTagInput)}
                    className="text-purple-400 hover:text-purple-300 p-1 rounded-lg hover:bg-purple-600/20 transition-all duration-200"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {showTagInput && (
                  <div className="mb-3">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Add a tag..."
                      className="w-full bg-white/10 hover:bg-white/15 border border-white/20 hover:border-white/30 focus:border-purple-500 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:bg-white/15 text-sm transition-all duration-200 shadow-lg"
                      autoFocus
                    />
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="flex items-center space-x-1 px-3 py-1 bg-gradient-to-r from-purple-600/30 to-pink-600/30 border border-purple-500/30 text-purple-200 text-sm rounded-full backdrop-blur-sm"
                    >
                      <AutoText>{tag}</AutoText>
                      <button
                        onClick={() => removeTag(tag)}
                        className="text-purple-300 hover:text-white transition-colors duration-200"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Visibility */}
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
                <label className="flex items-center space-x-2 text-white font-medium mb-3">
                  {isPublic ? <Eye className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  <AutoText>Visibility</AutoText>
                </label>
                <label className="flex items-center space-x-3 text-white cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={(e) => {
                        setIsPublic(e.target.checked);
                        scheduleAutoSave();
                      }}
                      className="sr-only"
                    />
                    <div className={`w-12 h-6 rounded-full border-2 transition-all duration-300 ${
                      isPublic 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 border-green-400' 
                        : 'bg-gray-600 border-gray-500'
                    }`}>
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 ${
                        isPublic ? 'translate-x-6' : 'translate-x-1'
                      } mt-0.5`}></div>
                    </div>
                  </div>
                  <AutoText>Make this note public</AutoText>
                </label>
              </div>

              {/* Stats */}
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
                <div className="text-white font-medium mb-3 flex items-center space-x-2">
                  <Trophy className="w-4 h-4" />
                  <AutoText>Note Stats</AutoText>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-300">
                    <AutoText>Blocks:</AutoText>
                    <span className="text-purple-300">{blocks.length}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <AutoText>Words:</AutoText>
                    <span className="text-purple-300">
                      {blocks.reduce((count, block) => {
                        const text = typeof block.content === 'string' ? block.content : '';
                        return count + text.split(/\s+/).filter(word => word.length > 0).length;
                      }, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <AutoText>Characters:</AutoText>
                    <span className="text-purple-300">
                      {blocks.reduce((count, block) => {
                        const text = typeof block.content === 'string' ? block.content : '';
                        return count + text.length;
                      }, 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-3 rounded-xl transition-all duration-300 font-medium shadow-lg transform hover:scale-105 flex items-center justify-center space-x-2">
                  <Share2 className="w-4 h-4" />
                  <AutoText>Share Note</AutoText>
                </button>
                
                <button className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-4 py-3 rounded-xl transition-all duration-300 font-medium shadow-lg transform hover:scale-105 flex items-center justify-center space-x-2">
                  <Download className="w-4 h-4" />
                  <AutoText>Export</AutoText>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteEditor;
