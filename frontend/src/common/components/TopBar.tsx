import {
  AppBar,
  Box,
  Button,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';

export default function TopBar() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const allNavItems = [
    { label: 'Receipts', path: '/' },
    { label: 'Jobs', path: '/jobs' },
    { label: 'Upload', path: '/upload' },
  ];

  return (
    <AppBar position="sticky">
      <Toolbar disableGutters>
        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 3,
            paddingRight: 3,
          }}
        >
          <Typography
            variant="h6"
            component="div"
            sx={{ display: 'block', marginRight: 'auto' }}
          >
            ReceiptRaven
          </Typography>

          {isMobile ? (
            <>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Link to="/" style={{ textDecoration: 'none' }}>
                  <IconButton
                    color="inherit"
                    aria-label="receipts"
                    sx={{ color: 'white' }}
                  >
                    <ReceiptLongIcon />
                  </IconButton>
                </Link>
                <Link to="/upload" style={{ textDecoration: 'none' }}>
                  <IconButton
                    color="inherit"
                    aria-label="upload"
                    sx={{ color: 'white' }}
                  >
                    <PhotoCameraIcon />
                  </IconButton>
                </Link>
              </Box>
              <IconButton
                color="inherit"
                aria-label="open navigation menu"
                edge="end"
                onClick={() => setDrawerOpen(true)}
              >
                <MenuIcon />
              </IconButton>
              <Drawer
                anchor="right"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
              >
                <Box
                  sx={{
                    width: 250,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                  role="presentation"
                >
                  <List>
                    {allNavItems.map(item => (
                      <ListItem key={item.label} disablePadding>
                        <Link
                          to={item.path}
                          style={{ textDecoration: 'none', width: '100%' }}
                          onClick={() => setDrawerOpen(false)}
                        >
                          <ListItemButton>
                            <ListItemText primary={item.label} />
                          </ListItemButton>
                        </Link>
                      </ListItem>
                    ))}
                  </List>
                  <Box
                    sx={{
                      marginTop: 'auto',
                      padding: 2,
                      borderTop: '1px solid #e0e0e0',
                      backgroundColor: '#f5f5f5',
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Version: {__GIT_COMMIT_HASH__}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                    >
                      Built: {new Date(__BUILD_TIMESTAMP__).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              </Drawer>
            </>
          ) : (
            <Box sx={{ display: 'flex' }}>
              {allNavItems.map(item => (
                <Link
                  key={item.label}
                  to={item.path}
                  style={{ textDecoration: 'none' }}
                >
                  <Button sx={{ my: 2, color: 'white', display: 'block' }}>
                    {item.label}
                  </Button>
                </Link>
              ))}
            </Box>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
