import React from 'react'
import { AlertCircle } from 'lucide-react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen items-center justify-center bg-slate-50 p-4">
          <div className="rounded-lg bg-white p-8 shadow-lg max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="text-danger-red-600" size={32} />
              <h1 className="text-xl font-bold text-slate-900">Something went wrong</h1>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full rounded-lg bg-info-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-info-blue-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
