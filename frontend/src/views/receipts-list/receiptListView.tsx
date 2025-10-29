import { Typography } from '@mui/material';
import { ReactElement, useState } from 'react';
import { ReceiptList } from './components/receiptList.tsx';
import { useGetApiReceipts } from '../../api/generated/api.ts';
import { ReceiptPanel } from './components/receiptPanel.tsx';
import { ContentArea } from '../../common/components/ContentArea.tsx';
import { PageContainer } from '../../common/components/Layout.tsx';
import { useAccounts } from './hooks/useGetAccounts.ts';
import { useExpenseAccounts } from './hooks/useExpenseAccounts.ts';
import { GetApiReceipts200ReceiptsItem } from '../../api/generated/model';

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
  const [selectedReceipt, setSelectedReceipt] =
    useState<GetApiReceipts200ReceiptsItem | null>(null);

  // Preload expense accounts to cache for when opening the receipt panel
  useExpenseAccounts();
  useAccounts();

  return (
    <PageContainer>
      <ContentArea>
        {isPending && <Typography>Loading...</Typography>}
        {isSuccess && result && (
          <ReceiptList
            receipts={result.receipts}
            selectedReceiptId={selectedReceipt?.id}
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
