import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export interface SidebarNavItem {
  label: string;
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
  return (
    <aside className="sidebar" data-testid={testId ?? 'sidebar'}>
      {brand ? (
        <Link to={brandHref ?? '/dashboard'} className="sidebar__brand" data-testid="sidebar-brand">
          {brand}
        </Link>
      ) : null}
      <nav className="sidebar__nav" aria-label="Primary">
        {navItems.map((item, i) => {
          const active = item.href === currentPath;

          return (
            <Link
              key={`${item.href}:${i}`}
              className={`sidebar__link${active ? ' active' : ''}`}
              to={item.href}
              aria-current={active ? 'page' : undefined}
              data-testid={`sidebar-link-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <span className="sidebar__icon" aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      {footer ? <div className="sidebar__foot">{footer}</div> : null}
    </aside>
  );
}
