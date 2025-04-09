"use client"

import React from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";

export default function Portfolio() {
  const { apiKey, logout } = useAuth();

  return (
    <ProtectedRoute>
      <div className="w-full max-w-6xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">Your Portfolio</h1>
          <button 
            onClick={logout}
            className="px-4 py-2 text-black bg-white rounded hover:bg-gray-200"
          >
            Logout
          </button>
        </div>
        
        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-medium text-white mb-4">Portfolio Overview</h2>
          <p className="text-gray-300">API Key: {apiKey ? `${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 5)}` : 'Not authenticated'}</p>
          <p className="text-gray-300">Portfolio data will load here when API integration is complete.</p>
        </div>
        
        <div className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-xl font-medium text-white mb-4">Upcoming Dividends</h2>
          <p className="text-gray-300">Dividend data will appear here.</p>
        </div>
      </div>
    </ProtectedRoute>
  );
}
