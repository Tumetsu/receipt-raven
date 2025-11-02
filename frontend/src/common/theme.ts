import { createTheme, ThemeOptions } from '@mui/material/styles';
import { responsiveFontSizes } from '@mui/material';

// Base theme options shared by both variants
const baseThemeOptions: ThemeOptions = {
  components: {
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '8px',
        },
      },
    },
  },
};

// Material theme - uses Material UI default colors
const materialThemeOptions: ThemeOptions = {
  ...baseThemeOptions,
  palette: {
    mode: 'light',
    // Uses Material UI defaults for all colors
  },
};

const materialThemeBase = createTheme(materialThemeOptions);
const materialThemeWithTypography = createTheme(materialThemeBase, {
  typography: {
    h1: {
      ...materialThemeBase.typography.h2,
    },
  },
});

const materialTheme = responsiveFontSizes(materialThemeWithTypography);
export const theme = materialTheme;
