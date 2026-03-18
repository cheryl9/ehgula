import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks'
import { Heart } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('doctor@nuh.com.sg')
  const [password, setPassword] = useState('password123')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Validate inputs
      if (!email || !password) {
        setError('Please enter both email and password')
        setIsLoading(false)
        return
      }

      // Attempt login
      const result = await login(email, password)
      
      if (result.success) {
        // Redirect to an existing protected route
        navigate('/patients')
      } else {
        setError('Login failed. Please try again.')
      }
    } catch (err) {
      setError(err.message || 'An error occurred during login')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-info-blue-50 via-medical-green-50 to-slate-50">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-medical-green-100 rounded-full blur-3xl opacity-20" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-info-blue-100 rounded-full blur-3xl opacity-20" />
      </div>

      {/* Login Card */}
      <div className="relative w-full max-w-md rounded-xl bg-white p-8 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <Heart className="text-danger-red-600" size={40} />
          <div>
            <h1 className="text-3xl font-bold text-slate-900">ehgula</h1>
            <p className="text-sm text-slate-600">Clinician Portal</p>
          </div>
        </div>

        {/* Subtitle */}
        <div className="mb-8 text-center">
          <h2 className="text-lg font-semibold text-slate-900">Welcome</h2>
          <p className="text-sm text-slate-600 mt-1">Sign in to access your patient dashboard</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="doctor@hospital.com.sg"
              disabled={isLoading}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-info-blue-500 focus:outline-none focus:ring-2 focus:ring-info-blue-100 disabled:bg-slate-50 disabled:text-slate-500"
            />
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isLoading}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-info-blue-500 focus:outline-none focus:ring-2 focus:ring-info-blue-100 disabled:bg-slate-50 disabled:text-slate-500"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-danger-red-50 border border-danger-red-200 px-4 py-3 text-sm text-danger-red-700">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-info-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-info-blue-700 disabled:bg-info-blue-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Demo Credentials Notice */}
        <div className="mt-6 rounded-lg bg-slate-50 px-4 py-3 text-xs text-slate-600 border border-slate-200">
          <p className="font-medium text-slate-700 mb-1">Demo Credentials:</p>
          <p>Email: <code className="bg-slate-200 px-1 py-0.5 rounded">doctor@nuh.com.sg</code></p>
          <p>Password: <code className="bg-slate-200 px-1 py-0.5 rounded">password123</code></p>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-slate-200 text-center text-xs text-slate-500">
          <p>Secure portal for authorized clinicians only</p>
        </div>
      </div>
    </div>
  )
}
