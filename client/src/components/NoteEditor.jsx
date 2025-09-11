import React, { useEffect, useRef, useState } from 'react';
import EditorJS from '@editorjs/editorjs';
import Header from '@editorjs/header';
import List from '@editorjs/list';
import Checklist from '@editorjs/checklist';
import Quote from '@editorjs/quote';
import Code from '@editorjs/code';
import Delimiter from '@editorjs/delimiter';
import Table from '@editorjs/table';
import LinkTool from '@editorjs/link';
import Marker from '@editorjs/marker';
import InlineCode from '@editorjs/inline-code';
import { 
  Save, 
  X, 
  Star, 
  Share2, 
  Tag, 
  Book,
  Eye,
  Lock,
  Plus
} from 'lucide-react';
import AutoText from './AutoText';

const NoteEditor = ({ note, onSave, onCancel }) => {
  const editorRef = useRef(null);
  const [editor, setEditor] = useState(null);
  const [title, setTitle] = useState(note?.title || 'Untitled Note');
  const [subject, setSubject] = useState(note?.subject || 'General');
  const [tags, setTags] = useState(note?.tags || []);
  const [newTag, setNewTag] = useState('');
  const [isPublic, setIsPublic] = useState(note?.isPublic || false);
  const [isFavorite, setIsFavorite] = useState(note?.isFavorite || false);
  const [saving, setSaving] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const autoSaveTimeoutRef = useRef(null);

  const subjects = [
    'Math', 'Science', 'English', 'Hindi', 'Social Studies', 
    'Computer Science', 'Art', 'Music', 'General'
  ];

  // Update state when note prop changes
  useEffect(() => {
    if (note) {
      setTitle(note.title || 'Untitled Note');
      setSubject(note.subject || 'General');
      setTags(note.tags || []);
      setIsPublic(note.isPublic || false);
      setIsFavorite(note.isFavorite || false);
      setLastSaved(note.lastModified ? new Date(note.lastModified) : null);
    }
  }, [note?._id]);

  // Auto-save function
  const autoSave = async () => {
    if (!editor || !note) return;

    try {
      const content = await editor.save();
      
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api/notes/${note._id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title,
            content,
            subject,
            tags,
            isPublic,
            isFavorite
          })
        }
      );

      const data = await response.json();
      if (data.success) {
        setLastSaved(new Date());
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  };

  // Schedule auto-save
  const scheduleAutoSave = () => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    autoSaveTimeoutRef.current = setTimeout(autoSave, 2000); // Auto-save after 2 seconds of inactivity
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const initializeEditor = async () => {
      // Clean up existing editor if it exists
      if (editor && typeof editor.destroy === 'function') {
        try {
          await editor.destroy();
        } catch (error) {
          console.log('Error destroying editor:', error);
        }
        setEditor(null);
      }

      // Small delay to ensure cleanup is complete
      setTimeout(() => {
        // Clear the holder div
        if (editorRef.current) {
          editorRef.current.innerHTML = '';
        }

        // Create new editor instance
        const editorInstance = new EditorJS({
          holder: editorRef.current,
          placeholder: 'Start writing your note...',
          data: note?.content || { blocks: [] },
          onChange: () => {
            scheduleAutoSave();
          },
          tools: {
            header: {
              class: Header,
              config: {
                placeholder: 'Enter a header',
                levels: [1, 2, 3, 4],
                defaultLevel: 2
              }
            },
            list: {
              class: List,
              inlineToolbar: true,
              config: {
                defaultStyle: 'unordered'
              }
            },
            checklist: {
              class: Checklist,
              inlineToolbar: true
            },
            quote: {
              class: Quote,
              inlineToolbar: true,
              config: {
                quotePlaceholder: 'Enter a quote',
                captionPlaceholder: 'Quote\'s author'
              }
            },
            code: {
              class: Code,
              config: {
                placeholder: 'Enter code here...'
              }
            },
            delimiter: Delimiter,
            table: {
              class: Table,
              inlineToolbar: true,
              config: {
                rows: 2,
                cols: 3
              }
            },
            linkTool: {
              class: LinkTool,
              config: {
                endpoint: '/api/link' // You might need to implement this endpoint
              }
            },
            marker: {
              class: Marker,
              shortcut: 'CMD+SHIFT+M'
            },
            inlineCode: {
              class: InlineCode,
              shortcut: 'CMD+SHIFT+C'
            }
          },
          onReady: () => {
            // Editor is ready
          }
        });

        setEditor(editorInstance);
      }, 100);
    };

    if (note) {
      initializeEditor();
    }

    return () => {
      if (editor && typeof editor.destroy === 'function') {
        editor.destroy().catch(console.error);
        setEditor(null);
      }
    };
  }, [note?._id]); // Re-initialize when note changes

  const handleSave = async () => {
    if (!editor) return;

    try {
      setSaving(true);
      const content = await editor.save();
      
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api/notes/${note._id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title,
            content,
            subject,
            tags,
            isPublic,
            isFavorite
          })
        }
      );

      const data = await response.json();
      if (data.success) {
        onSave(data.note);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Failed to save note. Please try again.');
    } finally {
      setSaving(false);
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
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-sm border-b border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1 max-w-2xl">
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                scheduleAutoSave();
              }}
              className="bg-transparent text-white text-2xl font-bold border-none outline-none placeholder-white/50 flex-1"
              placeholder="Untitled Note"
            />
            <button
              onClick={() => {
                setIsFavorite(!isFavorite);
                scheduleAutoSave();
              }}
              className={`p-2 rounded-lg transition-colors ${
                isFavorite ? 'text-yellow-400' : 'text-white/60 hover:text-yellow-400'
              }`}
            >
              <Star className="w-5 h-5" fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
          </div>

          <div className="flex items-center space-x-3">
            {lastSaved && (
              <span className="text-white/60 text-sm">
                <AutoText>Last saved: {lastSaved.toLocaleTimeString()}</AutoText>
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              <AutoText>{saving ? 'Saving...' : 'Save'}</AutoText>
            </button>
            <button
              onClick={onCancel}
              className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              <AutoText>Cancel</AutoText>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Editor */}
          <div className="lg:col-span-3">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl overflow-hidden">
              <div
                key={note?._id}
                ref={editorRef}
                className="min-h-[600px] p-6 text-white prose prose-invert max-w-none"
                style={{
                  '--tw-prose-body': '#ffffff',
                  '--tw-prose-headings': '#ffffff',
                  '--tw-prose-lead': '#e5e7eb',
                  '--tw-prose-links': '#a855f7',
                  '--tw-prose-bold': '#ffffff',
                  '--tw-prose-counters': '#9ca3af',
                  '--tw-prose-bullets': '#9ca3af',
                  '--tw-prose-hr': '#374151',
                  '--tw-prose-quotes': '#9ca3af',
                  '--tw-prose-quote-borders': '#374151',
                  '--tw-prose-captions': '#9ca3af',
                  '--tw-prose-code': '#ffffff',
                  '--tw-prose-pre-code': '#e5e7eb',
                  '--tw-prose-pre-bg': '#1f2937',
                  '--tw-prose-th-borders': '#374151',
                  '--tw-prose-td-borders': '#374151'
                }}
              />
            </div>
          </div>

          {/* Sidebar */}
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
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
              >
                {subjects.map(sub => (
                  <option key={sub} value={sub} className="bg-gray-800">
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
                  className="text-purple-400 hover:text-purple-300"
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
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:border-purple-500 text-sm"
                  />
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="flex items-center space-x-1 px-2 py-1 bg-purple-600/30 text-purple-200 text-sm rounded-full"
                  >
                    <AutoText>{tag}</AutoText>
                    <button
                      onClick={() => removeTag(tag)}
                      className="text-purple-300 hover:text-white"
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
              <label className="flex items-center space-x-2 text-white">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => {
                    setIsPublic(e.target.checked);
                    scheduleAutoSave();
                  }}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <AutoText>Make this note public</AutoText>
              </label>
            </div>

            {/* Share */}
            <button className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-xl transition-colors flex items-center justify-center space-x-2">
              <Share2 className="w-4 h-4" />
              <AutoText>Share Note</AutoText>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteEditor;