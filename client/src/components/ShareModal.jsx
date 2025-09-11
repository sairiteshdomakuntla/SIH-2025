import React, { useState } from 'react';
import { 
  X, Copy, Share2, Mail, MessageCircle, 
  Facebook, Twitter, Linkedin, Check 
} from 'lucide-react';

const ShareModal = ({ isOpen, onClose, room }) => {
  const [copied, setCopied] = useState(false);
  const [shareMethod, setShareMethod] = useState('link');

  if (!isOpen || !room) return null;

  const shareUrl = `${window.location.origin}/community?join=${room.roomId}`;
  const shareText = `Join me in the "${room.name}" chat room on our learning platform! Subject: ${room.subject}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleShare = (platform) => {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(shareText);

    const shareUrls = {
      email: `mailto:?subject=${encodeURIComponent(`Join "${room.name}" Chat Room`)}&body=${encodedText}%0A%0A${encodedUrl}`,
      whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
    };

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join "${room.name}" Chat Room`,
          text: shareText,
          url: shareUrl
        });
      } catch (error) {
        console.error('Native share failed:', error);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 border border-white/20 rounded-2xl max-w-md w-full">
        {/* Header */}
        <div className="p-6 border-b border-white/20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-2 rounded-lg">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Share Room</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Room Info */}
          <div className="bg-white/10 rounded-lg p-4">
            <h3 className="text-white font-medium mb-1">{room.name}</h3>
            <p className="text-white/60 text-sm">{room.subject}</p>
            {room.description && (
              <p className="text-white/80 text-sm mt-2">{room.description}</p>
            )}
          </div>

          {/* Share Methods */}
          <div className="space-y-4">
            {/* Copy Link */}
            <div>
              <label className="block text-white font-medium mb-2">Share Link</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                />
                <button
                  onClick={handleCopyLink}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span className="text-sm">{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Native Share (if supported) */}
            {navigator.share && (
              <button
                onClick={handleNativeShare}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <Share2 className="w-5 h-5" />
                <span>Share via Device</span>
              </button>
            )}

            {/* Social Share Options */}
            <div>
              <label className="block text-white font-medium mb-3">Share via</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleShare('email')}
                  className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg p-3 flex items-center space-x-2 text-white transition-all duration-200"
                >
                  <Mail className="w-5 h-5" />
                  <span className="text-sm">Email</span>
                </button>
                
                <button
                  onClick={() => handleShare('whatsapp')}
                  className="bg-green-600 hover:bg-green-700 rounded-lg p-3 flex items-center space-x-2 text-white transition-all duration-200"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-sm">WhatsApp</span>
                </button>
                
                <button
                  onClick={() => handleShare('facebook')}
                  className="bg-blue-600 hover:bg-blue-700 rounded-lg p-3 flex items-center space-x-2 text-white transition-all duration-200"
                >
                  <Facebook className="w-5 h-5" />
                  <span className="text-sm">Facebook</span>
                </button>
                
                <button
                  onClick={() => handleShare('twitter')}
                  className="bg-sky-500 hover:bg-sky-600 rounded-lg p-3 flex items-center space-x-2 text-white transition-all duration-200"
                >
                  <Twitter className="w-5 h-5" />
                  <span className="text-sm">Twitter</span>
                </button>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;