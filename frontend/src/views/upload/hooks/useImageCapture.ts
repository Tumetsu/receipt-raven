import { useState, useRef, ChangeEvent } from 'react';

export function useImageCapture() {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleGalleryClick = () => {
    galleryInputRef.current?.click();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setCapturedImage(imageUrl);
    }
  };

  const clearImage = () => {
    setCapturedImage(null);
  };

  return {
    capturedImage,
    setCapturedImage,
    cameraInputRef,
    galleryInputRef,
    handleCameraClick,
    handleGalleryClick,
    handleFileChange,
    clearImage,
  };
}
