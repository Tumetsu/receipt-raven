import { useState, useRef, ChangeEvent } from 'react';

export function useImageCapture() {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCameraClick = () => {
    fileInputRef.current?.click();
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
    fileInputRef,
    handleCameraClick,
    handleFileChange,
    clearImage,
  };
}
