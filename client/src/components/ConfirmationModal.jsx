import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel", type = "warning" }) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: <AlertTriangle className="w-12 h-12 text-red-400" />,
          confirmButton: "bg-red-500/20 hover:bg-red-500/30 border-red-500/40 text-red-200 hover:text-red-100"
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-12 h-12 text-yellow-400" />,
          confirmButton: "bg-yellow-500/20 hover:bg-yellow-500/30 border-yellow-500/40 text-yellow-200 hover:text-yellow-100"
        };
      default:
        return {
          icon: <AlertTriangle className="w-12 h-12 text-blue-400" />,
          confirmButton: "bg-blue-500/20 hover:bg-blue-500/30 border-blue-500/40 text-blue-200 hover:text-blue-100"
        };
    }
  };

  const typeStyles = getTypeStyles();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="relative w-full max-w-md">
        {/* Animated particles background */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            >
              <div className="w-1 h-1 bg-white/30 rounded-full"></div>
            </div>
          ))}
        </div>

        {/* Modal Content */}
        <div className="relative bg-gradient-to-br from-purple-900/80 via-blue-900/70 to-indigo-900/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-6">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-colors duration-200"
          >
            <X className="w-5 h-5 text-white/70 hover:text-white" />
          </button>

          {/* Content */}
          <div className="text-center">
            {/* Icon */}
            <div className="flex justify-center mb-4">
              {typeStyles.icon}
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-white mb-3">
              {title}
            </h3>

            {/* Message */}
            <p className="text-white/80 mb-6 leading-relaxed">
              {message}
            </p>

            {/* Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white font-medium transition-all duration-300 backdrop-blur-sm"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className={`flex-1 px-4 py-3 border rounded-lg font-medium transition-all duration-300 backdrop-blur-sm ${typeStyles.confirmButton}`}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
