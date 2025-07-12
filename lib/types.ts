export interface User {
  uid: string
  email: string
  role: "volunteer" | "organization"
  displayName: string
  createdAt: Date
}

export interface VolunteerProfile extends User {
  role: "volunteer"
  school: string
  grade: number
  totalHours: number
  appliedJobs: string[]
  completedJobs: string[]
}

export interface OrganizationProfile extends User {
  role: "organization"
  organizationName: string
  description: string
  website?: string
  contactPhone: string
}

export interface Job {
  id: string
  title: string
  description: string
  organizationId: string
  organizationName: string
  location: string
  date: Date
  startTime: string
  endTime: string
  hoursOffered: number
  maxVolunteers: number
  currentVolunteers: number
  requirements: string[]
  status: "open" | "closed" | "completed"
  createdAt: Date
  applicants: string[]
}

export interface Application {
  id: string
  jobId: string
  volunteerId: string
  volunteerName: string
  volunteerEmail: string
  status: "pending" | "approved" | "declined" | "completed"
  appliedAt: Date
  hoursCompleted?: number
  completedAt?: Date
}
