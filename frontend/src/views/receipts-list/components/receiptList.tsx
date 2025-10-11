import { Card } from '@mui/material';
import { DataGrid, GridColDef, GridRowParams } from '@mui/x-data-grid';
import { ReactElement } from 'react';
import { Receipt } from '../../../api/generated/model';

export function ReceiptList(props: {
  receipts: Receipt[];
  onRowClick: (id: number) => void;
}): ReactElement {
  const rows = props.receipts.map(r => ({
    id: r.id,
    status: r.status,
    date: r.date,
    payee: r.payeeName,
    cost: r.totalSum,
  }));

  const columns: GridColDef[] = [
    { field: 'status', headerName: 'Status', width: 130 },
    { field: 'date', headerName: 'Date', width: 130 },
    { field: 'payee', headerName: 'Payee', width: 130 },
    { field: 'cost', headerName: 'Cost', width: 90, type: 'number' },
  ];
  const paginationModel = { page: 0, pageSize: 50 };

  const handleClick = (params: GridRowParams) => {
    const id = params.id;
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    props.onRowClick(numericId);
  };

  return (
    <Card sx={{ height: '90vh', width: '100%' }}>
      <DataGrid
        rows={rows}
        onRowClick={handleClick}
        columns={columns}
        initialState={{ pagination: { paginationModel } }}
        pageSizeOptions={[5, 10]}
        sx={{ border: 0 }}
      />
    </Card>
  );
}
