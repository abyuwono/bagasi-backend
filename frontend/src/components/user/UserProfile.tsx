import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  useTheme
} from '@mui/material';
import {
  Edit,
  Lock,
  Notifications,
  Save,
  Cancel,
  ShoppingCart,
  Star,
  LocalShipping,
  AttachMoney
} from '@mui/icons-material';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import ReviewList from '../reviews/ReviewList';

interface UserDetails {
  user: {
    _id: string;
    username: string;
    email: string;
    phone: string;
    avatar: string;
    role: string;
    status: string;
    isVerified: boolean;
    preferences: {
      language: string;
      currency: string;
      notifications: {
        email: boolean;
        push: boolean;
      };
    };
  };
  recentActivity: {
    ads: any[];
    reviews: any[];
  };
  stats: {
    ads: {
      totalAds: number;
      completedAds: number;
      totalEarnings: number;
    };
    reviews: {
      averageRating: number;
      totalReviews: number;
    };
  };
}

const UserProfile: React.FC = () => {
  const theme = useTheme();
  const { user: authUser } = useAuth();

  // States
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    push: true
  });
  const [updating, setUpdating] = useState(false);

  // Effects
  useEffect(() => {
    fetchUserDetails();
  }, []);

  useEffect(() => {
    if (userDetails) {
      setFormData({
        ...formData,
        username: userDetails.user.username,
        email: userDetails.user.email,
        phone: userDetails.user.phone || ''
      });
      setNotificationSettings(userDetails.user.preferences.notifications);
    }
  }, [userDetails]);

  // Data fetching
  const fetchUserDetails = async () => {
    if (!authUser) {
      setError('User not authenticated');
      return;
    }
    
    try {
      setLoading(true);
      const response = await api.get(`/api/users/${authUser._id}`);
      setUserDetails(response.data);
      setError('');
    } catch (error) {
      console.error('Error fetching user details:', error);
      setError('Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  // Form handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleUpdateProfile = async () => {
    try {
      setUpdating(true);
      const response = await api.patch('/api/users/profile', {
        username: formData.username,
        email: formData.email,
        phone: formData.phone
      });

      setUserDetails({
        ...userDetails!,
        user: response.data
      });
      setEditMode(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setUpdating(true);
      await api.post('/api/users/password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });

      setShowPasswordDialog(false);
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      toast.success('Password updated successfully');
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error('Failed to update password');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateNotifications = async () => {
    try {
      setUpdating(true);
      await api.patch('/api/users/profile', {
        preferences: {
          ...userDetails?.user.preferences,
          notifications: notificationSettings
        }
      });

      setShowNotificationDialog(false);
      toast.success('Notification settings updated');
    } catch (error) {
      console.error('Error updating notifications:', error);
      toast.error('Failed to update notification settings');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!userDetails) return null;

  return (
    <Box p={3}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                mb={3}
              >
                <Avatar
                  src={userDetails.user.avatar}
                  sx={{ width: 120, height: 120, mb: 2 }}
                />
                {!editMode ? (
                  <>
                    <Typography variant="h5">{userDetails.user.username}</Typography>
                    <Typography color="textSecondary">
                      {userDetails.user.email}
                    </Typography>
                    <Typography color="textSecondary">
                      {userDetails.user.phone}
                    </Typography>
                    <Button
                      startIcon={<Edit />}
                      onClick={() => setEditMode(true)}
                      sx={{ mt: 2 }}
                    >
                      Edit Profile
                    </Button>
                  </>
                ) : (
                  <Box width="100%">
                    <TextField
                      fullWidth
                      label="Username"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      margin="normal"
                    />
                    <TextField
                      fullWidth
                      label="Email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      margin="normal"
                    />
                    <TextField
                      fullWidth
                      label="Phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      margin="normal"
                    />
                    <Box display="flex" justifyContent="space-between" mt={2}>
                      <Button
                        startIcon={<Cancel />}
                        onClick={() => setEditMode(false)}
                        disabled={updating}
                      >
                        Cancel
                      </Button>
                      <Button
                        startIcon={<Save />}
                        variant="contained"
                        onClick={handleUpdateProfile}
                        disabled={updating}
                      >
                        Save
                      </Button>
                    </Box>
                  </Box>
                )}
              </Box>

              <Box>
                <Button
                  fullWidth
                  startIcon={<Lock />}
                  onClick={() => setShowPasswordDialog(true)}
                  sx={{ mb: 1 }}
                >
                  Change Password
                </Button>
                <Button
                  fullWidth
                  startIcon={<Notifications />}
                  onClick={() => setShowNotificationDialog(true)}
                >
                  Notification Settings
                </Button>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Statistics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <ShoppingCart color="primary" />
                    <Typography variant="h6">
                      {userDetails.stats.ads.totalAds}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Total Ads
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <LocalShipping color="primary" />
                    <Typography variant="h6">
                      {userDetails.stats.ads.completedAds}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Completed
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <Star color="primary" />
                    <Typography variant="h6">
                      {userDetails.stats.reviews.averageRating.toFixed(1)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Rating
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <AttachMoney color="primary" />
                    <Typography variant="h6">
                      {new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR'
                      }).format(userDetails.stats.ads.totalEarnings)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Earnings
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Tabs
                value={activeTab}
                onChange={(_, value) => setActiveTab(value)}
                sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
              >
                <Tab label="Recent Activity" />
                <Tab label="Reviews" />
              </Tabs>

              {activeTab === 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Recent Ads
                  </Typography>
                  {userDetails.recentActivity.ads.map((ad) => (
                    <Card key={ad._id} sx={{ mb: 2 }}>
                      <CardContent>
                        <Typography variant="subtitle1">{ad.productName}</Typography>
                        <Typography color="textSecondary">
                          Status: {ad.status}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}

              {activeTab === 1 && (
                <ReviewList
                  reviews={userDetails.recentActivity.reviews}
                  onReviewUpdate={fetchUserDetails}
                />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Password Dialog */}
      <Dialog
        open={showPasswordDialog}
        onClose={() => setShowPasswordDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            type="password"
            label="Current Password"
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleInputChange}
            margin="normal"
          />
          <TextField
            fullWidth
            type="password"
            label="New Password"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleInputChange}
            margin="normal"
          />
          <TextField
            fullWidth
            type="password"
            label="Confirm New Password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowPasswordDialog(false)}
            disabled={updating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdatePassword}
            variant="contained"
            disabled={
              !formData.currentPassword ||
              !formData.newPassword ||
              !formData.confirmPassword ||
              updating
            }
          >
            Update Password
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Settings Dialog */}
      <Dialog
        open={showNotificationDialog}
        onClose={() => setShowNotificationDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Notification Settings</DialogTitle>
        <DialogContent>
          <FormControlLabel
            control={
              <Switch
                checked={notificationSettings.email}
                onChange={(e) =>
                  setNotificationSettings({
                    ...notificationSettings,
                    email: e.target.checked
                  })
                }
              />
            }
            label="Email Notifications"
          />
          <FormControlLabel
            control={
              <Switch
                checked={notificationSettings.push}
                onChange={(e) =>
                  setNotificationSettings({
                    ...notificationSettings,
                    push: e.target.checked
                  })
                }
              />
            }
            label="Push Notifications"
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowNotificationDialog(false)}
            disabled={updating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdateNotifications}
            variant="contained"
            disabled={updating}
          >
            Save Settings
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserProfile;
