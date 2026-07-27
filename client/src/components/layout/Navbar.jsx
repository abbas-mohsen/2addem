import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';
import { useAuthStore } from '../../context/authStore.js';
import { initials } from '../../lib/format.js';
import { Button } from '../ui/Button.jsx';
import { Logo } from '../ui/Logo.jsx';
import { cn } from '../../lib/cn.js';

const LINKS_BY_ROLE = {
  anonymous: [{ to: '/jobs', label: 'Browse jobs' }],
  candidate: [
    { to: '/jobs', label: 'Browse jobs' },
    { to: '/applications', label: 'My applications' },
  ],
  recruiter: [
    { to: '/recruiter', label: 'Dashboard', end: true },
    { to: '/recruiter/jobs', label: 'Jobs' },
    { to: '/recruiter/company', label: 'Company' },
  ],
  admin: [
    { to: '/recruiter', label: 'Dashboard', end: true },
    { to: '/recruiter/jobs', label: 'Jobs' },
    { to: '/recruiter/company', label: 'Company' },
  ],
};

export function Navbar() {
  const { user, status, signOut } = useAuthStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  // Until the session has been resolved we know neither state, so showing the
  // signed-out buttons would flash the wrong nav on every reload.
  const resolving = status === 'loading';
  const links = LINKS_BY_ROLE[user?.role ?? 'anonymous'];

  const handleSignOut = async () => {
    await signOut();
    setMenuOpen(false);
    navigate('/');
  };

  const linkClass = ({ isActive }) =>
    cn(
      'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
      isActive ? 'bg-ink-100 text-ink-900' : 'text-ink-600 hover:text-ink-900'
    );

  return (
    <header className="border-ink-200/70 sticky top-0 z-40 border-b bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} className={linkClass}>
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {resolving ? (
            <div className="bg-ink-100 h-8 w-32 animate-pulse rounded-lg" aria-hidden="true" />
          ) : user ? (
            <>
              <div className="flex items-center gap-2.5">
                <span
                  className="bg-brand-100 text-brand-700 flex size-8 items-center justify-center rounded-full text-xs font-semibold"
                  aria-hidden="true"
                >
                  {initials(user.name)}
                </span>
                <div className="leading-tight">
                  <p className="text-ink-900 text-sm font-medium">{user.name}</p>
                  <p className="text-ink-500 text-xs capitalize">
                    {user.company?.name ?? user.role}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="size-4" aria-hidden="true" />
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" to="/login">
                Sign in
              </Button>
              <Button size="sm" to="/register">
                Get started
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          className="text-ink-700 -mr-2 p-2 md:hidden"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {menuOpen && (
        <div className="border-ink-200 space-y-1 border-t bg-white px-4 py-3 md:hidden">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={linkClass}
              onClick={() => setMenuOpen(false)}
            >
              <span className="block">{link.label}</span>
            </NavLink>
          ))}

          <div className="border-ink-200 mt-2 flex flex-col gap-2 border-t pt-3">
            {resolving ? (
              <div className="bg-ink-100 h-9 animate-pulse rounded-lg" aria-hidden="true" />
            ) : user ? (
              <>
                <p className="text-ink-500 px-3 text-sm">
                  Signed in as <span className="text-ink-800 font-medium">{user.name}</span>
                </p>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="size-4" aria-hidden="true" />
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" to="/login" onClick={() => setMenuOpen(false)}>
                  Sign in
                </Button>
                <Button size="sm" to="/register" onClick={() => setMenuOpen(false)}>
                  Get started
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
