import { Box, Card, Grid, TextField } from '@mui/material';
import { GetApiReceipts200Item } from '../../../api/generated/model';
import { useModal } from '../hooks/useModal';
import { ReceiptImageModal } from './receiptImageModal.tsx';
import { Img } from '../../../common/components/Img.tsx';

export function ReceiptPanel(props: { receipt: GetApiReceipts200Item }) {
  const { receipt } = props;
  const imgModal = useModal();
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
            <Img
              sx={{ height: '20' }}
              src={receipt.filepath}
              alt="Receipt"
              onClick={imgModal.openModal}
            />
          </Grid>
        </Grid>
      </Card>
      <ReceiptImageModal
        open={imgModal.isOpen}
        onClose={imgModal.onModalClose}
        imagePath={receipt.filepath}
      />
    </Box>
  );
}
