import { Box, Typography, styled } from '@mui/material';
import { grey } from '@mui/material/colors';

interface DisplayFieldProps {
  label: string;
  value: string | number | null | undefined;
  fullWidth?: boolean;
}

const FieldCard = styled(Box)(({ theme }) => ({
  backgroundColor: grey[50],
  border: `1px solid ${grey[200]}`,
  borderRadius: theme.spacing(1),
  padding: theme.spacing(1.5),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5),
}));

export const DisplayField = ({
  label,
  value,
  fullWidth = false,
}: DisplayFieldProps) => {
  const displayValue = value ?? '—';

  return (
    <FieldCard sx={{ gridColumn: fullWidth ? '1 / -1' : 'auto' }}>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ fontWeight: 500, fontSize: '0.75rem' }}
      >
        {label}
      </Typography>
      <Typography
        variant="body1"
        color="text.primary"
        sx={{ fontWeight: 400, wordBreak: 'break-word' }}
      >
        {displayValue}
      </Typography>
    </FieldCard>
  );
};
