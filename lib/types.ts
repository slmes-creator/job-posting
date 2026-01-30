export interface User {
  uid: string
  email: string
  role: "volunteer" | "organization"
  displayName: string
  createdAt: Date
}

export interface VolunteerProfile extends User {
  role: "volunteer"
  displayName: string // Always set to fullName
  fullName: string
  school: string
  grade: number
  totalHours: number
  appliedJobs: string[]
  completedJobs: string[]
}

export interface OrganizationProfile extends User {
  role: "organization"
  displayName: string // Always set to organizationName
  organizationName: string
  description: string
  website?: string
  address?: string
  contactPhone: string
}

export interface Job {
  id: string
  title: string
  description: string
  organizationId: string
  organizationName: string
  location: string
  isRemote: boolean
  category: string
  date: Date
  startDate?: Date | null
  endDate?: Date | null
  startTime: string
  endTime: string
  duration: string
  volunteersNeeded: number
  hoursOffered: number
  maxVolunteers: number
  currentVolunteers: number
  requirements: string[]
  contactEmail: string
  contactPhone?: string
  status: "open" | "closed" | "completed" | "draft"
  createdAt: Date
  updatedAt?: Date
  applicants: string[]
}

export interface Application {
  id: string
  jobId: string
  volunteerId: string
  volunteerName: string
  volunteerEmail: string
  volunteerPhone?: string
  volunteerSchool?: string
  organizationId: string
  status: "pending" | "approved" | "declined" | "completed"
  appliedAt: Date
  reviewedAt?: Date
  hoursCompleted?: number
  completedAt?: Date
  coverLetter: string
  availability: string
  availabilityRange?: {
    from: Date
    to: Date
  }
  availabilityNotes?: string
  skills: string[]
  resumeUrl?: string
  organizationResponse?: string
  approvedDateRanges?: Array<{
    from: Date
    to: Date
    formattedRange: string
  }>
  references: {
    name?: string
    affiliation?: string
    email?: string
    phone?: string
  }
}
