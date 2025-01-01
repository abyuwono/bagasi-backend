export const formatPrice = (price: number, currency: 'AUD' | 'IDR' | 'USD' | 'SGD' | 'KRW' = 'IDR'): string => {
  const value = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);

  return `${currency} ${value}`;
};

export const formatCurrency = formatPrice;
