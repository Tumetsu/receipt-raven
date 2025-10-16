import { createFileRoute } from '@tanstack/react-router';
import { JobsListView } from '../views/jobs-view/jobsListView.tsx';

export const Route = createFileRoute('/jobs')({
  component: JobsListView,
});
