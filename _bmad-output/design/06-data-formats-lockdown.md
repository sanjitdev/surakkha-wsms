# Dimension 6 — Data Formats · Lockdown

**Status:** LOCKED (v1, 2026-09-07)
**Source preview:** `_bmad-output/design/data-preview.html`
**Target landing path:** `surakkha-app/src/types/` (deferred to engineering-setup workstream)

---

## 1. Scope

This document locks the **data shapes** that every dim 1–5 component and page template consumes via props. Each shape is a TypeScript interface + JSON example + a Zod-style runtime validator (read-only spec in dim 6; runtime validators are wired into the React scaffold workstream).

**Surfaces covered:** Priya desktop only (consistent with dim 5 §1). Other surfaces (Anjali-mobile, operator-mobile, PHA-pane) inherit the same shape rules but add surface-specific fields in their own dim 5b/c/d follow-ons.

**Out of scope:**
- **Backend wire format** (sensor envelope, chainRef layout, signature formats) — deferred to dim 7.
- **Network protocol** (HTTP/WS, retry strategy, optimistic updates) — dim 9 system-integration.
- **State management** (Redux/Zustand/React Query shape) — engineering-setup workstream.
- **Per-string locale tags** in data — banned per §4 below. Locale lives at the container level (`<body data-locale="bn">`), per dim 4 §15 + dim 5 §10.2.

---

## 2. Format conventions

### 2.1 TypeScript-first with JSON examples

Every locked shape is presented as:
1. A **TypeScript interface** — canonical, lives in `surakkha-app/src/types/*.ts`.
2. A **JSON example** — sample payload matching the interface.
3. A **Zod schema** (read-only spec in dim 6) — runtime validator that the React scaffold can adopt if Zod is the team's choice.

Zod is optional; TypeScript types are the source of truth.

### 2.2 Discriminated unions, not `any`

Where a field has a closed set of values (`variant: "primary" | "secondary" | ...`), use a TypeScript union or a discriminated union. **No `string` for closed sets** — `variant: string` defeats the purpose.

```ts
// ✓ correct — discriminated
type Band = 'high' | 'medium' | 'low';
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

// ✗ wrong — string erases the constraint
type Band = string;
```

### 2.3 Branded IDs for type safety

Domain entities (Sensor, Incident, AnjaliReport, ChainRef) use branded ID types:

```ts
type SensorId       = string & { readonly __brand: 'SensorId' };
type IncidentId     = string & { readonly __brand: 'IncidentId' };
type ReporterHandle = string & { readonly __brand: 'ReporterHandle' };
type ChainRef       = string & { readonly __brand: 'ChainRef' };
```

Brands prevent accidentally passing an `IncidentId` where a `SensorId` is expected — a class of bugs TypeScript otherwise doesn't catch.

### 2.4 Timestamps as ISO 8601 strings

All timestamps are ISO 8601 UTC strings (`"2026-09-07T09:21:14.000Z"`), not `Date` objects. Reasons:
- JSON-serializable without conversion.
- Locale-independent at the storage layer; presentation layer converts to local time.
- Matches Surakkha's chain-anchored event log convention.

```ts
type ISOTimestamp = string & { readonly __brand: 'ISOTimestamp' };
```

### 2.5 Locale at the container, not per-string

Per dim 4 §15 + dim 5 §10.2: `<body data-locale="bn">` flips the entire subtree's font family. **Data payloads never carry per-string locale tags.** A reporter's message is just a string; the rendering layer renders it in Noto Sans Bengali when the container is `data-locale="bn"`, otherwise Plex Sans.

```ts
// ✓ correct — Bangla text is a plain string
interface AnjaliReport {
  id: ReporterHandle;
  message: string;  // could be Bengali or English; rendering chooses font
  ward: WardId;
}

// ✗ wrong — per-string locale tags
interface AnjaliReport {
  id: ReporterHandle;
  message: { text: string; locale: 'en' | 'bn' };  // banned per dim 4 §15
  ward: WardId;
}
```

---

## 3. Component shapes (from dim 4)

These are the 8 primitive component shapes that everything else composes.

### 3.1 Button

```ts
type ButtonSize    = 'sm' | 'md' | 'lg';
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps {
  label: string;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: ButtonVariant;       // default: 'primary'
  size?: ButtonSize;             // default: 'md'
  icon?: IconName;               // lucide icon name; see dim 3 §6 vocabulary
  iconPosition?: 'leading' | 'trailing';  // default: 'leading'
  disabled?: boolean;            // default: false
  type?: 'button' | 'submit' | 'reset';   // default: 'button'
  ariaLabel?: string;            // required when icon-only (no label)
}

type IconName =
  | 'activity' | 'airplay' | 'alert-triangle' | 'arrow-right' | 'check'
  | 'check-circle-2' | 'chevron-down' | 'chevron-right' | 'circle-x' | 'edit'
  | 'eye' | 'eye-off' | 'filter-x' | 'globe' | 'home' | 'inbox' | 'info'
  | 'kebab-horizontal' | 'link' | 'list' | 'map' | 'message-square'
  | 'minus-circle' | 'phone-call' | 'plug' | 'plus' | 'plus-circle' | 'radio'
  | 'refresh' | 'search' | 'search-x' | 'send' | 'settings' | 'shield-alert'
  | 'shield-check' | 'user' | 'x' | 'x-circle';
```

### 3.2 Input

```ts
interface InputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'number' | 'tel' | 'url' | 'search';  // default: 'text'
  disabled?: boolean;
  readOnly?: boolean;
  leadingIcon?: IconName;
  trailingIcon?: IconName;
  onTrailingIconClick?: () => void;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  maxLength?: number;
  pattern?: string;
  autoComplete?: string;
}
```

### 3.3 TopChrome

```ts
interface TopChromeProps {
  wordmark: string;             // typically "Surakkha"
  userContext?: string;         // e.g. "Priya · ward 07"
  chainStatus?: 'healthy' | 'syncing' | 'offline';  // drives the chain-status indicator
  locale: 'en' | 'bn';          // controls the locale toggle label
  onLocaleToggle: () => void;
  onUserMenuClick?: () => void;
}
```

The 48 px height, the three-slot layout, and the locale toggle position are dim-4 §7 contract — not part of the data shape.

### 3.4 Sidebar (admin-nav)

```ts
type NavItemId = string & { readonly __brand: 'NavItemId' };

interface NavItem {
  id: NavItemId;
  label: string;
  icon: IconName;
  to: string;                    // route path
  badgeCount?: number;           // optional notification count
  children?: NavItem[];          // nested sub-items (one level deep)
  requiresPermission?: Permission;   // see §6.2
}

interface SidebarProps {
  items: NavItem[];
  activeItemId: NavItemId;
  onItemClick: (item: NavItem) => void;
  collapsed?: boolean;
  onCollapseToggle?: () => void;
}
```

Nav-item active state, hover, 44 px row height per dim 4 §8.1 — those are rendering concerns, not data.

### 3.5 Card (with-heading + compact variants)

```ts
type CardVariant = 'with-heading' | 'compact';   // dim 4 §9.1

interface CardProps {
  variant: CardVariant;
  title?: string;
  meta?: string;
  body?: React.ReactNode;
  footer?: React.ReactNode;
  icon?: IconName;
  onClick?: () => void;          // when card is interactive
}
```

The `variant: 'with-heading'` triggers `--space-xl` block padding (per dim 4 Amendment A); `compact` uses `--space-lg` all sides. This is a *data-driven* choice — pages declare the variant they want rather than styling at the call site.

### 3.6 Modal (Dialog)

```ts
type ModalSize = 'sm' | 'md' | 'lg';   // 360 / 480 / 640 px

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  size?: ModalSize;              // default: 'md'
  children?: React.ReactNode;
  primaryAction?: ButtonProps;
  secondaryAction?: ButtonProps;
  destructiveAction?: ButtonProps;   // danger variant per dim 1 §7.3
  dismissible?: boolean;         // default: true; false = Escape + overlay click both disabled
}
```

Modal focus trap + Escape close: ensured by shadcn's `<Dialog>` per dim 5 §6; not part of dim 6 data shape.

### 3.7 Toast (Sonner)

```ts
type ToastVariant = 'success' | 'warning' | 'danger' | 'info';

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastOptions {
  variant: ToastVariant;
  title: string;
  message?: string;
  durationMs?: number;           // default: 4000; dim 4 §11.3
  action?: ToastAction;
  locale?: 'en' | 'bn';          // dim 4 §15.5 — when set, applies `.toast--bangla` modifier
}
```

Toasts are produced by a `toast()` function that takes these options. Per dim 4 §11.3 toasts auto-dismiss after 4 s with a 2 px semantic progress bar; pause-on-hover; max 3 stacked.

### 3.8 Band-pill (Badge)

```ts
type Band = 'high' | 'medium' | 'low';

interface BandPillProps {
  band: Band;
  label?: string;                // default: band name in uppercase
}
```

`label` defaults to `HIGH` / `MEDIUM` / `LOW`. Icon + colour are derived from `band` (per dim 3 §6.1): `alert-triangle` / `minus-circle` / `info`.

---

## 4. Page-template shapes (from dim 5)

### 4.1 Dashboard

```ts
type KPIFormat = 'count' | 'percent' | 'duration' | 'currency' | 'number';

interface KPI {
  id: string;
  label: string;
  value: number;
  format: KPIFormat;
  trend?: { direction: 'up' | 'down' | 'flat'; deltaPct: number };
  trendIsPositiveWhen?: 'up' | 'down';   // e.g. "incidents resolved" is positive when up
  href?: string;                  // KPI is a link to a filtered page
}

interface DashboardPage {
  containerWidth: 'narrow' | 'bangla' | 'wide';   // dim 5 §3
  kpis: KPI[];                     // typically 4, fits a `col-span-3 × 4` row
  sensorBoard: SensorBoardSummary;
  recentActivity: AuditEntry[];    // see §4.6
}
```

`DashboardPage` includes recent activity so the dashboard is self-contained. The `SensorBoardSummary` type is dim-5c/7 territory (deferred).

### 4.2 Inbox List

```ts
interface InboxRow {
  id: string;
  icon?: IconName;
  title: string;
  meta: string;                   // single-line meta; multi-line rendered via white-space: normal
  badge?: BandPillProps;          // optional right-side band pill
  action?: ButtonProps;           // optional trailing action button
  href: string;                   // navigation target (typically inbox detail)
  timestamp: ISOTimestamp;
  read?: boolean;
}

interface InboxListPage {
  containerWidth: 'narrow' | 'bangla' | 'wide';
  rows: InboxRow[];
  emptyState?: EmptyStateSpec;    // dim 5 §5
  filterSummary?: string;
}
```

`InboxRow` is rendered at `--height-row-comfortable` (56 px, per dim 4 Amendment A). Bangla rows auto-add one `--space-xs` tier of block padding.

### 4.3 Inbox Detail

```ts
type IncidentStatus = 'open' | 'verified' | 'dismissed' | 'resolved';
type IncidentSource = 'sensor' | 'anjali' | 'panchayat' | 'pha';

interface Incident {
  id: IncidentId;
  status: IncidentStatus;
  band: Band;
  source: IncidentSource;
  ward: WardId;
  title: string;
  body: string;
  reportedAt: ISOTimestamp;
  verifiedAt?: ISOTimestamp;
  resolvedAt?: ISOTimestamp;
  clusterId?: ClusterId;          // if part of a sensor cluster
  chainRefs: ChainRef[];
  relatedReports: AnjaliReport[];
  sensorSnapshot?: SensorReading[];
  timeline: TimelineEvent[];      // actions taken on this incident
}

interface TimelineEvent {
  id: string;
  timestamp: ISOTimestamp;
  actor: ActorHandle;
  action: string;                 // human-readable
  chainRef?: ChainRef;            // if anchored to chain
}

interface InboxDetailPage {
  containerWidth: 'narrow' | 'bangla' | 'wide';
  incident: Incident;
  related: Incident[];            // col-span-5 list
  actions: ButtonProps[];         // e.g. "Verify", "Dismiss", "Notify councillor"
  emptyState?: EmptyStateSpec;
}
```

### 4.4 Verify Flow

```ts
type VerifyStep = 1 | 2 | 3;

interface SensorClusterEvidence {
  sensors: SensorReading[];
  clusterId: ClusterId;
  summary: string;
}

interface AnjaliCorroborationEvidence {
  reports: AnjaliReport[];
  matchingScore: number;          // 0-1; how tightly reports corroborate sensor cluster
}

interface CouncillorNotification {
  wardId: WardId;
  councillorName: string;
  notifyMethod: 'sms' | 'voice' | 'in-person';
  template: string;               // the message body
}

interface VerifyFlowPage {
  containerWidth: 'narrow' | 'bangla' | 'wide';  // typically 'narrow'
  step: VerifyStep;
  step1?: SensorClusterEvidence;
  step2?: AnjaliCorroborationEvidence;
  step3?: CouncillorNotification;
  canProceed: boolean;
}
```

### 4.5 Settings

```ts
type SettingKind = 'toggle' | 'select' | 'text' | 'numeric' | 'link' | 'danger';

interface SettingControl {
  kind: SettingKind;
  id: string;
  label: string;
  description?: string;
  value: unknown;                 // depends on kind: boolean for toggle, string for select/text, number for numeric
  options?: Array<{ value: string; label: string }>;   // for kind === 'select'
  href?: string;                  // for kind === 'link'
  dangerDescription?: string;     // for kind === 'danger' — explains consequence
}

interface SettingsSection {
  id: string;
  title: string;
  description?: string;
  controls: SettingControl[];
}

interface SettingsPage {
  containerWidth: 'narrow' | 'bangla' | 'wide';  // typically 'wide'
  sections: SettingsSection[];
}
```

The `kind: 'danger'` controls render the dim-1 outline + tinted-bg pattern. Settings-menu rows (dim 4 §8.3) consume SettingControl as their row data shape.

### 4.6 Audit Log

```ts
type ActorKind = 'user' | 'sensor' | 'system' | 'reporter';

interface AuditEntry {
  id: string;
  timestamp: ISOTimestamp;
  chainRef?: ChainRef;            // null when not yet anchored
  eventType:
    | 'sensor_spike'
    | 'sensor_offline'
    | 'report_received'
    | 'incident_verified'
    | 'incident_dismissed'
    | 'councillor_notified'
    | 'chain_anchored'
    | 'sign_in'
    | 'sign_out';
  band?: Band;                    // present for spike/offline events
  ward?: WardId;
  actor: { kind: ActorKind; handle: ActorHandle; display: string };
  action?: { label: string; onClick: () => void };
}

interface AuditLogPage {
  containerWidth: 'narrow' | 'bangla' | 'wide';  // typically 'wide' — see dim 5 §7.6
  entries: AuditEntry[];
  totalCount: number;             // for pagination UI
  pageNumber: number;
  pageSize: number;
}
```

Each `AuditEntry` maps to one row in the dim-5 §9 audit-log row table. Row slot widths (80 / 1fr / auto / 96 / 160 / auto) are rendering concerns (dim-5 §9.1) — not in the data shape.

---

## 5. Empty-state shapes (from dim 5)

```ts
type EmptyKind =
  | 'no-sensors'
  | 'no-incidents'
  | 'no-chain'
  | 'no-reports'
  | 'no-search-results'
  | 'no-filter-results'
  | 'all-caught-up'
  | 'ward-mismatch';

interface EmptyStateSpec {
  kind: EmptyKind;
  icon?: IconName;                // if absent, derived from kind
  heading?: string;               // if absent, derived from kind
  body?: string;                  // if absent, derived from kind
  primaryCta?: ButtonProps;
  secondaryCta?: ButtonProps;
}

interface EmptyStateProps {
  spec: EmptyStateSpec;
  // `kind` drives the default icon/heading/body; explicit overrides win.
}
```

The 8 `EmptyKind` values map 1:1 to dim-5 §8's 8 patterns. Rendered container is `card--with-heading` (dim-4 §9.1).

---

## 6. Domain entities (referenced throughout)

### 6.1 Actors + permissions

```ts
type UserId        = string & { readonly __brand: 'UserId' };
type ActorHandle   = string & { readonly __brand: 'ActorHandle' };
type WardId        = string & { readonly __brand: 'WardId' };
type ClusterId     = string & { readonly __brand: 'ClusterId' };

interface User {
  id: UserId;
  handle: ActorHandle;
  displayName: string;
  email?: string;
  phone?: string;
  // Mirrors the dim 7 §2.5 ActorRole 9-entry enum as of 2026-09-08.
  // `priya` here is a legacy component-shape alias retained for back-compat with
  // the dim 5 inbox-list card; the wire-side identity is `actor_identity.role`
  // and resolves to one of the 9 dim-7 strings.
  role:
    | 'priya'
    | 'utility_operator'
    | 'field_technician'
    | 'pha_approver'
    | 'pha_viewer'
    | 'utility_message_desk'
    | 'anjali'
    | 'vendor'
    | 'system';
  scopes: Scope[];                // which wards / clusters
}

type Scope = WardId | { kind: 'cluster'; clusterId: ClusterId } | { kind: 'all' };

type Permission =
  | 'incident.verify'
  | 'incident.dismiss'
  | 'incident.assign_technician'
  | 'incident.submit_diagnosis'
  | 'incident.submit_fix'
  | 'incident.resolve'
  | 'incident.reject_fix'
  | 'councillor.notify'
  | 'sensor.add'
  | 'sensor.remove'
  | 'sensor.calibrate'
  | 'settings.edit'
  | 'audit.view';
```

The dim 6 `User.role` enum was a 5-entry rough edge through 2026-09-07 (`'priya' | 'operator' | 'pha' | 'anjali' | 'admin'`); it now mirrors the dim 7 §2.5 9-entry enum so component-side type-checking stays consistent with the wire-side identity. The legacy `'priya'` alias is retained only for the dim 5 inbox-list card shape; new code uses `'utility_operator'` directly. `'admin'` is dropped (it was an internal-only role that never landed on the wire).

### 6.2 Sensor + reporter data

```ts
type SensorId = string & { readonly __brand: 'SensorId' };

interface Sensor {
  id: SensorId;
  ward: WardId;
  clusterId?: ClusterId;
  installedAt: ISOTimestamp;
  lastSeenAt: ISOTimestamp;
  firmware: string;
  batteryPct?: number;
  status: 'online' | 'offline' | 'degraded';
}

interface SensorReading {
  sensorId: SensorId;
  ward: WardId;
  timestamp: ISOTimestamp;
  turbidityNtu: number;
  pH?: number;
  temperatureC?: number;
  flags?: Array<'spike' | 'drift' | 'low-battery' | 'tamper-suspect'>;
  chainRef?: ChainRef;
}

interface AnjaliReport {
  id: ReporterHandle;
  receivedAt: ISOTimestamp;
  ward: WardId;
  message: string;                // plain string; container locale determines font
  photoUrls?: string[];           // optional attachments
  audioUrl?: string;              // voice relay via phone
  gpxCoords?: { lat: number; lng: number };
  clusterMatch?: ClusterId;
  corroboratedBy?: SensorReading[];
  chainRef?: ChainRef;
}
```

### 6.3 Chain references

```ts
type ChainRef = string & { readonly __brand: 'ChainRef' };
// ChainRef format is dim-7 territory (e.g. "0x7f3a · b9c2 · 4e8d" or a hash chain URI).
// dim 6 only owns the brand + the field that holds it.
```

### 6.4 Phase 1 mock fixtures (amendment 2026-09-07)

Per the user's call (and dim 5 §17.1), Phase 1 ships frontend-only. The mock fixtures persist in the browser, not in the gateway. The shapes are **identical** to the prod shapes; only the storage location differs.

**Storage location:** IndexedDB store named `surakkha-mock` (singleton per browser profile). No cross-browser sync, no cross-tab `BroadcastChannel` in v1.

**Stores:**

| Object store | Key | Value | Notes |
|---|---|---|---|
| `chain_blocks` | ULID `event_id` | `EnvelopeBase & { block_hash, prev_block_hash, ingested_at }` | Mirrors `chain_blocks` SQLite table from spec-1-1 |
| `chain_head` | string literal `'head'` | `{ chain_head_event_id, chain_head_hash, block_height, ingested_at }` | Cached head pointer |
| `session` | string literal `'current'` | `{ token, actor_identity, display }` | Single in-flight session per browser; cleared on logout |
| `meta` | string literal `'seeded_at'` | `ISOTimestamp` | Records when fixtures were last loaded |

**Seed-on-empty behavior:** on first load (or after reset), `src/mocks/fixtures.ts` writes the seed dataset to `surakkha-mock`. The dataset includes:

- 1 genesis block (`prev_block_hash = "0" * 64`)
- 5 sensor readings (3 sensors × 1 reading each + 2 cross-sensor cluster)
- 1 AnjaliReportSubmitted
- 1 IncidentCreated with `source_attribution` referencing the readings + report
- 1 IncidentEscalated{T1→T2}
- 1 PHA signature attestation
- 1 IncidentEscalated{T2→T3}
- 1 PublicNoticeIssued (boil_v1_bn, 68 chars UCS-2)
- 1 CouncillorEndorsementRecorded
- 2 DeviationCaptured
- 1 CityConfigChanged (threshold edit)
- Several ChainAnchored + sign_in events for audit-log density
- 1 OperatorAccessLogged for the audit-chain browser demo

**Reset semantics:** the "Reset demo data" button (Settings) clears `surakkha-mock` and reseeds from `fixtures.ts`. The seed dataset is deterministic (uses fixed ULIDs and timestamps seeded from `'2026-09-07T10:00:00.000Z'`) so screenshots and demos are reproducible.

**Network latency simulation:** MSW handlers inject a 200–400 ms random delay (`delay(200 + Math.random() * 200)`) so the loading states + chain freshness clock + SSE-poll cadence feel real. This also exercises the `prefers-reduced-motion` interaction with the chain-fail shake (dim 8 §4.9).

**Type safety:** the mock fixtures import the same TypeScript interfaces from `surakkha-app/src/types/*.ts` that production uses. The fixture type-check is the wire contract — if a fixture drifts from the prod shape, `tsc` fails.

**Hand-off to Phase 2:** when Story 1.1 lands, the same `EnvelopeBase` types are reused against the real gateway. The `surakkha-mock` store stays in the repo for Storybook stories and Vitest component tests (run via `msw/node`).

---

### 6.5 Field technician + work order (Story 1.2)

```ts
type TechnicianId = string & { readonly __brand: 'TechnicianId' };
type WorkOrderId  = string & { readonly __brand: 'WorkOrderId' };

interface FieldTechnician {
  id: TechnicianId;
  handle: ActorHandle;
  displayName: string;
  role: 'field_technician';
  zone: string;                       // free-text zone label (e.g., 'NE zone')
  specialism: 'chlorination' | 'mechanical' | 'electrical' | 'generalist' | 'sensor_calibration';
  // attendance + capacity metadata — pulled from `utility-roster` (Phase 1 mock returns 3 fixtures)
  currentShiftId?: string;
  activeJobCount: number;              // 0..N; displayed alongside the technician card on the assign-tech panel
  // device actor — the field-tablet that signs the chain events on the technician's behalf
  deviceActorRef: string;
  ed25519_pubkey: string;              // base64url(no prefix); populates the `tech-sig` row in mockup §01.4
  scopes: Scope[];                     // which wards / clusters the technician is rated for
}

interface WorkOrder {
  id: WorkOrderId;                     // content-addressed: sha256(canonical({technician_id, incident_id, assigned_at}))
  technician_id: TechnicianId;
  incident_id: ULID;
  priority: 'P1' | 'P2' | 'P3' | 'P4';
  eta_target_minutes: number;
  work_order_summary: string;
  assigned_at: ISOTimestamp;
  status:
    | 'assigned'                       // freshly dispatched; awaiting arrival
    | 'en_route'                       // technician pings "I'm on the way"
    | 'on_site'                        // TechnicianArrived landed
    | 'in_progress'                    // DiagnosisSubmitted or FixSubmitted without incident-resolve yet
    | 'resolved'                       // IncidentResolved landed
    | 'rejected'                       // DeviationCaptured landed; reopened
    | 'overdue';                       // SLA missed
  reopen_count: number;                // 0..N; ticks every time DeviationCaptured lands
  chainRef: ChainRef;                  // the originating TechnicianAssigned event's block_hash
}
```

**Why two separate shapes?** The `FieldTechnician` is a roster-side entity (`utility-roster` service in production; `fixtures.ts` in Phase 1); the `WorkOrder` is the chain-derived view (read-model projection of `TechnicianAssigned / TechnicianArrived / DiagnosisSubmitted / FixSubmitted / IncidentResolved / DeviationCaptured`). The technician-list page reads `FieldTechnician[]`; the work-queue page reads `WorkOrder[]`; they reconcile via `WorkOrder.technician_id ↔ FieldTechnician.id`.

**'reopen_count' invariant:** the field-tech work-queue UI surfaces an overdue-row indicator when `reopen_count > 0`, since multiple `DeviationCaptured` events against the same work order are an audit red flag. The projection is computed at read time; not stored.

---

## 7. What is NOT in data

## 7. What is NOT in data

Per dim 4 §19 (token consumption rules) + dim 5 §14:

1. **No spacing/radius/height values** in data — never `{ padding: 16 }` or `{ height: '40px' }`. Visual tokens are rendering concerns.
2. **No color/colour values** in data — never `{ bg: '#F7F7F5' }`. Tokens drive theming; colour is on the DOM via class names / CSS variables.
3. **No breakpoint values** — never `{ responsive: '>768px' }`. Tailwind class strings like `md:hidden` handle this at the markup layer.
4. **No z-index values** — never `{ z: 100 }`. z-index tokens own the layering.
5. **No animation durations** — never `{ transition: 150 }`. dim 8 owns motion.
6. **No shadow values** — never `{ shadow: '...' }`. Shadow tokens own elevation.
7. **No per-string locale tags** — banned per dim 4 §15 and §2.5 above.
8. **No font-family** in data — locale + class drive fonts.

A data shape that *requires* any of these for rendering is a dim 6 violation. The fix is a token or class change, not a data fix.

---

## 8. Bangla inside data *(carries dim-2 §9.4 + dim-4 §15 + dim-5 §10)*

### 8.1 Plain-text Bangla strings

Bangla reporter messages, councillor names, ward names in Bangla — all stored as plain `string`. The rendering layer reads the container's `data-locale` attribute and switches the font family.

```ts
// Stored:
const message = "সকাল থেকে পানি বাদামি";   // ReporterHandle + ISO timestamp + body string
// Renders as Noto Sans Bengali when <body data-locale="bn">, otherwise Plex Sans.
```

### 8.2 Bangla digits in tabular data

`Incidents count`, `Sensor reading value`, etc. that render in Bangla-locale cells use Bangla digits (০১২৩৪৫৬৭৮৯) via the `font-variant-numeric: bengali` rule — but the **stored value is still a JavaScript `number`**. Digit glyphs are a presentation choice; storage is locale-neutral.

```ts
const reading: SensorReading = {
  turbidityNtu: 6.8,             // stored as number, NOT "৬.৮"
  // ... presentation: --font-variant renders Bangla digits when locale = 'bn'
};
```

### 8.3 Numbers in audit-log cells

The audit-log time slot (`09:21:14`) and chain-ref slot (`0x7f3a · b9c2 · 4e8d`) stay Latin even in Bangla locale — chain refs are cryptographic identifiers (not user-facing content), and times are operational data (24-hour clock is universally readable). Bangla *narrative* in the audit body renders Bangla; tabular numeric data stays Latin.

---

## 9. Hand-off to dimension 7 (sensor / wire format)

Carry forward from this dim:

- **`SensorReading.flags` enum:** `'spike' | 'drift' | 'low-battery' | 'tamper-suspect'` is dim 6's stable type. dim 7 owns the *detection thresholds* (e.g. "turbidity > 4 for 5 min → spike"), *sensor envelope* (network-side packet structure), and *chain anchor format*.
- **`ChainRef` brand:** dim 6 owns the brand type. dim 7 owns the *string format* and the validation regex.
- **`AuditEntry.eventType` enum:** dim 6 owns the type. dim 7 owns the wire encoding (e.g. `event_type: 0x07` for `chain_anchored`).
- **`AnjaliReport` message field:** plain string in dim 6. dim 7 owns the message classification (e.g. `_classify(message): 'water_quality' | 'infrastructure' | 'other'`) and any sanitisation.
- **`clusterId` and `clusterMatch`:** dim 6 brands. dim 7 owns the cluster-detection algorithm (e.g. DBSCAN over `(ward, time-window, threshold)`).

---

## 10. Hand-off to dimension 8 (motion)

- **Data shapes are motion-agnostic.** No `transition`, `delay`, `duration`, or animation state in data.
- **Animated transitions between states** (e.g. inbox-row expanding on hover-to-reveal-action) use motion owned by dim 8, triggered by component state changes — not by data-shape changes.
- **`Toast.durationMs`** is the only time-shaped field allowed; this is *user-controlled* (the toast is a UI affordance with a lifetime), not motion. dim 8 codifies the toast progress-bar animation but the `durationMs` cap lives in dim 4 §11.3 (default 4000 ms).

---

## 11. Token consumption rules (enforced in code review)

1. **No `any` in component prop types.** Discriminated unions or branded IDs for closed sets.
2. **No per-string locale tags** in data (`{ text, locale }` pairs banned).
3. **No spacing/radius/height/color/z-index/shadow values** in data (see §7).
4. **No timestamps as `Date` objects.** Use ISO 8601 branded strings.
5. **No `string` for closed enums.** Use `type X = 'a' | 'b'` (and add a Zod validator if Zod is adopted).
6. **Plain strings for Bangla content.** Not `{ text, locale }`.
7. **Plainer numbers for Bangla-digit rendering.** Store numeric, render via `font-variant-numeric`.
8. **Brands on ID types** to prevent accidental cross-domain passing (e.g. `SensorId` not assignable to `IncidentId`).
9. **No `onClick: any`.** Use specific signatures (`(event: MouseEvent) => void` or `() => void`).
10. **All shapes renderable from `data-locale="en"` or `data-locale="bn"`** — never locale-specific shapes.

---

## 12. Verification checklist

Before any dim 7 work begins, confirm:

- [x] `data-preview.html` opens; all 8 component shapes rendered as TS interfaces + JSON examples + Zod schemas
- [x] All 6 page-template shapes rendered (Dashboard / Inbox List / Inbox Detail / Verify Flow / Settings / Audit Log)
- [x] 8 empty-state kinds listed with default icon + heading + body
- [x] Domain entities (User / Scope / Permission / Sensor / SensorReading / AnjaliReport) rendered with branded IDs
- [x] Locale-at-container rule demonstrated via a sample container with both `data-locale="en"` and `data-locale="bn"` showing plain-string Bangla content
- [x] §7 "What is NOT in data" section visible with example violations
- [x] Theme switcher (light/dark) re-tints
- [x] Locale switcher (en/bn) shows Bangla content rendering
- [x] `06-data-formats-lockdown.md` has the standard 19-section structure + extra §6/§7/§8 Bangla-aware sections
- [x] No `any` types in any sample interface
- [x] No `Date` types anywhere — ISO 8601 strings only

### Verification deferred to engineering-setup workstream

- [ ] All interfaces in `surakkha-app/src/types/` match the shapes in this doc
- [ ] Optional: Zod schemas in `surakkha-app/src/schemas/` mirror each interface
- [ ] ESLint rule blocks `any` in component prop types
- [ ] ESLint rule blocks per-string locale tags in interfaces
- [ ] Storybook (or equivalent) renders each component with sample data matching the shape

---

## 13. What was deliberately rejected

| Considered | Rejected because |
|---|---|
| JSON Schema | Heavier tooling; harder to consume in TS components without codegen. TS-first is friendlier for the chosen stack. |
| Zod-only | Adds a runtime dependency the team hasn't picked yet. TS interfaces are the source of truth; Zod is optional. |
| Per-string locale tags | Doubles payload size; makes every string 2× the data; locale lives at the container per dim 4 §15. |
| Per-string script tags (`{ latinText, banglaText }`) | Same problem + adds data-shape ambiguity about which text is canonical. |
| Date objects | Not JSON-serialisable; locale-dependent at storage time; strftime vs ISO confusion. |
| Untyped IDs (`id: string`) | Defeats the type system; allows `SensorId` to flow into `IncidentId`. Branded IDs prevent this. |
| `any` in props | Defeats the entire purpose of TS. |
| Spacing values in data | Visual token belongs in CSS / tokens. Per dim 4 §19. |
| Time-shape fields like `{ animationDelay: 150 }` in component data | Motion is dim 8. |
| Redux / Zustand / React Query state-shape decisions | Defer to engineering-setup workstream; dim 6 owns prop shapes. |
| `clusterId?: ClusterId` becoming `clusterIds: ClusterId[]` | A single incident can only be in one cluster; one-to-one cardinality. Multi-cluster belongs to the Sensor side. |
| An `as any` escape hatch in interfaces | No escape hatch. If a shape needs `any`, that's a dim 6 violation to fix. |

---

## 14. Open flags (deferred, not blockers)

### Flag P · `dashboard.recentActivity` cardinality

- Current: capped at 5 entries in the dashboard widget; full list lives in audit log.
- Risk: 5 is arbitrary; some Priya sessions scroll recent activity for context.
- Mitigation if painful: paginate or load-on-scroll.
- Decision owner: dim 9.

### Flag Q · `SettingControl.kind === 'danger'` requires `dangerDescription`?

- Current: `dangerDescription` is optional; absent reads as "this is destructive — proceed carefully" without context.
- Risk: Some destructive settings (e.g. "Reset ward scope") need a confirmation modal anyway, making the description redundant.
- Mitigation if painful: make `dangerDescription` required and add a `confirmModal?: ModalProps` field.
- Decision owner: dim 9 (settings UX review).

### Flag R · `AnjaliReport.message` length cap

- Current: no length cap in type. Storage layer caps at 1024 chars.
- Risk: a 1024-char message with attachment URLs renders very long in inbox rows; truncation UX must come from the rendering side, not the data.
- Mitigation if painful: add `maxLength: number` and `truncateStrategy: 'tail' | 'word'` fields.
- Decision owner: dim 9.

### Flag S · `ClusterId` cardinality

- Current: one cluster per incident (`clusterId?: ClusterId`) and per Anjali report (`clusterMatch?: ClusterId`).
- Risk: a sensor reading might simultaneously match two clusters (rare but possible); cannot represent that in this schema.
- Mitigation if painful: switch to `clusterIds: ClusterId[]` array.
- Decision owner: dim 7 (cluster algorithm complexity).

---

## 15. Amendment log

| Date | Action | Rationale |
|---|---|---|
| 2026-09-07 | Document created. 8 component shapes + 6 page-template shapes + 8 empty-state specs + 6 domain entities (User, Sensor, SensorReading, AnjaliReport, Cluster, ChainRef). TS-first format with JSON + Zod examples. Branded IDs + ISO 8601 timestamps. Locale-at-container rule enforced. Bangla-aware data rules (§8). | Gate 0 dim 6 lockdown. |
| 2026-09-07 | §6.4 added — Phase 1 mock fixtures. Documents the `surakkha-mock` IndexedDB store (4 object stores: chain_blocks, chain_head, session, meta) with seed-on-empty behavior. Fixtures import the same TypeScript interfaces from production so wire-contract parity is preserved. Network latency simulation (200-400ms random). Reset semantics = "delete IDB + reload". Per-browser persisted state survives page reload. | Phase 1 = frontend-only demo against MSW. Locked wire shapes from dim 7 used unchanged. |
| 2026-09-08 | §6.1 User.role widened 5 → 9 entries to mirror the dim 7 §2.5 ActorRole enum (now that `'field_technician'` is added on the wire). Legacy `'priya'` alias retained; `'admin'` dropped (was internal-only, never reached the wire). 4 new permissions added: `incident.assign_technician`, `incident.submit_diagnosis`, `incident.submit_fix`, `incident.reject_fix`. §6.5 added — FieldTechnician + WorkOrder shapes (branded `TechnicianId`, `WorkOrderId`). WorkOrder.status is the chain-derived projection of the technician's `TechnicianAssigned / TechnicianArrived / DiagnosisSubmitted / FixSubmitted / IncidentResolved / DeviationCaptured` event stream. | Story 1.2 — Field Technician (Karim) persona. dim 6 → dim 7 alignment so component-side type-checking stays consistent with the wire-side identity. |
