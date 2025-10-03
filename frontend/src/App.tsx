import { useState, type ReactElement } from 'react';
import { styled } from '@mui/material/styles';
import { Button, Typography, Container, Box } from '@mui/material';

const StyledCard = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[2],
  textAlign: 'center',
}));

function App(): ReactElement {
  const [count, setCount] = useState(0);

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Receipt Raven
        </Typography>
        <StyledCard>
          <Button
            variant="contained"
            onClick={() => setCount(count => count + 1)}
          >
            count is {count}
          </Button>
        </StyledCard>
      </Box>
    </Container>
  );
}

export default App;
