"use client"

import type React from "react"
import { useEffect } from "react"
import { Container, Typography, Button, Box, Grid, Card, CardContent, useTheme, useMediaQuery } from "@mui/material"
import { VolunteerActivism, Business, Schedule, TrendingUp } from "@mui/icons-material"
import LoadingSpinner from "@/components/UI/LoadingSpinner"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"

const HomePage: React.FC = () => {
  const { currentUser, userProfile, loading } = useAuth()
  const router = useRouter()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))

  // Redirect logged-in users to their dashboard
  useEffect(() => {
    if (!loading && currentUser && userProfile) {
      if (userProfile.role === 'volunteer') {
        router.push('/volunteer/dashboard')
      } else if (userProfile.role === 'organization') {
        router.push('/organization/dashboard')
      }
    }
  }, [loading, currentUser, userProfile, router])

  // Show loading or redirect message while checking auth
  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 10, textAlign: "center" }}>
          <LoadingSpinner />
        </Box>
      </Container>
    )
  }

  // If user is logged in, show redirecting message (should redirect before this shows)
  if (currentUser && userProfile) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 10, textAlign: "center" }}>
          <LoadingSpinner message="Redirecting to dashboard..." />
        </Box>
      </Container>
    )
  }

  const features = [
    {
      icon: <VolunteerActivism sx={{ fontSize: 40, color: "primary.main" }} />,
      title: "Find Opportunities",
      description: "Browse and apply to volunteer opportunities that match your interests and schedule.",
    },
    {
      icon: <Schedule sx={{ fontSize: 40, color: "primary.main" }} />,
      title: "Track Hours",
      description: "Automatically track your service hours and generate reports for school requirements.",
    },
    {
      icon: <Business sx={{ fontSize: 40, color: "primary.main" }} />,
      title: "For Organizations",
      description: "Post volunteer opportunities and manage applications from dedicated students.",
    },
    {
      icon: <TrendingUp sx={{ fontSize: 40, color: "primary.main" }} />,
      title: "Build Experience",
      description: "Gain valuable experience while making a positive impact in your community.",
    },
  ]

  return (
    <Container maxWidth="lg">
      {/* Hero Section */}
      <Box
        sx={{
          py: { xs: 6, md: 10 },
          textAlign: "center",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          borderRadius: 3,
          color: "white",
          my: 4,
        }}
      >
        {/* Hero Section - Only show for non-logged-in users */}
        <Typography variant={isMobile ? "h3" : "h2"} component="h1" gutterBottom sx={{ fontWeight: "bold" }}>
          Earn Service Hours
        </Typography>
        <Typography variant={isMobile ? "h6" : "h5"} component="h2" gutterBottom sx={{ mb: 4, opacity: 0.9 }}>
          Connect with meaningful volunteer opportunities in your community
        </Typography>

        <Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
          <Button
            variant="contained"
            size="large"
            component={Link}
            href="/register"
            sx={{
              backgroundColor: "white",
              color: "primary.main",
              "&:hover": {
                backgroundColor: "grey.100",
              },
            }}
          >
            Get Started
          </Button>
          <Button
            variant="outlined"
            size="large"
            component={Link}
            href="/login"
            sx={{
              borderColor: "white",
              color: "white",
              "&:hover": {
                borderColor: "white",
                backgroundColor: "rgba(255,255,255,0.1)",
              },
            }}
          >
            Sign In
          </Button>
        </Box>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: 6 }}>
        <Typography variant="h3" component="h2" textAlign="center" gutterBottom sx={{ mb: 6 }}>
          Why Choose VolunteerHub?
        </Typography>

        <Grid container spacing={4} justifyContent="center">
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card sx={{ height: "100%", textAlign: "center", p: 2 }}>
                <CardContent>
                  <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                  <Typography variant="h6" component="h3" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* CTA Section */}
      <Box
        sx={{
          py: 6,
          textAlign: "center",
          backgroundColor: "grey.50",
          borderRadius: 3,
          my: 4,
        }}
      >
        <Typography variant="h4" component="h2" gutterBottom>
          Ready to Make a Difference?
        </Typography>
        {/* CTA Section - Only show for non-logged-in users */}
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Join thousands of students earning service hours while helping their communities.
        </Typography>

        <Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
          <Button variant="contained" size="large" component={Link} href="/register">
            Sign Up as Volunteer
          </Button>
          <Button variant="outlined" size="large" component={Link} href="/register">
            Register Organization
          </Button>
        </Box>
      </Box>
    </Container>
  )
}

export default HomePage
