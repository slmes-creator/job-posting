"use client"

import type React from "react"
import { Card, CardContent, CardActions, Typography, Button, Chip, Box, Avatar } from "@mui/material"
import { LocationOn, Schedule, Group, Business, Person, Email, Phone } from "@mui/icons-material"
import type { Job, Application } from "@/lib/types"
import dayjs from "dayjs"

interface ApplicationCardProps {
  application: Application
  job?: Job
  onView?: (applicationId: string) => void
  onApprove?: (applicationId: string) => void
  onDecline?: (applicationId: string) => void
  showActions?: boolean
  showJobDetails?: boolean
  isSelected?: boolean
  variant?: 'compact' | 'detailed'
}

