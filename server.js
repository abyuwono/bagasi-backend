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
    'https://market.bagasi.id',
    'https://bagasi.id',
    'https://www.bagasi.id',
    'https://api.bagasi.id'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Handle raw body for Stripe webhook
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// Handle JSON body for other routes
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

  // Add CSP headers
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self' https://api.bagasi.id; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://m.stripe.network https://m.stripe.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: https://*.stripe.com; " +
    "connect-src 'self' https://api.bagasi.id https://api.stripe.com https://m.stripe.network https://m.stripe.com; " +
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com; " +
    "worker-src 'self' blob:;"
  );

  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader(
    'Permissions-Policy',
    'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=*, usb=()'
  );

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