const bcrypt = require('bcryptjs');

const users = [
  {
    email: 'john@example.com',
    username: 'JohnTraveler',
    password: 'password123',
    role: 'traveler',
    whatsappNumber: '+6281234567890',
    rating: 4.5,
    totalReviews: 15,
    isVerified: true,
    active: true,
    membership: {
      type: 'none'
    }
  },
  {
    email: 'sarah@example.com',
    username: 'SarahShopper',
    password: 'password123',
    role: 'shopper',
    whatsappNumber: '+6281234567891',
    rating: 4.8,
    totalReviews: 42,
    isVerified: true,
    active: true,
    membership: {
      type: 'shopper',
      validUntil: new Date('2024-12-31')
    }
  },
  {
    email: 'mike@example.com',
    username: 'MikeMule',
    password: 'password123',
    role: 'traveler',
    whatsappNumber: '+6281234567892',
    rating: 4.2,
    totalReviews: 8,
    isVerified: true,
    active: true,
    membership: {
      type: 'none'
    }
  },
  {
    email: 'lisa@example.com',
    username: 'LisaTravel',
    password: 'password123',
    role: 'traveler',
    whatsappNumber: '+6281234567893',
    rating: 4.9,
    totalReviews: 25,
    isVerified: true,
    active: true,
    membership: {
      type: 'none'
    }
  },
  {
    email: 'david@example.com',
    username: 'DavidExpress',
    password: 'password123',
    role: 'traveler',
    whatsappNumber: '+6281234567894',
    rating: 4.7,
    totalReviews: 18,
    isVerified: true,
    active: true,
    membership: {
      type: 'none'
    }
  }
];

const ads = [
  {
    departureCity: 'Sydney',
    arrivalCity: 'Jakarta',
    departureDate: new Date('2024-12-25'),
    expiresAt: new Date('2024-12-24'),
    pricePerKg: 15,
    currency: 'AUD',
    availableWeight: 10,
    additionalNotes: 'Christmas Day flight, can carry gifts and non-perishables',
    status: 'active'
  },
  {
    departureCity: 'Melbourne',
    arrivalCity: 'Bali',
    departureDate: new Date('2024-12-30'),
    expiresAt: new Date('2024-12-29'),
    pricePerKg: 18,
    currency: 'AUD',
    availableWeight: 15,
    additionalNotes: 'New Year flight, perfect for holiday packages',
    status: 'active'
  },
  {
    departureCity: 'Brisbane',
    arrivalCity: 'Surabaya',
    departureDate: new Date('2025-01-05'),
    expiresAt: new Date('2025-01-04'),
    pricePerKg: 20,
    currency: 'AUD',
    availableWeight: 12,
    additionalNotes: 'Direct flight, can carry electronics and general items',
    status: 'active'
  },
  {
    departureCity: 'Perth',
    arrivalCity: 'Yogyakarta',
    departureDate: new Date('2025-01-10'),
    expiresAt: new Date('2025-01-09'),
    pricePerKg: 17,
    currency: 'AUD',
    availableWeight: 20,
    additionalNotes: 'Transit in Jakarta, large luggage space available',
    status: 'active'
  },
  {
    departureCity: 'Adelaide',
    arrivalCity: 'Bandung',
    departureDate: new Date('2025-01-15'),
    expiresAt: new Date('2025-01-14'),
    pricePerKg: 19,
    currency: 'AUD',
    availableWeight: 18,
    additionalNotes: 'Transit in Jakarta, all items welcome except fragile',
    status: 'active'
  }
];

const bookings = [
  {
    weight: 3,
    status: 'pending'
  },
  {
    weight: 5,
    status: 'confirmed'
  },
  {
    weight: 2,
    status: 'cancelled'
  }
];

const transactions = [
  {
    type: 'ad_posting',
    amount: 10,
    status: 'completed',
    stripePaymentIntentId: 'pi_mock_1'
  },
  {
    type: 'membership',
    amount: 50,
    status: 'completed',
    stripePaymentIntentId: 'pi_mock_2',
    membershipDuration: 3
  }
];

const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

module.exports = {
  users,
  ads,
  bookings,
  transactions,
  hashPassword
};
