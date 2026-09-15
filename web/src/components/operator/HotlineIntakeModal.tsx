/**
 * HotlineIntakeModal.tsx — WO-002 (Tier 1, batch 2 of 3)
 *
 * Modal mounted from the OperatorDashboard top-chrome action bar. Captures
 * a phone-sourced incident as chain-anchored data while the caller is
 * still on the line. Outcome-driven:
 *   - reported_incident (default) → POST /api/events with
 *     IncidentCreated{trust_band: T1, source: hotline,
 *     reporter_kind: hotline_operator, hotline_call_id}.
 *   - no_incident / wrong_number → POST /api/events with
 *     HotlineCallLogged{outcome, hotline_call_id} (no IncidentCreated).
 *
 * 6 fields per WO scope (matches spec §6 locked-decision #3 — caller name,
 * caller phone, call time, description, location hint, call outcome;
 * call-duration and sensitive-content toggles are NOT in this build).
 *
 * Submit gating per spec §6 locked-decision #5 + §9 locked-decision #5:
 *   description 20-500, locationHint 5-200, outcome set, callTime not
 *   in the future. Submit button disabled until all required are valid.
 *
 * Dirty-check on close: any user-entered content (caller name, caller
 * phone, description, location hint, outcome-changed-from-default)
 * triggers a confirmation dialog before discarding.
 *
 * Bangla-first locale per lockdown §11.2. All field labels, helper text,
 * outcome names, button labels, and the discard-confirmation copy are
 * translated; Bangla is the default surface on this modal.
 *
 * Wire contract (WO-002 §Wire contract):
 *   POST /api/events
 *     body { event_type: 'IncidentCreated', payload: { incident_id?,
 *              ward_id?, severity?, title, summary, trust_band: 'T1',
 *              source: 'hotline', reporter_kind: 'hotline_operator',
 *              hotline_call_id, caller_name?, caller_phone_hash?,
 *              location_hint?, call_duration_min?, sensitive? } }
 *   POST /api/events
 *     body { event_type: 'HotlineCallLogged', payload: { outcome:
 *              'no_incident' | 'wrong_number', hotline_call_id,
 *              call_time, caller_name?, caller_phone_hash?,
 *              description?, location_hint? } }
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useToast } from '../ui/ToastProvider';
import { ReporterPhoneIcon } from '../icons/sidebar-icons';

/**
 * Outcome enum — matches the wire contract on the /api/events handler
 * (handlers.ts ALLOWED enum, REQ-006). reported_incident creates an
 * IncidentCreated event; no_incident and wrong_number create a
 * HotlineCallLogged event only.
 */
type Outcome = 'reported_incident' | 'no_incident' | 'wrong_number';

const OUTCOMES: readonly Outcome[] = [
  'reported_incident',
  'no_incident',
  'wrong_number',
];

const DEFAULT_OUTCOME: Outcome = 'reported_incident';

/**
 * UUID v7 mint helper — WO-002 §Tests required + lockdown §uuid-v7.
 *
 * Layout per RFC 9562 §5.7:
 *   bytes 0-5   : unix_ts_ms (big-endian)
 *   byte  6     : high 4 bits = version (0x7) | low 4 bits = rand_a[0..3]
 *   byte  7     : rand_a[4..11]
 *   byte  8     : high 2 bits = variant (0b10) | low 6 bits = rand_b[0..5]
 *   bytes 9-15  : rand_b[6..63]
 *
 * Hex format: 8-4-4-4-12.
 */
function newHotlineCallId(): string {
  const TS_BYTES = 6;
  const TOTAL_BYTES = 16;
  const buf = new Uint8Array(TOTAL_BYTES);
  const tsHex = Date.now().toString(16).padStart(TS_BYTES * 2, '0');

  for (let i = 0; i < TS_BYTES; i++) {
    buf[i] = parseInt(tsHex.slice(i * 2, i * 2 + 2), 16);
  }
  // Fill bytes 6..15 with random.
  crypto.getRandomValues(buf.subarray(TS_BYTES));
  // byte 6: high nibble = version 7
  buf[6] = ((buf[6] ?? 0) & 0x0f) | 0x70;
  // byte 8: high 2 bits = variant (0b10xxxxxx)
  buf[8] = ((buf[8] ?? 0) & 0x3f) | 0x80;
  // format: 8-4-4-4-12 hex digits
  const hex = Array.from(buf, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

function defaultCallTimeLocal(): string {
  // datetime-local expects "YYYY-MM-DDTHH:MM" — no timezone suffix. We
  // emit the operator's *local* clock; the future-validation logic uses
  // the same local clock so the operator's editing matches what we
  // validate. +1 minute tolerance per spec §"Field-by-field spec" row 3.
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function isFutureLocal(value: string): boolean {
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

  return local > Date.now() + 60_000;
}

function phoneShapeOk(raw: string): boolean {
  // E.164 (e.g. +8801712345678) OR local 10-digit. Trim spaces; ignore
  // empty (phone is optional). Shape only — server hashes the value.
  const trimmed = raw.trim();

  if (trimmed.length === 0) return true;
  if (/^\+\d{8,15}$/.test(trimmed.replace(/\s+/g, ''))) return true;
  if (/^\d{10}$/.test(trimmed.replace(/\s+/g, ''))) return true;
  return false;
}

export interface HotlineIntakeModalProps {
  open: boolean;
  onClose: () => void;
  /** Fired after a successful submit. The parent uses this to refetch
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
  const [busy, setBusy] = useState<boolean>(false);
  const [confirmDiscard, setConfirmDiscard] = useState<boolean>(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  // Stable per-open hotline_call_id — UUID v7, generated fresh on each
  // mount (per spec §"Hotline call id generation"). Discard + reopen
  // starts a new lineage key, which the spec accepts.
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

  const validate = useCallback((): FieldErrors => {
    const next: FieldErrors = {};

    if (callerName.trim().length > 80) {
      next.callerName = tHot('hotline.modal.validation.callerNameTooLong');
    }
    if (!phoneShapeOk(callerPhone)) {
      next.callerPhone = tHot('hotline.modal.validation.phoneShape');
    }
    if (callTime.trim().length === 0 || isFutureLocal(callTime)) {
      next.callTime = tHot('hotline.modal.validation.callTimeFuture');
    }
    if (description.trim().length < 20 || description.trim().length > 500) {
      next.description = tHot('hotline.modal.validation.descriptionLength');
    }
    if (locationHint.trim().length < 5 || locationHint.trim().length > 200) {
      next.locationHint = tHot('hotline.modal.validation.locationHintLength');
    }
    if (!OUTCOMES.includes(outcome)) {
      next.outcome = tHot('hotline.modal.validation.outcomeRequired');
    }
    return next;
  }, [callerName, callerPhone, callTime, description, locationHint, outcome, tHot]);

  // Submit gating per spec §6 locked-decision #5: required fields filled.
  // WO-002 acceptance #3 narrows further: description 20-500, location
  // 5-200, outcome set, callTime not in future. Phone + name are
  // optional so they don't gate submit (shape-only when present).
  const canSubmit =
    !busy &&
    description.trim().length >= 20 &&
    description.trim().length <= 500 &&
    locationHint.trim().length >= 5 &&
    locationHint.trim().length <= 200 &&
    !isFutureLocal(callTime) &&
    phoneShapeOk(callerPhone);

  const handleClose = useCallback(() => {
    if (busy) return;
    if (dirty) {
      setConfirmDiscard(true);
      return;
    }
    onClose();
  }, [busy, dirty, onClose]);

  // The Modal primitive wires Escape to onClose; we intercept here so
  // dirty closes go through the confirmation dialog rather than
  // dropping user input silently.
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

      // Wire contract per WO-002 §"Wire contract". POST /api/events with
      // event_type=IncidentCreated (incident path) or
      // event_type=HotlineCallLogged (call-only path). Both branches
      // stamp reporter_kind: hotline_operator and the hotline_call_id
      // lineage key. T1 trust band is the default for hotline-sourced
      // incidents (none of the 5 verification signals are available);
      // T3 is reserved for consumer-notice issuance only.
      const hotlineCallId = hotlineCallIdRef.current;
      let response: Response;
      let incidentId: string | undefined;

      if (outcome === 'reported_incident') {
        // WO-002 §"Wire contract" — emit IncidentCreated via
        // /api/events with trust_band T1 default + hotline reporter
        // lineage. Server mints incident_id + event_id (mirrors
        // /api/incidents hotline path); we don't pre-mint here.
        response = await fetch('/api/events', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            event_type: 'IncidentCreated',
            payload: {
              // Hotline defaults: trust_band T1 (none of the 5
              // verification signals are available — phone is
              // one-shot, no nid, no anchor trust, no photo EXIF,
              // no prior reporter history, no cross-reporter
              // corroboration). T3 is reserved for consumer-notice
              // issuance only (lockdown §01-color-lockdown).
              trust_band: 'T1',
              source: 'hotline',
              reporter_kind: 'hotline_operator',
              hotline_call_id: hotlineCallId,
              call_time: callTime,
              caller_name: callerName.trim() || undefined,
              // Phone is hashed server-side; the gateway replaces
              // the plaintext. We send the raw value here (matches
              // spec §"Implementation notes").
              caller_phone: callerPhone.trim() || undefined,
              title: description.trim().slice(0, 80),
              summary: description.trim(),
              description: description.trim(),
              location_hint: locationHint.trim(),
              // ward_id: operators type a location hint, not a ward.
              // Mirror /api/incidents hotline path (handlers.ts:678):
              // 'unknown' until downstream assignment.
              ward_id: 'unknown',
              severity: 'T2',
              inbox: {
                owner_kind: 'operator',
                assigned_to: 'priya',
              },
            },
          }),
        });
      } else {
        // no_incident or wrong_number — HotlineCallLogged event only.
        response = await fetch('/api/events', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            event_type: 'HotlineCallLogged',
            payload: {
              outcome: outcome === 'no_incident' ? 'no_incident' : 'wrong_number',
              source: 'hotline',
              reporter_kind: 'hotline_operator',
              hotline_call_id: hotlineCallId,
              call_time: callTime,
              caller_name: callerName.trim() || undefined,
              caller_phone: callerPhone.trim() || undefined,
              description: description.trim() || undefined,
              location_hint: locationHint.trim() || undefined,
            },
          }),
        });
      }

      if (!response.ok) {
        const message =
          outcome === 'reported_incident'
            ? tHot('hotline.modal.toast.errorRetryIncident')
            : tHot('hotline.modal.toast.errorRetryCall');

        toast.warning(message);
        setBusy(false);
        return;
      }

      if (outcome === 'reported_incident') {
        // Server returns the new block — surface its id in the toast.
        try {
          const data = (await response.json()) as {
            payload?: { incident_id?: string };
          };

          incidentId = data.payload?.incident_id;
        } catch {
          // Non-JSON response — toast without id.
        }
        const id = incidentId ?? tHot('hotline.modal.toast.incidentIdFallback');

        toast.success(tHot('hotline.modal.toast.incidentCreated', { incidentId: id }));
      } else {
        toast.info(tHot('hotline.modal.toast.callLogged'));
      }
      onSubmitted?.({ outcome, incidentId });
      onClose();
      setBusy(false);
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
        ariaLabel={tHot('hotline.modal.title')}
        panelClassName="modal--wide"
      >
        <form onSubmit={handleSubmit} data-testid="hotline-intake-form" className="submit-form">
          <header className="submit-form__header">
            <h2 className="submit-form__title">
              <span className="submit-form__title-icon" aria-hidden="true">
                <ReporterPhoneIcon />
              </span>
              {tHot('hotline.modal.title')}
            </h2>
            <p
              className="page-header__sub bangla-body"
              data-testid="hotline-intake-subtitle"
            >
              {tHot('hotline.modal.subtitle')}
            </p>
          </header>

          {/* Section: Reporter info. callerName + callerPhone + callTime. */}
          <div className="submit-form__section" data-testid="hotline-section-reporter">
            <div className="submit-form__row submit-form__row--full">
              <label htmlFor="hotline-input-caller-name" className="submit-form__label">
                {tHot('hotline.modal.field.callerName')}
              </label>
              <input
                id="hotline-input-caller-name"
                data-testid="hotline-input-caller-name"
                type="text"
                className="submit-form__input"
                value={callerName}
                onChange={(e) => {
                  setCallerName(e.target.value);
                }}
                maxLength={80}
                disabled={busy}
                aria-invalid={errors.callerName ? true : undefined}
                aria-describedby={errors.callerName ? 'hotline-input-caller-name-error' : undefined}
              />
              {errors.callerName && (
                <p
                  id="hotline-input-caller-name-error"
                  className="submit-form__error"
                  role="status"
                >
                  {errors.callerName}
                </p>
              )}
            </div>

            <div className="submit-form__row submit-form__row--full">
              <label htmlFor="hotline-input-caller-phone" className="submit-form__label">
                {tHot('hotline.modal.field.callerPhone')}
              </label>
              <input
                id="hotline-input-caller-phone"
                data-testid="hotline-input-caller-phone"
                type="tel"
                className="submit-form__input"
                value={callerPhone}
                onChange={(e) => {
                  setCallerPhone(e.target.value);
                }}
                placeholder="+8801712345678"
                disabled={busy}
                aria-invalid={errors.callerPhone ? true : undefined}
                aria-describedby={
                  errors.callerPhone ? 'hotline-input-caller-phone-error' : 'hotline-input-caller-phone-helper'
                }
              />
              <p
                id="hotline-input-caller-phone-helper"
                className="submit-form__hint"
              >
                {tHot('hotline.modal.field.callerPhoneHelper')}
              </p>
              {errors.callerPhone && (
                <p
                  id="hotline-input-caller-phone-error"
                  className="submit-form__error"
                  role="status"
                >
                  {errors.callerPhone}
                </p>
              )}
            </div>

            <div className="submit-form__row submit-form__row--full">
              <label htmlFor="hotline-input-call-time" className="submit-form__label">
                {tHot('hotline.modal.field.callTime')}
              </label>
              <input
                id="hotline-input-call-time"
                data-testid="hotline-input-call-time"
                type="datetime-local"
                className="submit-form__input"
                value={callTime}
                onChange={(e) => {
                  setCallTime(e.target.value);
                }}
                disabled={busy}
                aria-invalid={errors.callTime ? true : undefined}
                aria-describedby={errors.callTime ? 'hotline-input-call-time-error' : undefined}
              />
              {errors.callTime && (
                <p
                  id="hotline-input-call-time-error"
                  className="submit-form__error"
                  role="status"
                >
                  {errors.callTime}
                </p>
              )}
            </div>
          </div>

          <hr className="submit-form__divider" aria-hidden="true" />

          {/* Section: Incident info. description + locationHint + outcome. */}
          <div className="submit-form__section" data-testid="hotline-section-incident">
            <p className="submit-form__notice bangla-body">
              {tHot('hotline.modal.sectionNotice')}
            </p>

            <div className="submit-form__row submit-form__row--full">
              <label htmlFor="hotline-input-description" className="submit-form__label">
                {tHot('hotline.modal.field.description')}
                <span aria-hidden="true" className="submit-form__required">
                  {' *'}
                </span>
              </label>
              <textarea
                id="hotline-input-description"
                data-testid="hotline-input-description"
                className="submit-form__textarea"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                }}
                rows={3}
                maxLength={500}
                disabled={busy}
                required
                aria-invalid={errors.description ? true : undefined}
                aria-describedby={[
                  errors.description ? 'hotline-input-description-error' : null,
                  'hotline-input-description-helper',
                ]
                  .filter(Boolean)
                  .join(' ') || undefined}
              />
              <p
                id="hotline-input-description-helper"
                className="submit-form__hint"
              >
                <span data-testid="hotline-description-count">
                  {description.trim().length}
                </span>
                {' / 500'}
                {' · '}
                {tHot('hotline.modal.field.descriptionHelper')}
              </p>
              {errors.description && (
                <p
                  id="hotline-input-description-error"
                  className="submit-form__error"
                  role="status"
                >
                  {errors.description}
                </p>
              )}
            </div>

            <div className="submit-form__row submit-form__row--full">
              <label htmlFor="hotline-input-location-hint" className="submit-form__label">
                {tHot('hotline.modal.field.locationHint')}
                <span aria-hidden="true" className="submit-form__required">
                  {' *'}
                </span>
              </label>
              <input
                id="hotline-input-location-hint"
                data-testid="hotline-input-location-hint"
                type="text"
                className="submit-form__input"
                value={locationHint}
                onChange={(e) => {
                  setLocationHint(e.target.value);
                }}
                maxLength={200}
                disabled={busy}
                required
                aria-invalid={errors.locationHint ? true : undefined}
                aria-describedby={
                  errors.locationHint ? 'hotline-input-location-hint-error' : 'hotline-input-location-hint-helper'
                }
              />
              <p
                id="hotline-input-location-hint-helper"
                className="submit-form__hint"
              >
                {tHot('hotline.modal.field.locationHintHelper')}
              </p>
              {errors.locationHint && (
                <p
                  id="hotline-input-location-hint-error"
                  className="submit-form__error"
                  role="status"
                >
                  {errors.locationHint}
                </p>
              )}
            </div>

            <div className="submit-form__row submit-form__row--full">
              <label htmlFor="hotline-input-outcome" className="submit-form__label">
                {tHot('hotline.modal.field.outcome')}
                <span aria-hidden="true" className="submit-form__required">
                  {' *'}
                </span>
              </label>
              <select
                id="hotline-input-outcome"
                data-testid="hotline-input-outcome"
                className="submit-form__input"
                value={outcome}
                onChange={(e) => {
                  setOutcome(e.target.value as Outcome);
                }}
                disabled={busy}
                aria-invalid={errors.outcome ? true : undefined}
                aria-describedby={
                  errors.outcome ? 'hotline-input-outcome-error' : 'hotline-input-outcome-helper'
                }
              >
                <option value="reported_incident">{tHot('hotline.modal.outcome.incident')}</option>
                <option value="no_incident">{tHot('hotline.modal.outcome.inquiry')}</option>
                <option value="wrong_number">{tHot('hotline.modal.outcome.missed')}</option>
              </select>
              <p
                id="hotline-input-outcome-helper"
                className="submit-form__hint"
              >
                {tHot('hotline.modal.field.outcomeHelper')}
              </p>
              {errors.outcome && (
                <p
                  id="hotline-input-outcome-error"
                  className="submit-form__error"
                  role="status"
                >
                  {errors.outcome}
                </p>
              )}
            </div>
          </div>

          <div className="submit-form__actions">
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={!canSubmit}
              testId="hotline-button-submit"
              title={canSubmit ? undefined : tHot('hotline.modal.submitDisabledTooltip')}
            >
              {busy ? tHot('hotline.modal.submitting') : tHot('hotline.modal.button.submit')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={handleClose}
              disabled={busy}
              testId="hotline-button-cancel"
            >
              {tHot('hotline.modal.button.cancel')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Discard confirmation dialog — shown when ESC or Cancel is hit
          on a dirty modal. Renders as a nested Modal so it inherits
          focus trap + Escape handling. */}
      <Modal
        open={confirmDiscard}
        onClose={() => {
          setConfirmDiscard(false);
        }}
        testId="hotline-discard-confirm"
        ariaLabel={tHot('hotline.modal.discardConfirm.title')}
      >
        <div className="submit-form" data-testid="hotline-discard-form">
          <h2 className="submit-form__title">
            {tHot('hotline.modal.discardConfirm.title')}
          </h2>
          <p className="page-header__sub bangla-body">
            {tHot('hotline.modal.discardConfirm.body')}
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
              {tHot('hotline.modal.discardConfirm.keepEditing')}
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
              {tHot('hotline.modal.discardConfirm.discard')}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
