import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Alert,
} from '@mui/material';
import { platformAuthenticatorIsAvailable, startAuthentication } from '@simplewebauthn/browser';
import { adminApi } from '../services/api';
import UserManagement from '../components/admin/UserManagement';
import AdManagement from '../components/admin/AdManagement';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Admin: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const checkWebAuthnSupport = async () => {
      const supported = await platformAuthenticatorIsAvailable();
      if (!supported) {
        setError('Your browser does not support WebAuthn. Please use a modern browser.');
      }
    };
    checkWebAuthnSupport();
  }, []);

  const handleAuth = async () => {
    try {
      const supported = await platformAuthenticatorIsAvailable();
      if (!supported) {
        setError('Your browser does not support WebAuthn');
        return;
      }

      // Get authentication options from server
      const optionsResponse = await adminApi.getAuthOptions();
      
      // Start the authentication process
      const credential = await startAuthentication(optionsResponse);
      
      // Verify the authentication with the server
      const verificationResponse = await adminApi.verifyAuth(credential);
      
      if (verificationResponse.success) {
        setIsAuthenticated(true);
        setError(null);
      }
    } catch (err) {
      setError('Authentication failed. Please try again.');
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (!isAuthenticated) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ mt: 8 }}>
          <Paper sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom align="center">
              Admin Authentication
            </Typography>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleAuth}
              >
                Authenticate with Passkey
              </Button>
            </Box>
          </Paper>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Admin Dashboard
        </Typography>
        <Paper sx={{ width: '100%', mt: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab label="User Management" />
            <Tab label="Ad Management" />
          </Tabs>
          <TabPanel value={activeTab} index={0}>
            <UserManagement />
          </TabPanel>
          <TabPanel value={activeTab} index={1}>
            <AdManagement />
          </TabPanel>
        </Paper>
      </Box>
    </Container>
  );
};

export default Admin;
