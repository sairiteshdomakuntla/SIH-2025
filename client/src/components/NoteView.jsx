// import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { 
//   ArrowLeft, 
//   Edit3, 
//   Star, 
//   Share2, 
//   Trash2, 
//   FileText, 
//   Book,
//   Calendar,
//   Tag,
//   Maximize,
//   Minimize
// } from 'lucide-react';
// import AutoText from './AutoText';
// import NoteEditor from './NoteEditor';

// const NoteView = () => {
//   const { slug } = useParams();
//   const navigate = useNavigate();
//   const [note, setNote] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [isEditing, setIsEditing] = useState(false);
//   const [isFullscreen, setIsFullscreen] = useState(false);

//   // Function to generate slug from title
//   const generateSlug = (title) => {
//     return title
//       .toLowerCase()
//       .replace(/[^\w\s-]/g, '') // Remove special characters
//       .replace(/\s+/g, '-') // Replace spaces with dashes
//       .replace(/-+/g, '-') // Replace multiple dashes with single dash
//       .trim('-'); // Remove leading/trailing dashes
//   };

//   useEffect(() => {
//     if (slug) {
//       fetchNote();
//     }
//   }, [slug]);

//   // Update URL if note slug doesn't match current slug in URL
//   useEffect(() => {
//     if (note && note.slug && note.slug !== slug) {
//       navigate(`/note/${note.slug}`, { replace: true });
//     }
//   }, [note, slug, navigate]);

//   useEffect(() => {
//     const handleKeyDown = (event) => {
//       if (event.key === "Escape" && isFullscreen) {
//         setIsFullscreen(false);
//       }
//     };

//     if (isFullscreen) {
//       document.addEventListener("keydown", handleKeyDown);
//       document.body.style.overflow = "hidden";
//     } else {
//       document.body.style.overflow = "auto";
//     }

//     return () => {
//       document.removeEventListener("keydown", handleKeyDown);
//       document.body.style.overflow = "auto";
//     };
//   }, [isFullscreen]);

//   const fetchNote = async () => {
//     try {
//       setLoading(true);
//       const token = localStorage.getItem('token');
//       const response = await fetch(
//         `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api/notes/slug/${slug}`,
//         {
//           headers: {
//             'Authorization': `Bearer ${token}`,
//             'Content-Type': 'application/json'
//           }
//         }
//       );

//       if (!response.ok) {
//         if (response.status === 404) {
//           throw new Error('Note not found');
//         }
//         throw new Error('Failed to fetch note');
//       }

//       const data = await response.json();
//       setNote(data);
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const toggleFavorite = async () => {
//     try {
//       const token = localStorage.getItem('token');
//       const response = await fetch(
//         `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api/notes/${note._id}/favorite`,
//         {
//           method: 'PUT',
//           headers: {
//             'Authorization': `Bearer ${token}`,
//             'Content-Type': 'application/json'
//           }
//         }
//       );

//       if (response.ok) {
//         setNote(prev => ({ ...prev, isFavorite: !prev.isFavorite }));
//       }
//     } catch (err) {
//       console.error('Failed to toggle favorite:', err);
//     }
//   };

//   const deleteNote = async () => {
//     if (!confirm('Are you sure you want to delete this note?')) return;

//     try {
//       const token = localStorage.getItem('token');
//       const response = await fetch(
//         `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api/notes/${note._id}`,
//         {
//           method: 'DELETE',
//           headers: {
//             'Authorization': `Bearer ${token}`,
//             'Content-Type': 'application/json'
//           }
//         }
//       );

//       if (response.ok) {
//         navigate('/notes');
//       }
//     } catch (err) {
//       console.error('Failed to delete note:', err);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="w-full h-full flex items-center justify-center p-4 relative">
//         {/* Animated particles */}
//         <div className="absolute inset-0 overflow-hidden pointer-events-none">
//           {[...Array(20)].map((_, i) => (
//             <div
//               key={i}
//               className="absolute animate-pulse"
//               style={{
//                 left: `${Math.random() * 100}%`,
//                 top: `${Math.random() * 100}%`,
//                 animationDelay: `${Math.random() * 3}s`,
//                 animationDuration: `${2 + Math.random() * 2}s`
//               }}
//             >
//               <Star className="w-2 h-2 text-pink-400 opacity-60" />
//             </div>
//           ))}
//         </div>

//         <div className="backdrop-blur-xl bg-black/40 border border-purple-500/30 rounded-3xl p-8 shadow-2xl relative overflow-hidden w-full max-w-md">
//           <div className="flex items-center justify-center space-x-3 mb-4">
//             <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-full shadow-lg">
//               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
//             </div>
//           </div>
//           <div className="text-center">
//             <AutoText className="text-3xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent mb-2">
//               Loading Note
//             </AutoText>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="w-full h-full flex items-center justify-center p-4 relative">
//         {/* Animated particles */}
//         <div className="absolute inset-0 overflow-hidden pointer-events-none">
//           {[...Array(20)].map((_, i) => (
//             <div
//               key={i}
//               className="absolute animate-pulse"
//               style={{
//                 left: `${Math.random() * 100}%`,
//                 top: `${Math.random() * 100}%`,
//                 animationDelay: `${Math.random() * 3}s`,
//                 animationDuration: `${2 + Math.random() * 2}s`
//               }}
//             >
//               <Star className="w-2 h-2 text-pink-400 opacity-60" />
//             </div>
//           ))}
//         </div>

//         <div className="backdrop-blur-xl bg-black/40 border border-purple-500/30 rounded-3xl p-8 shadow-2xl relative overflow-hidden w-full max-w-md">
//           <div className="flex items-center justify-center space-x-3 mb-4">
//             <div className="bg-gradient-to-r from-red-600 to-pink-600 p-4 rounded-full shadow-lg">
//               <FileText className="w-8 h-8 text-white" />
//             </div>
//           </div>
//           <div className="text-center">
//             <AutoText className="text-3xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent mb-2">
//               Note Not Found
//             </AutoText>
//             <p className="text-white/80 mb-4">{error}</p>
//             <button
//               onClick={() => navigate('/notes')}
//               className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
//             >
//               Back to Notes
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (isEditing) {
//     return (
//       <div className="fixed inset-0 z-50">
//         <NoteEditor
//           note={note}
//           onSave={(updatedNote) => {
//             setNote(updatedNote);
//             setIsEditing(false);
//             // Update URL if slug changed due to title change
//             if (updatedNote.slug && updatedNote.slug !== slug) {
//               navigate(`/note/${updatedNote.slug}`, { replace: true });
//             }
//           }}
//           onCancel={() => setIsEditing(false)}
//         />
//       </div>
//     );
//   }

//   return (
//     <div className={`${isFullscreen ? 'fixed inset-0 z-50' : 'w-full h-full'} flex items-center justify-center px-5 py-4 relative`}>
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

//       <div className="backdrop-blur-xl bg-black/40 border border-purple-500/30 rounded-3xl shadow-2xl relative overflow-hidden w-full h-full">
//         {/* Header */}
//         <div className="flex items-center justify-between p-6 border-b border-purple-500/30 bg-black/20 backdrop-blur-lg">
//           <div className="flex items-center space-x-6">
//             <button
//               onClick={() => navigate('/notes')}
//               className="group p-3 bg-white/10 hover:bg-white/20 border border-purple-500/30 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg"
//             >
//               <ArrowLeft className="w-5 h-5 text-white group-hover:text-purple-200 transition-colors duration-300" />
//             </button>
//             <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-2xl shadow-lg transform hover:scale-110 transition-transform duration-300">
//               <FileText className="w-7 h-7 text-white" />
//             </div>
//             <div className="space-y-2">
//               <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
//                 <AutoText>{note.title}</AutoText>
//               </h1>
//               <div className="flex items-center space-x-6 text-white/60 text-sm">
//                 <div className="flex items-center space-x-2 px-3 py-1 bg-purple-600/20 rounded-full">
//                   <Book className="w-4 h-4 text-purple-400" />
//                   <AutoText>{note.subject}</AutoText>
//                 </div>
//                 <div className="flex items-center space-x-2 px-3 py-1 bg-pink-600/20 rounded-full">
//                   <Calendar className="w-4 h-4 text-pink-400" />
//                   <AutoText>{new Date(note.lastModified).toLocaleDateString()}</AutoText>
//                 </div>
//                 {note.tags && note.tags.length > 0 && (
//                   <div className="flex items-center space-x-2 px-3 py-1 bg-blue-600/20 rounded-full">
//                     <Tag className="w-4 h-4 text-blue-400" />
//                     <AutoText>{note.tags.length} tags</AutoText>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>

//           <div className="flex items-center space-x-4">
//             <button
//               onClick={toggleFavorite}
//               className={`group p-4 rounded-xl transition-all duration-300 transform hover:scale-105 ${
//                 note.isFavorite
//                   ? 'bg-yellow-600/30 border-yellow-500/50 text-yellow-200 shadow-lg shadow-yellow-500/20'
//                   : 'bg-white/10 hover:bg-yellow-400/20 border-white/20 hover:border-yellow-400/50 text-white hover:text-yellow-200'
//               } border backdrop-blur-sm`}
//             >
//               <Star className={`w-5 h-5 transition-all duration-300 ${note.isFavorite ? 'fill-current scale-110' : 'group-hover:scale-110'}`} />
//             </button>
//             <button
//               onClick={() => setIsEditing(true)}
//               className="group p-4 bg-white/10 hover:bg-blue-500/20 border border-purple-500/30 hover:border-blue-400/50 rounded-xl transition-all duration-300 text-white hover:text-blue-200 transform hover:scale-105 backdrop-blur-sm"
//             >
//               <Edit3 className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
//             </button>
//             <button
//               onClick={() => setIsFullscreen(!isFullscreen)}
//               className="group p-4 bg-white/10 hover:bg-purple-500/20 border border-purple-500/30 hover:border-purple-400/50 rounded-xl transition-all duration-300 text-white hover:text-purple-200 transform hover:scale-105 backdrop-blur-sm"
//             >
//               {isFullscreen ? 
//                 <Minimize className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" /> : 
//                 <Maximize className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
//               }
//             </button>
//             <button
//               onClick={deleteNote}
//               className="group p-4 bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 hover:border-red-400/70 rounded-xl transition-all duration-300 text-red-400 hover:text-red-300 transform hover:scale-105 backdrop-blur-sm shadow-lg shadow-red-500/10"
//             >
//               <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
//             </button>
//           </div>
//         </div>

//         {/* Content */}
//         <div className="flex-1 p-8 overflow-auto bg-gradient-to-b from-transparent to-black/10">
//           <div className="max-w-5xl mx-auto">
//             {/* Tags */}
//             {note.tags && note.tags.length > 0 && (
//               <div className="flex flex-wrap gap-3 mb-8">
//                 {note.tags.map((tag, index) => (
//                   <span
//                     key={index}
//                     className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600/30 to-pink-600/30 text-purple-200 text-sm rounded-full border border-purple-500/30 backdrop-blur-sm hover:scale-105 transition-transform duration-300 shadow-lg"
//                   >
//                     <Tag className="w-4 h-4" />
//                     <AutoText>{tag}</AutoText>
//                   </span>
//                 ))}
//               </div>
//             )}

//             {/* Note Content */}
//             <div className="prose prose-invert prose-lg max-w-none">
//               <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/20 shadow-2xl">
//               {note.content?.blocks?.length > 0 ? (
//                 <div className="space-y-4">
//                   {note.content.blocks.map((block, index) => {
//                     switch (block.type) {
//                       case 'header':
//                         const HeaderTag = `h${block.data.level}`;
//                         return (
//                           <HeaderTag
//                             key={index}
//                             className={`font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent ${
//                               block.data.level === 1 ? 'text-4xl mb-6' :
//                               block.data.level === 2 ? 'text-3xl mb-4' :
//                               block.data.level === 3 ? 'text-2xl mb-3' : 'text-xl mb-2'
//                             }`}
//                           >
//                             <AutoText>{block.data.text}</AutoText>
//                           </HeaderTag>
//                         );
//                       case 'paragraph':
//                         return (
//                           <p key={index} className="text-white/85 leading-relaxed text-lg mb-4">
//                             <AutoText>{block.data.text}</AutoText>
//                           </p>
//                         );
//                       case 'list':
//                         return block.data.style === 'ordered' ? (
//                           <ol key={index} className="text-white/85 space-y-2 pl-8 mb-4 text-lg">
//                             {block.data.items.map((item, itemIndex) => (
//                               <li key={itemIndex} className="relative">
//                                 <span className="absolute -left-6 top-0 w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white text-sm flex items-center justify-center font-bold">
//                                   {itemIndex + 1}
//                                 </span>
//                                 <AutoText>{item}</AutoText>
//                               </li>
//                             ))}
//                           </ol>
//                         ) : (
//                           <ul key={index} className="text-white/85 space-y-2 pl-8 mb-4 text-lg">
//                             {block.data.items.map((item, itemIndex) => (
//                               <li key={itemIndex} className="relative">
//                                 <span className="absolute -left-6 top-2 w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></span>
//                                 <AutoText>{item}</AutoText>
//                               </li>
//                             ))}
//                           </ul>
//                         );
//                       default:
//                         return (
//                           <div key={index} className="text-white/60 italic">
//                             <AutoText>Unsupported block type: {block.type}</AutoText>
//                           </div>
//                         );
//                     }
//                   })}
//                 </div>
//               ) : (
//                 <div className="text-center py-16">
//                   <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 p-8 rounded-full w-32 h-32 mx-auto mb-6 flex items-center justify-center">
//                     <FileText className="w-16 h-16 text-white/40" />
//                   </div>
//                   <h3 className="text-2xl font-semibold text-white/70 mb-2">
//                     <AutoText>This note is empty</AutoText>
//                   </h3>
//                   <p className="text-white/50 mb-6">
//                     <AutoText>Click the edit button to start writing</AutoText>
//                   </p>
//                   <button
//                     onClick={() => setIsEditing(true)}
//                     className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg"
//                   >
//                     Start Writing
//                   </button>
//                 </div>
//               )}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default NoteView;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit3, 
  Star, 
  Share2, 
  Trash2, 
  FileText, 
  Book,
  Calendar,
  Tag,
  Maximize,
  Minimize
} from 'lucide-react';
import AutoText from './AutoText';
import NoteEditor from './NoteEditor';

const NoteView = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Function to generate slug from title
  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with dashes
      .replace(/-+/g, '-') // Replace multiple dashes with single dash
      .trim('-'); // Remove leading/trailing dashes
  };

  useEffect(() => {
    if (slug) {
      fetchNote();
    }
  }, [slug]);

  // Update URL if note slug doesn't match current slug in URL
  useEffect(() => {
    if (note && note.slug && note.slug !== slug) {
      navigate(`/note/${note.slug}`, { replace: true });
    }
  }, [note, slug, navigate]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    if (isFullscreen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [isFullscreen]);

  const fetchNote = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api/notes/slug/${slug}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Note not found');
        }
        throw new Error('Failed to fetch note');
      }

      const data = await response.json();
      setNote(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api/notes/${note._id}/favorite`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        setNote(prev => ({ ...prev, isFavorite: !prev.isFavorite }));
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const deleteNote = async () => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api/notes/${note._id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        navigate('/notes');
      }
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center p-4 relative">
        {/* Animated particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
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
              <Star className="w-2 h-2 text-pink-400 opacity-60" />
            </div>
          ))}
        </div>

        <div className="backdrop-blur-xl bg-black/40 border border-purple-500/30 rounded-3xl p-8 shadow-2xl relative overflow-hidden w-full max-w-md">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-full shadow-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          </div>
          <div className="text-center">
            <AutoText className="text-3xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent mb-2">
              Loading Note
            </AutoText>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center p-4 relative">
        {/* Animated particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
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
              <Star className="w-2 h-2 text-pink-400 opacity-60" />
            </div>
          ))}
        </div>

        <div className="backdrop-blur-xl bg-black/40 border border-purple-500/30 rounded-3xl p-8 shadow-2xl relative overflow-hidden w-full max-w-md">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="bg-gradient-to-r from-red-600 to-pink-600 p-4 rounded-full shadow-lg">
              <FileText className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="text-center">
            <AutoText className="text-3xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent mb-2">
              Note Not Found
            </AutoText>
            <p className="text-white/80 mb-4">{error}</p>
            <button
              onClick={() => navigate('/notes')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
            >
              Back to Notes
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="fixed inset-0 z-50">
        <NoteEditor
          note={note}
          onSave={(updatedNote) => {
            setNote(updatedNote);
            setIsEditing(false);
            // Update URL if slug changed due to title change
            if (updatedNote.slug && updatedNote.slug !== slug) {
              navigate(`/note/${updatedNote.slug}`, { replace: true });
            }
          }}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50' : 'w-full h-full'} flex items-center justify-center px-5 py-4 relative`}>
      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
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
            <Star className="w-2 h-2 text-pink-400 opacity-60" />
          </div>
        ))}
      </div>

      <div className="backdrop-blur-xl bg-black/40 border border-purple-500/30 rounded-3xl shadow-2xl relative overflow-hidden w-full h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-purple-500/30 bg-black/20 backdrop-blur-lg">
          <div className="flex items-center space-x-6">
            <button
              onClick={() => navigate('/notes')}
              className="group p-3 bg-white/10 hover:bg-white/20 border border-purple-500/30 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              <ArrowLeft className="w-5 h-5 text-white group-hover:text-purple-200 transition-colors duration-300" />
            </button>
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-2xl shadow-lg transform hover:scale-110 transition-transform duration-300">
              <FileText className="w-7 h-7 text-white" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
                <AutoText>{note.title}</AutoText>
              </h1>
              <div className="flex items-center space-x-6 text-white/60 text-sm">
                <div className="flex items-center space-x-2 px-3 py-1 bg-purple-600/20 rounded-full">
                  <Book className="w-4 h-4 text-purple-400" />
                  <AutoText>{note.subject}</AutoText>
                </div>
                <div className="flex items-center space-x-2 px-3 py-1 bg-pink-600/20 rounded-full">
                  <Calendar className="w-4 h-4 text-pink-400" />
                  <AutoText>{new Date(note.lastModified).toLocaleDateString()}</AutoText>
                </div>
                {note.tags && note.tags.length > 0 && (
                  <div className="flex items-center space-x-2 px-3 py-1 bg-blue-600/20 rounded-full">
                    <Tag className="w-4 h-4 text-blue-400" />
                    <AutoText>{note.tags.length} tags</AutoText>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={toggleFavorite}
              className={`group p-4 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                note.isFavorite
                  ? 'bg-yellow-600/30 border-yellow-500/50 text-yellow-200 shadow-lg shadow-yellow-500/20'
                  : 'bg-white/10 hover:bg-yellow-400/20 border-white/20 hover:border-yellow-400/50 text-white hover:text-yellow-200'
              } border backdrop-blur-sm`}
            >
              <Star className={`w-5 h-5 transition-all duration-300 ${note.isFavorite ? 'fill-current scale-110' : 'group-hover:scale-110'}`} />
            </button>
            <button
              onClick={() => setIsEditing(true)}
              className="group p-4 bg-white/10 hover:bg-blue-500/20 border border-purple-500/30 hover:border-blue-400/50 rounded-xl transition-all duration-300 text-white hover:text-blue-200 transform hover:scale-105 backdrop-blur-sm"
            >
              <Edit3 className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="group p-4 bg-white/10 hover:bg-purple-500/20 border border-purple-500/30 hover:border-purple-400/50 rounded-xl transition-all duration-300 text-white hover:text-purple-200 transform hover:scale-105 backdrop-blur-sm"
            >
              {isFullscreen ? 
                <Minimize className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" /> : 
                <Maximize className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
              }
            </button>
            <button
              onClick={deleteNote}
              className="group p-4 bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 hover:border-red-400/70 rounded-xl transition-all duration-300 text-red-400 hover:text-red-300 transform hover:scale-105 backdrop-blur-sm shadow-lg shadow-red-500/10"
            >
              <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-8 overflow-auto bg-gradient-to-b from-transparent to-black/10">
          <div className="max-w-5xl mx-auto">
            {/* Tags */}
            {note.tags && note.tags.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-8">
                {note.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600/30 to-pink-600/30 text-purple-200 text-sm rounded-full border border-purple-500/30 backdrop-blur-sm hover:scale-105 transition-transform duration-300 shadow-lg"
                  >
                    <Tag className="w-4 h-4" />
                    <AutoText>{tag}</AutoText>
                  </span>
                ))}
              </div>
            )}

            {/* Note Content */}
            <div className="prose prose-invert prose-lg max-w-none">
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/20 shadow-2xl">
              {note.content?.blocks?.length > 0 ? (
                <div className="space-y-4">
                  {note.content.blocks.map((block, index) => {
                    switch (block.type) {
                      case 'header':
                        const HeaderTag = `h${block.data.level}`;
                        return (
                          <HeaderTag
                            key={index}
                            className={`font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent ${
                              block.data.level === 1 ? 'text-4xl mb-6' :
                              block.data.level === 2 ? 'text-3xl mb-4' :
                              block.data.level === 3 ? 'text-2xl mb-3' : 'text-xl mb-2'
                            }`}
                          >
                            <AutoText>{block.data.text}</AutoText>
                          </HeaderTag>
                        );
                      case 'paragraph':
                        return (
                          <p key={index} className="text-white/85 leading-relaxed text-lg mb-4">
                            <AutoText>{block.data.text}</AutoText>
                          </p>
                        );
                      case 'list':
                        return block.data.style === 'ordered' ? (
                          <ol key={index} className="text-white/85 space-y-2 pl-8 mb-4 text-lg">
                            {block.data.items.map((item, itemIndex) => (
                              <li key={itemIndex} className="relative">
                                <span className="absolute -left-6 top-0 w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white text-sm flex items-center justify-center font-bold">
                                  {itemIndex + 1}
                                </span>
                                <AutoText>{item}</AutoText>
                              </li>
                            ))}
                          </ol>
                        ) : (
                          <ul key={index} className="text-white/85 space-y-2 pl-8 mb-4 text-lg">
                            {block.data.items.map((item, itemIndex) => (
                              <li key={itemIndex} className="relative">
                                <span className="absolute -left-6 top-2 w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></span>
                                <AutoText>{item}</AutoText>
                              </li>
                            ))}
                          </ul>
                        );
                      default:
                        return (
                          <div key={index} className="text-white/60 italic">
                            <AutoText>Unsupported block type: {block.type}</AutoText>
                          </div>
                        );
                    }
                  })}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 p-8 rounded-full w-32 h-32 mx-auto mb-6 flex items-center justify-center">
                    <FileText className="w-16 h-16 text-white/40" />
                  </div>
                  <h3 className="text-2xl font-semibold text-white/70 mb-2">
                    <AutoText>This note is empty</AutoText>
                  </h3>
                  <p className="text-white/50 mb-6">
                    <AutoText>Click the edit button to start writing</AutoText>
                  </p>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg"
                  >
                    Start Writing
                  </button>
                </div>
              )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteView;
