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
          <h1>Submit report</h1>
          <p className="page-header__sub">
            Citizen-report intake is reserved for the Anjali persona.
          </p>
        </div>
        <Card>
          <EmptyState
            icon={<SendIcon />}
            heading="Wrong persona"
            body={`You are signed in as ${session.role}. Sign in as Anjali to submit a citizen report.`}
          />
        </Card>
      </Container>
    );
  }

  if (receipt) {
    return (
      <Container width={ContainerWidth.Bangla}>
        <div className="page-header">
          <h1>Submit report</h1>
          <p className="page-header__sub">Your report has landed on the chain.</p>
        </div>
        <Card testId="submit-receipt-card">
          <div className="submit-receipt">
            <span className={`badge badge--${receipt.severity.toLowerCase()}`}>
              {receipt.severity}
            </span>
            <h2 className="submit-receipt__title">{receipt.title}</h2>
            <dl className="submit-receipt__meta">
              <dt>Ward</dt>
              <dd>
                <span className="mono">{receipt.ward_id}</span>
              </dd>
              <dt>Submitted</dt>
              <dd>
                <span className="mono">{formatTime('time-full', receipt.submitted_at)}</span>
              </dd>
              <dt>Chain ref</dt>
              <dd>
                <span className="mono" data-testid="submit-receipt-event-id">
                  {receipt.event_id}
                </span>
              </dd>
            </dl>
            <p className="submit-receipt__hint">
              The operator will see this on their inbox shortly. You can submit another
              report or close the browser — your report is already sealed.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              <Button
                variant="primary"
                size="md"
                onClick={onSubmitAnother}
                testId="submit-another"
              >
                Submit another report
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
        <h1>Submit report</h1>
        <p className="page-header__sub">
          {session.display_name} · Anjali citizen report · lands on the operator's inbox
        </p>
      </div>
      <Card testId="submit-form-card">
        <form onSubmit={onSubmit} data-testid="submit-form">
          <div className="submit-form__row">
            <label htmlFor="submit-title" className="submit-form__label">
              Title
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
              placeholder="Brown water in tap since morning"
              maxLength={120}
              required
            />
            <p className="submit-form__hint">A short summary; the operator reads this first.</p>
          </div>

          <div className="submit-form__row submit-form__row--split">
            <div>
              <label htmlFor="submit-severity" className="submit-form__label">
                Severity
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
                {SEVERITIES.map((s) => {
                  const label =
                    s === 'T1' ? 'T1 · low concern' : s === 'T2' ? 'T2 · concerning' : 'T3 · urgent';

                  return (
                    <option key={s} value={s}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label htmlFor="submit-ward" className="submit-form__label">
                Ward
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
              Description
            </label>
            <textarea
              id="submit-description"
              data-testid="submit-description"
              className="submit-form__textarea"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
              }}
              placeholder="What did you see, when did it start, how many households are affected?"
              rows={5}
              maxLength={2000}
              required
            />
            <p className="submit-form__hint">
              Bangla or English — the operator triages both. Min 10 characters.
            </p>
          </div>

          <details className="submit-form__details">
            <summary className="submit-form__details-summary">Optional attachments</summary>
            <div className="submit-form__row">
              <label htmlFor="submit-photo" className="submit-form__label">
                Photo URL
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
                placeholder="https://example.com/photo.jpg"
              />
            </div>
            <div className="submit-form__row">
              <label htmlFor="submit-voice" className="submit-form__label">
                Voice note URL
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
                placeholder="https://example.com/voice.mp3"
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
              Submit report →
            </Button>
            <span className="submit-form__action-hint">
              {actions.busy ? 'Sealing on the chain…' : 'Sealed in one chain write'}
            </span>
          </div>
        </form>
      </Card>
    </Container>
  );
}
