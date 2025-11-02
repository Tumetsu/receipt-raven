import { Card, Box, styled, Typography } from '@mui/material';
import { ReactElement } from 'react';

export const PageContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: theme.palette.background.default,
  [theme.breakpoints.down('md')]: {
    minHeight: '100vh',
  },
}));

export const TableCard = styled(Card)(({ theme }) => ({
  width: '100%',
  borderRadius: '8px',
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
}));

export interface MobileCardRow {
  icon: ReactElement;
  primaryText: string;
  secondaryText?: string;
  tertiaryText?: string;
}

export function MobileCard(props: {
  row: MobileCardRow;
  onClick: () => void;
}): ReactElement {
  return (
    <Box
      onClick={props.onClick}
      sx={{
        p: 2,
        mb: 1,
        borderRadius: 1,
        border: theme => `1px solid ${theme.palette.grey[100]}`,
        cursor: 'pointer',
        backgroundColor: 'background.paper',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: props.row.secondaryText ? 1 : 0,
        }}
      >
        {props.row.icon}
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {props.row.primaryText}
        </Typography>
      </Box>
      {props.row.secondaryText && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography
            variant="body1"
            sx={{ color: 'text.primary', fontWeight: 500, ml: '28px' }}
          >
            {props.row.secondaryText}
          </Typography>
          {props.row.tertiaryText && (
            <Typography
              variant="body1"
              sx={{ fontWeight: 600, color: 'text.primary' }}
            >
              {props.row.tertiaryText}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}
