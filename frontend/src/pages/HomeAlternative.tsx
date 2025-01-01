import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  TextField,
  Box,
  Typography,
  InputAdornment,
  CircularProgress,
  Paper,
  Divider
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { Helmet } from 'react-helmet-async';
import AdsTable from '../components/AdsTable';
import ShopperAdsSection from '../components/ShopperAdsSection';
import { Ad } from '../types';

const HomeAlternative: React.FC = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/ads`);
        if (!response.ok) throw new Error('Failed to fetch ads');
        const data = await response.json();
        setAds(data);
      } catch (error) {
        console.error('Error fetching ads:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAds();
  }, []);

  const filteredAds = ads.filter(ad => {
    if (!ad) return false;
    const searchLower = searchTerm.toLowerCase();
    return (
      (ad.departureCity?.toLowerCase() || '').includes(searchLower) ||
      (ad.arrivalCity?.toLowerCase() || '').includes(searchLower) ||
      (ad.customDisplayName?.toLowerCase() || ad.user?.username?.toLowerCase() || '').includes(searchLower)
    );
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Helmet>
        <title>Bagasi - Platform Jasa Titip #1 di Indonesia</title>
        <meta 
          name="description" 
          content="Temukan jasa titip terpercaya di Bagasi. Platform yang menghubungkan traveler dengan pembeli untuk layanan jasa titip yang aman dan terpercaya." 
        />
      </Helmet>
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 3 }}>
        <ShopperAdsSection />
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h5" component="h1" gutterBottom>
                  Cari Jasa Titip
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  Temukan traveler yang sesuai dengan kebutuhan Anda
                </Typography>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Cari berdasarkan kota asal, tujuan, atau nama traveler..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <AdsTable 
                ads={filteredAds} 
                title="Daftar Jasa Titip Tersedia"
                showPagination={true}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>
    </>
  );
};

export default HomeAlternative;
