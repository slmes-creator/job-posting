"use client"

import type React from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import LoadingSpinner from "@/components/UI/LoadingSpinner"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: "volunteer" | "organization"
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { currentUser, userProfile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!currentUser) {
        router.push("/login")
        return
      }

      if (requiredRole && userProfile?.role !== requiredRole) {
        router.push("/")
        return
      }
    }
  }, [currentUser, userProfile, loading, requiredRole, router])

  if (loading) {
    return <LoadingSpinner message="Checking authentication..." />
  }

  if (!currentUser) {
    return null
  }

  if (requiredRole && userProfile?.role !== requiredRole) {
    return null
  }

  return <>{children}</>
}

export default ProtectedRoute
