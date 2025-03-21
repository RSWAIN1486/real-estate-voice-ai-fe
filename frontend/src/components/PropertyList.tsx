import { useState, useEffect } from "react";
import { Grid, Box, Typography, Card, CardMedia, CardContent, Chip, Skeleton } from "@mui/material";
import { Filters } from "./SearchFilters";
import BedIcon from '@mui/icons-material/Bed';
import BathtubIcon from '@mui/icons-material/Bathtub';
import SquareFootIcon from '@mui/icons-material/SquareFoot';

// Mock property data
const mockProperties = [
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
    listingType: "Buy"
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
    listingType: "Buy"
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
    listingType: "Rent"
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
    listingType: "Buy"
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
    listingType: "Buy"
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
    listingType: "Buy"
  }
];

interface PropertyListProps {
  filters?: Filters;
}

const PropertyList = ({ filters }: PropertyListProps) => {
  const [properties, setProperties] = useState(mockProperties);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (filters) {
      setLoading(true);
      
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
          if (filters.bedrooms && property.beds < parseInt(filters.bedrooms)) {
            return false;
          }
          
          // Filter by bathrooms if provided
          if (filters.bathrooms && property.baths < parseInt(filters.bathrooms)) {
            return false;
          }
          
          return true;
        });
        
        setProperties(filteredProperties);
        setLoading(false);
      }, 500);
    }
  }, [filters]);

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          Properties {properties.length > 0 ? `(${properties.length})` : ""}
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
      ) : properties.length > 0 ? (
        <Grid container spacing={3}>
          {properties.map((property) => (
            <Grid item xs={12} sm={6} md={4} key={property.id}>
              <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                <Box sx={{ position: "relative" }}>
                  <CardMedia
                    component="img"
                    height={220}
                    image={property.image}
                    alt={property.title}
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
                      <Typography variant="body2">{property.beds} beds</Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <BathtubIcon fontSize="small" sx={{ mr: 0.5 }} />
                      <Typography variant="body2">{property.baths} baths</Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <SquareFootIcon fontSize="small" sx={{ mr: 0.5 }} />
                      <Typography variant="body2">{property.sqft} sqft</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
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