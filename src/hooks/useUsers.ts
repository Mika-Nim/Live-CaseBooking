/**
 * useUsers Hook - Manage users with Supabase integration
 */

import { useState, useEffect, useCallback } from 'react'
import { User } from '../types'
import supabaseService from '../services/supabaseService'

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const userData = await supabaseService.userOperations.getAll()
      setUsers(userData)
    } catch (err) {
      console.error('Error fetching users:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }, [])

  const addUser = useCallback(async (userData: Omit<User, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newUser = await supabaseService.userOperations.create(userData)
      setUsers(prev => [...prev, newUser])
      return newUser
    } catch (err) {
      console.error('Error creating user:', err)
      throw err
    }
  }, [])

  const updateUser = useCallback(async (id: string, userData: Partial<User>) => {
    try {
      const updatedUser = await supabaseService.userOperations.update(id, userData)
      setUsers(prev => prev.map(user => user.id === id ? updatedUser : user))
      return updatedUser
    } catch (err) {
      console.error('Error updating user:', err)
      throw err
    }
  }, [])

  const deleteUser = useCallback(async (id: string) => {
    try {
      await supabaseService.userOperations.delete(id)
      setUsers(prev => prev.filter(user => user.id !== id))
    } catch (err) {
      console.error('Error deleting user:', err)
      throw err
    }
  }, [])

  const getUserById = useCallback(async (id: string) => {
    try {
      return await supabaseService.userOperations.getById(id)
    } catch (err) {
      console.error('Error fetching user:', err)
      throw err
    }
  }, [])

  const authenticateUser = useCallback(async (username: string, password: string, country: string) => {
    try {
      return await supabaseService.userOperations.authenticate(username, password, country)
    } catch (err) {
      console.error('Error authenticating user:', err)
      throw err
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  return {
    users,
    loading,
    error,
    fetchUsers,
    addUser,
    updateUser,
    deleteUser,
    getUserById,
    authenticateUser
  }
}