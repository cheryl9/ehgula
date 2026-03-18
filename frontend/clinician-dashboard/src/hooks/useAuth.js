import { useCallback } from 'react'
import useClinicianStore from '../store/clinicianStore'
import { supabase } from '../lib/supabase.js'

/**
 * useAuth hook - Manage authentication state and actions
 */
export function useAuth() {
  const store = useClinicianStore()

  const login = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw new Error(error.message)
    }

    const accessToken = data?.session?.access_token
    if (!accessToken) {
      throw new Error('Login succeeded but no access token was returned.')
    }

    store.actions.setToken(accessToken)

    return {
      success: true,
      clinician: {
        email: data.user?.email || email,
        name: (data.user?.email || email).split('@')[0],
        id: data.user?.id || null,
      }
    }
  }, [store])

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
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
