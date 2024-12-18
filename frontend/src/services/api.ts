import axios, { AxiosError } from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
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
      localStorage.removeItem('token');
    }
    
    // For deactivated accounts (403), keep the token and let the app handle it
    if (error.response?.status === 403 && error.response?.data?.message === 'Account is deactivated') {
      return Promise.resolve({
        data: {
          user: {
            ...error.config?.user,
            active: false
          }
        }
      });
    }
    
    return Promise.reject(error);
  }
);

interface RegisterData {
  email: string;
  password: string;
  whatsappNumber: string;
  role: 'traveler' | 'shopper';
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
  logout: () => {
    localStorage.removeItem('token');
    console.log('Token removed on logout');
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
      const response = await api.post('/payments/membership/create-intent', { duration });
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
  getAuthOptions: () => axios.post('/api/admin/auth/generate-auth-options').then(res => res.data),
  verifyAuth: (credential: any) => axios.post('/api/admin/auth/verify', { credential }).then(res => res.data),
  
  // Users
  getUsers: () => axios.get('/api/admin/users').then(res => res.data),
  updateUserStatus: (userId: string, status: { active?: boolean; verified?: boolean }) => 
    axios.patch(`/api/admin/users/${userId}/status`, status).then(res => res.data),
  updateUserWhatsapp: (userId: string, whatsapp: string) => 
    axios.patch(`/api/admin/users/${userId}/whatsapp`, { whatsapp }).then(res => res.data),
  
  // Ads
  getAds: () => axios.get('/api/admin/ads').then(res => res.data),
  updateAdStatus: (adId: string, active: boolean) => 
    axios.patch(`/api/admin/ads/${adId}/status`, { active }).then(res => res.data),
  createAd: (adData: any) => axios.post('/api/admin/ads', adData).then(res => res.data),
};

export default api;
