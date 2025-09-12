import React, { useState } from 'react';
import { Copy, Video, Shield, Users, Clock } from 'lucide-react';

const VideoCallInvite = ({ room, isVisible, onClose }) => {
  const [copied, setCopied] = useState(false);

  const inviteLink = `${window.location.origin}/community?join=${room?.roomId}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!isVisible || !room) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-md w-full">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-3 rounded-lg">
            <Video className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-white font-semibold">Invite to Video Call</h2>
            <p className="text-white/60 text-sm">{room.name}</p>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center space-x-3 bg-white/5 rounded-lg p-3">
            <Shield className="w-5 h-5 text-yellow-400" />
            <div>
              <p className="text-white text-sm font-medium">Moderated Room</p>
              <p className="text-white/60 text-xs">First person to join becomes moderator</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 bg-white/5 rounded-lg p-3">
            <Clock className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-white text-sm font-medium">Lobby System</p>
              <p className="text-white/60 text-xs">Others wait for moderator approval</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 bg-white/5 rounded-lg p-3">
            <Users className="w-5 h-5 text-green-400" />
            <div>
              <p className="text-white text-sm font-medium">Study Group</p>
              <p className="text-white/60 text-xs">Perfect for collaborative learning</p>
            </div>
          </div>
        </div>

        {/* Invite Link */}
        <div className="mb-6">
          <label className="block text-white text-sm font-medium mb-2">
            Share this link
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={inviteLink}
              readOnly
              className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
            />
            <button
              onClick={copyToClipboard}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                copied 
                  ? 'bg-green-600 text-white' 
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              <Copy className="w-4 h-4" />
              <span className="text-sm">{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
          <h3 className="text-blue-400 font-medium text-sm mb-2">How it works:</h3>
          <ul className="text-blue-300 text-xs space-y-1">
            <li>• First person to join becomes the moderator</li>
            <li>• Moderator can join immediately without approval</li>
            <li>• Others joining via link will wait in lobby</li>
            <li>• Moderator can admit or reject waiting participants</li>
            <li>• If moderator leaves, next person becomes moderator</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-white/60 hover:text-white transition-colors"
          >
            Close
          </button>
          <button
            onClick={copyToClipboard}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-lg transition-all duration-200"
          >
            Copy Invite Link
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCallInvite;