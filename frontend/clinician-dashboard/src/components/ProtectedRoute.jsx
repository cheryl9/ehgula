import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks'

/**
 * ProtectedRoute - Redirect to login if not authenticated
 */
export function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute
