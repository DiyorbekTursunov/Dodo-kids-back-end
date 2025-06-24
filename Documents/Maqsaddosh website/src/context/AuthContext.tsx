"use client"

import { createContext, useState, useEffect, useContext, type ReactNode, useCallback } from "react"
import apiService from "../api/apiService"
import type { User } from "../types"

interface AuthContextType {
  currentUser: User | null
  setCurrentUser: (user: User | null) => void
  isLoading: boolean
  token: string | null
  setToken: (token: string | null) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [token, setTokenState] = useState<string | null>(localStorage.getItem("token"))
  const [isLoading, setIsLoading] = useState(true)

  const setToken = (newToken: string | null) => {
    if (newToken) {
      localStorage.setItem("token", newToken)
    } else {
      localStorage.removeItem("token")
    }
    setTokenState(newToken)
  }

  const logout = useCallback(() => {
    setCurrentUser(null)
    setToken(null)
  }, [])

  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!token) {
        setIsLoading(false)
        setCurrentUser(null)
        return
      }

      try {
        const response = await apiService.get("/me")
        if (response.data.success) {
          setCurrentUser(response.data.data)
        } else {
          logout()
        }
      } catch (error) {
        console.error("Failed to fetch user on load:", error)
        logout()
      } finally {
        setIsLoading(false)
      }
    }

    fetchCurrentUser()
  }, [token, logout])

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser, isLoading, token, setToken, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
