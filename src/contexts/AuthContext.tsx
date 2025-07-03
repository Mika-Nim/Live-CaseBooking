/**
 * AuthContext - Supabase-based authentication context
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User } from '../types'
import { supabase } from '../services/supabase'
import supabaseService from '../services/supabaseService'

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  login: (username: string, password: string, country: string) => Promise<{ user: User | null; error?: string }>
  logout: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          // Get user profile from our database
          const userProfile = await supabaseService.userOperations.getById(session.user.id)
          if (userProfile) {
            setUser(userProfile)
          }
        }
      } catch (err) {
        console.error('Error checking session:', err)
        setError('Failed to check authentication status')
      } finally {
        setLoading(false)
      }
    }

    checkSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          const userProfile = await supabaseService.userOperations.getById(session.user.id)
          if (userProfile) {
            setUser(userProfile)
          }
        } catch (err) {
          console.error('Error fetching user profile:', err)
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = async (username: string, password: string, country: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await supabaseService.userOperations.authenticate(username, password, country)
      
      if (result.user) {
        setUser(result.user)
        return { user: result.user }
      } else {
        setError(result.error || 'Login failed')
        return { user: null, error: result.error }
      }
    } catch (err) {
      const errorMessage = 'Login failed. Please try again.'
      setError(errorMessage)
      return { user: null, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      setLoading(true)
      await supabase.auth.signOut()
      setUser(null)
      setError(null)
    } catch (err) {
      console.error('Error signing out:', err)
      setError('Failed to sign out')
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}