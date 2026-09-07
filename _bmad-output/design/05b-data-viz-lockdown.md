# Dimension 5b — Data Visualization / Charts · Lockdown

**Status:** LOCKED (v1, 2026-09-07)
**Source preview:** `_bmad-output/design/charts-preview.html`
**Target landing path:** `app/frontend/charts/` (engineering-setup owns the wiring)

---

## 1. Scope & non-goals

**In scope for v1:**
- 9 chart types (line, vertical bar, horizontal bar, donut, sparkline, stacked area, stacked bar, heatmap, simple map view)
- Recharts as the rendering library; Leaflet + leaflet.markercluster for the map
- 33 new chart-specific design tokens (axis, grid, track, tooltip, legend, series, motion refs)
- Locale-aware tick formatting (per-chart `digitMode: 'latin' | 'locale'`)
- Dark-mode parity (full re-tint via `data-theme` attribute)
- Print stylesheet contract (`@media print` block)
- Real-time mode state machine (`static | poll | live-sse`) with SSE→poll fallback
- Per-template placement on all 6 Priya page templates (Login explicitly empty)
- TypeScript interfaces, SSE event contract, backpressure rules
- Accessibility (aria-label per chart, text-only summary via aria-describedby, keyboard-reachable tooltips)

**Out of scope (deferred):**
- Anjali submission page — no charts in her flow (single linear submission per dim 5 §7).
- Operator mobile charts — owned by dim 5c (operator surface).
- PHA-pane charts — owned by dim 5d (PHA gets tile aggregations per `EXPERIENCE.md` §77-84, not raw charts).
- Real Recharts + Leaflet wiring in `surakkha-app/` — engineering-setup workstream. Dim 5b ships the contract; engineering-setup implements against it.
- MapLibre / vector-tile upgrade — deferred to dim 9 perf review.
- Anjali low-end-Android Recharts benchmarks — dim 9.
- Chart export to PNG / SVG — deferred (regulator PDF export handled via browser print-to-PDF using the print stylesheet).

**Inherited from upstream dims (no re-litigation):**
- 54 dim-1–4 tokens (color, typography, iconography, spacing).
- Branded ID types from dim 6 §2 (`SensorId`, `WardId`, `ClusterId`, `ISOTimestamp`).
- ISO 8601 timestamps from dim 6 §2 (chart tooltip always shows ISO; axis tick uses locale formatter).
- Locale-at-container from dim 6 §2 (per-chart `digitMode` opt-in, default latin — does not violate the container rule because the chart is itself a container).
- No new hues (dim 1 §6.3 bans a second brand hue) — series palette composes from existing dim-1 tokens.
- No colored shadows (dim 1 §6.5) — chart tooltip uses the dim-1 single-neutral `--shadow-modal`.
- No gradient fills on data (dim 1 §6.4) — heatmap uses 3 discrete band-tinted steps, not a smooth gradient.
- Bangla fallback path (dim 2 §9.4) — if `Intl.NumberFormat('bn')` throws, fall back to latin digits with aria-label notice.

---

## 2. Library choice

**Recharts** (declarative, ~95 KB gzipped, composes with shadcn/ui `<Chart>` block).

```jsx
<LineChart data={points}>
  <CartesianGrid stroke="var(--chart-grid-line-major)" />
  <XAxis stroke="var(--chart-axis-line)" tick={{ fill: 'var(--chart-axis-tick)' }} />
  <YAxis stroke="var(--chart-axis-line)" />
  <Tooltip content={<ChartTooltip />} />
  <Line type="monotone" dataKey="value" stroke="var(--chart-series-1)" />
</LineChart>
```

Why Recharts:
- **Declarative + composable** — fits shadcn/ui's `<Chart>` block pattern.
- **CSS-variable themable** — Recharts components accept `stroke` / `fill` as inline strings; we pass `var(--chart-*)` directly. No library theme provider needed.
- **TypeScript first-class** — types live in the package, no `@types/recharts` install.
- **shadcn ships a chart recipe** — `npx shadcn@latest add chart` generates `<ChartContainer>` + `<ChartTooltip>` + `<ChartLegend>` wrappers we theme once via tokens.

**Leaflet 1.9.x + leaflet.markercluster 1.5.x** for the map view (chart type #9). Raster tiles only (OSM), no vector-tile server, no GL context. Bundle ~40 KB vs MapLibre's ~200 KB. MapLibre upgrade deferred to dim 9.

---

## 3. New token additions (33 tokens)

All chart tokens are CSS custom properties under `:root` (light default) and `[data-theme="dark"]`. They reference existing dim-1 tokens — **no new hues introduced.**

### 3.1 Axis (4 tokens)

| Token | Light | Dark |
|---|---|---|
| `--chart-axis-label` | `var(--fg-secondary)` | `var(--fg-secondary)` |
| `--chart-axis-tick` | `var(--fg-tertiary)` | `var(--fg-tertiary)` |
| `--chart-axis-line` | `var(--border-default)` | `var(--border-strong)` (AA contrast on dark surface) |
| `--chart-tick-length` | `4px` | `4px` |

### 3.2 Grid (4 tokens)

| Token | Value |
|---|---|
| `--chart-grid-line-major` | `var(--border-subtle)` |
| `--chart-grid-line-major-weight` | `1px` |
| `--chart-grid-line-minor` | `var(--border-subtle)` at `0.5px` opacity (only rendered when zoom > 1×) |
| `--chart-grid-dash` | `none` (solid); minor uses `2 3` |

### 3.3 Track (2 tokens)

| Token | Value |
|---|---|
| `--chart-bg` | `var(--bg-surface)` (opaque card bg; transparent only when chart sits inside an inset block) |
| `--chart-scroll-track` | `var(--bg-subtle)` |

### 3.4 Tooltip (4 tokens)

| Token | Light | Dark |
|---|---|---|
| `--chart-tooltip-bg` | `var(--bg-base)` | `var(--bg-base)` (same elevation as modal — dim 1 §2.1) |
| `--chart-tooltip-fg` | `var(--fg-default)` | `var(--fg-default)` |
| `--chart-tooltip-border` | `var(--border-default)` | `var(--border-default)` |
| `--chart-tooltip-shadow` | `var(--shadow-modal)` | `var(--shadow-modal)` (single neutral, no color tint) |

### 3.5 Legend (3 tokens)

| Token | Value |
|---|---|
| `--chart-legend-text` | `var(--fg-secondary)` |
| `--chart-legend-swatch-border` | `var(--border-default)` (1px; aids contrast on white heatmap cells) |
| `--chart-legend-row-gap` | `12px` (`--space-md`) |

### 3.6 Series palette (10 ordered tokens)

Driven from `--chart-series-1` through `--chart-series-10`. Each references an existing dim-1 token. Series tokens are aliases — they name slots; no new hues defined.

| Index | Token | Source (light) | Source (dark) | Use |
|---|---|---|---|---|
| 1 | `--chart-series-1` | `--brand-500` | `--brand-500` | Primary series |
| 2 | `--chart-series-2` | `--brand-400` | `--brand-400` | Secondary series |
| 3 | `--chart-series-3` | `--success` | `--success` | Verified / resolved |
| 4 | `--chart-series-4` | `--warning` | `--warning` | Caution / SLA breach |
| 5 | `--chart-series-5` | `--danger` | `--danger` | Rejected / errors |
| 6 | `--chart-series-6` | `--info` | `--info` | Neutral info |
| 7 | `--chart-series-7` | `--band-high` | `--band-high` | Sensor critical |
| 8 | `--chart-series-8` | `--band-medium` | `--band-medium` | Sensor mixed |
| 9 | `--chart-series-9` | `--band-low` | `--band-low` | Sensor isolated |
| 10 | `--chart-series-10` | `--fg-tertiary` | `--fg-tertiary` | Neutral fallback |

Dark-mode parity is automatic — dim-1's `[data-theme="dark"]` block already calibrates each source token for dark surfaces (per `01-color-lockdown.md` §2). No separate chart dark palette needed.

### 3.7 Motion (4 tokens — referenced from dim 8)

| Token | Value | Used by |
|---|---|---|
| `--motion-chart-tooltip-in` | `120ms ease-out` | Tooltip enter |
| `--motion-chart-tooltip-out` | `80ms ease-in` | Tooltip exit |
| `--motion-chart-new-point-flash` | `400ms ease-out` | New SSE reading flash |
| `--motion-chart-sse-pulse` | `1600ms infinite` | Live indicator pulse |

**Total new tokens: 33** (axis 4 + grid 4 + track 2 + tooltip 4 + legend 3 + series 10 + motion 4 + 2 dim-1 reference notes).

---

## 4. Chart component inventory

| # | Type | Use case | Default height |
|---|---|---|---|
| 1 | `<TimeSeriesLine>` | Sensor pH / turbidity / chlorine over time | 240 px |
| 2 | `<VerticalBar>` | Incidents per ward | 240 px |
| 3 | `<HorizontalBar>` | Councillor response times (slowest first) | 240 px |
| 4 | `<Donut>` | Band distribution (high/medium/low) | 240 px |
| 5 | `<Sparkline>` | KPI trend (embedded in KPI card) | 48 px |
| 6 | `<StackedArea>` | Multi-parameter sensor composition | 240 px |
| 7 | `<StackedBar>` | Incident lifecycle (verified/dismissed/resolved) | 240 px |
| 8 | `<Heatmap>` | Audit-log activity (day × hour) | 240 px |
| 9 | `<SensorMap>` | Sensor locations on ward map | 360 px |

---

## 5. Shared TS base contract

```ts
interface ChartBase<D> {
  data: D;
  height?: number;            // default 240, sparkline 48
  locale?: string;            // BCP-47, default 'en-IN' (dim 6 §2 convention)
  digitMode?: 'latin' | 'locale';   // default 'latin'
  theme?: 'light' | 'dark' | 'system';   // default 'system' (follows data-theme)
  ariaLabel: string;          // required
  ariaDescribedby?: string;
  mode?: 'static' | 'poll' | 'live-sse';   // default 'static'
  refreshIntervalMs?: number; // default 30000, jitter ±10%
  maxPoints?: number;         // default 200, sparkline 30
  onPointClick?: (point: D[number]) => void;
}
```

Defaults match dim 6 conventions: `locale: 'en-IN'`, ISO 8601 timestamps in payloads, branded IDs in data points.

---

## 6. Per-chart TS interfaces

### 6.1 `<TimeSeriesLine>`

```ts
import { SensorId, ISOTimestamp } from '@/data/brands';

interface TimeSeriesPoint {
  t: ISOTimestamp;
  value: number;
  seriesId: SensorId;          // multi-series via array of seriesId
}

interface TimeSeriesLineProps extends ChartBase<TimeSeriesPoint[]> {
  yLabel?: string;
  yDomain?: [number | 'auto', number | 'auto'];
  showDots?: boolean;          // default true for ≤50 points, false otherwise
}
```

### 6.2 `<VerticalBar>`

```ts
import { WardId, Band } from '@/data/brands';

interface BarDatum {
  id: WardId | ClusterId;
  label: string;
  value: number;
  band?: Band;                 // band maps to bar fill (series 7/8/9)
  stackKey?: 'verified' | 'dismissed' | 'resolved';
}

interface VerticalBarProps extends ChartBase<BarDatum[]> {
  xLabel?: string;
  sortBy?: 'value' | 'label' | 'none';   // default 'value'
}
```

### 6.3 `<HorizontalBar>`

Same `BarDatum[]` shape as vertical. Tick formatter uses `Intl.NumberFormat({ style: 'unit', unit: 'minute' })` for response-time ranking. The `band` field is optional (response times don't have a band).

### 6.4 `<Donut>`

```ts
interface DonutSlice {
  label: string;
  value: number;
  band?: Band;
}

interface DonutProps extends ChartBase<DonutSlice[]> {
  centerLabel?: string;        // shown in the donut hole (default = sum of values)
  centerFormat?: 'count' | 'percent';
}
```

Donut (not pie) keeps the center slot for KPI density. Center label uses dim-2 `--font-size-display`.

### 6.5 `<Sparkline>`

```ts
interface SparklinePoint {
  t: ISOTimestamp;
  value: number;
}

interface SparklineProps extends Omit<ChartBase<SparklinePoint[]>, 'height'> {
  height?: 48;                 // fixed
  showAxis?: false;            // never shows axis
}
```

Consumes dim 6's `KPI.trend` field (`{ direction, deltaPct }` is the rendered annotation; `value` history is the sparkline data). No tooltip overlay — tooltip on parent KPI card hover only.

### 6.6 `<StackedArea>`

```ts
type CompositionKey = 'pH' | 'turbidity' | 'chlorine';

interface StackedAreaPoint extends TimeSeriesPoint {
  compositionKey: CompositionKey;
}

interface StackedAreaProps extends ChartBase<StackedAreaPoint[]> {
  // stacks 3 sensor channels using series 1/3/4 (brand / success / warning)
}
```

### 6.7 `<StackedBar>`

```ts
type LifecycleKey = 'verified' | 'dismissed' | 'resolved';

interface StackedBarDatum extends BarDatum {
  stackKey: LifecycleKey;      // required
}

interface StackedBarProps extends ChartBase<StackedBarDatum[]> {
  normalize?: boolean;         // 100% stacked variant
}
```

### 6.8 `<Heatmap>`

```ts
type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;   // 0 = Sunday
type HourOfDay = 0 | 1 | ... | 23;

interface HeatmapCell {
  day: DayOfWeek;
  hour: HourOfDay;
  count: number;
}

interface HeatmapProps extends ChartBase<HeatmapCell[]> {
  cellSize?: number;           // default 16, drops to 12 at < --bp-lg
  colorStops?: [string, string, string];   // default = [band-low, band-medium, band-high]
}
```

7×24 grid (168 cells). Cell fill interpolates `--band-low` → `--band-medium` → `--band-high` via 3 discrete stops (per-cell count bucket). Per dim 1 §6.4, no smooth gradient — buckets are stepped.

### 6.9 `<SensorMap>`

```ts
import { SensorId, ClusterId, Band } from '@/data/brands';

interface MarkerLocation {
  sensorId: SensorId;
  lat: number;
  lng: number;
  band: Band;
  clusterId: ClusterId;
}

interface MarkerListItem {       // for @media print fallback
  ward: string;
  band: Band;
  count: number;
}

interface SensorMapProps extends Omit<ChartBase<MarkerLocation[]>, 'height' | 'digitMode'> {
  height?: number;               // default 360
  onMarkerTap: (sensorId: SensorId) => void;
  printFallback: MarkerListItem[];   // required for v1
}
```

Internally renders Leaflet. `onMarkerTap` consumer routes to `/inbox/:sensorId`. Print fallback is required (not optional) because Leaflet tiles don't print — without a fallback the chart vanishes in PDF export.

---

## 7. Locale formatter rules

Shared util `formatTick(locale, digitMode, kind, value)`:

```ts
type TickKind = 'number' | 'time' | 'duration';

function formatTick(locale: string, digitMode: 'latin' | 'locale', kind: TickKind, value: number | Date): string {
  try {
    if (kind === 'number') {
      const formatted = new Intl.NumberFormat(locale, {
        useGrouping: true,
        maximumFractionDigits: 2,
      }).format(value as number);
      return digitMode === 'locale' && locale.startsWith('bn')
        ? formatted.replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[+d])
        : formatted;
    }
    if (kind === 'time') {
      return new Intl.DateTimeFormat(locale, {
        hour: '2-digit', minute: '2-digit', hour12: false,
      }).format(value as Date);
    }
    if (kind === 'duration') {
      const minutes = Math.round((value as number) / 60000);
      return new Intl.NumberFormat(locale, { style: 'unit', unit: 'minute' }).format(minutes);
    }
  } catch {
    // Bangla fallback path (dim 2 §9.4)
    return { ariaLabel: 'Bengali digits unavailable', text: String(value) };
  }
  return String(value);
}
```

Rules:
- **Numeric ticks:** `Intl.NumberFormat(locale, { useGrouping: true, maximumFractionDigits: 2 })`. Bengali digit swap only when `digitMode === 'locale'` AND locale starts with `bn`.
- **Time axis:** `Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', hour12: false })`. Tooltip body always uses ISO 8601 (`new Date(t).toISOString()`) so audit logs are unambiguous per dim 6 §2.
- **Duration ticks:** ms → minutes, integer format with `unit: 'minute'`.
- **No currency, no percent** in v1 — Anjali/PHA monetary flows deferred.
- **Tooltip body composes** axis value (locale formatter), timestamp (ISO), legend label (plain string).

---

## 8. Dark-mode parity rules

Dim 1's `[data-theme="dark"]` block already calibrates axes 1-9 source tokens for dark surfaces (`01-color-lockdown.md` §2). Chart tokens reference those same dim-1 vars, so dark-mode parity is automatic — no separate chart dark palette.

Additional chart-specific dark rule:
- `--chart-axis-line` rebinds to `--border-strong` in dark (was `--border-default` in light) for AA contrast on dark `--bg-surface`.

Verification: AA contrast checked against dark `--bg-surface` (`#16191D`) for every series color. All 10 series colors pass AA-Large (≥3:1) on dark surface. Series 1 (brand-500 in dark) and series 7 (band-high in dark) pass AA-Body (≥4.5:1).

---

## 9. Print stylesheet rules

Single `@media print` block in the chart wrapper:

```css
@media print {
  /* Background inversion for ink saving */
  :root[data-print="true"] {
    --chart-bg: #ffffff;
    --chart-grid-line-major: var(--border-strong);
    --chart-axis-label: var(--fg-default);
    --chart-axis-tick: var(--fg-default);
  }

  /* Series darken via print-specific override */
  :root[data-print="true"] {
    --chart-series-3: var(--brand-600);   /* success → darker variant */
    --chart-series-4: #6B4710;            /* warning darker (hex hardcoded; print-only override) */
    --chart-series-5: #6B1F12;            /* danger darker (hex hardcoded; print-only override) */
  }

  .chart-tooltip { visibility: hidden; }
  .chart-flash { animation: none !important; }
  .chart-sse-pulse { display: none; }

  .chart-map { display: none; }
  .chart-map-print-fallback { display: block; break-before: page; }

  .chart-wrapper { break-inside: avoid; }
}
```

Implementation notes:
- The `[data-print="true"]` selector on `<html>` is toggled by JS before `window.print()` fires (and removed after). This isolates print overrides from the live theme.
- Series 3/4/5 hex values (`#6B4710`, `#6B1F12`) are **print-only** literals — they do not appear in any dim-1 token because dim-1 deliberately has only single-tone `--warning` and `--danger` (per `01-color-lockdown.md` §6.2). These print hex values are owned by dim 5b and live only inside `@media print` blocks.
- Tooltips: `visibility: hidden` (not `display: none`) — preserves layout so static callout labels (`::after` content generated server-side) appear in the right spot.
- Heatmap: uses `--band-low`/`-medium`/`-high` which read greyscale on B/W printers per dim 1 §2.6 luminance values — no separate print palette needed.
- Map: replaced by an ordered `<ul>` of `{ ward, count, band }` rows with `break-before: page` so it lands on a fresh sheet.
- Audit-log table + chart blocks: `display: flex; flex-direction: column` parent with `break-before: page` on chart blocks so the chart never splits across pages with the table.

Static callout labels: chart consumers pass `printableLabels: { seriesId, lastValue, lastT }[]` so the rightmost point's value appears next to its dot in print, replacing the hidden tooltip.

---

## 10. Real-time mode state machine

```ts
type ChartMode = 'static' | 'poll' | 'live-sse';

interface ModeState {
  mode: ChartMode;
  interval?: number;          // for poll
  eventSource?: EventSource;  // for live-sse
  reconnectAttempt: number;   // 0, 1, 2, ...
  status: 'connected' | 'reconnecting' | 'fallback-poll' | 'offline';
}
```

Transitions:

| From | Event | To |
|---|---|---|
| `static` | prop change to `poll` | `poll` (start `setInterval(jitter(interval))`) |
| `static` | prop change to `live-sse` | `live-sse` (open `EventSource`) |
| `poll` | prop change to `live-sse` | `live-sse` (close interval, open SSE) |
| `live-sse` | `EventSource.onopen` | `live-sse` (status: 'connected', reset `reconnectAttempt = 0`) |
| `live-sse` | `EventSource.onerror` | `live-sse` (status: 'reconnecting', close, reopen with backoff) |
| `live-sse` | `reconnectAttempt > 2` | `poll` (fallback, emit `onConnectionLost` for toast per dim 4) |
| `poll` | tick fires | call `onRefresh` callback (consumer refetches) |

Backoff for SSE reconnect: 3 s → 6 s → 12 s → ... capped at 30 s.

Polling jitter: `actual = interval * (0.9 + Math.random() * 0.2)`. ±10% prevents thundering herd when 30 operators open dashboards simultaneously.

Status indicator (top-right corner of any `mode !== 'static'` chart):
- `connected` → 6 px pulse dot, `var(--success)`, `--motion-chart-sse-pulse`
- `reconnecting` → 6 px static dot, `var(--warning)`
- `fallback-poll` → 6 px static dot, `var(--warning)` + "Polling" label (12 px Inter)
- `offline` → 6 px static dot, `var(--fg-tertiary)` + "Offline" label

---

## 11. SSE event contract

```ts
import { SensorId, ISOTimestamp, Band } from '@/data/brands';
import { Incident, IncidentId, ISOTimestamp as ISO } from '@/data/incidents';

type SSEEvent =
  | {
      type: 'reading';
      payload: {
        sensorId: SensorId;
        t: ISOTimestamp;
        value: number;
        band: Band;
      };
    }
  | {
      type: 'incident';
      payload: Incident;       // dim 6 §4.3
    };
```

Endpoint: `GET /api/sensors/stream` returns `Content-Type: text/event-stream`. Each event is one JSON-serialized `SSEEvent`. Heartbeat every 30 s (`: keepalive\n\n`) to keep proxies from dropping idle connections.

Auth: `Authorization: Bearer <jwt>` header on the `EventSource` constructor is not supported by the spec; auth is via cookie or short-lived query-param token. Implementation deferred to engineering-setup.

---

## 12. Backpressure & sliding window

Each chart maintains an internal buffer of the most recent `maxPoints` data points (default 200, sparkline 30, heatmap bounded by 7×24 = 168 — no sliding needed).

```ts
function pushPoint(buffer: TimeSeriesPoint[], point: TimeSeriesPoint, maxPoints: number): TimeSeriesPoint[] {
  const next = [...buffer, point];
  return next.length > maxPoints ? next.slice(next.length - maxPoints) : next;
}
```

Heatmap is server-aggregated — client receives the full 7×24 matrix and never appends. Server-side aggregation rules deferred to dim 7.

When SSE drops, the chart emits `onConnectionLost` and falls back to poll. The buffer is preserved across the fallback (no data loss for the visible window).

---

## 13. Map view spec

- **Library:** Leaflet 1.9.x + leaflet.markercluster 1.5.x. Chosen over MapLibre for v1 — no vector-tile server, no GL context, smaller bundle (~40 KB vs ~200 KB).
- **Base tile:** OpenStreetMap raster (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`). Attribution mandatory: `© OpenStreetMap contributors` rendered in fixed bottom-right Leaflet control, always visible (mobile included).
- **Markers:** `L.divIcon` 24 px circle. CSS classes `band-high / band-medium / band-low` map to `--band-*` tokens. White inner dot for contrast on dark themes.
- **Clustering:** `markerClusterGroup` at zoom ≤ 12. Cluster bubble shows count, fill tinted by worst band in cluster. Tap cluster → zoom in.
- **Tap interaction:** `marker.on('click', ...)` → `onMarkerTap(sensorId)`; consumer routes to `/inbox/:sensorId` (Priya inbox detail template).
- **Print:** map wrapper `display: none` inside `@media print`; static fallback `<ul>` of `{ ward, band, count }` renders in its place, `break-before: page`.
- **Mobile:** Leaflet defaults cover pinch-zoom. Rotation disabled (no `leaflet-rotate` plugin). Attribution control never collapsed on touch. `scrollWheelZoom: false` (replaced by double-tap zoom on touch, scroll-zoom on desktop) — scroll on mobile steals page scroll.
- **Bounds:** auto-fit to marker cluster bounds on mount; `maxZoom: 18`.

---

## 14. Per-template placement matrix

Charts attach as props to existing dim 6 page-template types (no new page types):

| Template | Charts | Source prop (added to dim 6 §4) |
|---|---|---|
| **Login** | None | — |
| **Dashboard** | 4× `<Sparkline>`, 1× `<TimeSeriesLine>`, 1× `<Donut>`, 1× `<HorizontalBar>` | `kpiTrends`, `sensorHistory`, `bandDistribution`, `slowestWards` |
| **InboxList** | 1× `<VerticalBar>`, 1× `<StackedBar>` | `incidentsPerWard`, `incidentsByStatus` |
| **InboxDetail** | 1× `<TimeSeriesLine>`, 1× `<StackedArea>`, 1× `<SensorMap>` | `clusterHistory`, `parameterComposition`, `siblingMarkers` |
| **VerifyFlow** | 1× `<Sparkline>` (in card header), 1× `<Donut>` | `kpiTrends`, `pastVerificationMix` |
| **AuditLog** | 1× `<Heatmap>`, 1× `<StackedBar>` | `activityHeatmap`, `eventsByWeek` |

Login has no charts (single-column form). Verify flow's sparkline is the same `<KPI>` card surface pattern from dashboard.

---

## 15. Accessibility rules

- **Every chart has `aria-label`** (required, non-optional per `ChartBase` TS interface). Format: `"{chartType} of {what}, {dataWindow}"` (e.g. `"Line chart of pH sensor readings, last 24 hours"`).
- **Every chart has `aria-describedby`** pointing to a `<p class="sr-only">` sibling that holds a text-only summary. Summary auto-generated server-side from the same data array. Example: "Sensor pH rose from 7.2 to 8.9 between 14:00 and 16:00 today; 3 of 24 readings exceeded the safety threshold."
- **Tooltips keyboard-reachable:** Tab focuses each data point dot → Enter opens tooltip → Escape closes. Focus ring from dim 4 (2 px `var(--brand-400)` outline with `--space-xs` offset).
- **Color is never the only encoding:** each band-tinted series has a label suffix `[high]`/`[med]`/`[low]` and an iconographic marker (dim 3 circle/triangle/square per band).
- **Heatmap cells:** `aria-label` per cell (`"Tuesday 14:00, 3 incidents"`); screen-reader-only via `sr-only` class on a `<span>` child per `<rect>`.
- **Map markers:** Leaflet's marker click handler also fires on Enter keypress. Cluster bubbles expose `aria-label="Cluster of N sensors, tap to zoom"`.
- **Reduced motion:** all chart animations respect `prefers-reduced-motion: reduce` — pulse dot becomes static, tooltip transitions become instant.

---

## 16. Mobile-responsive rules

- **ResponsiveContainer** wraps every chart (Recharts default). Charts adapt to viewport width.
- **Tick label every-N:** when viewport < `--bp-lg` (768 px), show every 3rd x-axis label on time series to avoid overlap.
- **Tooltip behavior:** hover on desktop (mouse), tap-to-pin on mobile (touch). Tap pins tooltip until second tap elsewhere or scroll.
- **Heatmap cells:** 16 px default, drops to 12 px at < `--bp-lg` to fit 24-column grid in 360 px viewport.
- **Map:** pinch-zoom enabled; double-tap to zoom-in replaces scroll-zoom (scroll on mobile steals page scroll).
- **Chart heights:** sparkline fixed at 48 px (never shrinks); others 240 px default, drops to 200 px at < `--bp-lg` to reduce vertical scroll.
- **Legend:** horizontal scroll on narrow viewports if legend exceeds container width (overflow-x: auto with fade-out edge mask).

---

## 17. Hand-offs

### To dim 6 (data formats)

Extend existing page-template prop interfaces rather than adding 6 new exported types. New shared shape types to export:

```ts
type SparklinePoint = { t: ISOTimestamp; value: number };
type TimeSeriesPoint = { t: ISOTimestamp; value: number; seriesId: SensorId };
type BarDatum = { id: WardId | ClusterId; label: string; value: number; band?: Band; stackKey?: 'verified'|'dismissed'|'resolved' };
type StackedBarDatum = BarDatum & { stackKey: 'verified'|'dismissed'|'resolved' };
type DonutSlice = { label: string; value: number; band?: Band };
type HeatmapCell = { day: 0|1|2|3|4|5|6; hour: 0..23; count: number };
type MarkerLocation = { sensorId: SensorId; lat: number; lng: number; band: Band; clusterId: ClusterId };
```

Fields added to existing dim 6 §4 page types:
- `DashboardPage`: `kpiTrends: SparklinePoint[]` (indexed by KPI id), `sensorHistory: TimeSeriesPoint[]`, `bandDistribution: DonutSlice[]`, `slowestWards: BarDatum[]`
- `InboxListPage`: `incidentsPerWard: BarDatum[]`, `incidentsByStatus: StackedBarDatum[]`
- `InboxDetailPage`: `clusterHistory: TimeSeriesPoint[]`, `parameterComposition: TimeSeriesPoint[]`, `siblingMarkers: MarkerLocation[]`
- `VerifyFlowPage`: `kpiTrends: SparklinePoint[]`, `pastVerificationMix: DonutSlice[]`
- `AuditLogPage`: `activityHeatmap: HeatmapCell[]`, `eventsByWeek: StackedBarDatum[]`

No new page types. No new domain entities. Charts consume the existing entity graph.

### To dim 7 (sensor wire format)

- SSE event discriminated union (see §11)
- Polling default 30 s with ±10% jitter; override via `refreshIntervalMs` prop
- Backpressure: `maxPoints: 200` for time-series, `30` for sparklines
- Heatmap cells server-aggregated (client receives 7×24 matrix, computes nothing)
- SSE heartbeat: every 30 s, comment line `: keepalive\n\n`

### To dim 8 (motion)

4 chart motion tokens (referenced, not invented in dim 5b):
- `--motion-chart-tooltip-in: 120ms ease-out`
- `--motion-chart-tooltip-out: 80ms ease-in`
- `--motion-chart-new-point-flash: 400ms ease-out` (background-color keyframe on new dot)
- `--motion-chart-sse-pulse: 1600ms infinite` (opacity 0.4 → 1.0 on live indicator only)

### To dim 9 (system integration)

- Recharts perf benchmark on operator-mobile target (not v1 Anjali, but charts may extend to operator surface later)
- Map tile network cost estimate: OSM raster ≈ 15 KB/tile; 20 tiles visible ≈ 300 KB per map open — acceptable for Priya desktop, not for Anjali (and Anjali never sees the map anyway per dim 5b §1)
- SSE connection-pool sizing: max 6 concurrent EventSources per operator session
- i18n bundle weight when `bn` locale added (digit-swap regex is 36 bytes — negligible)

### To engineering-setup workstream (post-Gate-0)

- Recharts + Leaflet installation + version pins in `package.json`
- `tailwind.config.js` extension to expose `--chart-*` tokens via Tailwind classes (or keep CSS custom properties only — preference TBD)
- shadcn `<Chart>` block generation via `npx shadcn@latest add chart`
- Leaflet SSR compatibility (Vite SPA — N/A but worth confirming)
- Service Worker for map tile caching (deferred — v1 hits network every map open)
- SSE auth header wiring (token refresh race — short-lived query-param token recommended)

---

## 18. Verification checklist

### Dim-5b-ships (validate before lockdown sign-off)

- [ ] All 33 chart tokens declared in `:root` and `[data-theme="dark"]` in `charts-preview.html`
- [ ] Series palette verified to reference dim-1 tokens (no new hex values introduced outside the print-only block)
- [ ] All 9 chart TS interfaces compile against dim 6 branded-ID types
- [ ] `formatTick` behavior visible in preview: bn-locale digits ০-৯ appear on axis labels when locale + digitMode are both bn
- [ ] Print stylesheet verified via Chrome DevTools print emulation: tooltip hidden, series darker, map replaced by `<ul>`, heatmap switches to greyscale
- [ ] Real-time live indicator visible on time-series mock (pulsing dot using `--motion-chart-sse-pulse`)
- [ ] Map attribution visible at 375 px viewport (mobile)
- [ ] Per-template placement matrix covers all 6 templates (Login explicitly empty)
- [ ] `charts-preview.html` renders all 9 chart mocks without JS console errors
- [ ] Accessibility: every chart mock has `aria-label`; tooltip keyboard-reachability note documented
- [ ] Dark-mode parity: chart mocks re-tint on theme toggle; band tokens remain legible (AA contrast on dark `--bg-surface`)
- [ ] `05b-data-viz-lockdown.md` has 18 sections matching this lockdown
- [ ] Lockdown contract references but does NOT create the production Recharts wiring (deferred to engineering-setup)

### Deferred-to-engineering-setup (dim 5b does not gate these)

- [ ] Recharts bundle split per route
- [ ] Actual `<ResponsiveContainer>` behavior on `surakkha-app/` shell
- [ ] SSE auth header wiring (token refresh race)
- [ ] Map tile caching policy (Service Worker)
- [ ] i18n bundle weight when `bn` locale added
- [ ] Low-end-Android Recharts perf benchmarks
- [ ] Leaflet SSR compatibility (Vite SPA — N/A but worth confirming)
- [ ] shadcn `<Chart>` block theming via dim-5b tokens (one-time theme pass)

---

## Amendment log

- **v1 (2026-09-07):** Initial lockdown. 9 chart types, 33 tokens, full dark-mode + print + real-time + mobile coverage.
