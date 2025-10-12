import {
  AppBar,
  Box,
  Button,
  Container,
  Toolbar,
  Typography,
} from '@mui/material';
import { Link } from '@tanstack/react-router';

export default function TopBar() {
  return (
    <AppBar position="static" sx={{ marginBottom: 3 }}>
      <Container>
        <Toolbar disableGutters>
          <Box sx={{ flexGrow: 1, display: 'flex' }}>
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
      </Container>
    </AppBar>
  );
}
