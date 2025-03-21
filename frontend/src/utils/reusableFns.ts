// Format price to Indian Rupees
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(price);
};

// Calculate total price including taxes
export const calculateTotalWithTax = (subtotal: number): { total: number; tax: number } => {
  const taxRate = 0.18; // 18% GST
  const tax = subtotal * taxRate;
  const total = subtotal + tax;
  return { total, tax };
};

// Format date to Indian format
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

// Validate phone number (Indian format)
export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
};

// Cache object to store already loaded image URLs (memory cache)
const imageCache: Record<string, boolean> = {};

/**
 * Get optimized image path with proper caching
 * @param baseUrl The base API URL
 * @param imageName The image filename
 * @param directory The directory where images are stored (default: 'imagedump')
 * @returns The full URL to the image
 */
export const getOptimizedImageUrl = (
  baseUrl: string,
  imageName: string,
  directory: string = 'imagedump'
): string => {
  if (!imageName) {
    return `https://via.placeholder.com/400x300/FFAA00/333333?text=No+Image`;
  }
  
  // Create consistent URL format
  const imageUrl = `${baseUrl}/public/${directory}/${imageName}`;
  
  // Mark this image as requested in our cache
  imageCache[imageUrl] = true;
  
  return imageUrl;
};

/**
 * Handle image loading errors with a fallback
 * @param event The error event from the img tag
 * @param itemName The name of the item for the fallback text
 * @param logDetails Whether to log detailed error info (default: false)
 */
export const handleImageError = (
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  itemName: string,
  logDetails: boolean = false
): void => {
  const target = event.target as HTMLImageElement;
  
  // Prevent infinite error loops
  target.onerror = null;
  
  // Get original source for logging
  const originalSrc = target.src;
  
  // Create a URL-friendly version of the item name
  const encodedName = encodeURIComponent(itemName.replace(/ /g, '+'));
  
  // Use placeholder with the item name
  target.src = `https://via.placeholder.com/400x200/FFAA00/333333?text=${encodedName}`;
  
  // Log error information
  if (logDetails) {
    console.warn(`Image loading failed: ${itemName}`, {
      originalSrc,
      fallbackSrc: target.src
    });
  } else {
    console.warn(`Failed to load image for: ${itemName}`);
  }
  
  // Remove from cache so it can be retried later
  delete imageCache[originalSrc];
}; 