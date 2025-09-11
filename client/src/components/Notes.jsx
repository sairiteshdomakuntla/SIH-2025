import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Star, 
  Share2, 
  Trash2, 
  Edit3,
  Book,
  Tag,
  ChevronDown,
  X
} from 'lucide-react';
import NoteEditor from './NoteEditor';
import AutoText from './AutoText';

const Notes = () => {
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    subject: 'all',
    favorite: false,
    tags: []
  });

  const subjects = [
    'Math', 'Science', 'English', 'Hindi', 'Social Studies', 
    'Computer Science', 'Art', 'Music', 'General'
  ];

  useEffect(() => {
    fetchNotes();
  }, [filters, searchQuery]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (filters.subject !== 'all') params.append('subject', filters.subject);
      if (filters.favorite) params.append('favorite', 'true');
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api/notes?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();
      if (data.success) {
        setNotes(data.notes);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to fetch notes');
    } finally {
      setLoading(false);
    }
  };

  const createNewNote = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api/notes`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: 'Untitled Note',
            content: { blocks: [], version: "2.28.2" }
          })
        }
      );

      const data = await response.json();
      if (data.success) {
        setNotes(prev => [data.note, ...prev]);
        setSelectedNote(data.note);
        setIsEditing(true);
      }
    } catch (err) {
      setError('Failed to create note');
    }
  };

  const deleteNote = async (noteId) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api/notes/${noteId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();
      if (data.success) {
        setNotes(prev => prev.filter(note => note._id !== noteId));
        if (selectedNote?._id === noteId) {
          setSelectedNote(null);
          setIsEditing(false);
        }
      }
    } catch (err) {
      setError('Failed to delete note');
    }
  };

  const selectNote = async (noteId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api/notes/${noteId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();
      if (data.success) {
        setSelectedNote(data.note);
        setIsEditing(true);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to fetch note');
    }
  };

  const toggleFavorite = async (noteId) => {
    try {
      const note = notes.find(n => n._id === noteId);
      const token = localStorage.getItem('token');
      
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api/notes/${noteId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...note,
            isFavorite: !note.isFavorite
          })
        }
      );

      const data = await response.json();
      if (data.success) {
        setNotes(prev => prev.map(n => 
          n._id === noteId ? { ...n, isFavorite: !n.isFavorite } : n
        ));
      }
    } catch (err) {
      setError('Failed to update note');
    }
  };

  const filteredNotes = notes.filter(note => {
    if (filters.subject !== 'all' && note.subject !== filters.subject) return false;
    if (filters.favorite && !note.isFavorite) return false;
    return true;
  });

  if (selectedNote && isEditing) {
    return (
      <NoteEditor
        note={selectedNote}
        onSave={(updatedNote) => {
          setNotes(prev => prev.map(n => 
            n._id === updatedNote._id ? updatedNote : n
          ));
          setSelectedNote(updatedNote);
          setIsEditing(false);
        }}
        onCancel={() => {
          setIsEditing(false);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <FileText className="w-8 h-8 text-purple-400" />
            <h1 className="text-3xl font-bold text-white">
              <AutoText>My Notes</AutoText>
            </h1>
          </div>
          <button
            onClick={createNewNote}
            className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl transition-colors duration-300"
          >
            <Plus className="w-5 h-5" />
            <AutoText>New Note</AutoText>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
              <input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-purple-500/30 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-4 py-3 rounded-xl border transition-all duration-300 ${
                showFilters 
                  ? 'bg-purple-600/30 border-purple-500/50 text-purple-200' 
                  : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
              }`}
            >
              <Filter className="w-4 h-4" />
              <AutoText>Filters</AutoText>
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="bg-white/5 border border-purple-500/20 rounded-xl p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Subject Filter */}
                <div>
                  <label className="block text-white font-medium mb-2">
                    <AutoText>Subject</AutoText>
                  </label>
                  <select
                    value={filters.subject}
                    onChange={(e) => setFilters(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="all">All Subjects</option>
                    {subjects.map(subject => (
                      <option key={subject} value={subject} className="bg-gray-800">
                        {subject}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Favorite Filter */}
                <div>
                  <label className="flex items-center space-x-2 text-white">
                    <input
                      type="checkbox"
                      checked={filters.favorite}
                      onChange={(e) => setFilters(prev => ({ ...prev, favorite: e.target.checked }))}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <Star className="w-4 h-4" />
                    <AutoText>Favorites Only</AutoText>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notes Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-400 py-8">
            <AutoText>{error}</AutoText>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center text-white/60 py-12">
            <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-medium mb-2">
              <AutoText>No notes found</AutoText>
            </h3>
            <p className="text-white/40">
              <AutoText>Create your first note to get started</AutoText>
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredNotes.map((note) => (
              <div
                key={note._id}
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 hover:bg-white/15 transition-all duration-300 cursor-pointer group"
                onClick={() => {
                  selectNote(note._id);
                }}
              >
                {/* Note Header */}
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-white font-medium text-lg line-clamp-2 flex-1">
                    <AutoText>{note.title}</AutoText>
                  </h3>
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(note._id);
                      }}
                      className={`p-1 rounded ${note.isFavorite ? 'text-yellow-400' : 'text-white/60 hover:text-yellow-400'}`}
                    >
                      <Star className="w-4 h-4" fill={note.isFavorite ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNote(note._id);
                      }}
                      className="p-1 rounded text-white/60 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Note Preview */}
                <div className="text-white/70 text-sm mb-3 line-clamp-3">
                  {note.content?.blocks?.length > 0 ? (
                    <AutoText>
                      {note.content.blocks
                        .filter(block => block.type === 'paragraph' || block.type === 'header')
                        .slice(0, 2)
                        .map(block => block.data?.text || '')
                        .join(' ')
                        .substring(0, 100) + '...'}
                    </AutoText>
                  ) : (
                    <AutoText>Empty note</AutoText>
                  )}
                </div>

                {/* Note Meta */}
                <div className="flex items-center justify-between text-xs text-white/50">
                  <div className="flex items-center space-x-2">
                    <Book className="w-3 h-3" />
                    <AutoText>{note.subject}</AutoText>
                  </div>
                  <AutoText>
                    {new Date(note.lastModified).toLocaleDateString()}
                  </AutoText>
                </div>

                {/* Tags */}
                {note.tags && note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {note.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-purple-600/30 text-purple-200 text-xs rounded-full"
                      >
                        <AutoText>{tag}</AutoText>
                      </span>
                    ))}
                    {note.tags.length > 3 && (
                      <span className="text-white/50 text-xs">+{note.tags.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notes;