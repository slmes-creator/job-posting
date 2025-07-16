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

const EditJobPage: React.FC = () => {
  const { userProfile } = useAuth()
  const router = useRouter()
  const params = useParams()
  const jobId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [job, setJob] = useState<Job | null>(null)

  const organizationProfile = userProfile as OrganizationProfile

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    location: "",
    isRemote: false,
    date: "",
    time: "",
    duration: "",
    volunteersNeeded: "",
    category: "",
    description: "",
    requirements: "",
    contactEmail: "",
    contactPhone: "",
    status: "open" as "open" | "closed" | "completed",
  })

  const categories = [
    "Environment",
    "Education", 
    "Healthcare",
    "Community Service",
    "Animal Welfare",
    "Disaster Relief",
    "Youth Programs",
    "Senior Services",
    "Food & Hunger",
    "Other"
  ]

  // Fetch existing job data
  useEffect(() => {
    const fetchJob = async () => {
      if (!jobId || !userProfile) return

      try {
        const jobDoc = await getDoc(doc(db, "jobs", jobId))
        
        if (!jobDoc.exists()) {
          setError("Job not found")
          return
        }

        const jobData = jobDoc.data() as Job
        
        // Check if user owns this job
        if (jobData.organizationId !== userProfile.uid) {
          setError("You don't have permission to edit this job")
          return
        }

        setJob({ ...jobData, id: jobDoc.id })
        
        // Populate form with existing data
        const jobDate = jobData.date?.toDate ? jobData.date.toDate() : new Date(jobData.date)
        const dateString = jobDate.toISOString().split('T')[0]
        const timeString = jobDate.toTimeString().split(' ')[0].substring(0, 5)

        setFormData({
          title: jobData.title || "",
          location: jobData.location || "",
          isRemote: jobData.isRemote || false,
          date: dateString,
          time: timeString,
          duration: jobData.duration || "",
          volunteersNeeded: jobData.volunteersNeeded?.toString() || "",
          category: jobData.category || "",
          description: jobData.description || "",
          requirements: jobData.requirements || "",
          contactEmail: jobData.contactEmail || "",
          contactPhone: jobData.contactPhone || "",
          status: jobData.status || "open",
        })

      } catch (err: any) {
        console.error("Error fetching job:", err)
        setError("Failed to load job data")
      } finally {
        setLoading(false)
      }
    }

    fetchJob()
  }, [jobId, userProfile])

  const handleInputChange = (field: string) => (event: any) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError("")

    try {
      // Validation
      if (!formData.title || !formData.location || !formData.date || !formData.description) {
        throw new Error("Please fill in all required fields")
      }

      // Update job document
      const jobData = {
        title: formData.title,
        location: formData.location,
        isRemote: formData.isRemote,
        date: new Date(formData.date + (formData.time ? `T${formData.time}` : "")),
        duration: formData.duration,
        volunteersNeeded: parseInt(formData.volunteersNeeded) || 1,
        category: formData.category,
        description: formData.description,
        requirements: formData.requirements,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
        status: formData.status,
        updatedAt: serverTimestamp(),
      }

      await updateDoc(doc(db, "jobs", jobId), jobData)
      
      setSuccess(true)
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push("/organization/jobs")
      }, 2000)

    } catch (err: any) {
      setError(err.message || "Failed to update job")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <LoadingSpinner message="Loading job details..." />
  }

  if (error && !job) {
    return (
      <ProtectedRoute requiredRole="organization">
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
          <Button component={Link} href="/organization/jobs" variant="outlined">
            Back to Jobs
          </Button>
        </Container>
      </ProtectedRoute>
    )
  }

  if (success) {
    return (
      <ProtectedRoute requiredRole="organization">
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Alert severity="success" sx={{ mb: 3 }}>
            ✅ Job updated successfully! Redirecting to your job listings...
          </Alert>
        </Container>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRole="organization">
      <Container maxWidth="md" sx={{ py: 4 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 3 }}>
          <MuiLink component={Link} href="/organization/jobs" color="inherit">
            <ArrowBack sx={{ mr: 1, fontSize: 16 }} />
            Job Management
          </MuiLink>
          <Typography color="text.primary">Edit Job</Typography>
        </Breadcrumbs>

        {/* Header */}
        <Typography variant="h4" component="h1" gutterBottom>
          Edit Job Posting
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Update your volunteer opportunity details
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Main Form */}
        <Card>
          <CardContent sx={{ p: 4 }}>
            <form onSubmit={handleSubmit}>
              {/* Job Title */}
              <TextField
                label="Job Title"
                placeholder="e.g., Youth Camp Volunteer"
                value={formData.title}
                onChange={handleInputChange("title")}
                fullWidth
                required
                sx={{ mb: 3 }}
                helperText="Give your opportunity a clear title"
              />

              {/* Organization Name (Read-only) */}
              <TextField
                label="Organization"
                value={organizationProfile?.organizationName || "Loading..."}
                fullWidth
                disabled
                sx={{ mb: 3 }}
              />

              {/* Location */}
              <Box sx={{ mb: 3 }}>
                <TextField
                  label="Location"
                  placeholder="e.g., Bayridge, Kingston, ON"
                  value={formData.location}
                  onChange={handleInputChange("location")}
                  fullWidth
                  required
                  InputProps={{
                    startAdornment: <LocationOn sx={{ mr: 1, color: "text.secondary" }} />
                  }}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.isRemote}
                      onChange={handleInputChange("isRemote")}
                    />
                  }
                  label="This is a remote/virtual opportunity"
                  sx={{ mt: 1 }}
                />
              </Box>

              {/* Date and Time */}
              <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
                <TextField
                  label="Date"
                  type="date"
                  value={formData.date}
                  onChange={handleInputChange("date")}
                  required
                  sx={{ flex: 1 }}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: <CalendarToday sx={{ mr: 1, color: "text.secondary" }} />
                  }}
                />
                <TextField
                  label="Time"
                  type="time"
                  value={formData.time}
                  onChange={handleInputChange("time")}
                  sx={{ flex: 1 }}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>

              {/* Duration and Volunteers Needed */}
              <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
                <TextField
                  label="Duration"
                  placeholder="e.g., 3 hours, Half day"
                  value={formData.duration}
                  onChange={handleInputChange("duration")}
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="Volunteers Needed"
                  type="number"
                  value={formData.volunteersNeeded}
                  onChange={handleInputChange("volunteersNeeded")}
                  sx={{ flex: 1 }}
                  InputProps={{
                    startAdornment: <People sx={{ mr: 1, color: "text.secondary" }} />
                  }}
                  helperText="How many people?"
                />
              </Box>

              {/* Category */}
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  onChange={handleInputChange("category")}
                  label="Category"
                >
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Status */}
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={handleInputChange("status")}
                  label="Status"
                >
                  <MenuItem value="open">Open</MenuItem>
                  <MenuItem value="closed">Closed</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                </Select>
              </FormControl>

              {/* Description */}
              <TextField
                label="Job Description"
                placeholder="Describe what volunteers will be doing, what impact they'll make, and why this opportunity matters..."
                value={formData.description}
                onChange={handleInputChange("description")}
                multiline
                rows={4}
                fullWidth
                required
                sx={{ mb: 3 }}
                helperText={`${formData.description.length}/1000 characters`}
              />

              {/* Requirements */}
              <TextField
                label="Requirements & Skills"
                placeholder="Any specific skills, age requirements, physical demands, or what volunteers should bring..."
                value={formData.requirements}
                onChange={handleInputChange("requirements")}
                multiline
                rows={3}
                fullWidth
                sx={{ mb: 3 }}
                helperText="Optional - leave blank if no specific requirements"
              />

              {/* Contact Information */}
              <Typography variant="h6" sx={{ mb: 2 }}>
                Contact Information
              </Typography>
              <Box sx={{ display: "flex", gap: 2, mb: 4 }}>
                <TextField
                  label="Contact Email"
                  type="email"
                  value={formData.contactEmail}
                  onChange={handleInputChange("contactEmail")}
                  fullWidth
                  helperText="Where volunteers can ask questions"
                />
                <TextField
                  label="Phone Number"
                  value={formData.contactPhone}
                  onChange={handleInputChange("contactPhone")}
                  fullWidth
                  helperText="Optional"
                />
              </Box>

              {/* Submit Buttons */}
              <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
                <Button
                  component={Link}
                  href="/organization/jobs"
                  variant="outlined"
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={saving}
                  size="large"
                >
                  {saving ? <LoadingSpinner size={20} /> : "Update Job"}
                </Button>
              </Box>
            </form>
          </CardContent>
        </Card>
      </Container>
    </ProtectedRoute>
  ) 
}

export default EditJobPage
