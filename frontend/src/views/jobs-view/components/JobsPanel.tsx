import { Box, Stack, Typography, Chip, Divider } from '@mui/material';
import { useRef } from 'react';
import {
  Panel,
  PanelContent,
  PanelRef,
} from '../../../common/components/Panel.tsx';
import { ReceiptImage } from '../../../common/components/receipt-image/ReceiptImage.tsx';
import { GetApiJobs200Item } from '../../../api/generated/model';

interface JobPanelProps {
  job: GetApiJobs200Item;
  onClosePanel: () => void;
}

function JobPanelContent({ job }: Omit<JobPanelProps, 'onClosePanel'>) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getStatusColor = (
    status: string
  ): 'success' | 'error' | 'warning' | 'info' | 'default' => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'processing':
        return 'warning';
      case 'pending':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <PanelContent>
      <Stack spacing={3}>
        {/* Receipt Image */}
        <Box>
          <ReceiptImage url={job.fileUrl} />
        </Box>

        <Divider />

        {/* Job Details */}
        <Stack spacing={2}>
          <Box>
            <Typography variant="overline" color="text.secondary" gutterBottom>
              Status
            </Typography>
            <Box>
              <Chip
                label={job.status}
                color={getStatusColor(job.status)}
                size="small"
              />
            </Box>
          </Box>

          <Box>
            <Typography variant="overline" color="text.secondary" gutterBottom>
              Job Details
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>ID:</strong> {job.id}
            </Typography>
            <Typography variant="body2">
              <strong>File Name:</strong> {job.filename}
            </Typography>
          </Box>

          <Box>
            <Typography variant="overline" color="text.secondary" gutterBottom>
              Timeline
            </Typography>
            <Typography variant="body2">
              <strong>Created:</strong> {formatDate(job.createdAt)}
            </Typography>
            {job.processedAt && (
              <Typography variant="body2">
                <strong>Processed:</strong> {formatDate(job.processedAt)}
              </Typography>
            )}
          </Box>

          {job.retryCount > 0 && (
            <Box>
              <Typography
                variant="overline"
                color="text.secondary"
                gutterBottom
              >
                Retries
              </Typography>
              <Typography variant="body2">
                {job.retryCount} {job.retryCount === 1 ? 'retry' : 'retries'}
              </Typography>
            </Box>
          )}

          {job.analysisError && (
            <Box>
              <Typography variant="overline" gutterBottom>
                Error
              </Typography>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 1,
                  border: 1,
                  borderColor: 'error.main',
                }}
              >
                <Typography variant="body2" color="error.dark">
                  {job.analysisError}
                </Typography>
              </Box>
            </Box>
          )}
        </Stack>
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
