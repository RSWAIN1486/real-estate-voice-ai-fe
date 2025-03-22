import { useState, useEffect } from "react";
import { Grid, Box, Typography, Card, CardMedia, CardContent, Chip, Skeleton, CircularProgress, Alert, Pagination, Stack } from "@mui/material";
import { Filters } from "./SearchFilters";
import BedIcon from '@mui/icons-material/Bed';
import BathtubIcon from '@mui/icons-material/Bathtub';
import SquareFootIcon from '@mui/icons-material/SquareFoot';

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
  const listingTypes = ["For Sale", "For Rent", "New Development"];
  const tags = ["Featured", "New Development", "For Rent", "For Sale", ""];
  
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
  
  const images = [
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3",
    "https://images.unsplash.com/photo-1600566753051-f0b4ae10f956?ixlib=rb-4.0.3",
    "https://images.unsplash.com/photo-1600573472550-8090733a73c6?ixlib=rb-4.0.3",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3",
    "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?ixlib=rb-4.0.3",
    "https://images.unsplash.com/photo-1600563438938-a9a27216b4f5?ixlib=rb-4.0.3",
    "https://images.unsplash.com/photo-1613977257363-707ba9348227?ixlib=rb-4.0.3",
    "https://images.unsplash.com/photo-1613977257592-4871e5fcd7c4?ixlib=rb-4.0.3",
    "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?ixlib=rb-4.0.3",
    "https://images.unsplash.com/photo-1628744448840-55bdb2497bd4?ixlib=rb-4.0.3",
    "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?ixlib=rb-4.0.3",
    "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?ixlib=rb-4.0.3",
    "https://images.unsplash.com/photo-1523217582562-09d0def993a6?ixlib=rb-4.0.3",
    "https://images.unsplash.com/photo-1605146769289-440113cc3d00?ixlib=rb-4.0.3",
    "https://images.unsplash.com/photo-1633114073945-ccefa7237461?ixlib=rb-4.0.3",
    "https://images.unsplash.com/photo-1628745277862-fde2c19b3ab3?ixlib=rb-4.0.3",
    "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?ixlib=rb-4.0.3",
    "https://images.unsplash.com/photo-1575517111839-3a3843ee7f5d?ixlib=rb-4.0.3",
    "https://images.unsplash.com/photo-1592928302636-c83cf1e1c887?ixlib=rb-4.0.3",
    "https://images.unsplash.com/photo-1630699144867-37acec97df5a?ixlib=rb-4.0.3",
    "https://images.unsplash.com/photo-1568605114967-8130f3a36994?ixlib=rb-4.0.3",
    "https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3",
    "https://images.unsplash.com/photo-1599427303058-f04cbcf4756f?ixlib=rb-4.0.3",
    "https://images.unsplash.com/photo-1513584684374-8bab748fbf90?ixlib=rb-4.0.3",
    "https://images.unsplash.com/photo-1558036117-15d82a90b9b1?ixlib=rb-4.0.3",
    "https://images.unsplash.com/photo-1560518883-7d82c5767c25?ixlib=rb-4.0.3",
    "https://images.unsplash.com/photo-1574362848149-11496d93a7c7?ixlib=rb-4.0.3",
    "https://images.unsplash.com/photo-1560448204-61dc36dc98c8?ixlib=rb-4.0.3",
    "https://images.unsplash.com/photo-1484154218962-a197022b5858?ixlib=rb-4.0.3",
    "https://images.unsplash.com/photo-1560749003-f4b1e17e2dff?ixlib=rb-4.0.3",
    "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?ixlib=rb-4.0.3",
    "https://images.unsplash.com/photo-1564501049412-61c2a3083791?ixlib=rb-4.0.3",
    "https://images.unsplash.com/photo-1621551122354-e96737d64b21?ixlib=rb-4.0.3",
    "https://images.unsplash.com/photo-1572120360610-d971b9d7767c?ixlib=rb-4.0.3",
    "https://images.unsplash.com/photo-1600047508967-c9cd77d2d492?ixlib=rb-4.0.3",
    "https://images.unsplash.com/photo-1600047508788-26df7b3599f4?ixlib=rb-4.0.3",
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
    
    // Ensure each property gets a unique image by using index to select from the images array
    const imageIndex = index % images.length;
    
    return {
      id: `property-${index + 1}`,
      title: `${propType} in ${location}`,
      price: price,
      location: location,
      beds: propType === "Office" || propType === "Retail" || propType === "Land" ? 0 : bedroomCount,
      baths: propType === "Land" ? 0 : bathroomCount,
      sqft: squareFeet,
      image: images[imageIndex],
      tag: tags[Math.floor(Math.random() * tags.length)],
      propertyType: propType,
      listingType: listingType,
      features: randomFeatures
    };
  });
};

// Generate 100 random properties
const mockProperties = generateMockProperties(100);

interface PropertyListProps {
  filters?: Filters;
}

const PropertyList = ({ filters }: PropertyListProps) => {
  const [properties, setProperties] = useState<Property[]>(mockProperties);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const itemsPerPage = 9; // Show 9 properties per page
  const [totalItems, setTotalItems] = useState(mockProperties.length);

  // Function to filter properties based on the filters passed
  const filterProperties = (filters?: Filters) => {
    if (!filters) {
      setProperties(mockProperties);
      setTotalItems(mockProperties.length);
      return;
    }

      setLoading(true);
      
    // Simulate API call delay
      setTimeout(() => {
      let filteredProps = [...mockProperties];
      
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
        filteredProps = filteredProps.filter(prop => 
          prop.listingType === filters.listingType
        );
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
                  color={property.tag === 'Featured' ? 'primary' : 'secondary'}
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