// Import and manage property images

// Import default property image as fallback
import defaultPropertyImage from '../assets/images/hero-bg.jpg';

/**
 * Get the URL for a property image
 * @param index Property index (1-based)
 * @returns URL to the property image
 */
export const getPropertyImageUrl = (index: number): string => {
  // In a production environment, we would dynamically import the images
  // or use a proper image loading mechanism. For this demo, we'll return
  // a direct path to the images folder which has all our property images.
  
  try {
    // For local development, use a relative path that points to the images 
    // in the public directory
    return `/src/assets/images/properties/property-${index}.jpg`;
  } catch (error) {
    console.warn(`Could not load property image ${index}:`, error);
    return defaultPropertyImage;
  }
};

/**
 * Create an array of property image URLs
 * @param count Number of property images to generate
 * @returns Array of property image URLs
 */
export const createPropertyImageUrls = (count: number): string[] => {
  return Array.from({ length: count }, (_, i) => getPropertyImageUrl(i + 1));
}; 