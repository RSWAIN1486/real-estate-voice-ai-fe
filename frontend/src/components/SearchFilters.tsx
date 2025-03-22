import { useState } from "react";
import {
  Box,
  Grid,
  TextField,
  MenuItem,
  Button,
  Slider,
  Typography,
  Paper,
  InputAdornment,
  Chip,
  FormControlLabel,
  Checkbox,
  Autocomplete,
  Divider,
} from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

// Define Filters interface
export interface Filters {
  location: string;
  minPrice: number;
  maxPrice: number;
  bedrooms: string;
  bathrooms: string;
  propertyType: string;
  listingType: string;
  minArea: number;
  maxArea: number;
  selectedFeatures: string[];
  viewType: string;
  nearbyAmenities: string[];
  yearBuilt: string;
  isPetFriendly: boolean;
  isFurnished: boolean;
}

const initialFilters: Filters = {
  location: "",
  minPrice: 0,
  maxPrice: 10000000,
  bedrooms: "",
  bathrooms: "",
  propertyType: "",
  listingType: "",
  minArea: 0,
  maxArea: 10000,
  selectedFeatures: [],
  viewType: "",
  nearbyAmenities: [],
  yearBuilt: "",
  isPetFriendly: false,
  isFurnished: false,
};

const propertyTypes = [
  "Apartment",
  "Villa",
  "Townhouse",
  "Penthouse",
  "Office",
  "Retail",
  "Duplex",
  "Land",
  "House",
  "Condo",
];

const listingTypes = ["For Sale", "For Rent", "New Development"];

const features = [
  "Balcony",
  "Private Pool",
  "Garden",
  "Gym",
  "Smart Home",
  "Walk-in Closet",
  "Parking",
  "Concierge",
  "24/7 Security",
  "Elevator",
  "Storage Room",
  "Maid's Room",
  "Study Room",
];

const viewTypes = [
  "Sea View",
  "City View",
  "Garden View",
  "Mountain View",
  "Pool View",
  "Lake View",
  "Golf Course View",
  "Park View",
];

const nearbyAmenities = [
  "Supermarket",
  "Metro Station",
  "School",
  "Hospital",
  "Shopping Mall",
  "Beach",
  "Restaurant",
  "Pharmacy",
  "Gym",
  "Park",
  "Airport",
  "Bus Station",
];

const yearBuiltOptions = [
  "2023 or newer",
  "2020 - 2022",
  "2015 - 2019",
  "2010 - 2014",
  "2000 - 2009",
  "Before 2000",
];

// Define component props
interface SearchFiltersProps {
  onFilterChange: (filters: Filters) => void;
  initialFilters?: Filters;
}

const SearchFilters = ({ onFilterChange, initialFilters = initialFilters }: SearchFiltersProps) => {
  const [filters, setFilters] = useState<Filters>(initialFilters || initialFilters);
  const [priceRange, setPriceRange] = useState<number[]>([0, 10000000]);
  const [areaRange, setAreaRange] = useState<number[]>([0, 10000]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updatedFilters = { ...filters, [name]: value };
    setFilters(updatedFilters);
    if (onFilterChange) {
      onFilterChange(updatedFilters);
    }
  };

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;
    const updatedFilters = {
      ...filters,
      [name]: checked,
    };
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

  const handleAreaChange = (event: Event, newValue: number | number[]) => {
    const newValueArray = newValue as number[];
    setAreaRange(newValueArray);
    const updatedFilters = {
      ...filters,
      minArea: newValueArray[0],
      maxArea: newValueArray[1],
    };
    setFilters(updatedFilters);
    if (onFilterChange) {
      onFilterChange(updatedFilters);
    }
  };

  const handleReset = () => {
    setFilters(initialFilters);
    setPriceRange([0, 10000000]);
    setAreaRange([0, 10000]);
    if (onFilterChange) {
      onFilterChange(initialFilters);
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{ p: 3, mb: 4 }}
      className="search-filters-container"
    >
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <FilterListIcon /> Filters
          </Typography>
          <Button 
            variant="text" 
            onClick={() => setShowAdvanced(!showAdvanced)}
            endIcon={<ExpandMoreIcon />}
            sx={{ textTransform: "none" }}
          >
            {showAdvanced ? "Hide Advanced Filters" : "Show Advanced Filters"}
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Basic Filters */}
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Location"
            name="location"
            value={filters.location}
            onChange={handleInputChange}
            placeholder="Enter city, area or landmark"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        <Grid item xs={12} md={8}>
          <Typography gutterBottom>Price Range ($)</Typography>
          <Slider
            value={priceRange}
            onChange={handlePriceChange}
            valueLabelDisplay="auto"
            min={0}
            max={10000000}
            step={50000}
            valueLabelFormat={(value) => `$${value.toLocaleString()}`}
          />
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              ${priceRange[0].toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ${priceRange[1].toLocaleString()}
            </Typography>
          </Box>
        </Grid>

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
            {[1, 2, 3, 4, 5, "5+"].map((num) => (
              <MenuItem key={num} value={num}>
                {num} {typeof num === "number" ? (num === 1 ? "Bedroom" : "Bedrooms") : "Bedrooms"}
              </MenuItem>
            ))}
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
            {[1, 2, 3, 4, "4+"].map((num) => (
              <MenuItem key={num} value={num}>
                {num} {typeof num === "number" ? (num === 1 ? "Bathroom" : "Bathrooms") : "Bathrooms"}
              </MenuItem>
            ))}
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
            {propertyTypes.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
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
            {listingTypes.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Advanced Filters (Collapsible) */}
        {showAdvanced && (
          <>
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom>
                Advanced Filters
              </Typography>
            </Grid>

            {/* Area Range */}
            <Grid item xs={12} md={6}>
              <Typography gutterBottom>Area Range (sq ft)</Typography>
              <Slider
                value={areaRange}
                onChange={handleAreaChange}
                valueLabelDisplay="auto"
                min={0}
                max={10000}
                step={100}
                valueLabelFormat={(value) => `${value.toLocaleString()} sqft`}
              />
              <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {areaRange[0].toLocaleString()} sqft
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {areaRange[1].toLocaleString()} sqft
                </Typography>
              </Box>
            </Grid>

            {/* Year Built */}
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Year Built"
                name="yearBuilt"
                value={filters.yearBuilt}
                onChange={handleInputChange}
              >
                <MenuItem value="">Any</MenuItem>
                {yearBuiltOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* View Type */}
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="View"
                name="viewType"
                value={filters.viewType}
                onChange={handleInputChange}
              >
                <MenuItem value="">Any</MenuItem>
                {viewTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Checkboxes */}
            <Grid item xs={12} md={6}>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.isPetFriendly}
                      onChange={handleCheckboxChange}
                      name="isPetFriendly"
                    />
                  }
                  label="Pet Friendly"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.isFurnished}
                      onChange={handleCheckboxChange}
                      name="isFurnished"
                    />
                  }
                  label="Furnished"
                />
              </Box>
            </Grid>

            {/* Property Features */}
            <Grid item xs={12} md={6}>
              <Autocomplete
                multiple
                id="property-features"
                options={features}
                value={filters.selectedFeatures}
                onChange={(event, newValue) => {
                  const updatedFilters = { ...filters, selectedFeatures: newValue };
                  setFilters(updatedFilters);
                  if (onFilterChange) {
                    onFilterChange(updatedFilters);
                  }
                }}
                renderInput={(params) => (
                  <TextField {...params} variant="outlined" label="Property Features" placeholder="Select features" />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                  ))
                }
              />
            </Grid>

            {/* Nearby Amenities */}
            <Grid item xs={12} md={6}>
              <Autocomplete
                multiple
                id="nearby-amenities"
                options={nearbyAmenities}
                value={filters.nearbyAmenities}
                onChange={(event, newValue) => {
                  const updatedFilters = { ...filters, nearbyAmenities: newValue };
                  setFilters(updatedFilters);
                  if (onFilterChange) {
                    onFilterChange(updatedFilters);
                  }
                }}
                renderInput={(params) => (
                  <TextField {...params} variant="outlined" label="Nearby Amenities" placeholder="Select amenities" />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                  ))
                }
              />
            </Grid>
          </>
        )}

        <Grid item xs={12}>
          <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
            <Button
              variant="outlined"
              onClick={handleReset}
              sx={{ minWidth: 100 }}
            >
              Reset
            </Button>
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              sx={{ minWidth: 100 }}
              onClick={() => {
                if (onFilterChange) {
                  onFilterChange(filters);
                }
              }}
            >
              Search
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default SearchFilters; 