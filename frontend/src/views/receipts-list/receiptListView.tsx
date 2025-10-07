import { Box, Typography } from '@mui/material';
import { ReactElement } from 'react';
import { ReceiptList } from './components/receiptList.tsx';
import { useGetApiReceipts } from '../../api/generated/api.ts';

export function ReceiptListView(): ReactElement {
  const { isPending, isSuccess, data: result } = useGetApiReceipts();

  return (
    <Box>
      <Typography variant="h1" gutterBottom>
        Receipts
      </Typography>
      {isPending && <span>Loading</span>}
      {isSuccess && <ReceiptList receipts={result.data}></ReceiptList>}
    </Box>
  );
}
