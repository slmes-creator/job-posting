"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { DayPicker, type DateRange } from "react-day-picker"
import {
  Container,
  Typography,
  Card,
  CardContent,
  Divider,
  Box,
  Button,
  Chip,
  TextField,
  Alert,
  Breadcrumbs,
  Link as MuiLink,
  Grow,
} from "@mui/material"
import { ArrowBack, LocationOn, CalendarToday, People, CloudUpload } from "@mui/icons-material"
import { useAuth } from "@/contexts/AuthContext"
import { 
  doc, 
  getDoc, 
  addDoc, 
  collection, 
  serverTimestamp 
} from "firebase/firestore"
import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from "firebase/storage"
import { db, storage } from "@/lib/firebase"
import type { Job } from "@/lib/types"
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
  const [selectedDates, setSelectedDates] = useState<DateRange | undefined>()
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [applicationData, setApplicationData] = useState({
    coverLetter: "",
    availability: "",
    skills: "",
    resumeFile: null as File | null,
    resumeUrl: "",
    references: {
      name: "",
      affiliation: "",
      email: "",
      phone: "",
    },
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
          date: jobData.date && typeof (jobData.date as any).toDate === 'function' ? (jobData.date as any).toDate() : new Date(jobData.date as any) || new Date(),
          createdAt: jobData.createdAt && typeof (jobData.createdAt as any).toDate === 'function' ? (jobData.createdAt as any).toDate() : new Date(jobData.createdAt as any) || new Date(),
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

  const handleReferenceChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target
    setApplicationData(prev => ({
      ...prev,
      references: {
        ...prev.references,
        [field]: value
      }
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/jpg', 'image/png']
      if (!allowedTypes.includes(file.type)) {
        setError('Please upload a PDF, JPG/PNG, or Word document')
        return
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB')
        return
      }

      setApplicationData(prev => ({
        ...prev,
        resumeFile: file
      }))
      setError(null)
    }
  }

  const uploadResume = async (file: File): Promise<string> => {
    if (!userProfile) throw new Error('User not authenticated')
    
    const fileName = `resumes/${userProfile.uid}/${Date.now()}_${file.name}`
    const storageRef = ref(storage, fileName)
    
    setUploading(true)
    try {
      const snapshot = await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(snapshot.ref)
      return downloadURL
    } catch (err) {
      console.log('Upload failed: ', err)
      throw new Error('Failed to upload resume')
    } finally {
      setUploading(false)
    }
  }

  // Keep the text availability field in sync with selected calendar dates
  useEffect(() => {
    if (!selectedDates?.from || !selectedDates?.to) {
      setApplicationData((prev) => ({ ...prev, availability: "" }))
      return
    }
    
    const formatted = `${selectedDates.from.toLocaleDateString()} - ${selectedDates.to.toLocaleDateString()}`
    setApplicationData((prev) => ({ ...prev, availability: formatted }))
  }, [selectedDates])

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!userProfile || !job) return

    setLoading(true)
    setError(null)

    try {
      let resumeUrl = ""
      
      // Upload resume if provided
      if (applicationData.resumeFile) {
        try {
          resumeUrl = await uploadResume(applicationData.resumeFile)
        } catch (uploadError) {
          setError('Resume upload failed. Please try again or skip the resume.')
          setLoading(false)
          return  // ← Stop form submission if upload fails
        }
      }

      await addDoc(collection(db, "applications"), {
        volunteerId: userProfile.uid,
        volunteerName: userProfile.displayName,
        volunteerEmail: userProfile.email,
        jobId: job.id,
        organizationId: job.organizationId,
        status: "pending",
        coverLetter: applicationData.coverLetter,
        availability: applicationData.availability,
        availabilityRange: selectedDates,
        skills: selectedSkills.join(", "),
        resumeUrl: resumeUrl,
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
                    {job.maxVolunteers} volunteers needed
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
              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

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

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                  📅 Availability Calendar
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Select a date range when you're available to volunteer
                </Typography>
                <Box className="calendar-container">
                  <DayPicker
                    mode="range"
                    selected={selectedDates}
                    onSelect={setSelectedDates}
                    disabled={{ before: new Date() }}
                    showOutsideDays
                    captionLayout="dropdown"
                    className="range-calendar"
                  />
                </Box>
                
                {/* Display selected range */}
                {selectedDates?.from && selectedDates?.to && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Selected availability period:
                    </Typography>
                    <Chip 
                      label={`${selectedDates.from.toLocaleDateString()} - ${selectedDates.to.toLocaleDateString()}`}
                      color="primary"
                      variant="filled"
                      onDelete={() => setSelectedDates(undefined)}
                    />
                  </Box>
                )}

                {/* Show current range being selected */}
                {selectedDates && (selectedDates.from || selectedDates.to) && !(selectedDates.from && selectedDates.to) && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Selecting range:
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                      {selectedDates.from && (
                        <Chip 
                          label={`From: ${selectedDates.from.toLocaleDateString()}`}
                          size="small" 
                          color="secondary"
                          variant="outlined"
                        />
                      )}
                      {selectedDates.to && (
                        <Chip 
                          label={`To: ${selectedDates.to.toLocaleDateString()}`}
                          size="small" 
                          color="secondary"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </Box>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Skills (Optional)
              </Typography>

              <TextField
                name="skills"
                label="Relevant Skills"
                placeholder="Add skills..."
                value={applicationData.skills}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && applicationData.skills.trim()) {
                    e.preventDefault()
                    const newSkill = applicationData.skills.trim()
                    if (!selectedSkills.includes(newSkill)) {
                      setSelectedSkills(prev => [...prev, newSkill])
                      setApplicationData(prev => ({ ...prev, skills: "" }))
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

              {/* Resume Upload */}
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Resume/CV (Optional)
              </Typography>
              <Box sx={{ mb: 3 }}>
                <input
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  style={{ display: 'none' }}
                  id="resume-upload"
                  type="file"
                  onChange={handleFileChange}
                />
                <label htmlFor="resume-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<CloudUpload />}
                    sx={{ mb: 1 }}
                  >
                    Upload Resume
                  </Button>
                </label>
                {applicationData.resumeFile && (
                  <Typography variant="body2" color="text.secondary">
                    Selected: {applicationData.resumeFile.name}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                  PDF, Word format, or JPG/PNG image, maximum 5MB
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* References */}
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                References (Optional)
              </Typography>
              <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, mb: 3 }}>
                <TextField
                  label="Reference Name"
                  value={applicationData.references.name}
                  onChange={handleReferenceChange('name')}
                  fullWidth
                />
                <TextField
                  label="Organization/Affiliation"
                  value={applicationData.references.affiliation}
                  onChange={handleReferenceChange('affiliation')}
                  fullWidth
                />
                <TextField
                  label="Email"
                  type="email"
                  value={applicationData.references.email}
                  onChange={handleReferenceChange('email')}
                  fullWidth
                />
                <TextField
                  label="Phone"
                  value={applicationData.references.phone}
                  onChange={handleReferenceChange('phone')}
                  fullWidth
                />
              </Box>

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
                  disabled={loading || !selectedDates?.from || !selectedDates?.to}
                >
                  {loading ? "Submitting..." : "Submit Application"}
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
