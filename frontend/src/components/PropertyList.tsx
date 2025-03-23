import { useState, useEffect } from "react";
import { Grid, Box, Typography, Card, CardMedia, CardContent, Chip, Skeleton, CircularProgress, Alert, Pagination, Stack } from "@mui/material";
import { Filters } from "./SearchFilters";
import BedIcon from '@mui/icons-material/Bed';
import BathtubIcon from '@mui/icons-material/Bathtub';
import SquareFootIcon from '@mui/icons-material/SquareFoot';

// Import property image utilities
import { getPropertyImageUrl } from "../utils/propertyImages";

interface Property {
  id: number | string;
  title: string;
  price: number;
  location: string;
  beds: number;
  baths: number;
  sqft: number;
  image: string;
  tag: string;
  propertyType: string;
  listingType: string;
  features?: string[];
}

// Use a consistent seed for random number generation to ensure deterministic results
const seededRandom = (seed: number) => {
  const m = 2**35 - 31;
  const a = 185852;
  let s = seed % m;
  
  return function() {
    s = (s * a) % m;
    return s / m;
  };
};

// Generate 100 deterministic properties
const generateMockProperties = (count: number): Property[] => {
  // Initialize seeded random function
  const random = seededRandom(12345);

  const locations = [
    "Dubai Marina, Dubai",
    "Downtown Dubai, Dubai",
    "Palm Jumeirah, Dubai",
    "Business Bay, Dubai",
    "Jumeirah Beach Residence (JBR), Dubai",
    "DIFC, Dubai",
    "Arabian Ranches, Dubai",
    "Manhattan, New York",
    "Brooklyn, New York",
    "Upper East Side, New York",
    "Kensington, London",
    "Notting Hill, London",
    "Chelsea, London",
    "Corniche Road, Abu Dhabi",
    "Al Reem Island, Abu Dhabi",
    "Deansgate, Manchester",
    "Northern Quarter, Manchester",
  ];
  
  const propertyTypes = ["Apartment", "Villa", "Penthouse", "Townhouse", "Duplex", "House", "Office", "Retail", "Land"];
  const listingTypes = ["For Rent", "For Sale", "New Development"];
  
  const features = [
    "Sea View", 
    "Private Pool", 
    "Balcony", 
    "Garden", 
    "Gym", 
    "Concierge", 
    "Pet Friendly",
    "Near Supermarket",
    "Near Metro Station",
    "Near Schools",
    "Waterfront",
    "High Floor",
    "Smart Home",
    "Furnished",
    "Parking",
    "24/7 Security",
    "City View",
    "Walk-in Closet",
    "Storage Room",
    "Maid's Room",
    "Study Room",
    "Near Beach",
    "Near Shopping Mall",
    "Near Hospital",
    "Near Restaurant",
    "Near Park",
    "Mountain View",
    "Pool View",
    "Lake View",
    "Golf Course View",
  ];
  
  return Array.from({ length: count }, (_, index) => {
    // Use seeded random for deterministic selection
    const propTypeIndex = Math.floor(random() * propertyTypes.length);
    const propType = propertyTypes[propTypeIndex];
    
    const locationIndex = Math.floor(random() * locations.length);
    const location = locations[locationIndex];
    
    const listingTypeIndex = Math.floor(random() * listingTypes.length);
    const listingType = listingTypes[listingTypeIndex];
    
    const bedroomCount = Math.floor(random() * 6) + 1;
    const bathroomCount = Math.max(1, bedroomCount - Math.floor(random() * 2));
    const squareFeet = Math.floor(random() * (5000 - 800)) + 800;
    const price = propType === "Land" 
      ? Math.floor(random() * 5000000) + 1000000
      : listingType === "For Rent" 
        ? Math.floor(random() * 15000) + 3000
        : Math.floor(random() * 9000000) + 500000;
    
    // Generate deterministic features for each property
    const propertyFeatures = [];
    for (let i = 0; i < features.length; i++) {
      if (random() > 0.7) { // 30% chance to have each feature
        propertyFeatures.push(features[i]);
      }
    }
    
    // Ensure a property has at least 3 features
    while (propertyFeatures.length < 3) {
      const featureIndex = Math.floor(random() * features.length);
      const feature = features[featureIndex];
      if (!propertyFeatures.includes(feature)) {
        propertyFeatures.push(feature);
      }
    }
    
    // Get property image URL
    const propertyImage = getPropertyImageUrl(index + 1);
    
    return {
      id: `property-${index + 1}`,
      title: `${propType} in ${location}`,
      price: price,
      location: location,
      beds: propType === "Office" || propType === "Retail" || propType === "Land" ? 0 : bedroomCount,
      baths: propType === "Land" ? 0 : bathroomCount,
      sqft: squareFeet,
      image: propertyImage,
      tag: listingType,
      propertyType: propType,
      listingType: listingType,
      features: propertyFeatures
    };
  });
};

// Generate 100 deterministic properties
const mockProperties = generateMockProperties(100);

// For debugging - log distribution by listing type
const listingTypeCounts = mockProperties.reduce((counts: Record<string, number>, property) => {
  counts[property.listingType] = (counts[property.listingType] || 0) + 1;
  return counts;
}, {});
console.log('Listing Type Distribution in mockProperties:', listingTypeCounts);

interface PropertyListProps {
  filters?: Filters;
}

const PropertyList = ({ filters }: PropertyListProps) => {
  const [properties, setProperties] = useState<Property[]>(mockProperties);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const itemsPerPage = 9; // Show 9 properties per page
  const [totalItems, setTotalItems] = useState(mockProperties.length);
  
  // Create a snapshot of the current filter state to use during filtering
  const [currentFilterSnapshot, setCurrentFilterSnapshot] = useState<Filters | undefined>();

  // Function to filter properties based on the filters passed
  const filterProperties = (filters?: Filters) => {
    // Create a snapshot of the filters for consistent application
    const filterSnapshot = filters ? {...filters} : undefined;
    setCurrentFilterSnapshot(filterSnapshot);
    
    console.log('Filtering with filters:', filterSnapshot);
    
    if (!filterSnapshot) {
      setProperties(mockProperties);
      setTotalItems(mockProperties.length);
      console.log('No filters provided, showing all properties');
      return;
    }

    setLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      try {
        // Start with a fresh copy of all properties
        let filteredProps = [...mockProperties];
        console.log(`Starting filtering with ${filteredProps.length} properties`);
        
        // Apply location filter first if specified
        if (filterSnapshot.location && filterSnapshot.location.trim() !== '') {
          const locationQuery = filterSnapshot.location.toLowerCase().trim();
          filteredProps = filteredProps.filter(prop => 
            prop.location.toLowerCase().includes(locationQuery) ||
            prop.title.toLowerCase().includes(locationQuery)
          );
          console.log(`After location filter: ${filteredProps.length} properties`);
        }
        
        // Apply price range filter
        if (filterSnapshot.minPrice > 0 || filterSnapshot.maxPrice < 10000000) {
          filteredProps = filteredProps.filter(prop => 
            prop.price >= filterSnapshot.minPrice && prop.price <= filterSnapshot.maxPrice
          );
          console.log(`After price filter: ${filteredProps.length} properties`);
        }
        
        // Apply bedrooms filter
        if (filterSnapshot.bedrooms && filterSnapshot.bedrooms !== '') {
          if (filterSnapshot.bedrooms === '5+') {
            filteredProps = filteredProps.filter(prop => prop.beds >= 5);
          } else {
            const bedroomCount = parseInt(filterSnapshot.bedrooms);
            filteredProps = filteredProps.filter(prop => prop.beds === bedroomCount);
          }
          console.log(`After bedrooms filter: ${filteredProps.length} properties`);
        }
        
        // Apply bathrooms filter
        if (filterSnapshot.bathrooms && filterSnapshot.bathrooms !== '') {
          if (filterSnapshot.bathrooms === '4+') {
            filteredProps = filteredProps.filter(prop => prop.baths >= 4);
          } else {
            const bathroomCount = parseInt(filterSnapshot.bathrooms);
            filteredProps = filteredProps.filter(prop => prop.baths === bathroomCount);
          }
          console.log(`After bathrooms filter: ${filteredProps.length} properties`);
        }
        
        // Apply property type filter
        if (filterSnapshot.propertyType && filterSnapshot.propertyType !== '') {
          filteredProps = filteredProps.filter(prop => 
            prop.propertyType === filterSnapshot.propertyType
          );
          console.log(`After property type filter: ${filteredProps.length} properties`);
        }
        
        // Apply listing type filter - this is crucial to fix
        if (filterSnapshot.listingType && filterSnapshot.listingType !== '') {
          console.log(`Applying listing type filter: "${filterSnapshot.listingType}"`);
          
          // Check current listing types before filtering
          const typesBeforeFilter = [...new Set(filteredProps.map(p => p.listingType))];
          console.log('Listing types before filtering:', typesBeforeFilter);
          
          // Use direct string comparison
          filteredProps = filteredProps.filter(prop => 
            prop.listingType === filterSnapshot.listingType
          );
          
          console.log(`After listing type filter: ${filteredProps.length} properties`);
        }
        
        // Apply area range filter
        if (filterSnapshot.minArea > 0 || filterSnapshot.maxArea < 10000) {
          filteredProps = filteredProps.filter(prop => 
            prop.sqft >= filterSnapshot.minArea && prop.sqft <= filterSnapshot.maxArea
          );
          console.log(`After area filter: ${filteredProps.length} properties`);
        }
        
        // Apply selected features filter
        if (filterSnapshot.selectedFeatures && filterSnapshot.selectedFeatures.length > 0) {
          filteredProps = filteredProps.filter(prop => {
            if (!prop.features) return false;
            return filterSnapshot.selectedFeatures.every(feature => 
              prop.features?.includes(feature)
            );
          });
          console.log(`After features filter: ${filteredProps.length} properties`);
        }
        
        // Apply view type filter
        if (filterSnapshot.viewType && filterSnapshot.viewType !== '') {
          filteredProps = filteredProps.filter(prop => {
            if (!prop.features) return false;
            return prop.features.includes(filterSnapshot.viewType);
          });
          console.log(`After view type filter: ${filteredProps.length} properties`);
        }
        
        // Apply nearby amenities filter
        if (filterSnapshot.nearbyAmenities && filterSnapshot.nearbyAmenities.length > 0) {
          filteredProps = filteredProps.filter(prop => {
            if (!prop.features) return false;
            
            // For each required amenity, check if the property has a matching feature
            return filterSnapshot.nearbyAmenities.every(amenity => {
              // Create the exact "Near X" string to match
              const nearbyFeatureName = `Near ${amenity}`;
              return prop.features?.some(feature => feature === nearbyFeatureName);
            });
          });
          console.log(`After nearby amenities filter: ${filteredProps.length} properties`);
        }
        
        // Apply pet friendly filter
        if (filterSnapshot.isPetFriendly) {
          filteredProps = filteredProps.filter(prop => 
            prop.features?.includes('Pet Friendly')
          );
          console.log(`After pet friendly filter: ${filteredProps.length} properties`);
        }
        
        // Apply furnished filter
        if (filterSnapshot.isFurnished) {
          filteredProps = filteredProps.filter(prop => 
            prop.features?.includes('Furnished')
          );
          console.log(`After furnished filter: ${filteredProps.length} properties`);
        }
        
        // Final result
        console.log(`Final result: ${filteredProps.length} properties after all filters`);
        setProperties(filteredProps);
        setTotalItems(filteredProps.length);
        setPage(1); // Reset to first page when filters change
      } catch (error) {
        console.error('Error during filtering:', error);
        // If there's an error, show all properties
        setProperties(mockProperties);
        setTotalItems(mockProperties.length);
      } finally {
        setLoading(false);
      }
    }, 500); // Simulate loading delay
  };

  // Apply filters when they change
  useEffect(() => {
    // Compare current filters with the snapshot to prevent redundant filtering
    const filtersChanged = JSON.stringify(filters) !== JSON.stringify(currentFilterSnapshot);
    
    if (filtersChanged) {
      console.log('Filters changed, applying filters');
      filterProperties(filters);
    } else {
      console.log('Filters unchanged, skipping filter application');
    }
  }, [filters]);

  // Get current page properties
  const getCurrentPageProperties = () => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return properties.slice(startIndex, endIndex);
  };

  // Handle page change
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Show loading state
  if (loading) {
    return (
      <Box py={4} textAlign="center">
        <CircularProgress />
      </Box>
    );
  }

  // Show empty state
  if (properties.length === 0) {
    return (
      <Box py={4}>
        <Alert severity="info">
          No properties found matching your criteria. Try adjusting your filters.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          Properties {totalItems > 0 ? `(${totalItems})` : ""}
        </Typography>
      </Box>

        <Grid container spacing={3}>
        {getCurrentPageProperties().map((property) => (
            <Grid item xs={12} sm={6} md={4} key={property.id}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
                },
                position: 'relative' 
              }}
            >
                  {property.tag && (
                    <Chip
                      label={property.tag}
                      color={
                        property.tag === 'For Rent' 
                          ? 'secondary' 
                          : property.tag === 'New Development' 
                            ? 'info' 
                            : 'primary'
                      }
                      sx={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        zIndex: 1,
                        fontWeight: 'bold'
                      }} 
                    />
                  )}
              <CardMedia
                component="img"
                height="200"
                image={property.image}
                alt={property.title}
                sx={{ objectFit: 'cover' }}
              />
                <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" component="div" gutterBottom noWrap>
                    {property.title}
                  </Typography>
                <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                  {property.listingType === "For Rent" 
                    ? `$${property.price.toLocaleString()}/month` 
                    : `$${property.price.toLocaleString()}`
                  }
                  </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                    {property.location}
                  </Typography>
                <Box display="flex" alignItems="center" justifyContent="space-between" mt={2}>
                  {property.beds > 0 && (
                    <Box display="flex" alignItems="center">
                      <BedIcon fontSize="small" sx={{ mr: 0.5 }} />
                      <Typography variant="body2">{property.beds}</Typography>
                    </Box>
                  )}
                  {property.baths > 0 && (
                    <Box display="flex" alignItems="center">
                      <BathtubIcon fontSize="small" sx={{ mr: 0.5 }} />
                      <Typography variant="body2">{property.baths}</Typography>
                    </Box>
                  )}
                  <Box display="flex" alignItems="center">
                      <SquareFootIcon fontSize="small" sx={{ mr: 0.5 }} />
                    <Typography variant="body2">{property.sqft.toLocaleString()} sq ft</Typography>
                  </Box>
                    </Box>
                {property.features && property.features.length > 0 && (
                  <Box mt={2}>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {property.features.slice(0, 3).map((feature, index) => (
                        <Chip 
                          key={index} 
                          label={feature} 
                          size="small" 
                          variant="outlined" 
                          sx={{ mb: 1 }}
                        />
                      ))}
                      {property.features.length > 3 && (
                        <Chip 
                          label={`+${property.features.length - 3} more`} 
                          size="small" 
                          variant="outlined" 
                          sx={{ mb: 1 }}
                        />
                      )}
                    </Stack>
                  </Box>
                )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      
      {/* Pagination */}
      {totalItems > itemsPerPage && (
        <Box display="flex" justifyContent="center" mt={4}>
          <Pagination 
            count={Math.ceil(totalItems / itemsPerPage)} 
            page={page} 
            onChange={handlePageChange}
            color="primary"
            size="large"
          />
        </Box>
      )}
    </Box>
  );
};

export default PropertyList; 