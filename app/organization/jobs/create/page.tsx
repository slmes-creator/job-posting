"use client"

import type React from "react"
import { useState } from "react"
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
  FormGroup,
  Alert,
  Breadcrumbs,
  Link as MuiLink,
} from "@mui/material"
import { ArrowBack, LocationOn, CalendarToday, People } from "@mui/icons-material"
import { useAuth } from "@/contexts/AuthContext"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { OrganizationProfile } from "@/lib/types"
import LoadingSpinner from "@/components/UI/LoadingSpinner"
import Link from "next/link"
import ProtectedRoute from "@/components/ProtectedRoute"
import { useRouter } from "next/navigation"

const CreateJob: React.FC = () => {
  const { userProfile } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

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
    contactEmail: organizationProfile?.email || "",
    contactPhone: "",
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

  const handleInputChange = (field: string) => (event: any) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Validation
      if (!formData.title || !formData.location || !formData.date || !formData.description) {
        throw new Error("Please fill in all required fields")
      }

      // Create job document
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
        organizationId: userProfile?.uid,
        organizationName: organizationProfile?.organizationName || "Unknown Organization",
        status: "open",
        createdAt: serverTimestamp(),
      }

      await addDoc(collection(db, "jobs"), jobData)
      
      setSuccess(true)
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push("/organization/jobs")
      }, 2000)

    } catch (err: any) {
      setError(err.message || "Failed to create job posting")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveDraft = async () => {
    setLoading(true)
    setError("")

    try {
      // Save draft logic (similar to submit but with a different status)
      const draftData = {
        ...formData,
        status: "draft",
        organizationId: userProfile?.uid,
        organizationName: organizationProfile?.organizationName || "Unknown Organization",
        createdAt: serverTimestamp(),
      }

      await addDoc(collection(db, "jobs"), draftData)

      setSuccess(true)
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push("/organization/jobs")
      }, 2000)

    } catch (err: any) {
      setError(err.message || "Failed to save draft")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <ProtectedRoute requiredRole="organization">
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Alert severity="success" sx={{ mb: 3 }}>
            ✅ Job posted successfully! Redirecting to your job listings...
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
          <Typography color="text.primary">Post New Job</Typography>
        </Breadcrumbs>

        {/* Header */}
        <Typography variant="h4" component="h1" gutterBottom>
          Post a Volunteer Opportunity
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Reach volunteers in your community and make a difference together
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
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                    variant="outlined" 
                    onClick={handleSaveDraft} 
                    disabled={loading}
                >
                  Save Draft
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  size="large"
                >
                  {loading ? <LoadingSpinner size={20} /> : "Post Job"}
                </Button>
              </Box>
            </form>
          </CardContent>
        </Card>
      </Container>
    </ProtectedRoute>
  )
}

export default CreateJob