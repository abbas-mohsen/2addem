import { useEffect, useState } from 'react';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';

/* A thin bar at the top of the viewport while anything is in flight. Skeletons
   cover the page being loaded; this covers everything else — mutations,
   background refetches, and the gap before a page's own skeleton mounts. */
export function RouteProgress() {
  const busy = useIsFetching() + useIsMutating() > 0;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (busy) {
      // Short work should not flash a bar; only show once it feels slow.
      const show = setTimeout(() => setVisible(true), 180);
      return () => clearTimeout(show);
    }

    // Let the finished bar play its fill-out before unmounting.
    const hide = setTimeout(() => setVisible(false), 220);
    return () => clearTimeout(hide);
  }, [busy]);

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5"
      role="progressbar"
      aria-label="Loading"
      aria-busy={busy}
    >
      <div
        className="bg-brand-500 h-full origin-left"
        style={
          busy
            ? { animation: 'route-progress 8s cubic-bezier(0.1, 0.7, 0.3, 1) forwards' }
            : { transform: 'scaleX(1)', transition: 'transform 180ms ease-out' }
        }
      />
    </div>
  );
}
