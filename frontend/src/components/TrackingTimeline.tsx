import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent
} from '@mui/lab';
import {
  LocalShipping,
  CheckCircle,
  Error,
  FlightTakeoff,
  FlightLand,
  Store,
  Home
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';

interface TrackingHistory {
  status: string;
  location: string;
  timestamp: string;
  description: string;
}

interface TrackingInfo {
  status: string;
  lastUpdate: string;
  history: TrackingHistory[];
}

interface TrackingTimelineProps {
  adId: string;
  courier: string;
  isTraveler: boolean;
  onTrackingUpdate?: () => void;
}

const TrackingTimeline: React.FC<TrackingTimelineProps> = ({
  adId,
  courier,
  isTraveler,
  onTrackingUpdate
}) => {
  const theme = useTheme();
  const { user } = useAuth();
  
  const [tracking, setTracking] = useState<TrackingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [trackingUrl, setTrackingUrl] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchTrackingInfo();
    const interval = setInterval(fetchTrackingInfo, 300000); // Update every 5 minutes

    return () => clearInterval(interval);
  }, [adId]);

  const fetchTrackingInfo = async () => {
    try {
      const [trackingResponse, urlResponse] = await Promise.all([
        api.get(`/api/tracking/${adId}`),
        api.get(`/api/tracking/${adId}/url`)
      ]);

      setTracking(trackingResponse.data);
      setTrackingUrl(urlResponse.data.url);
      setError('');
    } catch (err) {
      console.error('Error fetching tracking info:', err);
      setError('Failed to load tracking information');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTracking = async () => {
    try {
      setUpdating(true);
      await api.post(`/api/tracking/${adId}/number`, {
        trackingNumber: trackingNumber.trim()
      });
      
      await fetchTrackingInfo();
      setShowAddDialog(false);
      setTrackingNumber('');
      onTrackingUpdate?.();
      toast.success('Tracking number added successfully');
    } catch (err) {
      console.error('Error adding tracking number:', err);
      toast.error('Failed to add tracking number');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'picked_up':
        return <Store color="primary" />;
      case 'in_transit':
        return <LocalShipping color="primary" />;
      case 'out_for_delivery':
        return <FlightLand color="primary" />;
      case 'delivered':
        return <CheckCircle color="success" />;
      case 'exception':
        return <Error color="error" />;
      default:
        return <FlightTakeoff color="primary" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6">Tracking Information</Typography>
        <Box>
          {trackingUrl && (
            <Button
              href={trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="outlined"
              size="small"
              sx={{ mr: 1 }}
            >
              Track on {courier}
            </Button>
          )}
          {isTraveler && !tracking?.status && (
            <Button
              variant="contained"
              size="small"
              onClick={() => setShowAddDialog(true)}
            >
              Add Tracking
            </Button>
          )}
        </Box>
      </Box>

      {!tracking?.history?.length ? (
        <Alert severity="info">
          No tracking information available yet
        </Alert>
      ) : (
        <Timeline>
          {tracking.history.map((event, index) => (
            <TimelineItem key={index}>
              <TimelineOppositeContent color="text.secondary">
                {formatDate(event.timestamp)}
              </TimelineOppositeContent>
              <TimelineSeparator>
                <TimelineDot>
                  {getStatusIcon(event.status)}
                </TimelineDot>
                {index < tracking.history.length - 1 && <TimelineConnector />}
              </TimelineSeparator>
              <TimelineContent>
                <Typography variant="subtitle2" component="span">
                  {event.location}
                </Typography>
                <Typography>{event.description}</Typography>
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      )}

      <Dialog open={showAddDialog} onClose={() => setShowAddDialog(false)}>
        <DialogTitle>Add Tracking Number</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Tracking Number"
            fullWidth
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            disabled={updating}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddDialog(false)} disabled={updating}>
            Cancel
          </Button>
          <Button
            onClick={handleAddTracking}
            variant="contained"
            disabled={!trackingNumber.trim() || updating}
          >
            {updating ? <CircularProgress size={24} /> : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default TrackingTimeline;
