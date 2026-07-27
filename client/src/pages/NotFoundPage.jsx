import { Container } from '../components/layout/AppLayout.jsx';
import { Button } from '../components/ui/Button.jsx';
import { useT } from '../i18n/index.jsx';

export function NotFoundPage() {
  const t = useT();

  return (
    <Container className="py-24">
      <div className="mx-auto max-w-md text-center">
        <p className="text-brand-600 text-sm font-semibold">404</p>
        <h1 className="text-title mt-2">{t('errors.notFoundTitle')}</h1>
        <p className="text-ink-600 mt-3">
          {t('errors.notFoundBody')}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button to="/jobs">{t('nav.browseJobs')}</Button>
          <Button variant="outline" to="/">
            {t('errors.goHome')}
          </Button>
        </div>
      </div>
    </Container>
  );
}
