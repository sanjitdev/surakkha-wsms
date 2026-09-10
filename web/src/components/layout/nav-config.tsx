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
    { labelKey: 'layout:nav.utility_operator.dashboard', href: '/dashboard', icon: <DashboardIcon /> },
    { labelKey: 'layout:nav.utility_operator.handover', href: '/handover', icon: <HandoverIcon /> },
    { labelKey: 'layout:nav.utility_operator.inbox', href: '/inbox', icon: <InboxIcon /> },
    { labelKey: 'layout:nav.utility_operator.verifyFlow', href: '/verify-flow', icon: <VerifyIcon /> },
    { labelKey: 'layout:nav.utility_operator.notices', href: '/notices', icon: <NoticesIcon /> },
    { labelKey: 'layout:nav.utility_operator.sensors', href: '/sensors', icon: <SensorsIcon /> },
    { labelKey: 'layout:nav.utility_operator.audit', href: '/audit-log', icon: <AuditIcon /> },
    { labelKey: 'layout:nav.utility_operator.settings', href: '/settings', icon: <SettingsIcon /> },
  ],
  field_technician: [
    { labelKey: 'layout:nav.field_technician.workQueue', href: '/field', icon: <ClipboardListIcon /> },
    { labelKey: 'layout:nav.field_technician.myDay', href: '/field/my-day', icon: <CalendarIcon /> },
    { labelKey: 'layout:nav.field_technician.incidentDetail', href: '/field/incident', icon: <AlertIcon /> },
    { labelKey: 'layout:nav.field_technician.history', href: '/field/history', icon: <LineChartIcon /> },
  ],
  anjali: [{ labelKey: 'layout:nav.anjali.submit', href: '/submit', icon: <SendIcon /> }],
  pha_approver: [
    { labelKey: 'layout:nav.pha_approver.approve', href: '/approve', icon: <CheckIcon /> },
    { labelKey: 'layout:nav.pha_approver.audit', href: '/audit', icon: <AuditIcon /> },
  ],
  pha_viewer: [{ labelKey: 'layout:nav.pha_viewer.audit', href: '/audit', icon: <AuditIcon /> }],
  vendor: [{ labelKey: 'layout:nav.vendor.vendor', href: '/vendor', icon: <UploadIcon /> }],
  utility_message_desk: [{ labelKey: 'layout:nav.utility_message_desk.inbox', href: '/inbox', icon: <InboxIcon /> }],
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
