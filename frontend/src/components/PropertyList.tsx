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

// Enhanced mock property data with features
const mockProperties: Property[] = [
  {
    id: 1,
    title: "Apartment in Chelsea, London",
    price: 3500141,
    location: "Kensington, London",
    beds: 2,
    baths: 2,
    sqft: 1864,
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3",
    tag: "New Development",
    propertyType: "Apartment",
    listingType: "For Sale",
    features: ["Sea View", "Balcony", "Gym", "Smart Home", "24/7 Security"]
  },
  {
    id: 2,
    title: "Villa in Kensington, London",
    price: 3046642,
    location: "DIFC, Dubai",
    beds: 1,
    baths: 0,
    sqft: 2088,
    image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?ixlib=rb-4.0.3",
    tag: "New Development",
    propertyType: "Villa",
    listingType: "For Sale",
    features: ["Private Pool", "Garden", "Pet Friendly", "Near Supermarket"]
  },
  {
    id: 3,
    title: "Penthouse in Manhattan, New York",
    price: 2985616,
    location: "Manhattan, New York",
    beds: 3,
    baths: 3,
    sqft: 2698,
    image: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?ixlib=rb-4.0.3",
    tag: "For Rent",
    propertyType: "Penthouse",
    listingType: "For Rent",
    features: ["City View", "Walk-in Closet", "Concierge", "Furnished"]
  },
  {
    id: 4,
    title: "Luxury Villa with Pool",
    price: 4568000,
    location: "Palm Jumeirah, Dubai",
    beds: 5,
    baths: 6,
    sqft: 5200,
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3",
    tag: "Featured",
    propertyType: "Villa",
    listingType: "For Sale",
    features: ["Sea View", "Private Pool", "Smart Home", "Garden", "Parking", "Maid's Room"]
  },
  {
    id: 5,
    title: "Modern Downtown Apartment",
    price: 1750000,
    location: "Downtown, Dubai",
    beds: 2,
    baths: 2,
    sqft: 1450,
    image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?ixlib=rb-4.0.3",
    tag: "New Development",
    propertyType: "Apartment",
    listingType: "For Sale",
    features: ["City View", "Gym", "Parking", "Near Metro Station", "Near Shopping Mall"]
  },
  {
    id: 6,
    title: "Townhouse in Queens",
    price: 1200000,
    location: "Queens, New York",
    beds: 3,
    baths: 2,
    sqft: 1870,
    image: "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?ixlib=rb-4.0.3",
    tag: "",
    propertyType: "Townhouse",
    listingType: "For Sale",
    features: ["Garden", "Parking", "Near School", "Pet Friendly"]
  },
  {
    id: 7,
    title: "Spacious Family Home",
    price: 2250000,
    location: "Brooklyn, New York",
    beds: 4,
    baths: 3,
    sqft: 2900,
    image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?ixlib=rb-4.0.3",
    tag: "",
    propertyType: "House",
    listingType: "For Sale",
    features: ["Garden", "Parking", "Near School", "Storage Room", "Pet Friendly"]
  },
  {
    id: 8,
    title: "Beachfront Penthouse",
    price: 5750000,
    location: "JBR, Dubai",
    beds: 4,
    baths: 5,
    sqft: 3800,
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3",
    tag: "Featured",
    propertyType: "Penthouse",
    listingType: "For Sale",
    features: ["Sea View", "Private Pool", "Concierge", "Smart Home", "Near Beach", "Furnished"]
  },
  {
    id: 9,
    title: "Luxury Duplex Apartment",
    price: 3100000,
    location: "Business Bay, Dubai",
    beds: 3,
    baths: 3,
    sqft: 2450,
    image: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?ixlib=rb-4.0.3",
    tag: "New Development",
    propertyType: "Duplex",
    listingType: "For Sale",
    features: ["City View", "Balcony", "Gym", "Smart Home", "Near Metro Station"]
  },
  {
    id: 10,
    title: "Modern Office Space",
    price: 2800000,
    location: "DIFC, Dubai",
    beds: 0,
    baths: 2,
    sqft: 2200,
    image: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?ixlib=rb-4.0.3",
    tag: "",
    propertyType: "Office",
    listingType: "For Sale",
    features: ["24/7 Security", "Parking", "Near Metro Station", "Smart Home"]
  },
  {
    id: 11,
    title: "Contemporary Villa",
    price: 3800000,
    location: "Arabian Ranches, Dubai",
    beds: 5,
    baths: 5,
    sqft: 4900,
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3",
    tag: "",
    propertyType: "Villa",
    listingType: "For Sale",
    features: ["Private Pool", "Garden", "Smart Home", "Maid's Room", "Study Room"]
  },
  {
    id: 12,
    title: "Marina Luxury Apartment",
    price: 8500,
    location: "Dubai Marina, Dubai",
    beds: 2,
    baths: 2,
    sqft: 1650,
    image: "https://images.unsplash.com/photo-1574362848149-11496d93a7c7?ixlib=rb-4.0.3",
    tag: "For Rent",
    propertyType: "Apartment",
    listingType: "For Rent",
    features: ["Sea View", "Balcony", "Gym", "Concierge", "Furnished"]
  }
];

interface PropertyListProps {
  filters?: Filters;
}

const PropertyList = ({ filters }: PropertyListProps) => {
  const [properties, setProperties] = useState<Property[]>(mockProperties);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const itemsPerPage = 6;
  const [totalItems, setTotalItems] = useState(mockProperties.length);

  useEffect(() => {
    if (filters) {
      setLoading(true);
      setPage(1); // Reset to first page when filters change
      
      // Simulate API call with delay
      setTimeout(() => {
        const filteredProperties = mockProperties.filter(property => {
          // Filter by location if provided
          if (filters.location && !property.location.toLowerCase().includes(filters.location.toLowerCase())) {
            return false;
          }
          
          // Filter by price range
          if (property.price < filters.minPrice || property.price > filters.maxPrice) {
            return false;
          }
          
          // Filter by property type if provided
          if (filters.propertyType && property.propertyType !== filters.propertyType) {
            return false;
          }
          
          // Filter by listing type if provided
          if (filters.listingType && property.listingType !== filters.listingType) {
            return false;
          }
          
          // Filter by bedrooms if provided
          if (filters.bedrooms) {
            if (filters.bedrooms === "5+") {
              if (property.beds < 5) return false;
            } else {
              if (property.beds !== parseInt(filters.bedrooms as string)) return false;
            }
          }
          
          // Filter by bathrooms if provided
          if (filters.bathrooms) {
            if (filters.bathrooms === "4+") {
              if (property.baths < 4) return false;
            } else {
              if (property.baths !== parseInt(filters.bathrooms as string)) return false;
            }
          }
          
          // Filter by area
          if (property.sqft < filters.minArea || property.sqft > filters.maxArea) {
            return false;
          }
          
          // Filter by selected features
          if (filters.selectedFeatures.length > 0) {
            if (!property.features) return false;
            
            const hasAllFeatures = filters.selectedFeatures.every(feature => 
              property.features?.includes(feature)
            );
            
            if (!hasAllFeatures) return false;
          }
          
          // Filter by view type
          if (filters.viewType && (!property.features || !property.features.includes(filters.viewType))) {
            return false;
          }
          
          // Filter by nearby amenities
          if (filters.nearbyAmenities.length > 0) {
            if (!property.features) return false;
            
            const hasAnyAmenity = filters.nearbyAmenities.some(amenity =>
              property.features?.some(feature => feature.includes(amenity))
            );
            
            if (!hasAnyAmenity) return false;
          }
          
          // Filter by pet friendly
          if (filters.isPetFriendly && (!property.features || !property.features.includes("Pet Friendly"))) {
            return false;
          }
          
          // Filter by furnished
          if (filters.isFurnished && (!property.features || !property.features.includes("Furnished"))) {
            return false;
          }
          
          return true;
        });
        
        setTotalItems(filteredProperties.length);
        setProperties(filteredProperties);
        setLoading(false);
      }, 800);
    }
  }, [filters]);

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Calculate pagination
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedProperties = properties.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          Properties {totalItems > 0 ? `(${totalItems})` : ""}
        </Typography>
      </Box>

      {loading ? (
        <Grid container spacing={3}>
          {[1, 2, 3].map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item}>
              <Card>
                <Skeleton variant="rectangular" height={220} />
                <CardContent>
                  <Skeleton variant="text" height={28} width="80%" />
                  <Skeleton variant="text" height={24} width="60%" />
                  <Box sx={{ mt: 2, display: "flex", justifyContent: "space-between" }}>
                    <Skeleton variant="text" width="30%" />
                    <Skeleton variant="text" width="30%" />
                    <Skeleton variant="text" width="30%" />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : paginatedProperties.length > 0 ? (
        <>
          <Grid container spacing={3}>
            {paginatedProperties.map((property) => (
              <Grid item xs={12} sm={6} md={4} key={property.id}>
                <Card sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 12px 20px rgba(0,0,0,0.1)',
                  },
                  borderRadius: '8px',
                  overflow: 'hidden',
                }}>
                  <Box sx={{ position: "relative" }}>
                    <CardMedia
                      component="img"
                      height={220}
                      image={property.image}
                      alt={property.title}
                      sx={{
                        objectFit: 'cover',
                        transition: 'transform 0.5s',
                        '&:hover': {
                          transform: 'scale(1.05)',
                        }
                      }}
                    />
                    {property.tag && (
                      <Chip
                        label={property.tag}
                        sx={{
                          position: "absolute",
                          bottom: 10,
                          left: 10,
                          bgcolor: property.tag === "For Rent" ? "secondary.main" : "primary.main",
                          color: "white",
                          fontWeight: "bold",
                        }}
                        size="small"
                      />
                    )}
                  </Box>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" gutterBottom fontWeight="bold" noWrap>
                      {property.title}
                    </Typography>
                    <Typography variant="h5" color="primary" fontWeight="bold" gutterBottom>
                      ${property.price.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {property.location}
                    </Typography>
                    <Box sx={{ mt: 2, display: "flex", justifyContent: "space-between" }}>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <BedIcon fontSize="small" sx={{ mr: 0.5 }} />
                        <Typography variant="body2">{property.beds} {property.beds === 1 ? 'bed' : 'beds'}</Typography>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <BathtubIcon fontSize="small" sx={{ mr: 0.5 }} />
                        <Typography variant="body2">{property.baths} {property.baths === 1 ? 'bath' : 'baths'}</Typography>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <SquareFootIcon fontSize="small" sx={{ mr: 0.5 }} />
                        <Typography variant="body2">{property.sqft} sqft</Typography>
                      </Box>
                    </Box>
                    
                    {/* Display Features */}
                    {property.features && property.features.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Features:
                        </Typography>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                          {property.features.slice(0, 4).map((feature, index) => (
                            <Chip
                              key={index}
                              label={feature}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          ))}
                          {property.features.length > 4 && (
                            <Chip
                              label={`+${property.features.length - 4} more`}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <Stack spacing={2} alignItems="center" sx={{ my: 4 }}>
              <Pagination 
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                showFirstButton
                showLastButton
                size="large"
              />
              <Typography variant="body2" color="text.secondary">
                Page {page} of {totalPages}
              </Typography>
            </Stack>
          )}
        </>
      ) : (
        <Box sx={{ py: 4, textAlign: "center" }}>
          <Typography variant="h6" color="text.secondary">
            No properties found matching your criteria
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Try adjusting your filters to see more results
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default PropertyList; 