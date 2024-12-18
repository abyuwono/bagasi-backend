import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
} from '@mui/material';

interface AdPostingConfirmationProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  adData: {
    departureCity: string;
    arrivalCity: string;
    departureDate: string;
    returnDate: string;
    availableWeight: string;
    pricePerKg: string;
    currency: string;
    additionalNotes?: string;
  };
  postingFee: number;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const AdPostingConfirmation: React.FC<AdPostingConfirmationProps> = ({
  open,
  onClose,
  onConfirm,
  adData,
  postingFee,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Konfirmasi Pemasangan Iklan</DialogTitle>
      <DialogContent>
        <Typography variant="subtitle1" gutterBottom>
          Detail Iklan:
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Dari
          </Typography>
          <Typography variant="body1">{adData.departureCity}</Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Ke
          </Typography>
          <Typography variant="body1">{adData.arrivalCity}</Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Tanggal Penerbangan
          </Typography>
          <Typography variant="body1">{formatDate(adData.departureDate)}</Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Batas Pengantaran
          </Typography>
          <Typography variant="body1">{formatDate(adData.returnDate)}</Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Berat Tersedia
          </Typography>
          <Typography variant="body1">{adData.availableWeight} KG</Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Harga per KG
          </Typography>
          <Typography variant="body1">
            {adData.pricePerKg} {adData.currency}
          </Typography>
        </Box>

        {adData.additionalNotes && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Catatan Tambahan
            </Typography>
            <Typography variant="body1">{adData.additionalNotes}</Typography>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Biaya Pemasangan Iklan:
          </Typography>
          <Typography variant="h6" color="primary">
            Rp {postingFee.toLocaleString('id-ID')}
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary">
          *Anda akan diarahkan ke halaman pembayaran Stripe setelah mengkonfirmasi
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Batal</Button>
        <Button variant="contained" onClick={onConfirm} color="primary">
          Lanjutkan ke Pembayaran
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdPostingConfirmation;
