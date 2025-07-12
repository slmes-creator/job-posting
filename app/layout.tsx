import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@mui/material/styles"
import CssBaseline from "@mui/material/CssBaseline"
import { Box } from "@mui/material"
import { AuthProvider } from "@/contexts/AuthContext"
import Navbar from "@/components/Layout/Navbar"
import Footer from "@/components/Layout/Footer"
import theme from "@/lib/theme"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "VolunteerHub - High School Service Hours Platform",
  description: "Connect high school volunteers with meaningful service opportunities",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AuthProvider>
            <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
              <Navbar />
              <Box component="main" sx={{ flexGrow: 1 }}>
                {children}
              </Box>
              <Footer />
            </Box>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}


import './globals.css'