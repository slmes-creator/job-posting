"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Container, Typography, Grid, Card, CardContent, Box, Button, Chip } from "@mui/material"
import { Schedule, Work, CheckCircle, TrendingUp } from "@mui/icons-material"
import { useAuth } from "@/contexts/AuthContext"
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Job, Application, VolunteerProfile } from "@/lib/types"
import LoadingSpinner from "@/components/UI/LoadingSpinner"
import JobCard from "@/components/UI/JobCard"
import Link from "next/link"

const VolunteerDashboard: React.FC = () => {
  const { userProfile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [recentJobs, setRecentJobs] = useState<Job[]>([])
  const [applications, setApplications] = useState<Application[]>([])

  const volunteerProfile = userProfile as VolunteerProfile

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!userProfile) return

      try {
        // Fetch recent job opportunities
        const jobsQuery = query(
          collection(db, "jobs"),
          where("status", "==", "open"),
          orderBy("createdAt", "desc"),
          limit(6),
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
        setRecentJobs(jobsData)
        console.log("Fetched recent jobs:", jobsData)

        // Fetch user's applications
        const applicationsQuery = query(
          collection(db, "applications"),
          where("volunteerId", "==", userProfile.uid),
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
      title: "Total Hours",
      value: volunteerProfile?.totalHours || 0,
      icon: <Schedule sx={{ fontSize: 40, color: "primary.main" }} />,
      color: "primary.main",
    },
    {
      title: "Active Applications",
      value: applications.filter((app) => app.status === "pending" || app.status === "approved").length,
      icon: <Work sx={{ fontSize: 40, color: "warning.main" }} />,
      color: "warning.main",
    },
    {
      title: "Completed Jobs",
      value: applications.filter((app) => app.status === "completed").length,
      icon: <CheckCircle sx={{ fontSize: 40, color: "success.main" }} />,
      color: "success.main",
    },
    {
      title: "This Month",
      value: applications
        .filter((app) => app.completedAt && new Date(app.completedAt).getMonth() === new Date().getMonth())
        .reduce((total, app) => total + (app.hoursCompleted || 0), 0),
      icon: <TrendingUp sx={{ fontSize: 40, color: "info.main" }} />,
      color: "info.main",
    },
  ]

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Welcome back, {volunteerProfile?.displayName}!
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        {volunteerProfile?.school} • Grade {volunteerProfile?.grade}
      </Typography>

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
            Your Applications
          </Typography>
          <Button component={Link} href="/volunteer/profile">
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
                Start browsing volunteer opportunities to earn service hours!
              </Typography>
              <Button variant="contained" component={Link} href="/volunteer/jobs">
                Browse Opportunities
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={2}>
            {applications.slice(0, 3).map((application) => (
              <Grid item xs={12} md={4} key={application.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Application #{application.id.slice(-6)}
                    </Typography>
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
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      Applied: {application.appliedAt.toLocaleDateString()}
                    </Typography>
                    {application.hoursCompleted && (
                      <Typography variant="body2" color="success.main">
                        Hours earned: {application.hoursCompleted}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Recent Opportunities */}
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h5" component="h2">
            New Opportunities
          </Typography>
          <Button component={Link} href="/volunteer/jobs">
            View All
          </Button>
        </Box>

        <Grid container spacing={3}>
          {recentJobs.map((job) => (
            <Grid item xs={12} md={6} lg={4} key={job.id}>
              <JobCard
                job={job}
                onView={(jobId) => (window.location.href = `/volunteer/jobs/${jobId}`)}
                isApplied={applications.some((app) => app.jobId === job.id)}
              />
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  )
}

export default VolunteerDashboard
