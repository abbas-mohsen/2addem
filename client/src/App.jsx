import { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout.jsx';
import { GuestRoute, ProtectedRoute } from './components/routing/Guards.jsx';
import { useAuthStore } from './context/authStore.js';
import { LandingPage } from './pages/LandingPage.jsx';
import { JobBoardPage } from './pages/JobBoardPage.jsx';
import { JobDetailPage } from './pages/JobDetailPage.jsx';
import { CompanyPage } from './pages/CompanyPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';
import { ApplyPage } from './pages/ApplyPage.jsx';
import { MyApplicationsPage } from './pages/MyApplicationsPage.jsx';
import { RecruiterJobsPage } from './pages/RecruiterJobsPage.jsx';
import { JobEditorPage } from './pages/JobEditorPage.jsx';
import { JobApplicantsPage } from './pages/JobApplicantsPage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';

export default function App() {
  const bootstrap = useAuthStore((state) => state.bootstrap);

  // One silent refresh on load restores the session from the HTTP-only cookie.
  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="jobs" element={<JobBoardPage />} />
        <Route path="jobs/:slug" element={<JobDetailPage />} />
        <Route path="companies/:slug" element={<CompanyPage />} />

        <Route element={<GuestRoute />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
        </Route>

        <Route element={<ProtectedRoute roles={['candidate']} />}>
          <Route path="jobs/:slug/apply" element={<ApplyPage />} />
          <Route path="applications" element={<MyApplicationsPage />} />
        </Route>

        <Route element={<ProtectedRoute roles={['recruiter', 'admin']} />}>
          <Route path="recruiter/jobs" element={<RecruiterJobsPage />} />
          <Route path="recruiter/jobs/new" element={<JobEditorPage />} />
          <Route path="recruiter/jobs/:id/edit" element={<JobEditorPage />} />
          <Route path="recruiter/jobs/:id/applicants" element={<JobApplicantsPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
