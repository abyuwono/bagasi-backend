export interface User {
  _id: string;
  email: string;
  username: string;
  role: 'traveler' | 'shopper';
  whatsappNumber?: string;
  rating: number;
  totalReviews: number;
  isVerified: boolean;
  membership: {
    type: 'none' | 'shopper';
    expiresAt?: Date;
  };
}

export interface Route {
  from: string;
  to: string;
}

export interface Ad {
  _id: string;
  user: User;
  departureCity: string;
  arrivalCity: string;
  departureDate: string;
  expiresAt: string;
  availableWeight: number;
  pricePerKg: number;
  additionalNotes?: string;
  status: 'active' | 'expired' | 'booked';
}

export interface Booking {
  _id: string;
  ad: Ad;
  user: User;
  weight: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  _id: string;
  user: User;
  type: 'ad_posting' | 'membership';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  stripePaymentIntentId: string;
  membershipDuration?: number;
  createdAt: Date;
  completedAt?: Date;
}
