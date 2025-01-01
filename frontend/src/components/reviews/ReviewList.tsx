import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Rating,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  useTheme
} from '@mui/material';
import {
  MoreVert,
  Flag,
  Delete,
  Star
} from '@mui/icons-material';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface Review {
  _id: string;
  reviewer: {
    _id: string;
    username: string;
    avatar: string;
    rating: {
      average: number;
      count: number;
    };
  };
  reviewee: {
    _id: string;
    username: string;
    avatar: string;
    rating: {
      average: number;
      count: number;
    };
  };
  rating: number;
  comment: string;
  createdAt: string;
  reported: boolean;
  removed: boolean;
}

interface User {
  _id: string;
  username: string;
  avatar: string;
  isAdmin: boolean;
}

interface ReviewListProps {
  reviews: Review[];
  onReviewUpdate: () => void;
}

const ReviewList: React.FC<ReviewListProps> = ({ reviews, onReviewUpdate }) => {
  const theme = useTheme();
  const { user } = useAuth();
  
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [processing, setProcessing] = useState(false);

  const handleReportReview = async () => {
    if (!selectedReview || !reportReason.trim()) return;

    try {
      setProcessing(true);
      await api.post(`/api/reviews/${selectedReview._id}/report`, {
        reason: reportReason.trim()
      });

      toast.success('Review reported successfully');
      onReviewUpdate();
      handleCloseReportDialog();
    } catch (error) {
      console.error('Error reporting review:', error);
      toast.error('Failed to report review');
    } finally {
      setProcessing(false);
    }
  };

  const handleRemoveReview = async () => {
    if (!selectedReview || !user?.isAdmin) return;

    try {
      setProcessing(true);
      await api.post(`/api/reviews/${selectedReview._id}/handle-report`, {
        action: 'remove'
      });

      toast.success('Review removed successfully');
      onReviewUpdate();
      handleCloseMenu();
    } catch (error) {
      console.error('Error removing review:', error);
      toast.error('Failed to remove review');
    } finally {
      setProcessing(false);
    }
  };

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, review: Review) => {
    setSelectedReview(review);
    setMenuAnchor(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
    setSelectedReview(null);
  };

  const handleOpenReportDialog = (review: Review) => {
    setSelectedReview(review);
    setShowReportDialog(true);
    handleCloseMenu();
  };

  const handleCloseReportDialog = () => {
    setShowReportDialog(false);
    setSelectedReview(null);
    setReportReason('');
  };

  const renderReviewActions = (review: Review) => {
    if (review.removed) return null;

    return (
      <Box>
        <IconButton
          size="small"
          onClick={(e) => handleOpenMenu(e, review)}
          disabled={processing}
        >
          <MoreVert />
        </IconButton>
      </Box>
    );
  };

  return (
    <Box>
      {reviews.map((review) => (
        <Card
          key={review._id}
          sx={{
            mb: 2,
            opacity: review.removed ? 0.6 : 1,
            position: 'relative'
          }}
        >
          <CardContent>
            <Box display="flex" justifyContent="space-between">
              <Box display="flex" alignItems="center">
                <Avatar
                  src={review.reviewer.avatar}
                  alt={review.reviewer.username}
                  sx={{ width: 40, height: 40, mr: 2 }}
                />
                <Box>
                  <Typography variant="subtitle1">
                    {review.reviewer.username}
                  </Typography>
                  <Box display="flex" alignItems="center">
                    <Rating
                      value={review.rating}
                      readOnly
                      size="small"
                      precision={0.5}
                    />
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ ml: 1 }}
                    >
                      {format(new Date(review.createdAt), 'MMM d, yyyy')}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              {renderReviewActions(review)}
            </Box>

            <Typography sx={{ mt: 2, whiteSpace: 'pre-line' }}>
              {review.comment}
            </Typography>

            {review.reported && !review.removed && (
              <Box
                sx={{
                  mt: 2,
                  p: 1,
                  bgcolor: theme.palette.warning.light,
                  borderRadius: 1
                }}
              >
                <Typography variant="caption" color="warning.dark">
                  This review has been reported and is under review
                </Typography>
              </Box>
            )}

            {review.removed && (
              <Box
                sx={{
                  mt: 2,
                  p: 1,
                  bgcolor: theme.palette.error.light,
                  borderRadius: 1
                }}
              >
                <Typography variant="caption" color="error.dark">
                  This review has been removed by an administrator
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Review Actions Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleCloseMenu}
      >
        {!selectedReview?.reported && (
          <MenuItem onClick={() => handleOpenReportDialog(selectedReview!)}>
            <Flag sx={{ mr: 1 }} /> Report Review
          </MenuItem>
        )}
        {user?.isAdmin && (
          <MenuItem onClick={handleRemoveReview}>
            <Delete sx={{ mr: 1 }} /> Remove Review
          </MenuItem>
        )}
      </Menu>

      {/* Report Dialog */}
      <Dialog
        open={showReportDialog}
        onClose={handleCloseReportDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Report Review</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Reason for reporting"
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            disabled={processing}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReportDialog} disabled={processing}>
            Cancel
          </Button>
          <Button
            onClick={handleReportReview}
            variant="contained"
            color="error"
            disabled={!reportReason.trim() || processing}
          >
            Report
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReviewList;
