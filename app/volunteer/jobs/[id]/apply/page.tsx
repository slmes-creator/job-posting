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
import { ArrowBack, LocationOn, CalendarToday, People, CloudUpload } from "@mui/icons-material"
import { useAuth } from "@/contexts/AuthContext"
import { doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { db, storage } from "@/lib/firebase"
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
    resumeFile: null as File | null,
    uploading: false,
    resumeUrl: "",
    references: {
      name: "",
      affiliation: "",
      email: "",
      phone: "",
    },
  })
  const [uploading, setUploading] = useState(false)

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
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      if (!allowedTypes.includes(file.type)) {
        setError('Please upload a PDF or Word document')
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
    } finally {
      setUploading(false)
    }
  }

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!userProfile || !job) return

    setLoading(true)
    setError(null)

    try {
      let resumeUrl = ""
      
      // Upload resume if provided
      if (applicationData.resumeFile) {
        resumeUrl = await uploadResume(applicationData.resumeFile)
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
        skills: applicationData.skills,
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

              {/* Resume Upload */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  Resume/CV (Optional)
                </Typography>
                <input
                  type="file"
                  id="resumeFile"
                  name="resumeFile"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <label htmlFor="resumeFile">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<CloudUpload />}
                    disabled={applicationData.uploading}
                    sx={{ mb: 1 }}
                  >
                    {applicationData.resumeFile ? 'Change Resume' : 'Upload Resume'}
                  </Button>
                </label>
                {applicationData.resumeFile && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Selected: {applicationData.resumeFile.name} ({(applicationData.resumeFile.size / 1024 / 1024).toFixed(2)} MB)
                    </Typography>
                  </Box>
                )}
                {applicationData.uploading && (
                  <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LoadingSpinner size={16} />
                    <Typography variant="body2" color="text.secondary">
                      Uploading resume...
                    </Typography>
                  </Box>
                )}
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                  PDF or Word format, maximum 5MB
                </Typography>
              </Box>

              <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
                <TextField
                  name="referenceName"
                  label="Reference Name"
                  placeholder="Full name of reference"
                  value={applicationData.references.name}
                  onChange={handleReferenceChange('name')}
                  sx={{ flex: 1 }}
                  helperText="Teacher, coach, or mentor"
                />
                <TextField
                  name="referenceAffiliation"
                  label="Affiliation/Title"
                  placeholder="Teacher at XYZ School"
                  value={applicationData.references.affiliation}
                  onChange={handleReferenceChange('affiliation')}
                  sx={{ flex: 1 }}
                  helperText="Their role or organization"
                />
                <TextField
                  name="referenceEmail"
                  label="Email"
                  placeholder="reference@email.com"
                  value={applicationData.references.email}
                  onChange={handleReferenceChange('email')}
                  sx={{ flex: 1 }}
                  helperText="Contact email"
                />
                <TextField
                  name="referencePhone"
                  label="Phone"
                  placeholder="(555) 123-4567"
                  value={applicationData.references.phone}
                  onChange={handleReferenceChange('phone')}
                  sx={{ flex: 1 }}
                  helperText="Contact phone (optional)"
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