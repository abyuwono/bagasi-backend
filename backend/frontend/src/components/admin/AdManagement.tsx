import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Switch,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import { adminApi } from '../../services/api';

interface User {
  _id: string;
  name: string;
  email: string;
  whatsapp: string;
}

interface Ad {
  _id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  active: boolean;
  user: User;
  createdAt: string;
}

interface NewAd {
  title: string;
  description: string;
  price: number;
  location: string;
  userId: string;
}

const AdManagement: React.FC = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isNewAdDialogOpen, setIsNewAdDialogOpen] = useState(false);
  const [newAd, setNewAd] = useState<NewAd>({
    title: '',
    description: '',
    price: 0,
    location: '',
    userId: '',
  });

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
      setAds(ads.map(ad => 
        ad._id === adId ? { ...ad, active } : ad
      ));
    } catch (err) {
      setError('Failed to update ad status');
    }
  };

  const handleNewAdSubmit = async () => {
    try {
      const response = await adminApi.createAd(newAd);
      setAds([...ads, response]);
      setIsNewAdDialogOpen(false);
      setNewAd({
        title: '',
        description: '',
        price: 0,
        location: '',
        userId: '',
      });
    } catch (err) {
      setError('Failed to create new ad');
    }
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ mb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setIsNewAdDialogOpen(true)}
        >
          Create New Ad
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Active</TableCell>
              <TableCell>Created At</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ads.map((ad) => (
              <TableRow key={ad._id}>
                <TableCell>{ad.title}</TableCell>
                <TableCell>{ad.description}</TableCell>
                <TableCell>{ad.price}</TableCell>
                <TableCell>{ad.location}</TableCell>
                <TableCell>{ad.user.name}</TableCell>
                <TableCell>
                  <Switch
                    checked={ad.active}
                    onChange={(e) => handleStatusChange(ad._id, e.target.checked)}
                  />
                </TableCell>
                <TableCell>
                  {new Date(ad.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog 
        open={isNewAdDialogOpen} 
        onClose={() => setIsNewAdDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Ad</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>User</InputLabel>
            <Select
              value={newAd.userId}
              onChange={(e) => setNewAd({ ...newAd, userId: e.target.value })}
            >
              {users.map((user) => (
                <MenuItem key={user._id} value={user._id}>
                  {user.name} ({user.email})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            margin="dense"
            label="Title"
            fullWidth
            value={newAd.title}
            onChange={(e) => setNewAd({ ...newAd, title: e.target.value })}
          />
          
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={4}
            value={newAd.description}
            onChange={(e) => setNewAd({ ...newAd, description: e.target.value })}
          />
          
          <TextField
            margin="dense"
            label="Price"
            type="number"
            fullWidth
            value={newAd.price}
            onChange={(e) => setNewAd({ ...newAd, price: Number(e.target.value) })}
          />
          
          <TextField
            margin="dense"
            label="Location"
            fullWidth
            value={newAd.location}
            onChange={(e) => setNewAd({ ...newAd, location: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsNewAdDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleNewAdSubmit} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdManagement;
