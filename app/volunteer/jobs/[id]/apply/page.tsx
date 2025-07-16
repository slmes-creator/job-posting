"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Alert,
  Breadcrumbs,
  Link as MuiLink,
} from "@mui/material"
import { ArrowBack, LocationOn, CalendarToday, People } from "@mui/icons-material"
import { useAuth } from "@/contexts/AuthContext"
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { OrganizationProfile, Job } from "@/lib/types"
import LoadingSpinner from "@/components/UI/LoadingSpinner"
import Link from "next/link"
import ProtectedRoute from "@/components/ProtectedRoute"
import { useRouter, useParams } from "next/navigation"

const ApplyJobPage: React.FC = () => {
  const { userProfile } = useAuth()
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [applicationData, setApplicationData] = useState({
    coverLetter: "",
    availability: "",
    skills: "",
    references: "",
  })

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        const jobDocRef = doc(db, "jobs", id)
        const jobDoc = await getDoc(jobDocRef)

        if (!jobDoc.exists()) {
          setError("Job not found")
          return
        }

        const jobData = jobDoc.data() as Job
        setJob({
          ...jobData,
          id: jobDoc.id,
          date: jobData.date?.toDate ? jobData.date.toDate() : new Date(jobData.date) || new Date(),
          createdAt: jobData.createdAt?.toDate ? jobData.createdAt.toDate() : new Date(jobData.createdAt) || new Date(),
        })
      } catch (err) {
        console.error("Error fetching job details:", err)
        setError("Failed to load job details")
      } finally {
        setLoading(false)
      }
    }

    fetchJobDetails()
  }, [id])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setApplicationData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!userProfile || !job) return

    try {
      const applicationRef = doc(db, "applications", `${userProfile.uid}_${job.id}`)
      await updateDoc(applicationRef, {
        volunteerId: userProfile.uid,
        jobId: job.id,
        coverLetter: applicationData.coverLetter,
        availability: applicationData.availability,
        skills: applicationData.skills,
        references: applicationData.references,
        appliedAt: serverTimestamp(),
      })

      router.push(`/volunteer/jobs/${job.id}/application-success`)
    } catch (err) {
      console.error("Error submitting application:", err)
      setError("Failed to submit application")
    } finally {
      setLoading(false)
    }

    return () => {
      setLoading(false)
    }
  }
}

export default ApplyJobPage