const bcrypt = require('bcryptjs');

const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

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
    membership: {
      type: 'shopper',
      expiresAt: new Date('2024-12-31')
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
    membership: {
      type: 'none'
    }
  }
];

// Helper function to create dates relative to current time
const createDate = (daysFromNow) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date;
};

const ads = [
  {
    departureCity: 'Jakarta',
    arrivalCity: 'Singapore',
    departureDate: createDate(5),
    returnDate: createDate(7),
    availableWeight: 15,
    pricePerKg: 150000,
    additionalNotes: 'Direct flight. Can carry food items and electronics.',
    status: 'active',
    currency: 'IDR',
    airline: 'Singapore Airlines',
    flightNumber: 'SQ953',
    departureTime: '08:00',
    expiresAt: createDate(4)
  },
  {
    departureCity: 'Surabaya',
    arrivalCity: 'Kuala Lumpur',
    departureDate: createDate(3),
    returnDate: createDate(6),
    availableWeight: 20,
    pricePerKg: 120000,
    additionalNotes: 'No liquids or fragile items.',
    status: 'active',
    currency: 'IDR',
    airline: 'AirAsia',
    flightNumber: 'AK365',
    departureTime: '10:30',
    expiresAt: createDate(2)
  },
  {
    departureCity: 'Bali',
    arrivalCity: 'Singapore',
    departureDate: createDate(7),
    returnDate: createDate(10),
    availableWeight: 25,
    pricePerKg: 180000,
    additionalNotes: 'Can carry all types of items except perishables.',
    status: 'active',
    currency: 'IDR',
    airline: 'Garuda Indonesia',
    flightNumber: 'GA846',
    departureTime: '13:45',
    expiresAt: createDate(6)
  },
  {
    departureCity: 'Medan',
    arrivalCity: 'Kuala Lumpur',
    departureDate: createDate(4),
    returnDate: createDate(8),
    availableWeight: 10,
    pricePerKg: 140000,
    additionalNotes: 'Small items only. No food items.',
    status: 'active',
    currency: 'IDR',
    airline: 'Malaysia Airlines',
    flightNumber: 'MH860',
    departureTime: '15:20',
    expiresAt: createDate(3)
  }
];

const bookings = [
  {
    weight: 8,
    totalPrice: 960000,
    status: 'confirmed',
    notes: 'Please handle with care',
    createdAt: new Date(),
  }
];

const transactions = [
  {
    type: 'membership',
    amount: 299000,
    status: 'completed',
    createdAt: new Date(),
    stripePaymentIntentId: 'pi_mock_1234567890',
    membershipDuration: 30
  }
];

module.exports = {
  users,
  ads,
  bookings,
  transactions,
  hashPassword
};
