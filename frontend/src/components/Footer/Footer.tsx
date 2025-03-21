import { Box, Container, Typography, Link, Grid, IconButton, useTheme, Divider } from '@mui/material';
import {
  Facebook as FacebookIcon,
  Instagram as InstagramIcon,
  Twitter as TwitterIcon,
  YouTube as YouTubeIcon,
  LocalPizza as PizzaIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  AccountBalance as BuildingIcon
} from '@mui/icons-material';
import styles from './Footer.module.css';

const Footer = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box className={styles.footer}>
      <Container maxWidth="lg">
        <Grid container spacing={4} className={styles.footerGrid}>
          <Grid item xs={12} sm={6} md={3}>
            <Box className={styles.logoSection}>
              <Box className={styles.logoContainer}>
                <BuildingIcon sx={{ mr: 1, fontSize: '2rem' }} />
                <Typography 
                  variant="h6" 
                  className={styles.footerLogo}
                  sx={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 800,
                  }}
                >
                  Global Estates
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ mt: 2, mb: 2 }}>
                Your trusted partner in finding your dream property across the globe.
              </Typography>
              <Box className={styles.socialIcons}>
                <IconButton color="inherit" aria-label="facebook" className={styles.socialIcon}>
                  <FacebookIcon />
                </IconButton>
                <IconButton color="inherit" aria-label="instagram" className={styles.socialIcon}>
                  <InstagramIcon />
                </IconButton>
                <IconButton color="inherit" aria-label="twitter" className={styles.socialIcon}>
                  <TwitterIcon />
                </IconButton>
                <IconButton color="inherit" aria-label="youtube" className={styles.socialIcon}>
                  <YouTubeIcon />
                </IconButton>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" className={styles.sectionTitle}>Quick Links</Typography>
            <ul className={styles.footerLinks}>
              <li><Link href="/" color="inherit">Buy</Link></li>
              <li><Link href="/menu" color="inherit">Rent</Link></li>
              <li><Link href="/cart" color="inherit">Sell</Link></li>
              <li><Link href="/profile" color="inherit">About</Link></li>
              <li><Link href="#" color="inherit">Contact</Link></li>
            </ul>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" className={styles.sectionTitle}>Property Types</Typography>
            <ul className={styles.footerLinks}>
              <li><Link href="/" color="inherit">Apartments</Link></li>
              <li><Link href="/" color="inherit">Houses</Link></li>
              <li><Link href="/" color="inherit">Villas</Link></li>
              <li><Link href="/" color="inherit">Penthouses</Link></li>
              <li><Link href="/" color="inherit">Commercial</Link></li>
            </ul>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" className={styles.sectionTitle}>Contact Us</Typography>
            <Box className={styles.contactInfo}>
              <Box className={styles.contactItem}>
                <PhoneIcon fontSize="small" />
                <Typography variant="body2">+1 (555) 123-4567</Typography>
              </Box>
              <Box className={styles.contactItem}>
                <EmailIcon fontSize="small" />
                <Typography variant="body2">contact@globalestates.com</Typography>
              </Box>
              <Box className={styles.contactItem}>
                <LocationIcon fontSize="small" />
                <Typography variant="body2">123 Real Estate Blvd, New York, NY 10001</Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ mt: 4, mb: 3, opacity: 0.2 }} />
        
        <Box className={styles.bottomFooter}>
          <Typography variant="body2" align="center">
            © {new Date().getFullYear()} Global Estates. All rights reserved.
          </Typography>
          <Box className={styles.footerPolicies}>
            <Link color="inherit" href="#" underline="hover">Privacy Policy</Link>
            <Link color="inherit" href="#" underline="hover">Terms of Service</Link>
            <Link color="inherit" href="#" underline="hover">Accessibility</Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer; 