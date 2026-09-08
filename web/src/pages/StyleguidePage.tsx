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
import { useState } from 'react';
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
import { Band, ContainerWidth, ToastVariant } from '../types/domain';
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
    <section className="sg-section card" data-testid={`sg-section-${title.toLowerCase().replace(/\s+/g, '-')}`}>
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

export function StyleguidePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [toastKey, setToastKey] = useState(0);
  const [toastVariant, setToastVariant] = useState<ToastVariant>(ToastVariant.Success);
  const [containerWidth, setContainerWidth] = useState<ShowcaseWidth>(ContainerWidth.Wide);
  const [searchValue, setSearchValue] = useState('');
  const [inputValue, setInputValue] = useState('');

  const { theme, toggle: toggleTheme } = useTheme();
  const { locale, toggle: toggleLocale } = useLocale();

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
            onClick={() => { setContainerWidth(ContainerWidth.Narrow); }}
          >
            Narrow (720)
          </Button>
          <Button
            variant={containerWidth === ContainerWidth.Bangla ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => { setContainerWidth(ContainerWidth.Bangla); }}
          >
            Bangla (1080)
          </Button>
          <Button
            variant={containerWidth === ContainerWidth.Wide ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => { setContainerWidth(ContainerWidth.Wide); }}
          >
            Wide (1280)
          </Button>
          <Button
            variant={containerWidth === 'full' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => { setContainerWidth('full'); }}
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
          <Button variant="primary" size="sm">Save</Button>
          <Button variant="primary" size="md">Verify</Button>
          <Button variant="primary" size="lg">Approve</Button>
        </Row>
        <Row label="secondary">
          <Button variant="secondary" size="sm">Cancel</Button>
          <Button variant="secondary" size="md">Back</Button>
          <Button variant="secondary" size="lg">Review</Button>
        </Row>
        <Row label="ghost">
          <Button variant="ghost" size="sm">Skip</Button>
          <Button variant="ghost" size="md">Dismiss</Button>
          <Button variant="ghost" size="lg">Snooze</Button>
        </Row>
        <Row label="danger (outline)">
          <Button variant="danger" size="sm">Reject</Button>
          <Button variant="danger" size="md">Override</Button>
          <Button variant="danger" size="lg">Force Resolve</Button>
        </Row>
        <Row label="disabled">
          <Button variant="primary" size="md" disabled>Save</Button>
          <Button variant="danger" size="md" disabled>Reject</Button>
        </Row>
      </Section>

      <Section
        title="Input"
        blurb="Default testid is `input-md`. With icon: `input-icon-md`. SearchInput always renders `input-search-md` and forwards size/disabled."
      >
        <Row label="plain">
          <Input value={inputValue} onChange={(e) => { setInputValue(e.target.value); }} placeholder="Type something…" />
        </Row>
        <Row label="with icon (search-shaped)">
          <Input
            value={inputValue}
            onChange={(e) => { setInputValue(e.target.value); }}
            placeholder="Search incidents…"
            icon={<span aria-hidden="true">⌕</span>}
          />
        </Row>
        <Row label="SearchInput variant">
          <SearchInput
            value={searchValue}
            onChange={(e) => { setSearchValue(e.target.value); }}
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
          <Card><p style={{ margin: 0 }}>Plain card body. No modifier class appended.</p></Card>
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
          <Button variant="primary" size="md" onClick={() => { setModalOpen(true); }}>
            Open modal
          </Button>
          <Modal
            open={modalOpen}
            onClose={() => { setModalOpen(false); }}
            ariaLabel="Confirm rejection"
          >
            <h3 style={{ marginTop: 0 }}>Confirm rejection</h3>
            <p>This incident will be marked as rejected and signed on chain.</p>
            <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end', marginTop: 'var(--space-lg)' }}>
              <Button variant="ghost" size="md" onClick={() => { setModalOpen(false); }}>Cancel</Button>
              <Button variant="danger" size="md" onClick={() => { setModalOpen(false); }}>Reject incident</Button>
            </div>
          </Modal>
        </Row>
      </Section>

      <Section
        title="Toast"
        blurb="4 variants. 4 s auto-dismiss. Hover the toast to pause the progress bar; un-hover to resume from where it paused."
      >
        <Row label="fire">
          <Button variant="primary" size="sm" onClick={() => { fireToast(ToastVariant.Success); }}>success</Button>
          <Button variant="secondary" size="sm" onClick={() => { fireToast(ToastVariant.Warning); }}>warning</Button>
          <Button variant="danger" size="sm" onClick={() => { fireToast(ToastVariant.Danger); }}>danger</Button>
          <Button variant="ghost" size="sm" onClick={() => { fireToast(ToastVariant.Info); }}>info</Button>
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
            primaryCta={<Button variant="primary" size="md">Refresh</Button>}
          />
        </Row>
        <Row label="with both CTAs + headingLevel 3">
          <EmptyState
            icon={<span aria-hidden="true">◯</span>}
            heading="Audit log is empty for this range"
            body="Try widening the date range or switching to a different tenant."
            primaryCta={<Button variant="secondary" size="md">Widen range</Button>}
            secondaryCta={<Button variant="ghost" size="md">Switch tenant</Button>}
            headingLevel={3}
          />
        </Row>
      </Section>

      <Section
        title="TopChrome + Sidebar"
        blurb="48 px chrome with 3 slots (left brand+chain, center nav, right persona). Sidebar 44 px nav row with 3 px active marker."
      >
        <Row label="interactive sidebar">
          <div className="sg-sidebar-frame">
            <Sidebar
              navItems={navItems}
              currentPath="/inbox"
              brand="Surakkha"
            />
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
          Spec: <code>_bmad-output/implementation-artifacts/spec-fe-1-1-foundation-component-library.md</code> · Dev-only route — stripped in production builds via <code>import.meta.env.DEV</code>.
        </p>
      </footer>
    </>
  );

  return (
    <div className="sg-shell">
      <Sidebar
        navItems={navItems}
        currentPath="/styleguide"
        brand="Surakkha"
      />

      <div className="sg-main">
        <TopChrome
          personaLabel={`Styleguide reviewer · ${theme} · ${locale}`}
          chainFreshSeconds={3}
        />

        {containerWidth === 'full' ? (
          <div className="sg-full-bleed" data-testid="sg-full-bleed">
            <header className="sg-header">
              <h1 className="sg-header__title">Foundation Component Library</h1>
              <p className="sg-header__sub">
                FE-1.1a — interactive showcase of every dim-4 primitive + dim-5
                layout primitive. Theme + locale toggles are live (watch
                <code>document.body.dataset.theme</code> in DevTools).
              </p>
              <div className="sg-header__controls">
                <Button variant="secondary" size="sm" onClick={toggleTheme}>
                  theme: <strong>{theme}</strong> (click to toggle)
                </Button>
                <Button variant="secondary" size="sm" onClick={toggleLocale}>
                  locale: <strong>{locale}</strong> (click to toggle)
                </Button>
                <Link to="/" className="sg-header__link">← back to login</Link>
              </div>
            </header>
            {sections}
          </div>
        ) : (
          <Container width={containerWidth}>
            <header className="sg-header">
              <h1 className="sg-header__title">Foundation Component Library</h1>
              <p className="sg-header__sub">
                FE-1.1a — interactive showcase of every dim-4 primitive + dim-5
                layout primitive. Theme + locale toggles are live (watch
                <code>document.body.dataset.theme</code> in DevTools).
              </p>
              <div className="sg-header__controls">
                <Button variant="secondary" size="sm" onClick={toggleTheme}>
                  theme: <strong>{theme}</strong> (click to toggle)
                </Button>
                <Button variant="secondary" size="sm" onClick={toggleLocale}>
                  locale: <strong>{locale}</strong> (click to toggle)
                </Button>
                <Link to="/" className="sg-header__link">← back to login</Link>
              </div>
            </header>
            {sections}
          </Container>
        )}
      </div>
    </div>
  );
}
