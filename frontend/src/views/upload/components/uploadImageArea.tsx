import { ChangeEvent, ReactElement, RefObject } from 'react';
import {
  Box,
  styled,
  IconButton,
  Chip,
  Typography,
  Button,
} from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';

const StyledUploadArea = styled(Box, {
  shouldForwardProp: prop => prop !== 'hasImage',
})<{ hasImage: boolean }>(({ theme, hasImage }) => ({
  position: 'relative',
  width: '100%',
  minHeight: '400px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
  transition: 'all 0.3s ease',
  ...(hasImage
    ? {
        border: 'none',
      }
    : {
        border: '2px dashed #cbd5e0',
        backgroundColor: '#f8fafc',
        cursor: 'pointer',
      }),
}));

const CameraButton = styled(IconButton)(({ theme }) => ({
  width: '80px',
  height: '80px',
  backgroundColor: theme.palette.primary.main,
  color: 'white',
  boxShadow: '0 8px 16px rgba(25, 118, 210, 0.3)',
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
  },
}));

const StyledImg = styled('img')({
  width: '100%',
  height: 'auto',
  borderRadius: '8px',
  display: 'block',
});

const SuccessBadge = styled(Chip)({
  position: 'absolute',
  top: '16px',
  right: '16px',
  backgroundColor: '#48bb78',
  color: 'white',
  fontWeight: 500,
  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  animation: 'slideIn 0.3s ease-out',
  '@keyframes slideIn': {
    from: {
      opacity: 0,
      transform: 'translateY(-10px)',
    },
    to: {
      opacity: 1,
      transform: 'translateY(0)',
    },
  },
});

// Meant to be used with useImageCapture hook
function UploadImageArea(props: {
  capturedImage: string | null;
  cameraInputRef: RefObject<HTMLInputElement>;
  galleryInputRef: RefObject<HTMLInputElement>;
  handleCameraClick: () => void;
  handleGalleryClick: () => void;
  handleFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  showSuccess?: boolean;
}): ReactElement {
  const {
    capturedImage,
    cameraInputRef,
    galleryInputRef,
    handleFileChange,
    handleCameraClick,
    handleGalleryClick,
    showSuccess = false,
  } = props;

  return (
    <StyledUploadArea hasImage={!!capturedImage}>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={cameraInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <input
        type="file"
        accept="image/*"
        ref={galleryInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {capturedImage ? (
        <Box sx={{ position: 'relative', width: '100%' }}>
          <StyledImg src={capturedImage} alt="Receipt preview" />
          {showSuccess && (
            <SuccessBadge
              icon={<CheckCircleIcon sx={{ color: 'white !important' }} />}
              label="Photo captured"
            />
          )}
        </Box>
      ) : (
        <Box sx={{ textAlign: 'center', width: '100%', px: 2 }}>
          <CameraButton onClick={handleCameraClick}>
            <CameraAltIcon sx={{ fontSize: '40px' }} />
          </CameraButton>
          <Typography
            sx={{
              fontSize: '16px',
              fontWeight: 500,
              mt: 2,
              mb: 1,
              color: '#2d3748',
            }}
          >
            Take a photo
          </Typography>
          <Typography sx={{ fontSize: '12px', color: '#718096', mb: 2 }}>
            Ensure receipt is flat and well-lit
          </Typography>

          <Button
            variant="outlined"
            size="large"
            onClick={handleGalleryClick}
            startIcon={<PhotoLibraryIcon />}
            sx={{
              mt: 1,
              fontWeight: 600,
              borderWidth: 2,
              '&:hover': {
                borderWidth: 2,
              },
            }}
          >
            Select from Gallery
          </Button>
        </Box>
      )}
    </StyledUploadArea>
  );
}

export default UploadImageArea;
