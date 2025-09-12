// import React, { useState, useEffect,useRef } from 'react';
// import { Save, FileText, Bold, Italic, List, Quote, Code, Image, Link, Eye, EyeOff, Loader2 } from 'lucide-react';
// import { useAuth } from '../context/AuthContext';

// const NoteEditor = ({ noteId, onSave, onCancel, initialNote }) => {
//   const [title, setTitle] = useState(initialNote?.title || '');
//   const [content, setContent] = useState(initialNote?.content || '');
//   const [subject, setSubject] = useState(initialNote?.subject || '');
//   const [tags, setTags] = useState(initialNote?.tags || []);
//   const [tagInput, setTagInput] = useState('');
//   const [isPrivate, setIsPrivate] = useState(initialNote?.isPrivate || false);
//   const [preview, setPreview] = useState(false);
//   const [saving, setSaving] = useState(false);
//   const [error, setError] = useState('');
//   const textareaRef = useRef(null);
//   const { user } = useAuth();

//   // Get backend URL
//   const getBackendUrl = () => {
//     return import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
//   };

//   const subjects = [
//     'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English',
//     'History', 'Geography', 'Computer Science', 'Economics', 'Other'
//   ];

//   const handleSave = async () => {
//     if (!title.trim() || !content.trim()) {
//       setError('Title and content are required');
//       return;
//     }

//     if (!subject) {
//       setError('Please select a subject');
//       return;
//     }

//     setSaving(true);
//     setError('');

//     try {
//       const token = localStorage.getItem('token');
//       if (!token) {
//         setError('Authentication required. Please log in again.');
//         setSaving(false);
//         return;
//       }

//       const noteData = {
//         title: title.trim(),
//         content: content.trim(),
//         subject,
//         tags,
//         isPrivate
//       };

//       const url = noteId 
//         ? `${getBackendUrl()}/api/notes/${noteId}`
//         : `${getBackendUrl()}/api/notes`;
      
//       const method = noteId ? 'PUT' : 'POST';

//       console.log('Saving note:', { url, method, noteData });

//       const response = await fetch(url, {
//         method,
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`
//         },
//         body: JSON.stringify(noteData)
//       });

//       // Check if response is ok
//       if (!response.ok) {
//         const errorText = await response.text();
//         console.error('Save note error response:', response.status, errorText);
//         throw new Error(`Failed to save note: ${response.status} ${response.statusText}`);
//       }

//       // Parse response
//       const result = await response.json();
//       console.log('Save note result:', result);

//       // Check if result exists and has expected structure
//       if (!result) {
//         throw new Error('No response received from server');
//       }

//       if (result.success === false) {
//         throw new Error(result.message || 'Failed to save note');
//       }

//       // Success
//       console.log('Note saved successfully:', result);
      
//       if (onSave) {
//         onSave(result.note || result.data);
//       }

//     } catch (error) {
//       console.error('Error saving note:', error);
//       setError(error.message || 'Failed to save note. Please try again.');
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handleAddTag = (e) => {
//     if (e.key === 'Enter' && tagInput.trim()) {
//       e.preventDefault();
//       const newTag = tagInput.trim().toLowerCase();
//       if (!tags.includes(newTag)) {
//         setTags([...tags, newTag]);
//       }
//       setTagInput('');
//     }
//   };

//   const removeTag = (tagToRemove) => {
//     setTags(tags.filter(tag => tag !== tagToRemove));
//   };

//   const insertText = (before, after = '') => {
//     const textarea = textareaRef.current;
//     const start = textarea.selectionStart;
//     const end = textarea.selectionEnd;
//     const selectedText = content.substring(start, end);
//     const newContent = content.substring(0, start) + before + selectedText + after + content.substring(end);
//     setContent(newContent);
    
//     // Set cursor position
//     setTimeout(() => {
//       const newPosition = start + before.length + selectedText.length + after.length;
//       textarea.setSelectionRange(newPosition, newPosition);
//       textarea.focus();
//     }, 0);
//   };

//   const formatMarkdown = (content) => {
//     return content
//       .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
//       .replace(/\*(.*?)\*/g, '<em>$1</em>')
//       .replace(/`(.*?)`/g, '<code>$1</code>')
//       .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')
//       .replace(/^- (.*$)/gm, '<li>$1</li>')
//       .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
//       .replace(/\n/g, '<br>');
//   };

//   return (
//     <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
//       <div className="flex items-center justify-between mb-6">
//         <div className="flex items-center space-x-3">
//           <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
//             <FileText className="w-5 h-5 text-white" />
//           </div>
//           <h2 className="text-white font-semibold">
//             {noteId ? 'Edit Note' : 'Create New Note'}
//           </h2>
//         </div>
        
//         <div className="flex items-center space-x-2">
//           <button
//             onClick={() => setPreview(!preview)}
//             className="flex items-center space-x-2 px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
//           >
//             {preview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
//             <span className="text-sm">{preview ? 'Edit' : 'Preview'}</span>
//           </button>
          
//           <button
//             onClick={handleSave}
//             disabled={saving || !title.trim() || !content.trim()}
//             className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-500 text-white rounded-lg transition-colors"
//           >
//             {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
//             <span className="text-sm">{saving ? 'Saving...' : 'Save Note'}</span>
//           </button>
          
//           {onCancel && (
//             <button
//               onClick={onCancel}
//               className="px-4 py-2 text-white/60 hover:text-white transition-colors"
//             >
//               Cancel
//             </button>
//           )}
//         </div>
//       </div>

//       {error && (
//         <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
//           <p className="text-red-300 text-sm">{error}</p>
//         </div>
//       )}

//       <div className="space-y-4">
//         {/* Title */}
//         <div>
//           <label className="block text-white/80 text-sm font-medium mb-2">
//             Title *
//           </label>
//           <input
//             type="text"
//             value={title}
//             onChange={(e) => setTitle(e.target.value)}
//             placeholder="Enter note title..."
//             className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
//           />
//         </div>

//         {/* Subject and Privacy */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <div>
//             <label className="block text-white/80 text-sm font-medium mb-2">
//               Subject *
//             </label>
//             <select
//               value={subject}
//               onChange={(e) => setSubject(e.target.value)}
//               className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
//             >
//               <option value="">Select subject</option>
//               {subjects.map(sub => (
//                 <option key={sub} value={sub} className="bg-gray-800">{sub}</option>
//               ))}
//             </select>
//           </div>
          
//           <div className="flex items-center space-x-4 pt-6">
//             <label className="flex items-center space-x-2">
//               <input
//                 type="checkbox"
//                 checked={isPrivate}
//                 onChange={(e) => setIsPrivate(e.target.checked)}
//                 className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
//               />
//               <span className="text-white/80 text-sm">Private note</span>
//             </label>
//           </div>
//         </div>

//         {/* Formatting Toolbar */}
//         {!preview && (
//           <div className="flex items-center space-x-2 p-2 bg-white/5 rounded-lg border border-white/10">
//             <button
//               onClick={() => insertText('**', '**')}
//               className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors"
//               title="Bold"
//             >
//               <Bold className="w-4 h-4" />
//             </button>
//             <button
//               onClick={() => insertText('*', '*')}
//               className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors"
//               title="Italic"
//             >
//               <Italic className="w-4 h-4" />
//             </button>
//             <button
//               onClick={() => insertText('`', '`')}
//               className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors"
//               title="Code"
//             >
//               <Code className="w-4 h-4" />
//             </button>
//             <button
//               onClick={() => insertText('> ')}
//               className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors"
//               title="Quote"
//             >
//               <Quote className="w-4 h-4" />
//             </button>
//             <button
//               onClick={() => insertText('- ')}
//               className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors"
//               title="List"
//             >
//               <List className="w-4 h-4" />
//             </button>
//           </div>
//         )}

//         {/* Content */}
//         <div>
//           <label className="block text-white/80 text-sm font-medium mb-2">
//             Content * {!preview && <span className="text-white/40">(Markdown supported)</span>}
//           </label>
          
//           {preview ? (
//             <div 
//               className="w-full min-h-[200px] p-3 bg-white/5 border border-white/20 rounded-lg text-white prose prose-invert max-w-none"
//               dangerouslySetInnerHTML={{ __html: formatMarkdown(content) }}
//             />
//           ) : (
//             <textarea
//               ref={textareaRef}
//               value={content}
//               onChange={(e) => setContent(e.target.value)}
//               placeholder="Write your note content here... Use markdown for formatting!"
//               rows={12}
//               className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
//             />
//           )}
//         </div>

//         {/* Tags */}
//         <div>
//           <label className="block text-white/80 text-sm font-medium mb-2">
//             Tags
//           </label>
//           <div className="flex flex-wrap gap-2 mb-2">
//             {tags.map((tag, index) => (
//               <span
//                 key={index}
//                 className="inline-flex items-center px-2 py-1 bg-blue-600/20 border border-blue-500/30 rounded-full text-blue-300 text-xs"
//               >
//                 {tag}
//                 <button
//                   onClick={() => removeTag(tag)}
//                   className="ml-1 text-blue-300 hover:text-white"
//                 >
//                   ×
//                 </button>
//               </span>
//             ))}
//           </div>
//           <input
//             type="text"
//             value={tagInput}
//             onChange={(e) => setTagInput(e.target.value)}
//             onKeyDown={handleAddTag}
//             placeholder="Add tags (press Enter to add)"
//             className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
//           />
//         </div>

//         {/* Save Button (Bottom) */}
//         <div className="flex justify-end pt-4">
//           <button
//             onClick={handleSave}
//             disabled={saving || !title.trim() || !content.trim() || !subject}
//             className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 text-white rounded-lg transition-all duration-200 font-medium"
//           >
//             {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
//             <span>{saving ? 'Saving Note...' : 'Save Note'}</span>
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default NoteEditor;

import React, { useState, useEffect } from "react";
import { Save, X, Star, Book, FileText, ArrowLeft } from "lucide-react";
import AutoText from "./AutoText";

const NoteEditor = ({ note, onSave, onCancel }) => {
	const [title, setTitle] = useState(note?.title || "");
	const [content, setContent] = useState(note?.content || "");
	const [subject, setSubject] = useState(note?.subject || "General");
	const [isFavorite, setIsFavorite] = useState(note?.isFavorite || false);
	const [saving, setSaving] = useState(false);

	const subjects = [
		"General",
		"Math",
		"Science",
		"English",
		"Hindi",
		"Social Studies",
		"Computer Science",
		"Art",
		"Music",
	];

	// Helper function to convert old Editor.js content to plain text
	const convertContentToText = (content) => {
		if (!content) return "";

		// If already a string, return as is
		if (typeof content === "string") return content;

		// If it's the old Editor.js format (object with blocks)
		if (
			typeof content === "object" &&
			content.blocks &&
			Array.isArray(content.blocks)
		) {
			return content.blocks
				.map((block) => {
					if (block.data?.text) return block.data.text;
					if (block.data?.items && Array.isArray(block.data.items)) {
						return block.data.items.join("\n");
					}
					return "";
				})
				.filter((text) => text.length > 0)
				.join("\n\n");
		}

		return "";
	};

	useEffect(() => {
		if (note) {
			setTitle(note.title || "");
			setContent(convertContentToText(note.content));
			setSubject(note.subject || "General");
			setIsFavorite(note.isFavorite || false);
		}
	}, [note]);

	const handleSave = async () => {
		if (!title.trim()) {
			alert("Please enter a title for your note.");
			return;
		}

		setSaving(true);
		try {
			const updatedNote = {
				...note,
				title: title.trim(),
				content: content.trim(),
				subject,
				isFavorite,
			};

			await onSave(updatedNote);
		} catch (error) {
			console.error("Error saving note:", error);
			alert("Failed to save note. Please try again.");
		} finally {
			setSaving(false);
		}
	};

	const handleKeyDown = (e) => {
		if (e.ctrlKey || e.metaKey) {
			if (e.key === "s") {
				e.preventDefault();
				handleSave();
			}
		}
	};

	return (
		<div className="w-full h-full flex items-center justify-center px-5 py-4 relative">
			{/* Background particles */}
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				{[...Array(15)].map((_, i) => (
					<div
						key={i}
						className="absolute animate-pulse"
						style={{
							left: `${Math.random() * 100}%`,
							top: `${Math.random() * 100}%`,
							animationDelay: `${Math.random() * 3}s`,
							animationDuration: `${2 + Math.random() * 2}s`,
						}}>
						<Star className="w-2 h-2 text-purple-400 opacity-40" />
					</div>
				))}
			</div>

			<div className="w-full relative z-10 m-4 max-w-4xl">
				{/* Header */}
				<div className="backdrop-blur-xl bg-black/40 border border-purple-500/30 rounded-3xl p-6 mb-6 shadow-2xl">
					<div className="flex flex-col lg:flex-row items-center justify-between gap-4">
						<div className="flex items-center space-x-3">
							<div className="bg-gradient-to-r from-purple-600 to-pink-600 p-2 rounded-lg shadow-lg">
								<FileText className="w-6 h-6 text-white" />
							</div>
							<h1 className="text-2xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
								<AutoText>Edit Note</AutoText>
							</h1>
						</div>

						<div className="flex items-center space-x-3">
							<button
								onClick={onCancel}
								className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-xl transition-all duration-300">
								<ArrowLeft className="w-4 h-4" />
								<AutoText>Back</AutoText>
							</button>

							<button
								onClick={handleSave}
								disabled={saving}
								className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-2 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed">
								<Save className="w-4 h-4" />
								<AutoText>{saving ? "Saving..." : "Save"}</AutoText>
							</button>
						</div>
					</div>
				</div>

				{/* Editor */}
				<div className="backdrop-blur-xl bg-black/40 border border-purple-500/30 rounded-3xl p-8 shadow-2xl">
					<div className="space-y-6" onKeyDown={handleKeyDown}>
						{/* Title and Meta */}
						<div className="space-y-4">
							<div>
								<label className="block text-white/80 text-sm font-medium mb-2">
									<AutoText>Title</AutoText>
								</label>
								<input
									type="text"
									value={title}
									onChange={(e) => setTitle(e.target.value)}
									placeholder="Enter note title..."
									className="w-full px-4 py-3 bg-white/10 border border-purple-500/30 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 backdrop-blur-sm transition-all duration-300 text-lg font-medium"
									autoFocus
								/>
							</div>

							<div className="flex flex-col sm:flex-row gap-4">
								<div className="flex-1">
									<label className="block text-white/80 text-sm font-medium mb-2">
										<AutoText>Subject</AutoText>
									</label>
									<select
										value={subject}
										onChange={(e) => setSubject(e.target.value)}
										className="w-full px-4 py-3 bg-white/10 border border-purple-500/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 backdrop-blur-sm transition-all duration-300">
										{subjects.map((sub) => (
											<option key={sub} value={sub} className="bg-gray-800">
												{sub}
											</option>
										))}
									</select>
								</div>

								<div className="flex items-end">
									<button
										type="button"
										onClick={() => setIsFavorite(!isFavorite)}
										className={`flex items-center space-x-2 px-4 py-3 rounded-xl border transition-all duration-300 ${
											isFavorite
												? "bg-yellow-500/20 border-yellow-500/50 text-yellow-200"
												: "bg-white/10 border-purple-500/30 text-white/70 hover:bg-white/20"
										}`}>
										<Star
											className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`}
										/>
										<AutoText>Favorite</AutoText>
									</button>
								</div>
							</div>
						</div>

						{/* Content */}
						<div>
							<label className="block text-white/80 text-sm font-medium mb-2">
								<AutoText>Content</AutoText>
							</label>
							<textarea
								value={content}
								onChange={(e) => setContent(e.target.value)}
								placeholder="Start writing your note..."
								rows={20}
								className="w-full px-4 py-4 bg-white/10 border border-purple-500/30 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 backdrop-blur-sm transition-all duration-300 resize-none font-mono text-sm leading-relaxed"
							/>
						</div>

						{/* Save Shortcut Info */}
						<div className="text-center text-white/50 text-sm">
							<AutoText>Press Ctrl+S (Cmd+S on Mac) to save quickly</AutoText>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default NoteEditor;
