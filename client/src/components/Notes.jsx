// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { 
//   FileText, 
//   Plus, 
//   Search, 
//   Filter, 
//   Star, 
//   Share2, 
//   Trash2, 
//   Edit3,
//   Book,
//   Tag,
//   ChevronDown,
//   X
// } from 'lucide-react';
// import NoteEditor from './NoteEditor';
// import AutoText from './AutoText';

// const Notes = () => {
//   const navigate = useNavigate();
//   const [notes, setNotes] = useState([]);
//   const [selectedNote, setSelectedNote] = useState(null);
//   const [isEditing, setIsEditing] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [searchQuery, setSearchQuery] = useState('');
//   const [filters, setFilters] = useState({
//     subject: 'all',
//     showFavorites: false
//   });

//   const subjects = [
//     'Math', 'Science', 'English', 'Hindi', 'Social Studies', 
//     'Computer Science', 'Art', 'Music', 'General'
//   ];

//   useEffect(() => {
//     fetchNotes();
//   }, [filters, searchQuery]);

//   const fetchNotes = async () => {
//     try {
//       setLoading(true);
//       const token = localStorage.getItem('token');
//       const params = new URLSearchParams();
      
//       if (filters.subject !== 'all') params.append('subject', filters.subject);
//       if (filters.favorite) params.append('favorite', 'true');
//       if (searchQuery) params.append('search', searchQuery);

//       const response = await fetch(
//         `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api/notes?${params}`,
//         {
//           headers: {
//             'Authorization': `Bearer ${token}`,
//             'Content-Type': 'application/json'
//           }
//         }
//       );

//       const data = await response.json();
//       if (data.success) {
//         setNotes(data.notes);
//       } else {
//         setError(data.message);
//       }
//     } catch (err) {
//       setError('Failed to fetch notes');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const createNewNote = () => {
//     // Create a temporary note object for editing
//     const newNote = {
//       title: '',
//       content: { blocks: [], version: "2.28.2" },
//       subject: 'General',
//       tags: [],
//       isPrivate: false
//     };
//     setSelectedNote(newNote);
//     setIsEditing(true);
//   };

//   const deleteNote = async (noteId) => {
//     if (!confirm('Are you sure you want to delete this note?')) return;

//     try {
//       const token = localStorage.getItem('token');
//       const response = await fetch(
//         `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api/notes/${noteId}`,
//         {
//           method: 'DELETE',
//           headers: {
//             'Authorization': `Bearer ${token}`,
//             'Content-Type': 'application/json'
//           }
//         }
//       );

//       const data = await response.json();
//       if (data.success) {
//         setNotes(prev => prev.filter(note => note._id !== noteId));
//         if (selectedNote?._id === noteId) {
//           setSelectedNote(null);
//           setIsEditing(false);
//         }
//       }
//     } catch (err) {
//       setError('Failed to delete note');
//     }
//   };

//   const selectNote = async (noteId) => {
//     try {
//       const token = localStorage.getItem('token');
//       const response = await fetch(
//         `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api/notes/${noteId}`,
//         {
//           headers: {
//             'Authorization': `Bearer ${token}`,
//             'Content-Type': 'application/json'
//           }
//         }
//       );

//       const data = await response.json();
//       if (data.success) {
//         setSelectedNote(data.note);
//         setIsEditing(true);
//       } else {
//         setError(data.message);
//       }
//     } catch (err) {
//       setError('Failed to fetch note');
//     }
//   };

//   const toggleFavorite = async (noteId) => {
//     try {
//       const note = notes.find(n => n._id === noteId);
//       const token = localStorage.getItem('token');
      
//       const response = await fetch(
//         `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api/notes/${noteId}`,
//         {
//           method: 'PUT',
//           headers: {
//             'Authorization': `Bearer ${token}`,
//             'Content-Type': 'application/json'
//           },
//           body: JSON.stringify({
//             ...note,
//             isFavorite: !note.isFavorite
//           })
//         }
//       );

//       const data = await response.json();
//       if (data.success) {
//         setNotes(prev => prev.map(n => 
//           n._id === noteId ? { ...n, isFavorite: !n.isFavorite } : n
//         ));
//       }
//     } catch (err) {
//       setError('Failed to update note');
//     }
//   };

//   const filteredNotes = notes.filter(note => {
//     if (filters.subject !== 'all' && note.subject !== filters.subject) return false;
//     if (filters.favorite && !note.isFavorite) return false;
//     return true;
//   });

//   if (selectedNote && isEditing) {
//     return (
//       <NoteEditor
//         note={selectedNote}
//         onSave={(updatedNote) => {
//           setNotes(prev => prev.map(n => 
//             n._id === updatedNote._id ? updatedNote : n
//           ));
//           setSelectedNote(updatedNote);
//           setIsEditing(false);
//         }}
//         onCancel={() => {
//           setIsEditing(false);
//         }}
//       />
//     );
//   }

//   return (
//     <div className="w-full h-full flex items-center justify-center px-5 py-4 relative">
//       {/* Animated particles */}
//       <div className="absolute inset-0 overflow-hidden pointer-events-none">
//         {[...Array(30)].map((_, i) => (
//           <div
//             key={i}
//             className="absolute animate-pulse"
//             style={{
//               left: `${Math.random() * 100}%`,
//               top: `${Math.random() * 100}%`,
//               animationDelay: `${Math.random() * 3}s`,
//               animationDuration: `${2 + Math.random() * 2}s`
//             }}
//           >
//             <Star className="w-2 h-2 text-pink-400 opacity-60" />
//           </div>
//         ))}
//       </div>

//       <div className="w-full relative z-10 m-4">
//         {/* Unified Header with Search, Filters, and New Note */}
//         <div className="backdrop-blur-xl bg-black/40 border border-purple-500/30 rounded-3xl p-6 mb-8 shadow-2xl relative overflow-hidden">
//           <div className="flex flex-col lg:flex-row items-center gap-4">
//             {/* Title and Icon */}
//             <div className="flex items-center space-x-3 flex-shrink-0">
//               <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-2 rounded-lg shadow-lg">
//                 <FileText className="w-6 h-6 text-white" />
//               </div>
//               <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
//                 <AutoText>My Notes</AutoText>
//               </h1>
//             </div>

//             {/* Search */}
//             <div className="relative flex-1 min-w-0">
//               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
//               <input
//                 type="text"
//                 placeholder="Search notes..."
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//                 className="w-full pl-10 pr-4 py-3 bg-white/10 border border-purple-500/30 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 backdrop-blur-sm transition-all duration-300"
//               />
//             </div>

//             {/* Subject Filter Dropdown */}
//             <div className="flex-shrink-0">
//               <select
//                 value={filters.subject}
//                 onChange={(e) => setFilters(prev => ({ ...prev, subject: e.target.value }))}
//                 className="bg-white/10 border border-purple-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 backdrop-blur-sm transition-all duration-300 min-w-[140px]"
//               >
//                 <option value="all" className="bg-gray-800">All Subjects</option>
//                 {subjects.map(subject => (
//                   <option key={subject} value={subject} className="bg-gray-800">
//                     {subject}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             {/* Favorites Filter */}
//             <button
//               onClick={() => setFilters(prev => ({ ...prev, favorite: !prev.favorite }))}
//               className={`flex items-center space-x-2 px-4 py-3 rounded-xl border transition-all duration-300 backdrop-blur-sm flex-shrink-0 ${
//                 filters.favorite 
//                   ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-200' 
//                   : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
//               }`}
//             >
//               <Star className={`w-4 h-4 ${filters.favorite ? 'fill-current' : ''}`} />
//               <AutoText>Favorites</AutoText>
//             </button>

//             {/* New Note Button */}
//             <button
//               onClick={createNewNote}
//               className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex-shrink-0"
//             >
//               <Plus className="w-5 h-5" />
//               <AutoText>New Note</AutoText>
//             </button>
//           </div>
//         </div>

//         {/* Notes Grid */}
//         {loading ? (
//           <div className="backdrop-blur-xl bg-black/40 border border-purple-500/30 rounded-3xl p-8 shadow-2xl flex justify-center items-center h-64">
//             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
//           </div>
//         ) : error ? (
//           <div className="backdrop-blur-xl bg-black/40 border border-purple-500/30 rounded-3xl p-8 shadow-2xl text-center text-red-400 py-8">
//             <AutoText>{error}</AutoText>
//           </div>
//         ) : filteredNotes.length === 0 ? (
//           <div className="backdrop-blur-xl bg-black/40 border border-purple-500/30 rounded-3xl p-8 shadow-2xl text-center text-white/60 py-12">
//             <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
//             <h3 className="text-xl font-medium mb-2">
//               <AutoText>No notes found</AutoText>
//             </h3>
//             <p className="text-white/40">
//               <AutoText>Create your first note to get started</AutoText>
//             </p>
//           </div>
//         ) : (
//           <div className="backdrop-blur-xl bg-black/40 border border-purple-500/30 rounded-3xl p-8 shadow-2xl">
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
//               {filteredNotes.map((note) => (
//                 <div
//                   key={note._id}
//                   className="group p-6 bg-white/10 hover:bg-white/20 border border-purple-500/30 hover:border-purple-400/50 rounded-xl transition-all duration-300 backdrop-blur-sm hover:scale-105 hover:shadow-xl cursor-pointer"
//                   onClick={() => {
//                     if (note.slug) {
//                       navigate(`/note/${note.slug}`);
//                     } else {
//                       // Fallback for notes without slugs
//                       console.warn('Note missing slug, using ID instead:', note.title);
//                       navigate(`/notes`); // Stay on notes page if no slug
//                     }
//                   }}
//                 >
//                   {/* Note Header */}
//                   <div className="flex items-start justify-between mb-4">
//                     <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-2 rounded-lg group-hover:scale-110 transition-transform duration-300">
//                       <FileText className="w-6 h-6 text-white" />
//                     </div>
//                     <div className="flex items-center space-x-1 opacity-70 group-hover:opacity-100 transition-opacity">
//                       <button
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           toggleFavorite(note._id);
//                         }}
//                         className={`p-2 rounded-lg transition-all duration-200 ${note.isFavorite ? 'text-yellow-400 bg-yellow-400/20' : 'text-white/60 hover:text-yellow-400 hover:bg-yellow-400/10'}`}
//                       >
//                         <Star className="w-4 h-4" fill={note.isFavorite ? 'currentColor' : 'none'} />
//                       </button>
//                       <button
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           deleteNote(note._id);
//                         }}
//                         className="p-2 rounded-lg text-white/60 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200"
//                       >
//                         <Trash2 className="w-4 h-4" />
//                       </button>
//                     </div>
//                   </div>
                  
//                   <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-200 transition-colors duration-300 line-clamp-2">
//                     <AutoText>{note.title}</AutoText>
//                   </h3>

//                   {/* Note Preview */}
//                   <p className="text-white/70 text-sm mb-4 line-clamp-3">
//                     {note.content?.blocks?.length > 0 ? (
//                       <AutoText>
//                         {note.content.blocks
//                           .filter(block => block.type === 'paragraph' || block.type === 'header')
//                           .slice(0, 2)
//                           .map(block => block.data?.text || '')
//                           .join(' ')
//                           .substring(0, 100) + '...'}
//                       </AutoText>
//                     ) : (
//                       <AutoText>Empty note</AutoText>
//                     )}
//                   </p>

//                   {/* Note Meta */}
//                   <div className="flex items-center justify-between mb-3">
//                     <span className="px-3 py-1 bg-purple-600/30 text-purple-200 text-xs font-medium rounded-full">
//                       <AutoText>{note.subject}</AutoText>
//                     </span>
//                   </div>

//                   {/* Date and Action */}
//                   <div className="flex items-center justify-between">
//                     <span className="text-white/50 text-xs">
//                       <AutoText>{new Date(note.lastModified).toLocaleDateString()}</AutoText>
//                     </span>
//                   </div>

//                   {/* Tags */}
//                   {note.tags && note.tags.length > 0 && (
//                     <div className="flex flex-wrap gap-1 mt-3">
//                       {note.tags.slice(0, 3).map((tag, index) => (
//                         <span
//                           key={index}
//                           className="px-2 py-1 bg-purple-600/30 text-purple-200 text-xs rounded-full"
//                         >
//                           <AutoText>{tag}</AutoText>
//                         </span>
//                       ))}
//                       {note.tags.length > 3 && (
//                         <span className="text-white/50 text-xs">+{note.tags.length - 3}</span>
//                       )}
//                     </div>
//                   )}
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Notes;


import React, { useState, useEffect } from "react";
import {
	FileText,
	Plus,
	Search,
	Star,
	Trash2,
	Edit3,
	Book,
	Calendar,
} from "lucide-react";
import NoteEditor from "./NoteEditor";
import AutoText from "./AutoText";

const Notes = () => {
	const [notes, setNotes] = useState([]);
	const [selectedNote, setSelectedNote] = useState(null);
	const [isEditing, setIsEditing] = useState(false);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedSubject, setSelectedSubject] = useState("all");
	const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

	const subjects = [
		"Math",
		"Science",
		"English",
		"Hindi",
		"Social Studies",
		"Computer Science",
		"Art",
		"Music",
		"General",
	];

	// Helper function to safely extract text content from note
	const getContentPreview = (content) => {
		if (!content) return "Empty note";

		// If content is a string, use it directly
		if (typeof content === "string") {
			return content.length > 120 ? content.substring(0, 120) + "..." : content;
		}

		// If content is the old Editor.js format (object with blocks)
		if (
			typeof content === "object" &&
			content.blocks &&
			Array.isArray(content.blocks)
		) {
			const textContent = content.blocks
				.filter(
					(block) => block.type === "paragraph" || block.type === "header"
				)
				.map((block) => block.data?.text || "")
				.join(" ")
				.trim();

			if (!textContent) return "Empty note";
			return textContent.length > 120
				? textContent.substring(0, 120) + "..."
				: textContent;
		}

		// Fallback for any other format
		return "Content preview unavailable";
	};

	useEffect(() => {
		fetchNotes();
	}, [searchQuery, selectedSubject, showFavoritesOnly]);

	const fetchNotes = async () => {
		try {
			setLoading(true);
			const token = localStorage.getItem("token");
			const params = new URLSearchParams();

			if (selectedSubject !== "all") params.append("subject", selectedSubject);
			if (searchQuery) params.append("search", searchQuery);
			if (showFavoritesOnly) params.append("favorite", "true");

			const response = await fetch(
				`${
					import.meta.env.VITE_BACKEND_URL || "http://localhost:3000"
				}/api/notes?${params}`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
				}
			);

			const data = await response.json();
			if (data.success) {
				setNotes(data.notes);
				setError("");
			} else {
				setError(data.message || "Failed to fetch notes");
			}
		} catch (err) {
			console.error("Error fetching notes:", err);
			setError("Failed to fetch notes");
		} finally {
			setLoading(false);
		}
	};

	const createNewNote = async () => {
		try {
			const token = localStorage.getItem("token");
			const response = await fetch(
				`${
					import.meta.env.VITE_BACKEND_URL || "http://localhost:3000"
				}/api/notes`,
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						title: "Untitled Note",
						content: "",
					}),
				}
			);

			const data = await response.json();
			if (data.success) {
				setNotes((prev) => [data.note, ...prev]);
				setSelectedNote(data.note);
				setIsEditing(true);
			} else {
				setError(data.message || "Failed to create note");
			}
		} catch (err) {
			console.error("Error creating note:", err);
			setError("Failed to create note");
		}
	};

	const deleteNote = async (noteId) => {
		if (!window.confirm("Are you sure you want to delete this note?")) return;

		try {
			const token = localStorage.getItem("token");
			const response = await fetch(
				`${
					import.meta.env.VITE_BACKEND_URL || "http://localhost:3000"
				}/api/notes/${noteId}`,
				{
					method: "DELETE",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
				}
			);

			const data = await response.json();
			if (data.success) {
				setNotes((prev) => prev.filter((note) => note._id !== noteId));
				if (selectedNote?._id === noteId) {
					setSelectedNote(null);
					setIsEditing(false);
				}
			} else {
				setError(data.message || "Failed to delete note");
			}
		} catch (err) {
			console.error("Error deleting note:", err);
			setError("Failed to delete note");
		}
	};

	const selectNote = async (noteId) => {
		try {
			const token = localStorage.getItem("token");
			const response = await fetch(
				`${
					import.meta.env.VITE_BACKEND_URL || "http://localhost:3000"
				}/api/notes/${noteId}`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
				}
			);

			const data = await response.json();
			if (data.success) {
				setSelectedNote(data.note);
				setIsEditing(true);
			} else {
				setError(data.message || "Failed to fetch note");
			}
		} catch (err) {
			console.error("Error fetching note:", err);
			setError("Failed to fetch note");
		}
	};

	const toggleFavorite = async (noteId) => {
		try {
			const note = notes.find((n) => n._id === noteId);
			if (!note) return;

			const token = localStorage.getItem("token");

			const response = await fetch(
				`${
					import.meta.env.VITE_BACKEND_URL || "http://localhost:3000"
				}/api/notes/${noteId}`,
				{
					method: "PUT",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						...note,
						isFavorite: !note.isFavorite,
					}),
				}
			);

			const data = await response.json();
			if (data.success) {
				setNotes((prev) =>
					prev.map((n) =>
						n._id === noteId ? { ...n, isFavorite: !n.isFavorite } : n
					)
				);
			}
		} catch (err) {
			console.error("Error updating note:", err);
			setError("Failed to update note");
		}
	};

	const handleSaveNote = async (updatedNote) => {
		try {
			const token = localStorage.getItem("token");
			const response = await fetch(
				`${
					import.meta.env.VITE_BACKEND_URL || "http://localhost:3000"
				}/api/notes/${updatedNote._id}`,
				{
					method: "PUT",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify(updatedNote),
				}
			);

			const data = await response.json();
			if (data.success) {
				setNotes((prev) =>
					prev.map((n) => (n._id === updatedNote._id ? data.note : n))
				);
				setSelectedNote(data.note);
				setIsEditing(false);
			} else {
				setError(data.message || "Failed to save note");
			}
		} catch (err) {
			console.error("Error saving note:", err);
			setError("Failed to save note");
		}
	};

	// Show editor if editing
	if (selectedNote && isEditing) {
		return (
			<NoteEditor
				note={selectedNote}
				onSave={handleSaveNote}
				onCancel={() => {
					setSelectedNote(null);
					setIsEditing(false);
				}}
			/>
		);
	}

	return (
		<div className="w-full h-full flex items-center justify-center px-5 py-4 relative">
			{/* Background particles */}
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				{[...Array(20)].map((_, i) => (
					<div
						key={i}
						className="absolute animate-pulse"
						style={{
							left: `${Math.random() * 100}%`,
							top: `${Math.random() * 100}%`,
							animationDelay: `${Math.random() * 3}s`,
							animationDuration: `${2 + Math.random() * 2}s`,
						}}>
						<Star className="w-2 h-2 text-purple-400 opacity-60" />
					</div>
				))}
			</div>

			<div className="w-full relative z-10 m-4">
				{/* Header */}
				<div className="backdrop-blur-xl bg-black/40 border border-purple-500/30 rounded-3xl p-6 mb-8 shadow-2xl">
					<div className="flex flex-col lg:flex-row items-center gap-4">
						{/* Title */}
						<div className="flex items-center space-x-3 flex-shrink-0">
							<div className="bg-gradient-to-r from-purple-600 to-pink-600 p-2 rounded-lg shadow-lg">
								<FileText className="w-6 h-6 text-white" />
							</div>
							<h1 className="text-2xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
								<AutoText>My Notes</AutoText>
							</h1>
						</div>

						{/* Search */}
						<div className="relative flex-1 min-w-0">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
							<input
								type="text"
								placeholder="Search notes..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-full pl-10 pr-4 py-3 bg-white/10 border border-purple-500/30 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 backdrop-blur-sm transition-all duration-300"
							/>
						</div>

						{/* Subject Filter */}
						<div className="flex-shrink-0">
							<select
								value={selectedSubject}
								onChange={(e) => setSelectedSubject(e.target.value)}
								className="bg-white/10 border border-purple-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 backdrop-blur-sm transition-all duration-300 min-w-[140px]">
								<option value="all" className="bg-gray-800">
									All Subjects
								</option>
								{subjects.map((subject) => (
									<option key={subject} value={subject} className="bg-gray-800">
										{subject}
									</option>
								))}
							</select>
						</div>

						{/* Favorites Filter Button */}
						<button
							onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
							className={`flex items-center space-x-2 px-4 py-3 rounded-xl border transition-all duration-300 backdrop-blur-sm flex-shrink-0 ${
								showFavoritesOnly
									? "bg-yellow-500/20 border-yellow-500/50 text-yellow-200"
									: "bg-white/10 border-purple-500/30 text-white hover:bg-white/20"
							}`}>
							<Star
								className={`w-4 h-4 ${showFavoritesOnly ? "fill-current" : ""}`}
							/>
							<AutoText>Favorites</AutoText>
						</button>

						{/* New Note Button */}
						<button
							onClick={createNewNote}
							className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex-shrink-0">
							<Plus className="w-5 h-5" />
							<AutoText>New Note</AutoText>
						</button>
					</div>
				</div>

				{/* Notes Grid */}
				<div className="backdrop-blur-xl bg-black/40 border border-purple-500/30 rounded-3xl p-8 shadow-2xl">
					{loading ? (
						<div className="flex justify-center items-center h-64">
							<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
						</div>
					) : error ? (
						<div className="text-center text-red-400 py-8">
							<AutoText>{error}</AutoText>
						</div>
					) : notes.length === 0 ? (
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
							{notes.map((note) => (
								<div
									key={note._id}
									className="group p-6 bg-white/10 hover:bg-white/20 border border-purple-500/30 hover:border-purple-400/50 rounded-xl transition-all duration-300 backdrop-blur-sm hover:scale-105 hover:shadow-xl cursor-pointer"
									onClick={() => selectNote(note._id)}>
									{/* Note Header */}
									<div className="flex items-start justify-between mb-4">
										<div className="bg-gradient-to-r from-purple-600 to-pink-600 p-2 rounded-lg group-hover:scale-110 transition-transform duration-300">
											<FileText className="w-5 h-5 text-white" />
										</div>
										<div className="flex items-center space-x-1 opacity-70 group-hover:opacity-100 transition-opacity">
											<button
												onClick={(e) => {
													e.stopPropagation();
													toggleFavorite(note._id);
												}}
												className={`p-2 rounded-lg transition-all duration-200 ${
													note.isFavorite
														? "text-yellow-400 bg-yellow-400/20"
														: "text-white/60 hover:text-yellow-400 hover:bg-yellow-400/10"
												}`}>
												<Star
													className="w-4 h-4"
													fill={note.isFavorite ? "currentColor" : "none"}
												/>
											</button>
											<button
												onClick={(e) => {
													e.stopPropagation();
													deleteNote(note._id);
												}}
												className="p-2 rounded-lg text-white/60 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200">
												<Trash2 className="w-4 h-4" />
											</button>
										</div>
									</div>

									<h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-200 transition-colors duration-300 line-clamp-2">
										<AutoText>{note.title}</AutoText>
									</h3>

									{/* Note Preview */}
									<p className="text-white/70 text-sm mb-4 line-clamp-3">
										<AutoText>{getContentPreview(note.content)}</AutoText>
									</p>

									{/* Subject Badge */}
									<div className="flex items-center justify-between mb-3">
										<span className="px-3 py-1 bg-purple-600/30 text-purple-200 text-xs font-medium rounded-full">
											<AutoText>{note.subject}</AutoText>
										</span>
									</div>

									{/* Date */}
									<div className="flex items-center justify-between">
										<span className="text-white/50 text-xs flex items-center gap-1">
											<Calendar className="w-3 h-3" />
											<AutoText>
												{new Date(note.updatedAt).toLocaleDateString()}
											</AutoText>
										</span>
										<Edit3 className="w-4 h-4 text-white/40 group-hover:text-purple-400 transition-colors" />
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default Notes;
