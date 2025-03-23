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

// Generate 100 random properties
const generateMockProperties = (count: number): Property[] => {
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
    const propType = propertyTypes[Math.floor(Math.random() * propertyTypes.length)];
    const location = locations[Math.floor(Math.random() * locations.length)];
    const listingType = listingTypes[Math.floor(Math.random() * listingTypes.length)];
    const bedroomCount = Math.floor(Math.random() * 6) + 1;
    const bathroomCount = Math.max(1, bedroomCount - Math.floor(Math.random() * 2));
    const squareFeet = Math.floor(Math.random() * (5000 - 800)) + 800;
    const price = propType === "Land" 
      ? Math.floor(Math.random() * 5000000) + 1000000
      : listingType === "For Rent" 
        ? Math.floor(Math.random() * 15000) + 3000
        : Math.floor(Math.random() * 9000000) + 500000;
    
    // Generate random features
    const randomFeatures = [...features]
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.floor(Math.random() * 6) + 3);
    
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
      features: randomFeatures
    };
  });
};

// Generate 100 random properties
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

// Util function to check and log listing type matching
const deepCheckListingTypeMatch = (propertyListingType: string, filterListingType: string) => {
  console.log(`Comparing: "${propertyListingType}" (${typeof propertyListingType}) with "${filterListingType}" (${typeof filterListingType})`);
  console.log('Exact match?', propertyListingType === filterListingType);
  console.log('Case insensitive match?', propertyListingType.toLowerCase() === filterListingType.toLowerCase());
  console.log('Includes?', propertyListingType.includes(filterListingType));
  console.log('CharCodes:', Array.from(propertyListingType).map(c => c.charCodeAt(0)));
  console.log('Filter CharCodes:', Array.from(filterListingType).map(c => c.charCodeAt(0)));
  
  // Return if there's a match (case insensitive)
  return propertyListingType.toLowerCase() === filterListingType.toLowerCase();
};

const PropertyList = ({ filters }: PropertyListProps) => {
  const [properties, setProperties] = useState<Property[]>(mockProperties);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const itemsPerPage = 9; // Show 9 properties per page
  const [totalItems, setTotalItems] = useState(mockProperties.length);

  // Function to filter properties based on the filters passed
  const filterProperties = (filters?: Filters) => {
    console.log('Filtering with filters:', filters);
    
    if (!filters) {
      setProperties(mockProperties);
      setTotalItems(mockProperties.length);
      console.log('No filters provided, showing all properties');
      return;
    }

    setLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      let filteredProps = [...mockProperties];
      console.log(`Starting with ${filteredProps.length} properties`);
      
      // Filter by location
      if (filters.location && filters.location.trim() !== '') {
        const locationQuery = filters.location.toLowerCase().trim();
        filteredProps = filteredProps.filter(prop => 
          prop.location.toLowerCase().includes(locationQuery) ||
          prop.title.toLowerCase().includes(locationQuery)
        );
          }
          
          // Filter by price range
      if (filters.minPrice > 0 || filters.maxPrice < 10000000) {
        filteredProps = filteredProps.filter(prop => 
          prop.price >= filters.minPrice && prop.price <= filters.maxPrice
        );
      }
      
      // Filter by bedrooms
      if (filters.bedrooms && filters.bedrooms !== '') {
        if (filters.bedrooms === '5+') {
          filteredProps = filteredProps.filter(prop => prop.beds >= 5);
        } else {
          const bedroomCount = parseInt(filters.bedrooms);
          filteredProps = filteredProps.filter(prop => prop.beds === bedroomCount);
        }
      }
      
      // Filter by bathrooms
      if (filters.bathrooms && filters.bathrooms !== '') {
        if (filters.bathrooms === '4+') {
          filteredProps = filteredProps.filter(prop => prop.baths >= 4);
        } else {
          const bathroomCount = parseInt(filters.bathrooms);
          filteredProps = filteredProps.filter(prop => prop.baths === bathroomCount);
        }
      }
      
      // Filter by property type
      if (filters.propertyType && filters.propertyType !== '') {
        filteredProps = filteredProps.filter(prop => 
          prop.propertyType === filters.propertyType
        );
      }
      
      // Filter by listing type
      if (filters.listingType && filters.listingType !== '') {
        console.log('Filtering by listing type:', filters.listingType);
        
        // Check how many properties we have of each listing type
        const typeCounts = filteredProps.reduce((acc: Record<string, number>, prop) => {
          acc[prop.listingType] = (acc[prop.listingType] || 0) + 1;
          return acc;
        }, {});
        console.log('Properties by listing type before filtering:', typeCounts);

        // Simple, direct filter - no complex comparison
        filteredProps = filteredProps.filter(prop => prop.listingType === filters.listingType);
        
        console.log(`After filtering by listing type "${filters.listingType}": ${filteredProps.length} properties remain`);

        // Double-check what listing types remain
        if (filteredProps.length > 0) {
          const remainingTypes = [...new Set(filteredProps.map(p => p.listingType))];
          console.log('Remaining listing types after filtering:', remainingTypes);
        }
      }
      
      // Filter by area range
      if (filters.minArea > 0 || filters.maxArea < 10000) {
        filteredProps = filteredProps.filter(prop => 
          prop.sqft >= filters.minArea && prop.sqft <= filters.maxArea
        );
      }
      
      // Filter by selected features
      if (filters.selectedFeatures && filters.selectedFeatures.length > 0) {
        filteredProps = filteredProps.filter(prop => {
          if (!prop.features) return false;
          return filters.selectedFeatures.every(feature => 
            prop.features?.includes(feature)
          );
        });
      }
      
      // Filter by view type
      if (filters.viewType && filters.viewType !== '') {
        filteredProps = filteredProps.filter(prop => {
          if (!prop.features) return false;
          return prop.features.includes(filters.viewType);
        });
      }
      
      // Filter by nearby amenities
      if (filters.nearbyAmenities && filters.nearbyAmenities.length > 0) {
        filteredProps = filteredProps.filter(prop => {
          if (!prop.features) return false;
          return filters.nearbyAmenities.some(amenity => {
            const amenityTerm = amenity.toLowerCase();
            return prop.features?.some(feature => 
              feature.toLowerCase().includes('near') && feature.toLowerCase().includes(amenityTerm)
            );
          });
        });
      }
      
      // Filter by pet friendly
      if (filters.isPetFriendly) {
        filteredProps = filteredProps.filter(prop => 
          prop.features?.includes('Pet Friendly')
        );
      }
      
      // Filter by furnished
      if (filters.isFurnished) {
        filteredProps = filteredProps.filter(prop => 
          prop.features?.includes('Furnished')
        );
      }
      
      // Final result
      console.log(`Final result: ${filteredProps.length} properties after all filters`);
      setProperties(filteredProps);
      setTotalItems(filteredProps.length);
      setPage(1); // Reset to first page when filters change
      setLoading(false);
    }, 500); // Simulate loading delay
  };

  // Apply filters when they change
  useEffect(() => {
    filterProperties(filters);
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