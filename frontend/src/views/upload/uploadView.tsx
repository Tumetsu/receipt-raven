import { Box, Button, Container } from '@mui/material';
import { ReactElement } from 'react';
import { useMutation } from '@tanstack/react-query';
import config from '../../config';
import UploadImageArea from './components/uploadImageArea.tsx';
import { FullscreenSpinner } from '../../common/components/fullscreenSpinner.tsx';
import { useImageCapture } from './hooks/useImageCapture.ts';

export function UploadView(): ReactElement {
  const { capturedImage, clearImage, ...imageCapture } = useImageCapture();

  // Use manual tanstack-query mutation instead of Orval generated since seems like
  // multipart + Axios + generated hooks cause problems.
  const submitImageMutation = useMutation({
    mutationFn: async (receiptImage: string) => {
      const response = await fetch(receiptImage);
      const blob = await response.blob();

      const formData = new FormData();
      formData.append('image', blob, 'camera_capture.jpg');

      return fetch(`${config.api.baseUrl}/api/upload`, {
        method: 'POST',
        body: formData,
      });
    },
    onSuccess: data => {
      console.log(data);
      clearImage();
    },
  });

  return (
    <Container>
      <FullscreenSpinner open={submitImageMutation.isPending} />
      <UploadImageArea capturedImage={capturedImage} {...imageCapture} />

      {capturedImage ? (
        <Box sx={{ textAlign: 'center', marginTop: '2rem' }}>
          <Button
            variant="contained"
            disabled={submitImageMutation.isPending}
            onClick={() => submitImageMutation.mutate(capturedImage)}
          >
            Submit
          </Button>
        </Box>
      ) : (
        <Box sx={{ textAlign: 'center', marginTop: '2rem' }}>
          Take a picture of a receipt
        </Box>
      )}
    </Container>
  );
}
