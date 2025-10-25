import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridRowParams,
} from '@mui/x-data-grid';
import { ReactElement } from 'react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import IncompleteCircleIcon from '@mui/icons-material/IncompleteCircle';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import {
  TableCard,
  MobileCard,
  MobileCardRow,
} from '../../../common/components/Layout.tsx';
import {
  GetApiJobs200JobsItem,
  GetApiJobs200JobsItemStatus,
} from '../../../api/generated/model';
import { Box, useMediaQuery, useTheme, Pagination } from '@mui/material';

type JobStatus = GetApiJobs200JobsItemStatus;

// TODO: Use colors from theme
const jobStatusIcons: Record<JobStatus, ReactElement> = {
  waiting: <IncompleteCircleIcon sx={{ color: '#f8a335', fontSize: 20 }} />,
  processed: <CheckCircleIcon sx={{ color: '#10b981', fontSize: 20 }} />,
  failed: <HighlightOffIcon sx={{ color: '#fc6868', fontSize: 20 }} />,
};

type JobRow = {
  id: number;
  status: JobStatus;
  createdAt: string;
  retryCount: number;
};

export function JobList(props: {
  jobs: GetApiJobs200JobsItem[];
  totalJobs: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onRowClick: (id: number) => void;
}): ReactElement {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const rows: JobRow[] = props.jobs.map(j => ({
    id: j.id,
    status: j.status as JobStatus,
    createdAt: j.createdAt,
    retryCount: j.retryCount,
  }));

  const columns: GridColDef<JobRow>[] = [
    {
      field: 'status',
      headerName: 'Status',
      width: 80,
      renderCell: (params: GridRenderCellParams<JobRow, JobStatus>) => (
        <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          {params.value && jobStatusIcons[params.value]}
        </div>
      ),
    },
    { field: 'id', headerName: 'Id', flex: 1, minWidth: 130 },
    { field: 'createdAt', headerName: 'Created', flex: 2, minWidth: 200 },
    {
      field: 'retryCount',
      headerName: 'Retries',
      flex: 1,
      minWidth: 100,
      type: 'number',
      valueFormatter: value => `${Number(value)}`,
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

  const totalPages = Math.ceil(props.totalJobs / props.pageSize);

  if (isMobile) {
    return (
      <Box sx={{ p: 1 }}>
        {rows.map(row => {
          const icon = jobStatusIcons[row.status];

          const mobileRow: MobileCardRow = {
            icon,
            primaryText: `Job #${row.id}`,
            secondaryText: row.createdAt,
            tertiaryText:
              row.retryCount > 0 ? `${row.retryCount} retries` : undefined,
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
        rowCount={props.totalJobs}
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
