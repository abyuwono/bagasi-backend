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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
  Alert,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { adminApi } from '../../services/api';

interface User {
  _id: string;
  name: string;
  email: string;
  whatsapp: string;
  active: boolean;
  verified: boolean;
  createdAt: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [whatsappNumber, setWhatsappNumber] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await adminApi.getUsers();
      setUsers(response);
    } catch (err) {
      setError('Failed to fetch users');
    }
  };

  const handleStatusChange = async (userId: string, field: 'active' | 'verified', value: boolean) => {
    try {
      const response = await adminApi.updateUserStatus(userId, { [field]: value });
      setUsers(users.map(user => 
        user._id === userId ? { ...user, [field]: value } : user
      ));
    } catch (err) {
      setError(`Failed to update user ${field}`);
    }
  };

  const handleWhatsappEdit = (user: User) => {
    setEditingUser(user);
    setWhatsappNumber(user.whatsapp);
  };

  const handleWhatsappSave = async () => {
    if (!editingUser) return;

    try {
      const response = await adminApi.updateUserWhatsapp(editingUser._id, whatsappNumber);
      setUsers(users.map(user =>
        user._id === editingUser._id ? { ...user, whatsapp: whatsappNumber } : user
      ));
      setEditingUser(null);
    } catch (err) {
      setError('Failed to update WhatsApp number');
    }
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>WhatsApp</TableCell>
              <TableCell>Active</TableCell>
              <TableCell>Verified</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user._id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.whatsapp}</TableCell>
                <TableCell>
                  <Switch
                    checked={user.active}
                    onChange={(e) => handleStatusChange(user._id, 'active', e.target.checked)}
                  />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={user.verified}
                    onChange={(e) => handleStatusChange(user._id, 'verified', e.target.checked)}
                  />
                </TableCell>
                <TableCell>
                  {new Date(user.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleWhatsappEdit(user)}>
                    <EditIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={!!editingUser} onClose={() => setEditingUser(null)}>
        <DialogTitle>Edit WhatsApp Number</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="WhatsApp Number"
            type="text"
            fullWidth
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingUser(null)}>Cancel</Button>
          <Button onClick={handleWhatsappSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;
