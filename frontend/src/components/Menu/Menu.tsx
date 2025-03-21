import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  Typography, 
  Button,
  Container,
  CircularProgress,
  Tabs,
  Tab,
  Box,
  useTheme,
  Alert,
  Skeleton,
  Paper,
  Chip,
  Divider,
  IconButton,
  Zoom,
  useMediaQuery
} from '@mui/material';
import { 
  Add as AddIcon, 
  LocalPizza as PizzaIcon, 
  LocalDrink as DrinkIcon,
  Restaurant as SidesIcon,
  Cake as DessertIcon,
  FiberNew as NewIcon,
  Favorite as FavoriteIcon,
  Search as SearchIcon,
  Mic as MicIcon
} from '@mui/icons-material';
import { RootState } from '../../store/store';
import { addItem } from '../../store/slices/orderSlice';
import { setMenuItems, setLoading, setError, MenuItem } from '../../store/slices/menuSlice';
import { getMenuItems } from '../../services/menuService';
import { 
  formatPrice, 
  getOptimizedImageUrl, 
  handleImageError as utilHandleImageError 
} from '../../utils/reusableFns';
import { API_BASE_URL } from '../../utils/CONSTANTS';
import styles from './Menu.module.css';
import VoiceAgent from '../VoiceAgent/VoiceAgent';

const Menu: React.FC = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [voiceAgentOpen, setVoiceAgentOpen] = useState(false);
  
  const { items, loading, error } = useSelector((state: RootState) => state.menu);
  
  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        dispatch(setLoading(true));
        const data = await getMenuItems();
        console.log('Fetched menu items:', data);
        dispatch(setMenuItems(Array.isArray(data) ? data : []));
      } catch (err) {
        console.error('Error in fetchMenuItems:', err);
        dispatch(setError(err instanceof Error ? err.message : 'Failed to fetch menu items'));
      }
    };

    fetchMenuItems();
  }, [dispatch]);

  const categories = ['all', ...Array.from(new Set(items.map(item => item.category)))];
  
  const filteredItems = selectedCategory === 'all' 
    ? items 
    : items.filter(item => item.category === selectedCategory);

  const handleAddToCart = (item: MenuItem) => {
    dispatch(addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: 1
    }));
  };

  // Function to get image URL with fallback using the utility
  const getImageUrl = useCallback((imageName: string) => {
    return getOptimizedImageUrl(API_BASE_URL, imageName);
  }, []);

  // Handle image loading errors using the utility
  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement, Event>, itemName: string) => {
    utilHandleImageError(e, itemName);
  }, []);

  // Function to get category icon
  const getCategoryIcon = (category: string) => {
    switch(category.toLowerCase()) {
      case 'pizza':
        return <PizzaIcon />;
      case 'beverages':
        return null;
      case 'sides':
        return <SidesIcon />;
      case 'desserts':
        return <DessertIcon />;
      default:
        return null;
    }
  };

  const openVoiceAgent = () => {
    setVoiceAgentOpen(true);
  };

  const closeVoiceAgent = () => {
    setVoiceAgentOpen(false);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" className={styles.container}>
        <Paper elevation={0} className={styles.categoryPaper}>
          <Skeleton variant="rectangular" height={48} />
        </Paper>
        <Grid container spacing={3} sx={{ mt: 4 }}>
          {[1, 2, 3, 4, 5, 6].map((key) => (
            <Grid item xs={12} sm={6} md={4} key={key}>
              <Card className={styles['menu-card-skeleton']}>
                <Skeleton variant="rectangular" height={200} />
                <CardContent>
                  <Skeleton variant="text" height={32} />
                  <Skeleton variant="text" height={20} />
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                    <Skeleton variant="text" width={80} />
                    <Skeleton variant="rectangular" width={120} height={36} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" className={styles.container}>
        <Alert 
          severity="error" 
          sx={{ mt: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => window.location.reload()}>
              RETRY
            </Button>
          }
        >
          {error}
        </Alert>
      </Container>
    );
  }

  if (!items.length) {
    return (
      <Container maxWidth="lg" className={styles.container}>
        <Alert severity="info" sx={{ mt: 2 }}>
          No menu items available. Please check back later.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" className={styles.container}>
      <Box className={styles.heroSection}>
        <Typography variant="h3" component="h1" className={styles.menuTitle}>
          Our Menu
        </Typography>
        <Typography variant="subtitle1" className={styles.menuSubtitle}>
          Crafted with quality ingredients for the perfect flavor
        </Typography>
        <Button
          variant="contained"
          color="secondary"
          className={styles.voiceAgentButton}
          startIcon={<MicIcon />}
          onClick={openVoiceAgent}
        >
          Try our Voice Agent
        </Button>
      </Box>
      
      <Paper elevation={2} className={styles.categoryPaper}>
        <Tabs 
          value={selectedCategory}
          onChange={(_, newValue) => setSelectedCategory(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          className={styles.categoryTabs}
          TabIndicatorProps={{
            style: {
              backgroundColor: theme.palette.secondary.main,
              height: 3,
              borderRadius: '3px'
            }
          }}
        >
          <Tab 
            label="All" 
            value="all"
            icon={<SearchIcon />}
            iconPosition="start"
            className={styles.categoryTab}
          />
          {categories.filter(c => c !== 'all').map(category => (
            <Tab 
              key={category} 
              label={category.charAt(0).toUpperCase() + category.slice(1)} 
              value={category}
              icon={getCategoryIcon(category)}
              iconPosition="start"
              className={styles.categoryTab}
            />
          ))}
        </Tabs>
      </Paper>
      
      <Box className={styles.categoryHeading}>
        <Typography variant="h5" component="h2">
          {selectedCategory === 'all' 
            ? 'All Items' 
            : selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
        </Typography>
        <Divider sx={{ mb: 3, mt: 1 }} />
      </Box>
      
      <Grid container spacing={3}>
        {filteredItems.map((item, index) => (
          <Grid item xs={12} sm={6} md={4} key={item.id}>
            <Zoom in={true} style={{ transitionDelay: `${index * 100}ms` }}>
              <Card className={styles['menu-card']}>
                <div className={styles.imageContainer}>
                  <CardMedia
                    component="img"
                    height="200"
                    image={getImageUrl(item.image)}
                    alt={item.name}
                    className={styles.cardMedia}
                    onError={(e) => handleImageError(e, item.name)}
                  />
                  {item.isVeg && (
                    <div className={styles.vegBadge}>
                      <div className={styles.vegIndicator}></div>
                    </div>
                  )}
                  {/* New Item Ribbon (for demo purposes on some items) */}
                  {index % 5 === 0 && (
                    <div className={styles.ribbon}>
                      <span>NEW</span>
                    </div>
                  )}
                </div>
                <CardContent className={styles.cardContent}>
                  <Box className={styles.titleRow}>
                    <Typography gutterBottom variant="h6" component="div" className={styles.itemName}>
                      {item.name}
                    </Typography>
                    <IconButton 
                      size="small" 
                      className={styles.favoriteButton}
                    >
                      <FavoriteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  
                  <Chip 
                    label={item.category}
                    size="small"
                    icon={getCategoryIcon(item.category)}
                    className={styles.categoryChip}
                  />
                  
                  <Typography variant="body2" color="text.secondary" className={styles.itemDescription}>
                    {item.description}
                  </Typography>
                  
                  <Box className={styles.cardFooter}>
                    <Typography variant="h6" color="primary" className={styles.price}>
                      {formatPrice(item.price)}
                    </Typography>
                    <Button 
                      variant="contained" 
                      color="primary"
                      className={styles.addButton}
                      endIcon={<AddIcon />}
                      onClick={() => handleAddToCart(item)}
                    >
                      {isMobile ? 'Add' : 'Add to Cart'}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>
        ))}
      </Grid>

      {/* Voice Agent Dialog */}
      <VoiceAgent open={voiceAgentOpen} onClose={closeVoiceAgent} />
    </Container>
  );
};

export default Menu; 