import { Box, Button, Typography, Card, LinearProgress } from '@mui/material';
import { ReactElement, useState, ChangeEvent, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import config from '../../config';
import UploadImageArea from './components/uploadImageArea.tsx';
import { useImageCapture } from './hooks/useImageCapture.ts';
import { useSharedImage } from './hooks/useSharedImage.ts';
import { useSnackbar } from 'notistack';
import { ContentArea } from '../../common/components/ContentArea.tsx';
import UploadIcon from '@mui/icons-material/Upload';
import RefreshIcon from '@mui/icons-material/Refresh';

export function UploadView(): ReactElement {
  const {
    capturedImage,
    fileType,
    clearImage,
    setCapturedImage,
    ...imageCapture
  } = useImageCapture();
  const sharedImage = useSharedImage();
  const { enqueueSnackbar } = useSnackbar();
  const [showSuccess, setShowSuccess] = useState(false);

  // Use manual tanstack-query mutation instead of Orval generated since seems like
  // multipart + Axios + generated hooks cause problems.
  const submitImageMutation = useMutation({
    mutationFn: async (receiptData: string) => {
      const response = await fetch(receiptData);
      const blob = await response.blob();

      // Determine filename based on blob type
      const isPdf = blob.type === 'application/pdf';
      const filename = isPdf ? 'receipt.pdf' : 'camera_capture.jpg';

      const formData = new FormData();
      formData.append('image', blob, filename);

      return fetch(`${config.api.baseUrl}/api/upload`, {
        method: 'POST',
        body: formData,
      });
    },
    onSuccess: () => {
      enqueueSnackbar('Receipt uploaded successfully', { variant: 'success' });
      clearImage();
    },
    onError: error => {
      enqueueSnackbar(`Error saving photo: ${error.message}`, {
        variant: 'error',
        autoHideDuration: 10000,
      });
    },
  });

  const handleImageCapture = (event: ChangeEvent<HTMLInputElement>) => {
    imageCapture.handleFileChange(event);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const handleRetake = () => {
    clearImage();
    setShowSuccess(false);
  };

  // Handle shared images from iOS Share Target
  useEffect(() => {
    if (sharedImage) {
      setCapturedImage(sharedImage);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    }
  }, [sharedImage, setCapturedImage]);

  return (
    <ContentArea
      sx={{
        margin: '0 auto',
        height: '100dvh',
      }}
    >
      <Card
        sx={{
          p: 3,
          borderRadius: 3,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          mb: 2.5,
        }}
      >
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography
            variant="h5"
            sx={{ fontWeight: 600, mb: 1, color: '#1a202c' }}
          >
            Upload Receipt
          </Typography>
          <Typography variant="body2" sx={{ color: '#718096' }}>
            Take a clear photo of your receipt
          </Typography>
        </Box>

        {/* Upload Area */}
        <UploadImageArea
          capturedImage={capturedImage}
          fileType={fileType}
          {...imageCapture}
          handleFileChange={handleImageCapture}
          showSuccess={showSuccess}
        />

        {/* Action Buttons */}
        {capturedImage && (
          <Box sx={{ mt: 3 }}>
            {submitImageMutation.isPending && (
              <Box sx={{ mb: 2 }}>
                <LinearProgress />
                <Typography
                  variant="caption"
                  sx={{
                    color: '#718096',
                    textAlign: 'center',
                    display: 'block',
                    mt: 1,
                  }}
                >
                  Submitting receipt...
                </Typography>
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button
                variant="outlined"
                size="large"
                fullWidth
                disabled={submitImageMutation.isPending}
                onClick={handleRetake}
                startIcon={<RefreshIcon />}
                sx={{
                  fontWeight: 600,
                  borderWidth: 2,
                  '&:hover': {
                    borderWidth: 2,
                  },
                }}
              >
                Retake
              </Button>
              <Button
                variant="contained"
                size="large"
                fullWidth
                disabled={submitImageMutation.isPending}
                onClick={() => submitImageMutation.mutate(capturedImage)}
                startIcon={<UploadIcon />}
                sx={{
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(25, 118, 210, 0.4)',
                }}
              >
                Analyze Receipt
              </Button>
            </Box>
          </Box>
        )}
      </Card>
    </ContentArea>
  );
}
