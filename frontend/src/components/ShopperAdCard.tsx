import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Chip,
  Button,
  Divider,
  useTheme
} from '@mui/material';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../utils/format';

interface ShopperAdCardProps {
  ad: {
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
  };
}

const ShopperAdCard: React.FC<ShopperAdCardProps> = ({ ad }) => {
  const theme = useTheme();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return theme.palette.success.main;
      case 'in_discussion':
        return theme.palette.warning.main;
      case 'accepted':
        return theme.palette.info.main;
      case 'shipped':
        return theme.palette.primary.main;
      case 'completed':
        return theme.palette.success.dark;
      default:
        return theme.palette.grey[500];
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Tersedia';
      case 'in_discussion':
        return 'Sedang Diskusi';
      case 'accepted':
        return 'Dalam Proses';
      case 'shipped':
        return 'Dikirim';
      case 'completed':
        return 'Selesai';
      default:
        return 'Dibatalkan';
    }
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': {
          boxShadow: 6
        }
      }}
    >
      <CardMedia
        component="img"
        height="200"
        image={ad.productImage}
        alt="Product"
        sx={{ objectFit: 'contain', bgcolor: 'white', p: 2 }}
      />
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ mb: 2 }}>
          <Chip
            label={getStatusText(ad.status)}
            size="small"
            sx={{
              bgcolor: getStatusColor(ad.status),
              color: 'white',
              mb: 1
            }}
          />
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              mb: 1
            }}
          >
            {new URL(ad.productUrl).hostname}
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Berat: {ad.productWeight}g
          </Typography>
          <Divider sx={{ my: 1 }} />
          <Typography variant="subtitle1" gutterBottom>
            Komisi Jastiper:
          </Typography>
          <Typography variant="h6" color="primary" gutterBottom>
            {formatCurrency(ad.commission.idr, 'IDR')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ({formatCurrency(ad.commission.native, ad.commission.currency)})
          </Typography>
        </Box>

        <Box sx={{ mt: 2 }}>
          <Button
            component={Link}
            to={`/shopper-ads/${ad._id}`}
            variant="contained"
            fullWidth
            color="primary"
            sx={{ mt: 'auto' }}
          >
            Lihat Detail
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ShopperAdCard;
