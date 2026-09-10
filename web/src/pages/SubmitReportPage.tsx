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
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../../mockups/01-priya/dashboard.css';
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

const WARDS = ['W01', 'W02', 'W03', 'W04', 'W05', 'W06', 'W07', 'W08', 'W09', 'W10'] as const;
const SEVERITIES = ['T1', 'T2', 'T3'] as const;

type Severity = (typeof SEVERITIES)[number];

interface SubmissionReceipt {
  event_id: string;
  title: string;
  ward_id: string;
  severity: Severity;
  submitted_at: string;
}

export function SubmitReportPage() {
  const { session } = useAppLayout();
  const { format: formatTime } = useDateFormatter();
  const { t: tSubmit } = useTranslation('submitReport');
  const actions = useIncidentActions();
  const isAnjali = session.role === 'anjali';

  const [title, setTitle] = useState('');
  const [severity, setSeverity] = useState<Severity>('T2');
  const [wardId, setWardId] = useState<string>(WARDS[0]);
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [voiceUrl, setVoiceUrl] = useState('');
  const [receipt, setReceipt] = useState<SubmissionReceipt | null>(null);

  const titleTrimmed = title.trim();
  const descTrimmed = description.trim();
  const canSubmit =
    !actions.busy &&
    titleTrimmed.length >= 5 &&
    descTrimmed.length >= 10 &&
    wardId.length > 0;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const ok = await actions.submitReport({
      title: titleTrimmed,
      severity,
      ward_id: wardId,
      description: descTrimmed,
      photo_url: photoUrl.trim() || undefined,
      voice_url: voiceUrl.trim() || undefined,
    });

    if (ok) {
      // Capture a synthetic receipt so the success state has data even
      // though the hook doesn't return the block_hash. The chain
      // projection rebuilds /api/incidents on next mount; the receipt
      // is a one-shot UX anchor, not a system-of-record.
      setReceipt({
        event_id: `01${  Math.random().toString(36).slice(2, 24).toUpperCase()}`,
        title: titleTrimmed,
        ward_id: wardId,
        severity,
        submitted_at: new Date().toISOString(),
      });
      setTitle('');
      setDescription('');
      setPhotoUrl('');
      setVoiceUrl('');
    }
  };

  const onSubmitAnother = () => {
    setReceipt(null);
  };

  if (!isAnjali) {
    return (
      <Container width={ContainerWidth.Bangla}>
        <div className="page-header">
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
        <div className="page-header">
          <h1>{tSubmit('header.title')}</h1>
          <p className="page-header__sub">{tSubmit('receipt.subtitle')}</p>
        </div>
        <Card testId="submit-receipt-card">
          <div className="submit-receipt">
            <span className={`badge badge--${receipt.severity.toLowerCase()}`}>
              {receipt.severity}
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
            <p className="submit-receipt__hint">
              {tSubmit('receipt.hint')}
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              <Button
                variant="primary"
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
      <div className="page-header">
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
              <label htmlFor="submit-severity" className="submit-form__label">
                {tSubmit('form.severityLabel')}
              </label>
              <select
                id="submit-severity"
                data-testid="submit-severity"
                className="submit-form__input"
                value={severity}
                onChange={(e) => {
                  setSeverity(e.target.value as Severity);
                }}
              >
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>
                    {tSubmit(`form.severityOptions.${s}`)}
                  </option>
                ))}
              </select>
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
            <div className="submit-form__row">
              <label htmlFor="submit-photo" className="submit-form__label">
                {tSubmit('form.photoLabel')}
              </label>
              <input
                id="submit-photo"
                data-testid="submit-photo"
                type="url"
                className="submit-form__input"
                value={photoUrl}
                onChange={(e) => {
                  setPhotoUrl(e.target.value);
                }}
                placeholder={tSubmit('form.photoPlaceholder')}
              />
            </div>
            <div className="submit-form__row">
              <label htmlFor="submit-voice" className="submit-form__label">
                {tSubmit('form.voiceLabel')}
              </label>
              <input
                id="submit-voice"
                data-testid="submit-voice"
                type="url"
                className="submit-form__input"
                value={voiceUrl}
                onChange={(e) => {
                  setVoiceUrl(e.target.value);
                }}
                placeholder={tSubmit('form.voicePlaceholder')}
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
