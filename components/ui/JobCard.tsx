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
              {dayjs(job.date).format("MMM D, YYYY")} • {job.startTime} - {job.endTime}
            </Typography>
          </Box>

          <Box display="flex" alignItems="center" gap={1}>
            <Group fontSize="small" color="action" />
            <Typography variant="body2">
              {job.currentVolunteers}/{job.volunteersNeeded} volunteers required
            </Typography>
          </Box>
        </Box>

        <Box display="flex" gap={1} flexWrap="wrap">
          <Chip label={`${job.hoursOffered} hours`} size="small" color="primary" variant="outlined" />
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
