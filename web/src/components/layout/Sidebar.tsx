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
  testId?: string;
}

export function Sidebar({ navItems, currentPath, brand, testId }: SidebarProps) {
  return (
    <aside className="sidebar" data-testid={testId ?? 'sidebar'}>
      {brand ? <div className="sidebar__brand">{brand}</div> : null}
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
    </aside>
  );
}
