import { Typography } from '@mui/material';
import { ReactElement, useState } from 'react';
import { useGetApiJobs } from '../../api/generated/api.ts';
import { ContentArea } from '../../common/components/ContentArea.tsx';
import { PageContainer } from '../../common/components/Layout.tsx';
import { JobList } from './components/JobList.tsx';
import { JobPanel } from './components/JobsPanel.tsx';
import { GetApiJobs200JobsItem } from '../../api/generated/model';

export function JobsListView(): ReactElement {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);

  const {
    isPending,
    isSuccess,
    data: result,
  } = useGetApiJobs(
    { page, pageSize },
    {
      query: { queryKey: ['jobs', page, pageSize] },
    }
  );
  const [selectedJob, setSelectedJob] = useState<GetApiJobs200JobsItem | null>(
    null
  );

  return (
    <PageContainer>
      <ContentArea>
        {isPending && <Typography>Loading...</Typography>}
        {isSuccess && result && (
          <JobList
            jobs={result.jobs}
            totalJobs={result.total}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            onRowClick={id => {
              const job = result.jobs.find(r => r.id === id) || null;
              setSelectedJob(job);
            }}
          />
        )}
      </ContentArea>

      {selectedJob && (
        <JobPanel job={selectedJob} onClosePanel={() => setSelectedJob(null)} />
      )}
    </PageContainer>
  );
}
