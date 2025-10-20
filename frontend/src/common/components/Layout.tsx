import { Card, Box, styled, Typography } from '@mui/material';
import { ReactElement } from 'react';

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

export interface MobileCardRow {
  icon: ReactElement;
  primaryText: string;
  secondaryText?: string;
  tertiaryText?: string;
}

export function MobileCard(props: {
  row: MobileCardRow;
  onClick: () => void;
  selected?: boolean;
}): ReactElement {
  return (
    <Box
      onClick={props.onClick}
      sx={{
        p: 2,
        mb: 1,
        borderRadius: 1,
        border: '1px solid #f3f4f6',
        cursor: 'pointer',
        backgroundColor: props.selected ? '#eff6ff' : 'white',
        '&:hover': {
          backgroundColor: props.selected ? '#dbeafe' : '#eff6ff',
        },
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
        <Typography variant="body2" sx={{ color: '#6b7280' }}>
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
            sx={{ color: '#111827', fontWeight: 500, ml: '28px' }}
          >
            {props.row.secondaryText}
          </Typography>
          {props.row.tertiaryText && (
            <Typography
              variant="body1"
              sx={{ fontWeight: 600, color: '#111827' }}
            >
              {props.row.tertiaryText}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}
