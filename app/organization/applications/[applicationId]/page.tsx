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
  Chip,
  Alert,
  Breadcrumbs,
  Link as MuiLink,
  Grid,
  Divider,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material"
import { 
  ArrowBack, 
  Person, 
  School, 
  Email, 
  Phone, 
  CheckCircle, 
  Cancel,
  Schedule,
  Work,
  Star,
  Message
} from "@mui/icons-material"
import { useAuth } from "@/contexts/AuthContext"
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { OrganizationProfile, Job, Application } from "@/lib/types"
import LoadingSpinner from "@/components/UI/LoadingSpinner"
import Link from "next/link"
import ProtectedRoute from "@/components/ProtectedRoute"
import { useRouter, useParams } from "next/navigation"

const ReviewApplicationPage: React.FC = () => {
  const { userProfile } = useAuth()
  const router = useRouter()
  const params = useParams()
  const applicationId = params.applicationId as string
  
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState("")
  const [application, setApplication] = useState<Application | null>(null)
  const [job, setJob] = useState<Job | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<"approve" | "decline" | null>(null)
  const [responseMessage, setResponseMessage] = useState("")

  const organizationProfile = userProfile as OrganizationProfile

  useEffect(() => {
    const fetchApplicationData = async () => {
      if (!applicationId || !userProfile) return

      try {
        // Fetch application
        const applicationDoc = await getDoc(doc(db, "applications", applicationId))
        
        if (!applicationDoc.exists()) {
          setError("Application not found")
          return
        }

        const applicationData = applicationDoc.data() as Application
        
        // Check if user owns the job this application is for
        if (applicationData.organizationId !== userProfile.uid) {
          setError("You don't have permission to view this application")
          return
        }

        // Convert timestamps
        const formattedApplication = {
          ...applicationData,
          id: applicationDoc.id,
          appliedAt: applicationData.appliedAt?.toDate ? applicationData.appliedAt.toDate() : new Date(applicationData.appliedAt) || new Date(),
          reviewedAt: applicationData.reviewedAt?.toDate ? applicationData.reviewedAt.toDate() : applicationData.reviewedAt ? new Date(applicationData.reviewedAt) : undefined,
        }

        setApplication(formattedApplication)

        // Fetch job details
        const jobDoc = await getDoc(doc(db, "jobs", applicationData.jobId))
        if (jobDoc.exists()) {
          const jobData = jobDoc.data() as Job
          setJob({
            ...jobData,
            id: jobDoc.id,
            date: jobData.date?.toDate ? jobData.date.toDate() : new Date(jobData.date) || new Date(),
            createdAt: jobData.createdAt?.toDate ? jobData.createdAt.toDate() : new Date(jobData.createdAt) || new Date(),
          })
        }

      } catch (err: any) {
        console.error("Error fetching application:", err)
        setError("Failed to load application data")
      } finally {
        setLoading(false)
      }
    }

    fetchApplicationData()
  }, [applicationId, userProfile])

  const handleAction = (action: "approve" | "decline") => {
    setActionType(action)
    setDialogOpen(true)
  }

  const handleSubmitDecision = async () => {
    if (!application || !actionType) return

    setUpdating(true)
    try {
      await updateDoc(doc(db, "applications", applicationId), {
        status: actionType === "approve" ? "approved" : "declined",
        reviewedAt: serverTimestamp(),
        reviewedBy: userProfile?.uid,
        organizationResponse: responseMessage,
        updatedAt: serverTimestamp(),
      })

      // Update local state
      setApplication(prev => prev ? {
        ...prev,
        status: actionType === "approve" ? "approved" : "declined",
        reviewedAt: new Date(),
        organizationResponse: responseMessage,
      } : null)

      setDialogOpen(false)
      setResponseMessage("")
      setActionType(null)

    } catch (err: any) {
      console.error("Error updating application:", err)
      setError("Failed to update application status")
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return <LoadingSpinner message="Loading application details..." />
  }

  if (error || !application) {
    return (
      <ProtectedRoute requiredRole="organization">
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error || "Application not found"}
          </Alert>
          <Button component={Link} href="/organization/dashboard" variant="outlined">
            Back to Dashboard
          </Button>
        </Container>
      </ProtectedRoute>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "success"
      case "declined": return "error"
      case "completed": return "info"
      default: return "warning"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return <CheckCircle />
      case "declined": return <Cancel />
      case "completed": return <Star />
      default: return <Schedule />
    }
  }

  return (
    <ProtectedRoute requiredRole="organization">
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 3 }}>
          <MuiLink component={Link} href="/organization/dashboard" color="inherit">
            Dashboard
          </MuiLink>
          <MuiLink component={Link} href="/organization/jobs" color="inherit">
            Jobs
          </MuiLink>
          {job && (
            <MuiLink component={Link} href={`/organization/jobs/${job.id}/applications`} color="inherit">
              {job.title} Applications
            </MuiLink>
          )}
          <Typography color="text.primary">Review Application</Typography>
        </Breadcrumbs>

        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
          <Box display="flex" alignItems="center">
            <ArrowBack 
              sx={{ cursor: "pointer", mr: 2 }} 
              onClick={() => router.back()} 
            />
            <Box>
              <Typography variant="h4" component="h1">
                Application Review
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {job?.title || "Job Application"}
              </Typography>
            </Box>
          </Box>
          
          <Chip 
            icon={getStatusIcon(application.status)}
            label={application.status.toUpperCase()}
            color={getStatusColor(application.status) as any}
            variant={application.status === "pending" ? "outlined" : "filled"}
            size="medium"
          />
        </Box>

        <Grid container spacing={3}>
          {/* Left Column - Volunteer Info */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Person sx={{ mr: 1, verticalAlign: "middle" }} />
                  Volunteer Information
                </Typography>
                
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Name
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {application.volunteerName}
                  </Typography>

                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    <Email sx={{ mr: 1, fontSize: 16, verticalAlign: "middle" }} />
                    Email
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {application.volunteerEmail}
                  </Typography>

                  {application.volunteerSchool && (
                    <>
                      <Typography variant="subtitle2" color="primary" gutterBottom>
                        <School sx={{ mr: 1, fontSize: 16, verticalAlign: "middle" }} />
                        School
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        {application.volunteerSchool}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Grade {application.volunteerGrade}
                      </Typography>
                    </>
                  )}

                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Applied Date
                  </Typography>
                  <Typography variant="body2">
                    {application.appliedAt.toLocaleDateString()} at {application.appliedAt.toLocaleTimeString()}
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Job Info Card */}
            {job && (
              <Card sx={{ mt: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <Work sx={{ mr: 1, verticalAlign: "middle" }} />
                    Job Details
                  </Typography>
                  
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Position
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {job.title}
                  </Typography>

                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Date & Location
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {job.date.toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {job.location}
                  </Typography>

                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Duration
                  </Typography>
                  <Typography variant="body2">
                    {job.duration || "Not specified"}
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Grid>

          {/* Right Column - Application Details */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Application Details
                </Typography>

                {/* Cover Letter */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Cover Letter
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: "grey.50" }}>
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                      {application.coverLetter || "No cover letter provided"}
                    </Typography>
                  </Paper>
                </Box>

                {/* Availability */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Availability
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: "grey.50" }}>
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                      {application.availability || "No availability information provided"}
                    </Typography>
                  </Paper>
                </Box>

                {/* Skills */}
                {application.skills && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      Relevant Skills
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: "grey.50" }}>
                      <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                        {application.skills}
                      </Typography>
                    </Paper>
                  </Box>
                )}

                {/* References */}
                {application.references && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      References
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: "grey.50" }}>
                      <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                        {application.references}
                      </Typography>
                    </Paper>
                  </Box>
                )}

                <Divider sx={{ my: 3 }} />

                {/* Organization Response */}
                {application.organizationResponse && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      <Message sx={{ mr: 1, fontSize: 16, verticalAlign: "middle" }} />
                      Your Response
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: "primary.50" }}>
                      <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                        {application.organizationResponse}
                      </Typography>
                    </Paper>
                    {application.reviewedAt && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                        Reviewed on {application.reviewedAt.toLocaleDateString()} at {application.reviewedAt.toLocaleTimeString()}
                      </Typography>
                    )}
                  </Box>
                )}

                {/* Action Buttons */}
                {application.status === "pending" && (
                  <Box display="flex" gap={2} justifyContent="center" sx={{ mt: 4 }}>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<Cancel />}
                      onClick={() => handleAction("decline")}
                      size="large"
                    >
                      Decline Application
                    </Button>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<CheckCircle />}
                      onClick={() => handleAction("approve")}
                      size="large"
                    >
                      Approve Application
                    </Button>
                  </Box>
                )}

                {application.status !== "pending" && (
                  <Box textAlign="center" sx={{ mt: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      This application has been {application.status}.
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Decision Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            {actionType === "approve" ? "Approve Application" : "Decline Application"}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {actionType === "approve" 
                ? "Send a message to the volunteer with next steps or additional information."
                : "Please provide feedback to help the volunteer understand your decision."
              }
            </Typography>
            <TextField
              label={actionType === "approve" ? "Welcome message & next steps" : "Feedback message"}
              placeholder={actionType === "approve" 
                ? "Welcome! Please arrive 15 minutes early. Contact us at..."
                : "Thank you for your interest. We've selected other candidates but encourage you to apply for future opportunities."
              }
              value={responseMessage}
              onChange={(e) => setResponseMessage(e.target.value)}
              multiline
              rows={4}
              fullWidth
              required
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitDecision}
              variant="contained"
              color={actionType === "approve" ? "success" : "error"}
              disabled={updating || !responseMessage.trim()}
            >
              {updating ? <LoadingSpinner size={20} /> : 
                (actionType === "approve" ? "Approve & Send" : "Decline & Send")
              }
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </ProtectedRoute>
  )
}

export default ReviewApplicationPage
