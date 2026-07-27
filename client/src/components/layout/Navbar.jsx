import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';
import { useAuthStore } from '../../context/authStore.js';
import { initials } from '../../lib/format.js';
import { useT } from '../../i18n/index.jsx';
import { Button } from '../ui/Button.jsx';
import { Skeleton } from '../ui/States.jsx';
import { Logo } from '../ui/Logo.jsx';
import { LanguageSwitcher } from './LanguageSwitcher.jsx';
import { NotificationBell } from '../../features/notifications/NotificationBell.jsx';
import { cn } from '../../lib/cn.js';

const LINKS_BY_ROLE = {
  anonymous: [{ to: '/jobs', key: 'nav.browseJobs' }],
  candidate: [
    { to: '/jobs', key: 'nav.browseJobs' },
    { to: '/applications', key: 'nav.myApplications' },
  ],
  recruiter: [
    { to: '/recruiter', key: 'nav.dashboard', end: true },
    { to: '/recruiter/jobs', key: 'nav.jobs' },
    { to: '/recruiter/talent', key: 'nav.talent' },
    { to: '/recruiter/company', key: 'nav.company' },
  ],
  admin: [
    { to: '/admin', key: 'nav.moderation' },
    { to: '/jobs', key: 'nav.jobBoard' },
  ],
};

export function Navbar() {
  const { user, status, signOut } = useAuthStore();
  const navigate = useNavigate();
  const t = useT();
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
                {t(link.key)}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher />

          {resolving ? (
            <Skeleton className="h-8 w-32 rounded-lg" />
          ) : user ? (
            <>
              <NotificationBell />
              <div className="flex items-center gap-2.5">
                <span
                  className="bg-brand-100 text-brand-700 flex size-8 items-center justify-center rounded-full text-xs font-semibold"
                  aria-hidden="true"
                >
                  {initials(user.name)}
                </span>
                <div className="leading-tight">
                  <p className="text-ink-900 text-sm font-medium">{user.name}</p>
                  <p className="text-ink-500 text-xs">
                    {user.company?.name ?? t(`roles.${user.role}`)}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="size-4" aria-hidden="true" />
                {t('nav.signOut')}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" to="/login">
                {t('nav.signIn')}
              </Button>
              <Button size="sm" to="/register">
                {t('nav.getStarted')}
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 md:hidden">
          {user && <NotificationBell />}
          <button
            type="button"
            className="text-ink-700 -me-2 p-2"
            aria-label={menuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
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
              <span className="block">{t(link.key)}</span>
            </NavLink>
          ))}

          <div className="border-ink-200 mt-2 flex flex-col gap-2 border-t pt-3">
            <LanguageSwitcher className="px-1" />

            {resolving ? (
              <Skeleton className="h-9 rounded-lg" />
            ) : user ? (
              <>
                <p className="text-ink-500 px-3 text-sm">
                  {t('nav.signedInAs', { name: user.name })}
                </p>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="size-4" aria-hidden="true" />
                  {t('nav.signOut')}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" to="/login" onClick={() => setMenuOpen(false)}>
                  {t('nav.signIn')}
                </Button>
                <Button size="sm" to="/register" onClick={() => setMenuOpen(false)}>
                  {t('nav.getStarted')}
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
