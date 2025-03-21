import { useState } from "react";
import { Box, TextField, Button, Grid, MenuItem, Slider, Typography } from "@mui/material";

// Define Filters interface
export interface Filters {
  location: string;
  minPrice: number;
  maxPrice: number;
  bedrooms: string;
  bathrooms: string;
  propertyType: string;
  listingType: string;
}

const initialFilters: Filters = {
  location: "",
  minPrice: 0,
  maxPrice: 10000000,
  bedrooms: "",
  bathrooms: "",
  propertyType: "",
  listingType: "",
};

interface SearchFiltersProps {
  onFilterChange?: (filters: Filters) => void;
}

const SearchFilters = ({ onFilterChange }: SearchFiltersProps) => {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [priceRange, setPriceRange] = useState<number[]>([0, 10000000]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updatedFilters = { ...filters, [name]: value };
    setFilters(updatedFilters);
    if (onFilterChange) {
      onFilterChange(updatedFilters);
    }
  };

  const handlePriceChange = (_event: Event, newValue: number | number[]) => {
    const newValueArray = newValue as number[];
    setPriceRange(newValueArray);
    const updatedFilters = {
      ...filters,
      minPrice: newValueArray[0],
      maxPrice: newValueArray[1],
    };
    setFilters(updatedFilters);
    if (onFilterChange) {
      onFilterChange(updatedFilters);
    }
  };

  const handleReset = () => {
    setFilters(initialFilters);
    setPriceRange([0, 10000000]);
    if (onFilterChange) {
      onFilterChange(initialFilters);
    }
  };

  return (
    <Box sx={{ mt: 2, p: 3, bgcolor: "background.paper", borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h6" fontWeight="600">
              Filters
            </Typography>
            <Button 
              variant="text" 
              onClick={() => setShowAdvanced(!showAdvanced)}
              sx={{ textTransform: "none" }}
            >
              {showAdvanced ? "Hide Advanced Filters" : "Show Advanced Filters"}
            </Button>
          </Box>
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Location"
            name="location"
            value={filters.location}
            onChange={handleInputChange}
            placeholder="City, neighborhood, or address"
          />
        </Grid>

        <Grid item xs={12} md={8}>
          <Typography gutterBottom>Price Range ($)</Typography>
          <Box sx={{ px: 2 }}>
            <Slider
              value={priceRange}
              onChange={handlePriceChange}
              valueLabelDisplay="auto"
              min={0}
              max={10000000}
              step={50000}
              valueLabelFormat={(value) => `$${value.toLocaleString()}`}
            />
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary">$0</Typography>
              <Typography variant="body2" color="text.secondary">$10,000,000</Typography>
            </Box>
          </Box>
        </Grid>

        {showAdvanced && (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                label="Bedrooms"
                name="bedrooms"
                value={filters.bedrooms}
                onChange={handleInputChange}
              >
                <MenuItem value="">Any</MenuItem>
                <MenuItem value="1">1+</MenuItem>
                <MenuItem value="2">2+</MenuItem>
                <MenuItem value="3">3+</MenuItem>
                <MenuItem value="4">4+</MenuItem>
                <MenuItem value="5">5+</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                label="Bathrooms"
                name="bathrooms"
                value={filters.bathrooms}
                onChange={handleInputChange}
              >
                <MenuItem value="">Any</MenuItem>
                <MenuItem value="1">1+</MenuItem>
                <MenuItem value="2">2+</MenuItem>
                <MenuItem value="3">3+</MenuItem>
                <MenuItem value="4">4+</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                label="Property Type"
                name="propertyType"
                value={filters.propertyType}
                onChange={handleInputChange}
              >
                <MenuItem value="">Any</MenuItem>
                <MenuItem value="House">House</MenuItem>
                <MenuItem value="Apartment">Apartment</MenuItem>
                <MenuItem value="Condo">Condo</MenuItem>
                <MenuItem value="Villa">Villa</MenuItem>
                <MenuItem value="Townhouse">Townhouse</MenuItem>
                <MenuItem value="Penthouse">Penthouse</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                label="Listing Type"
                name="listingType"
                value={filters.listingType}
                onChange={handleInputChange}
              >
                <MenuItem value="">Any</MenuItem>
                <MenuItem value="Buy">For Sale</MenuItem>
                <MenuItem value="Rent">For Rent</MenuItem>
                <MenuItem value="New Development">New Development</MenuItem>
              </TextField>
            </Grid>
          </>
        )}

        <Grid item xs={12} sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 2 }}>
          <Button variant="outlined" onClick={handleReset}>
            Reset
          </Button>
          <Button 
            variant="contained"
            onClick={() => {
              if (onFilterChange) {
                onFilterChange(filters);
              }
            }}
          >
            Search
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SearchFilters; 