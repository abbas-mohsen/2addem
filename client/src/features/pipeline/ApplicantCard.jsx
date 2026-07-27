import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Star } from 'lucide-react';
import { Badge } from '../../components/ui/Badge.jsx';
import { initials } from '../../lib/format.js';
import { cn } from '../../lib/cn.js';
import { useFormat } from '../../hooks/useFormat.js';

export function ApplicantCard({ application, onOpen, dragging = false, overlay = false }) {
  const format = useFormat();
  const withdrawn = application.status === 'withdrawn';

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: application._id,
    // A withdrawn candidate cannot be moved, so the card is not a drag source.
    disabled: withdrawn || overlay,
  });

  const style = overlay ? undefined : { transform: CSS.Translate.toString(transform) };

  return (
    <article
      ref={overlay ? undefined : setNodeRef}
      style={style}
      className={cn(
        'border-ink-200 rounded-lg border bg-white p-3 transition-shadow',
        overlay ? 'shadow-lift rotate-1 cursor-grabbing' : 'shadow-card',
        (isDragging || dragging) && !overlay && 'opacity-40',
        withdrawn && 'opacity-60'
      )}
    >
      <div className="flex items-start gap-2.5">
        {!withdrawn && !overlay && (
          <button
            type="button"
            className="text-ink-300 hover:text-ink-600 -ms-1 cursor-grab touch-none rounded p-0.5 active:cursor-grabbing"
            aria-label={`Drag ${application.candidate?.name ?? 'candidate'}`}
            {...listeners}
            {...attributes}
          >
            <GripVertical className="size-4" />
          </button>
        )}

        <button
          type="button"
          onClick={() => onOpen?.(application)}
          className="min-w-0 flex-1 text-start"
        >
          <div className="flex items-center gap-2">
            <span
              className="bg-brand-100 text-brand-700 flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
              aria-hidden="true"
            >
              {initials(application.candidate?.name ?? '?')}
            </span>
            <span className="text-ink-900 truncate text-sm font-medium">
              {application.candidate?.name ?? 'Candidate'}
            </span>
          </div>

          {application.candidate?.profile?.headline && (
            <p className="text-ink-500 mt-1.5 line-clamp-2 text-xs leading-snug">
              {application.candidate.profile.headline}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {withdrawn && <Badge tone="neutral">Withdrawn</Badge>}
            {application.score != null && (
              <span className="text-ink-600 inline-flex items-center gap-0.5 text-xs">
                <Star className="size-3 fill-amber-400 text-amber-400" aria-hidden="true" />
                {application.score}
              </span>
            )}
            {application.tags?.slice(0, 2).map((tag) => (
              <Badge key={tag} tone="outline">
                {tag}
              </Badge>
            ))}
            {application.notes?.length > 0 && (
              <span className="text-ink-400 text-xs">
                {application.notes.length} note{application.notes.length === 1 ? '' : 's'}
              </span>
            )}
          </div>

          <p className="text-ink-400 mt-2 text-[11px]">
            Applied {format.relative(application.createdAt)}
          </p>
        </button>
      </div>
    </article>
  );
}
