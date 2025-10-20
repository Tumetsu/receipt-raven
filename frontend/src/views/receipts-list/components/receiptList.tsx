import { DataGrid, GridColDef, GridRowParams } from '@mui/x-data-grid';
import { ReactElement } from 'react';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import {
  TableCard,
  MobileCard,
  MobileCardRow,
} from '../../../common/components/Layout.tsx';
import {
  GetApiReceipts200Item,
  GetApiReceipts200ItemStatus,
} from '../../../api/generated/model';
import { Box, useMediaQuery, useTheme } from '@mui/material';

export function ReceiptList(props: {
  receipts: GetApiReceipts200Item[];
  selectedReceiptId?: number;
  onRowClick: (id: number) => void;
}): ReactElement {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const rows = props.receipts.map(r => ({
    id: r.id,
    status: r.status,
    date: r.date,
    payee: r.payee,
    cost: r.totalSum,
  }));

  const columns: GridColDef[] = [
    {
      field: 'status',
      headerName: 'Status',
      width: 80,
      renderCell: params => (
        <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          {params.value === GetApiReceipts200ItemStatus.approved ? (
            <CheckCircleIcon sx={{ color: '#10b981' }} />
          ) : (
            <RadioButtonUncheckedIcon sx={{ color: '#d1d5db' }} />
          )}
        </div>
      ),
    },
    { field: 'date', headerName: 'Date', flex: 1, minWidth: 130 },
    { field: 'payee', headerName: 'Payee', flex: 2, minWidth: 200 },
    {
      field: 'cost',
      headerName: 'Amount',
      flex: 1,
      minWidth: 100,
      type: 'number',
      valueFormatter: value => `${Number(value).toFixed(2)}€`,
    },
    {
      field: 'actions',
      headerName: '',
      width: 50,
      sortable: false,
      renderCell: () => (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            height: '100%',
            justifyContent: 'flex-end',
          }}
        >
          <ChevronRightIcon sx={{ color: '#9ca3af' }} />
        </div>
      ),
    },
  ];

  const paginationModel = { page: 0, pageSize: 50 };

  const handleClick = (params: GridRowParams) => {
    const id = params.id;
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    props.onRowClick(numericId);
  };

  const handleCardClick = (id: number) => {
    props.onRowClick(id);
  };

  if (isMobile) {
    return (
      <Box sx={{ p: 1 }}>
        {rows.map(row => {
          const icon =
            row.status === GetApiReceipts200ItemStatus.approved ? (
              <CheckCircleIcon sx={{ color: '#10b981', fontSize: 20 }} />
            ) : (
              <RadioButtonUncheckedIcon
                sx={{ color: '#d1d5db', fontSize: 20 }}
              />
            );

          const mobileRow: MobileCardRow = {
            icon,
            primaryText: row.date,
            secondaryText: row.payee,
            tertiaryText: `${Number(row.cost).toFixed(2)}€`,
          };

          return (
            <MobileCard
              key={row.id}
              row={mobileRow}
              onClick={() => handleCardClick(row.id)}
              selected={row.id === props.selectedReceiptId}
            />
          );
        })}
      </Box>
    );
  }

  return (
    <TableCard>
      <DataGrid
        rows={rows}
        onRowClick={handleClick}
        columns={columns}
        initialState={{ pagination: { paginationModel } }}
        pageSizeOptions={[25, 50, 100]}
        getRowClassName={params =>
          params.id === props.selectedReceiptId ? 'selected-row' : ''
        }
        sx={{
          border: 0,
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: '#f9fafb',
            borderBottom: '1px solid #e5e7eb',
          },
          '& .MuiDataGrid-row': {
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: '#eff6ff',
            },
            '&.selected-row': {
              backgroundColor: '#eff6ff',
              '&:hover': {
                backgroundColor: '#dbeafe',
              },
            },
          },
          '& .MuiDataGrid-cell': {
            borderBottom: '1px solid #f3f4f6',
          },
        }}
      />
    </TableCard>
  );
}
