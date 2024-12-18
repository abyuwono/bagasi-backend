import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import CreateAd from './pages/CreateAd';
import AdDetails from './pages/AdDetails';
import Membership from './pages/Membership';
import Profile from './pages/Profile';
import AdPayment from './pages/AdPayment';
import PaymentSuccess from './pages/PaymentSuccess';
import Admin from './pages/Admin';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const PrivateRoute: React.FC<{
  children: React.ReactNode;
  roles?: string[];
}> = ({ children, roles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

const App = () => {
  const { user } = useAuth();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/login"
            element={user ? <Navigate to="/" /> : <Login />}
          />
          <Route
            path="/register"
            element={user ? <Navigate to="/" /> : <Register />}
          />
          <Route
            path="/ads/new"
            element={
              <PrivateRoute roles={['traveler']}>
                <CreateAd />
              </PrivateRoute>
            }
          />
          <Route path="/ads/payment" element={<AdPayment />} />
          <Route path="/ads/payment-success" element={<PaymentSuccess />} />
          <Route path="/ads/:id" element={<AdDetails />} />
          <Route
            path="/membership"
            element={
              <PrivateRoute roles={['shopper']}>
                <Membership />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute roles={['traveler', 'shopper']}>
                <Profile />
              </PrivateRoute>
            }
          />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </Layout>
    </ThemeProvider>
  );
};

export default App;
