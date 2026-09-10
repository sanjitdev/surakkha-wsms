import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export interface SidebarNavItem {
  /**
   * Already-resolved display label (English literal).
   * Kept for backwards-compat with any caller that doesn't go
   * through i18n (the test suite uses labelKey; production callers
   * in nav-config.tsx use labelKey too after the localization refactor).
   */
  label?: string;
  /**
   * i18n key path (e.g., 'layout:nav.utility_operator.dashboard').
   * When present, Sidebar calls `t(labelKey)` so the rendered label
   * follows the active locale. Falls back to `label` if translation
   * is missing.
   */
  labelKey?: string;
  href: string;
  icon: ReactNode;
}
export interface SidebarProps {
  navItems: SidebarNavItem[];
  currentPath: string;
  brand?: string;
  /** href the brand chip navigates to. Defaults to '/dashboard'.
   *  Pass the persona's landing route so clicking SURAKKHA returns the
   *  user to their home surface (Priya → /inbox, Karim → /field, etc.). */
  brandHref?: string;
  /** Optional content rendered after the nav inside .sidebar__foot.
   *  AppLayout uses this to mount the logout button without forking
   *  the sidebar component per persona. */
  footer?: ReactNode;
  testId?: string;
}

function resolveLabel(t: (k: string) => string, item: SidebarNavItem): string {
  if (item.labelKey) {
    const translated = t(item.labelKey);
    // i18next returns the key itself when translation is missing —
    // fall back to the literal `label` (or the key) so callers see
    // something readable instead of "nav.foo.bar" rendering verbatim.
    if (translated && translated !== item.labelKey) return translated;
  }
  return item.label ?? item.labelKey ?? '';
}

export function Sidebar({ navItems, currentPath, brand, brandHref, footer, testId }: SidebarProps) {
  const { t } = useTranslation('layout');
  return (
    <aside className="sidebar" data-testid={testId ?? 'sidebar'}>
      {brand ? (
        <Link to={brandHref ?? '/dashboard'} className="sidebar__brand" data-testid="sidebar-brand">
          {brand}
        </Link>
      ) : null}
      <nav className="sidebar__nav" aria-label={t('sidebar.ariaPrimary')}>
        {navItems.map((item, i) => {
          const active = item.href === currentPath;
          const displayLabel = resolveLabel(t, item);
          return (
            <Link
              key={`${item.href}:${i}`}
              className={`sidebar__link${active ? ' active' : ''}`}
              to={item.href}
              aria-current={active ? 'page' : undefined}
              data-testid={`sidebar-link-${displayLabel.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <span className="sidebar__icon" aria-hidden="true">
                {item.icon}
              </span>
              <span>{displayLabel}</span>
            </Link>
          );
        })}
      </nav>
      {footer ? <div className="sidebar__foot">{footer}</div> : null}
    </aside>
  );
}
