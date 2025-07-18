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
import { doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore"
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
      await addDoc(collection(db, "applications"), {
        volunteerId: userProfile.uid,
        volunteerName: userProfile.displayName,
        volunteerEmail: userProfile.email,
        volunteerSchool: userProfile.school,
        volunteerGrade: userProfile.grade,
        jobId: job.id,
        organizationId: job.organizationId,
        status: "pending",
        coverLetter: applicationData.coverLetter,
        availability: applicationData.availability,
        skills: applicationData.skills,
        references: applicationData.references,
        appliedAt: serverTimestamp(),
      })

      router.push(`/volunteer/jobs?applied=true`)
    } catch (err) {
      console.error("Error submitting application:", err)
      setError("Failed to submit application")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner message="Loading job details..." />
  }

  if (error) {
    return (
      <ProtectedRoute requiredRole="volunteer">
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
          <Button component={Link} href="/volunteer/jobs" variant="outlined">
            Back to Jobs
          </Button>
        </Container>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRole="volunteer">
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
          <MuiLink component={Link} href="/volunteer/jobs">
            Job Listings
          </MuiLink>
          <Typography color="text.primary">Apply</Typography>
        </Breadcrumbs>

        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <ArrowBack sx={{ cursor: "pointer" }} onClick={() => router.back()} />
          <Typography variant="h4" sx={{ ml: 2 }}>
            Apply for {job?.title || "Job"}
          </Typography>
        </Box>

        {/* Job Details Summary */}
        {job && (
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Job Details
              </Typography>
              <Box display="flex" gap={3} flexWrap="wrap">
                <Box display="flex" alignItems="center" gap={1}>
                  <LocationOn fontSize="small" />
                  <Typography variant="body2">{job.location}</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <CalendarToday fontSize="small" />
                  <Typography variant="body2">
                    {job.date.toLocaleDateString()}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <People fontSize="small" />
                  <Typography variant="body2">
                    {job.volunteersNeeded} volunteers needed
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Application Form */}
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom>
              Application Form
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Tell us why you're interested in this opportunity
            </Typography>

            <form onSubmit={handleSubmitApplication}>
              <TextField
                name="coverLetter"
                label="Cover Letter"
                placeholder="Why do you want to volunteer for this opportunity? What skills or experience do you bring?"
                value={applicationData.coverLetter}
                onChange={handleInputChange}
                multiline
                rows={4}
                fullWidth
                required
                sx={{ mb: 3 }}
                helperText="Share your motivation and relevant experience"
              />

              <TextField
                name="availability"
                label="Availability"
                placeholder="When are you available? Any scheduling conflicts?"
                value={applicationData.availability}
                onChange={handleInputChange}
                multiline
                rows={2}
                fullWidth
                required
                sx={{ mb: 3 }}
                helperText="Let us know your availability for this opportunity"
              />

              <TextField
                name="skills"
                label="Relevant Skills"
                placeholder="What skills do you have that would be helpful for this role?"
                value={applicationData.skills}
                onChange={handleInputChange}
                multiline
                rows={2}
                fullWidth
                sx={{ mb: 3 }}
                helperText="Optional - any relevant skills or experience"
              />

              <TextField
                name="references"
                label="References"
                placeholder="Any references or contacts (optional)"
                value={applicationData.references}
                onChange={handleInputChange}
                multiline
                rows={2}
                fullWidth
                sx={{ mb: 4 }}
                helperText="Optional - teacher, coach, or other adult reference"
              />

              <Box display="flex" gap={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  onClick={handleSubmitApplication}
                >
                  {loading ? <LoadingSpinner size={20} /> : "Submit Application"}
                </Button>
              </Box>
            </form>
          </CardContent>
        </Card>
      </Container>
    </ProtectedRoute>
  )
}

export default ApplyJobPage