import { Typography } from '@mui/material';
import { ReactElement, useState } from 'react';
import { useGetApiJobs } from '../../api/generated/api.ts';
import { ContentArea } from '../../common/components/ContentArea.tsx';
import { PageContainer } from '../../common/components/Layout.tsx';
import { Job } from '../../api/generated/model';
import { JobList } from './components/JobList.tsx';

export function JobsListView(): ReactElement {
  const {
    isPending,
    isSuccess,
    data: result,
  } = useGetApiJobs({
    query: { queryKey: ['jobs'] },
  });
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  return (
    <PageContainer>
      <ContentArea>
        {isPending && <Typography>Loading...</Typography>}
        {isSuccess && (
          <JobList
            jobs={result}
            onRowClick={id => {
              const receipt = result.find(r => r.id === id) || null;
              setSelectedJob(receipt);
            }}
          />
        )}
      </ContentArea>

      {/*TODO*/}
      {selectedJob && <></>}
    </PageContainer>
  );
}
