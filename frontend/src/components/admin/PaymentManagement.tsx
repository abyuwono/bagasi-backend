import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  TextFieldProps,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  useTheme,
  Tooltip as MuiTooltip,
  CircularProgress
} from '@mui/material';
import {
  Refresh,
  FilterList,
  Search,
  Warning,
  Check,
  Close,
  MonetizationOn,
  TrendingUp,
  Assignment
} from '@mui/icons-material';
import { DateRangePicker } from '@mui/lab';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend
} from 'chart.js';
import api from '../../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend
);

interface PaymentOverview {
  overview: {
    _id: string;
    count: number;
    totalAmount: number;
  }[];
  totalRevenue: number;
}

interface PaymentStats {
  _id: string;
  stats: {
    status: string;
    count: number;
    amount: number;
  }[];
}

interface PaymentDetails {
  payments: any[];
  total: number;
  pages: number;
  currentPage: number;
}

const PaymentManagement: React.FC = () => {
  const theme = useTheme();

  // States
  const [overview, setOverview] = useState<PaymentOverview | null>(null);
  const [stats, setStats] = useState<PaymentStats[]>([]);
  const [details, setDetails] = useState<PaymentDetails | null>(null);
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date()
    },
    minAmount: '',
    maxAmount: '',
    search: ''
  });
  const [page, setPage] = useState(1);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [refundReason, setRefundReason] = useState('');
  const [processingRefund, setProcessingRefund] = useState(false);
  const [showIssueDialog, setShowIssueDialog] = useState(false);
  const [resolution, setResolution] = useState('');

  // Effects
  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchPaymentDetails();
  }, [filters, page]);

  // Data fetching
  const fetchData = async () => {
    try {
      setLoading(true);
      const [overviewData, statsData, issuesData] = await Promise.all([
        api.get('/api/admin/payments/overview', {
          params: {
            startDate: filters.dateRange.start,
            endDate: filters.dateRange.end
          }
        }),
        api.get('/api/admin/payments/stats'),
        api.get('/api/admin/payments/issues')
      ]);

      setOverview(overviewData.data);
      setStats(statsData.data);
      setIssues(issuesData.data);
    } catch (error) {
      console.error('Error fetching payment data:', error);
      toast.error('Failed to fetch payment data');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentDetails = async () => {
    try {
      const response = await api.get('/api/admin/payments/details', {
        params: {
          ...filters,
          page,
          limit: 10
        }
      });
      setDetails(response.data);
    } catch (error) {
      console.error('Error fetching payment details:', error);
      toast.error('Failed to fetch payment details');
    }
  };

  // Action handlers
  const handleRefund = async () => {
    try {
      setProcessingRefund(true);
      await api.post(`/api/admin/payments/refund/${selectedPayment._id}`, {
        reason: refundReason
      });
      
      toast.success('Refund processed successfully');
      setShowRefundDialog(false);
      fetchData();
    } catch (error) {
      console.error('Error processing refund:', error);
      toast.error('Failed to process refund');
    } finally {
      setProcessingRefund(false);
    }
  };

  const handleResolveIssue = async () => {
    try {
      await api.post(`/api/admin/payments/issues/${selectedPayment._id}/resolve`, {
        resolution
      });
      
      toast.success('Issue resolved successfully');
      setShowIssueDialog(false);
      fetchData();
    } catch (error) {
      console.error('Error resolving issue:', error);
      toast.error('Failed to resolve issue');
    }
  };

  // Chart data
  const chartData = {
    labels: stats.map(stat => stat._id),
    datasets: [
      {
        label: 'Successful Payments',
        data: stats.map(stat => 
          stat.stats.find(s => s.status === 'success')?.amount || 0
        ),
        borderColor: theme.palette.success.main,
        fill: false
      },
      {
        label: 'Failed Payments',
        data: stats.map(stat => 
          stat.stats.find(s => s.status === 'failed')?.amount || 0
        ),
        borderColor: theme.palette.error.main,
        fill: false
      }
    ]
  };

  // Render functions
  const renderOverviewCards = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center">
              <MonetizationOn color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Total Revenue</Typography>
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
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center">
              <TrendingUp color="success" sx={{ mr: 1 }} />
              <Typography variant="h6">Success Rate</Typography>
            </Box>
            <Typography variant="h4">
              {overview?.overview.find(o => o._id === 'success')?.count || 0}
              /
              {overview?.overview.reduce((acc, curr) => acc + curr.count, 0) || 0}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center">
              <Warning color="error" sx={{ mr: 1 }} />
              <Typography variant="h6">Issues</Typography>
            </Box>
            <Typography variant="h4">{issues.length}</Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderFilters = () => (
    <Box mb={3}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="success">Success</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
              <MenuItem value="refunded">Refunded</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={4}>
          <DateRangePicker
            startText="Start Date"
            endText="End Date"
            value={[filters.dateRange.start, filters.dateRange.end]}
            onChange={(newValue: [Date | null, Date | null]) => {
              if (newValue[0] && newValue[1]) {
                setFilters({
                  ...filters,
                  dateRange: {
                    start: newValue[0],
                    end: newValue[1]
                  }
                });
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
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            label="Search"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            InputProps={{
              endAdornment: <Search />
            }}
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchData}
          >
            Refresh
          </Button>
        </Grid>
      </Grid>
    </Box>
  );

  const renderPaymentTable = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Order ID</TableCell>
            <TableCell>User</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {details?.payments.map((payment) => (
            <TableRow key={payment._id}>
              <TableCell>{payment.payment.orderId}</TableCell>
              <TableCell>{payment.user.username}</TableCell>
              <TableCell>
                {new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: 'IDR'
                }).format(payment.payment.amount)}
              </TableCell>
              <TableCell>
                <Chip
                  label={payment.payment.status}
                  color={
                    payment.payment.status === 'success'
                      ? 'success'
                      : payment.payment.status === 'pending'
                      ? 'warning'
                      : 'error'
                  }
                />
              </TableCell>
              <TableCell>
                {format(new Date(payment.createdAt), 'dd MMM yyyy HH:mm')}
              </TableCell>
              <TableCell>
                <MuiTooltip title="View Details">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSelectedPayment(payment);
                      setShowRefundDialog(true);
                    }}
                  >
                    <Assignment />
                  </IconButton>
                </MuiTooltip>
                {payment.payment.status === 'success' && (
                  <MuiTooltip title="Refund">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => {
                        setSelectedPayment(payment);
                        setShowRefundDialog(true);
                      }}
                    >
                      <MonetizationOn />
                    </IconButton>
                  </MuiTooltip>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Payment Management
      </Typography>

      {renderOverviewCards()}

      <Box my={4}>
        <Typography variant="h5" gutterBottom>
          Payment Trends
        </Typography>
        <Paper sx={{ p: 2 }}>
          <Line data={chartData} options={{ responsive: true }} />
        </Paper>
      </Box>

      <Box my={4}>
        <Typography variant="h5" gutterBottom>
          Payment Details
        </Typography>
        {renderFilters()}
        {renderPaymentTable()}
      </Box>

      {/* Refund Dialog */}
      <Dialog open={showRefundDialog} onClose={() => setShowRefundDialog(false)}>
        <DialogTitle>Process Refund</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Refund Reason"
            value={refundReason}
            onChange={(e) => setRefundReason(e.target.value)}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowRefundDialog(false)}
            disabled={processingRefund}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRefund}
            color="error"
            variant="contained"
            disabled={!refundReason || processingRefund}
          >
            {processingRefund ? <CircularProgress size={24} /> : 'Process Refund'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Issue Resolution Dialog */}
      <Dialog open={showIssueDialog} onClose={() => setShowIssueDialog(false)}>
        <DialogTitle>Resolve Payment Issue</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Resolution Details"
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowIssueDialog(false)}>Cancel</Button>
          <Button
            onClick={handleResolveIssue}
            color="primary"
            variant="contained"
            disabled={!resolution}
          >
            Resolve Issue
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaymentManagement;
