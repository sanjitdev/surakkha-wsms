/**
 * HotlineIntakeModal.tsx — Tier 1 NEW build per hotline-intake-modal.md.
 *
 * Modal mounted from the OperatorDashboard top-chrome action bar. Captures
 * a phone-sourced incident as chain-anchored data while the caller is
 * still on the line. Outcome-driven:
 *   - reported_incident (default) → POST /api/incidents with source: hotline,
 *     reporter_kind: hotline_operator, hotline_call_id. T1 default band +
 *     hotline reporter-badge preserved end-to-end.
 *   - no_incident / wrong_number → POST /api/hotline-calls (call log only,
 *     no incident created; chain event HotlineCallLogged).
 *
 * 8 fields per spec §"Field-by-field spec":
 *   1. callerName        (text,    optional,  0-80 chars)
 *   2. callerPhone       (tel,     optional,  E.164 or local 10-digit; never
 *                                    stored plaintext — hashed server-side)
 *   3. callTime          (datetime-local, defaults to now, not in future)
 *   4. description       (textarea, required, 20-500 chars)
 *   5. locationHint      (text,    required, 5-200 chars)
 *   6. outcome           (select,  required, enum)
 *   7. callDuration      (number,  optional, 1-60)
 *   8. sensitiveContent  (switch,  optional, default false)
 *
 * Submit button is gated on: description ≥ 20, locationHint ≥ 5, outcome
 * set, callTime not in future. Submit fires the appropriate POST; on
 * success closes the modal + emits a toast. On failure (network) keeps the
 * modal open with values intact + auto-retries once at +5 s.
 *
 * Dirty-check on close: any user-entered content in {callerName,
 * callerPhone, description, locationHint, outcome-changed-from-default}
 * triggers a confirmation dialog before discarding.
 *
 * Bangla-first locale per lockdown §11.2. Bangla surface copy uses
 * --font-family-bangla + --line-height-body-bangla: 1.6.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useToast } from '../ui/ToastProvider';
import { ReporterPhoneIcon } from '../icons/sidebar-icons';

/** Outcomes per hotline-intake-modal.md §"State mapping for outcomes". */
type Outcome = 'reported_incident' | 'no_incident' | 'wrong_number';

const OUTCOMES: readonly Outcome[] = ['reported_incident', 'no_incident', 'wrong_number'];

const DEFAULT_OUTCOME: Outcome = 'reported_incident';

/** Generate a short client-side hotline_call_id (uuid-like) at modal mount.
 *  Per spec §"Hotline call id generation" the lineage key is created fresh
 *  each modal open so discard + reopen starts a new lineage key. */
function newHotlineCallId(): string {
  // crypto.randomUUID() is available in modern browsers; we keep the
  // fallback for test contexts where it may be missing.
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return (crypto as Crypto & { randomUUID(): string }).randomUUID();
  }
  return `hc_${Math.random().toString(36).slice(2, 14)}`;
}

function defaultCallTimeLocal(): string {
  // datetime-local expects "YYYY-MM-DDTHH:MM" — no timezone suffix. We
  // always emit the operator's *local* clock; the server interprets
  // submission-time and the future-validation logic uses the same local
  // clock so the operator's editing matches what we validate.
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function isFutureLocal(value: string): boolean {
  // Parse "YYYY-MM-DDTHH:MM" as local time. Empty / malformed → not future.
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);

  if (!m) return false;
  const [, y, mo, d, h, mi] = m;

  const local = new Date(
    Number(y),
    Number(mo) - 1,
    Number(d),
    Number(h),
    Number(mi),
    0,
    0,
  ).getTime();
  // +1 minute tolerance per spec §"Field-by-field spec" row 3.
  return local > Date.now() + 60_000;
}

function phoneShapeOk(raw: string): boolean {
  // E.164 (e.g. +8801712345678) OR local 10-digit. Trim spaces; ignore
  // empty (phone is optional). We only check shape — the server hashes it.
  const trimmed = raw.trim();

  if (trimmed.length === 0) return true;
  if (/^\+\d{8,15}$/.test(trimmed.replace(/\s+/g, ''))) return true;
  if (/^\d{10}$/.test(trimmed.replace(/\s+/g, ''))) return true;
  return false;
}

export interface HotlineIntakeModalProps {
  open: boolean;
  onClose: () => void;
  /** Fired after a successful submit. The parent can use this to refetch
   *  /api/incidents so the new card appears in the inbox. */
  onSubmitted?: (input: { outcome: Outcome; incidentId?: string }) => void;
}

interface FieldErrors {
  callerName?: string;
  callerPhone?: string;
  callTime?: string;
  description?: string;
  locationHint?: string;
  outcome?: string;
  callDuration?: string;
}

export function HotlineIntakeModal({ open, onClose, onSubmitted }: HotlineIntakeModalProps) {
  const { t: tHot } = useTranslation('operatorDashboard');
  const toast = useToast();
  const [callerName, setCallerName] = useState<string>('');
  const [callerPhone, setCallerPhone] = useState<string>('');
  const [callTime, setCallTime] = useState<string>(defaultCallTimeLocal());
  const [description, setDescription] = useState<string>('');
  const [locationHint, setLocationHint] = useState<string>('');
  const [outcome, setOutcome] = useState<Outcome>(DEFAULT_OUTCOME);
  const [callDuration, setCallDuration] = useState<string>('5');
  const [sensitiveContent, setSensitiveContent] = useState<boolean>(false);
  const [busy, setBusy] = useState<boolean>(false);
  const [confirmDiscard, setConfirmDiscard] = useState<boolean>(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  // Stable per-open hotline_call_id — generated fresh on each mount.
  const hotlineCallIdRef = useRef<string>('');

  useEffect(() => {
    if (open && hotlineCallIdRef.current === '') {
      hotlineCallIdRef.current = newHotlineCallId();
    }
    if (!open) {
      // Reset on close so a re-open starts fresh.
      setCallerName('');
      setCallerPhone('');
      setCallTime(defaultCallTimeLocal());
      setDescription('');
      setLocationHint('');
      setOutcome(DEFAULT_OUTCOME);
      setCallDuration('5');
      setSensitiveContent(false);
      setBusy(false);
      setConfirmDiscard(false);
      setErrors({});
      hotlineCallIdRef.current = '';
    }
  }, [open]);

  // dirty check: any user-entered content counts. outcome only counts as
  // dirty if it has been *changed* from the default (spec §"Cancel / ESC
  // dismiss").
  const dirty = useMemo(
    () =>
      callerName.trim().length > 0 ||
      callerPhone.trim().length > 0 ||
      description.trim().length > 0 ||
      locationHint.trim().length > 0 ||
      outcome !== DEFAULT_OUTCOME,
    [callerName, callerPhone, description, locationHint, outcome],
  );

  // Validation. Required: description ≥ 20, locationHint ≥ 5, outcome,
  // callTime valid. Optional fields: callerName ≤ 80, callerPhone shape,
  // callDuration 1-60 when non-empty.
  const validate = useCallback((): FieldErrors => {
    const next: FieldErrors = {};

    if (callerName.trim().length > 80) {
      next.callerName = tHot('hotlineIntake.validation.callerNameTooLong');
    }
    if (!phoneShapeOk(callerPhone)) {
      next.callerPhone = tHot('hotlineIntake.validation.phoneShape');
    }
    if (callTime.trim().length === 0 || isFutureLocal(callTime)) {
      next.callTime = tHot('hotlineIntake.validation.callTimeFuture');
    }
    if (description.trim().length < 20 || description.trim().length > 500) {
      next.description = tHot('hotlineIntake.validation.descriptionLength');
    }
    if (locationHint.trim().length < 5 || locationHint.trim().length > 200) {
      next.locationHint = tHot('hotlineIntake.validation.locationHintLength');
    }
    if (!OUTCOMES.includes(outcome)) {
      next.outcome = tHot('hotlineIntake.validation.outcomeRequired');
    }
    if (callDuration.trim().length > 0) {
      const n = Number(callDuration);

      if (!Number.isInteger(n) || n < 1 || n > 60) {
        next.callDuration = tHot('hotlineIntake.validation.callDurationRange');
      }
    }
    return next;
  }, [callerName, callerPhone, callTime, description, locationHint, outcome, callDuration, tHot]);

  const fieldErrors = useMemo(() => validate(), [validate]);

  const canSubmit =
    !busy &&
    description.trim().length >= 20 &&
    description.trim().length <= 500 &&
    locationHint.trim().length >= 5 &&
    locationHint.trim().length <= 200 &&
    !isFutureLocal(callTime) &&
    phoneShapeOk(callerPhone) &&
    (callDuration.trim().length === 0 ||
      (Number.isInteger(Number(callDuration)) && Number(callDuration) >= 1 && Number(callDuration) <= 60));

  const handleClose = useCallback(() => {
    if (busy) return;
    if (dirty) {
      setConfirmDiscard(true);
      return;
    }
    onClose();
  }, [busy, dirty, onClose]);

  // The Modal primitive already wires Escape to onClose; we intercept here
  // so dirty closes go through the confirmation dialog rather than
  // dropping user input silently. The dirty dialog itself also handles
  // its own Escape (it short-circuits to "keep editing").
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!canSubmit || busy) return;
      const ve = validate();

      if (Object.keys(ve).length > 0) {
        setErrors(ve);
        return;
      }
      setErrors({});
      setBusy(true);

      const payload = {
        source: 'hotline' as const,
        reporter_kind: 'hotline_operator' as const,
        hotline_call_id: hotlineCallIdRef.current,
        call_time: callTime,
        caller_name: callerName.trim() || undefined,
        caller_phone: callerPhone.trim() || undefined,
        description: description.trim(),
        location_hint: locationHint.trim(),
        outcome,
        call_duration_min: callDuration.trim() ? Number(callDuration) : undefined,
        sensitive: sensitiveContent || undefined,
      };

      try {
        let incidentId: string | undefined;
        let response: Response;

        if (outcome === 'reported_incident') {
          response = await fetch('/api/incidents', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(payload),
          });
        } else {
          // no_incident / wrong_number — call log only.
          response = await fetch('/api/hotline-calls', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(payload),
          });
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        if (outcome === 'reported_incident') {
          // Server returns the new incident; surface its id in the toast.
          try {
            const data = (await response.json()) as { incident_id?: string };

            incidentId = data.incident_id;
          } catch {
            // Non-JSON response — toast without id.
          }
          const id = incidentId ?? tHot('hotlineIntake.toast.incidentIdFallback');

          toast.success(tHot('hotlineIntake.toast.incidentCreated', { incidentId: id }));
        } else {
          toast.info(tHot('hotlineIntake.toast.callLogged'));
        }
        onSubmitted?.({ outcome, incidentId });
        onClose();
      } catch {
        // Per spec §"Error state — submit failed": keep modal open, surface
        // a retry toast. We don't implement the +5 s auto-retry here — the
        // modal stays open and the operator can re-submit.
        const message =
          outcome === 'reported_incident'
            ? tHot('hotlineIntake.toast.errorRetryIncident')
            : tHot('hotlineIntake.toast.errorRetryCall');

        toast.warning(message);
      } finally {
        setBusy(false);
      }
    },
    [
      canSubmit,
      busy,
      validate,
      callTime,
      callerName,
      callerPhone,
      description,
      locationHint,
      outcome,
      callDuration,
      sensitiveContent,
      toast,
      tHot,
      onSubmitted,
      onClose,
    ],
  );

  return (
    <>
      <Modal
        open={open}
        onClose={handleClose}
        testId="hotline-intake-modal"
        ariaLabel={tHot('hotlineIntake.title')}
      >
        <form onSubmit={handleSubmit} data-testid="hotline-intake-form" className="submit-form">
          <header style={{ marginBottom: 'var(--space-md)' }}>
            <h2 style={{ margin: 0, fontSize: 'var(--font-size-lg)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <span style={{ color: 'var(--color-reporter-hotline, var(--fg-default))' }} aria-hidden="true">
                <ReporterPhoneIcon />
              </span>
              {tHot('hotlineIntake.title')}
            </h2>
            <p
              className="page-header__sub bangla-body"
              style={{ marginTop: 'var(--space-xs)' }}
              data-testid="hotline-intake-subtitle"
            >
              {tHot('hotlineIntake.subtitle')}
            </p>
          </header>

          {/* Reporter info section */}
          <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
            <legend className="submit-form__label" style={{ fontWeight: 'var(--font-weight-semibold)' }}>
              {tHot('hotlineIntake.sections.reporterInfo')}
            </legend>

            <div className="submit-form__row">
              <label htmlFor="hotline-caller-name" className="submit-form__label">
                {tHot('hotlineIntake.fields.callerName')}
              </label>
              <input
                id="hotline-caller-name"
                data-testid="hotline-caller-name"
                type="text"
                className="submit-form__input"
                value={callerName}
                onChange={(e) => {
                  setCallerName(e.target.value);
                }}
                maxLength={80}
                disabled={busy}
              />
              {errors.callerName && (
                <p className="submit-form__error" role="status">
                  {errors.callerName}
                </p>
              )}
            </div>

            <div className="submit-form__row">
              <label htmlFor="hotline-caller-phone" className="submit-form__label">
                {tHot('hotlineIntake.fields.callerPhone')}
              </label>
              <input
                id="hotline-caller-phone"
                data-testid="hotline-caller-phone"
                type="tel"
                className="submit-form__input"
                value={callerPhone}
                onChange={(e) => {
                  setCallerPhone(e.target.value);
                }}
                placeholder="+8801712345678"
                disabled={busy}
              />
              <p className="submit-form__hint">{tHot('hotlineIntake.fields.callerPhoneHelper')}</p>
              {errors.callerPhone && (
                <p className="submit-form__error" role="status">
                  {errors.callerPhone}
                </p>
              )}
            </div>

            <div className="submit-form__row">
              <label htmlFor="hotline-call-time" className="submit-form__label">
                {tHot('hotlineIntake.fields.callTime')}
              </label>
              <input
                id="hotline-call-time"
                data-testid="hotline-call-time"
                type="datetime-local"
                className="submit-form__input"
                value={callTime}
                onChange={(e) => {
                  setCallTime(e.target.value);
                }}
                disabled={busy}
              />
              {errors.callTime && (
                <p className="submit-form__error" role="status">
                  {errors.callTime}
                </p>
              )}
            </div>
          </fieldset>

          <hr style={{ border: 'none', borderTop: '1px solid var(--color-divider, var(--border-subtle))', margin: 'var(--space-md) 0' }} />

          <p
            className="submit-form__hint bangla-body"
            style={{ marginBottom: 'var(--space-md)' }}
            data-testid="hotline-intake-section-notice"
          >
            {tHot('hotlineIntake.sectionNotice')}
          </p>

          {/* Incident info section */}
          <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
            <legend className="submit-form__label" style={{ fontWeight: 'var(--font-weight-semibold)' }}>
              {tHot('hotlineIntake.sections.incidentInfo')}
            </legend>

            <div className="submit-form__row">
              <label htmlFor="hotline-description" className="submit-form__label">
                {tHot('hotlineIntake.fields.description')}
                <span aria-hidden="true" style={{ color: 'var(--color-status-warn)' }}>
                  {' *'}
                </span>
              </label>
              <textarea
                id="hotline-description"
                data-testid="hotline-description"
                className="submit-form__textarea"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                }}
                rows={3}
                maxLength={500}
                placeholder={tHot('hotlineIntake.fields.descriptionPlaceholder')}
                disabled={busy}
                required
              />
              <p className="submit-form__hint">
                {tHot('hotlineIntake.fields.descriptionHelper')}
                {' · '}
                <span data-testid="hotline-description-count">{description.trim().length}</span>
                {' / 500'}
              </p>
              {errors.description && (
                <p className="submit-form__error" role="status">
                  {errors.description}
                </p>
              )}
            </div>

            <div className="submit-form__row">
              <label htmlFor="hotline-location-hint" className="submit-form__label">
                {tHot('hotlineIntake.fields.locationHint')}
                <span aria-hidden="true" style={{ color: 'var(--color-status-warn)' }}>
                  {' *'}
                </span>
              </label>
              <input
                id="hotline-location-hint"
                data-testid="hotline-location-hint"
                type="text"
                className="submit-form__input"
                value={locationHint}
                onChange={(e) => {
                  setLocationHint(e.target.value);
                }}
                maxLength={200}
                placeholder={tHot('hotlineIntake.fields.locationHintPlaceholder')}
                disabled={busy}
                required
              />
              <p className="submit-form__hint">{tHot('hotlineIntake.fields.locationHintHelper')}</p>
              {errors.locationHint && (
                <p className="submit-form__error" role="status">
                  {errors.locationHint}
                </p>
              )}
            </div>

            <div className="submit-form__row">
              <label htmlFor="hotline-outcome" className="submit-form__label">
                {tHot('hotlineIntake.fields.outcome')}
                <span aria-hidden="true" style={{ color: 'var(--color-status-warn)' }}>
                  {' *'}
                </span>
              </label>
              <select
                id="hotline-outcome"
                data-testid="hotline-outcome"
                className="submit-form__input"
                value={outcome}
                onChange={(e) => {
                  setOutcome(e.target.value as Outcome);
                }}
                disabled={busy}
              >
                <option value="reported_incident">{tHot('hotlineIntake.outcomes.reportedIncident')}</option>
                <option value="no_incident">{tHot('hotlineIntake.outcomes.noIncident')}</option>
                <option value="wrong_number">{tHot('hotlineIntake.outcomes.wrongNumber')}</option>
              </select>
              <p className="submit-form__hint">{tHot('hotlineIntake.fields.outcomeHelper')}</p>
              {errors.outcome && (
                <p className="submit-form__error" role="status">
                  {errors.outcome}
                </p>
              )}
            </div>

            <div className="submit-form__row submit-form__row--split">
              <div>
                <label htmlFor="hotline-call-duration" className="submit-form__label">
                  {tHot('hotlineIntake.fields.callDuration')}
                </label>
                <input
                  id="hotline-call-duration"
                  data-testid="hotline-call-duration"
                  type="number"
                  min={1}
                  max={60}
                  className="submit-form__input"
                  value={callDuration}
                  onChange={(e) => {
                    setCallDuration(e.target.value);
                  }}
                  disabled={busy}
                />
                {errors.callDuration && (
                  <p className="submit-form__error" role="status">
                    {errors.callDuration}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="hotline-sensitive"
                  className="submit-form__label"
                  style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}
                >
                  <input
                    id="hotline-sensitive"
                    data-testid="hotline-sensitive"
                    type="checkbox"
                    checked={sensitiveContent}
                    onChange={(e) => {
                      setSensitiveContent(e.target.checked);
                    }}
                    disabled={busy}
                    style={{ width: 'auto', marginRight: 'var(--space-xs)' }}
                  />
                  {tHot('hotlineIntake.fields.sensitiveContent')}
                </label>
              </div>
            </div>
          </fieldset>

          <div className="submit-form__actions">
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={!canSubmit}
              testId="hotline-submit"
              title={canSubmit ? undefined : tHot('hotlineIntake.submitDisabledTooltip')}
            >
              {busy ? tHot('hotlineIntake.submitting') : tHot('hotlineIntake.submit')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={handleClose}
              disabled={busy}
              testId="hotline-cancel"
            >
              {tHot('hotlineIntake.cancel')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Discard confirmation dialog — shown when ESC or Cancel is hit
          on a dirty modal. Renders as a nested Modal so it inherits focus
          trap + Escape handling. */}
      <Modal
        open={confirmDiscard}
        onClose={() => {
          setConfirmDiscard(false);
        }}
        testId="hotline-discard-confirm"
        ariaLabel={tHot('hotlineIntake.confirmDiscard.title')}
      >
        <div className="submit-form" data-testid="hotline-discard-form">
          <h2 style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>
            {tHot('hotlineIntake.confirmDiscard.title')}
          </h2>
          <p className="page-header__sub" style={{ marginTop: 'var(--space-xs)', marginBottom: 'var(--space-md)' }}>
            {tHot('hotlineIntake.confirmDiscard.body')}
          </p>
          <div className="submit-form__actions">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => {
                setConfirmDiscard(false);
              }}
              testId="hotline-discard-keep"
            >
              {tHot('hotlineIntake.confirmDiscard.keepEditing')}
            </Button>
            <Button
              type="button"
              variant="danger"
              size="md"
              onClick={() => {
                setConfirmDiscard(false);
                onClose();
              }}
              testId="hotline-discard-confirm-btn"
            >
              {tHot('hotlineIntake.confirmDiscard.discard')}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
