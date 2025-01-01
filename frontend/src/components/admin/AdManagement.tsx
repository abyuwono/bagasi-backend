import React, { useState, useEffect } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  ButtonGroup,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { adminApi } from '../../services/api';
import { toast } from 'react-toastify';

interface CityOption {
  value: string;
  label: string;
  disabled?: boolean;
}

const AUSTRALIAN_CITIES: CityOption[] = [
  { value: 'divider-au', label: '--- Australia ---', disabled: true },
  { value: 'sydney', label: 'Sydney' },
  { value: 'melbourne', label: 'Melbourne' },
  { value: 'brisbane', label: 'Brisbane' },
  { value: 'perth', label: 'Perth' },
  { value: 'adelaide', label: 'Adelaide' },
  { value: 'goldcoast', label: 'Gold Coast' },
  { value: 'canberra', label: 'Canberra' },
  { value: 'newcastle', label: 'Newcastle' },
  { value: 'wollongong', label: 'Wollongong' },
  { value: 'hobart', label: 'Hobart' },
  { value: 'darwin', label: 'Darwin' }
];

const INDONESIAN_CITIES: CityOption[] = [
  { value: 'divider-id', label: '--- Indonesia ---', disabled: true },
  { value: 'jakarta', label: 'Jakarta' },
  { value: 'surabaya', label: 'Surabaya' },
  { value: 'medan', label: 'Medan' },
  { value: 'bandung', label: 'Bandung' },
  { value: 'semarang', label: 'Semarang' },
  { value: 'makassar', label: 'Makassar' },
  { value: 'palembang', label: 'Palembang' },
  { value: 'tangerang', label: 'Tangerang' },
  { value: 'depok', label: 'Depok' },
  { value: 'yogyakarta', label: 'Yogyakarta' },
  { value: 'denpasar', label: 'Denpasar' }
];

const ALL_CITIES: CityOption[] = [
  { value: 'divider-au', label: '--- Australia ---', disabled: true },
  { value: 'sydney', label: 'Sydney' },
  { value: 'melbourne', label: 'Melbourne' },
  { value: 'brisbane', label: 'Brisbane' },
  { value: 'perth', label: 'Perth' },
  { value: 'adelaide', label: 'Adelaide' },
  { value: 'goldcoast', label: 'Gold Coast' },
  { value: 'canberra', label: 'Canberra' },
  { value: 'newcastle', label: 'Newcastle' },
  { value: 'wollongong', label: 'Wollongong' },
  { value: 'hobart', label: 'Hobart' },
  { value: 'darwin', label: 'Darwin' },
  { value: 'divider-id', label: '--- Indonesia ---', disabled: true },
  { value: 'jakarta', label: 'Jakarta' },
  { value: 'surabaya', label: 'Surabaya' },
  { value: 'medan', label: 'Medan' },
  { value: 'bandung', label: 'Bandung' },
  { value: 'semarang', label: 'Semarang' },
  { value: 'makassar', label: 'Makassar' },
  { value: 'palembang', label: 'Palembang' },
  { value: 'tangerang', label: 'Tangerang' },
  { value: 'depok', label: 'Depok' },
  { value: 'yogyakarta', label: 'Yogyakarta' },
  { value: 'denpasar', label: 'Denpasar' }
];

const CURRENCIES = [
  { code: 'AUD', label: 'Dollar Australia (AUD)' },
  { code: 'IDR', label: 'Rupiah Indonesia (IDR)' },
  { code: 'USD', label: 'Dollar Amerika (USD)' },
  { code: 'SGD', label: 'Dollar Singapura (SGD)' },
  { code: 'KRW', label: 'Won Korea (KRW)' },
];

interface User {
  _id: string;
  name: string;
  email: string;
  whatsapp: string;
}

interface Ad {
  _id: string;
  departureCity: string;
  arrivalCity: string;
  departureDate: string;
  expiresAt: string;
  availableWeight: number;
  pricePerKg: number;
  currency: string;
  additionalNotes?: string;
  active: boolean;
  user?: User;
  createdAt: string;
  status: string;
  customDisplayName?: string;
  customRating?: number;
  customWhatsapp?: string;
  whatsappMessageCount: number;
  lastWhatsappMessageSent?: string;
}

interface NewAd {
  departureCity: CityOption | null;
  arrivalCity: CityOption | null;
  departureDate: string;
  expiresAt: string;
  availableWeight: number;
  pricePerKg: number;
  currency: string;
  additionalNotes?: string;
  userId: string;
  customDisplayName?: string;
  customRating?: number;
  customWhatsapp?: string;
}

interface AdNotesDialogProps {
  open: boolean;
  onClose: () => void;
  ad: any;
  onSave: (notes: string) => void;
}

interface AdWhatsAppDialogProps {
  open: boolean;
  onClose: () => void;
  ad: Ad;
  onSave: (whatsapp: string | undefined) => void;
}

interface WhatsAppDialogProps {
  open: boolean;
  message: string;
  loading: boolean;
  onClose: () => void;
  onSend: (message: string) => void;
  onMessageChange: (message: string) => void;
}

const AdNotesDialog: React.FC<AdNotesDialogProps> = ({ open, onClose, ad, onSave }) => {
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (ad) {
      setNotes(ad.additionalNotes || '');
    }
  }, [ad]);

  const handleSave = () => {
    onSave(notes);
    onClose();
  };

  const handleFormat = (format: 'bold' | 'italic') => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString();
    if (!selectedText) return;

    let formattedText = selectedText;
    if (format === 'bold') {
      formattedText = `**${selectedText}**`;
    } else if (format === 'italic') {
      formattedText = `*${selectedText}*`;
    }

    const newText = notes.substring(0, range.startOffset) + 
                   formattedText + 
                   notes.substring(range.endOffset);
    setNotes(newText);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Additional Notes</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <ButtonGroup variant="outlined" size="small">
            <Button 
              onClick={() => handleFormat('bold')}
            >
              <b>B</b>
            </Button>
            <Button 
              onClick={() => handleFormat('italic')}
            >
              <i>I</i>
            </Button>
          </ButtonGroup>
        </Box>
        <TextField
          multiline
          rows={6}
          fullWidth
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Enter additional notes..."
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  );
};

const AdWhatsAppDialog: React.FC<AdWhatsAppDialogProps> = ({ open, onClose, ad, onSave }) => {
  const [whatsapp, setWhatsapp] = useState('');

  useEffect(() => {
    if (ad) {
      setWhatsapp(ad.customWhatsapp || '');
    }
  }, [ad]);

  const handleSave = () => {
    onSave(whatsapp || undefined);
    onClose();
  };

  const handleDelete = () => {
    onSave(undefined);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Custom WhatsApp Number</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <TextField
            label="Custom WhatsApp Number"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            fullWidth
            placeholder="Enter custom WhatsApp number"
            helperText="Leave empty to use user's actual WhatsApp number"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleDelete} color="error">
          Delete Custom WhatsApp
        </Button>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const WhatsAppDialog: React.FC<WhatsAppDialogProps> = ({ open, message, loading, onClose, onSend, onMessageChange }) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Send WhatsApp Message</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Edit the message below if needed:
        </DialogContentText>
        <TextField
          autoFocus
          margin="dense"
          fullWidth
          multiline
          rows={4}
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          disabled={loading}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button 
          onClick={() => onSend(message)} 
          variant="contained" 
          color="primary"
          disabled={loading}
        >
          {loading ? (
            <>
              <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
              Sending...
            </>
          ) : (
            'Send'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const getDefaultDates = () => {
  const today = new Date();
  const flightDate = new Date(today);
  flightDate.setDate(today.getDate() + 21);
  const lastDropDate = new Date(flightDate);
  lastDropDate.setDate(flightDate.getDate() - 3);
  
  return {
    flightDate: flightDate.toISOString().split('T')[0],
    lastDropDate: lastDropDate.toISOString().split('T')[0],
  };
};

const formatTimestamp = (date: string | undefined) => {
  if (!date) return '';
  return new Date(date).toLocaleString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Jakarta'
  }).replace(',', '') + ' WIB';
};

const AdManagement: React.FC = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isNewAdDialogOpen, setIsNewAdDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { flightDate, lastDropDate } = getDefaultDates();
  const [newAd, setNewAd] = useState<NewAd>({
    departureCity: null,
    arrivalCity: null,
    departureDate: flightDate,
    expiresAt: lastDropDate,
    availableWeight: 0,
    pricePerKg: 0,
    currency: 'IDR',
    additionalNotes: '',
    userId: '',
    customDisplayName: '',
    customRating: undefined,
    customWhatsapp: undefined,
  });
  const [selectedAd, setSelectedAd] = useState<any>(null);
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);
  const [isWhatsAppDialogOpen, setIsWhatsAppDialogOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchAds();
    fetchUsers();
  }, []);

  const fetchAds = async () => {
    try {
      const response = await adminApi.getAds();
      setAds(response);
    } catch (err) {
      setError('Failed to fetch ads');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await adminApi.getUsers();
      setUsers(response);
    } catch (err) {
      setError('Failed to fetch users');
    }
  };

  const handleStatusChange = async (adId: string, active: boolean) => {
    try {
      const response = await adminApi.updateAdStatus(adId, active);
      if (response.error) {
        setError(response.error);
        // Refresh ads to get current state
        fetchAds();
        return;
      }
      setAds(ads.map(ad => 
        ad._id === adId ? { ...ad, active: response.active, status: response.status } : ad
      ));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update ad status');
      // Refresh ads to get current state
      fetchAds();
    }
  };

  const isAdExpired = (ad: Ad) => {
    const now = new Date();
    return new Date(ad.expiresAt) <= now;
  };

  const getAdStatus = (ad: Ad) => {
    if (isAdExpired(ad)) return 'Expired';
    return ad.status === 'active' ? 'Active' : 'Inactive';
  };

  const getStatusColor = (ad: Ad) => {
    if (isAdExpired(ad)) return 'error';
    return ad.status === 'active' ? 'success' : 'default';
  };

  const handleCreateAd = async () => {
    try {
      setLoading(true);
      const adData = {
        ...newAd,
        departureCity: newAd.departureCity?.label || '',
        arrivalCity: newAd.arrivalCity?.label || '',
      };
      await adminApi.createAd(adData);
      setIsNewAdDialogOpen(false);
      fetchAds();
      setNewAd({
        departureCity: null,
        arrivalCity: null,
        departureDate: flightDate,
        expiresAt: lastDropDate,
        availableWeight: 0,
        pricePerKg: 0,
        currency: 'AUD',
        additionalNotes: '',
        userId: '',
        customDisplayName: '',
        customRating: undefined,
        customWhatsapp: undefined,
      });
    } catch (error) {
      console.error('Error creating ad:', error);
      setError('Failed to create ad');
    } finally {
      setLoading(false);
    }
  };

  const handleEditNotes = (ad: any) => {
    setSelectedAd(ad);
    setIsNotesDialogOpen(true);
  };

  const handleSaveNotes = async (notes: string) => {
    try {
      await adminApi.updateAd(selectedAd._id, { additionalNotes: notes });
      fetchAds();
    } catch (error) {
      console.error('Error updating notes:', error);
      setError('Failed to update notes');
    }
  };

  const handleEditWhatsApp = (ad: Ad) => {
    setSelectedAd(ad);
    setIsWhatsAppDialogOpen(true);
  };

  const handleSaveWhatsApp = async (whatsapp: string | undefined) => {
    try {
      await adminApi.updateAd(selectedAd._id, { customWhatsapp: whatsapp });
      fetchAds();
    } catch (error) {
      console.error('Error updating WhatsApp:', error);
      setError('Failed to update WhatsApp number');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const generateMessage = (ad: any) => {
    const randomNumber = Math.floor(Math.random() * 6) + 3; // Random number between 3-8
    return `Hi ${ad.customDisplayName}, iklan jastip bagasi kamu ${ad.departureCity} - ${ad.arrivalCity} tanggal ${formatDate(ad.departureDate)} telah berhasil dilisting di Bagasi.ID. Ada ${randomNumber} orang tertarik untuk menggunakan jastip Bagasi kamu.\n\nLangsung saja lihat di https://www.bagasi.id`;
  };

  const handleSendClick = (ad: any) => {
    setSelectedAd(ad);
    setMessage(generateMessage(ad));
    setDialogOpen(true);
  };

  const handleSendMessage = async (finalMessage: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/send-whatsapp-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          toNumber: selectedAd.customWhatsapp,
          message: finalMessage,
          adId: selectedAd._id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to send message');
      }

      const data = await response.json();
      
      // Update the ads list with new message count and timestamp
      setAds(ads.map(ad => 
        ad._id === selectedAd._id 
          ? { 
              ...ad, 
              whatsappMessageCount: data.whatsappMessageCount || 0,
              lastWhatsappMessageSent: data.lastWhatsappMessageSent 
            } 
          : ad
      ));

      toast.success('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setLoading(false);
      setDialogOpen(false);
      setSelectedAd(null);
      setMessage('');
    }
  };

  return (
    <Box>
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}
      
      <Button
        variant="contained"
        onClick={() => setIsNewAdDialogOpen(true)}
        sx={{ mb: 2 }}
      >
        Create New Ad
      </Button>

      <Dialog 
        open={isNewAdDialogOpen} 
        onClose={() => setIsNewAdDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Ad</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Autocomplete
              options={users}
              getOptionLabel={(option) => `${option.name} (${option.email})`}
              onChange={(_, value) => setNewAd({ ...newAd, userId: value?._id || '' })}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select User"
                  required
                  fullWidth
                  margin="normal"
                />
              )}
            />

            <TextField
              label="Custom Display Name (Optional)"
              value={newAd.customDisplayName || ''}
              onChange={(e) => setNewAd({ ...newAd, customDisplayName: e.target.value })}
              helperText="Leave empty to use user's actual name"
              fullWidth
              margin="normal"
            />

            <TextField
              label="Custom Rating (Optional)"
              type="number"
              inputProps={{ min: 0, max: 5, step: 0.1 }}
              value={newAd.customRating || ''}
              onChange={(e) => setNewAd({ ...newAd, customRating: Number(e.target.value) || undefined })}
              helperText="Leave empty to use user's actual rating"
              fullWidth
              margin="normal"
            />

            <TextField
              label="Custom WhatsApp (Optional)"
              value={newAd.customWhatsapp || ''}
              onChange={(e) => setNewAd({ ...newAd, customWhatsapp: e.target.value || undefined })}
              helperText="Leave empty to use user's actual WhatsApp"
              fullWidth
              margin="normal"
            />

            <Autocomplete
              options={ALL_CITIES}
              value={newAd.departureCity}
              onChange={(_, value) => setNewAd({ ...newAd, departureCity: value })}
              getOptionDisabled={(option) => !!option.disabled}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Departure City"
                  required
                />
              )}
            />

            <Autocomplete
              options={ALL_CITIES}
              value={newAd.arrivalCity}
              onChange={(_, value) => setNewAd({ ...newAd, arrivalCity: value })}
              getOptionDisabled={(option) => !!option.disabled}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Arrival City"
                  required
                />
              )}
            />

            <TextField
              label="Flight Date"
              type="date"
              value={newAd.departureDate}
              onChange={(e) => setNewAd({ ...newAd, departureDate: e.target.value })}
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Expires At"
              type="date"
              value={newAd.expiresAt}
              onChange={(e) => setNewAd({ ...newAd, expiresAt: e.target.value })}
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Available Weight (KG)"
              type="number"
              value={newAd.availableWeight}
              onChange={(e) => setNewAd({ ...newAd, availableWeight: Number(e.target.value) })}
              fullWidth
              margin="normal"
              inputProps={{ min: 0, max: 32 }}
            />

            <TextField
              label="Price per KG"
              type="number"
              value={newAd.pricePerKg}
              onChange={(e) => setNewAd({ ...newAd, pricePerKg: Number(e.target.value) })}
              fullWidth
              margin="normal"
              inputProps={{ min: 0 }}
            />

            <FormControl fullWidth margin="normal">
              <InputLabel>Currency</InputLabel>
              <Select
                value={newAd.currency}
                onChange={(e) => setNewAd({ ...newAd, currency: e.target.value })}
                label="Currency"
              >
                {CURRENCIES.map((currency) => (
                  <MenuItem key={currency.code} value={currency.code}>
                    {currency.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Additional Notes"
              multiline
              rows={4}
              value={newAd.additionalNotes}
              onChange={(e) => setNewAd({ ...newAd, additionalNotes: e.target.value })}
              fullWidth
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsNewAdDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateAd} variant="contained" disabled={loading}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>WhatsApp</TableCell>
              <TableCell>Custom WhatsApp</TableCell>
              <TableCell>From</TableCell>
              <TableCell>To</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Weight</TableCell>
              <TableCell>Price/kg</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ads.map((ad) => (
              <TableRow key={ad._id}>
                <TableCell>
                  {ad.customDisplayName || ad.user?.name || ad.user?.email}
                  {ad.customRating !== undefined && (
                    <Typography variant="caption" color="textSecondary" display="block">
                      Rating: {ad.customRating}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>{ad.user?.whatsapp || '-'}</TableCell>
                <TableCell>
                  {ad.customWhatsapp || '-'}
                  <Box>
                    <Button
                      size="small"
                      onClick={() => handleEditWhatsApp(ad)}
                      sx={{ ml: 1 }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      color="primary"
                      onClick={() => handleSendClick(ad)}
                      sx={{ ml: 1 }}
                    >
                      SEND {(ad.whatsappMessageCount || 0) > 0 && `(${ad.whatsappMessageCount || 0})`}
                    </Button>
                    {ad.lastWhatsappMessageSent && (
                      <Typography variant="caption" display="block" color="text.secondary">
                        {formatTimestamp(ad.lastWhatsappMessageSent)}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>{ad.departureCity}</TableCell>
                <TableCell>{ad.arrivalCity}</TableCell>
                <TableCell>
                  {new Date(ad.departureDate).toLocaleDateString()}
                </TableCell>
                <TableCell>{ad.availableWeight} kg</TableCell>
                <TableCell>
                  {ad.currency} {ad.pricePerKg}
                </TableCell>
                <TableCell>
                  <Switch
                    checked={!isAdExpired(ad) && ad.status === 'active'}
                    onChange={(e) => handleStatusChange(ad._id, e.target.checked)}
                    disabled={isAdExpired(ad)}
                    color={getStatusColor(ad)}
                  />
                  {getAdStatus(ad)}
                </TableCell>
                <TableCell>
                  <Button
                    size="small"
                    onClick={() => handleEditNotes(ad)}
                  >
                    Edit Notes
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <AdNotesDialog
        open={isNotesDialogOpen && selectedAd !== null}
        onClose={() => setIsNotesDialogOpen(false)}
        ad={selectedAd}
        onSave={handleSaveNotes}
      />

      <AdWhatsAppDialog
        open={isWhatsAppDialogOpen && selectedAd !== null}
        onClose={() => setIsWhatsAppDialogOpen(false)}
        ad={selectedAd}
        onSave={handleSaveWhatsApp}
      />

      <WhatsAppDialog
        open={dialogOpen}
        message={message}
        loading={loading}
        onClose={() => !loading && setDialogOpen(false)}
        onSend={handleSendMessage}
        onMessageChange={setMessage}
      />
    </Box>
  );
};

export default AdManagement;
