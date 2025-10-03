import { Box, Button, Container, styled } from '@mui/material';
import { createFileRoute } from '@tanstack/react-router';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import { ChangeEvent, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import CircularProgress from '@mui/material/CircularProgress';
import Backdrop from '@mui/material/Backdrop';
import config from '../config.ts';

export const Route = createFileRoute('/scan')({
  component: Scan,
});

const StyledCard = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[2],
  minHeight: '30rem',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '80vh',
}));

const StyledImg = styled('img')({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  borderRadius: '8px',
});

function Scan() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
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
      setCapturedImage(null);
    },
  });

  const handleCameraClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setCapturedImage(imageUrl);
    }
  };

  return (
    <Container>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      <Backdrop
        sx={theme => ({ color: '#fff', zIndex: theme.zIndex.drawer + 1 })}
        open={submitImageMutation.isPending}
      >
        <CircularProgress />
      </Backdrop>
      <StyledCard onClick={handleCameraClick}>
        {capturedImage ? (
          <StyledImg src={capturedImage} alt="Captured" />
        ) : (
          <CameraAltIcon sx={{ width: '5rem', height: '5rem' }} />
        )}
      </StyledCard>
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
