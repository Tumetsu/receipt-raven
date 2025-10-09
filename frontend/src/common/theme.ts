import { createTheme } from '@mui/material/styles';
import { responsiveFontSizes } from '@mui/material';

const base = createTheme({
  palette: { mode: 'light' },
  components: {
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '8px', // or theme.spacing(1)
        },
      },
    },
  },
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
