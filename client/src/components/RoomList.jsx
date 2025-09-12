import React, { useState } from 'react';
import { Hash, Users, MessageSquare, Plus, Share2, Video } from 'lucide-react';
import ShareModal from './ShareModal';

const RoomList = ({ rooms, onRoomSelect, onRefresh }) => {
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedRoomForShare, setSelectedRoomForShare] = useState(null);

  const subjectColors = {
    'Mathematics': 'from-blue-500 to-blue-600',
    'Physics': 'from-green-500 to-green-600',
    'Chemistry': 'from-purple-500 to-purple-600',
    'Biology': 'from-emerald-500 to-emerald-600',
    'English': 'from-pink-500 to-pink-600',
    'History': 'from-orange-500 to-orange-600',
    'Geography': 'from-teal-500 to-teal-600',
    'General': 'from-gray-500 to-gray-600'
  };

  const handleShareRoom = (e, room) => {
    e.stopPropagation(); // Prevent room selection when clicking share
    setSelectedRoomForShare(room);
    setShareModalOpen(true);
  };

  return (
    <>
      <div className="lg:col-span-4">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Available Rooms</h2>
            <button
              onClick={onRefresh}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map(room => (
              <div
                key={room.roomId}
                onClick={() => onRoomSelect(room)}
                className="bg-white/5 hover:bg-white/10 border border-white/20 rounded-xl p-4 cursor-pointer transition-all duration-200 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`bg-gradient-to-r ${subjectColors[room.subject] || subjectColors.General} p-2 rounded-lg`}>
                    <Hash className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={(e) => handleShareRoom(e, room)}
                      className="opacity-0 group-hover:opacity-100 text-white/60 hover:text-white transition-all duration-200 p-1"
                      title="Share Room"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <h3 className="text-white font-semibold mb-2 line-clamp-1">
                  {room.name}
                </h3>
                
                <p className="text-white/60 text-sm mb-3 line-clamp-2">
                  {room.description || `Join the ${room.subject} discussion`}
                </p>
                
                <div className="flex items-center justify-between text-xs text-white/60">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{room.activeUsersCount || 0}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageSquare className="w-4 h-4" />
                      <span>{room.totalMessages || 0}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Video className="w-4 h-4" />
                      <span className="text-green-400">Available</span>
                    </div>
                  </div>
                  <span className="bg-white/10 px-2 py-1 rounded text-xs">
                    {room.subject}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          {rooms.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-white/40 mx-auto mb-4" />
              <p className="text-white/60">No chat rooms available</p>
            </div>
          )}
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        room={selectedRoomForShare}
      />
    </>
  );
};

export default RoomList;