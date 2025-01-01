import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Skeleton,
  Container,
  Alert,
  Paper,
  Button
} from '@mui/material';
import ShopperAdCard from './ShopperAdCard';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import api from '../services/api';

interface ShopperAd {
  _id: string;
  productImage: string;
  productUrl: string;
  productWeight: number;
  commission: {
    idr: number;
    native: number;
    currency: 'AUD' | 'IDR' | 'USD' | 'SGD' | 'KRW';
  };
  status: string;
}

const ShopperAdsSection: React.FC = () => {
  const [ads, setAds] = useState<ShopperAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const response = await api.get('/api/shopper-ads/active');
        setAds(response.data);
        setError('');
      } catch (err) {
        console.error('Error fetching shopper ads:', err);
        setError('Failed to load shopper ads');
      } finally {
        setLoading(false);
      }
    };

    fetchAds();
  }, []);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.default' }}>
          <Typography variant="h5" gutterBottom>
            Barang Jastip
          </Typography>
          <Grid container spacing={3}>
            {[1, 2, 3].map((item) => (
              <Grid item xs={12} sm={6} md={4} key={item}>
                <Skeleton variant="rectangular" height={400} />
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.default' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">Barang Jastip</Typography>
          {user?.role === 'shopper' && (
            <Button
              component={Link}
              to="/shopper-ads/new"
              variant="contained"
              color="primary"
            >
              Buat Permintaan
            </Button>
          )}
        </Box>

        {ads.length === 0 ? (
          <Alert severity="info">
            Belum ada permintaan barang saat ini.
            {user?.role === 'shopper' && (
              <Button
                component={Link}
                to="/shopper-ads/new"
                color="primary"
                size="small"
                sx={{ ml: 2 }}
              >
                Buat Permintaan
              </Button>
            )}
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {ads.map((ad) => (
              <Grid item xs={12} sm={6} md={4} key={ad._id}>
                <ShopperAdCard ad={ad} />
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>
    </Container>
  );
};

export default ShopperAdsSection;
