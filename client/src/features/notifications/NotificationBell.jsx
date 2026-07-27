import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CalendarClock, CheckCheck, FileText, ShieldAlert, TrendingUp } from 'lucide-react';
import { notificationsApi } from '../../api/endpoints.js';
import { errorMessage } from '../../api/client.js';
import { Spinner } from '../../components/ui/States.jsx';
import { formatRelative } from '../../lib/format.js';
import { cn } from '../../lib/cn.js';

const ICONS = {
  application_submitted: FileText,
  application_received: FileText,
  stage_changed: TrendingUp,
  interview_scheduled: CalendarClock,
  interview_cancelled: CalendarClock,
  job_taken_down: ShieldAlert,
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list({ limit: 15 }),
    // Cheap poll instead of websockets; the payload is tiny.
    refetchInterval: 60_000,
  });

  const read = useMutation({
    mutationFn: notificationsApi.read,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const readAll = useMutation({
    mutationFn: notificationsApi.readAll,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const unread = query.data?.unreadCount ?? 0;
  const items = query.data?.items ?? [];

  const openNotification = (notification) => {
    if (!notification.read) read.mutate(notification._id);
    setOpen(false);
    if (notification.link) navigate(notification.link);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-expanded={open}
        className="text-ink-500 hover:bg-ink-100 hover:text-ink-900 relative rounded-lg p-2 transition-colors"
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="bg-brand-600 absolute top-1 right-1 flex size-4 items-center justify-center rounded-full text-[10px] font-semibold text-white tabular-nums">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="border-ink-200 rounded-card shadow-lift absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] border bg-white"
        >
          <header className="border-ink-200 flex items-center justify-between border-b px-4 py-3">
            <h2 className="text-sm font-semibold">Notifications</h2>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => readAll.mutate()}
                className="text-brand-700 inline-flex items-center gap-1 text-xs font-medium hover:underline"
              >
                <CheckCheck className="size-3.5" aria-hidden="true" />
                Mark all read
              </button>
            )}
          </header>

          <div className="max-h-96 overflow-y-auto">
            {query.isPending && (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            )}

            {query.isError && (
              <p className="px-4 py-6 text-center text-sm text-red-600">
                {errorMessage(query.error)}
              </p>
            )}

            {query.isSuccess && items.length === 0 && (
              <p className="text-ink-500 px-4 py-8 text-center text-sm">
                Nothing yet. Updates on your applications will show up here.
              </p>
            )}

            <ul>
              {items.map((notification) => {
                const Icon = ICONS[notification.type] ?? Bell;
                return (
                  <li key={notification._id}>
                    <button
                      type="button"
                      onClick={() => openNotification(notification)}
                      className={cn(
                        'hover:bg-ink-50 flex w-full gap-3 px-4 py-3 text-left transition-colors',
                        !notification.read && 'bg-brand-50/50'
                      )}
                    >
                      <span
                        className={cn(
                          'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full',
                          notification.read ? 'bg-ink-100 text-ink-500' : 'bg-brand-100 text-brand-700'
                        )}
                      >
                        <Icon className="size-3.5" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            'block text-sm leading-snug',
                            notification.read ? 'text-ink-600' : 'text-ink-900 font-medium'
                          )}
                        >
                          {notification.message}
                        </span>
                        <span className="text-ink-400 mt-0.5 block text-xs">
                          {formatRelative(notification.createdAt)}
                        </span>
                      </span>
                      {!notification.read && (
                        <span
                          className="bg-brand-500 mt-2 size-1.5 shrink-0 rounded-full"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
