import { Box, styled } from '@mui/material';

export const ContentArea = styled(Box)(({ theme }) => ({
  flex: 1,
  overflow: 'auto',
  padding: theme.spacing(2, 3),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(0, 0),
  },
  backgroundColor: '#f9fafb',
}));
