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

const OrganizationDashboard: React.FC = () => {
  const { userProfile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [jobs, setJobs] = useState<Job[]>([])
  const [applications, setApplications] = useState<Application[]>([])

  const orgProfile = userProfile as OrganizationProfile

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!userProfile) return

      try {
        // Fetch organization's jobs
        const jobsQuery = query(
          collection(db, "jobs"),
          where("organizationId", "==", userProfile.uid),
          orderBy("createdAt", "desc"),
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

        // Fetch applications for organization's jobs
        const jobIds = jobsData.map((job) => job.id)
        if (jobIds.length > 0) {
          const applicationsQuery = query(
            collection(db, "applications"),
            where("jobId", "in", jobIds),
            orderBy("appliedAt", "desc"),
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
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [userProfile])

  if (loading) {
    return <LoadingSpinner message="Loading your dashboard..." />
  }

  const stats = [
    {
      title: "Active Jobs",
      value: jobs.filter((job) => job.status === "open").length,
      icon: <Work sx={{ fontSize: 40, color: "primary.main" }} />,
      color: "primary.main",
    },
    {
      title: "Total Applications",
      value: applications.length,
      icon: <People sx={{ fontSize: 40, color: "info.main" }} />,
      color: "info.main",
    },
    {
      title: "Pending Reviews",
      value: applications.filter((app) => app.status === "pending").length,
      icon: <Schedule sx={{ fontSize: 40, color: "warning.main" }} />,
      color: "warning.main",
    },
    {
      title: "Hours Provided",
      value: applications
        .filter((app) => app.status === "completed")
        .reduce((total, app) => total + (app.hoursCompleted || 0), 0),
      icon: <Schedule sx={{ fontSize: 40, color: "success.main" }} />,
      color: "success.main",
    },
  ]

  return (
    <ProtectedRoute requiredRole="organization">
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Welcome back, {orgProfile?.organizationName}!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your volunteer opportunities and applications
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<Add />} component={Link} href="/organization/jobs/create">
            Post New Job
          </Button>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {stats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="text.secondary" gutterBottom>
                        {stat.title}
                      </Typography>
                      <Typography variant="h4" component="div">
                        {stat.value}
                      </Typography>
                    </Box>
                    {stat.icon}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Recent Applications */}
        <Box sx={{ mb: 4 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h5" component="h2">
              Recent Applications
            </Typography>
            <Button component={Link} href="/organization/applications">
              View All
            </Button>
          </Box>

          {applications.length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: "center", py: 4 }}>
                <Typography variant="h6" gutterBottom>
                  No applications yet
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  Post your first volunteer opportunity to start receiving applications!
                </Typography>
                <Button variant="contained" component={Link} href="/organization/jobs/create">
                  Create Job Posting
                </Button>
              </CardContent>
            </Card>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Volunteer</TableCell>
                    <TableCell>Job</TableCell>
                    <TableCell>Applied Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {applications.slice(0, 5).map((application) => {
                    const job = jobs.find((j) => j.id === application.jobId)
                    return (
                      <TableRow key={application.id}>
                        <TableCell>{application.volunteerName}</TableCell>
                        <TableCell>{job?.title || "Unknown Job"}</TableCell>
                        <TableCell>{application.appliedAt.toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Chip
                            label={application.status}
                            color={
                              application.status === "completed"
                                ? "success"
                                : application.status === "approved"
                                  ? "primary"
                                  : application.status === "declined"
                                    ? "error"
                                    : "default"
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Button size="small" variant="outlined">
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>

        {/* Active Jobs */}
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h5" component="h2">
              Your Job Postings
            </Typography>
            <Button component={Link} href="/organization/jobs">
              Manage All
            </Button>
          </Box>

          <Grid container spacing={3}>
            {jobs.slice(0, 3).map((job) => (
              <Grid item xs={12} md={4} key={job.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {job.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {job.description.substring(0, 100)}...
                    </Typography>
                    <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                      <Chip label={job.status} color={job.status === "open" ? "success" : "default"} size="small" />
                      <Typography variant="body2">
                        {applications.filter(app => app.jobId === job.id).length} applications
                      </Typography>
                    </Box>
                    <Button size="small" variant="outlined" fullWidth>
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    </ProtectedRoute>
  )
}

export default OrganizationDashboard
