"use client"

import type React from "react"
import { useState } from "react"
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Box,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from "@mui/material"
import { Menu as MenuIcon, AccountCircle, Dashboard, Work, Person, ExitToApp, Home } from "@mui/icons-material"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import Link from "next/link"

const Navbar: React.FC = () => {
  const { currentUser, userProfile, logout } = useAuth()
  const router = useRouter()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/")
      handleClose()
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const menuItems = currentUser
    ? [
        {
          text: "Dashboard",
          icon: <Dashboard />,
          href: userProfile?.role === "volunteer" ? "/volunteer/dashboard" : "/organization/dashboard",
        },
        ...(userProfile?.role === "volunteer"
          ? [
              { text: "Browse Jobs", icon: <Work />, href: "/volunteer/jobs" },
              { text: "Profile", icon: <Person />, href: "/volunteer/profile" },
            ]
          : [
              { text: "Manage Jobs", icon: <Work />, href: "/organization/jobs" },
              { text: "Profile", icon: <Person />, href: "/organization/profile" },
            ]),
      ]
    : []

  const drawer = (
    <Box sx={{ width: 250 }}>
      <List>
        <ListItem component={Link} href="/">
          <ListItemIcon>
            <Home />
          </ListItemIcon>
          <ListItemText primary="Home" />
        </ListItem>
        {menuItems.map((item) => (
          <ListItem key={item.text} component={Link} href={item.href}>
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
        {currentUser && (
          <ListItem onClick={handleLogout}>
            <ListItemIcon>
              <ExitToApp />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItem>
        )}
      </List>
    </Box>
  )

  return (
    <>
      <AppBar position="static" sx={{ backgroundColor: "primary.main" }}>
        <Toolbar>
          {isMobile && currentUser && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Typography
            variant="h6"
            component={Link}
            href="/"
            sx={{
              flexGrow: 1,
              textDecoration: "none",
              color: "inherit",
              fontWeight: "bold",
            }}
          >
            VolunteerHub
          </Typography>

          {!isMobile && currentUser && (
            <Box sx={{ display: "flex", gap: 2 }}>
              {menuItems.map((item) => (
                <Button key={item.text} color="inherit" component={Link} href={item.href} startIcon={item.icon}>
                  {item.text}
                </Button>
              ))}
            </Box>
          )}

          {currentUser ? (
            <div>
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
              >
                <AccountCircle />
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
                keepMounted
                transformOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem onClick={handleClose}>
                  <Typography>{userProfile?.displayName}</Typography>
                </MenuItem>
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </Menu>
            </div>
          ) : (
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button color="inherit" component={Link} href="/login">
                Login
              </Button>
              <Button color="inherit" component={Link} href="/register">
                Register
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": { boxSizing: "border-box", width: 250 },
        }}
      >
        {drawer}
      </Drawer>
    </>
  )
}

export default Navbar
