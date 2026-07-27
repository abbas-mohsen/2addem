import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { homePathFor, useAuthStore } from '../../context/authStore.js';
import { LoadingState } from '../ui/States.jsx';

/* Requires a session; optionally narrows to specific roles. The redirect
   carries the attempted location so sign-in can return the user to it. */
export function ProtectedRoute({ roles }) {
  const { user, status } = useAuthStore();
  const location = useLocation();

  if (status === 'loading') return <LoadingState label="Checking your session…" />;

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={homePathFor(user)} replace />;
  }

  return <Outlet />;
}

/* Sign-in and sign-up should not be reachable while already signed in. */
export function GuestRoute() {
  const { user, status } = useAuthStore();

  if (status === 'loading') return <LoadingState label="Checking your session…" />;
  if (user) return <Navigate to={homePathFor(user)} replace />;

  return <Outlet />;
}
