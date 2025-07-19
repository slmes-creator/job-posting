"use client"

import type React from "react"
import { useState } from "react"
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  MenuItem,
  Link as MuiLink,
} from "@mui/material"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import Link from "next/link"

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    role: "volunteer" as "volunteer" | "organization",
    // Volunteer fields
    fullName: "",
    school: "",
    grade: 9,
    // Organization fields
    organizationName: "",
    description: "",
    website: "",
    address: "",
    contactPhone: "",
  })

  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const { register } = useAuth()
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "grade" ? Number.parseInt(value) : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    try {
      setError("")
      setLoading(true)

      const userData = {
        displayName: formData.role === "volunteer" ? formData.fullName : formData.organizationName,
        role: formData.role,
        ...(formData.role === "volunteer"
          ? {
              fullName: formData.fullName,
              school: formData.school,
              grade: formData.grade,
            }
          : {
              organizationName: formData.organizationName,
              description: formData.description,
              website: formData.website,
              address: formData.address,
              contactPhone: formData.contactPhone,
            }),
      }

      await register(formData.email, formData.password, userData)
      router.push("/")
    } catch (error: any) {
      setError("Failed to create account. Please try again.")
      console.log("Registration error:", error) 
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container component="main" maxWidth="md">
      <Box
        sx={{
          marginTop: 4,
          marginBottom: 4,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: "100%" }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            Create Account
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            {/* Basic Information */}
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
            />

            {/* Role Selection */}
            <FormControl component="fieldset" sx={{ mt: 2, mb: 2 }}>
              <FormLabel component="legend">I am a:</FormLabel>
              <RadioGroup row name="role" value={formData.role} onChange={handleChange}>
                <FormControlLabel value="volunteer" control={<Radio />} label="High School Volunteer" />
                <FormControlLabel value="organization" control={<Radio />} label="Organization" />
              </RadioGroup>
            </FormControl>

            {/* Conditional Fields */}
            {formData.role === "volunteer" ? (
              <>
                <TextField
                margin="normal"
                required
                fullWidth
                name="fullName"
                label="Full Name"
                id="fullName"
                value={formData.fullName}
                onChange={handleChange}
              />

                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="school"
                  label="School Name"
                  id="school"
                  value={formData.school}
                  onChange={handleChange}
                />

                <TextField
                  margin="normal"
                  required
                  fullWidth
                  select
                  name="grade"
                  label="Grade Level"
                  id="grade"
                  value={formData.grade}
                  onChange={handleChange}
                >
                  {[9, 10, 11, 12].map((grade) => (
                    <MenuItem key={grade} value={grade}>
                      Grade {grade}
                    </MenuItem>
                  ))}
                </TextField>
              </>
            ) : (
              <>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="organizationName"
                  label="Organization Name"
                  id="organizationName"
                  value={formData.organizationName}
                  onChange={handleChange}
                />

                <TextField
                  margin="normal"
                  required
                  fullWidth
                  multiline
                  rows={3}
                  name="description"
                  label="Organization Description"
                  id="description"
                  value={formData.description}
                  onChange={handleChange}
                />

                <TextField
                  margin="normal"
                  fullWidth
                  name="website"
                  label="Website (Optional)"
                  id="website"
                  value={formData.website}
                  onChange={handleChange}
                />

                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="address"
                  label="Address"
                  id="address"
                  value={formData.address}
                  onChange={handleChange}
                />

                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="contactPhone"
                  label="Contact Phone"
                  id="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                />
              </>
            )}

            <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} disabled={loading}>
              {loading ? "Creating Account..." : "Create Account"}
            </Button>

            <Box textAlign="center">
              <MuiLink component={Link} href="/login" variant="body2">
                Already have an account? Sign In
              </MuiLink>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}

export default RegisterPage
