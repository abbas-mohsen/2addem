import { useDroppable } from '@dnd-kit/core';
import { ApplicantCard } from './ApplicantCard.jsx';

import { cn } from '../../lib/cn.js';
import { useFormat } from '../../hooks/useFormat.js';
import { useT } from '../../i18n/index.jsx';

const STAGE_ACCENTS = {
  applied: 'bg-ink-300',
  screening: 'bg-brand-400',
  interview: 'bg-amber-400',
  offer: 'bg-emerald-400',
  hired: 'bg-emerald-600',
  rejected: 'bg-red-400',
};

export function StageColumn({ stage, applications, onOpen, activeId }) {
  const format = useFormat();
  const t = useT();
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <section
      ref={setNodeRef}
      aria-label={t('pipeline.columnLabel', {
        stage: format.stage(stage),
        count: applications.length,
      })}
      className={cn(
        'flex w-72 shrink-0 flex-col rounded-xl border p-2.5 transition-colors',
        isOver ? 'border-brand-300 bg-brand-50/70' : 'border-ink-200 bg-ink-50/60'
      )}
    >
      <header className="flex items-center gap-2 px-1 pb-2.5">
        <span className={cn('size-2 rounded-full', STAGE_ACCENTS[stage])} aria-hidden="true" />
        <h2 className="text-ink-800 text-sm font-semibold">{format.stage(stage)}</h2>
        <span className="text-ink-500 bg-ink-200/70 ms-auto rounded-full px-2 py-0.5 text-xs tabular-nums">
          {applications.length}
        </span>
      </header>

      <div className="flex flex-1 flex-col gap-2">
        {applications.length === 0 ? (
          <p
            className={cn(
              'text-ink-400 rounded-lg border border-dashed px-3 py-6 text-center text-xs',
              isOver ? 'border-brand-300' : 'border-ink-200'
            )}
          >
            {isOver ? t('pipeline.dropHere') : t('pipeline.nobodyHere')}
          </p>
        ) : (
          applications.map((application) => (
            <ApplicantCard
              key={application._id}
              application={application}
              onOpen={onOpen}
              dragging={activeId === application._id}
            />
          ))
        )}
      </div>
    </section>
  );
}
