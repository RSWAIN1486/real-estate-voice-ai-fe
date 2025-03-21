import React, { useState, useEffect } from 'react';
import { Box, Typography, Divider, Paper } from '@mui/material';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  specialInstructions?: string;
}

interface OrderDetailsData {
  items: OrderItem[];
  totalAmount: number;
}

// Function to calculate order total
function prepOrderDetails(orderDetailsData: any): OrderDetailsData {
  try {
    const parsedItems: OrderItem[] = orderDetailsData;
    const totalAmount = parsedItems.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    // Construct the final order details object with total amount
    const orderDetails: OrderDetailsData = {
      items: parsedItems,
      totalAmount: Number(totalAmount.toFixed(2))
    };

    return orderDetails;
  } catch (error) {
    console.error(`Failed to parse order details:`, error);
    return {
      items: [],
      totalAmount: 0
    };
  }
}

const OrderDetails: React.FC = () => {
  const [orderDetails, setOrderDetails] = useState<OrderDetailsData>({
    items: [],
    totalAmount: 0
  });

  useEffect(() => {
    // Update order details as things change
    const handleOrderUpdate = (event: CustomEvent<any>) => {
      console.log(`Order update received:`, event.detail);
      const formattedData: OrderDetailsData = prepOrderDetails(event.detail);
      setOrderDetails(formattedData);
    };

    // Clear out order details when the call ends so it's empty for the next call
    const handleCallEnded = () => {
      setOrderDetails({
        items: [],
        totalAmount: 0
      });
    };

    window.addEventListener('orderDetailsUpdated', handleOrderUpdate as EventListener);
    window.addEventListener('callEnded', handleCallEnded as EventListener);

    return () => {
      window.removeEventListener('orderDetailsUpdated', handleOrderUpdate as EventListener);
      window.removeEventListener('callEnded', handleCallEnded as EventListener);
    };
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" fontWeight="bold" mb={2}>
        Order Details
      </Typography>
      <Paper elevation={2} sx={{ p: 2 }}>
        <Box mb={2}>
          <Typography color="text.secondary" variant="subtitle2" mb={1}>
            Items:
          </Typography>
          {orderDetails.items.length > 0 ? (
            orderDetails.items.map((item, index) => (
              <Box key={index} sx={{ mb: 1, pl: 2, borderLeft: '2px solid', borderColor: 'divider' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body1" fontWeight="medium">
                    {item.quantity}x {item.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatCurrency(item.price * item.quantity)}
                  </Typography>
                </Box>
                {item.specialInstructions && (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mt: 0.5 }}>
                    Note: {item.specialInstructions}
                  </Typography>
                )}
              </Box>
            ))
          ) : (
            <Typography variant="body2" color="text.secondary">
              No items yet
            </Typography>
          )}
        </Box>
        <Divider sx={{ my: 2 }} />
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle1" fontWeight="bold" color="text.secondary">
            Total:
          </Typography>
          <Typography variant="subtitle1" fontWeight="bold">
            {formatCurrency(orderDetails.totalAmount)}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default OrderDetails; 