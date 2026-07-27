import { Languages } from 'lucide-react';
import { LOCALES, useI18n } from '../../i18n/index.jsx';
import { useAuthStore } from '../../context/authStore.js';
import { authApi } from '../../api/endpoints.js';
import { cn } from '../../lib/cn.js';

export function LanguageSwitcher({ className }) {
  const { locale, setLocale, t } = useI18n();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const change = async (next) => {
    setLocale(next);

    /* Signed-in users get the choice persisted so notifications and email
       arrive in the same language they read the site in. Best-effort: a failed
       save must not undo the switch they just made. */
    if (user && user.locale !== next) {
      setUser({ ...user, locale: next });
      authApi.updateMe({ locale: next }).catch(() => {});
    }
  };

  return (
    <label className={cn('relative inline-flex items-center', className)}>
      <Languages
        className="text-ink-500 pointer-events-none absolute start-2 size-4"
        aria-hidden="true"
      />
      <span className="sr-only">{t('common.language')}</span>
      <select
        value={locale}
        onChange={(event) => change(event.target.value)}
        className="border-ink-200 text-ink-700 hover:bg-ink-50 focus:border-brand-500 h-9 cursor-pointer rounded-lg border bg-white ps-7 pe-2 text-sm focus:outline-none"
      >
        {Object.entries(LOCALES).map(([value, { label }]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}
