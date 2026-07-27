import { Container } from '../components/layout/AppLayout.jsx';
import { Button } from '../components/ui/Button.jsx';

export function NotFoundPage() {
  return (
    <Container className="py-24">
      <div className="mx-auto max-w-md text-center">
        <p className="text-brand-600 text-sm font-semibold">404</p>
        <h1 className="text-title mt-2">This page moved on</h1>
        <p className="text-ink-600 mt-3">
          The link you followed does not lead anywhere. The job board is a good place to restart.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button to="/jobs">Browse jobs</Button>
          <Button variant="outline" to="/">
            Go home
          </Button>
        </div>
      </div>
    </Container>
  );
}
