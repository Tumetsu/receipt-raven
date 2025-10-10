import {
  Box,
  Button,
  Card,
  CircularProgress,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { GetApiReceipts200Item } from '../../../api/generated/model';
import { useModal } from '../hooks/useModal';
import { ReceiptImageModal } from './receiptImageModal.tsx';
import { Img } from '../../../common/components/Img.tsx';
import { useGetApiReceiptsReceiptIdItems } from '../../../api/generated/api.ts';
import { ReceiptItemList } from './receiptItemList.tsx';
import { useAccounts } from '../hooks/useGetAccounts.ts';
import { ComboBox } from '../../../common/components/comboBox.tsx';

function ReceiptPanel(props: { receipt: GetApiReceipts200Item }) {
  const { receipt } = props;
  const imgModal = useModal();

  const {
    isPending,
    isSuccess,
    data: result,
  } = useGetApiReceiptsReceiptIdItems(receipt.id.toString(10));

  const accounts = useAccounts();
  return (
    <Box>
      <Card sx={{ p: 2 }}>
        <Grid container spacing={4}>
          <Grid size={12}>
            <Stack spacing={2} useFlexGap>
              <Typography variant="h4">Receipt details</Typography>
              {accounts.isSuccess && (
                <ComboBox options={accounts.data} label="Account" required />
              )}
            </Stack>
          </Grid>
          <Grid size={12}>
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
                <Stack spacing={2} direction="row" useFlexGap>
                  <Button fullWidth variant="contained">
                    Approve
                  </Button>
                  <Button fullWidth variant="outlined">
                    Delete
                  </Button>
                </Stack>
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
          <Grid size={12}>
            {isPending && (
              <Box
                sx={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <CircularProgress />
              </Box>
            )}
            {isSuccess && <ReceiptItemList items={result.data} />}
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

export default ReceiptPanel;
