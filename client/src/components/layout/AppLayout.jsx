import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar.jsx';
import { Footer } from './Footer.jsx';
import { cn } from '../../lib/cn.js';

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

/* `wide` is for the pipeline board, where six columns need more room than the
   reading-width container gives. */
export function Container({ wide = false, className, children }) {
  return (
    <div
      className={cn('mx-auto w-full px-4 sm:px-6', wide ? 'max-w-[104rem]' : 'max-w-6xl', className)}
    >
      {children}
    </div>
  );
}

export function PageHeader({ title, description, actions, className }) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-4', className)}>
      <div>
        <h1 className="text-2xl sm:text-3xl">{title}</h1>
        {description && <p className="text-ink-500 mt-1.5 max-w-2xl text-sm">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
