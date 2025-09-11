import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, X } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import api from '../utils/api';

const SimulationView = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [simulation, setSimulation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSimulation = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/simulations/slug/${slug}`);
        
        if (response.data.success) {
          setSimulation(response.data.simulation);
        } else {
          setError('Simulation not found');
        }
      } catch (error) {
        console.error('Error fetching simulation:', error);
        setError('Failed to load simulation');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchSimulation();
    }
  }, [slug]);

  useEffect(() => {
    // Add fullscreen styles to body
    document.body.style.overflow = 'hidden';
    
    return () => {
      // Cleanup: restore normal overflow when component unmounts
      document.body.style.overflow = 'auto';
    };
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-900 z-50">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-900 z-50">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => navigate('/simulations')}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Back to Simulations
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900 z-50">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/simulations')}
            className="flex items-center gap-2 text-white hover:text-purple-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Back to Simulations</span>
          </button>
          <div className="border-l border-white/30 pl-4">
            <h1 className="text-white text-lg font-semibold truncate max-w-xs sm:max-w-md">
              {simulation?.title}
            </h1>
            <p className="text-purple-200 text-sm">
              {simulation?.subject} • {simulation?.category}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/simulations')}
            className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Simulation Frame */}
      <div className="h-[calc(100vh-4rem)]">
        {simulation?.iframeUrl ? (
          <iframe
            src={simulation.iframeUrl}
            className="w-full h-full border-0"
            title={simulation.title}
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center text-white">
              <p className="text-xl mb-2">Simulation not available</p>
              <p className="text-gray-400">The simulation URL is missing or invalid</p>
              <button
                onClick={() => navigate('/simulations')}
                className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Back to Simulations
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimulationView;
