import { Box, styled, Typography } from '@mui/material';
import { ReactElement, useState } from 'react';
import { ReceiptList } from './components/receiptList.tsx';
import { useGetApiReceipts } from '../../api/generated/api.ts';
import { Receipt } from '../../api/generated/model/receipt.ts';
import { ReceiptPanel } from './components/receiptPanel.tsx';

const PageContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  backgroundColor: '#ffffff',
  overflow: 'hidden',
});

const MainContent = styled(Box)({
  flex: 1,
  display: 'flex',
  overflow: 'hidden',
  position: 'relative',
});

const ContentArea = styled(Box)(({ theme }) => ({
  flex: 1,
  overflow: 'auto',
  padding: theme.spacing(2, 3),
  backgroundColor: '#f9fafb',
}));

export function ReceiptListView(): ReactElement {
  const {
    isPending,
    isSuccess,
    data: result,
  } = useGetApiReceipts({
    query: { queryKey: ['receipts'] },
  });
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);

  return (
    <PageContainer>
      <MainContent>
        <ContentArea>
          {isPending && <Typography>Loading...</Typography>}
          {isSuccess && (
            <ReceiptList
              receipts={result}
              selectedReceiptId={selectedReceipt?.id}
              onRowClick={id => {
                const receipt = result.find(r => r.id === id) || null;
                setSelectedReceipt(receipt);
              }}
            />
          )}
        </ContentArea>
      </MainContent>

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
