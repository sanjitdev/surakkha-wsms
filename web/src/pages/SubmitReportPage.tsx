/**
 * SubmitReportPage.tsx — FE-F2.
 *
 * Anjali (citizen) report-submission surface at /submit. Per SPEC.md
 * the citizen loop opens here: Anjali describes a problem (Bangla
 * primary, English fallback) → POSTs `AnjaliReportSubmitted` → the
 * chain projects an `IncidentCreated` so the operator sees it on
 * /inbox immediately.
 *
 * Per dim 5 §5c (Anjali mobile lockdown, deferred to Phase 2) the
 * full mobile surface ships later. This Phase 1 surface is the
 * desktop/tablet page that operators demo on a laptop — form inputs
 * for the report content, an explicit submit button, success state
 * with chain-ref + block-height so the operator can confirm receipt.
 *
 * Role-gating: only renders for `session.role === 'anjali'`. Other
 * roles see an EmptyState pointing them at their own landing. (The
 * ComingSoonPage placeholder lives at /submit for non-Anjali roles
 * historically; this page replaces it when role matches.)
 *
 * Why no third-party form library:
 *   - The form has 5 fields. react-hook-form / formik would add
 *     ~30KB for a feature the built-in useState already handles.
 *   - Phase 1 lockdown: zero new deps.
 *
 * Lockdown cascade (2026-09-11):
 *   - Severity dropdown replaced with plain-language urgency options
 *     ("not urgent", "needs attention", "urgent"). T-codes stay on the
 *     chain payload for operator reference but citizens never see raw
 *     T1/T2/T3 labels (foundation §1.1: T1 = unverified, T2 = verified,
 *     T3 = issuance-path-only — operator concepts, not citizen ones).
 *   - Receipt pulls the real IncidentCreated event_id from the chain
 *     projection, not a synthetic ULID.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import '../styles/submit.css';
import { Container } from '../components/layout/Container';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/layout/EmptyState';
import { SendIcon } from '../components/icons/sidebar-icons';
import { ContainerWidth } from '../types/domain';
import { useAppLayout } from '../components/layout/AppLayoutContext';
import { useIncidentActions } from '../hooks/useIncidentActions';
import { useDateFormatter } from '../hooks/useDateFormatter';
import { ReporterBadge } from '../components/operator/ReporterBadge';

const WARDS = ['W01', 'W02', 'W03', 'W04', 'W05', 'W06', 'W07', 'W08', 'W09', 'W10'] as const;

// Plain-language urgency scale (lockdown 2026-09-11). T-codes stay on
// the chain payload for the inbox / audit layers but never surface
// to citizens. The Urgency keys map to trust-band T-codes internally
// so the existing IncidentCreated payload contract is preserved.
type Urgency = 'not_urgent' | 'needs_attention' | 'urgent';
const URGENCIES: readonly Urgency[] = ['not_urgent', 'needs_attention', 'urgent'];

/** Auto-EXIF strip (WO-011 acceptance #4) — all editable so the
 *  citizen can override the device-detected lat/lon/timestamp. */
interface PhotoExif {
  lat: string;
  lng: string;
  capturedAt: string;
  device: string;
}

/** Receipt state carries the actual incident_id from the chain
 *  projection (per the lockdown cascade on lines 26-34) so the
 *  citizen sees a verifiable ref + the anchor chip if applicable. */
interface SubmissionReceipt {
  event_id: string;
  incident_id: string;
  title: string;
  ward_id: string;
  urgency: Urgency;
  submitted_at: string;
  reporter_kind: 'anchor';
}

export function SubmitReportPage() {
  const { session } = useAppLayout();
  const { format: formatTime } = useDateFormatter();
  const { t: tSubmit } = useTranslation('submitReport');
  const actions = useIncidentActions();
  const isAnjali = session.role === 'anjali';

  const [title, setTitle] = useState('');
  const [urgency, setUrgency] = useState<Urgency>('needs_attention');
  const [wardId, setWardId] = useState<string>(WARDS[0]);
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [voiceUrl, setVoiceUrl] = useState('');
  const [exif, setExif] = useState<PhotoExif>({
    lat: '',
    lng: '',
    capturedAt: '',
    device: '',
  });
  const [photoAttached, setPhotoAttached] = useState(false);
  const [voiceAttached, setVoiceAttached] = useState(false);
  const [receipt, setReceipt] = useState<SubmissionReceipt | null>(null);

  const titleTrimmed = title.trim();
  const descTrimmed = description.trim();
  const canSubmit =
    !actions.busy &&
    titleTrimmed.length >= 5 &&
    descTrimmed.length >= 10 &&
    wardId.length > 0;

  const onPhotoCapture = () => {
    // WO-011 acceptance #4 — photo capture with auto-EXIF (lat/lon/
    // timestamp/device). Phase 1 desktop demo: stub the capture by
    // populating the EXIF strip with a known fixture so the citizen
    // sees the auto-detected values, can edit them, and the strip
    // renders. Phase 2 mobile lockdown swaps this for a real camera
    // bridge (per submit-report-page.md §"Open questions" #2).
    setPhotoAttached(true);
    setExif({
      lat: '23.7806',
      lng: '90.4074',
      capturedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
      device: 'Demo Camera (Phase 1 stub)',
    });
  };

  const onVoiceCapture = () => {
    setVoiceAttached(true);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const result = await actions.submitReport({
      title: titleTrimmed,
      urgency,
      ward_id: wardId,
      description: descTrimmed,
      photo_url: photoAttached ? `photo://local/${Date.now()}` : photoUrl.trim() || undefined,
      voice_url: voiceAttached ? `voice://local/${Date.now()}` : voiceUrl.trim() || undefined,
      // Wire GPS through to the chain payload as the lat/lng fields.
      // The reporter-asserted location (when captured from EXIF) lands
      // on IncidentCreated.location per WO-011 §"Wire contract".
      gps:
        exif.lat && exif.lng
          ? { lat: Number(exif.lat), lng: Number(exif.lng) }
          : undefined,
    });

    if (result) {
      // Lockdown cascade (2026-09-11): receipt pulls the real chain
      // event_id from the IncidentCreated post (the "block_hash" in the
      // citizen's mental model), not a synthetic ULID. Trust band is
      // server-assigned and surfaced only on the operator's inbox.
      // WO-011 REQ-003: receipt also carries the incident_id so the
      // "View your report" link can route to /my-reports/:incident_id/
      // timeline (per WO-001 citizen-status-timeline page).
      setReceipt({
        event_id: result.chain_ref,
        incident_id: result.incident_id,
        title: titleTrimmed,
        ward_id: wardId,
        urgency,
        submitted_at: new Date().toISOString(),
        reporter_kind: result.reporter_kind,
      });
      setTitle('');
      setDescription('');
      setPhotoUrl('');
      setVoiceUrl('');
      setPhotoAttached(false);
      setVoiceAttached(false);
      setExif({ lat: '', lng: '', capturedAt: '', device: '' });
    }
  };

  const onSubmitAnother = () => {
    setReceipt(null);
  };

  if (!isAnjali) {
    return (
      <Container width={ContainerWidth.Bangla}>
        <div
          className="page-header"
          data-testid="submit-report-page"
          data-role-gate="true"
        >
          <h1>{tSubmit('header.title')}</h1>
          <p className="page-header__sub">
            {tSubmit('roleGate.subtitle')}
          </p>
        </div>
        <Card>
          <EmptyState
            icon={<SendIcon />}
            heading={tSubmit('roleGate.heading')}
            body={tSubmit('roleGate.body', { role: session.role })}
          />
        </Card>
      </Container>
    );
  }

  if (receipt) {
    return (
      <Container width={ContainerWidth.Bangla}>
        <div
          className="page-header"
          data-testid="submit-report-page"
          data-page-state="receipt"
        >
          <h1>{tSubmit('header.title')}</h1>
          <p className="page-header__sub">{tSubmit('receipt.subtitle')}</p>
        </div>
        <Card testId="submit-receipt-card">
          <div className="submit-receipt">
            {/* Lockdown 2026-09-11: citizens see plain-language urgency on
                receipt, NOT a trust-band T-code chip — trust band is the
                operator's mental model, surfaced on the inbox row after
                verification signals land. */}
            <span
              className="submit-receipt__urgency"
              data-testid="submit-receipt-urgency"
              data-urgency={receipt.urgency}
            >
              {tSubmit(`receipt.urgencyLabels.${receipt.urgency}`)}
            </span>
            <h2 className="submit-receipt__title">{receipt.title}</h2>
            <dl className="submit-receipt__meta">
              <dt>{tSubmit('receipt.ward')}</dt>
              <dd>
                <span className="mono">{receipt.ward_id}</span>
              </dd>
              <dt>{tSubmit('receipt.submittedAt')}</dt>
              <dd>
                <span className="mono">{formatTime('time-full', receipt.submitted_at)}</span>
              </dd>
              <dt>{tSubmit('receipt.chainRef')}</dt>
              <dd>
                <span className="mono" data-testid="submit-receipt-event-id">
                  {receipt.event_id}
                </span>
              </dd>
            </dl>

            {/* WO-011 REQ-005 — anchor chip on receipt when the chain
                projection reports reporter_kind: anchor. Render the
                shared <ReporterBadge /> from WO-006 so the chip stays
                consistent with operator surfaces (icon + label per
                foundation §6.2 + §1.1 reporter-badge dimension). */}
            {receipt.reporter_kind === 'anchor' && (
              <div
                className="submit-receipt__anchor"
                data-testid="submit-receipt-anchor-chip"
              >
                <ReporterBadge
                  kind="anchor"
                  i18nNamespace="submitReport"
                  i18nKeyPrefix="receipt.reporterBadge"
                  testId="submit-receipt-anchor-badge"
                />
                <p className="submit-receipt__anchor-hint">
                  {tSubmit('receipt.anchoredHint')}
                </p>
              </div>
            )}

            {/* WO-011 REQ-004 — 5-min dual-channel ack surface (stub
                for Phase 1). The real SMS + portal gateway lands in
                Phase 2; Phase 1 surfaces the messaging so the citizen
                knows to expect the ack on both channels. */}
            <aside
              className="submit-receipt__ack"
              aria-label={tSubmit('receipt.ackHeadline')}
              data-testid="submit-receipt-ack"
            >
              <h3 className="submit-receipt__ack-headline">
                {tSubmit('receipt.ackHeadline')}
              </h3>
              <p className="submit-receipt__ack-body">
                {tSubmit('receipt.ackBody')}
              </p>
              <ul className="submit-receipt__ack-channels">
                <li data-channel="sms">
                  {tSubmit('receipt.ackChannelSms')}
                </li>
                <li data-channel="portal">
                  {tSubmit('receipt.ackChannelPortal')}
                </li>
              </ul>
            </aside>

            <p className="submit-receipt__hint">
              {tSubmit('receipt.hint')}
            </p>

            {/* WO-011 REQ-003 — success page links to the citizen's
                timeline view so they can monitor verification signals
                + ack + chain motion in real-time. */}
            <div
              className="submit-receipt__actions"
              style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}
            >
              <Link
                to={`/my-reports/${receipt.incident_id}/timeline`}
                data-testid="submit-receipt-view-link"
                className="submit-receipt__view-link"
                aria-label={tSubmit('receipt.viewReport')}
              >
                <Button variant="primary" size="md">
                  {tSubmit('receipt.viewReport')}
                </Button>
              </Link>
              <Button
                variant="secondary"
                size="md"
                onClick={onSubmitAnother}
                testId="submit-another"
              >
                {tSubmit('receipt.submitAnother')}
              </Button>
            </div>
          </div>
        </Card>
      </Container>
    );
  }

  return (
    <Container width={ContainerWidth.Bangla}>
      <div
        className="page-header"
        data-testid="submit-report-page"
        data-page-state="form"
      >
        <h1>{tSubmit('header.title')}</h1>
        <p className="page-header__sub">
          {tSubmit('header.subtitle', { name: session.display_name })}
        </p>
      </div>
      <Card testId="submit-form-card">
        <form onSubmit={onSubmit} data-testid="submit-form">
          <div className="submit-form__row">
            <label htmlFor="submit-title" className="submit-form__label">
              {tSubmit('form.titleLabel')}
            </label>
            <input
              id="submit-title"
              data-testid="submit-title"
              type="text"
              className="submit-form__input"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
              }}
              placeholder={tSubmit('form.titlePlaceholder')}
              maxLength={120}
              required
            />
            <p className="submit-form__hint">{tSubmit('form.titleHint')}</p>
          </div>

          <div className="submit-form__row submit-form__row--split">
            <div>
              <label htmlFor="submit-urgency" className="submit-form__label">
                {tSubmit('form.urgencyLabel')}
              </label>
              <select
                id="submit-urgency"
                data-testid="submit-urgency"
                className="submit-form__input"
                value={urgency}
                onChange={(e) => {
                  setUrgency(e.target.value as Urgency);
                }}
              >
                {URGENCIES.map((u) => (
                  <option key={u} value={u}>
                    {tSubmit(`form.urgencyOptions.${u}`)}
                  </option>
                ))}
              </select>
              <p className="submit-form__hint">{tSubmit('form.urgencyHint')}</p>
            </div>
            <div>
              <label htmlFor="submit-ward" className="submit-form__label">
                {tSubmit('form.wardLabel')}
              </label>
              <select
                id="submit-ward"
                data-testid="submit-ward"
                className="submit-form__input"
                value={wardId}
                onChange={(e) => {
                  setWardId(e.target.value);
                }}
              >
                {WARDS.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="submit-form__row">
            <label htmlFor="submit-description" className="submit-form__label">
              {tSubmit('form.descriptionLabel')}
            </label>
            <textarea
              id="submit-description"
              data-testid="submit-description"
              className="submit-form__textarea"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
              }}
              placeholder={tSubmit('form.descriptionPlaceholder')}
              rows={5}
              maxLength={2000}
              required
            />
            <p className="submit-form__hint">
              {tSubmit('form.descriptionHint')}
            </p>
          </div>

          <details className="submit-form__details">
            <summary className="submit-form__details-summary">{tSubmit('form.detailsSummary')}</summary>
            {/* WO-011 acceptance #4 — photo capture with auto-EXIF.
                Phase 1 desktop demo: a "capture" button populates the
                EXIF strip with a known fixture. Phase 2 swaps this for
                a real camera bridge. The strip is editable so the
                citizen can override any device-detected value. */}
            <div className="submit-form__row">
              <label htmlFor="submit-photo" className="submit-form__label">
                {tSubmit('form.photoLabel')}
              </label>
              <div className="submit-form__photo-row">
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={onPhotoCapture}
                  testId="submit-photo-capture"
                >
                  {tSubmit('form.photoPlaceholder')}
                </Button>
                {photoAttached && (
                  <span
                    className="submit-form__attached"
                    data-testid="submit-photo-attached"
                  >
                    ✓ {exif.device}
                  </span>
                )}
              </div>
              <input
                id="submit-photo"
                data-testid="submit-photo"
                type="hidden"
                value={photoUrl}
                onChange={(e) => {
                  setPhotoUrl(e.target.value);
                }}
              />
            </div>

            {photoAttached && (
              <div
                className="submit-form__exif"
                data-testid="submit-photo-exif-strip"
              >
                <p className="submit-form__exif-heading">
                  {tSubmit('form.exifHeading')}
                </p>
                <div className="submit-form__exif-grid">
                  <label>
                    <span>{tSubmit('form.exifLat')}</span>
                    <input
                      type="text"
                      className="submit-form__input"
                      data-testid="submit-photo-exif-lat"
                      value={exif.lat}
                      onChange={(e) => {
                        setExif({ ...exif, lat: e.target.value });
                      }}
                    />
                  </label>
                  <label>
                    <span>{tSubmit('form.exifLng')}</span>
                    <input
                      type="text"
                      className="submit-form__input"
                      data-testid="submit-photo-exif-lng"
                      value={exif.lng}
                      onChange={(e) => {
                        setExif({ ...exif, lng: e.target.value });
                      }}
                    />
                  </label>
                  <label>
                    <span>{tSubmit('form.exifCapturedAt')}</span>
                    <input
                      type="text"
                      className="submit-form__input"
                      data-testid="submit-photo-exif-captured-at"
                      value={exif.capturedAt}
                      onChange={(e) => {
                        setExif({ ...exif, capturedAt: e.target.value });
                      }}
                    />
                  </label>
                  <label>
                    <span>{tSubmit('form.exifDevice')}</span>
                    <input
                      type="text"
                      className="submit-form__input"
                      data-testid="submit-photo-exif-device"
                      value={exif.device}
                      onChange={(e) => {
                        setExif({ ...exif, device: e.target.value });
                      }}
                    />
                  </label>
                </div>
              </div>
            )}

            <div className="submit-form__row">
              <label htmlFor="submit-voice" className="submit-form__label">
                {tSubmit('form.voiceLabel')}
              </label>
              <div className="submit-form__photo-row">
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={onVoiceCapture}
                  testId="submit-voice-capture"
                >
                  {tSubmit('form.voicePlaceholder')}
                </Button>
                {voiceAttached && (
                  <span
                    className="submit-form__attached"
                    data-testid="submit-voice-attached"
                  >
                    ✓
                  </span>
                )}
              </div>
              <input
                id="submit-voice"
                data-testid="submit-voice"
                type="hidden"
                value={voiceUrl}
                onChange={(e) => {
                  setVoiceUrl(e.target.value);
                }}
              />
            </div>
          </details>

          <div className="submit-form__actions">
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={!canSubmit}
              testId="submit-submit"
            >
              {tSubmit('form.submit')}
              <span aria-hidden="true" style={{ marginLeft: 'var(--space-xs)' }}>
                {'\u2192'}
              </span>
            </Button>
            <span className="submit-form__action-hint">
              {actions.busy ? tSubmit('form.submitBusy') : tSubmit('form.submitIdle')}
            </span>
          </div>
        </form>
      </Card>
    </Container>
  );
}
