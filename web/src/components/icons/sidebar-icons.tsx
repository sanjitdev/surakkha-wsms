/**
 * sidebar-icons.tsx
 *
 * Shared Lucide-style SVG icons for sidebar nav links. Extracted from the
 * inline SVGs in OperatorDashboard.tsx so every page rendering <Sidebar>
 * gets the same icon set without copy-pasting path data.
 *
 * Usage:
 *   import { DashboardIcon, InboxIcon, /* ... *\/ } from '../components/icons/sidebar-icons';
 *   const NAV = [{ label: 'Dashboard', href: '/dashboard', icon: <DashboardIcon /> }, ...];
 *
 * Each icon is a bare <svg viewBox="0 0 24 24">…</svg>. The <Sidebar>
 * component already wraps every `icon` in <span className="sidebar__icon">
 * aria-hidden="true">, so consumers must NOT add that wrapper themselves —
 * just pass the icon element directly.
 *
 * Why not @phosphor-icons/react / lucide-react:
 *   Phase 1 ships UI-only against MSW+IndexedDB mocks. Adding an icon
 *   library for 8 glyphs is overkill; the inline paths are already in the
 *   locked dashboard mockup (mockups/01-priya/dashboard.html). When Phase
 *   2 wires a real icon registry, swap these for library imports — the
 *   named exports stay stable so callers don't churn.
 */

/**
 * IconShell — common wrapper that keeps every glyph consistent: 24×24
 * viewBox, stroke-only, currentColor (so the sidebar__icon CSS rule can
 * theme it), default stroke-width 2, round caps/joins.
 */
import type { ReactElement, ReactNode } from 'react';

function IconShell({ children }: { children: ReactNode }): ReactElement {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}
export function DashboardIcon(): ReactElement {
  // lucide: gauge-circle
  return (
    <IconShell>
      <path d="m12 14 4-4" />
      <path d="M3.34 19a10 10 0 1 1 17.32 0" />
    </IconShell>
  );
}
export function HandoverIcon(): ReactElement {
  // lucide: arrow-left-right
  return (
    <IconShell>
      <path d="m17 3 4 4-4 4" />
      <path d="M21 7H3" />
      <path d="m7 21-4-4 4-4" />
      <path d="M3 17h18" />
    </IconShell>
  );
}
export function InboxIcon(): ReactElement {
  // lucide: inbox
  return (
    <IconShell>
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </IconShell>
  );
}
export function VerifyIcon(): ReactElement {
  // lucide: shield-check
  return (
    <IconShell>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </IconShell>
  );
}
export function NoticesIcon(): ReactElement {
  // lucide: megaphone
  return (
    <IconShell>
      <path d="m3 11 18-5v12L3 14v-3z" />
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </IconShell>
  );
}
export function SensorsIcon(): ReactElement {
  // lucide: radio-tower
  return (
    <IconShell>
      <path d="M4.9 16.1C1 12.2 1 5.8 4.9 1.9" />
      <path d="M7.8 4.7a6.14 6.14 0 0 0 0 14.6" />
      <circle cx="12" cy="9" r="2" />
      <path d="M16.2 4.7a6.14 6.14 0 0 1 0 14.6" />
      <path d="M19.1 1.9a10.14 10.14 0 0 1 0 20.2" />
    </IconShell>
  );
}
export function AuditIcon(): ReactElement {
  // lucide: scroll-text
  return (
    <IconShell>
      <path d="M15 12h-5" />
      <path d="M15 8h-5" />
      <path d="M19 17V5a2 2 0 0 0-2-2H4" />
      <path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3" />
    </IconShell>
  );
}
export function SettingsIcon(): ReactElement {
  // lucide: settings
  return (
    <IconShell>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </IconShell>
  );
}
export function LogoutIcon(): ReactElement {
  // lucide: log-out
  return (
    <IconShell>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </IconShell>
  );
}
export function ClipboardListIcon(): ReactElement {
  // lucide: clipboard-list
  return (
    <IconShell>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4" />
      <path d="M12 16h4" />
      <path d="M8 11h.01" />
      <path d="M8 16h.01" />
    </IconShell>
  );
}
export function CalendarIcon(): ReactElement {
  // lucide: calendar-days
  return (
    <IconShell>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4" />
      <path d="M8 2v4" />
      <path d="M3 10h18" />
      <path d="M8 14h.01" />
      <path d="M12 14h.01" />
      <path d="M16 14h.01" />
      <path d="M8 18h.01" />
      <path d="M12 18h.01" />
      <path d="M16 18h.01" />
    </IconShell>
  );
}
export function AlertIcon(): ReactElement {
  // lucide: alert-circle
  return (
    <IconShell>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </IconShell>
  );
}
export function LineChartIcon(): ReactElement {
  // lucide: line-chart
  return (
    <IconShell>
      <path d="M3 3v18h18" />
      <path d="m19 9-5 5-4-4-3 3" />
    </IconShell>
  );
}
export function SendIcon(): ReactElement {
  // lucide: send
  return (
    <IconShell>
      <path d="m22 2-7 20-4-9-9-4 20-7Z" />
      <path d="M22 2 11 13" />
    </IconShell>
  );
}
export function CheckIcon(): ReactElement {
  // lucide: check
  return (
    <IconShell>
      <polyline points="20 6 9 17 4 12" />
    </IconShell>
  );
}
export function UploadIcon(): ReactElement {
  // lucide: upload
  return (
    <IconShell>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" x2="12" y1="3" y2="15" />
    </IconShell>
  );
}
