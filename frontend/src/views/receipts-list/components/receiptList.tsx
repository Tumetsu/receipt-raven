import { Paper } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { ReactElement } from 'react';
import { GetApiReceipts200Item } from '../../../api/generated/model';

export function ReceiptList(props: {
  receipts: GetApiReceipts200Item[]; // TODO: Fix with some non-dto type shared between backend and frontend?
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

  return (
    <Paper sx={{ height: '90vh', width: '100%' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        initialState={{ pagination: { paginationModel } }}
        pageSizeOptions={[5, 10]}
        sx={{ border: 0 }}
      />
    </Paper>
  );
}
