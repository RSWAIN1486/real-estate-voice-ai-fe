import { Box, Container, Typography, Link, Grid, IconButton, useTheme, Divider } from '@mui/material';
import {
  Facebook as FacebookIcon,
  Instagram as InstagramIcon,
  Twitter as TwitterIcon,
  YouTube as YouTubeIcon,
  LocalPizza as PizzaIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon
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
                <PizzaIcon sx={{ mr: 1, fontSize: '2rem', transform: 'rotate(45deg)' }} />
                <Typography 
                  variant="h6" 
                  className={styles.footerLogo}
                  sx={{
                    fontFamily: 'Montserrat, sans-serif',
                    fontWeight: 800,
                  }}
                >
                  DONTMINOS
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ mt: 2, mb: 2 }}>
                Your favorite pizza delivered fresh and hot to your doorstep.
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
              <li><Link href="/" color="inherit">Menu</Link></li>
              <li><Link href="/profile" color="inherit">My Account</Link></li>
              <li><Link href="/cart" color="inherit">Track Order</Link></li>
              <li><Link href="#" color="inherit">Deals & Offers</Link></li>
              <li><Link href="#" color="inherit">Locations</Link></li>
            </ul>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" className={styles.sectionTitle}>Our Menu</Typography>
            <ul className={styles.footerLinks}>
              <li><Link href="/" color="inherit">Pizzas</Link></li>
              <li><Link href="/" color="inherit">Sides</Link></li>
              <li><Link href="/" color="inherit">Beverages</Link></li>
              <li><Link href="/" color="inherit">Desserts</Link></li>
              <li><Link href="/" color="inherit">Create Your Own</Link></li>
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
                <Typography variant="body2">contact@dontminos.com</Typography>
              </Box>
              <Box className={styles.contactItem}>
                <LocationIcon fontSize="small" />
                <Typography variant="body2">123 Pizza Street, Foodville, CA 90210</Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ mt: 4, mb: 3, opacity: 0.2 }} />
        
        <Box className={styles.bottomFooter}>
          <Typography variant="body2" align="center">
            © {new Date().getFullYear()} Dontminos. All rights reserved.
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