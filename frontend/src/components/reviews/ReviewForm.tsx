import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Rating,
  Typography,
  CircularProgress
} from '@mui/material';
import { Star } from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../../services/api';

interface ReviewFormProps {
  adId: string;
  open: boolean;
  onClose: () => void;
  onReviewSubmitted: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  adId,
  open,
  onClose,
  onReviewSubmitted
}) => {
  const [rating, setRating] = useState<number | null>(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!rating) {
      toast.error('Please provide a rating');
      return;
    }

    try {
      setSubmitting(true);
      await api.post(`/api/reviews/${adId}`, {
        rating,
        comment: comment.trim()
      });

      toast.success('Review submitted successfully');
      onReviewSubmitted();
      handleClose();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setComment('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Write a Review</DialogTitle>
      <DialogContent>
        <Box sx={{ my: 2 }}>
          <Typography component="legend">Rating</Typography>
          <Rating
            value={rating}
            onChange={(_, value) => setRating(value)}
            precision={1}
            size="large"
            emptyIcon={<Star style={{ opacity: 0.55 }} fontSize="inherit" />}
          />
        </Box>
        <TextField
          fullWidth
          multiline
          rows={4}
          label="Comment (Optional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={submitting}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!rating || submitting}
        >
          {submitting ? <CircularProgress size={24} /> : 'Submit Review'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReviewForm;
