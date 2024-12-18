import React from 'react';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Container,
  Button,
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <>
      <AppBar position="static">
        <Container>
          <Toolbar>
            <Box
              component={Link}
              to="/"
              sx={{
                flexGrow: 1,
                textDecoration: 'none',
                color: 'inherit',
                alignItems: 'flex-start',
                display: 'flex',
                gap: 1
              }}
            >
              <Typography variant="h6">
                Bagasi
              </Typography>
              <Typography variant="h6">
                Marketplace
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              {user ? (
                <>
                  {user.role === 'traveler' ? (
                    <Button
                      color="inherit"
                      component={Link}
                      to="/ads/new"
                    >
                      Buka JasTip
                    </Button>
                  ) : (
                    <Button
                      color="inherit"
                      component={Link}
                      to="/membership"
                    >
                      Membership
                    </Button>
                  )}
                  <Button
                    color="inherit"
                    component={Link}
                    to="/profile"
                  >
                    Profil
                  </Button>
                  <Button
                    color="inherit"
                    onClick={handleLogout}
                  >
                    Keluar
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    color="inherit"
                    component={Link}
                    to="/login"
                  >
                    Masuk
                  </Button>
                  <Button
                    color="inherit"
                    component={Link}
                    to="/register"
                  >
                    Daftar
                  </Button>
                </>
              )}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {children}
      </Container>
    </>
  );
};

export default Layout;
