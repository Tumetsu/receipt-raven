import { Box, Button, Typography } from '@mui/material';
import { ReactElement, useState } from 'react';
import { ReceiptList } from './components/receiptList.tsx';
import { useGetApiReceipts } from '../../api/generated/api.ts';
import { Receipt, ReceiptPanel } from './components/receiptPanel.tsx';
import { ContentArea } from '../../common/components/ContentArea.tsx';
import { PageContainer } from '../../common/components/Layout.tsx';
import { useAccounts } from './hooks/useGetAccounts.ts';
import { useExpenseAccounts } from './hooks/useExpenseAccounts.ts';

function ReceiptListControls({
  onAddClick,
}: {
  onAddClick: () => void;
}): ReactElement {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
      <Button onClick={onAddClick}>Add manually</Button>
    </Box>
  );
}

export function ReceiptListView(): ReactElement {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);

  const {
    isPending,
    isSuccess,
    data: result,
  } = useGetApiReceipts(
    { page, pageSize },
    {
      query: { queryKey: ['receipts', page, pageSize] },
    }
  );
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);

  // Preload expense accounts to cache for when opening the receipt panel
  useExpenseAccounts();
  useAccounts();

  const addReceiptManually = () => {
    setSelectedReceipt({
      id: null,
      payee: '',
      description: '',
      sourceAccount: '',
      date: new Date().toISOString().split('T')[0],
      totalSum: 0,
      status: 'unapproved',
      filename: null,
      fileUrl: null,
    });
  };

  return (
    <PageContainer>
      <ContentArea>
        {isPending && <Typography>Loading...</Typography>}
        {isSuccess && result && (
          <Box>
            <ReceiptListControls onAddClick={addReceiptManually} />
            <ReceiptList
              receipts={result.receipts}
              totalReceipts={result.total}
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              onRowClick={id => {
                const receipt = result.receipts.find(r => r.id === id) || null;
                setSelectedReceipt(receipt);
              }}
            />
          </Box>
        )}
      </ContentArea>

      {selectedReceipt && (
        <ReceiptPanel
          receipt={selectedReceipt}
          onApprove={() => setSelectedReceipt(null)}
          onClosePanel={() => setSelectedReceipt(null)}
        />
      )}
    </PageContainer>
  );
}
