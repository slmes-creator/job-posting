"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from "@mui/material"
import { Work, People, Schedule, Add } from "@mui/icons-material"
import { useAuth } from "@/contexts/AuthContext"
import { collection, query, where, getDocs, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Job, Application, OrganizationProfile } from "@/lib/types"
import LoadingSpinner from "@/components/UI/LoadingSpinner"
import Link from "next/link"
import ProtectedRoute from "@/components/ProtectedRoute"

const OrganizationJobsPage: React.FC = () => {
  const { userProfile } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [showDrafts, setShowDrafts] = useState(false)
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

  const organizationProfile = userProfile as OrganizationProfile

  useEffect(() => {
    const fetchJobsAndApplications = async () => {
      if (!userProfile) return

      try {
        // Fetch organization's jobs
        const jobsQuery = query(
          collection(db, "jobs"),
          where("organizationId", "==", userProfile.uid),
          orderBy("createdAt", "desc")
        )
        const jobsSnapshot = await getDocs(jobsQuery)
        const jobsData = jobsSnapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            ...data,
            date: data.date?.toDate ? data.date.toDate() : new Date(data.date) || new Date(),
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt) || new Date(),
          }
        }) as Job[]
        setJobs(jobsData)

        // Fetch applications for these jobs
        if (jobsData.length > 0) {
          const jobIds = jobsData.map(job => job.id)
          const applicationsQuery = query(
            collection(db, "applications"),
            where("jobId", "in", jobIds),
            orderBy("appliedAt", "desc")
          )
          const applicationsSnapshot = await getDocs(applicationsQuery)
          const applicationsData = applicationsSnapshot.docs.map((doc) => {
            const data = doc.data()
            return {
              id: doc.id,
              ...data,
              appliedAt: data.appliedAt?.toDate ? data.appliedAt.toDate() : new Date(data.appliedAt) || new Date(),
              completedAt: data.completedAt?.toDate ? data.completedAt.toDate() : data.completedAt ? new Date(data.completedAt) : undefined,
            }
          }) as Application[]
          setApplications(applicationsData)
        }
      } catch (error) {
        console.error("Error fetching jobs and applications:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchJobsAndApplications()
  }, [userProfile])

  if (loading) {
    return <LoadingSpinner message="Loading your job postings..." />
  }

  const getJobApplicationCount = (jobId: string) => {
    return applications.filter(app => app.jobId === jobId).length
  }

  const getJobPendingCount = (jobId: string) => {
    return applications.filter(app => app.jobId === jobId && app.status === "pending").length
  }

  // Filter jobs based on draft status
  const publishedJobs = jobs.filter(job => job.status !== "draft")
  const draftJobs = jobs.filter(job => (job as any).status === "draft")
  
  // Determine which jobs to show based on toggle
  const currentJobs = showDrafts ? draftJobs : publishedJobs

  return (
    <ProtectedRoute requiredRole="organization">
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1">
            Manage Job Postings
          </Typography>
          <Box display="flex" gap={2}>
            <Button 
            variant={showDrafts ? "contained" : "outlined"}
            onClick={() => setShowDrafts(!showDrafts)}
            >
            {showDrafts ? "Show Published" : `Show Drafts (${draftJobs.length})`}
            </Button>
            <Button variant="contained" startIcon={<Add />} component={Link} href="/organization/jobs/create">
            Post New Job
            </Button>
            </Box>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      {showDrafts ? "Draft Jobs" : "Total Jobs"}
                    </Typography>
                    <Typography variant="h4">
                      {currentJobs.length}
                    </Typography>
                  </Box>
                  <Work sx={{ fontSize: 40, color: "primary.main" }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Active Jobs
                    </Typography>
                    <Typography variant="h4">
                      {showDrafts ? 0 : publishedJobs.filter(job => job.status === "open").length}
                    </Typography>
                  </Box>
                  <Schedule sx={{ fontSize: 40, color: "success.main" }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Total Applications
                    </Typography>
                    <Typography variant="h4">
                      {applications.length}
                    </Typography>
                  </Box>
                  <People sx={{ fontSize: 40, color: "info.main" }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Pending Reviews
                    </Typography>
                    <Typography variant="h4">
                      {applications.filter(app => app.status === "pending").length}
                    </Typography>
                  </Box>
                  <People sx={{ fontSize: 40, color: "warning.main" }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Jobs Table */}
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Job Title</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Applications</TableCell>
                  <TableCell>Pending</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <Typography variant="subtitle1" fontWeight="medium">
                        {job.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {job.location}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {job.date.toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={getJobApplicationCount(job.id)} 
                        color="primary" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={getJobPendingCount(job.id)} 
                        color="warning" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={job.status} 
                        color={job.status === "open" ? "success" : "default"}
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Button 
                          size="small" 
                          component={Link} 
                          href={`/organization/jobs/${job.id}`}
                        >
                          View
                        </Button>
                        <Button 
                          size="small" 
                          component={Link} 
                          href={`/organization/jobs/${job.id}/edit`}
                        >
                          Edit
                        </Button>
                        <Button 
                          size="small" 
                          component={Link} 
                          href={`/organization/jobs/${job.id}/applications`}
                        >
                          Applications
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {currentJobs.length === 0 && (
          <Box textAlign="center" py={8}>
            <Typography variant="h6" gutterBottom>
              {showDrafts ? "No drafts yet" : "No job postings yet"}
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              {showDrafts 
                ? "Save jobs as drafts to finish them later!" 
                : "Create your first job posting to start finding volunteers!"
              }
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              component={Link}
              href="/organization/jobs/create"
            >
              {showDrafts ? "Create Draft" : "Post Your First Job"}
            </Button>
          </Box>
        )}
      </Container>
    </ProtectedRoute>
  )
}

export default OrganizationJobsPage