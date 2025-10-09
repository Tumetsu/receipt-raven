import { Box, Card, Grid, Stack, TextField } from '@mui/material';
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
          <Grid
            size={{
              xs: 12,
              lg: 12,
            }}
          >
            <Stack
              spacing={2}
              useFlexGap
              direction={{
                xs: 'column-reverse',
                lg: 'row',
              }}
            >
              <Stack spacing={2} useFlexGap>
                <TextField label="Payee" value={receipt.payeeName} required />
                <TextField label="Date" value={receipt.date} required />
                <TextField
                  label="Total sum"
                  value={receipt.totalSum}
                  required
                />
              </Stack>
              <Img
                sx={{
                  height: '20',
                  width: {
                    xs: '100%',
                    lg: '50%',
                  },
                }}
                src={receipt.filepath}
                alt="Receipt"
                onClick={imgModal.openModal}
              />
            </Stack>
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
