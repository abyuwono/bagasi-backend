import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Rating,
  Divider,
  Tooltip,
} from '@mui/material';
import { WhatsApp } from '@mui/icons-material';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { ads } from '../services/api';
import { Ad } from '../types';
import RandomAvatar from '../components/RandomAvatar';
import VerificationBadge from '../components/VerificationBadge';

const monthsInIndonesian = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember'
];

const formatDateInIndonesian = (date: Date) => {
  const day = format(date, 'dd');
  const month = monthsInIndonesian[date.getMonth()];
  const year = format(date, 'yyyy');
  return `${day} ${month} ${year}`;
};

const AdDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [bookingWeight, setBookingWeight] = useState('');
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [showContact, setShowContact] = useState(false);

  useEffect(() => {
    const fetchAd = async () => {
      try {
        if (!id) {
          setError('ID iklan tidak valid');
          return;
        }
        setLoading(true);
        const data = await ads.getById(id);
        if (!data) {
          setError('Iklan tidak ditemukan');
          return;
        }
        setAd(data);
      } catch (err: any) {
        console.error('Error fetching ad:', err);
        setError(err.response?.data?.message || 'Gagal memuat detail iklan. Silakan coba lagi nanti.');
      } finally {
        setLoading(false);
      }
    };

    fetchAd();
  }, [id]);

  const handleBookingSubmit = async () => {
    try {
      if (!ad || !user) return;

      const weight = parseFloat(bookingWeight);
      if (isNaN(weight) || weight <= 0 || weight > ad.availableWeight) {
        setBookingError('Silakan masukkan berat yang valid');
        return;
      }

      await ads.book(ad._id, { weight });
      setBookingDialogOpen(false);
      setShowContact(true);
    } catch (err) {
      setBookingError('Gagal memesan. Silakan coba lagi nanti.');
    }
  };

  const handleWhatsAppClick = (number: string) => {
    const message = encodeURIComponent(
      `Halo, saya ingin mengirim paket seberat ${bookingWeight}kg dari ${ad?.departureCity} ke ${ad?.arrivalCity}. Kapan kita bisa bertemu untuk serah terima paket?`
    );
    window.open(`https://wa.me/${number}?text=${message}`, '_blank');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !ad) {
    return (
      <Alert severity="error" sx={{ mt: 4 }}>
        {error || 'Iklan tidak ditemukan'}
      </Alert>
    );
  }

  return (
    <Box>
      <Paper sx={{ p: 3 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Typography variant="h4" gutterBottom>
              {ad.departureCity} → {ad.arrivalCity}
            </Typography>

            <Box mb={3}>
              <Typography variant="h5" color="primary">
                Rp {ad.pricePerKg.toLocaleString()} / KG
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {ad.availableWeight} KG tersedia
              </Typography>
            </Box>

            <Typography variant="body1" paragraph>
              <strong>Keberangkatan:</strong>{' '}
              {formatDateInIndonesian(new Date(ad.departureDate))}
            </Typography>
            <Typography variant="body1" paragraph>
              <strong>Drop-in Terakhir:</strong>{' '}
              {formatDateInIndonesian(new Date(ad.expiresAt))}
            </Typography>

            {ad.additionalNotes && (
              <Box mt={2}>
                <Typography variant="h6" gutterBottom>
                  Catatan Tambahan
                </Typography>
                <Typography variant="body1" paragraph>
                  {ad.additionalNotes}
                </Typography>
              </Box>
            )}
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" mb={2}>
                <RandomAvatar seed={ad.user?._id || 'default'} />
                <Box ml={2}>
                  <Box display="flex" alignItems="center">
                    <Typography variant="h6">
                      {ad.user?.username || 'Pengguna'}
                    </Typography>
                    {ad.user?.isVerified && (
                      <Tooltip title="ID Verified" arrow>
                        <Box ml={1}>
                          <VerificationBadge
                            sx={{
                              fontSize: '1.2rem',
                              color: '#34D399',
                            }}
                          />
                        </Box>
                      </Tooltip>
                    )}
                  </Box>
                  <Box display="flex" alignItems="center">
                    <Rating value={ad.user?.rating || 0} precision={0.5} readOnly size="small" />
                    <Typography variant="body2" color="text.secondary" ml={1}>
                      ({ad.user?.totalReviews || 0})
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              {user?.role === 'shopper' ? (
                user.membership?.type === 'shopper' && user.membership?.expiresAt && new Date(user.membership.expiresAt) > new Date() ? (
                  showContact ? (
                    <Button
                      variant="contained"
                      color="success"
                      fullWidth
                      startIcon={<WhatsApp />}
                      onClick={() => handleWhatsAppClick(ad.user?.whatsappNumber!)}
                    >
                      Kirim Pesan
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      onClick={() => setBookingDialogOpen(true)}
                    >
                      Pesan Sekarang
                    </Button>
                  )
                ) : (
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    startIcon={<WhatsApp />}
                    onClick={() => {
                      const dialog = window.confirm(
                        'Untuk menghubungi penjual, Anda perlu berlangganan dengan biaya Rp 95.000/bulan. Lanjutkan ke halaman keanggotaan?'
                      );
                      if (dialog) {
                        navigate('/membership');
                      }
                    }}
                  >
                    Kirim Pesan
                  </Button>
                )
              ) : user ? (
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  startIcon={<WhatsApp />}
                  onClick={() => {
                    const dialog = window.confirm(
                      'Fitur ini hanya tersedia untuk akun pembeli. Silakan daftar sebagai pembeli untuk mengakses fitur ini.'
                    );
                    if (dialog) {
                      navigate('/register?role=shopper');
                    }
                  }}
                >
                  Kirim Pesan
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  startIcon={<WhatsApp />}
                  onClick={() => navigate('/login')}
                >
                  Masuk untuk Kirim Pesan
                </Button>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      <Dialog open={bookingDialogOpen} onClose={() => setBookingDialogOpen(false)}>
        <DialogTitle>Pesan Ruang Bagasi</DialogTitle>
        <DialogContent>
          <Box mt={2}>
            <TextField
              fullWidth
              label="Berat (KG)"
              type="number"
              value={bookingWeight}
              onChange={(e) => setBookingWeight(e.target.value)}
              error={!!bookingError}
              helperText={bookingError}
              InputProps={{
                inputProps: {
                  min: 0,
                  max: ad.availableWeight,
                  step: 0.1,
                },
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBookingDialogOpen(false)}>Batal</Button>
          <Button onClick={handleBookingSubmit} variant="contained" color="primary">
            Pesan
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdDetails;
