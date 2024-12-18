import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
} from '@mui/material';
import { CheckCircleOutline as CheckCircleIcon } from '@mui/icons-material';

const PaymentSuccess = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '80vh',
      }}
    >
      <Paper sx={{ p: 4, maxWidth: 400, width: '100%', textAlign: 'center' }}>
        <CheckCircleIcon
          color="success"
          sx={{ fontSize: 64, mb: 2 }}
        />
        <Typography variant="h5" gutterBottom>
          Pembayaran Berhasil!
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Iklan Anda akan segera ditampilkan di marketplace.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/ads')}
          sx={{ mt: 2 }}
        >
          Lihat Iklan Saya
        </Button>
      </Paper>
    </Box>
  );
};

export default PaymentSuccess;
