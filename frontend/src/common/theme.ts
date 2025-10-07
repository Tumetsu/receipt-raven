import { createTheme } from '@mui/material/styles';
import { responsiveFontSizes } from '@mui/material';

const base = createTheme({
  palette: { mode: 'light' },
});

// Overwrite typography variants
const customTypography = createTheme(base, {
  typography: {
    h1: {
      ...base.typography.h2,
    },
  },
});

export const theme = responsiveFontSizes(customTypography);
