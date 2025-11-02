import { Box, styled } from '@mui/material';

export const ContentArea = styled(Box)(({ theme }) => ({
  flex: 1,
  padding: theme.spacing(2, 3),
  paddingBottom: theme.spacing(12),
  backgroundColor: '#f9fafb',
  [theme.breakpoints.up('md')]: {
    marginBottom: 6,
  },
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(1, 1),
  },
}));
