import React from 'react'

export function LoadingSpinner({ size = 'md' }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  return (
    <div className="flex items-center justify-center">
      <div className={`${sizes[size]} animate-spin`}>
        <div className="h-full w-full border-4 border-slate-200 border-t-info-blue-500 rounded-full" />
      </div>
    </div>
  )
}

export default LoadingSpinner
