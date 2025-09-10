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
  FormGroup,
  Chip,
  Grow,
  Divider,
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
import { DayPicker } from "react-day-picker"
import "react-day-picker/dist/style.css"

const CreateJob: React.FC = () => {
  const { userProfile } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const organizationProfile = userProfile as OrganizationProfile
  const [selectedDates, setSelectedDates] = useState<Date | { from: Date; to?: Date } | undefined>()
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [selectedRequirements, setSelectedRequirements] = useState<string[]>([])

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    location: "",
    isRemote: false,
    startTime: "",
    endTime: "",
    duration: "",
    volunteersNeeded: "",
    category: "",
    description: "",
    requirements: "",
    skills: "",
    contactEmail: organizationProfile?.email || "",
    contactPhone: "",
  })

  // Calculate duration when times change
  useEffect(() => {
    if (formData.startTime && formData.endTime) {
      try {
        // Parse time strings (format: "HH:MM")
        const [startHour, startMin] = formData.startTime.split(':').map(Number);
        const [endHour, endMin] = formData.endTime.split(':').map(Number);
        
        // Create Date objects for comparison
        const start = new Date(2000, 0, 1, startHour, startMin);
        const end = new Date(2000, 0, 1, endHour, endMin);
        
        // Check if end time is after start time
        if (end > start) {
          const diffMs = end.getTime() - start.getTime();
          const hours = Math.floor(diffMs / (1000 * 60 * 60));
          const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          
          let durationText = "";
          if (hours > 0) durationText += `${hours}h`;
          if (minutes > 0) durationText += `${minutes > 0 && hours > 0 ? " " : ""}${minutes}m`;
          
          setFormData(prev => ({
            ...prev,
            duration: durationText || "Less than 1 minute"
          }));
        } else if (end.getTime() === start.getTime()) {
          setFormData(prev => ({
            ...prev,
            duration: "Instant"
          }));
        } else {
          // End time is before start time
          setFormData(prev => ({
            ...prev,
            duration: "Invalid time range"
          }));
        }
      } catch (error) {
        // Handle invalid time format
        setFormData(prev => ({
          ...prev,
          duration: ""
        }));
      }
    } else {
      // Clear duration if either time is missing
      setFormData(prev => ({
        ...prev,
        duration: ""
      }));
    }
  }, [formData.startTime, formData.endTime]);

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

  const handleInputChange = (field?: string) => (event: any) => {
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
      if (!formData.title || !formData.location || !selectedDates || !formData.description) {
        throw new Error("Please fill in all required fields including date selection")
      }

      // Process selected dates
      let startDate: Date;
      let endDate: Date | null = null;
      
      if (selectedDates instanceof Date) {
        // Single date selected
        startDate = new Date(selectedDates);
        if (formData.startTime) {
          const dateStr = selectedDates.toISOString().split('T')[0]; // Get YYYY-MM-DD format
          startDate = new Date(`${dateStr}T${formData.startTime}:00`);
        }
      } else if (selectedDates && 'from' in selectedDates) {
        // Date range selected
        startDate = new Date(selectedDates.from);
        if (formData.startTime) {
          const dateStr = selectedDates.from.toISOString().split('T')[0]; // Get YYYY-MM-DD format
          startDate = new Date(`${dateStr}T${formData.startTime}:00`);
        }
        
        if (selectedDates.to) {
          endDate = new Date(selectedDates.to);
          if (formData.endTime) {
            const dateStr = selectedDates.to.toISOString().split('T')[0]; // Get YYYY-MM-DD format
            endDate = new Date(`${dateStr}T${formData.endTime}:00`);
          }
        }
      } else {
        throw new Error("Please select a date or date range");
      }

      // Create job document
      const jobData = {
        title: formData.title,
        location: formData.location,
        isRemote: formData.isRemote,
        startDate: startDate,
        endDate: endDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        duration: formData.duration,
        volunteersNeeded: parseInt(formData.volunteersNeeded) || 1,
        category: formData.category,
        description: formData.description,
        requirements: selectedRequirements,
        skills: selectedSkills,
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
      console.error("Error creating job posting:", err)
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

              {/* Date Selection and Volunteers Needed */}
              <Typography variant="h6" sx={{ mb: 2 }}>
                Schedule & Capacity
              </Typography>
              
              <Box sx={{ display: "flex", gap: 3, mb: 3 }}>
                {/* Calendar */}
                <Box sx={{ flex: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Select Date(s) *
                  </Typography>
                  <Card variant="outlined" sx={{ p: 2 }}>
                    <DayPicker
                      mode="range"
                      selected={selectedDates}
                      onSelect={setSelectedDates}
                      disabled={{ before: new Date() }}
                      modifiers={{
                        selected: selectedDates
                      }}
                      modifiersStyles={{
                        selected: { 
                          backgroundColor: '#1976d2', 
                          color: 'white',
                          borderRadius: '4px'
                        }
                      }}
                      style={{
                        margin: 0,
                      }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Click a single date or drag to select a range
                    </Typography>
                  </Card>
                </Box>

                {/* Volunteers Needed */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', mt: 4 }}>
                  <TextField
                    label="Volunteers Needed"
                    type="number"
                    value={formData.volunteersNeeded}
                    onChange={handleInputChange("volunteersNeeded")}
                    InputProps={{
                      startAdornment: <People sx={{ mr: 1, color: "text.secondary" }} />
                    }}
                    helperText="How many people?"
                    sx={{ mb: 2 }}
                  />
                  
                  {/* Selected dates display */}
                  {selectedDates && (
                    <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="subtitle2" color="primary">
                        Selected:
                      </Typography>
                      <Typography variant="body2">
                        {selectedDates instanceof Date 
                          ? selectedDates.toLocaleDateString()
                          : selectedDates.from 
                            ? `${selectedDates.from.toLocaleDateString()}${selectedDates.to ? ` - ${selectedDates.to.toLocaleDateString()}` : ''}`
                            : 'No date selected'
                        }
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>

              {/* Time Range and Duration */}
              <Typography variant="h6" sx={{ mb: 2 }}>
                Time Details
              </Typography>
              <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
                <TextField
                  label="Start Time"
                  type="time"
                  value={formData.startTime}
                  onChange={handleInputChange("startTime")}
                  sx={{ flex: 1 }}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="End Time"
                  type="time"
                  value={formData.endTime}
                  onChange={handleInputChange("endTime")}
                  sx={{ flex: 1 }}
                  InputLabelProps={{ shrink: true }}
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
                name="requirements"
                label="Requirements"
                placeholder="Add requirements..."
                value={formData.requirements}
                onChange={handleInputChange("requirements")}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && formData.requirements.trim()) {
                    e.preventDefault()
                    const newRequirement = formData.requirements.trim()
                    if (!selectedRequirements.includes(newRequirement)) {
                      setSelectedRequirements(prev => [...prev, newRequirement])
                      setFormData(prev => ({ ...prev, requirements: "" }))
                    }
                  }
                }}
                fullWidth
                sx={{ mb: 2 }}
                helperText="Press Enter to add requirements"
              />

              {/* Display added requirements */}
              {selectedRequirements.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Added requirements ({selectedRequirements.length}):
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    {selectedRequirements.map((requirement, index) => (
                      <Grow
                        key={requirement}
                        in={true}
                        timeout={300 + (index * 100)}
                      >
                        <Chip
                          label={requirement}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ borderRadius: 1 }}
                          onDelete={() => {
                            setSelectedRequirements(prev => prev.filter(r => r !== requirement))
                          }}
                        />
                      </Grow>
                    ))}
                  </Box>
                </Box>
              )}

              <TextField
                name="skills"
                label="Relevant Skills"
                placeholder="Add skills..."
                value={formData.skills}
                onChange={handleInputChange("skills")}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && formData.skills.trim()) {
                    e.preventDefault()
                    const newSkill = formData.skills.trim()
                    if (!selectedSkills.includes(newSkill)) {
                      setSelectedSkills(prev => [...prev, newSkill])
                      setFormData(prev => ({ ...prev, skills: "" }))
                    }
                  }
                }}
                fullWidth
                sx={{ mb: 2 }}
                helperText="Press Enter to add skills"
              />

              {/* Display added skills */}
              {selectedSkills.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Added skills ({selectedSkills.length}):
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    {selectedSkills.map((skill, index) => (
                      <Grow
                        key={skill}
                        in={true}
                        timeout={300 + (index * 100)}
                      >
                        <Chip 
                          label={skill}
                          size="small" 
                          color="secondary"
                          variant="filled"
                          onDelete={() => {
                            setSelectedSkills(prev => prev.filter(s => s !== skill))
                          }}
                        />
                      </Grow>
                    ))}
                  </Box>
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

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