import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  IconButton,
  Badge,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Divider,
  Button,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Menu,
  MenuItem,
  useTheme
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  ShoppingCart,
  Message,
  Star,
  AttachMoney,
  Info,
  MoreVert,
  Delete,
  DoneAll
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  priority: string;
  createdAt: string;
  relatedId?: string;
  relatedType?: string;
}

const NotificationCenter: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  // States
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Effects
  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open, activeTab]);

  useEffect(() => {
    // Set up push notifications
    setupPushNotifications();
    // Poll for unread count
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Push notification setup
  const setupPushNotifications = async () => {
    try {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.register('/sw.js');
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.REACT_APP_VAPID_PUBLIC_KEY
        });

        await api.post('/api/notifications/push-subscription', {
          subscription
        });
      }
    } catch (error) {
      console.error('Error setting up push notifications:', error);
    }
  };

  // Data fetching
  const fetchNotifications = async (refresh = true) => {
    try {
      setLoading(true);
      const currentPage = refresh ? 1 : page;
      const filter = activeTab === 1 ? { read: true } : activeTab === 2 ? { read: false } : {};

      const response = await api.get('/api/notifications', {
        params: {
          page: currentPage,
          ...filter
        }
      });

      const { notifications: newNotifications, total, pages } = response.data;

      setNotifications(currentPage === 1 ? newNotifications : [...notifications, ...newNotifications]);
      setHasMore(currentPage < pages);
      setPage(currentPage + 1);
      setError('');
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/api/notifications/unread');
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Action handlers
  const handleNotificationClick = async (notification: Notification) => {
    try {
      if (!notification.read) {
        await api.post('/api/notifications/read', {
          notificationIds: [notification._id]
        });
        setUnreadCount(Math.max(0, unreadCount - 1));
        setNotifications(
          notifications.map(n =>
            n._id === notification._id ? { ...n, read: true } : n
          )
        );
      }

      // Navigate based on notification type
      if (notification.relatedType === 'ad') {
        navigate(`/ads/${notification.relatedId}`);
      } else if (notification.relatedType === 'chat') {
        navigate(`/chat/${notification.relatedId}`);
      } else if (notification.relatedType === 'review') {
        navigate(`/reviews/${notification.relatedId}`);
      }

      setOpen(false);
    } catch (error) {
      console.error('Error handling notification click:', error);
      toast.error('Failed to process notification');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const unreadIds = notifications
        .filter(n => !n.read)
        .map(n => n._id);

      if (unreadIds.length === 0) return;

      await api.post('/api/notifications/read', {
        notificationIds: unreadIds
      });

      setNotifications(
        notifications.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark notifications as read');
    }
  };

  const handleDeleteSelected = async () => {
    try {
      await api.delete('/api/notifications', {
        data: { notificationIds: selectedNotifications }
      });

      setNotifications(
        notifications.filter(n => !selectedNotifications.includes(n._id))
      );
      setSelectedNotifications([]);
      toast.success('Selected notifications deleted');
    } catch (error) {
      console.error('Error deleting notifications:', error);
      toast.error('Failed to delete notifications');
    }
  };

  // Render helpers
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ad_status':
        return <ShoppingCart color="primary" />;
      case 'new_message':
        return <Message color="info" />;
      case 'new_review':
        return <Star color="warning" />;
      case 'payment':
        return <AttachMoney color="success" />;
      default:
        return <Info color="action" />;
    }
  };

  return (
    <>
      <IconButton color="inherit" onClick={() => setOpen(true)}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: { width: { xs: '100%', sm: 400 } }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography variant="h6">Notifications</Typography>
            <Box>
              <IconButton
                onClick={(e) => setMenuAnchor(e.currentTarget)}
                disabled={notifications.length === 0}
              >
                <MoreVert />
              </IconButton>
            </Box>
          </Box>

          <Tabs
            value={activeTab}
            onChange={(_, value) => {
              setActiveTab(value);
              setPage(1);
              setSelectedNotifications([]);
            }}
            sx={{ mb: 2 }}
          >
            <Tab label="All" />
            <Tab label="Read" />
            <Tab label="Unread" />
          </Tabs>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {loading && notifications.length === 0 ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : notifications.length === 0 ? (
            <Box textAlign="center" py={3}>
              <Typography color="textSecondary">
                No notifications to display
              </Typography>
            </Box>
          ) : (
            <>
              <List>
                {notifications.map((notification) => (
                  <React.Fragment key={notification._id}>
                    <ListItem
                      button
                      onClick={() => handleNotificationClick(notification)}
                      selected={selectedNotifications.includes(notification._id)}
                      sx={{
                        bgcolor: notification.read
                          ? 'transparent'
                          : theme.palette.action.hover
                      }}
                    >
                      <ListItemIcon>
                        {getNotificationIcon(notification.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={notification.title}
                        secondary={
                          <>
                            {notification.message}
                            <br />
                            <Typography
                              variant="caption"
                              color="textSecondary"
                            >
                              {formatDistanceToNow(
                                new Date(notification.createdAt),
                                { addSuffix: true }
                              )}
                            </Typography>
                          </>
                        }
                      />
                      <ListItemSecondaryAction>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>

              {hasMore && (
                <Box textAlign="center" py={2}>
                  <Button
                    onClick={() => fetchNotifications(false)}
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Load More'}
                  </Button>
                </Box>
              )}
            </>
          )}
        </Box>

        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={() => setMenuAnchor(null)}
        >
          <MenuItem
            onClick={() => {
              handleMarkAllRead();
              setMenuAnchor(null);
            }}
            disabled={!notifications.some(n => !n.read)}
          >
            <ListItemIcon>
              <DoneAll fontSize="small" />
            </ListItemIcon>
            <ListItemText>Mark all as read</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={() => {
              handleDeleteSelected();
              setMenuAnchor(null);
            }}
            disabled={selectedNotifications.length === 0}
          >
            <ListItemIcon>
              <Delete fontSize="small" />
            </ListItemIcon>
            <ListItemText>Delete selected</ListItemText>
          </MenuItem>
        </Menu>
      </Drawer>
    </>
  );
};

export default NotificationCenter;
