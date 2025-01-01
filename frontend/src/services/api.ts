import axios, { AxiosError } from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important for CORS with credentials
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Response error:', error.config?.url, error.response?.status, error.response?.data);
    
    // Only remove token for 401 unauthorized errors
    if (error.response?.status === 401) {
      console.log('Removing token due to 401 error');
      localStorage.removeItem('token');
    }
    
    // For deactivated accounts (403), clear token
    if (error.response?.status === 403 && error.response?.data?.message?.includes('dinonaktifkan')) {
      console.log('Removing token due to deactivated account');
      localStorage.removeItem('token');
    }
    
    return Promise.reject(error);
  }
);

interface RegisterData {
  email: string;
  password: string;
  whatsappNumber: string;
  role: 'traveler' | 'shopper' | 'admin';
}

interface LoginData {
  email: string;
  password: string;
}

export const auth = {
  register: async (data: RegisterData) => {
    try {
      console.log('Registering user...');
      const response = await api.post('/auth/register', data);
      console.log('Registration response:', response.data);
      const { token, user } = response.data;
      if (token) {
        localStorage.setItem('token', token);
        console.log('Token stored after registration');
      }
      return response.data;
    } catch (error: any) {
      console.error('Registration error:', error.response?.data || error);
      throw error;
    }
  },
  login: async (data: LoginData) => {
    try {
      console.log('Logging in...');
      const response = await api.post('/auth/login', data);
      console.log('Login response:', response.data);
      
      // Check if user is active before storing token
      if (response.data.user && response.data.user.active === false) {
        localStorage.removeItem('token');
        throw new Error('Account is deactivated');
      }
      
      const { token, user } = response.data;
      if (token) {
        localStorage.setItem('token', token);
        console.log('Token stored after login:', token);
      }
      return response.data;
    } catch (error: any) {
      console.error('Login error:', error.response?.data || error);
      throw error;
    }
  },
  checkAuth: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found in checkAuth');
        throw new Error('No token found');
      }
      const response = await api.get('/auth/me');
      
      // Return user data regardless of active status
      return response.data;
    } catch (error: any) {
      console.error('Auth check error:', error.response?.status, error.response?.data);
      // Only remove token for 401 unauthorized errors
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
      }
      throw error;
    }
  },
  logout: async () => {
    try {
      // Remove token first to prevent 401 errors
      localStorage.removeItem('token');
      console.log('Token removed on logout');
      
      // Call logout endpoint to cleanup session
      await api.post('auth/logout');
    } catch (error) {
      // Log error but don't throw since token is already removed
      console.error('Logout error:', error);
    }
  },
};

export const ads = {
  getAll: async () => {
    const response = await api.get('/ads');
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/ads/${id}`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post('/ads', data);
    return response.data;
  },
  book: async (id: string, data: any) => {
    const response = await api.post(`/ads/${id}/book`, data);
    return response.data;
  },
  updateStatus: async (id: string, status: string) => {
    const response = await api.patch(`/ads/${id}/status`, { status });
    return response.data;
  },
};

export const payments = {
  createPaymentIntent: async (amount: number) => {
    try {
      const response = await api.post('/payments/create-payment-intent', { amount });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  createAdPostingIntent: async () => {
    try {
      const response = await api.post('/payments/create-ad-posting-intent');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  createMembershipIntent: async (duration: number) => {
    try {
      // First check auth status
      const authResponse = await api.get('/auth/me');
      if (!authResponse.data.user || authResponse.data.user.active === false) {
        throw new Error('Account is deactivated');
      }

      // If auth check passes, create payment intent
      const response = await api.post('/payments/create-membership-intent', { duration });
      return response.data;
    } catch (error: any) {
      console.error('Create membership intent error:', error.response?.data || error.message);
      
      if (error.response?.status === 403 && (
        error.response?.data?.message === 'Account is deactivated' ||
        error.message === 'Account is deactivated'
      )) {
        localStorage.removeItem('token');
        throw new Error('Akun Anda belum aktif. Silakan hubungi admin untuk mengaktifkan akun.');
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('token');
        throw new Error('Sesi Anda telah berakhir. Silakan login kembali.');
      }
      
      throw new Error(error.response?.data?.message || error.message || 'Terjadi kesalahan saat memproses pembayaran');
    }
  },
  getMembershipPrice: async () => {
    try {
      const response = await api.get('/payments/membership-price');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export const profile = {
  getProfile: async (userId: string) => {
    const response = await api.get(`/profile/${userId}`);
    return response.data;
  },
  addReview: async (userId: string, data: { rating: number; comment: string }) => {
    const response = await api.post(`/profile/${userId}/reviews`, data);
    return response.data;
  }
};

export const adminApi = {
  // Auth
  login: (data: { username: string; password: string }) => {
    console.log('Attempting login with:', { username: data.username }); // Log for debugging
    return api.post('/admin/auth/login', data).then(res => {
      console.log('Login response:', res.data); // Log for debugging
      return res.data;
    });
  },
  // Users
  getUsers: () => {
    const token = localStorage.getItem('token');
    return api.get('/admin/users', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.data);
  },
  updateUserStatus: (userId: string, status: { active?: boolean; verified?: boolean }) => {
    const token = localStorage.getItem('token');
    return api.patch(`/admin/users/${userId}/status`, status, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.data);
  },
  updateUserWhatsapp: (userId: string, data: { whatsappNumber: string }) => {
    const token = localStorage.getItem('token');
    return api.patch(`/admin/users/${userId}/whatsapp`, data, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.data);
  },
  toggleUserActive: (userId: string) => {
    const token = localStorage.getItem('token');
    return api.post(`/admin/users/${userId}/toggle-active`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.data);
  },
  toggleUserVerification: (userId: string) => {
    const token = localStorage.getItem('token');
    return api.post(`/admin/users/${userId}/toggle-verification`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.data);
  },
  // Ads
  getAds: () => {
    const token = localStorage.getItem('token');
    return api.get('/admin/ads', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.data);
  },
  updateAdStatus: async (adId: string, active: boolean) => {
    try {
      const response = await api.patch(`/admin/ads/${adId}/status`, { active });
      return response.data;
    } catch (error) {
      console.error('Failed to update ad status:', error);
      throw error;
    }
  },
  updateAd: async (adId: string, data: any) => {
    const response = await api.put(`/admin/ads/${adId}`, data);
    return response.data;
  },
  createAd: (adData: any) => {
    const token = localStorage.getItem('token');
    return api.post('/admin/ads', adData, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.data);
  }
};

export default api;
