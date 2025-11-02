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
  GetApiReceipts200ReceiptsItem,
  GetApiReceipts200ReceiptsItemStatus,
} from '../../../api/generated/model';
import { Box, useMediaQuery, useTheme, Pagination } from '@mui/material';
import { DateTime } from 'luxon';
import { formatCurrency } from '../../../common/utils.ts';

export function ReceiptList(props: {
  receipts: GetApiReceipts200ReceiptsItem[];
  totalReceipts: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onRowClick: (id: number) => void;
}): ReactElement {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const rows = props.receipts.map(r => ({
    id: r.id,
    status: r.status,
    date: r.date,
    payee: r.payee,
    description: r.description,
    cost: r.totalSum,
  }));

  const columns: GridColDef[] = [
    {
      field: 'status',
      headerName: 'Status',
      width: 80,
      renderCell: params => (
        <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          {params.value === GetApiReceipts200ReceiptsItemStatus.approved ? (
            <CheckCircleIcon sx={{ color: 'success.main' }} />
          ) : (
            <RadioButtonUncheckedIcon sx={{ color: 'grey.300' }} />
          )}
        </div>
      ),
    },
    {
      field: 'date',
      headerName: 'Date',
      flex: 1,
      minWidth: 130,
      renderCell: params => {
        const date = DateTime.fromISO(params.value);
        return date.toLocaleString(DateTime.DATE_SHORT);
      },
    },
    { field: 'payee', headerName: 'Payee', flex: 2, minWidth: 200 },
    { field: 'description', headerName: 'Description', flex: 2, minWidth: 200 },
    {
      field: 'cost',
      headerName: 'Amount',
      flex: 1,
      minWidth: 100,
      type: 'number',
      valueFormatter: value => `${formatCurrency(value)}`,
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
          <ChevronRightIcon sx={{ color: 'grey.400' }} />
        </div>
      ),
    },
  ];

  const handleClick = (params: GridRowParams) => {
    const id = params.id;
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    props.onRowClick(numericId);
  };

  const handleCardClick = (id: number) => {
    props.onRowClick(id);
  };

  const totalPages = Math.ceil(props.totalReceipts / props.pageSize);

  if (isMobile) {
    return (
      <Box sx={{ width: '100%', overflowX: 'hidden' }}>
        {rows.map(row => {
          const icon =
            row.status === GetApiReceipts200ReceiptsItemStatus.approved ? (
              <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />
            ) : (
              <RadioButtonUncheckedIcon
                sx={{ color: 'grey.300', fontSize: 20 }}
              />
            );

          const mobileRow: MobileCardRow = {
            icon,
            primaryText: `${DateTime.fromISO(row.date).toLocaleString(DateTime.DATE_SHORT)} ${row.payee}`,
            secondaryText: row.description ?? '',
            tertiaryText: `${formatCurrency(row.cost)}`,
          };

          return (
            <MobileCard
              key={row.id}
              row={mobileRow}
              onClick={() => handleCardClick(row.id)}
            />
          );
        })}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Pagination
              count={totalPages}
              page={props.page}
              onChange={(_event, page) => props.onPageChange(page)}
              color="primary"
            />
          </Box>
        )}
      </Box>
    );
  }

  return (
    <TableCard>
      <DataGrid
        rows={rows}
        onRowClick={handleClick}
        columns={columns}
        paginationMode="server"
        rowCount={props.totalReceipts}
        paginationModel={{
          page: props.page - 1, // DataGrid uses 0-based indexing
          pageSize: props.pageSize,
        }}
        onPaginationModelChange={model => {
          if (model.pageSize !== props.pageSize) {
            props.onPageSizeChange(model.pageSize);
          }
          if (model.page + 1 !== props.page) {
            props.onPageChange(model.page + 1); // Convert to 1-based indexing
          }
        }}
        pageSizeOptions={[25, 30, 50, 100]}
        sx={{
          border: 0,
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: 'background.default',
            borderBottom: theme => `1px solid ${theme.palette.divider}`,
          },
          '& .MuiDataGrid-row': {
            cursor: 'pointer',
            '&.Mui-selected': {
              backgroundColor: 'transparent',
              '&:hover': {
                backgroundColor: 'transparent',
              },
            },
          },
          '& .MuiDataGrid-cell:focus': {
            outline: 'none',
          },
          '& .MuiDataGrid-cell:focus-within': {
            outline: 'none',
          },
        }}
      />
    </TableCard>
  );
}
