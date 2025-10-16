import { AppBar, Box, Button, Toolbar, Typography } from '@mui/material';
import { Link } from '@tanstack/react-router';

export default function TopBar() {
  return (
    <AppBar position="static">
      <Toolbar disableGutters>
        <Box
          sx={{ flexGrow: 1, display: 'flex', paddingLeft: 3, paddingRight: 3 }}
        >
          <Typography
            variant="h6"
            component="div"
            sx={{ display: 'block', alignContent: 'center', marginRight: 4 }}
          >
            ReceiptRaven
          </Typography>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <Button
              key={'Receipts'}
              sx={{ my: 2, color: 'white', display: 'block' }}
            >
              Receipts
            </Button>
          </Link>
          <Link to="/jobs" style={{ textDecoration: 'none' }}>
            <Button
              key={'Jobs'}
              sx={{ my: 2, color: 'white', display: 'block' }}
            >
              Jobs
            </Button>
          </Link>
          <Link to="/upload" style={{ textDecoration: 'none' }}>
            <Button
              key={'Upload'}
              sx={{ my: 2, color: 'white', display: 'block' }}
            >
              Upload
            </Button>
          </Link>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
