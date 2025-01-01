import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  useTheme,
  Paper,
  Button,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  TextFieldProps
} from '@mui/material';
import {
  DateRangePicker,
  DateRange
} from '@mui/lab';
import {
  TrendingUp,
  People,
  ShoppingCart,
  AttachMoney,
  Refresh,
  Public,
  Message,
  Star,
  LocalShipping
} from '@mui/icons-material';
import {
  Line,
  Bar,
  Doughnut,
  Scatter
} from 'react-chartjs-2';
import { format, subDays } from 'date-fns';
import { toast } from 'react-toastify';
import api from '../../services/api';

interface MetricData {
  _id: string;
  totalAds?: number;
  activeAds?: number;
  completedAds?: number;
  newUsers?: number;
  count?: number;
  totalMessages?: number;
  totalReviews?: number;
}

interface UserMetrics {
  userGrowth: MetricData[];
}

interface EngagementMetrics {
  chatMetrics: MetricData[];
  reviewMetrics: MetricData[];
}

interface OverviewMetrics {
  totalAds: number;
  totalUsers: number;
  totalRevenue: number;
  completedOrders: number;
}

interface PerformanceMetrics {
  avgProcessingTime: number;
  avgDeliveryTime: number;
  successRate: number;
}

const AnalyticsDashboard: React.FC = () => {
  const theme = useTheme();

  // States
  const [dateRange, setDateRange] = useState<DateRange<Date>>([
    subDays(new Date(), 30),
    new Date()
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [overview, setOverview] = useState<OverviewMetrics | null>(null);
  const [adMetrics, setAdMetrics] = useState<MetricData[]>([]);
  const [userMetrics, setUserMetrics] = useState<UserMetrics | null>(null);
  const [engagementMetrics, setEngagementMetrics] = useState<EngagementMetrics | null>(null);
  const [destinations, setDestinations] = useState<MetricData[]>([]);
  const [productMetrics, setProductMetrics] = useState<MetricData[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);

  // Effects
  useEffect(() => {
    if (dateRange[0] && dateRange[1]) {
      fetchData();
    }
  }, [dateRange]);

  // Data fetching
  const fetchData = async () => {
    try {
      setLoading(true);
      const [
        overviewData,
        adData,
        userData,
        engagementData,
        destinationData,
        productData,
        performanceData
      ] = await Promise.all([
        api.get('/api/analytics/overview', {
          params: {
            startDate: dateRange[0]?.toISOString(),
            endDate: dateRange[1]?.toISOString()
          }
        }),
        api.get('/api/analytics/ads', {
          params: {
            startDate: dateRange[0]?.toISOString(),
            endDate: dateRange[1]?.toISOString()
          }
        }),
        api.get('/api/analytics/users', {
          params: {
            startDate: dateRange[0]?.toISOString(),
            endDate: dateRange[1]?.toISOString()
          }
        }),
        api.get('/api/analytics/engagement', {
          params: {
            startDate: dateRange[0]?.toISOString(),
            endDate: dateRange[1]?.toISOString()
          }
        }),
        api.get('/api/analytics/destinations', {
          params: {
            startDate: dateRange[0]?.toISOString(),
            endDate: dateRange[1]?.toISOString()
          }
        }),
        api.get('/api/analytics/products', {
          params: {
            startDate: dateRange[0]?.toISOString(),
            endDate: dateRange[1]?.toISOString()
          }
        }),
        api.get('/api/analytics/performance', {
          params: {
            startDate: dateRange[0]?.toISOString(),
            endDate: dateRange[1]?.toISOString()
          }
        })
      ]);

      setOverview(overviewData.data);
      setAdMetrics(adData.data);
      setUserMetrics(userData.data);
      setEngagementMetrics(engagementData.data);
      setDestinations(destinationData.data);
      setProductMetrics(productData.data);
      setPerformanceMetrics(performanceData.data);
      setError('');
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      setError('Failed to load analytics data');
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  // Chart data
  const adChartData = {
    labels: adMetrics.map(metric => format(new Date(metric._id), 'MMM d')),
    datasets: [
      {
        label: 'Total Ads',
        data: adMetrics.map(metric => metric.totalAds),
        borderColor: theme.palette.primary.main,
        fill: false
      },
      {
        label: 'Active Ads',
        data: adMetrics.map(metric => metric.activeAds),
        borderColor: theme.palette.success.main,
        fill: false
      },
      {
        label: 'Completed Ads',
        data: adMetrics.map(metric => metric.completedAds),
        borderColor: theme.palette.info.main,
        fill: false
      }
    ]
  };

  const userChartData = {
    labels: userMetrics?.userGrowth.map(metric => 
      format(new Date(metric._id), 'MMM d')
    ),
    datasets: [
      {
        label: 'New Users',
        data: userMetrics?.userGrowth.map(metric => metric.newUsers),
        borderColor: theme.palette.secondary.main,
        fill: false
      }
    ]
  };

  const destinationChartData = {
    labels: destinations.map(d => d._id),
    datasets: [
      {
        data: destinations.map(d => d.count),
        backgroundColor: [
          theme.palette.primary.main,
          theme.palette.secondary.main,
          theme.palette.success.main,
          theme.palette.info.main,
          theme.palette.warning.main
        ]
      }
    ]
  };

  const engagementChartData = {
    labels: engagementMetrics?.chatMetrics.map(metric => 
      format(new Date(metric._id), 'MMM d')
    ),
    datasets: [
      {
        label: 'Messages',
        data: engagementMetrics?.chatMetrics.map(metric => metric.totalMessages),
        borderColor: theme.palette.success.main,
        fill: false
      },
      {
        label: 'Reviews',
        data: engagementMetrics?.reviewMetrics.map(metric => metric.totalReviews),
        borderColor: theme.palette.warning.main,
        fill: false
      }
    ]
  };

  // Render functions
  const renderOverviewCards = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center">
              <ShoppingCart color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Total Ads</Typography>
            </Box>
            <Typography variant="h4">{overview?.totalAds}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center">
              <People color="secondary" sx={{ mr: 1 }} />
              <Typography variant="h6">Total Users</Typography>
            </Box>
            <Typography variant="h4">{overview?.totalUsers}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center">
              <AttachMoney color="success" sx={{ mr: 1 }} />
              <Typography variant="h6">Revenue</Typography>
            </Box>
            <Typography variant="h4">
              {new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR'
              }).format(overview?.totalRevenue || 0)}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center">
              <TrendingUp color="info" sx={{ mr: 1 }} />
              <Typography variant="h6">Completed Orders</Typography>
            </Box>
            <Typography variant="h4">{overview?.completedOrders}</Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderPerformanceCards = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={4}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center">
              <LocalShipping color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Avg. Processing Time</Typography>
            </Box>
            <Typography variant="h4">
              {performanceMetrics?.avgProcessingTime ? Math.round(performanceMetrics.avgProcessingTime / (1000 * 60 * 60 * 24)) : 0} days
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center">
              <LocalShipping color="secondary" sx={{ mr: 1 }} />
              <Typography variant="h6">Avg. Delivery Time</Typography>
            </Box>
            <Typography variant="h4">
              {performanceMetrics?.avgDeliveryTime ? Math.round(performanceMetrics.avgDeliveryTime / (1000 * 60 * 60 * 24)) : 0} days
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center">
              <Star color="warning" sx={{ mr: 1 }} />
              <Typography variant="h6">Success Rate</Typography>
            </Box>
            <Typography variant="h4">
              {performanceMetrics?.successRate ? `${Math.round(performanceMetrics.successRate * 100)}%` : '0%'}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

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
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Analytics Dashboard</Typography>
        <Box display="flex" alignItems="center">
          <DateRangePicker
            value={dateRange}
            onChange={(newValue: DateRange<Date>) => {
              if (newValue[0] && newValue[1]) {
                setDateRange(newValue);
              }
            }}
            renderInput={(startProps: TextFieldProps, endProps: TextFieldProps) => (
              <>
                <TextField {...startProps} />
                <Box sx={{ mx: 2 }}> to </Box>
                <TextField {...endProps} />
              </>
            )}
          />
          <IconButton onClick={fetchData} sx={{ ml: 2 }}>
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      {renderOverviewCards()}

      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Ad Performance
            </Typography>
            <Line data={adChartData} options={{ responsive: true }} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Popular Destinations
            </Typography>
            <Doughnut data={destinationChartData} options={{ responsive: true }} />
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              User Growth
            </Typography>
            <Line data={userChartData} options={{ responsive: true }} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Engagement
            </Typography>
            <Line data={engagementChartData} options={{ responsive: true }} />
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3 }}>
        <Typography variant="h5" gutterBottom>
          Performance Metrics
        </Typography>
        {renderPerformanceCards()}
      </Box>
    </Box>
  );
};

export default AnalyticsDashboard;
