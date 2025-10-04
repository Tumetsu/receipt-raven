import { ChangeEvent, ReactElement, useRef } from 'react';
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

function UploadImageArea(props: {
  setCapturedImage: (imageUrl: string) => void;
  capturedImage: string | null;
}): ReactElement {
  const { capturedImage, setCapturedImage } = props;
  const fileInputRef = useRef<HTMLInputElement>(null);

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
