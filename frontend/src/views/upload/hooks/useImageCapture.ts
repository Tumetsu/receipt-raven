import { useState, useRef, ChangeEvent, RefObject } from 'react';

export function useImageCapture() {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(
    null
  ) as RefObject<HTMLInputElement>;
  const galleryInputRef = useRef<HTMLInputElement>(
    null
  ) as RefObject<HTMLInputElement>;

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
