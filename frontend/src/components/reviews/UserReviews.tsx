import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Rating,
  LinearProgress,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Grid,
  useTheme
} from '@mui/material';
import { Star } from '@mui/icons-material';
import api from '../../services/api';
import ReviewList from './ReviewList';

interface UserReviewsProps {
  userId: string;
  showTabs?: boolean;
}

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    [key: number]: number;
  };
}

const UserReviews: React.FC<UserReviewsProps> = ({ userId, showTabs = true }) => {
  const theme = useTheme();

  const [activeTab, setActiveTab] = useState('received');
  const [reviews, setReviews] = useState<any[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, [userId, activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reviewsResponse, statsResponse] = await Promise.all([
        api.get(`/api/reviews/user/${userId}`, {
          params: { type: activeTab }
        }),
        api.get(`/api/reviews/stats/${userId}`)
      ]);

      setReviews(reviewsResponse.data);
      setStats(statsResponse.data);
      setError('');
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setError('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const renderRatingDistribution = () => {
    if (!stats) return null;

    const maxCount = Math.max(...Object.values(stats.ratingDistribution));

    return (
      <Box sx={{ mt: 3 }}>
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = stats.ratingDistribution[rating] || 0;
          const percentage = maxCount ? (count / maxCount) * 100 : 0;

          return (
            <Box
              key={rating}
              sx={{
                display: 'flex',
                alignItems: 'center',
                mb: 1
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  width: 50,
                  mr: 1
                }}
              >
                <Typography variant="body2">{rating}</Typography>
                <Star sx={{ fontSize: 16, ml: 0.5 }} />
              </Box>
              <Box sx={{ flexGrow: 1, mr: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={percentage}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: theme.palette.grey[200],
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: theme.palette.primary.main
                    }
                  }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary" width={50}>
                {count}
              </Typography>
            </Box>
          );
        })}
      </Box>
    );
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

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Rating Overview
              </Typography>
              
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  my: 3
                }}
              >
                <Typography variant="h3">
                  {stats?.averageRating.toFixed(1)}
                </Typography>
                <Rating
                  value={stats?.averageRating || 0}
                  readOnly
                  precision={0.5}
                  sx={{ mt: 1 }}
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Based on {stats?.totalReviews} reviews
                </Typography>
              </Box>

              {renderRatingDistribution()}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          {showTabs && (
            <Tabs
              value={activeTab}
              onChange={(_, value) => setActiveTab(value)}
              sx={{ mb: 3 }}
            >
              <Tab label="Reviews Received" value="received" />
              <Tab label="Reviews Given" value="given" />
            </Tabs>
          )}

          {reviews.length === 0 ? (
            <Alert severity="info">
              No reviews {activeTab === 'received' ? 'received' : 'given'} yet
            </Alert>
          ) : (
            <ReviewList reviews={reviews} onReviewUpdate={fetchData} />
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default UserReviews;
