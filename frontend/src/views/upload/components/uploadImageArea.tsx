import { ChangeEvent, ReactElement, RefObject } from 'react';
import { Box, styled } from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';

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

// Meant to be used with useImageCapture hook
function UploadImageArea(props: {
  capturedImage: string | null;
  fileInputRef: RefObject<HTMLInputElement>;
  handleCameraClick: () => void;
  handleFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
}): ReactElement {
  const { capturedImage, fileInputRef, handleFileChange, handleCameraClick } =
    props;

  return (
    <StyledCard onClick={handleCameraClick}>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {capturedImage ? (
        <StyledImg src={capturedImage} alt="Captured" />
      ) : (
        <CameraAltIcon sx={{ width: '5rem', height: '5rem' }} />
      )}
    </StyledCard>
  );
}

export default UploadImageArea;
