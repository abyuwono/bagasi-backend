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
  Container
} from '@mui/material';
import { WhatsApp } from '@mui/icons-material';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';
import { ads } from '../services/api';
import { Ad } from '../types';
import RandomAvatar from '../components/RandomAvatar';
import VerificationBadge from '../components/VerificationBadge';
import FormattedNotes from '../components/FormattedNotes';
import { generateAdUrl } from '../utils/url';
import { Helmet } from 'react-helmet-async';
import Footer from '../components/Footer';

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
  const { id, slug, date } = useParams<{ id: string; slug?: string; date?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);
  const [bookingWeight, setBookingWeight] = useState('');
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [showContact, setShowContact] = useState(false);

  useEffect(() => {
    const fetchAd = async () => {
      try {
        const response = await ads.getById(id!);
        setAd(response);
        
        if (response) {
          const currentPath = window.location.pathname;
          const expectedPath = generateAdUrl(response);
          
          // Redirect if URL doesn't match expected format
          if (currentPath !== expectedPath && !currentPath.match(/^\/ads\/[^\/]+$/)) {
            navigate(expectedPath, { replace: true });
          }
        }
      } catch (error) {
        console.error('Error fetching ad:', error);
        setError('Ad not found');
      } finally {
        setLoading(false);
      }
    };

    fetchAd();
  }, [id, navigate]);

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

  const displayName = ad?.customDisplayName || ad?.user?.username || 'Anonymous';
  const rating = ad?.customRating !== undefined ? ad.customRating : (ad?.user?.rating || 0);
  const whatsappNumber = ad?.customWhatsapp || ad?.user?.whatsappNumber;

  const handleContactClick = () => {
    // If user is not logged in, show login dialog
    if (!user) {
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }

    // Check if user has active membership
    if (!user.membership?.type || user.membership.type === 'none' || 
        (user.membership.expiresAt && new Date(user.membership.expiresAt) < new Date())) {
      setSubscriptionDialogOpen(true);
      return;
    }

    // If user has active membership, show contact info
    setShowContact(true);
  };

  const renderContactButton = () => {
    const contactNumber = ad?.user?.customWhatsapp || ad?.user?.whatsappNumber;
    if (!contactNumber) {
      return null;
    }

    return (
      <Button
        variant="contained"
        color="success"
        startIcon={<WhatsApp />}
        onClick={handleContactClick}
        sx={{ mt: 2 }}
      >
        {showContact ? contactNumber : 'Lihat Kontak'}
      </Button>
    );
  };

  const handleWhatsAppClick = () => {
    if (!user?.membership?.type || !whatsappNumber) {
      setSubscriptionDialogOpen(true);
      return;
    }

    const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/\D/g, '')}`;
    window.open(whatsappUrl, '_blank');
  };

  const generateSEOTitle = (ad: Ad) => {
    const date = format(new Date(ad.departureDate), 'd MMMM yyyy', { locale: idLocale });
    return `Jastip Bagasi ${ad.departureCity} - ${ad.arrivalCity} ${date} by ${ad.user.username}`;
  };

  const generateSEODescription = (ad: Ad) => {
    const date = format(new Date(ad.departureDate), 'd MMMM yyyy', { locale: idLocale });
    return `Jastip Bagasi dari ${ad.departureCity} ke ${ad.arrivalCity} pada ${date}. ${ad.currency} ${ad.pricePerKg.toLocaleString()}/kg${ad.additionalNotes ? `. ${ad.additionalNotes}` : ''}`;
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
      {ad && (
        <Helmet>
          <title>{generateSEOTitle(ad)}</title>
          <meta name="description" content={generateSEODescription(ad)} />
          
          {/* Open Graph / Facebook */}
          <meta property="og:type" content="website" />
          <meta property="og:title" content={generateSEOTitle(ad)} />
          <meta property="og:description" content={generateSEODescription(ad)} />
          <meta property="og:site_name" content="Bagasi" />
          <meta property="og:url" content={window.location.href} />
          
          {/* Twitter */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={generateSEOTitle(ad)} />
          <meta name="twitter:description" content={generateSEODescription(ad)} />
          
          {/* Additional SEO */}
          <meta name="keywords" content={`jastip, jasa titip, ${ad.departureCity.toLowerCase()}, ${ad.arrivalCity.toLowerCase()}, bagasi, travel, shopping`} />
          <link rel="canonical" href={window.location.href} />
          
          {/* Structured Data */}
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Product",
              "name": generateSEOTitle(ad),
              "description": generateSEODescription(ad),
              "offers": {
                "@type": "Offer",
                "price": ad.pricePerKg,
                "priceCurrency": ad.currency,
                "availability": "https://schema.org/InStock"
              },
              "seller": {
                "@type": "Person",
                "name": ad.user.username
              }
            })}
          </script>
        </Helmet>
      )}
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Grid container spacing={3}>
          {/* User info and action buttons - Will show first on mobile */}
          <Grid item xs={12} sx={{ display: { xs: 'block', md: 'none' } }}>
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
              <Box display="flex" flexDirection="column">
                <Box display="flex" alignItems="center" mb={0.2}>
                  <Typography variant="h6">
                    {displayName}
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
                <Box display="flex" alignItems="center" mb={0.7}>
                  <Rating value={rating} precision={0.1} readOnly />
                  <Typography variant="body2" color="text.secondary" ml={1}>
                    ({rating.toFixed(1)})
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              {user?.role === 'shopper' ? (
                user.membership?.type === 'shopper' && user.membership?.expiresAt && new Date(user.membership.expiresAt) > new Date() ? (
                  showContact ? (
                    renderContactButton()
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
                    onClick={() => setSubscriptionDialogOpen(true)}
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

          {/* Main content */}
          <Grid item xs={12} md={8}>
            <Typography variant="h4" gutterBottom>
              {ad.departureCity} → {ad.arrivalCity}
            </Typography>

            <Box sx={{ mt: 2 }}>
              <Typography variant="h4" color="primary" gutterBottom>
                {ad.currency} {ad.pricePerKg.toLocaleString()}/kg
              </Typography>
              <Typography variant="body1" gutterBottom>
                Berat Bagasi Tersedia: {ad.availableWeight} KG
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
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Catatan Tambahan
                </Typography>
                <FormattedNotes notes={ad.additionalNotes} />
              </Box>
            )}
          </Grid>

          {/* User info and action buttons - Desktop view */}
          <Grid item md={4} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Box display="flex" flexDirection="column">
                <Box display="flex" alignItems="center" mb={0.2}>
                  <Typography variant="h6">
                    {displayName}
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
                <Box display="flex" alignItems="center" mb={0.7}>
                  <Rating value={rating} precision={0.1} readOnly />
                  <Typography variant="body2" color="text.secondary" ml={1}>
                    ({rating.toFixed(1)})
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              {user?.role === 'shopper' ? (
                user.membership?.type === 'shopper' && user.membership?.expiresAt && new Date(user.membership.expiresAt) > new Date() ? (
                  showContact ? (
                    renderContactButton()
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
                    onClick={() => setSubscriptionDialogOpen(true)}
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
      </Container>

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

      <Dialog open={subscriptionDialogOpen} onClose={() => setSubscriptionDialogOpen(false)}>
        <DialogTitle>Berlangganan untuk Menghubungi Penjual</DialogTitle>
        <DialogContent>
          <Typography>
            Untuk menghubungi penjual, Anda perlu berlangganan dengan biaya Rp 95.000/bulan.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubscriptionDialogOpen(false)}>Batal</Button>
          <Button 
            onClick={() => {
              setSubscriptionDialogOpen(false);
              navigate('/membership');
            }} 
            variant="contained" 
            color="primary"
          >
            Lanjutkan ke Keanggotaan
          </Button>
        </DialogActions>
      </Dialog>
      <Footer />
    </Box>
  );
};

export default AdDetails;
