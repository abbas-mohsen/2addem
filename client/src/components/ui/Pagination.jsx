import { Button } from './Button.jsx';
import { NextIcon, PreviousIcon } from './DirectionalIcon.jsx';
import { useT } from '../../i18n/index.jsx';

export function Pagination({ meta, onPageChange }) {
  const t = useT();

  if (!meta || meta.totalPages <= 1) return null;

  return (
    <nav className="flex items-center justify-between gap-4 pt-2" aria-label={t('common.page', { page: meta.page, total: meta.totalPages })}>
      <p className="text-ink-500 text-sm">
        {t('common.page', { page: meta.page, total: meta.totalPages })} ·{' '}
        {t('common.results', { count: meta.total })}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={meta.page <= 1}
          onClick={() => onPageChange(meta.page - 1)}
        >
          <PreviousIcon className="size-4" aria-hidden="true" />
          {t('common.previous')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!meta.hasNextPage}
          onClick={() => onPageChange(meta.page + 1)}
        >
          {t('common.next')}
          <NextIcon className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}
