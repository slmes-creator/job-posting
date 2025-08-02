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
  Avatar,
} from "@mui/material"
import { 
  ArrowBack, 
  LocationOn,
  Schedule,
  People,
  CalendarToday,
  Business,
  Email,
  Phone,
  Language,
  CheckCircle,
  Cancel,
  AccessTime,
  Category,
} from "@mui/icons-material"
import { useAuth } from "@/contexts/AuthContext"
import { doc, getDoc, updateDoc, serverTimestamp, collection, query, where, orderBy, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Job, Application } from "@/lib/types"
import LoadingSpinner from "@/components/UI/LoadingSpinner"
import Link from "next/link"
import ProtectedRoute from "@/components/ProtectedRoute"
import { useRouter, useParams } from "next/navigation"

const ViewJobPage: React.FC = () => {
    const { userProfile, loading: authLoading } = useAuth()
    const router = useRouter()
    const params = useParams()
    const jobId = params.id as string

    const [job, setJob] = useState<Job | null>(null)
    const [application, setApplication] = useState<Application | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchJobAndApplication = async () => {
            // Wait for auth to finish loading
            if (authLoading) {
                return
            }

            if (!userProfile || !jobId) {
                setError("Invalid user or job ID")
                console.log("Debug - userProfile:", userProfile, "jobId:", jobId)
                setLoading(false)
                return
            }

            try {
                // Fetch job details
                const jobDoc = await getDoc(doc(db, "jobs", jobId))
                if (!jobDoc.exists()) {
                    setError("Job not found")
                    return
                }

                const jobData = jobDoc.data() as Job
                setJob({
                    ...jobData,
                    id: jobDoc.id,
                    date: jobData.date && typeof (jobData.date as any).toDate === 'function' 
                        ? (jobData.date as any).toDate() 
                        : new Date(jobData.date as any) || new Date(),
                    createdAt: jobData.createdAt && typeof (jobData.createdAt as any).toDate === 'function' 
                        ? (jobData.createdAt as any).toDate() 
                        : new Date(jobData.createdAt as any) || new Date(),
                })

                // Fetch user's application for this job
                const applicationQuery = query(
                    collection(db, "applications"),
                    where("volunteerId", "==", userProfile.uid),
                    where("jobId", "==", jobId)
                )
                const applicationSnapshot = await getDocs(applicationQuery)
                
                if (!applicationSnapshot.empty) {
                    const appData = applicationSnapshot.docs[0].data() as Application
                    setApplication({
                        ...appData,
                        id: applicationSnapshot.docs[0].id,
                        appliedAt: appData.appliedAt && typeof (appData.appliedAt as any).toDate === 'function'
                            ? (appData.appliedAt as any).toDate()
                            : new Date(appData.appliedAt as any) || new Date(),
                        reviewedAt: appData.reviewedAt && typeof (appData.reviewedAt as any).toDate === 'function'
                            ? (appData.reviewedAt as any).toDate()
                            : appData.reviewedAt ? new Date(appData.reviewedAt as any) : undefined,
                    })
                }

            } catch (err: any) {
                console.error("Error fetching job:", err)
                setError("Failed to load job data")
            } finally {
                setLoading(false)
            }
        }

        fetchJobAndApplication()
    }, [userProfile, jobId, authLoading])


    const handleApply = () => {
        router.push(`/volunteer/jobs/${jobId}/apply`)
    }

    if (loading || authLoading) {
        return <LoadingSpinner message="Loading job details..." />
    }

    if (error) {
        return (
            <ProtectedRoute requiredRole="volunteer">
                <Container maxWidth="md" sx={{ py: 4 }}>
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBack />}
                        component={Link}
                        href="/volunteer/jobs"
                    >
                        Back to Jobs
                    </Button>
                </Container>
            </ProtectedRoute>
        )
    }

    if (!job) {
        return (
            <ProtectedRoute requiredRole="volunteer">
                <Container maxWidth="md" sx={{ py: 4 }}>
                    <Alert severity="info">Job not found</Alert>
                </Container>
            </ProtectedRoute>
        )
    }

    return (
        <ProtectedRoute requiredRole="volunteer">
            <Container maxWidth="lg" sx={{ py: 4 }}>
                {/* Breadcrumbs */}
                <Breadcrumbs sx={{ mb: 3 }}>
                    <MuiLink component={Link} href="/volunteer/jobs" color="inherit">
                        Jobs
                    </MuiLink>
                    <Typography color="text.primary">{job.title}</Typography>
                </Breadcrumbs>

                {/* Hero Section */}
                <Card sx={{ mb: 4 }}>
                    <CardContent sx={{ p: 4 }}>
                        <Box display="flex" alignItems="start" gap={3} mb={3}>
                            <Avatar sx={{ bgcolor: "primary.main", width: 64, height: 64 }}>
                                <Business sx={{ fontSize: 32 }} />
                            </Avatar>
                            <Box flexGrow={1}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    {job.organizationName}
                                </Typography>
                                <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
                                    {job.title}
                                </Typography>
                                <Box display="flex" gap={2} flexWrap="wrap" mb={3}>
                                    <Chip 
                                        icon={<LocationOn />} 
                                        label={job.location} 
                                        variant="outlined" 
                                    />
                                    <Chip 
                                        icon={<CalendarToday />} 
                                        label={job.date.toLocaleDateString()} 
                                        variant="outlined" 
                                    />
                                    <Chip 
                                        icon={<Schedule />} 
                                        label={`${job.startTime} - ${job.endTime}`} 
                                        variant="outlined" 
                                    />
                                    <Chip 
                                        icon={<AccessTime />} 
                                        label={`${job.hoursOffered} hours`} 
                                        variant="outlined" 
                                        color="primary"
                                    />
                                    <Chip 
                                        icon={<People />} 
                                        label={`${job.currentVolunteers}/${job.maxVolunteers} volunteers`} 
                                        variant="outlined" 
                                    />
                                    <Chip 
                                        label={job.status} 
                                        color={job.status === "open" ? "success" : "default"} 
                                    />
                                </Box>
                            </Box>
                        </Box>

                        {/* Quick Actions - only show if no application exists */}
                        {!application && job.status === "open" && (
                            <Box display="flex" gap={2}>
                                <Button
                                    variant="contained"
                                    size="large"
                                    onClick={handleApply}
                                    startIcon={<CheckCircle />}
                                >
                                    Apply Now
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="large"
                                >
                                    Save Job
                                </Button>
                            </Box>
                        )}
                    </CardContent>
                </Card>

                {/* Main Content + Sidebar Layout */}
                <Grid container spacing={4}>
                    {/* Main Content */}
                    <Grid item xs={12} md={8}>
                        {/* Description */}
                        <Card sx={{ mb: 3 }}>
                            <CardContent>
                                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                                    📝 Description
                                </Typography>
                                <Typography variant="body1" sx={{ lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                                    {job.description}
                                </Typography>
                            </CardContent>
                        </Card>

                        {/* Requirements */}
                        {job.requirements && Array.isArray(job.requirements) && job.requirements.length > 0 && (
                            <Card sx={{ mb: 3 }}>
                                <CardContent>
                                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                                        🎯 Requirements
                                    </Typography>
                                    <Box component="ul" sx={{ pl: 2, m: 0 }}>
                                        {job.requirements.map((requirement, index) => (
                                            <Typography component="li" key={index} sx={{ mb: 1 }}>
                                                {requirement}
                                            </Typography>
                                        ))}
                                    </Box>
                                </CardContent>
                            </Card>
                        )}

                        {/* Schedule & Logistics */}
                        <Card>
                            <CardContent>
                                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                                    📅 Schedule & Logistics
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <Box display="flex" alignItems="center" gap={1} mb={2}>
                                            <CalendarToday color="primary" />
                                            <Box>
                                                <Typography variant="subtitle2">Date</Typography>
                                                <Typography variant="body2">{job.date.toLocaleDateString()}</Typography>
                                            </Box>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Box display="flex" alignItems="center" gap={1} mb={2}>
                                            <Schedule color="primary" />
                                            <Box>
                                                <Typography variant="subtitle2">Time</Typography>
                                                <Typography variant="body2">{job.startTime} - {job.endTime}</Typography>
                                            </Box>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Box display="flex" alignItems="center" gap={1} mb={2}>
                                            <AccessTime color="primary" />
                                            <Box>
                                                <Typography variant="subtitle2">Duration</Typography>
                                                <Typography variant="body2">{job.hoursOffered} hours</Typography>
                                            </Box>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Box display="flex" alignItems="center" gap={1} mb={2}>
                                            <LocationOn color="primary" />
                                            <Box>
                                                <Typography variant="subtitle2">Location</Typography>
                                                <Typography variant="body2">{job.location}</Typography>
                                            </Box>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Sidebar */}
                    <Grid item xs={12} md={4}>
                        {/* At a Glance */}
                        <Card sx={{ mb: 3 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                                    📊 At a Glance
                                </Typography>
                                <Box display="flex" flexDirection="column" gap={2}>
                                    <Box display="flex" justifyContent="space-between">
                                        <Typography variant="body2" color="text.secondary">Hours:</Typography>
                                        <Typography variant="body2" fontWeight="medium">{job.hoursOffered} hours</Typography>
                                    </Box>
                                    <Box display="flex" justifyContent="space-between">
                                        <Typography variant="body2" color="text.secondary">Date:</Typography>
                                        <Typography variant="body2" fontWeight="medium">{job.date.toLocaleDateString()}</Typography>
                                    </Box>
                                    <Box display="flex" justifyContent="space-between">
                                        <Typography variant="body2" color="text.secondary">Time:</Typography>
                                        <Typography variant="body2" fontWeight="medium">{job.startTime} - {job.endTime}</Typography>
                                    </Box>
                                    <Box display="flex" justifyContent="space-between">
                                        <Typography variant="body2" color="text.secondary">Location:</Typography>
                                        <Typography variant="body2" fontWeight="medium">{job.location}</Typography>
                                    </Box>
                                    <Box display="flex" justifyContent="space-between">
                                        <Typography variant="body2" color="text.secondary">Volunteers:</Typography>
                                        <Typography variant="body2" fontWeight="medium">{job.currentVolunteers}/{job.maxVolunteers}</Typography>
                                    </Box>
                                    <Divider />
                                    <Box display="flex" justifyContent="space-between">
                                        <Typography variant="body2" color="text.secondary">Status:</Typography>
                                        <Chip 
                                            label={job.status} 
                                            size="small"
                                            color={job.status === "open" ? "success" : "default"} 
                                        />
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>

                        {/* Organization Info */}
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                                    🏢 Organization
                                </Typography>
                                <Box display="flex" alignItems="center" gap={2} mb={2}>
                                    <Avatar sx={{ bgcolor: "primary.main" }}>
                                        <Business />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight="medium">
                                            {job.organizationName}
                                        </Typography>
                                    </Box>
                                </Box>
                                
                                <Divider sx={{ my: 2 }} />
                                
                                <Typography variant="subtitle2" gutterBottom>
                                    📞 Contact Information
                                </Typography>
                                <Box display="flex" flexDirection="column" gap={1}>
                                    {(job as any).contactEmail && (
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <Email fontSize="small" color="action" />
                                            <Typography variant="body2">{(job as any).contactEmail}</Typography>
                                        </Box>
                                    )}
                                    {(job as any).contactPhone && (
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <Phone fontSize="small" color="action" />
                                            <Typography variant="body2">{(job as any).contactPhone}</Typography>
                                        </Box>
                                    )}
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Application Status Section */}
                <Card sx={{ mt: 4 }}>
                    <CardContent sx={{ p: 4 }}>
                        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                            Your Application Status
                        </Typography>
                        
                        {!application ? (
                            /* No Application - Show Apply Button */
                            <Box textAlign="center" py={3}>
                                <Typography variant="h6" gutterBottom>
                                    Ready to make a difference?
                                </Typography>
                                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                                    You haven't applied for this opportunity yet. Click below to submit your application!
                                </Typography>
                                {job.status === "open" ? (
                                    <Button
                                        variant="contained"
                                        size="large"
                                        onClick={handleApply}
                                        startIcon={<CheckCircle />}
                                    >
                                        Apply for This Opportunity
                                    </Button>
                                ) : (
                                    <Alert severity="info">
                                        This opportunity is no longer accepting applications.
                                    </Alert>
                                )}
                            </Box>
                        ) : application.status === "pending" ? (
                            /* Pending Application */
                            <Box>
                                <Alert severity="info" sx={{ mb: 3 }}>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <Schedule />
                                        <Typography variant="subtitle1" fontWeight="medium">
                                            Application Under Review
                                        </Typography>
                                    </Box>
                                </Alert>
                                <Typography variant="body1" gutterBottom>
                                    Your application was submitted on <strong>{application.appliedAt.toLocaleDateString()}</strong> and is currently being reviewed by the organization.
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    You'll receive an email notification once they make a decision. Check back here for updates!
                                </Typography>
                            </Box>
                        ) : application.status === "approved" ? (
                            /* Approved Application */
                            <Box>
                                <Alert severity="success" sx={{ mb: 3 }}>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <CheckCircle />
                                        <Typography variant="subtitle1" fontWeight="medium">
                                            Congratulations! You've been accepted!
                                        </Typography>
                                    </Box>
                                </Alert>
                                <Typography variant="body1" gutterBottom>
                                    Your application was approved on <strong>{application.reviewedAt?.toLocaleDateString()}</strong>.
                                </Typography>
                                
                                {application.organizationResponse && (
                                    <Paper variant="outlined" sx={{ p: 3, mt: 2, bgcolor: "success.50" }}>
                                        <Typography variant="subtitle2" color="success.main" gutterBottom>
                                            Message from {job.organizationName}:
                                        </Typography>
                                        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                                            {application.organizationResponse}
                                        </Typography>
                                    </Paper>
                                )}
                                
                                <Box mt={3}>
                                    <Typography variant="body2" color="text.secondary">
                                        Next steps: Check your email for detailed instructions and contact information.
                                    </Typography>
                                </Box>
                            </Box>
                        ) : (
                            /* Declined Application */
                            <Box>
                                <Alert severity="error" sx={{ mb: 3 }}>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <Cancel />
                                        <Typography variant="subtitle1" fontWeight="medium">
                                            Application Not Selected
                                        </Typography>
                                    </Box>
                                </Alert>
                                <Typography variant="body1" gutterBottom>
                                    Unfortunately, your application was not selected for this opportunity.
                                </Typography>
                                
                                {application.organizationResponse && (
                                    <Paper variant="outlined" sx={{ p: 3, mt: 2, bgcolor: "grey.50" }}>
                                        <Typography variant="subtitle2" color="text.primary" gutterBottom>
                                            Feedback from {job.organizationName}:
                                        </Typography>
                                        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                                            {application.organizationResponse}
                                        </Typography>
                                    </Paper>
                                )}
                                
                                <Box mt={3}>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Don't give up! There are many other volunteer opportunities available.
                                    </Typography>
                                    <Button
                                        variant="outlined"
                                        component={Link}
                                        href="/volunteer/jobs"
                                    >
                                        Browse More Opportunities
                                    </Button>
                                </Box>
                            </Box>
                        )}
                    </CardContent>
                </Card>
            </Container>
        </ProtectedRoute>
    )
}

export default ViewJobPage