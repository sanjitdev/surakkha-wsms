/**
 * nav-config.tsx
 *
 * Maps SessionRow['role'] → SidebarNavItem[]. Single source of truth for
 * which navigation items each persona sees in the sidebar.
 *
 * Why centralised:
 *   - Pre-Story-FE-1.6a, every page re-declared its own NAV array
 *     inline. That meant Priya's nav lived in OperatorDashboard's
 *     <aside>, InboxList's NAV, etc. with subtle drift (the dashboard
 *     had 8 items, the inbox only had 7 because it dropped Settings).
 *   - Centralising ensures every persona page sees the same nav for
 *     that role. Future personas plug in here; pages stay untouched.
 *
 * Roles covered:
 *   - utility_operator     → 8 items (Dashboard through Settings)
 *   - field_technician     → 4 items (Work queue, My day, Incident detail, History)
 *   - anjali, vendor       → 1 item each (the unbuilt persona surfaces; their
 *                            dedicated pages come in later stories; for now
 *                            AppLayout renders a <ComingSoonPage> inside.)
 *   - pha_approver         → 2 items (Approve, Audit)
 *   - pha_viewer           → 1 item (Audit)
 *   - utility_message_desk → 1 item (Inbox) — currently unhandled by any page
 *                            but defined here so a future message-desk
 *                            landing gets the right nav out of the box.
 */
import {
  AlertIcon,
  AuditIcon,
  CalendarIcon,
  CheckIcon,
  ClipboardListIcon,
  DashboardIcon,
  HandoverIcon,
  InboxIcon,
  LineChartIcon,
  NoticesIcon,
  SendIcon,
  SensorsIcon,
  SettingsIcon,
  UploadIcon,
  VerifyIcon,
} from '../icons/sidebar-icons';
import type { SidebarNavItem } from './Sidebar';

export const NAV_BY_ROLE: Record<string, readonly SidebarNavItem[]> = {
  utility_operator: [
    { label: 'Dashboard', href: '/dashboard', icon: <DashboardIcon /> },
    { label: 'Handover', href: '/handover', icon: <HandoverIcon /> },
    { label: 'Inbox', href: '/inbox', icon: <InboxIcon /> },
    { label: 'Verify', href: '/verify-flow', icon: <VerifyIcon /> },
    { label: 'Notices', href: '/notices', icon: <NoticesIcon /> },
    { label: 'Sensors', href: '/sensors', icon: <SensorsIcon /> },
    { label: 'Audit', href: '/audit-log', icon: <AuditIcon /> },
    { label: 'Settings', href: '/settings', icon: <SettingsIcon /> },
  ],
  field_technician: [
    { label: 'Work queue', href: '/field', icon: <ClipboardListIcon /> },
    { label: 'My day', href: '/field/my-day', icon: <CalendarIcon /> },
    { label: 'Incident detail', href: '/field/incident', icon: <AlertIcon /> },
    { label: 'History', href: '/field/history', icon: <LineChartIcon /> },
  ],
  anjali: [{ label: 'Submit report', href: '/submit', icon: <SendIcon /> }],
  pha_approver: [
    { label: 'Approve', href: '/approve', icon: <CheckIcon /> },
    { label: 'Audit', href: '/audit', icon: <AuditIcon /> },
  ],
  pha_viewer: [{ label: 'Audit', href: '/audit', icon: <AuditIcon /> }],
  vendor: [{ label: 'Submit batch', href: '/vendor', icon: <UploadIcon /> }],
  utility_message_desk: [{ label: 'Inbox', href: '/inbox', icon: <InboxIcon /> }],
};
/**
 * Resolve the persona's default landing route. Used for the sidebar
 * brand link (clicking SURAKKHA returns to the home surface) and the
 * <Navigate> target in App.tsx when a session lands on /.
 *
 * Single source of truth — App.tsx's `landingFor()` and AppLayout
 * import the same map so they cannot drift.
 */
export const LANDING_BY_ROLE: Record<string, string> = {
  field_technician: '/field',
  utility_operator: '/inbox',
  utility_message_desk: '/inbox',
  anjali: '/submit',
  pha_approver: '/approve',
  pha_viewer: '/audit',
  vendor: '/vendor',
};
export function landingFor(role: string): string {
  return LANDING_BY_ROLE[role] ?? '/';
}
