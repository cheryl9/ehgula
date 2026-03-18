import { useCallback } from 'react'
import useClinicianStore from '../store/clinicianStore'

/**
 * useAuth hook - Manage authentication state and actions
 */
export function useAuth() {
  const store = useClinicianStore()

  const login = useCallback(async (email, password) => {
    // TODO: Replace with real Supabase/backend auth
    // For now, mock authentication
    const mockToken = btoa(`${email}:${password}:${Date.now()}`)
    store.actions.setToken(mockToken)
    return {
      success: true,
      clinician: {
        email,
        name: email.split('@')[0],
        id: 'C001'
      }
    }
  }, [store])

  const logout = useCallback(() => {
    store.actions.setToken(null)
    localStorage.removeItem('clinician_token')
  }, [store])

  const isAuthenticated = !!store.auth.token

  return {
    isAuthenticated,
    token: store.auth.token,
    clinician: store.auth.clinician,
    login,
    logout,
    isLoading: store.auth.isLoading,
    error: store.auth.error
  }
}

export default useAuth
