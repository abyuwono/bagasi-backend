import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Paper,
  CircularProgress,
  Alert,
  useTheme
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';

interface Message {
  _id: string;
  sender: {
    _id: string;
    username: string;
  };
  content: string;
  timestamp: string;
  read: boolean;
}

interface ChatRoom {
  _id: string;
  messages: Message[];
  shopper: {
    _id: string;
    username: string;
  };
  traveler: {
    _id: string;
    username: string;
  };
}

interface ChatRoomProps {
  adId: string;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ adId }) => {
  const { user } = useAuth();
  const theme = useTheme();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [chat, setChat] = useState<ChatRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetchChat = async () => {
      try {
        const response = await api.get(`/api/chat/ad/${adId}`);
        setChat(response.data);
        setError('');
      } catch (err) {
        console.error('Error fetching chat:', err);
        setError('Failed to load chat');
      } finally {
        setLoading(false);
      }
    };

    fetchChat();
    const interval = setInterval(fetchChat, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [adId]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat?.messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !chat) return;

    try {
      setSending(true);
      const response = await api.post(`/api/chat/${chat._id}/messages`, {
        content: message.trim()
      });

      setChat(prev => prev ? {
        ...prev,
        messages: [...prev.messages, response.data]
      } : null);
      setMessage('');
    } catch (err: any) {
      console.error('Error sending message:', err);
      if (err.response?.data?.message?.includes('contact information')) {
        toast.error('Messages cannot contain contact information');
      } else {
        toast.error('Failed to send message');
      }
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!chat) {
    return <Alert severity="info">No chat available</Alert>;
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" gutterBottom>
        Chat Room
      </Typography>
      
      <Paper
        sx={{
          flex: 1,
          mb: 2,
          p: 2,
          maxHeight: '500px',
          overflowY: 'auto',
          bgcolor: 'grey.50'
        }}
      >
        {chat.messages.map((msg) => {
          const isOwnMessage = msg.sender._id === user?._id;

          return (
            <Box
              key={msg._id}
              sx={{
                display: 'flex',
                justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                mb: 1
              }}
            >
              <Box
                sx={{
                  maxWidth: '80%',
                  bgcolor: isOwnMessage ? 'primary.main' : 'grey.300',
                  color: isOwnMessage ? 'white' : 'text.primary',
                  borderRadius: 2,
                  p: 1,
                  px: 2
                }}
              >
                <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
                  {msg.sender.username}
                </Typography>
                <Typography variant="body2">{msg.content}</Typography>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    textAlign: 'right',
                    mt: 0.5,
                    opacity: 0.8
                  }}
                >
                  {formatTime(msg.timestamp)}
                </Typography>
              </Box>
            </Box>
          );
        })}
        <div ref={messagesEndRef} />
      </Paper>

      <Box
        component="form"
        onSubmit={handleSendMessage}
        sx={{
          display: 'flex',
          gap: 1
        }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder="Type your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={sending}
        />
        <IconButton
          color="primary"
          type="submit"
          disabled={!message.trim() || sending}
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  );
};

export default ChatRoom;
