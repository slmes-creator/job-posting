import type React from "react"
import { useState, useEffect } from "react"
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Alert,
  Breadcrumbs,
  Link as MuiLink,
} from "@mui/material"
import { ArrowBack, LocationOn, CalendarToday, People } from "@mui/icons-material"
import { useAuth } from "@/contexts/AuthContext"
import { doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { OrganizationProfile, Job } from "@/lib/types"
import LoadingSpinner from "@/components/UI/LoadingSpinner"
import Link from "next/link"
import ProtectedRoute from "@/components/ProtectedRoute"
import { useRouter, useParams } from "next/navigation"

const ApplicationsPage: React.FC = () => {
    const { userProfile } = useAuth()
    const router = useRouter()
    const params = useParams()
    const jobId = params.id as string

    const [selectedApplication, setSelectedApplication] = useState(null)
    const [applications, setApplications] = useState([])
    
    return (
        <Box display="flex" height="100vh">
        {/* Left Sidebar - Applications List */}
        <ApplicationsList 
            applications={applications}
            selectedId={selectedApplication?.id}
            onSelect={setSelectedApplication}
        />
        
        {/* Right Panel - Application Review */}
        <ApplicationReview 
            application={selectedApplication}
            onUpdate={handleUpdate}
        />
        </Box>
  )
}

export default ApplicationsPage