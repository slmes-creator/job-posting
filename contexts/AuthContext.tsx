"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import {
  type User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import type { User, VolunteerProfile, OrganizationProfile } from "@/lib/types"

interface AuthContextType {
  currentUser: FirebaseUser | null
  userProfile: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, userData: Partial<User>) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null)
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }

  const register = async (email: string, password: string, userData: Partial<User>) => {
    const { user } = await createUserWithEmailAndPassword(auth, email, password)

    await updateProfile(user, {
      displayName: userData.displayName,
    })

    const profileData = {
      uid: user.uid,
      email: user.email!,
      displayName: userData.displayName || (userData as OrganizationProfile).organizationName!,
      role: userData.role!,
      createdAt: new Date(),
      ...(userData.role === "volunteer"
        ? {
            fullName: (userData as VolunteerProfile).fullName,
            school: (userData as VolunteerProfile).school,
            grade: (userData as VolunteerProfile).grade,
            totalHours: 0,
            appliedJobs: [],
            completedJobs: [],
          }
        : {
            organizationName: (userData as OrganizationProfile).organizationName,
            description: (userData as OrganizationProfile).description,
            website: (userData as OrganizationProfile).website,
            address: (userData as OrganizationProfile).address,
            contactPhone: (userData as OrganizationProfile).contactPhone,
          }),
    }

    await setDoc(doc(db, "users", user.uid), profileData)
  }

  const logout = async () => {
    await signOut(auth)
  }

  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)

      if (user) {
        try {
          if (!db) {
            console.error("Firestore not initialized")
            setUserProfile(null)
          } else {
            const userDoc = await getDoc(doc(db, "users", user.uid))
            if (userDoc.exists()) {
              setUserProfile(userDoc.data() as User)
            }
          }
        } catch (error) {
          console.error("Error fetching user profile:", error)
        }
      } else {
        setUserProfile(null)
      }

      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value = {
    currentUser,
    userProfile,
    loading,
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
