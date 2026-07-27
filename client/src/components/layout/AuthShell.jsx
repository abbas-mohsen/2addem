import { Container } from './AppLayout.jsx';

export function AuthShell({ title, subtitle, children, footer }) {
  return (
    <Container className="py-14 sm:py-20">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-7 text-center">
          <h1 className="text-title">{title}</h1>
          {subtitle && <p className="text-ink-500 mt-2 text-sm">{subtitle}</p>}
        </div>

        <div className="border-ink-200 rounded-card shadow-card border bg-white p-6 sm:p-7">
          {children}
        </div>

        {footer && <p className="text-ink-500 mt-5 text-center text-sm">{footer}</p>}
      </div>
    </Container>
  );
}
