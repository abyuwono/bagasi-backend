import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { loadStripe } from '@stripe/stripe-js';
import {
  CardElement,
  Elements,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { useAuth } from '../contexts/AuthContext';
import { payments, auth } from '../services/api';
import stripeLogo from '../assets/images/stripe.png';
import { useNavigate } from 'react-router-dom';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY!);

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

const PaymentForm = ({ onSuccess, onError }: { onSuccess: () => void; onError: (error: string) => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const selectedPlan = 'monthly';
  const duration = selectedPlan === 'monthly' ? 1 : 12;
  const { user } = useAuth();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      onError('Stripe belum siap. Silakan coba lagi.');
      return;
    }

    try {
      setLoading(true);

      // Create payment intent
      console.log('Creating payment intent...');
      const { clientSecret } = await payments.createMembershipIntent(duration);
      console.log('Payment intent created');

      // Get card element
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Form kartu kredit tidak ditemukan');
      }

      console.log('Confirming payment...');
      // Confirm payment
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              email: user?.email,
              name: user?.username,
            },
          },
        }
      );

      if (stripeError) {
        console.error('Payment failed:', stripeError);
        throw new Error(stripeError.message);
      }

      if (paymentIntent?.status === 'succeeded') {
        console.log('Payment successful');
        onSuccess();
      } else {
        console.error('Payment not successful:', paymentIntent);
        throw new Error('Pembayaran gagal. Silakan coba lagi.');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      if (error?.response?.status === 403 && error?.response?.data?.message === 'Account is deactivated') {
        onError('Akun Anda belum aktif. Silakan hubungi admin untuk mengaktifkan akun.');
      } else if (error?.response?.status === 401 || error?.response?.status === 403) {
        onError('Sesi Anda telah berakhir. Silakan login kembali.');
      } else {
        onError(error.message || 'Terjadi kesalahan saat memproses pembayaran');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Box sx={{ mb: 2 }}>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      </Box>
      <Button
        type="submit"
        variant="contained"
        color="primary"
        fullWidth
        disabled={loading || !stripe}
        sx={{ mt: 2 }}
      >
        {loading ? (
          <CircularProgress size={24} color="inherit" />
        ) : (
          'BERLANGGANAN SEKARANG'
        )}
      </Button>
    </form>
  );
};

const Membership = () => {
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserAndLoadPrice = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if user is logged in
        if (!user) {
          navigate('/login', { state: { from: '/membership' } });
          return;
        }

        // Check account status
        try {
          const authResponse = await auth.checkAuth();
          if (!authResponse.user || authResponse.user.active === false) {
            setError('Akun Anda belum aktif. Silakan hubungi admin untuk mengaktifkan akun.');
            return;
          }
        } catch (err: any) {
          if (err?.response?.status === 403 && err?.response?.data?.message === 'Account is deactivated') {
            setError('Akun Anda belum aktif. Silakan hubungi admin untuk mengaktifkan akun.');
            return;
          }
          throw err;
        }

        // Load membership price
        const priceData = await payments.getMembershipPrice();
        setPrice(priceData.price);
      } catch (err: any) {
        console.error('Error loading membership data:', err);
        setError('Terjadi kesalahan saat memuat data. Silakan coba lagi nanti.');
      } finally {
        setLoading(false);
      }
    };

    checkUserAndLoadPrice();
  }, [user, navigate]);

  const handleSuccess = () => {
    setSuccess(true);
    setError(null);
    // Optionally refresh user data or redirect
  };

  const handleError = (message: string) => {
    setError(message);
    setSuccess(false);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" color="primary" onClick={() => navigate('/')}>
          Kembali ke Beranda
        </Button>
      </Box>
    );
  }

  if (success) {
    return (
      <Box p={3}>
        <Alert severity="success" sx={{ mb: 2 }}>
          Pembayaran berhasil! Akun Anda telah diaktifkan sebagai Shopper.
        </Alert>
        <Button variant="contained" color="primary" onClick={() => navigate('/')}>
          Kembali ke Beranda
        </Button>
      </Box>
    );
  }

  if (!price) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Tidak dapat memuat harga membership. Silakan coba lagi nanti.
        </Alert>
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        maxWidth: { xs: '100%', sm: 600 },
        mx: 'auto',
        px: { xs: 2, sm: 0 },
        py: { xs: 2, sm: 4 }
      }}
    >
      <Paper 
        sx={{ 
          p: { xs: 2, sm: 4 },
          borderRadius: 2,
          boxShadow: 3
        }}
      >
        <Box textAlign="center" mb={4}>
          <Typography 
            variant="h4" 
            gutterBottom
            sx={{ 
              fontSize: { xs: '1.75rem', sm: '2.125rem' },
              fontWeight: 600
            }}
          >
            Membership
          </Typography>
          <Typography 
            variant="subtitle1" 
            color="text.secondary"
            sx={{ 
              fontSize: { xs: '0.875rem', sm: '1rem' },
              maxWidth: 450,
              mx: 'auto'
            }}
          >
            Berlangganan untuk mengakses fitur lengkap jasa titip
          </Typography>
          <Box mt={3}>
            <Typography variant="h3" color="primary" gutterBottom>
              {formatPrice(price)}
              <Typography component="span" variant="h6" color="text.secondary">
                /bulan
              </Typography>
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              *Berlangganan otomatis diperpanjang setiap bulan
            </Typography>
          </Box>
        </Box>

        <Elements stripe={stripePromise}>
          <PaymentForm onSuccess={handleSuccess} onError={handleError} />
        </Elements>

        <Box mt={4}>
          <Typography variant="h6" gutterBottom>
            Keuntungan Member:
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Akses ke semua fitur jasa titip"
                secondary="Fitur lengkap untuk memudahkan transaksi Anda" 
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Prioritas dukungan pelanggan"
                secondary="Dapatkan bantuan lebih cepat dari tim support kami" 
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Badge khusus member"
                secondary="Tampilkan badge eksklusif di profil Anda" 
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Notifikasi traveller baru"
                secondary="Dapatkan notifikasi saat ada traveller baru di kota tujuan Anda" 
              />
            </ListItem>
          </List>
        </Box>

        <Box mt={4} textAlign="center" sx={{ opacity: 0.7 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Pembayaran aman diproses oleh
          </Typography>
          <Box sx={{ mt: 0.2, mb: 0.2 }}>
            <img 
              src={stripeLogo}
              alt="Powered by Stripe" 
              style={{ 
                height: '120px',
                opacity: 0.75
              }} 
            />
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default Membership;
