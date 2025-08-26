import type React from "react"
import { Box, Container, Typography, Link, Grid } from "@mui/material"

const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: "grey.100",
        py: 4,
        mt: "auto",
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>
              VolunteerHub
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Connecting high school volunteers with meaningful service opportunities to earn community service hours.
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>
              For Volunteers
            </Typography>
            <Link href="/volunteer/jobs" color="inherit" display="block">
              Browse Opportunities
            </Link>
            <Link href="/register" color="inherit" display="block">
              Sign Up
            </Link>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>
              For Organizations
            </Typography>
            <Link href="/organization/jobs" color="inherit" display="block">
              Post Opportunities
            </Link>
            <Link href="/register" color="inherit" display="block">
              Register Organization
            </Link>
          </Grid>
        </Grid>
        <Box sx={{ mt: 4, pt: 2, borderTop: 1, borderColor: "divider" }}>
          <Typography variant="body2" color="text.secondary" align="center">
            © 2024 VolunteerHub. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  )
}

export default Footer
