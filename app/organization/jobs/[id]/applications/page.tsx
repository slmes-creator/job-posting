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
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Avatar,
} from "@mui/material"
import { 
  ArrowBack, 
  Person, 
  School, 
  Email, 
  Phone, 
  CheckCircle, 
  Cancel,
  Work,
  Message,
  Search,
} from "@mui/icons-material"
import { useAuth } from "@/contexts/AuthContext"
import { doc, getDoc, updateDoc, serverTimestamp, collection, query, where, orderBy, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Job, Application } from "@/lib/types"
import LoadingSpinner from "@/components/UI/LoadingSpinner"
import Link from "next/link"
import ProtectedRoute from "@/components/ProtectedRoute"
import { useRouter, useParams } from "next/navigation"

import { DayPicker, type DateRange } from "react-day-picker"
import 'react-day-picker/dist/style.css'

const ReviewApplicationPage: React.FC = () => {
  const { userProfile } = useAuth()
  const params = useParams()
  const id = params.id as string

  const [applications, setApplications] = useState<Application[]>([])
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<"approve" | "decline" | null>(null)
  const [responseMessage, setResponseMessage] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "declined">("all")
  const [selectedApprovalDates, setSelectedApprovalDates] = useState<DateRange[]>([])
  const [currentRange, setCurrentRange] = useState<DateRange | undefined>()
  const [showDateSelector, setShowDateSelector] = useState(false)

  useEffect(() => {
    if (!userProfile || !id) return

    const fetchApplicationData = async () => {
      try {
        // Fetch job details first for authorization
        const jobDoc = await getDoc(doc(db, "jobs", id))
        if (!jobDoc.exists()) {
          setError("Job not found")
          setLoading(false)
          return
        }

        const jobData = jobDoc.data() as Job
        
        // Check if user owns this job
        if (jobData.organizationId !== userProfile.uid) {
          setError("You don't have permission to view these applications")
          setLoading(false)
          return
        }

        setJob({
          ...jobData,
          id: jobDoc.id,
          date: jobData.date?.toDate ? jobData.date.toDate() : new Date(jobData.date) || new Date(),
          createdAt: jobData.createdAt?.toDate ? jobData.createdAt.toDate() : new Date(jobData.createdAt) || new Date(),
        })

        // Now fetch applications for this job
        const applicationsRef = collection(db, "applications")
        const q = query(
          applicationsRef,
          where("jobId", "==", id),
          orderBy("appliedAt", "desc")
        )
        const querySnapshot = await getDocs(q)
        
        // Process ALL applications
        const applicationsData = querySnapshot.docs.map(doc => {
          const data = doc.data() as Application
          return {
            ...data,
            id: doc.id,
            appliedAt: data.appliedAt?.toDate ? data.appliedAt.toDate() : new Date(data.appliedAt) || new Date(),
            reviewedAt: data.reviewedAt?.toDate ? data.reviewedAt.toDate() : data.reviewedAt ? new Date(data.reviewedAt) : undefined,
          }
        })

        setApplications(applicationsData)
        if (applicationsData.length > 0) {
          setSelectedApplication(applicationsData[0]) // Auto-select first application
        }

      } catch (err: any) {
        console.error("Error fetching applications:", err)
        setError("Failed to load application data")
      } finally {
        setLoading(false)
      }
    }

    fetchApplicationData()
  }, [id, userProfile])

  const handleChangeApplication = (selectedApp: Application) => {
    setSelectedApplication(selectedApp)
  }

  const handleAction = (action: "approve" | "decline") => {
    setActionType(action)
    setDialogOpen(true)
  }

  const sendApplicationEmail = async (
    email: string,
    volunteerName: string,
    jobTitle: string,
    decision: "approved" | "declined",
    message: string,
    organizationName: string,
  ) => {
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          volunteerName,
          jobTitle,
          decision,
          message,
          organizationName,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send email')
      }

      return await response.json()
    } catch (error) {
      console.error('Error sending email:', error)
      throw error
    }
  }

  const handleSubmitDecision = async () => {
    if (!selectedApplication || !actionType || !responseMessage.trim()) return

    setUpdating(true)
    try {
      // Prepare update data
      const updateData: any = {
        status: actionType === "approve" ? "approved" : "declined",
        reviewedAt: serverTimestamp(),
        organizationResponse: responseMessage.trim(),
        updatedAt: serverTimestamp(),
      }

      // Add approved dates if approving and ranges are selected
      if (actionType === "approve" && selectedApprovalDates.length > 0) {
        updateData.approvedDateRanges = selectedApprovalDates.map(range => ({
          from: range.from,
          to: range.to,
          formattedRange: `${range.from?.toLocaleDateString()} - ${range.to?.toLocaleDateString()}`
        }))

        // Create a summary for emails
        const datesSummary = selectedApprovalDates
          .map(range => `${range.from?.toLocaleDateString()} - ${range.to?.toLocaleDateString()}`)
          .join('\n')
        updateData.approvedDatesSummary = datesSummary
      }

      // Update the application status in Firestore
      await updateDoc(doc(db, "applications", selectedApplication.id), updateData)

      // Send email notification
      if (job && userProfile) {
        try {
          let emailMessage = responseMessage.trim()

          if (actionType === "approve" && selectedApprovalDates.length > 0) {
            const datesSummary = selectedApprovalDates
              .map((range, index) => `Range ${index + 1}: ${range.from?.toLocaleDateString()} - ${range.to?.toLocaleDateString()}`)
              .join('\n')
            emailMessage += `\n\nApproved Date Ranges:\n${datesSummary}`
          }

          await sendApplicationEmail(
            selectedApplication.volunteerEmail,
            selectedApplication.volunteerName,
            job.title,
            actionType === "approve" ? "approved" : "declined",
            emailMessage,
            userProfile.displayName || "Organization"
          )
        } catch (emailError) {
          console.error('Failed to send email:', emailError)
        }
      }

      // Update local state
      const reviewedAt = new Date()
      setApplications(prev => prev.map(app =>
        app.id === selectedApplication.id
          ? {
            ...app,
            status: actionType === "approve" ? "approved" : "declined",
            reviewedAt,
            organizationResponse: responseMessage.trim(),
            approvedDateRanges: actionType === "approve" && selectedApprovalDates.length > 0
              ? selectedApprovalDates.map(range => ({
                from: range.from,
                to: range.to,
                formattedRange: `${range.from?.toLocaleDateString()} - ${range.to?.toLocaleDateString()}`
              }))
              : undefined
          }
          : app
      ))

      setSelectedApplication(prev => prev ? {
        ...prev,
        status: actionType === "approve" ? "approved" : "declined",
        reviewedAt,
        organizationResponse: responseMessage.trim(),
        approvedDateRanges: actionType === "approve" && selectedApprovalDates.length > 0
          ? selectedApprovalDates.map(range => ({
            from: range.from,
            to: range.to,
            formattedRange: `${range.from?.toLocaleDateString()} - ${range.to?.toLocaleDateString()}`
          }))
          : undefined
      } : null)

      // Reset dialog state
      setDialogOpen(false)
      setResponseMessage("")
      setActionType(null)
      setSelectedApprovalDates([])
      setCurrentRange(undefined)
      setShowDateSelector(false)

    } catch (error) {
      console.error("Error updating application:", error)
      setError("Failed to update application status")
    } finally {
      setUpdating(false)
    }
  }

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.volunteerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.volunteerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (app.volunteerSchool && app.volunteerSchool.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === "all" || app.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <ProtectedRoute>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
            <LoadingSpinner />
          </Box>
        </Container>
      </ProtectedRoute>
    )
  }

  if (error) {
    return (
      <ProtectedRoute>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            component={Link}
            href="/organization/dashboard"
          >
            Back to Dashboard
          </Button>
        </Container>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Breadcrumbs sx={{ mb: 2 }}>
            <MuiLink component={Link} href="/organization/dashboard" color="inherit">
              Dashboard
            </MuiLink>
            <Typography color="text.primary">Review Applications</Typography>
          </Breadcrumbs>

          <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                Review Applications
              </Typography>
              {job && (
                <Typography variant="h6" color="text.secondary">
                  {job.title} • {applications.length} Application{applications.length !== 1 ? 's' : ''}
                </Typography>
              )}
            </Box>
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              component={Link}
              href="/organization/dashboard"
            >
              Back to Dashboard
            </Button>
          </Box>
        </Box>

        {applications.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: "center", py: 8 }}>
              <Work sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No applications yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Applications will appear here once volunteers start applying for this job.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Box display="flex" gap={3} sx={{ height: 'calc(100vh - 200px)', minWidth: 0 }}>
            {/* Left Sidebar - Applications List */}
            <Card sx={{ 
              width: 400,
              minWidth: 400,
              flexShrink: 0, 
              display: 'flex', 
              flexDirection: 'column' 
              }}>
              <CardContent sx={{ pb: 1 }}>
                <Typography variant="h6" gutterBottom>
                  Applications ({filteredApplications.length})
                </Typography>
                
                {/* Search and Filter */}
                <TextField
                  size="small"
                  placeholder="Search applications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  fullWidth
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                />

                <Box display="flex" gap={1} mb={2} flexWrap="wrap">
                  {(['all', 'pending', 'approved', 'declined'] as const).map((status) => (
                    <Chip
                      key={status}
                      label={status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                      variant={statusFilter === status ? 'filled' : 'outlined'}
                      color={statusFilter === status ? 'primary' : 'default'}
                      size="small"
                      onClick={() => setStatusFilter(status)}
                      sx={{ textTransform: 'capitalize' }}
                    />
                  ))}
                </Box>
              </CardContent>

              <Divider />

              {/* Applications List */}
              <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                <List disablePadding>
                  {filteredApplications.map((app) => (
                    <ListItem key={app.id} disablePadding>
                      <ListItemButton
                        selected={selectedApplication?.id === app.id}
                        onClick={() => handleChangeApplication(app)}
                        sx={{ px: 2, py: 1.5 }}
                      >
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                          {app.volunteerName.charAt(0).toUpperCase()}
                        </Avatar>
                        <ListItemText
                          primary={
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Typography variant="subtitle2" noWrap component="span">
                                {app.volunteerName}
                              </Typography>
                              <Chip
                                label={app.status}
                                size="small"
                                color={
                                  app.status === 'approved' ? 'success' :
                                  app.status === 'declined' ? 'error' : 'default'
                                }
                                variant="outlined"
                              />
                            </span>
                          }
                          secondary={
                            <span>
                              <Typography variant="caption" color="text.secondary" noWrap component="span">
                                {app.volunteerEmail}
                              </Typography>
                              <br />
                              <Typography variant="caption" color="text.secondary" component="span">
                                Applied {app.appliedAt.toLocaleDateString()}
                              </Typography>
                            </span>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Card>

            {/* Right Panel - Application Details */}
            <Card sx={{ 
              flexGrow: 1,
              minWidth: 0,
              display: 'flex', 
              flexDirection: 'column' 
              }}>
              {selectedApplication ? (
                <CardContent sx={{ flexGrow: 1, overflow: 'auto' }}>
                  {/* Volunteer Header */}
                  <Box sx={{ mb: 4 }}>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <Avatar sx={{ bgcolor: 'primary.main', width: 64, height: 64 }}>
                        <Person sx={{ fontSize: 32 }} />
                      </Avatar>
                      <Box flexGrow={1}>
                        <Typography variant="h5" gutterBottom>
                          {selectedApplication.volunteerName}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                          <Chip
                            label={selectedApplication.status}
                            color={
                              selectedApplication.status === 'approved' ? 'success' :
                              selectedApplication.status === 'declined' ? 'error' : 'warning'
                            }
                            variant="filled"
                          />
                          <Typography variant="body2" color="text.secondary">
                            Applied on {selectedApplication.appliedAt.toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    {/* Contact Information */}
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Email sx={{ color: "text.secondary", fontSize: 16 }} />
                          <Typography variant="body2">{selectedApplication.volunteerEmail}</Typography>
                        </Box>
                      </Grid>
                      {selectedApplication.volunteerPhone && (
                        <Grid item xs={12} sm={6}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Phone sx={{ color: "text.secondary", fontSize: 16 }} />
                            <Typography variant="body2">{selectedApplication.volunteerPhone}</Typography>
                          </Box>
                        </Grid>
                      )}
                      {selectedApplication.volunteerSchool && (
                        <Grid item xs={12} sm={6}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <School sx={{ color: "text.secondary", fontSize: 16 }} />
                            <Typography variant="body2">{selectedApplication.volunteerSchool}</Typography>
                          </Box>
                        </Grid>
                      )}
                    </Grid>
                  </Box>

                  <Box display="flex" gap={4} sx={{ height: '100%' }}>
                    {/* Left Column - Application Content */}
                    <Box sx={{ flex: 2 }}>
                      {/* Cover Letter */}
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" color="primary" gutterBottom>
                          Cover Letter
                        </Typography>
                        <Paper variant="outlined" sx={{ p: 2, bgcolor: "grey.50" }}>
                          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                            {selectedApplication.coverLetter || "No cover letter provided"}
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
                            {selectedApplication.availability || "No availability information provided"}
                          </Typography>
                        </Paper>
                      </Box>

                      {/* Skills */}
                      {selectedApplication.skills && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="subtitle2" color="primary" gutterBottom>
                            Relevant Skills
                          </Typography>
                          <Paper variant="outlined" sx={{ p: 2, bgcolor: "grey.50" }}>
                            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                              {selectedApplication.skills}
                            </Typography>
                          </Paper>
                        </Box>
                      )}
                    </Box>

                    {/* Right Column - References & Actions */}
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      {/* References */}
                      {(selectedApplication.references.name || selectedApplication.references.affiliation || 
                        selectedApplication.references.email || selectedApplication.references.phone) && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="subtitle2" color="primary" gutterBottom>
                            Reference Information
                          </Typography>
                          <Paper variant="outlined" sx={{ p: 2, bgcolor: "grey.50" }}>
                            <Grid container spacing={2}>
                              {selectedApplication.references.name && (
                                <Grid item xs={12}>
                                  <Typography variant="caption" color="text.secondary">
                                    Name
                                  </Typography>
                                  <Typography variant="body2">
                                    {selectedApplication.references.name}
                                  </Typography>
                                </Grid>
                              )}
                              {selectedApplication.references.affiliation && (
                                <Grid item xs={12}>
                                  <Typography variant="caption" color="text.secondary">
                                    Affiliation/Title
                                  </Typography>
                                  <Typography variant="body2">
                                    {selectedApplication.references.affiliation}
                                  </Typography>
                                </Grid>
                              )}
                              {selectedApplication.references.email && (
                                <Grid item xs={12}>
                                  <Typography variant="caption" color="text.secondary">
                                    Email
                                  </Typography>
                                  <Typography variant="body2">
                                    {selectedApplication.references.email}
                                  </Typography>
                                </Grid>
                              )}
                              {selectedApplication.references.phone && (
                                <Grid item xs={12}>
                                  <Typography variant="caption" color="text.secondary">
                                    Phone
                                  </Typography>
                                  <Typography variant="body2">
                                    {selectedApplication.references.phone}
                                  </Typography>
                                </Grid>
                              )}
                            </Grid>
                          </Paper>
                        </Box>
                      )}

                      {/* Resume/Portfolio */}
                      {selectedApplication.resumeUrl && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="subtitle2" color="primary" gutterBottom>
                            Resume/Portfolio
                          </Typography>
                          <Paper variant="outlined" sx={{ p: 2, bgcolor: "grey.50" }}>
                            <Button
                              variant="outlined"
                              color="primary"
                              fullWidth
                              onClick={() => window.open(selectedApplication.resumeUrl, '_blank')}
                              sx={{ mb: 1 }}
                            >
                              📄 View Resume/Portfolio
                            </Button>
                            <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
                              Opens in new tab
                            </Typography>
                          </Paper>
                        </Box>
                      )}

                      {/* Organization Response */}
                      {selectedApplication.organizationResponse && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="subtitle2" color="primary" gutterBottom>
                            <Message sx={{ mr: 1, fontSize: 16, verticalAlign: "middle" }} />
                            Your Response
                          </Typography>
                          <Paper variant="outlined" sx={{ p: 2, bgcolor: "primary.50" }}>
                            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                              {selectedApplication.organizationResponse}
                            </Typography>
                          </Paper>
                          {selectedApplication.reviewedAt && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                              Reviewed on {selectedApplication.reviewedAt.toLocaleDateString()} at {selectedApplication.reviewedAt.toLocaleTimeString()}
                            </Typography>
                          )}
                        </Box>
                      )}

                      {/* Action Buttons - Now positioned at bottom right */}
                      <Box sx={{ mt: 'auto' }}>
                        {selectedApplication.status === "pending" && (
                          <Box display="flex" flexDirection="column" gap={2}>
                            <Button
                              variant="contained"
                              color="success"
                              startIcon={<CheckCircle />}
                              onClick={() => handleAction("approve")}
                              size="large"
                              fullWidth
                            >
                              Approve
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              startIcon={<Cancel />}
                              onClick={() => handleAction("decline")}
                              size="large"
                              fullWidth
                            >
                              Decline
                            </Button>
                          </Box>
                        )}

                        {selectedApplication.status !== "pending" && (
                          <Box textAlign="center">
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                              This application has been {selectedApplication.status}.
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              ) : (
                <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="h6" color="text.secondary">
                    Select an application to review
                  </Typography>
                </Box>
              )}
            </Card>
          </Box>
        )}

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

            {/* Date Selection for Approval */}
            {actionType === "approve" && (
              <Box sx={{ mb: 3 }}>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <Typography variant="subtitle2" color="primary">
                    Approved Dates
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setShowDateSelector(!showDateSelector)}
                  >
                    {showDateSelector ? "Hide Calendar" : "Select Dates"}
                  </Button>
                </Box>

                {/* Show volunteer's availability for reference */}
                {selectedApplication?.availability && (
                  <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: "grey.50" }}>
                    <Typography variant="caption" color="text.secondary">
                      Volunteer's Available Dates:
                    </Typography>
                    <Typography variant="body2">
                      {selectedApplication.availability}
                    </Typography>
                  </Paper>
                )}

                {/* Date Picker */}
                {showDateSelector && (
                  <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Select date ranges for this volunteer. You can add multiple ranges.
                    </Typography>

                    <DayPicker
                      mode="range"
                      selected={currentRange}
                      onSelect={setCurrentRange}
                      disabled={{ before: new Date() }}
                      showOutsideDays
                      captionLayout="dropdown"
                      className="range-calendar"
                    />

                    {/* Add Range Button */}
                    {currentRange?.from && currentRange?.to && (
                      <Box sx={{ mt: 2, textAlign: 'center' }}>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => {
                            if (currentRange.from && currentRange.to) {
                              // Check for overlapping ranges
                              const isOverlapping = selectedApprovalDates.some(range => {
                                if (!range.from || !range.to || !currentRange.from || !currentRange.to) return false
                                return (
                                  (currentRange.from >= range.from && currentRange.from <= range.to) ||
                                  (currentRange.to >= range.from && currentRange.to <= range.to) ||
                                  (currentRange.from <= range.from && currentRange.to >= range.to)
                                )
                              })

                              if (!isOverlapping) {
                                setSelectedApprovalDates(prev => [...prev, currentRange])
                                setCurrentRange(undefined)
                              } else {
                                alert('This date range overlaps with an existing range. Please select different dates.')
                              }
                            }
                          }}
                        >
                          Add Date Range
                        </Button>
                      </Box>
                    )}

                    {/* Current selection preview */}
                    {currentRange?.from && currentRange?.to && (
                      <Box sx={{ mt: 2, p: 1, bgcolor: 'primary.50', borderRadius: 1 }}>
                        <Typography variant="caption" color="primary">
                          Current selection: {currentRange.from.toLocaleDateString()} - {currentRange.to.toLocaleDateString()}
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                )}

                {/* Show all selected date ranges */}
                {selectedApprovalDates.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Approved Date Ranges ({selectedApprovalDates.length}):
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {selectedApprovalDates.map((range, index) => (
                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={`${range.from?.toLocaleDateString()} - ${range.to?.toLocaleDateString()}`}
                            color="success"
                            variant="filled"
                            onDelete={() => {
                              setSelectedApprovalDates(prev => prev.filter((_, i) => i !== index))
                            }}
                            sx={{ flexGrow: 1 }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            Range {index + 1}
                          </Typography>
                        </Box>
                      ))}
                    </Box>

                    {/* Clear all button */}
                    <Button
                      size="small"
                      color="error"
                      onClick={() => setSelectedApprovalDates([])}
                      sx={{ mt: 1 }}
                    >
                      Clear All Ranges
                    </Button>
                  </Box>
                )}
              </Box>
            )}

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
