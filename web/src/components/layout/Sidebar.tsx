import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export interface SidebarNavItem {
  label?: string;
  /**
   * i18n key used by the centralised nav-config. Resolved at render
   * time via the `layout` namespace. If both `label` and `labelKey`
   * are supplied, `labelKey` wins (callers that pass a literal label
   * should drop the literal).
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
export function Sidebar({ navItems, currentPath, brand, brandHref, footer, testId }: SidebarProps) {
  const { t } = useTranslation();

  return (
    <aside className="sidebar" data-testid={testId ?? 'sidebar'}>
      {brand ? (
        <Link
          to={brandHref ?? '/dashboard'}
          className="sidebar__brand"
          data-testid="sidebar-brand"
          aria-label={t('layout:sidebar.ariaBrand', { defaultValue: 'Surakkha home' })}
        >
          {brand}
        </Link>
      ) : null}
      <nav
        className="sidebar__nav"
        aria-label={t('layout:sidebar.ariaPrimary', { defaultValue: 'Primary' })}
      >
        {navItems.map((item, i) => {
          const active = item.href === currentPath;
          // labelKey is the canonical path; literal `label` is the
          // fallback for callers that haven't migrated yet.
          const resolvedLabel = item.labelKey ? t(item.labelKey) : item.label ?? '';
          const testIdSlug = resolvedLabel.toLowerCase().replace(/\s+/g, '-') || `item-${i}`;

          return (
            <Link
              key={`${item.href}:${i}`}
              className={`sidebar__link${active ? ' active' : ''}`}
              to={item.href}
              aria-current={active ? 'page' : undefined}
              data-testid={`sidebar-link-${testIdSlug}`}
            >
              <span className="sidebar__icon" aria-hidden="true">
                {item.icon}
              </span>
              <span>{resolvedLabel}</span>
            </Link>
          );
        })}
      </nav>
      {footer ? <div className="sidebar__foot">{footer}</div> : null}
    </aside>
  );
}
