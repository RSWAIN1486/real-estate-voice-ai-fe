import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Typography,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Paper,
  Container,
  Grid,
  TextField,
  Alert,
  Stepper,
  Step,
  StepLabel,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  ShoppingCart as CartIcon,
} from '@mui/icons-material';
import { RootState } from '../../store/store';
import { removeItem, updateQuantity, clearOrder } from '../../store/slices/orderSlice';
import { formatPrice, calculateTotalWithTax } from '../../utils/reusableFns';
import styles from './Cart.module.css';
import { getUserAddresses } from '../../services/userService';

const steps = ['Cart', 'Delivery Details', 'Payment', 'Confirmation'];

const Cart: React.FC = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { items, total } = useSelector((state: RootState) => state.order);
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [activeStep, setActiveStep] = useState(0);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    address: '',
    paymentMethod: 'cash',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState('');

  const { total: totalWithTax, tax } = calculateTotalWithTax(total);

  useEffect(() => {
    const fetchSavedAddress = async () => {
      if (isAuthenticated && activeStep === 1) {
        try {
          // Set user's name from Redux store
          if (user?.name) {
            setCustomerInfo(prev => ({
              ...prev,
              name: user.name
            }));
          }

          const savedAddress = await getUserAddresses();
          if (savedAddress) {
            setCustomerInfo(prev => ({
              ...prev,
              address: savedAddress.street + (savedAddress.landmark ? `, ${savedAddress.landmark}` : '') + 
                      `, ${savedAddress.city}, ${savedAddress.state} - ${savedAddress.zipCode}`,
              phone: savedAddress.phone || ''
            }));
          }
        } catch (error) {
          console.error('Error fetching saved address:', error);
        }
      }
    };

    fetchSavedAddress();
  }, [isAuthenticated, activeStep, user?.name]);

  const handleRemoveItem = (id: string) => {
    dispatch(removeItem(id));
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    if (quantity > 0) {
      dispatch(updateQuantity({ id, quantity }));
    } else {
      dispatch(removeItem(id));
    }
  };

  const handleNext = () => {
    if (activeStep === 0 && items.length === 0) {
      return;
    }

    if (activeStep === 1) {
      // Validate customer info
      const newErrors: Record<string, string> = {};
      if (!customerInfo.name.trim()) {
        newErrors.name = 'Name is required';
      }
      if (!customerInfo.phone.trim()) {
        newErrors.phone = 'Phone number is required';
      } else if (!/^[6-9]\d{9}$/.test(customerInfo.phone)) {
        newErrors.phone = 'Please enter a valid 10-digit phone number';
      }
      if (!customerInfo.address.trim()) {
        newErrors.address = 'Address is required';
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
    }

    if (activeStep === 2) {
      // Simulate order placement
      const orderId = `ORD${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      setOrderId(orderId);
      setOrderPlaced(true);
      dispatch(clearOrder());
    }

    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomerInfo((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handlePaymentMethodChange = (method: string) => {
    setCustomerInfo((prev) => ({ ...prev, paymentMethod: method }));
  };

  const renderCartItems = () => (
    <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Your Order
      </Typography>
      {items.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          Your cart is empty. Add some delicious items to get started!
        </Alert>
      ) : (
        <>
          <List>
            {items.map((item) => (
              <React.Fragment key={item.id}>
                <ListItem
                  secondaryAction={
                    <IconButton edge="end" onClick={() => handleRemoveItem(item.id)}>
                      <DeleteIcon />
                    </IconButton>
                  }
                >
                  <ListItemText
                    primary={item.name}
                    secondary={formatPrice(item.price)}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                    >
                      <RemoveIcon fontSize="small" />
                    </IconButton>
                    <Typography sx={{ mx: 1 }}>{item.quantity}</Typography>
                    <IconButton
                      size="small"
                      onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant="body1">Subtotal:</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1" align="right">
                  {formatPrice(total)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1">GST (18%):</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1" align="right">
                  {formatPrice(tax)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1" fontWeight="bold">
                  Total:
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1" fontWeight="bold" align="right">
                  {formatPrice(totalWithTax)}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </>
      )}
    </Paper>
  );

  const renderDeliveryForm = () => (
    <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Delivery Details
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Full Name"
            name="name"
            value={customerInfo.name}
            onChange={handleInputChange}
            error={!!errors.name}
            helperText={errors.name}
            required
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Phone Number"
            name="phone"
            value={customerInfo.phone}
            onChange={handleInputChange}
            error={!!errors.phone}
            helperText={errors.phone}
            required
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Delivery Address"
            name="address"
            value={customerInfo.address}
            onChange={handleInputChange}
            error={!!errors.address}
            helperText={errors.address}
            multiline
            rows={3}
            required
          />
        </Grid>
      </Grid>
    </Paper>
  );

  const renderPaymentOptions = () => (
    <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Payment Method
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <Button
            fullWidth
            variant={customerInfo.paymentMethod === 'cash' ? 'contained' : 'outlined'}
            onClick={() => handlePaymentMethodChange('cash')}
            sx={{ p: 2 }}
          >
            Cash on Delivery
          </Button>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Button
            fullWidth
            variant={customerInfo.paymentMethod === 'card' ? 'contained' : 'outlined'}
            onClick={() => handlePaymentMethodChange('card')}
            sx={{ p: 2 }}
          >
            Credit/Debit Card
          </Button>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Button
            fullWidth
            variant={customerInfo.paymentMethod === 'upi' ? 'contained' : 'outlined'}
            onClick={() => handlePaymentMethodChange('upi')}
            sx={{ p: 2 }}
          >
            UPI
          </Button>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
        <Typography variant="body1" gutterBottom>
          Order Summary
        </Typography>
        <Grid container spacing={1}>
          <Grid item xs={6}>
            <Typography variant="body2">Items Total:</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" align="right">
              {formatPrice(total)}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2">GST (18%):</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" align="right">
              {formatPrice(tax)}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" fontWeight="bold">
              Total Amount:
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" fontWeight="bold" align="right">
              {formatPrice(totalWithTax)}
            </Typography>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );

  const renderOrderConfirmation = () => (
    <Paper elevation={2} sx={{ p: 3, mb: 3, textAlign: 'center' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            bgcolor: 'success.main',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography variant="h4" color="white">
            ✓
          </Typography>
        </Box>
        <Typography variant="h5" gutterBottom>
          Order Placed Successfully!
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Your order has been placed and will be delivered soon.
        </Typography>
        <Typography variant="body1" fontWeight="bold" gutterBottom>
          Order ID: {orderId}
        </Typography>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ textAlign: 'left' }}>
        <Typography variant="body1" gutterBottom>
          <strong>Delivery Address:</strong> {customerInfo.address}
        </Typography>
        <Typography variant="body1" gutterBottom>
          <strong>Payment Method:</strong>{' '}
          {customerInfo.paymentMethod === 'cash'
            ? 'Cash on Delivery'
            : customerInfo.paymentMethod === 'card'
            ? 'Credit/Debit Card'
            : 'UPI'}
        </Typography>
      </Box>

      <Button
        variant="contained"
        color="primary"
        sx={{ mt: 3 }}
        onClick={() => {
          setActiveStep(0);
          setOrderPlaced(false);
        }}
      >
        Place New Order
      </Button>
    </Paper>
  );

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <CartIcon sx={{ mr: 1 }} />
        Checkout
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {activeStep === 0 && renderCartItems()}
      {activeStep === 1 && renderDeliveryForm()}
      {activeStep === 2 && renderPaymentOptions()}
      {activeStep === 3 && renderOrderConfirmation()}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        <Button
          variant="outlined"
          onClick={handleBack}
          disabled={activeStep === 0 || activeStep === 3}
        >
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleNext}
          disabled={(activeStep === 0 && items.length === 0) || (activeStep === 3)}
        >
          {activeStep === 2 ? 'Place Order' : activeStep === 0 ? 'Checkout' : 'Next'}
        </Button>
      </Box>
    </Container>
  );
};

export default Cart; 