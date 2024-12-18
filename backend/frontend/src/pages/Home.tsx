import React, { useState, useEffect } from 'react';
import {
  Grid,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import AdCard from '../components/AdCard';
import { ads } from '../services/api';
import { Ad } from '../types';

const Home = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adList, setAdList] = useState<Ad[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const data = await ads.getAll();
        setAdList(data);
      } catch (err) {
        setError('Gagal memuat iklan. Silakan coba lagi nanti.');
      } finally {
        setLoading(false);
      }
    };

    fetchAds();
  }, []);

  const filteredAds = adList.filter(
    (ad) =>
      ad.departureCity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ad.arrivalCity.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box mb={4}>
        <Typography variant="h4" gutterBottom align="center">
          Cari Jasa Titip Bagasi
        </Typography>
        <Typography variant="subtitle1" align="center" color="text.secondary" gutterBottom>
          Temukan traveler yang bisa membawa barang kamu lebih murah dan cepat
        </Typography>

        <Box component="form" sx={{ mt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={5}>
              <TextField
                fullWidth
                label="Dari Kota"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={5}>
              <TextField
                fullWidth
                label="Ke Kota"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                sx={{ height: '100%' }}
              >
                Cari
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
      <Grid container spacing={3}>
        {filteredAds.map((ad) => (
          <Grid item xs={12} sm={6} md={4} key={ad._id}>
            <AdCard ad={ad} />
          </Grid>
        ))}
        {filteredAds.length === 0 && (
          <Grid item xs={12}>
            <Typography align="center" color="textSecondary">
              Tidak ada iklan yang ditemukan
            </Typography>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default Home;
