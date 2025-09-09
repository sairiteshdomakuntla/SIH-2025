import React from 'react';
import { Gamepad2 } from 'lucide-react';

const LoadingSpinner = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-800 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-8">
          <div className="inline-flex p-6 bg-yellow-400 rounded-full shadow-2xl animate-bounce">
            <Gamepad2 className="h-12 w-12 text-purple-700" />
          </div>
        </div>
        <div className="flex items-center justify-center space-x-2">
          <div className="w-4 h-4 bg-yellow-400 rounded-full animate-pulse"></div>
          <div className="w-4 h-4 bg-green-400 rounded-full animate-pulse delay-100"></div>
          <div className="w-4 h-4 bg-blue-400 rounded-full animate-pulse delay-200"></div>
        </div>
        <p className="text-white text-xl font-bold mt-4">Loading Your Adventure...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;