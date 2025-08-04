import React from 'react'

export default function LoadingSpinner() {
  return (
    <div className="flex justify-center min-h-screen py-8">
      <div data-testid="spinner" className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  )
}
