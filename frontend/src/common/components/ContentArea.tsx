import { Box, styled } from '@mui/material';

export const ContentArea = styled(Box)(({ theme }) => ({
  flex: 1,
  padding: theme.spacing(2, 3),
  backgroundColor: '#f9fafb',
  // Desktop: scrollable container for DataGrid
  [theme.breakpoints.up('md')]: {
    overflow: 'auto',
    overflowX: 'hidden',
  },
  // Mobile: no overflow, use body scroll
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(1, 1),
  },
}));
