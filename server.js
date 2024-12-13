require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const adRoutes = require('./routes/ads');
const paymentRoutes = require('./routes/payments');

const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://bagasi-frontend.netlify.app',
    'https://www.bagasi-frontend.netlify.app',
    'https://market.bagasi.id/',
    'https://bagasi.id/',
    'https://www.bagasi.id/'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// Security headers
app.use((req, res, next) => {
  const allowedOrigins = [
    'http://localhost:3000',
    'https://bagasi-frontend.netlify.app',
    'https://www.bagasi-frontend.netlify.app',
    'https://market.bagasi.id',
    'https://bagasi.id',
    'https://www.bagasi.id',
    'https://api.bagasi.id'
  ];

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self' https://*.bagasi.id; " +
    "connect-src 'self' https://*.bagasi.id https://api.stripe.com https://m.stripe.network; " +
    "script-src 'self' https://*.bagasi.id https://js.stripe.com 'unsafe-inline' 'unsafe-eval' blob:; " +
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com; " +
    "img-src 'self' data: https: http:; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.bagasi.id; " +
    "font-src 'self' https://fonts.gstatic.com data:; " +
    "worker-src 'self' blob:;"
  );

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    message: 'Internal server error',
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/ads', adRoutes);
app.use('/api/payments', paymentRoutes);

// MongoDB connection with fallback to local
const connectDB = async () => {
  try {
    const mongoOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };
    
    // Try MongoDB Atlas first
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI, mongoOptions);
    console.log('Connected to MongoDB Atlas');
  } catch (err) {
    console.error('MongoDB Atlas connection error:', err);
    try {
      // Fallback to local MongoDB
      console.log('Trying local MongoDB...');
      await mongoose.connect('mongodb://localhost:27017/mule-marketplace', mongoOptions);
      console.log('Connected to local MongoDB');
    } catch (err) {
      console.error('Local MongoDB connection error:', err);
      process.exit(1);
    }
  }
};

connectDB();

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});