import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Box,
  CircularProgress,
  Alert,
  MenuItem,
  InputAdornment,
  Stepper,
  Step,
  StepLabel,
  useTheme
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Helmet } from 'react-helmet-async';
import { formatCurrency } from '../utils/format';
import api from '../services/api';
import { toast } from 'react-toastify';

interface ProductInfo {
  url: string;
  image: string;
  price: number;
  weight: number;
  currency: string;
}

interface FormData {
  productUrl: string;
  productImage: string;
  productPrice: number;
  productPriceIDR: number;
  productWeight: number;
  currency: string;
  shippingAddress: {
    fullAddress: string;
    city: string;
    country: string;
  };
  localCourier: string;
  notes: string;
}

const SUPPORTED_WEBSITES = [
  'amazon.com.au',
  'chemistwarehouse.com.au',
  'ebay.com.au',
  'coles.com.au',
  'woolworths.com.au'
];

const COURIER_OPTIONS = [
  'JNE',
  'J&T Express',
  'SiCepat',
  'AnterAja',
  'ID Express',
  'Ninja Express'
];

const CreateShopperAd: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null);
  const [formData, setFormData] = useState<FormData>({
    productUrl: '',
    productImage: '',
    productPrice: 0,
    productPriceIDR: 0,
    productWeight: 0,
    currency: 'AUD',
    shippingAddress: {
      fullAddress: '',
      city: '',
      country: 'Indonesia'
    },
    localCourier: '',
    notes: ''
  });

  const [calculatedFees, setCalculatedFees] = useState({
    productPrice: 0,
    commission: 0,
    total: 0
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const validateUrl = (url: string) => {
    try {
      const hostname = new URL(url).hostname;
      return SUPPORTED_WEBSITES.some(domain => hostname.includes(domain));
    } catch {
      return false;
    }
  };

  const handleUrlChange = async (url: string) => {
    setFormData(prev => ({ ...prev, productUrl: url }));
    setError('');

    if (!validateUrl(url)) {
      setError('Please enter a valid URL from one of our supported websites');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/api/shopper-ads/scrape', { url });
      const { image, price, weight, currency } = response.data;
      
      setProductInfo({ url, image, price, weight, currency });
      setFormData(prev => ({
        ...prev,
        productImage: image,
        productPrice: price,
        productWeight: weight,
        currency
      }));
    } catch (err) {
      console.error('Error scraping product:', err);
      setError('Failed to fetch product information. Please enter details manually.');
    } finally {
      setLoading(false);
    }
  };

  const calculateFees = async () => {
    try {
      const response = await api.post('/api/shopper-ads/calculate-fees', {
        productPrice: formData.productPrice,
        currency: formData.currency,
        weight: formData.productWeight
      });

      setCalculatedFees(response.data);
    } catch (err) {
      console.error('Error calculating fees:', err);
      toast.error('Failed to calculate fees');
    }
  };

  useEffect(() => {
    if (formData.productPrice && formData.currency && formData.productWeight) {
      calculateFees();
    }
  }, [formData.productPrice, formData.currency, formData.productWeight]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const response = await api.post('/api/shopper-ads', formData);
      toast.success('Ad created successfully!');
      navigate(`/shopper-ads/${response.data._id}`);
    } catch (err) {
      console.error('Error creating ad:', err);
      toast.error('Failed to create ad');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const steps = ['Product Details', 'Shipping Information', 'Review & Submit'];

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Product URL"
                value={formData.productUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                error={!!error}
                helperText={error || 'Enter URL from supported websites'}
                disabled={loading}
              />
            </Grid>

            {loading && (
              <Grid item xs={12}>
                <Box display="flex" justifyContent="center">
                  <CircularProgress />
                </Box>
              </Grid>
            )}

            {productInfo && (
              <>
                <Grid item xs={12}>
                  <Box sx={{ mb: 2 }}>
                    <img
                      src={productInfo.image}
                      alt="Product"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '200px',
                        objectFit: 'contain'
                      }}
                    />
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Price"
                    type="number"
                    value={formData.productPrice}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      productPrice: parseFloat(e.target.value)
                    }))}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          {formData.currency}
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Weight (g)"
                    type="number"
                    value={formData.productWeight}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      productWeight: parseInt(e.target.value)
                    }))}
                  />
                </Grid>
              </>
            )}
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Full Address"
                multiline
                rows={3}
                value={formData.shippingAddress.fullAddress}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  shippingAddress: {
                    ...prev.shippingAddress,
                    fullAddress: e.target.value
                  }
                }))}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="City"
                value={formData.shippingAddress.city}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  shippingAddress: {
                    ...prev.shippingAddress,
                    city: e.target.value
                  }
                }))}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Local Courier"
                value={formData.localCourier}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  localCourier: e.target.value
                }))}
              >
                {COURIER_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Additional Notes"
                multiline
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  notes: e.target.value
                }))}
                helperText="Optional: Add any special instructions or requirements"
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Order Summary
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1">Product Price:</Typography>
                <Typography variant="h6" color="primary">
                  {formatCurrency(calculatedFees.productPrice, 'IDR')}
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1">Commission:</Typography>
                <Typography variant="h6" color="primary">
                  {formatCurrency(calculatedFees.commission, 'IDR')}
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1">Total Amount:</Typography>
                <Typography variant="h6" color="primary">
                  {formatCurrency(calculatedFees.total, 'IDR')}
                </Typography>
              </Box>

              <Alert severity="info" sx={{ mb: 2 }}>
                Please review all details carefully before submitting. You'll be redirected to payment after submission.
              </Alert>
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 0:
        return formData.productUrl && formData.productPrice > 0 && formData.productWeight > 0;
      case 1:
        return formData.shippingAddress.fullAddress && formData.shippingAddress.city && formData.localCourier;
      case 2:
        return true;
      default:
        return false;
    }
  };

  return (
    <>
      <Helmet>
        <title>Create Jastip Request - Bagasi</title>
        <meta
          name="description"
          content="Create a new jastip request on Bagasi. Get help purchasing items from overseas with our trusted travelers."
        />
      </Helmet>

      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Create Jastip Request
          </Typography>

          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <form onSubmit={handleSubmit}>
            {renderStepContent(activeStep)}

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
              <Button
                onClick={handleBack}
                disabled={activeStep === 0}
              >
                Back
              </Button>
              
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  color="primary"
                  type="submit"
                  disabled={loading || !isStepValid(activeStep)}
                >
                  {loading ? <CircularProgress size={24} /> : 'Submit'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={!isStepValid(activeStep)}
                >
                  Next
                </Button>
              )}
            </Box>
          </form>
        </Paper>
      </Container>
    </>
  );
};

export default CreateShopperAd;
