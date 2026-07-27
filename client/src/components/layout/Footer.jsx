import { Link } from 'react-router-dom';
import { Logo } from '../ui/Logo.jsx';

export function Footer() {
  return (
    <footer className="border-ink-200 mt-20 border-t bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <Logo />
            <span className="text-ink-400 text-lg" lang="ar" dir="rtl">
              قدّم
            </span>
          </div>
          <p className="text-ink-500 max-w-xs text-sm">
            Hiring software for teams that would rather talk to people than shuffle spreadsheets.
          </p>
        </div>

        <nav className="text-ink-600 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Link to="/jobs" className="hover:text-ink-900">
            Browse jobs
          </Link>
          <Link to="/register?role=recruiter" className="hover:text-ink-900">
            For employers
          </Link>
          <Link to="/login" className="hover:text-ink-900">
            Sign in
          </Link>
        </nav>
      </div>

      <div className="border-ink-200 border-t">
        <p className="text-ink-400 mx-auto max-w-6xl px-4 py-4 text-xs sm:px-6">
          © {new Date().getFullYear()} 2addem. A portfolio project — not a real hiring service.
        </p>
      </div>
    </footer>
  );
}
