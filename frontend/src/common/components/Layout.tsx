import { Card, Box, styled } from '@mui/material';

export const PageContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  backgroundColor: '#f9fafb',
  overflow: 'hidden',
});

export const TableCard = styled(Card)({
  height: '100%',
  width: '100%',
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
  overflow: 'hidden',
  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
});
