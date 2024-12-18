import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Avatar,
  Chip,
  Rating,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
  Alert,
  CircularProgress,
  Stack,
} from '@mui/material';
import {
  Verified as VerifiedIcon,
  GppMaybe as UnverifiedIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

interface Review {
  rating: number;
  comment: string;
  reviewer: {
    username: string;
  };
  createdAt: string;
}

interface UserProfile {
  _id: string;
  email: string;
  username: string;
  role: 'traveler' | 'shopper';
  isVerified: boolean;
  whatsappNumber: string;
  membership?: {
    type: 'none' | 'shopper';
    expiresAt?: Date;
  };
  rating: number;
  totalReviews: number;
  reviews: Review[];
}

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        // TODO: Implement API call to fetch user profile
        // For now using mock data
        const mockProfile: UserProfile = {
          _id: '123',
          email: user?.email || '',
          username: user?.email?.split('@')[0] || 'User',
          role: user?.role || 'shopper',
          isVerified: false,
          whatsappNumber: user?.whatsappNumber || '',
          membership: user?.membership,
          rating: 4.5,
          totalReviews: 12,
          reviews: [
            {
              rating: 5,
              comment: 'Sangat bertanggung jawab dan tepat waktu',
              reviewer: { username: 'John' },
              createdAt: '2023-12-01',
            },
            {
              rating: 4,
              comment: 'Barang sampai dengan aman',
              reviewer: { username: 'Alice' },
              createdAt: '2023-11-28',
            },
          ],
        };
        setProfile(mockProfile);
      } catch (err: any) {
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    } else {
      navigate('/login');
    }
  }, [user, navigate]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !profile) {
    return (
      <Alert severity="error" sx={{ mt: 4 }}>
        {error || 'Failed to load profile'}
      </Alert>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 4 } }}>
      <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  mx: 'auto',
                  mb: 2,
                  bgcolor: 'primary.main',
                  fontSize: '3rem',
                }}
              >
                {profile.username.charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="h5" gutterBottom>
                {profile.username}
              </Typography>
              <Stack direction="row" spacing={1} justifyContent="center" mb={2}>
                <Chip
                  label={profile.role === 'traveler' ? 'Traveler' : 'Shopper'}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
                {profile.isVerified ? (
                  <Chip
                    icon={<VerifiedIcon />}
                    label="Verified"
                    color="success"
                    variant="outlined"
                    size="small"
                  />
                ) : (
                  <Chip
                    icon={<UnverifiedIcon />}
                    label="Unverified"
                    color="warning"
                    variant="outlined"
                    size="small"
                  />
                )}
              </Stack>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                <Rating value={profile.rating} precision={0.5} readOnly />
                <Typography variant="body2" color="text.secondary" ml={1}>
                  ({profile.totalReviews})
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} sm={8}>
            <Typography variant="h6" gutterBottom>
              Account Details
            </Typography>
            <List>
              <ListItem>
                <ListItemText
                  primary="Email"
                  secondary={profile.email}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="WhatsApp"
                  secondary={profile.whatsappNumber}
                />
              </ListItem>
              {profile.role === 'shopper' && profile.membership && (
                <ListItem>
                  <ListItemText
                    primary="Membership Status"
                    secondary={
                      profile.membership.type === 'shopper' && profile.membership.expiresAt && new Date(profile.membership.expiresAt) > new Date() ? (
                        <>
                          Active until{' '}
                          {new Date(profile.membership.expiresAt).toLocaleDateString('id-ID')}
                        </>
                      ) : (
                        'Not Active'
                      )
                    }
                  />
                </ListItem>
              )}
            </List>

            {profile.role === 'shopper' && !profile.membership?.type && (
              <Box mt={2}>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  onClick={() => navigate('/membership')}
                >
                  Upgrade to Premium
                </Button>
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Reviews ({profile.totalReviews})
        </Typography>
        <List>
          {profile.reviews.map((review, index) => (
            <React.Fragment key={index}>
              <ListItem alignItems="flex-start">
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <Typography component="span" variant="body1" sx={{ mr: 1 }}>
                        {review.reviewer.username}
                      </Typography>
                      <Rating value={review.rating} size="small" readOnly />
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography component="span" variant="body2" color="text.primary">
                        {review.comment}
                      </Typography>
                      <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                        {new Date(review.createdAt).toLocaleDateString('id-ID')}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
              {index < profile.reviews.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

export default Profile;
