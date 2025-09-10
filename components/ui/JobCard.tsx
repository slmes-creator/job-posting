"use client"

import type React from "react"
import { Card, CardContent, CardActions, Typography, Button, Chip, Box, Avatar } from "@mui/material"
import { LocationOn, Schedule, Group, Business } from "@mui/icons-material"
import type { Job } from "@/lib/types"
import dayjs from "dayjs"

interface JobCardProps {
  job: Job
  onApply?: (jobId: string) => void
  onView?: (jobId: string) => void
  showApplyButton?: boolean
  isApplied?: boolean
}

const formatJobDates = (startDate: Date | null, endDate: Date | null, fallbackDate?: Date): string => {

  const parseDate = (date: any): Date | null => {
    if (!date) return null
    
    try {
      // Handle Firestore Timestamp objects
      if (date && typeof date === 'object' && 'seconds' in date && 'nanoseconds' in date) {
        const timestamp = new Date(date.seconds * 1000 + date.nanoseconds / 1000000)
        return isNaN(timestamp.getTime()) ? null : timestamp
      }
      
      // If it's already a Date object, check if it's valid
      if (date instanceof Date) {
        return isNaN(date.getTime()) ? null : date
      }
      
      // If it's a string or other format, try to parse it
      const parsed = new Date(date)
      return isNaN(parsed.getTime()) ? null : parsed
    } catch {
      return null
    }
  }

  // Use startDate/endDate if available, otherwise fallback to original date
  const start = parseDate(startDate) || parseDate(fallbackDate)
  const end = parseDate(endDate)

  if (!start) return "Date TBD"

  // Single date
  if (!end || start.valueOf() === end.valueOf()) {
    return start.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Date range - smart formatting
  const startYear = start.getFullYear()
  const endYear = end.getFullYear()
  const startMonth = start.getMonth()
  const endMonth = end.getMonth()

  if (startYear === endYear) {
    if (startMonth === endMonth) {
      // Same month and year
      const startStr = start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      const endStr = end.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', year: 'numeric' })
      return `${startStr} - ${endStr}`
    } else {
      // Same year, different months
      const startStr = start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      const endStr = end.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
      return `${startStr} - ${endStr}`
    }
  } else {
    // Different years
    const startStr = start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
    const endStr = end.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
    return `${startStr} - ${endStr}`
  }
}

const JobCard: React.FC<JobCardProps> = ({ job, onApply, onView, showApplyButton = true, isApplied = false }) => {
  return (
    <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <Avatar sx={{ bgcolor: "primary.main" }}>
            <Business />
          </Avatar>
          <Box>
            <Typography variant="h6" component="h3">
              {job.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {job.organizationName}
            </Typography>
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" paragraph>
          {job.description.length > 150 ? `${job.description.substring(0, 150)}...` : job.description}
        </Typography>

        <Box display="flex" flexDirection="column" gap={1} mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <LocationOn fontSize="small" color="action" />
            <Typography variant="body2">{job.location}</Typography>
          </Box>

          <Box display="flex" alignItems="center" gap={1}>
            <Schedule fontSize="small" color="action" />
            <Typography variant="body2">
              {formatJobDates(job.startDate, job.endDate, job.date)}
            </Typography>
          </Box>

          <Box display="flex" alignItems="center" gap={1}>
            <Group fontSize="small" color="action" />
            <Typography variant="body2">
              {job.volunteersNeeded} volunteers required
            </Typography>
          </Box>
        </Box>

        <Box display="flex" gap={1} flexWrap="wrap">
          <Chip label={job.duration} size="small" color="primary" variant="outlined" />
          <Chip label={job.status} size="small" color={job.status === "open" ? "success" : "default"} />
        </Box>
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button size="small" onClick={() => onView?.(job.id)} sx={{ mr: 1 }}>
          View Details
        </Button>
        {showApplyButton && job.status === "open" && (
          <Button
            size="small"
            variant="contained"
            onClick={() => onApply?.(job.id)}
            disabled={isApplied || job.currentVolunteers >= job.maxVolunteers}
          >
            {isApplied ? "Applied" : "Apply"}
          </Button>
        )}
      </CardActions>
    </Card>
  )
}

export default JobCard
