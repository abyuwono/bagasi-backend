import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  useTheme
} from '@mui/material';
import { formatCurrency } from '../utils/format';
import api from '../services/api';

declare global {
  interface Window {
    snap: {
      pay: (token: string, options: any) => void;
    };
  }
}

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  adId: string;
  amount: number;
  onSuccess?: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  open,
  onClose,
  adId,
  amount,
  onSuccess
}) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);

  useEffect(() => {
    // Load Midtrans Snap when modal opens
    if (open) {
      const script = document.createElement('script');
      script.src = process.env.REACT_APP_MIDTRANS_SNAP_URL || 'https://app.sandbox.midtrans.com/snap/snap.js';
      script.setAttribute('data-client-key', process.env.REACT_APP_MIDTRANS_CLIENT_KEY || '');
      script.async = true;
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    }
  }, [open]);

  useEffect(() => {
    let statusInterval: NodeJS.Timeout;

    const checkPaymentStatus = async () => {
      try {
        const response = await api.get(`/api/payment/status/${adId}`);
        setPaymentStatus(response.data.status);

        if (response.data.status === 'success') {
          clearInterval(statusInterval);
          onSuccess?.();
          onClose();
        } else if (['failed', 'cancel', 'expire'].includes(response.data.status)) {
          clearInterval(statusInterval);
        }
      } catch (err) {
        console.error('Error checking payment status:', err);
      }
    };

    if (open && paymentStatus === 'pending') {
      statusInterval = setInterval(checkPaymentStatus, 5000);
    }

    return () => {
      if (statusInterval) {
        clearInterval(statusInterval);
      }
    };
  }, [open, paymentStatus, adId, onSuccess, onClose]);

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError('');

      // Get payment token
      const response = await api.post(`/api/payment/token/${adId}`);
      const { token } = response.data;

      // Open Snap payment popup
      window.snap.pay(token, {
        onSuccess: () => {
          setPaymentStatus('success');
          onSuccess?.();
          onClose();
        },
        onPending: () => {
          setPaymentStatus('pending');
        },
        onError: () => {
          setPaymentStatus('failed');
          setError('Payment failed. Please try again.');
        },
        onClose: () => {
          if (paymentStatus !== 'success') {
            setError('Payment cancelled. Please try again.');
          }
        }
      });
    } catch (err) {
      console.error('Error initiating payment:', err);
      setError('Failed to initiate payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Complete Payment</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Total Amount:
          </Typography>
          <Typography variant="h5" color="primary">
            {formatCurrency(amount, 'IDR')}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {paymentStatus === 'pending' && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Payment is being processed. Please complete the payment in the Midtrans window.
          </Alert>
        )}

        <Typography variant="body2" color="text.secondary">
          You will be redirected to Midtrans secure payment page to complete your payment.
          We support various payment methods including:
        </Typography>
        <ul>
          <li>Credit/Debit Card</li>
          <li>Bank Transfer</li>
          <li>E-Wallet (GoPay, OVO, etc.)</li>
          <li>Convenience Store</li>
        </ul>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handlePayment}
          variant="contained"
          color="primary"
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Pay Now'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentModal;
