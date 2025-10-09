import { Box, Card, Grid, styled, TextField } from '@mui/material';
import { GetApiReceipts200Item } from '../../../api/generated/model';

const StyledImg = styled('img')({
  width: '100%',
  height: '20',
  objectFit: 'cover',
  borderRadius: '8px',
});

export function ReceiptPanel(props: { receipt: GetApiReceipts200Item }) {
  const { receipt } = props;
  return (
    <Box>
      <Card sx={{ p: 2 }}>
        <Grid container spacing={2}>
          <Grid size={6}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="Payee" value={receipt.payeeName} required />
              <TextField label="Date" value={receipt.date} required />
              <TextField label="Total sum" value={receipt.totalSum} required />
            </Box>
          </Grid>
          <Grid size={6}>
            <StyledImg src={receipt.filepath} alt="Receipt" />
          </Grid>
        </Grid>
      </Card>
    </Box>
  );
}
