'use client';

import React from "react";

export default function LoadingSpinner() {
  return (
    <div 
      data-testid="spinner-container" 
      className="flex items-center justify-center min-h-screen"
    >
      <div 
        data-testid="spinner"
        className="w-12 h-12 border-4 border-gray-300 border-t-gray-800 rounded-full animate-spin" 
      />
    </div>
  );
}
