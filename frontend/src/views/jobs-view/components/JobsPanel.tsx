import { Box, Stack } from '@mui/material';
import { useRef } from 'react';
import {
  Panel,
  PanelContent,
  PanelRef,
} from '../../../common/components/Panel.tsx';
import { Job } from '../../../api/generated/model';
import { ReceiptImage } from '../../../common/components/receipt-image/ReceiptImage.tsx';

interface JobPanelProps {
  job: Job;
  onClosePanel: () => void;
}

function JobPanelContent({ job }: Omit<JobPanelProps, 'onClosePanel'>) {
  return (
    <PanelContent>
      <Stack spacing={3}>
        {/* Receipt Image */}
        <Box>
          <ReceiptImage url={job.fileUrl} />
        </Box>
      </Stack>
    </PanelContent>
  );
}

export function JobPanel(props: JobPanelProps) {
  const panelRef = useRef<PanelRef>(null);

  return (
    <>
      <Panel ref={panelRef} title="Job Details" onClose={props.onClosePanel}>
        <JobPanelContent job={props.job} />
      </Panel>
    </>
  );
}
