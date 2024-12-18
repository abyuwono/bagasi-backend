import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Chip,
  Rating,
  Stack,
} from '@mui/material';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { Ad } from '../types';
import { id } from 'date-fns/locale';
import VerificationBadge from './VerificationBadge';

interface AdCardProps {
  ad: Ad;
}

const AdCard: React.FC<AdCardProps> = ({ ad }) => {
  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            {ad.departureCity} → {ad.arrivalCity}
          </Typography>
          <Chip
            label={`${ad.availableWeight} KG`}
            color="primary"
            variant="outlined"
          />
        </Box>

        <Box display="flex" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center">
            <Typography variant="subtitle1" sx={{ mr: 1 }}>
              {ad.user.username}
            </Typography>
            {ad.user.isVerified && (
              <VerificationBadge
                sx={{
                  fontSize: '1.2rem',
                  color: '#34D399',
                  mr: 1
                }}
              />
            )}
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Rating value={ad.user.rating} precision={0.5} readOnly size="small" />
            <Typography variant="body2" color="text.secondary">
              ({ad.user.totalReviews})
            </Typography>
          </Stack>
        </Box>

        <Typography color="textSecondary" gutterBottom>
          Keberangkatan: {format(new Date(ad.departureDate), 'PPP', { locale: id })}
        </Typography>
        <Typography color="textSecondary" gutterBottom>
          Drop-in Terakhir: {format(new Date(ad.expiresAt), 'PPP', { locale: id })}
        </Typography>
        <Typography variant="h6" color="primary" gutterBottom>
          Rp {ad.pricePerKg.toLocaleString()} / KG
        </Typography>

        {ad.additionalNotes && (
          <Typography variant="body2" color="textSecondary" paragraph>
            {ad.additionalNotes}
          </Typography>
        )}

        <Box display="flex" justifyContent="flex-end">
          <Button
            component={Link}
            to={`/ads/${ad._id}`}
            variant="contained"
            color="primary"
          >
            Lihat Detail
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default AdCard;
