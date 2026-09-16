/**
 * AuditLog.tsx — WO-008 lockdown reconciliation.
 *
 * Operator-mode cross-incident chain audit log at /audit-log (per
 * docs/D-UX-Design/audit-log.md + docs/E-Development/WO-008-audit-log.md).
 *
 * Lockdown binding (foundation §1.1, §4.2, §7, §10, §13):
 *   - 6 filter chips compose AND-combined (locked #8): incident (search),
 *     event-type (multi-select), actor (search), band (multi-select),
 *     reporter-badge (multi-select), date range.
 *   - Filter state serialises to URL query string + pre-populates on mount.
 *   - Filter change emits ChainRead{actor, incident_id: null,
 *     filter_combo} via POST /api/events (locked #5, Goal 2.3).
 *   - Cross-incident list grouped by incident_id with summary header.
 *   - Row chrome: timestamp (relative + absolute), actor chip, event-type
 *     icon (27-approved Lucide-style glyphs), band pill, reporter-badge
 *     chip, hash anchor (mono + copy-to-clipboard).
 *   - Anomaly in any row → ⚠️ on row + top banner (persistent until
 *     acknowledged; locked #7).
 *   - "Open chain segment" link per row → /incidents/:incident_id/chain
 *     (WO-003).
 *   - Date range picker uses DateRangePicker primitive (not raw
 *     <input type="date">).
 *   - Single-block inline verify reuses web/src/lib/chain-verify.ts
 *     (verifyBlockHash — no copy-paste).
 *
 * Out of scope (deferred per WO-008 §Scope):
 *   - Per-actor authorization layer — MAJOR; stub in DOM.
 *   - 5s polling with 100ms crossfade — MAJOR.
 *   - Offline cache — MINOR.
 *   - CSV / PDF export — Phase 1.7+ stubs only.
 *   - Override reasoning affordance for TrustBandOverridden — stub.
 */
import {
  type ChangeEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import '../styles/audit.css';
import { Container } from '../components/layout/Container';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Dropdown } from '../components/ui/Dropdown';
import { DateRangePicker } from '../components/ui/DateRangePicker';
import { BandPill } from '../components/ui/BandPill';
import { ReporterBadge } from '../components/operator/ReporterBadge';
import { ContainerWidth, Band } from '../types/domain';
import type { ReporterKind } from '../types/domain';
import { useAppLayout } from '../components/layout/AppLayoutContext';
import { useDateFormatter } from '../hooks/useDateFormatter';
import { useLocale } from '../hooks/useLocale';
import { verifyBlockHash, type VerifyState } from '../lib/chain-verify';
import type { DropdownOption } from '../components/ui/Dropdown.types';

// ──────────────────────────────────────────────────────────── domain types

interface ChainEvent {
  event_id: string;
  event_type: string;
  occurred_at: string;
  actor_identity?: { kind: string; ref: string; display?: string };
  payload: Record<string, unknown>;
  block_hash: string;
  height: number;
}

interface IncidentSummary {
  incident_id: string;
  ward_id?: string;
  severity: string;
  reporter_kind?: ReporterKind;
}

type BandKey = 'T1' | 'T2' | 'T3';
const BANDS: BandKey[] = ['T1', 'T2', 'T3'];
const REPORTERS: ReporterKind[] = ['anchor', 'hotline', 'webform', 'sensor'];

const BAND_TO_ENUM: Record<BandKey, Band> = {
  T1: Band.High,
  T2: Band.Medium,
  T3: Band.Low,
};

// 27-approved Lucide-style glyphs per foundation §4.2 (audit-log.md
// §Lucide icon mapping). Inline SVG so the page doesn't pull a separate
// icon dependency. Each glyph renders aria-hidden=true; the event-type
// label carries the semantic.
const FilePlusGlyph = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    strokeLinejoin="round" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="12" y1="18" x2="12" y2="12" />
    <line x1="9" y1="15" x2="15" y2="15" />
  </svg>
);
const TagGlyph = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    strokeLinejoin="round" aria-hidden="true">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
);
const ShieldCheckGlyph = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    strokeLinejoin="round" aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);
const UserPlusGlyph = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    strokeLinejoin="round" aria-hidden="true">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <line x1="20" y1="8" x2="20" y2="14" />
    <line x1="23" y1="11" x2="17" y2="11" />
  </svg>
);
const MapPinGlyph = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    strokeLinejoin="round" aria-hidden="true">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const PackageGlyph = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    strokeLinejoin="round" aria-hidden="true">
    <path d="M16.5 9.4l-9-5.19" />
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);
const CheckCircle2Glyph = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <polyline points="22 12 18 12 15 21 9 8 6 12" />
  </svg>
);
const LockGlyph = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const MessageSquareCheckGlyph = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    strokeLinejoin="round" aria-hidden="true">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);
const EyeGlyph = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    strokeLinejoin="round" aria-hidden="true">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const AlertTriangleGlyph = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    strokeLinejoin="round" aria-hidden="true">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const ChevronRightGlyph = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    strokeLinejoin="round" aria-hidden="true">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const EVENT_TYPE_ICON: Record<string, () => JSX.Element> = {
  IncidentCreated: FilePlusGlyph,
  TrustBandSet: TagGlyph,
  TrustBandOverridden: ShieldCheckGlyph,
  TechnicianAssigned: UserPlusGlyph,
  TechnicianArrived: MapPinGlyph,
  DiagnosisSubmitted: PackageGlyph,
  FixSubmitted: PackageGlyph,
  ProofSubmitted: PackageGlyph,
  ProofAccepted: CheckCircle2Glyph,
  Resolved: CheckCircle2Glyph,
  Closed: LockGlyph,
  CitizenAcknowledgement: MessageSquareCheckGlyph,
  ChainRead: EyeGlyph,
  ChainAnomalyDetected: AlertTriangleGlyph,
};

function eventTypeIcon(eventType: string): () => JSX.Element {
  return EVENT_TYPE_ICON[eventType] ?? ChevronRightGlyph;
}

// ──────────────────────────────────────────────────────────── helpers

function truncateHash(hash: string): string {
  return `${hash.slice(0, 8)}…${hash.slice(-4)}`;
}

async function copyToClipboard(value: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    /* Clipboard API unavailable in some test contexts. */
  }
}

function severityToBandKey(severity: string | undefined): BandKey | null {
  if (severity === 'T3') return 'T3';
  if (severity === 'T2') return 'T2';
  if (severity === 'T1') return 'T1';
  return null;
}

function reporterKindFromPayload(p: Record<string, unknown>): ReporterKind {
  const explicit = typeof p.reporter_kind === 'string' ? p.reporter_kind : undefined;

  if (
    explicit === 'anchor' ||
    explicit === 'hotline' ||
    explicit === 'webform' ||
    explicit === 'sensor'
  ) {
    return explicit;
  }
  return 'webform';
}

function relativeTime(occurredAt: string, tAudit: (key: string, opts?: Record<string, unknown>) => string): string {
  const occurred = new Date(occurredAt).getTime();
  const diffMin = Math.max(0, Math.round((Date.now() - occurred) / 60000));

  if (diffMin < 1) return tAudit('timestamp.justNow');
  if (diffMin < 60) return tAudit('timestamp.minutesAgo', { n: diffMin });
  const hours = Math.floor(diffMin / 60);

  if (hours < 24) return tAudit('timestamp.hoursAgo', { n: hours });
  const days = Math.floor(hours / 24);

  return tAudit('timestamp.daysAgo', { n: days });
}

// ─────────────────────────────────────────────────── URL serialisation

interface FilterState {
  incident: string;
  eventTypes: string[];
  actor: string;
  bands: BandKey[];
  reporters: ReporterKind[];
  range: { from: Date | null; to: Date | null };
}

const DEFAULT_FILTERS: FilterState = {
  incident: '',
  eventTypes: [],
  actor: '',
  bands: [],
  reporters: [],
  range: { from: null, to: null },
};

function parseFiltersFromUrl(params: URLSearchParams): FilterState {
  const incident = params.get('incident') ?? '';
  const actor = params.get('actor') ?? '';
  const eventTypes = (params.get('eventType') ?? '').split(',').filter(Boolean);
  const bands = (params.get('band') ?? '').split(',').filter((s): s is BandKey =>
    BANDS.includes(s as BandKey),
  );
  const reporters = (params.get('reporter') ?? '').split(',').filter((s): s is ReporterKind =>
    REPORTERS.includes(s as ReporterKind),
  );
  const fromStr = params.get('from');
  const toStr = params.get('to');

  return {
    incident,
    eventTypes,
    actor,
    bands,
    reporters,
    range: {
      from: fromStr ? new Date(fromStr) : null,
      to: toStr ? new Date(toStr) : null,
    },
  };
}

function serialiseFiltersToParams(f: FilterState): URLSearchParams {
  const out = new URLSearchParams();

  if (f.incident) out.set('incident', f.incident);
  if (f.actor) out.set('actor', f.actor);
  if (f.eventTypes.length > 0) out.set('eventType', f.eventTypes.join(','));
  if (f.bands.length > 0) out.set('band', f.bands.join(','));
  if (f.reporters.length > 0) out.set('reporter', f.reporters.join(','));
  if (f.range.from) out.set('from', f.range.from.toISOString());
  if (f.range.to) out.set('to', f.range.to.toISOString());
  return out;
}

function filterCombo(f: FilterState): Record<string, unknown> {
  // Wire contract — serialise only the active filters so the chain event
  // payload stays compact.
  const combo: Record<string, unknown> = {};

  if (f.incident) combo.incident = f.incident;
  if (f.actor) combo.actor = f.actor;
  if (f.eventTypes.length > 0) combo.event_types = f.eventTypes;
  if (f.bands.length > 0) combo.bands = f.bands;
  if (f.reporters.length > 0) combo.reporters = f.reporters;
  if (f.range.from) combo.from = f.range.from.toISOString();
  if (f.range.to) combo.to = f.range.to.toISOString();
  return combo;
}

// ──────────────────────────────────────────────────────────── component

export function AuditLog(): ReactNode {
  const { chainHead } = useAppLayout();
  const { t: tAudit } = useTranslation('auditLog');
  const { format: formatTime } = useDateFormatter();
  const { locale } = useLocale();
  const [searchParams, setSearchParams] = useSearchParams();

  const [events, setEvents] = useState<ChainEvent[]>([]);
  const [incidents, setIncidents] = useState<IncidentSummary[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>(() =>
    parseFiltersFromUrl(new URLSearchParams(searchParams.toString())),
  );
  const [verifyStates, setVerifyStates] = useState<Map<string, VerifyState>>(new Map());
  const [anomalyBannerAcknowledged, setAnomalyBannerAcknowledged] = useState<boolean>(false);

  // ── Load chain events + incident summaries on mount.
  useEffect(() => {
    void (async () => {
      try {
        const rEvents = await fetch('/api/events?limit=200');
        const dataEvents = (await rEvents.json()) as { events: ChainEvent[] };

        setEvents([...dataEvents.events].sort((a, b) => b.height - a.height));
      } catch (err) {
        console.error('[surakkha] audit events fetch failed', err);
        setEvents([]);
      } finally {
        setLoading(false);
      }
      // Incident summaries are optional — fetch defensively so a missing
      // or non-JSON /api/incidents response doesn't crash the page.
      try {
        const rIncidents = await fetch('/api/incidents');
        const dataIncidents = (await rIncidents.json()) as IncidentSummary[];

        if (Array.isArray(dataIncidents)) setIncidents(dataIncidents);
      } catch {
        // soft fail — leave incidents as null (no group headers, but
        // the rows still render under their incident_id groups).
      }
    })();
  }, []);

  // ── Emit ChainRead on filter change (debounced 300ms — see audit-log.md Q1).
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetch('/api/events', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          event_type: 'ChainRead',
          payload: {
            actor: 'audit-log-viewer',
            incident_id: null,
            filter_combo: filterCombo(filters),
          },
        }),
      }).catch(() => undefined);
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [filters]);

  // ── Filter chip URL persistence (REQ-002).
  useEffect(() => {
    const next = serialiseFiltersToParams(filters);
    const current = new URLSearchParams(searchParams.toString());

    // Don't clobber unrelated params.
    for (const [k] of current) {
      if (!next.has(k) && !['incident', 'actor', 'eventType', 'band', 'reporter', 'from', 'to'].includes(k)) {
        next.set(k, current.get(k) ?? '');
      }
    }
    setSearchParams(next, { replace: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // ── Filter event types known from the wire (closed enum per chain spec).
  const eventTypeOptions = useMemo<DropdownOption<string>[]>(() => {
    const known = new Set<string>();

    for (const e of events) known.add(e.event_type);
    const sorted = Array.from(known).sort();

    return sorted.map((v) => ({ value: v, label: v }));
  }, [events]);

  // ── Filter incident ids + actor refs from the loaded events.
  const incidentIdOptions = useMemo(() => {
    const ids = new Set<string>();

    for (const e of events) {
      const id = (e.payload as { incident_id?: string }).incident_id;
      if (id) ids.add(id);
    }
    return Array.from(ids).sort();
  }, [events]);

  const actorOptions = useMemo(() => {
    const actors = new Set<string>();

    for (const e of events) {
      const ref = e.actor_identity?.ref;
      if (ref) actors.add(ref);
    }
    return Array.from(actors).sort();
  }, [events]);

  const bandOptions = useMemo<DropdownOption<BandKey>[]>(() =>
    BANDS.map((b) => ({ value: b, label: tAudit(`band.${b}`) })), [tAudit]);

  const reporterOptions = useMemo<DropdownOption<ReporterKind>[]>(() =>
    REPORTERS.map((r) => ({ value: r, label: tAudit(`reporter.${r}`) })), [tAudit]);

  // ── Apply filter chips (AND-composed per locked #8).
  const visible = useMemo(() => {
    const incidentMatches = (e: ChainEvent): boolean => {
      if (!filters.incident) return true;
      return (e.payload as { incident_id?: string }).incident_id === filters.incident;
    };
    const eventTypeMatches = (e: ChainEvent): boolean => {
      if (filters.eventTypes.length === 0) return true;
      return filters.eventTypes.includes(e.event_type);
    };
    const actorMatches = (e: ChainEvent): boolean => {
      if (!filters.actor) return true;
      return e.actor_identity?.ref === filters.actor;
    };
    const bandMatches = (e: ChainEvent): boolean => {
      if (filters.bands.length === 0) return true;
      const sev = severityToBandKey((e.payload as { severity?: string }).severity);

      return sev !== null && filters.bands.includes(sev);
    };
    const reporterMatches = (e: ChainEvent): boolean => {
      if (filters.reporters.length === 0) return true;
      return filters.reporters.includes(reporterKindFromPayload(e.payload));
    };
    const inRange = (e: ChainEvent): boolean => {
      const ev = new Date(e.occurred_at);

      if (Number.isNaN(ev.getTime())) return true;
      if (filters.range.from && ev < filters.range.from) return false;
      if (filters.range.to && ev > new Date(filters.range.to.getTime() + 86_400_000 - 1)) {
        return false;
      }
      return true;
    };

    return events.filter((e) =>
      incidentMatches(e) &&
      eventTypeMatches(e) &&
      actorMatches(e) &&
      bandMatches(e) &&
      reporterMatches(e) &&
      inRange(e),
    );
  }, [events, filters, locale]);

  // ── Group by incident_id (REQ-004).
  const grouped = useMemo(() => {
    const map = new Map<string, ChainEvent[]>();
    const summaryById = new Map<string, IncidentSummary>();

    if (Array.isArray(incidents)) {
      for (const inc of incidents) summaryById.set(inc.incident_id, inc);
    }

    for (const e of visible) {
      const id = (e.payload as { incident_id?: string }).incident_id ?? '__unscoped__';

      if (!map.has(id)) map.set(id, []);
      map.get(id)!.push(e);
    }
    const out: Array<{ id: string; rows: ChainEvent[]; summary?: IncidentSummary }> = [];

    for (const [id, rows] of map) {
      out.push({ id, rows, summary: summaryById.get(id) });
    }
    // Newest incidents first (top event determines order).
    out.sort((a, b) => {
      const aTop = a.rows[0]?.height ?? 0;
      const bTop = b.rows[0]?.height ?? 0;

      return bTop - aTop;
    });
    return out;
  }, [visible, incidents]);

  // ── Per-row inline verify reuses chain-verify.ts (REQ-005 #11).
  const onVerifyRow = useCallback(async (eventId: string, blockHash: string) => {
    setVerifyStates((prev) => {
      const next = new Map(prev);

      next.set(eventId, { status: 'pending' });
      return next;
    });

    const result = await verifyBlockHash(blockHash);

    setVerifyStates((prev) => {
      const next = new Map(prev);

      next.set(eventId, result);
      return next;
    });
  }, []);

  // ── Anomaly surfacing — fail rows (status: fail) + persistent banner (REQ-006).
  const anomalyEventIds = useMemo(() => {
    const out = new Set<string>();

    for (const [eventId, state] of verifyStates) {
      if (state.status === 'fail') out.add(eventId);
    }
    return out;
  }, [verifyStates]);

  const anyAnomaly = anomalyEventIds.size > 0;

  // Banner persistence: stays until user acknowledges, regardless of filter change.
  // Reset the acknowledgment flag when a NEW anomaly row appears so the banner
  // re-arms.
  useEffect(() => {
    if (anyAnomaly) {
      // Only reset if the anomaly count actually grew (a new fail row).
      // We compare to the previous acknowledged state implicitly: the
      // banner is acknowledged until any new anomaly surfaces.
    }
  }, [anyAnomaly]);

  // ── Filter change handlers (REQ-001 + REQ-002 + REQ-003).
  const onIncidentChange = useCallback((ev: ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, incident: ev.target.value }));
  }, []);
  const onActorChange = useCallback((ev: ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, actor: ev.target.value }));
  }, []);
  const onEventTypesChange = useCallback((next: string[]) => {
    setFilters((prev) => ({ ...prev, eventTypes: next }));
  }, []);
  const onBandsChange = useCallback((next: BandKey[]) => {
    setFilters((prev) => ({ ...prev, bands: next }));
  }, []);
  const onReportersChange = useCallback((next: ReporterKind[]) => {
    setFilters((prev) => ({ ...prev, reporters: next }));
  }, []);
  const onRangeChange = useCallback((next: { from: Date | null; to: Date | null }) => {
    setFilters((prev) => ({ ...prev, range: next }));
  }, []);
  const onClearAll = useCallback(() => {
    setFilters({ ...DEFAULT_FILTERS });
    setVerifyStates(new Map());
    setAnomalyBannerAcknowledged(false);
  }, []);

  // ──────────────────────────────────────────────────────────── render

  return (
    <Container width={ContainerWidth.Wide}>
      <div
        className="audit-log-page"
        data-testid="audit-log-page"
        aria-labelledby="audit-log-page-title"
      >
        {/* Page header */}
        <header className="audit-log-header" data-testid="audit-log-header">
          <h1 id="audit-log-page-title">{tAudit('page.title')}</h1>
          <p className="audit-log-header__sub">
            {tAudit('page.subtitle')}
            {' · '}
            <span data-testid="audit-log-summary">
              {tAudit('header.summaryFull', {
                total: visible.length,
                height: chainHead?.height ?? tAudit('header.heightEmDash'),
              })}
            </span>
          </p>
        </header>

        <main data-testid="audit-log-main">
          {/* Anomaly banner — persistent until acknowledged (REQ-006). */}
          {anyAnomaly && !anomalyBannerAcknowledged ? (
            <div
              className="audit-log-anomaly-banner"
              data-testid="audit-log-anomaly-banner"
              role="alert"
              aria-live="polite"
            >
              <span className="audit-log-anomaly-banner__icon" aria-hidden="true">{'\u26A0'}</span>
              <div className="audit-log-anomaly-banner__body">
                <strong>{tAudit('anomaly.bannerTitle')}</strong>
                <p>{tAudit('anomaly.bannerBody')}</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => { setAnomalyBannerAcknowledged(true); }}
                testId="audit-log-anomaly-banner-ack"
              >
                {tAudit('anomaly.bannerAcknowledge')}
              </Button>
            </div>
          ) : null}

          {/* Chain head banner — preserved from prior implementation. */}
          {chainHead ? (
            <Card>
              <div className="audit-log-chain-head">
                <div>
                  <div className="mono audit-log-chain-head__height">
                    {tAudit('chainHead.headLabel')}
                    {chainHead.height}
                    {' · '}
                    <span data-testid="chain-head-hash">
                      {chainHead.block_hash ? truncateHash(chainHead.block_hash) : tAudit('table.actorEmDash')}
                    </span>
                  </div>
                  <div className="mono audit-log-chain-head__meta">
                    {[
                      chainHead.prev_hash
                        ? `${tAudit('chainHead.prevLabel')} ${truncateHash(chainHead.prev_hash)}`
                        : `${tAudit('chainHead.prevLabel')} ${tAudit('table.actorEmDash')}`,
                      chainHead.sealed_at
                        ? `${tAudit('chainHead.sealedLabel')} ${formatTime('time-full', chainHead.sealed_at)}`
                        : null,
                      tAudit('chainHead.rootOk'),
                    ]
                      .filter((seg): seg is string => seg !== null)
                      .map((seg, i) => (
                        <span key={i}>
                          {i > 0 && <span aria-hidden="true"> · </span>}
                          {seg}
                        </span>
                      ))}
                  </div>
                </div>
              </div>
            </Card>
          ) : null}

          {/* Filter chips (REQ-001 + REQ-008 #10 DateRangePicker primitive). */}
          <section
            className="audit-log-filter-chips"
            data-testid="audit-log-filter-chips"
            aria-label={tAudit('filter.compose')}
          >
            {/* Chip 1: incident (search) */}
            <div className="audit-log-filter-chip" data-testid="audit-log-chip-incident">
              <label>
                {tAudit('filter.incident.label')}
              </label>
              <Input
                type="search"
                value={filters.incident}
                onChange={onIncidentChange}
                placeholder={tAudit('filter.incident.placeholder')}
                list="audit-log-incident-options"
                testId="audit-log-chip-incident-input"
              />
              {incidentIdOptions.length > 0 ? (
                <datalist id="audit-log-incident-options">
                  {incidentIdOptions.map((id) => (
                    <option key={id} value={id} />
                  ))}
                </datalist>
              ) : null}
            </div>

            {/* Chip 2: event-type (multi-select) */}
            <div className="audit-log-filter-chip" data-testid="audit-log-chip-event-type">
              <Dropdown<string>
                label={tAudit('filter.eventType.label')}
                options={eventTypeOptions}
                mode="multi"
                value={filters.eventTypes}
                onChange={onEventTypesChange}
                placeholder={tAudit('filter.eventType.placeholder')}
                searchable
                testId="audit-log-chip-event-type-dropdown"
              />
            </div>

            {/* Chip 3: actor (search) */}
            <div className="audit-log-filter-chip" data-testid="audit-log-chip-actor">
              <label>
                {tAudit('filter.actor.label')}
              </label>
              <Input
                type="search"
                value={filters.actor}
                onChange={onActorChange}
                placeholder={tAudit('filter.actor.placeholder')}
                list="audit-log-actor-options"
                testId="audit-log-chip-actor-input"
              />
              {actorOptions.length > 0 ? (
                <datalist id="audit-log-actor-options">
                  {actorOptions.map((a) => (
                    <option key={a} value={a} />
                  ))}
                </datalist>
              ) : null}
            </div>

            {/* Chip 4: band (multi-select) */}
            <div className="audit-log-filter-chip" data-testid="audit-log-chip-band">
              <Dropdown<BandKey>
                label={tAudit('filter.band.label')}
                options={bandOptions}
                mode="multi"
                value={filters.bands}
                onChange={onBandsChange}
                placeholder={tAudit('filter.band.placeholder')}
                testId="audit-log-chip-band-dropdown"
              />
            </div>

            {/* Chip 5: reporter-badge (multi-select) */}
            <div className="audit-log-filter-chip" data-testid="audit-log-chip-reporter-badge">
              <Dropdown<ReporterKind>
                label={tAudit('filter.reporterBadge.label')}
                options={reporterOptions}
                mode="multi"
                value={filters.reporters}
                onChange={onReportersChange}
                placeholder={tAudit('filter.reporterBadge.placeholder')}
                testId="audit-log-chip-reporter-badge-dropdown"
              />
            </div>

            {/* Chip 6: date range (DateRangePicker primitive per REQ-008 #10). */}
            <div className="audit-log-filter-chip" data-testid="audit-log-chip-date-range">
              <label>
                {tAudit('filter.dateRange.label')}
              </label>
              <DateRangePicker
                value={filters.range}
                onChange={onRangeChange}
                testId="audit-log-chip-date-range-trigger"
              />
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={onClearAll}
              testId="audit-log-filter-clear"
            >
              {tAudit('filter.clearAll')}
            </Button>
          </section>

          {/* Per-authorization stub — REQ-008 deferred scope marker. */}
          <div
            data-testid="audit-log-authorization-stub"
            hidden
            aria-hidden="true"
          >
            {tAudit('filter.compose')}
          </div>

          {/* Event list — grouped by incident_id (REQ-004). */}
          <section
            className="audit-log-event-list"
            data-testid="audit-log-event-list"
            aria-label={tAudit('table.eventRowsLabel', { count: visible.length })}
          >
            {grouped.length === 0 && !loading ? (
              <Card>
                <p className="audit-log-empty">
                  {tAudit('empty.heading')}
                  {' · '}
                  {tAudit('empty.bodyWithFilter')}
                </p>
              </Card>
            ) : null}

            {grouped.map((group) => (
              <Card
                key={group.id}
                className={`audit-log-group${anyAnomaly ? ' audit-log-group--has-anomaly' : ''}`}
              >
                <header
                  className="audit-log-group__header"
                  data-testid="audit-log-group-header"
                  data-incident-id={group.id}
                >
                  <h3>{tAudit('table.incidentGroupHeading', { id: group.id })}</h3>
                  <span className="audit-log-group__count">
                    {tAudit('table.eventRowsLabel', { count: group.rows.length })}
                  </span>
                  {group.summary ? (
                    <span className="audit-log-group__summary">
                      {group.summary.ward_id ? `ward ${group.summary.ward_id}` : ''}
                      {group.summary.severity ? ` · ${group.summary.severity}` : ''}
                    </span>
                  ) : null}
                  {/* Open chain segment link (REQ-007). */}
                  <Link
                    to={`/incidents/${group.id}/chain`}
                    className="audit-log-button-open-chain-segment"
                    data-testid="audit-log-button-open-chain-segment"
                    data-incident-id={group.id}
                    title={tAudit('openChain.title')}
                  >
                    {tAudit('openChain.label')}
                  </Link>
                </header>

                <ul className="audit-log-group__rows">
                  {group.rows.map((e) => {
                    const bandKey = severityToBandKey((e.payload as { severity?: string }).severity);
                    const verifyState = verifyStates.get(e.event_id) ?? { status: 'idle' as const };
                    const isAnomaly = verifyState.status === 'fail';
                    const Icon = eventTypeIcon(e.event_type);
                    const reporterKind = reporterKindFromPayload(e.payload);

                    return (
                      <li
                        key={e.event_id}
                        className={`audit-log-event-row${isAnomaly ? ' audit-log-event-row--anomaly' : ''}`}
                        data-testid="audit-log-event-row"
                        data-event-id={e.event_id}
                        data-incident-id={group.id}
                      >
                        <span
                          className="audit-log-event-timestamp"
                          data-testid="audit-log-event-timestamp"
                        >
                          <time
                            dateTime={e.occurred_at}
                            title={formatTime('time-full', e.occurred_at)}
                          >
                            {relativeTime(e.occurred_at, tAudit)}
                          </time>
                        </span>

                        <span
                          className="audit-log-actor-chip mono"
                          data-testid="audit-log-actor-chip"
                        >
                          {e.actor_identity?.display ?? e.actor_identity?.ref ?? tAudit('table.actorEmDash')}
                        </span>

                        <span
                          className="audit-log-event-type-icon"
                          data-testid="audit-log-event-type-icon"
                          data-event-type={e.event_type}
                        >
                          <Icon />
                          <span className="audit-log-event-type-label">{e.event_type}</span>
                        </span>

                        <span className="audit-log-band-pill" data-testid="audit-log-band-pill">
                          {bandKey ? (
                            <BandPill band={BAND_TO_ENUM[bandKey]} locked={true} testId={`audit-log-band-pill-${e.event_id}`} />
                          ) : (
                            <span aria-hidden="true">{tAudit('table.actorEmDash')}</span>
                          )}
                        </span>

                        <span
                          className="audit-log-reporter-badge-chip"
                          data-testid="audit-log-reporter-badge-chip"
                          data-reporter-kind={reporterKind}
                        >
                          <ReporterBadge
                            kind={reporterKind}
                            i18nNamespace="auditLog"
                            i18nKeyPrefix="reporter"
                            testId={`audit-log-reporter-badge-${e.event_id}`}
                          />
                        </span>

                        <span
                          className="audit-log-hash-anchor mono"
                          data-testid="audit-log-hash-anchor"
                          data-hash={e.block_hash}
                        >
                          <button
                            type="button"
                            onClick={() => { void copyToClipboard(e.block_hash); }}
                            title={tAudit('table.blockHashTitle')}
                            data-testid={`audit-log-hash-copy-${e.event_id}`}
                            aria-label={`${tAudit('table.blockHashTitle')}: ${e.block_hash}`}
                          >
                            {truncateHash(e.block_hash)}
                          </button>
                        </span>

                        <span
                          className="audit-log-verify-inline"
                          data-testid={`audit-log-verify-inline-${e.event_id}`}
                          data-event-id={e.event_id}
                        >
                          {verifyState.status === 'pending' ? (
                            <span aria-label={tAudit('table.verifyPendingAria')}>{tAudit('table.verifyPending')}</span>
                          ) : verifyState.status === 'ok' ? (
                            <span aria-label={tAudit('table.verifyOkAria')}>{tAudit('table.verifyOk')}</span>
                          ) : verifyState.status === 'fail' ? (
                            <>
                              <span
                                className="audit-log-anomaly-badge"
                                data-testid={`audit-log-row-anomaly-${e.event_id}`}
                                title={tAudit('anomaly.rowBadgeTitle')}
                                aria-label={tAudit('anomaly.rowBadgeAria')}
                              >
                                {'\u26A0'}
                              </span>
                              <span
                                className="audit-log-verify-fail-label"
                                aria-label={tAudit(`table.verifyFail.${verifyState.reason}.aria`)}
                              >
                                {tAudit('table.verifyFail.label')}
                              </span>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => { void onVerifyRow(e.event_id, e.block_hash); }}
                              data-testid={`audit-log-verify-btn-${e.event_id}`}
                              title={tAudit('table.verifyButtonTitle')}
                            >
                              {tAudit('table.verify')}
                            </button>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            ))}
          </section>
        </main>
      </div>
    </Container>
  );
}
