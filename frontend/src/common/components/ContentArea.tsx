import { Box, styled } from '@mui/material';

export const ContentArea = styled(Box)(({ theme }) => ({
  flex: 1,
  overflow: 'auto',
  padding: theme.spacing(2, 3),
  backgroundColor: '#f9fafb',
}));
