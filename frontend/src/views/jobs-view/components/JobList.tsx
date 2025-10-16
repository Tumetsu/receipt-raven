import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridRowParams,
} from '@mui/x-data-grid';
import { ReactElement } from 'react';
import { Job } from '../../../api/generated/model';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import IncompleteCircleIcon from '@mui/icons-material/IncompleteCircle';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { TableCard } from '../../../common/components/Layout.tsx';

// TODO: This should be shared with the backend
type JobStatus = 'waiting' | 'processed' | 'failed';

// TODO: Use colors from theme
const jobStatusIcons: Record<JobStatus, ReactElement> = {
  waiting: <IncompleteCircleIcon sx={{ color: '#f8a335' }} />,
  processed: <CheckCircleIcon sx={{ color: '#10b981' }} />,
  failed: <HighlightOffIcon sx={{ color: '#fc6868' }} />,
};

type JobRow = {
  id: number;
  status: JobStatus;
  createdAt: string;
  retryCount: number;
};

export function JobList(props: {
  jobs: Job[];
  onRowClick: (id: number) => void;
}): ReactElement {
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

  return (
    <TableCard>
      <DataGrid
        rows={rows}
        onRowClick={handleClick}
        columns={columns}
        initialState={{ pagination: { paginationModel } }}
        pageSizeOptions={[25, 50, 100]}
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
