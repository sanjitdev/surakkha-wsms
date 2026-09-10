/**
 * StyleguidePage.tsx — FE-1.1b dev-only showcase.
 *
 * Interactive visualization of every dim-4 primitive + dim-5 layout
 * primitive shipped in FE-1.1a. Dev-only (gated by import.meta.env.DEV in
 * App.tsx). All controls are live:
 *   - Theme toggle (body.dataset.theme, persists to localStorage)
 *   - Locale toggle (body.dataset.locale, persists to localStorage)
 *   - Modal Esc / focus-trap demo (press Tab + Esc to feel the trap)
 *   - Toast hover-pause demo (hover the toast to pause the progress bar)
 *   - Sidebar active-state demo (click links to feel aria-current + border)
 *   - Container width toggler (mobile floor visible by resizing the window;
 *     'Full bleed' bypasses the Container component entirely)
 *
 * Layout: 2-column shell (Sidebar + main). Main renders one <Section> per
 * component, each showing every variant + a one-line description.
 */
import { type ReactNode, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import '../styles/styleguide.css';
import { Button } from '../components/ui/Button';
import { Input, SearchInput } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Toast } from '../components/ui/Toast';
import { BandPill } from '../components/ui/BandPill';
import { Container } from '../components/layout/Container';
import { EmptyState } from '../components/layout/EmptyState';
import { TopChrome } from '../components/layout/TopChrome';
import { Sidebar, type SidebarNavItem } from '../components/layout/Sidebar';
import { Dropdown, type DropdownOption } from '../components/ui/Dropdown';
import { Table, type TableColumn } from '../components/ui/Table';
import { DatePicker } from '../components/ui/DatePicker';
import { DateRangePicker } from '../components/ui/DateRangePicker';
import { Pagination } from '../components/ui/Pagination';
import { Band, ContainerWidth, DropdownMode, ToastVariant } from '../types/domain';
import { useTheme } from '../hooks/useTheme';
import { useLocale } from '../hooks/useLocale';

/** Local extension over `ContainerWidth` to drive the styleguide's own
 *  'Full bleed' wrapper (which bypasses the Container component entirely
 *  and fills the app-shell main column). ContainerWidth stays at its
 *  pinned 3-value enum. */
type ShowcaseWidth = ContainerWidth | 'full';

/* ───────────────────────── helpers ───────────────────────── */

function Section({
  title,
  blurb,
  children,
}: {
  title: string;
  blurb: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="sg-section card"
      data-testid={`sg-section-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <header className="sg-section__head">
        <h2 className="sg-section__title">{title}</h2>
        <p className="sg-section__blurb">{blurb}</p>
      </header>
      <div className="sg-section__body">{children}</div>
    </section>
  );
}
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="sg-row">
      <div className="sg-row__label">{label}</div>
      <div className="sg-row__demo">{children}</div>
    </div>
  );
}
/* ──────────────────────── icons (text) ───────────────────── */
const ICON_DASH = '▦';
const ICON_INBOX = '✉';
const ICON_FIELD = '⚙';
const ICON_AUDIT = '⌬';
const ICON_HOME = '◉';

/* ──────────────────────── Table fixture ──────────────────── */
interface TableRow {
  id: string;
  severity: 'High' | 'Medium' | 'Low';
  ward: string;
  openedAt: string;
  status: 'open' | 'resolved' | 'escalated';
}
const WARD_NAMES = ['Gulshan', 'Dhanmondi', 'Mirpur', 'Uttara', 'Tejgaon', 'Banani', 'Mohammadpur', 'Ramna'];
const TABLE_ROWS: TableRow[] = Array.from({ length: 25 }, (_, i) => {
  const idx = i + 1;

  return {
    id: `INC-${String(idx).padStart(3, '0')}`,
    severity: (['High', 'Medium', 'Low'] as const)[i % 3],
    ward: WARD_NAMES[i % WARD_NAMES.length],
    openedAt: new Date(2026, 8, 1 + i, 9 + (i % 8), (i * 7) % 60).toISOString(),
    status: (['open', 'resolved', 'escalated'] as const)[i % 3],
  };
});

/** Render the severity column as a BandPill (B5a-composed primitive). */
function renderSeverity(row: TableRow): ReactNode {
  return <BandPill band={row.severity} />;
}
/** Render the status column as a colored dot + label (low-emphasis pill). */
function renderStatus(row: TableRow): ReactNode {
  const className = `table__status-dot table__status-dot--${row.status}`;

  return (
    <span className="table__status">
      <span className={className} aria-hidden="true" />
      <span className="table__status-label">{row.status}</span>
    </span>
  );
}
/** Locale-aware short date+time. Reads the live i18n value via closure. */
function makeOpenedAtRenderer(locale: 'en' | 'bn'): (row: TableRow) => ReactNode {
  const fmt = new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return (row) => fmt.format(new Date(row.openedAt));
}
export function StyleguidePage() {
  const { t: tStyleguide } = useTranslation('styleguide');
  const [modalOpen, setModalOpen] = useState(false);
  const [toastKey, setToastKey] = useState(0);
  const [toastVariant, setToastVariant] = useState<ToastVariant>(ToastVariant.Success);
  const [containerWidth, setContainerWidth] = useState<ShowcaseWidth>(ContainerWidth.Wide);
  const [searchValue, setSearchValue] = useState('');
  const [inputValue, setInputValue] = useState('');
  // FE-B5a: dropdown showcase state — single + multi + live readout.
  const [singleWard, setSingleWard] = useState<string | null>(null);
  const [searchWard, setSearchWard] = useState<string | null>(null);
  const [disabledWard, setDisabledWard] = useState<string | null>('gulshan');
  const [multiWard, setMultiWard] = useState<string[]>(['gulshan', 'dhanmondi']);
  // FE-B5b: Table showcase state — sort + selection + page wired live.
  // The Table primitive owns its own sort state internally; we only need to
  // expose selection + pagination here.
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const paginatedRows = TABLE_ROWS.slice((page - 1) * pageSize, page * pageSize);
  // FE-B5c: DatePicker showcase state — five examples (single with today,
  // range, min/max, disabled, locale-toggle live readout).
  const [dateToday, setDateToday] = useState<Date | null>(new Date());
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null } | null>(() => {
    const today = new Date();
    const week = new Date(today);

    week.setDate(week.getDate() - 6);
    return { from: week, to: today };
  });
  const [dateBounded, setDateBounded] = useState<Date | null>(null);
  const dateMin = useMemo(() => new Date(), []);
  const dateMax = useMemo(() => {
    const d = new Date();

    d.setDate(d.getDate() + 30);
    return d;
  }, []);
  const [dateDisabled] = useState<Date | null>(new Date());
  // Pull theme + locale hooks first; the table-column renderers below close
  // over `locale` (date formatter) so the hooks must run before the columns.
  const { theme, toggle: toggleTheme } = useTheme();
  const { locale, toggle: toggleLocale } = useLocale();
  // The column descriptor for the severity + status + openedAt columns closes
  // over a function that reads the live `locale` value, so it must be built
  // inside the component (not at module top-level like the rest of TABLE_COLUMNS).
  const tableColumns: TableColumn<TableRow>[] = [
    {
      key: 'id',
      header: 'Incident',
      sortable: true,
      resizable: true,
      width: '140px',
      cellClassName: 'table__cell--mono',
    },
    {
      key: 'severity',
      header: 'Severity',
      sortable: true,
      resizable: true,
      width: '150px',
      cellClassName: 'table__cell--badge',
      render: renderSeverity,
    },
    {
      key: 'ward',
      header: 'Ward',
      sortable: true,
      resizable: true,
      width: '140px',
    },
    {
      key: 'openedAt',
      header: 'Opened at',
      sortable: true,
      resizable: true,
      width: '200px',
      cellClassName: 'table__cell--date',
      render: makeOpenedAtRenderer(locale),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      width: '140px',
      cellClassName: 'table__cell--status',
      render: renderStatus,
    },
  ];
  const WARDS: DropdownOption<string>[] = [
    { value: 'gulshan', label: 'Gulshan' },
    { value: 'dhanmondi', label: 'Dhanmondi' },
    { value: 'mirpur', label: 'Mirpur' },
    { value: 'uttara', label: 'Uttara' },
    { value: 'tejgaon', label: 'Tejgaon' },
  ];

  const navItems: SidebarNavItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: ICON_HOME },
    { label: 'Inbox', href: '/inbox', icon: ICON_INBOX },
    { label: 'Field Queue', href: '/field', icon: ICON_FIELD },
    { label: 'Audit Log', href: '/audit', icon: ICON_AUDIT },
    { label: 'Style Guide', href: '/styleguide', icon: ICON_DASH },
  ];

  const fireToast = (v: ToastVariant) => {
    setToastVariant(v);
    setToastKey((k) => k + 1);
  };

  const sections = (
    <>
      <Section
        title="Container"
        blurb="3 widths (narrow 720 / bangla 1080 / wide 1280). 'Full bleed' bypasses the Container component to fill the entire main column. Resize the window below 768 px to see the mobile floor."
      >
        <Row label="width">
          <Button
            variant={containerWidth === ContainerWidth.Narrow ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => {
              setContainerWidth(ContainerWidth.Narrow);
            }}
          >
            Narrow (720)
          </Button>
          <Button
            variant={containerWidth === ContainerWidth.Bangla ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => {
              setContainerWidth(ContainerWidth.Bangla);
            }}
          >
            Bangla (1080)
          </Button>
          <Button
            variant={containerWidth === ContainerWidth.Wide ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => {
              setContainerWidth(ContainerWidth.Wide);
            }}
          >
            Wide (1280)
          </Button>
          <Button
            variant={containerWidth === 'full' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => {
              setContainerWidth('full');
            }}
          >
            Full bleed
          </Button>
        </Row>
      </Section>

      <Section
        title="Button"
        blurb="4 variants × 3 sizes. Focus-visible ring on Tab. Disabled state dims to opacity 0.55."
      >
        <Row label="primary">
          <Button variant="primary" size="sm">
            Save
          </Button>
          <Button variant="primary" size="md">
            Verify
          </Button>
          <Button variant="primary" size="lg">
            Approve
          </Button>
        </Row>
        <Row label="secondary">
          <Button variant="secondary" size="sm">
            Cancel
          </Button>
          <Button variant="secondary" size="md">
            Back
          </Button>
          <Button variant="secondary" size="lg">
            Review
          </Button>
        </Row>
        <Row label="ghost">
          <Button variant="ghost" size="sm">
            Skip
          </Button>
          <Button variant="ghost" size="md">
            Dismiss
          </Button>
          <Button variant="ghost" size="lg">
            Snooze
          </Button>
        </Row>
        <Row label="danger (outline)">
          <Button variant="danger" size="sm">
            Reject
          </Button>
          <Button variant="danger" size="md">
            Override
          </Button>
          <Button variant="danger" size="lg">
            Force Resolve
          </Button>
        </Row>
        <Row label="disabled">
          <Button variant="primary" size="md" disabled>
            Save
          </Button>
          <Button variant="danger" size="md" disabled>
            Reject
          </Button>
        </Row>
      </Section>

      <Section
        title="Input"
        blurb="Default testid is `input-md`. With icon: `input-icon-md`. SearchInput always renders `input-search-md` and forwards size/disabled."
      >
        <Row label="plain">
          <Input
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
            }}
            placeholder="Type something…"
          />
        </Row>
        <Row label="with icon (search-shaped)">
          <Input
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
            }}
            placeholder="Search incidents…"
            icon={<span aria-hidden="true">⌕</span>}
          />
        </Row>
        <Row label="SearchInput variant">
          <SearchInput
            value={searchValue}
            onChange={(e) => {
              setSearchValue(e.target.value);
            }}
            placeholder="Filter queue…"
            size="lg"
            disabled={false}
          />
        </Row>
        <Row label="large disabled">
          <Input value="" onChange={() => {}} placeholder="Disabled…" size="lg" disabled />
        </Row>
      </Section>

      <Section
        title="Card"
        blurb="Default = no modifier class. with-heading adds 24 px block; compact adds 16 px. Heading links via aria-labelledby."
      >
        <Row label="no modifier">
          <Card>
            <p style={{ margin: 0 }}>Plain card body. No modifier class appended.</p>
          </Card>
        </Row>
        <Row label="with-heading">
          <Card heading="Recent verifications" modifier="with-heading">
            <p style={{ margin: 0 }}>Body content under a labelled heading.</p>
          </Card>
        </Row>
        <Row label="compact">
          <Card heading="Compact card" modifier="compact">
            <p style={{ margin: 0 }}>Tighter 16 px padding.</p>
          </Card>
        </Row>
      </Section>

      <Section
        title="Modal"
        blurb="Esc to close. Tab cycles inside dialog. Focus returns to trigger on close. Accessible name via aria-label / aria-labelledby."
      >
        <Row label="open / close">
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setModalOpen(true);
            }}
          >
            Open modal
          </Button>
          <Modal
            open={modalOpen}
            onClose={() => {
              setModalOpen(false);
            }}
            ariaLabel="Confirm rejection"
          >
            <h3 style={{ marginTop: 0 }}>Confirm rejection</h3>
            <p>This incident will be marked as rejected and signed on chain.</p>
            <div
              style={{
                display: 'flex',
                gap: 'var(--space-md)',
                justifyContent: 'flex-end',
                marginTop: 'var(--space-lg)',
              }}
            >
              <Button
                variant="ghost"
                size="md"
                onClick={() => {
                  setModalOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={() => {
                  setModalOpen(false);
                }}
              >
                Reject incident
              </Button>
            </div>
          </Modal>
        </Row>
      </Section>

      <Section
        title="Toast"
        blurb="4 variants. 4 s auto-dismiss. Hover the toast to pause the progress bar; un-hover to resume from where it paused."
      >
        <Row label="fire">
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              fireToast(ToastVariant.Success);
            }}
          >
            success
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              fireToast(ToastVariant.Warning);
            }}
          >
            warning
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              fireToast(ToastVariant.Danger);
            }}
          >
            danger
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              fireToast(ToastVariant.Info);
            }}
          >
            info
          </Button>
        </Row>
        <Row label="live">
          <Toast
            key={toastKey}
            variant={toastVariant}
            message={`${toastVariant} toast — hovered? the progress bar freezes`}
          />
        </Row>
      </Section>

      <Section
        title="BandPill"
        blurb="3 bands per dim 4 §12. 88 px min-width, uppercase label, dim-3 §6.1 icons."
      >
        <Row label="all bands">
          <BandPill band={Band.High} />
          <BandPill band={Band.Medium} />
          <BandPill band={Band.Low} />
        </Row>
      </Section>

      <Section
        title="EmptyState"
        blurb="8 dim-5 §8 patterns. Heading level 2/3/4. Linked via aria-labelledby. Always renders card--with-heading."
      >
        <Row label="with primary CTA">
          <EmptyState
            icon={<span aria-hidden="true">✦</span>}
            heading="No incidents in your queue"
            body="When a sensor flags a deviation, it'll appear here ranked by priority."
            primaryCta={
              <Button variant="primary" size="md">
                Refresh
              </Button>
            }
          />
        </Row>
        <Row label="with both CTAs + headingLevel 3">
          <EmptyState
            icon={<span aria-hidden="true">◯</span>}
            heading="Audit log is empty for this range"
            body="Try widening the date range or switching to a different tenant."
            primaryCta={
              <Button variant="secondary" size="md">
                Widen range
              </Button>
            }
            secondaryCta={
              <Button variant="ghost" size="md">
                Switch tenant
              </Button>
            }
            headingLevel={3}
          />
        </Row>
      </Section>

      <Section
        title="Dropdown"
        blurb="FE-B5a primitive. WAI-ARIA combobox pattern: role=combobox trigger + role=listbox popover. Single + multi-select. Searchable. Keyboard nav (ArrowUp/Down/Home/End/Enter/Escape, type-ahead). Mobile floor at 767px collapses the popover to a bottom sheet."
      >
        <Row label="small list (5 wards)">
          <Dropdown
            options={WARDS}
            value={singleWard}
            onChange={setSingleWard}
            placeholder="Choose a ward…"
            label="Ward"
          />
        </Row>
        <Row label="searchable">
          <Dropdown
            options={WARDS}
            value={searchWard}
            onChange={setSearchWard}
            placeholder="Search a ward…"
            searchable
            label="Search ward"
          />
        </Row>
        <Row label="disabled">
          <Dropdown
            options={WARDS}
            value={disabledWard}
            onChange={setDisabledWard}
            placeholder="Disabled"
            disabled
            label="Locked ward"
          />
        </Row>
        <Row label="multi pre-selected">
          <Dropdown<string>
            options={WARDS}
            mode={DropdownMode.Multi}
            value={multiWard}
            onChange={(v) => {
              setMultiWard(v);
            }}
            placeholder="Pick multiple wards…"
            label="Affected wards"
          />
        </Row>
        <Row label="wired live readout">
          <div className="section--dropdown">
            <Dropdown
              options={WARDS}
              value={singleWard}
              onChange={setSingleWard}
              placeholder="Pick…"
              label="Live demo"
            />
            <pre data-testid="sg-dropdown-readout" className="sg-dropdown-readout">
              {JSON.stringify({ singleWard, searchWard, multiWard }, null, 2)}
            </pre>
          </div>
        </Row>
      </Section>

      <Section
        title="TopChrome + Sidebar"
        blurb="48 px chrome with 3 slots (left brand+chain, center nav, right persona). Sidebar 44 px nav row with 3 px active marker."
      >
        <Row label="interactive sidebar">
          <div className="sg-sidebar-frame">
            <Sidebar navItems={navItems} currentPath="/inbox" brand="Surakkha" />
          </div>
        </Row>
      </Section>

      <Section
        title="Table"
        blurb="FE-B5b primitive. Generic <Table<T>> over a row record. Opt-in per-column sort + resize. Optional selection + pagination via <Pagination>. Live readout below shows current sort + selection + page state."
      >
        <Row label="25-row fixture">
          <div className="section--table">
            <Table<TableRow>
              columns={tableColumns}
              rows={paginatedRows}
              rowKey="id"
              selectable
              selectedRows={selectedRows}
              onSelectionChange={setSelectedRows}
              testId="sg-table"
            />
            <div className="pagination-row">
              <Pagination
                page={page}
                pageSize={pageSize}
                total={TABLE_ROWS.length}
                onPageChange={setPage}
                onPageSizeChange={(n) => {
                  setPageSize(n);
                  setPage(1);
                }}
                testId="sg-pagination"
              />
            </div>
            <pre data-testid="sg-table-readout" className="sg-table-readout">
              {JSON.stringify(
                {
                  selected: Array.from(selectedRows),
                  page,
                  pageSize,
                  total: TABLE_ROWS.length,
                },
                null,
                2,
              )}
            </pre>
          </div>
        </Row>
      </Section>

      <Section
        title="DatePicker"
        blurb="FE-B5c primitive. ARIA grid pattern (role=grid + 42 role=gridcell). Locale-aware headers via Intl.DateTimeFormat. Keyboard nav: Arrow keys + PageUp/Down (Shift = year) + Home/End + Enter/Escape. Range mode highlights in-range cells. Mobile floor at 767px collapses to a bottom sheet."
      >
        <Row label="single with today">
          <DatePicker value={dateToday} onChange={setDateToday} placeholder="Pick a date" />
        </Row>
        <Row label="range">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </Row>
        <Row label="min=today, max=+30d">
          <DatePicker
            value={dateBounded}
            onChange={setDateBounded}
            min={dateMin}
            max={dateMax}
            placeholder="Within next 30 days"
          />
        </Row>
        <Row label="disabled">
          <DatePicker value={dateDisabled} onChange={() => {}} disabled />
        </Row>
        <Row label="locale-toggle live readout">
          <div className="section--datepicker">
            <Button variant="secondary" size="sm" onClick={toggleLocale}>
              locale: <strong>{locale}</strong> (click to toggle)
            </Button>
            <pre data-testid="sg-datepicker-readout" className="sg-datepicker-readout">
              {JSON.stringify(
                {
                  locale,
                  single: dateToday ? dateToday.toISOString() : null,
                  range: dateRange,
                  bounded: dateBounded ? dateBounded.toISOString() : null,
                },
                null,
                2,
              )}
            </pre>
          </div>
        </Row>
      </Section>

      <footer className="sg-footer">
        <p>
          <strong>Theme:</strong> {theme} · <strong>Locale:</strong> {locale} ·
          <code>document.body.dataset.theme={theme}</code> ·
          <code>document.body.dataset.locale={locale}</code>
        </p>
        <p className="sg-footer__small">
          {tStyleguide('footer.specLabel')}{' '}
          <code>
            _bmad-output/implementation-artifacts/spec-fe-1-1-foundation-component-library.md
          </code>{' '}
          {tStyleguide('footer.devOnlyLabel')} <code>import.meta.env.DEV</code>.
        </p>
      </footer>
    </>
  );

  return (
    <div className="sg-shell">
      <Sidebar navItems={navItems} currentPath="/styleguide" brand="Surakkha" />

      <div className="sg-main">
        <TopChrome
          personaLabel={`Styleguide reviewer · ${theme} · ${locale}`}
          chainFreshSeconds={3}
        />

        {containerWidth === 'full' ? (
          <div className="sg-full-bleed" data-testid="sg-full-bleed">
            <header className="sg-header">
              <h1 className="sg-header__title">{tStyleguide('header.title')}</h1>
              <p className="sg-header__sub">
                {tStyleguide('header.subtotal')}
                <code>document.body.dataset.theme</code>
                {' '}in DevTools).
              </p>
              <div className="sg-header__controls">
                <Button variant="secondary" size="sm" onClick={toggleTheme}>
                  {tStyleguide('header.themeToggle')} <strong>{theme}</strong>{' '}
                  {tStyleguide('header.themeToggleHint')}
                </Button>
                <Button variant="secondary" size="sm" onClick={toggleLocale}>
                  {tStyleguide('header.localeToggle')} <strong>{locale}</strong>{' '}
                  {tStyleguide('header.localeToggleHint')}
                </Button>
                <Link to="/" className="sg-header__link">
                  {tStyleguide('header.backToLogin')}
                </Link>
              </div>
            </header>
            {sections}
          </div>
        ) : (
          <Container width={containerWidth}>
            <header className="sg-header">
              <h1 className="sg-header__title">{tStyleguide('header.title')}</h1>
              <p className="sg-header__sub">
                {tStyleguide('header.subtotal')}
                <code>document.body.dataset.theme</code>
                {' '}in DevTools).
              </p>
              <div className="sg-header__controls">
                <Button variant="secondary" size="sm" onClick={toggleTheme}>
                  {tStyleguide('header.themeToggle')} <strong>{theme}</strong>{' '}
                  {tStyleguide('header.themeToggleHint')}
                </Button>
                <Button variant="secondary" size="sm" onClick={toggleLocale}>
                  {tStyleguide('header.localeToggle')} <strong>{locale}</strong>{' '}
                  {tStyleguide('header.localeToggleHint')}
                </Button>
                <Link to="/" className="sg-header__link">
                  {tStyleguide('header.backToLogin')}
                </Link>
              </div>
            </header>
            {sections}
          </Container>
        )}
      </div>
    </div>
  );
}
