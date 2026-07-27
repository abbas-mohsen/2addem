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
import { RecruiterDashboardPage } from './pages/RecruiterDashboardPage.jsx';
import { JobEditorPage } from './pages/JobEditorPage.jsx';
import { JobPipelinePage } from './pages/JobPipelinePage.jsx';
import { CompanyProfilePage } from './pages/CompanyProfilePage.jsx';
import { TalentPoolPage } from './pages/TalentPoolPage.jsx';
import { AdminPage } from './pages/AdminPage.jsx';
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

        {/* Recruiter pages need a company; admins have none, so they get the
            moderation panel instead rather than a page that errors. */}
        <Route element={<ProtectedRoute roles={['recruiter']} />}>
          <Route path="recruiter" element={<RecruiterDashboardPage />} />
          <Route path="recruiter/jobs" element={<RecruiterJobsPage />} />
          <Route path="recruiter/jobs/new" element={<JobEditorPage />} />
          <Route path="recruiter/jobs/:id/edit" element={<JobEditorPage />} />
          <Route path="recruiter/jobs/:id/pipeline" element={<JobPipelinePage />} />
          <Route path="recruiter/company" element={<CompanyProfilePage />} />
          <Route path="recruiter/talent" element={<TalentPoolPage />} />
        </Route>

        <Route element={<ProtectedRoute roles={['admin']} />}>
          <Route path="admin" element={<AdminPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
