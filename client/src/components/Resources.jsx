import React, { useState } from 'react';
import { ArrowLeft, BookOpen, GraduationCap, Library, FileText, Video, Download, Info } from 'lucide-react';
import AutoText from './AutoText';
import resourcesData from '../data/resourcesData';

const Resources = () => {
  const [currentView, setCurrentView] = useState('classes'); // classes, subjects, lessons, resources
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);

  const showResourceNotification = (type) => {
    const messages = {
      textbook: 'Textbooks will be available soon! We are working on uploading all curriculum-aligned PDF resources.',
      video: 'Educational videos will be integrated here! Coming soon with curated content from Khan Academy, BYJU\'S, and other educational platforms.',
      notes: 'Study notes will be available soon! We are creating comprehensive notes for all lessons.'
    };
    alert(messages[type]);
  };

  const handleClassSelect = (classNum) => {
    setSelectedClass(classNum);
    setCurrentView('subjects');
  };

  const handleSubjectSelect = (subject) => {
    setSelectedSubject(subject);
    setCurrentView('lessons');
  };

  const handleLessonSelect = (lesson) => {
    setSelectedLesson(lesson);
    setCurrentView('resources');
  };

  const handleBack = () => {
    if (currentView === 'resources') {
      setCurrentView('lessons');
      setSelectedLesson(null);
    } else if (currentView === 'lessons') {
      setCurrentView('subjects');
      setSelectedSubject(null);
    } else if (currentView === 'subjects') {
      setCurrentView('classes');
      setSelectedClass(null);
    }
  };

  const getSubjectIcon = (subjectName) => {
    switch (subjectName.toLowerCase()) {
      case 'english':
        return BookOpen;
      case 'mathematics':
        return GraduationCap;
      case 'science':
        return Library;
      case 'social studies':
        return FileText;
      default:
        return BookOpen;
    }
  };

  const getSubjectColor = (subjectName) => {
    switch (subjectName.toLowerCase()) {
      case 'english':
        return 'from-blue-500 to-cyan-500';
      case 'mathematics':
        return 'from-green-500 to-emerald-500';
      case 'science':
        return 'from-purple-500 to-pink-500';
      case 'social studies':
        return 'from-orange-500 to-red-500';
      default:
        return 'from-gray-500 to-slate-500';
    }
  };

  const renderClasses = () => (
    <div className="w-full h-full flex items-center justify-center px-5 py-4 relative">
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
            <BookOpen className="w-2 h-2 text-purple-400 opacity-60" />
          </div>
        ))}
      </div>

      <div className="w-full relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="backdrop-blur-xl bg-black/40 border border-purple-500/30 rounded-3xl p-8 mb-8 shadow-2xl">
          <div className="flex items-center space-x-4 mb-4">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-full shadow-lg">
              <Library className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                <AutoText>Learning Resources</AutoText>
              </h1>
              <p className="text-white/80 text-lg mt-2">
                <AutoText>Choose your class to access comprehensive study materials</AutoText>
              </p>
            </div>
          </div>
        </div>

        {/* Classes Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Object.keys(resourcesData.classes).map((classNum) => (
            <div
              key={classNum}
              onClick={() => handleClassSelect(classNum)}
              className="group backdrop-blur-xl bg-black/40 border border-purple-500/30 hover:border-purple-400/60 rounded-2xl p-8 shadow-2xl cursor-pointer transition-all duration-300 hover:scale-105 hover:bg-black/50"
            >
              <div className="text-center">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-full shadow-lg mx-auto mb-4 w-20 h-20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl font-bold text-white">
                    {classNum}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-200 transition-colors duration-300">
                  <AutoText>Class {classNum}</AutoText>
                </h3>
                <p className="text-white/70 text-sm">
                  <AutoText>
                    {resourcesData.classes[classNum].subjects.length} subjects available
                  </AutoText>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSubjects = () => (
    <div className="w-full h-full flex items-center justify-center px-5 py-4 relative">
      <div className="w-full relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="backdrop-blur-xl bg-black/40 border border-purple-500/30 rounded-3xl p-8 mb-8 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="bg-gradient-to-r from-purple-600 to-pink-600 p-3 rounded-full shadow-lg hover:scale-110 transition-transform duration-300"
              >
                <ArrowLeft className="w-6 h-6 text-white" />
              </button>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                  <AutoText>Class {selectedClass} - Subjects</AutoText>
                </h1>
                <p className="text-white/80 text-lg mt-2">
                  <AutoText>Select a subject to explore lessons</AutoText>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Subjects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {resourcesData.classes[selectedClass].subjects.map((subject) => {
            const IconComponent = getSubjectIcon(subject.name);
            const colorClass = getSubjectColor(subject.name);
            
            return (
              <div
                key={subject.name}
                onClick={() => handleSubjectSelect(subject)}
                className="group backdrop-blur-xl bg-black/40 border border-purple-500/30 hover:border-purple-400/60 rounded-2xl p-8 shadow-2xl cursor-pointer transition-all duration-300 hover:scale-105 hover:bg-black/50"
              >
                <div className="text-center">
                  <div className={`bg-gradient-to-r ${colorClass} p-6 rounded-full shadow-lg mx-auto mb-4 w-20 h-20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-200 transition-colors duration-300">
                    <AutoText>{subject.name}</AutoText>
                  </h3>
                  <p className="text-white/70 text-sm">
                    <AutoText>
                      {subject.lessons.length} lessons available
                    </AutoText>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderLessons = () => (
    <div className="w-full h-full flex items-center justify-center px-5 py-4 relative">
      <div className="w-full relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="backdrop-blur-xl bg-black/40 border border-purple-500/30 rounded-3xl p-8 mb-8 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="bg-gradient-to-r from-purple-600 to-pink-600 p-3 rounded-full shadow-lg hover:scale-110 transition-transform duration-300"
              >
                <ArrowLeft className="w-6 h-6 text-white" />
              </button>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                  <AutoText>Class {selectedClass} - {selectedSubject.name}</AutoText>
                </h1>
                <p className="text-white/80 text-lg mt-2">
                  <AutoText>Choose a lesson to access resources</AutoText>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Lessons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {selectedSubject.lessons.map((lesson, index) => {
            const colorClass = getSubjectColor(selectedSubject.name);
            
            return (
              <div
                key={index}
                onClick={() => handleLessonSelect(lesson)}
                className="group backdrop-blur-xl bg-black/40 border border-purple-500/30 hover:border-purple-400/60 rounded-2xl p-6 shadow-2xl cursor-pointer transition-all duration-300 hover:scale-105 hover:bg-black/50"
              >
                <div className="flex items-start space-x-4">
                  <div className={`bg-gradient-to-r ${colorClass} p-3 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300 shrink-0`}>
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-200 transition-colors duration-300 leading-tight">
                      <AutoText>{lesson.title}</AutoText>
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-white/70">
                      <div className="flex items-center space-x-1">
                        <FileText className="w-4 h-4" />
                        <span><AutoText>Textbook</AutoText></span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Video className="w-4 h-4" />
                        <span><AutoText>Video</AutoText></span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Download className="w-4 h-4" />
                        <span><AutoText>Notes</AutoText></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderResources = () => (
    <div className="w-full h-full flex items-center justify-center px-5 py-4 relative">
      <div className="w-full relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="backdrop-blur-xl bg-black/40 border border-purple-500/30 rounded-3xl p-8 mb-8 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="bg-gradient-to-r from-purple-600 to-pink-600 p-3 rounded-full shadow-lg hover:scale-110 transition-transform duration-300"
              >
                <ArrowLeft className="w-6 h-6 text-white" />
              </button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                  <AutoText>{selectedLesson.title}</AutoText>
                </h1>
                <p className="text-white/80 text-lg mt-2">
                  <AutoText>Class {selectedClass} - {selectedSubject.name}</AutoText>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Resources Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Textbook */}
          <div className="group backdrop-blur-xl bg-black/40 border border-blue-500/30 hover:border-blue-400/60 rounded-2xl p-8 shadow-2xl transition-all duration-300 hover:scale-105 hover:bg-black/50">
            <div className="text-center">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-6 rounded-full shadow-lg mx-auto mb-6 w-20 h-20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-blue-200 transition-colors duration-300">
                <AutoText>Textbook</AutoText>
              </h3>
              <p className="text-white/70 mb-6 text-sm">
                <AutoText>Official curriculum textbook in PDF format</AutoText>
              </p>
              <a
                href={selectedLesson.resources.textbook}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Download className="w-5 h-5" />
                <span><AutoText>View Textbook</AutoText></span>
              </a>
            </div>
          </div>

          {/* Video */}
          <div className="group backdrop-blur-xl bg-black/40 border border-red-500/30 hover:border-red-400/60 rounded-2xl p-8 shadow-2xl transition-all duration-300 hover:scale-105 hover:bg-black/50">
            <div className="text-center">
              <div className="bg-gradient-to-r from-red-500 to-pink-500 p-6 rounded-full shadow-lg mx-auto mb-6 w-20 h-20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Video className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-red-200 transition-colors duration-300">
                <AutoText>Video Lesson</AutoText>
              </h3>
              <p className="text-white/70 mb-6 text-sm">
                <AutoText>Interactive video explanation with animations</AutoText>
              </p>
              {selectedLesson.resources.video.includes('youtube.com') ? (
                <a
                  href={selectedLesson.resources.video}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-3 rounded-xl hover:from-red-600 hover:to-pink-600 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Video className="w-5 h-5" />
                  <span><AutoText>Watch Video</AutoText></span>
                </a>
              ) : (
                <button
                  onClick={() => showResourceNotification('video')}
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-3 rounded-xl hover:from-red-600 hover:to-pink-600 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Video className="w-5 h-5" />
                  <span><AutoText>Coming Soon</AutoText></span>
                </button>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="group backdrop-blur-xl bg-black/40 border border-green-500/30 hover:border-green-400/60 rounded-2xl p-8 shadow-2xl transition-all duration-300 hover:scale-105 hover:bg-black/50">
            <div className="text-center">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 rounded-full shadow-lg mx-auto mb-6 w-20 h-20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-green-200 transition-colors duration-300">
                <AutoText>Study Notes</AutoText>
              </h3>
              <p className="text-white/70 mb-6 text-sm">
                <AutoText>Comprehensive study notes and key points</AutoText>
              </p>
              <button
                onClick={() => showResourceNotification('notes')}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Download className="w-5 h-5" />
                <span><AutoText>Coming Soon</AutoText></span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCurrentView = () => {
    switch (currentView) {
      case 'classes':
        return renderClasses();
      case 'subjects':
        return renderSubjects();
      case 'lessons':
        return renderLessons();
      case 'resources':
        return renderResources();
      default:
        return renderClasses();
    }
  };

  return renderCurrentView();
};

export default Resources;