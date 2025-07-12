"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Container,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Button,
  Chip,
} from "@mui/material"
import { Search, FilterList } from "@mui/icons-material"
import { collection, query, where, getDocs, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Job } from "@/lib/types"
import { useAuth } from "@/contexts/AuthContext"
import LoadingSpinner from "@/components/UI/LoadingSpinner"
import JobCard from "@/components/UI/JobCard"

const VolunteerJobsPage: React.FC = () => {
  const { userProfile } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [locationFilter, setLocationFilter] = useState("")
  const [hoursFilter, setHoursFilter] = useState("")
  const [appliedJobs, setAppliedJobs] = useState<string[]>([])

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const jobsQuery = query(collection(db, "jobs"), where("status", "==", "open"), orderBy("createdAt", "desc"))

        const jobsSnapshot = await getDocs(jobsQuery)
        const jobsData = jobsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date.toDate(),
          createdAt: doc.data().createdAt.toDate(),
        })) as Job[]

        setJobs(jobsData)
        setFilteredJobs(jobsData)

        // Fetch user's applied jobs
        if (userProfile) {
          const applicationsQuery = query(collection(db, "applications"), where("volunteerId", "==", userProfile.uid))
          const applicationsSnapshot = await getDocs(applicationsQuery)
          const appliedJobIds = applicationsSnapshot.docs.map((doc) => doc.data().jobId)
          setAppliedJobs(appliedJobIds)
        }
      } catch (error) {
        console.error("Error fetching jobs:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchJobs()
  }, [userProfile])

  useEffect(() => {
    let filtered = jobs

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (job) =>
          job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.organizationName.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Location filter
    if (locationFilter) {
      filtered = filtered.filter((job) => job.location.toLowerCase().includes(locationFilter.toLowerCase()))
    }

    // Hours filter
    if (hoursFilter) {
      const [min, max] = hoursFilter.split("-").map(Number)
      filtered = filtered.filter((job) => {
        if (max) {
          return job.hoursOffered >= min && job.hoursOffered <= max
        } else {
          return job.hoursOffered >= min
        }
      })
    }

    setFilteredJobs(filtered)
  }, [jobs, searchTerm, locationFilter, hoursFilter])

  const handleApply = async (jobId: string) => {
    // This would typically open a modal or navigate to application page
    console.log("Apply to job:", jobId)
  }

  const handleViewJob = (jobId: string) => {
    window.location.href = `/volunteer/jobs/${jobId}`
  }

  if (loading) {
    return <LoadingSpinner message="Loading volunteer opportunities..." />
  }

  const uniqueLocations = [...new Set(jobs.map((job) => job.location))]

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Volunteer Opportunities
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Find meaningful volunteer opportunities to earn your service hours
      </Typography>

      {/* Filters */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search opportunities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: "text.secondary" }} />,
              }}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Location</InputLabel>
              <Select value={locationFilter} label="Location" onChange={(e) => setLocationFilter(e.target.value)}>
                <MenuItem value="">All Locations</MenuItem>
                {uniqueLocations.map((location) => (
                  <MenuItem key={location} value={location}>
                    {location}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Hours</InputLabel>
              <Select value={hoursFilter} label="Hours" onChange={(e) => setHoursFilter(e.target.value)}>
                <MenuItem value="">Any Hours</MenuItem>
                <MenuItem value="1-3">1-3 hours</MenuItem>
                <MenuItem value="4-6">4-6 hours</MenuItem>
                <MenuItem value="7-10">7-10 hours</MenuItem>
                <MenuItem value="10">10+ hours</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => {
                setSearchTerm("")
                setLocationFilter("")
                setHoursFilter("")
              }}
            >
              Clear
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Results Summary */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Showing {filteredJobs.length} of {jobs.length} opportunities
        </Typography>

        {(searchTerm || locationFilter || hoursFilter) && (
          <Box sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
            {searchTerm && <Chip label={`Search: ${searchTerm}`} onDelete={() => setSearchTerm("")} size="small" />}
            {locationFilter && (
              <Chip label={`Location: ${locationFilter}`} onDelete={() => setLocationFilter("")} size="small" />
            )}
            {hoursFilter && <Chip label={`Hours: ${hoursFilter}`} onDelete={() => setHoursFilter("")} size="small" />}
          </Box>
        )}
      </Box>

      {/* Jobs Grid */}
      {filteredJobs.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography variant="h6" gutterBottom>
            No opportunities found
          </Typography>
          <Typography color="text.secondary">
            Try adjusting your search criteria or check back later for new opportunities.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredJobs.map((job) => (
            <Grid item xs={12} md={6} lg={4} key={job.id}>
              <JobCard
                job={job}
                onApply={handleApply}
                onView={handleViewJob}
                isApplied={appliedJobs.includes(job.id)}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  )
}

export default VolunteerJobsPage
