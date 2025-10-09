import {
  Box,
  Card,
  CircularProgress,
  Grid,
  Stack,
  TextField,
} from '@mui/material';
import { GetApiReceipts200Item } from '../../../api/generated/model';
import { useModal } from '../hooks/useModal';
import { ReceiptImageModal } from './receiptImageModal.tsx';
import { Img } from '../../../common/components/Img.tsx';
import { useGetApiReceiptsReceiptIdItems } from '../../../api/generated/api.ts';
import { ReceiptItemList } from './receiptItemList.tsx';

function ReceiptPanel(props: { receipt: GetApiReceipts200Item }) {
  const { receipt } = props;
  const imgModal = useModal();

  const {
    isPending,
    isSuccess,
    data: result,
  } = useGetApiReceiptsReceiptIdItems(receipt.id.toString(10));

  return (
    <Box>
      <Card sx={{ p: 2 }}>
        <Grid container spacing={6}>
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
