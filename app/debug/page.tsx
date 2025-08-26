"use client"

import React, { useEffect, useState } from "react"
import { useAuth } from '@/contexts/AuthContext'
import { auth, db } from "@/lib/firebase"

export default function DebugPage() {
  const { currentUser, userProfile, loading } = useAuth()
  const [status, setStatus] = useState<string[]>([])
  const [userDocStatus, setUserDocStatus] = useState('Not checked')

  useEffect(() => {
    const checkFirebase = async () => {
      const logs: string[] = []
      
      logs.push(`🌐 Window defined: ${typeof window !== "undefined"}`)
      logs.push(`🔥 Firebase Auth: ${!!auth}`)
      logs.push(`📊 Firebase DB: ${!!db}`)
      logs.push(`👤 Current User: ${currentUser ? `${currentUser.email} (${currentUser.uid})` : 'Not logged in'}`)
      logs.push(`📋 User Profile: ${userProfile ? `Role: ${userProfile.role}` : 'Not loaded'}`)
      logs.push(`⏳ Loading: ${loading}`)
      
      if (currentUser && !userProfile && !loading) {
        logs.push(`❌ ISSUE: User is authenticated but profile is missing!`)
      }
      
      setStatus(logs)
    }
    
    checkFirebase()
  }, [currentUser, userProfile, loading])

  return (
    <div style={{ padding: "20px", fontFamily: "monospace" }}>
      <h1>🔍 Authentication Debug Page</h1>
      <div>
        {status.map((log, i) => (
          <div key={i} style={{ margin: "5px 0" }}>
            {log}
          </div>
        ))}
      </div>
      
      <div style={{ marginTop: "20px", padding: "10px", border: "1px solid #ccc" }}>
        <h2>🚨 If you see 'User is authenticated but profile is missing!':</h2>
        <p>This means the user exists in Firebase Auth but not in Firestore.</p>
        <p>You need to register a new account, not just use an existing email.</p>
      </div>
      
      <div style={{ marginTop: "20px" }}>
        <h2>📋 Next Steps:</h2>
        <ol>
          <li><a href="/login">Try logging in</a> with your registered account</li>
          <li>Return here to see the auth state</li>
          <li>If profile is missing, <a href="/register">register a new account</a></li>
        </ol>
      </div>
    </div>
  )
}
