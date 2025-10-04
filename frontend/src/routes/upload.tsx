import { createFileRoute } from '@tanstack/react-router';
import { UploadView } from '../views/upload/uploadView.tsx';

export const Route = createFileRoute('/upload')({
  component: UploadView,
});
