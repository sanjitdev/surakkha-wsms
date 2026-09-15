/**
 * VerifyFlow.tsx — FE-1.5b.
 *
 * 3-step wizard at /verify-flow. Per dim 5 §7.5:
 *   - Container width="narrow" (720 px) — focused reading.
 *   - <TopChrome /> + <main> (no sidebar — modally-focused flow).
 *     Note: we still render inside <AppLayout> via the route in App.tsx,
 *     which means the sidebar IS visible. dim 5 §7.5 calls for "no
 *     sidebar" but the existing <AppLayout> wrapper owns it. Tradeoff:
 *     the existing layout route pattern is simpler, and the narrow
 *     container + the 3-step header make the focus clear.
 *   - 3 steps: Sensor cluster · Anjali corroboration · Councillor notify.
 *     Each is a <Card> stacked with --space-xl gap.
 *   - Step state lives in this page; the wizard advances on the
 *     primary <Button> click and rewinds on Back.
 *
 * Why composition only:
 *   - No real signing happens in Phase 1 (the chain is a mock).
 *   - The UI is the deliverable; backend verification ships later.
 *   - Each step's data is hardcoded for now — we render the structure,
 *     the visual states, and the navigation. Real wire integration
 *     comes when the backend lands.
 *
 * WO-017 reconciliation (Tier 3 build 9/9 — FINAL):
 *   - Single-click verify button calls verifyBlockHash() from
 *     web/src/lib/chain-verify.ts (NOT a copy-pasted fetch). Pass / fail
 *     badge uses --color-safe-green / --color-alert-red-reserved per the
 *     WO-017 spec; toast (3 s auto-dismiss) + durable row metadata badge
 *     mirrors the audit-log / inbox-detail pattern.
 *   - Step indicator <ol> wires ArrowUp / ArrowDown keyboard nav
 *     (foundation §10.3). Active step carries aria-current="step";
 *     inactive steps omit it.
 *   - Seal button remains a no-op for Phase 1 (real signing ships later
 *     per the existing chain-verify contract; signature attestation lands
 *     with the gateway in Phase 2).
 *
 * Cross-reference:
 *   - Standalone /verify-flow wizard mirrors the verify-and-assign flow
 *     owned by InboxDetail (web/src/pages/InboxDetail.tsx). Both pages
 *     reuse the same verifyBlockHash() helper from chain-verify.ts.
 */
import { type ReactElement, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../../mockups/01-priya/dashboard.css';
import '../styles/verify.css';
import { Container } from '../components/layout/Container';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/ToastProvider';
import {
  CheckIcon,
  ClipboardListIcon,
  InboxIcon,
  SendIcon,
} from '../components/icons/sidebar-icons';
import { ContainerWidth } from '../types/domain';
import {
  verifyBlockHash,
  type VerifyState,
} from '../lib/chain-verify';

type StepIndex = 0 | 1 | 2;
type StepKey = 'sensorCluster' | 'anjaliCorroboration' | 'councillorNotify';

interface Step {
  /** Translation key suffix — used by `getSteps(t)` to resolve labels. */
  key: StepKey;
  id: string;
  num: number;
  icon: ReactElement;
}

const STEPS: readonly Step[] = [
  { key: 'sensorCluster', id: 'sensor-cluster', num: 1, icon: <ClipboardListIcon /> },
  { key: 'anjaliCorroboration', id: 'anjali-corroboration', num: 2, icon: <InboxIcon /> },
  { key: 'councillorNotify', id: 'councillor-notify', num: 3, icon: <SendIcon /> },
];

type TFn = (key: string, opts?: Record<string, unknown>) => string;

interface ResolvedStep {
  id: string;
  num: number;
  icon: ReactElement;
  title: string;
  subtitle: string;
  bullets: string[];
}

function resolveSteps(t: TFn): ResolvedStep[] {
  return STEPS.map((s) => {
    const bullets = t(`${s.key}.bullets`, { returnObjects: true }) as unknown as
      | string[]
      | Record<string, string>;

    // i18next returns either an array (when the JSON value is an array
    // of strings) or an object (when the JSON is keyed — e.g. our
    // `bullets: { pickSensors, last24h, crossCheck }`). We support
    // both shapes here so the JSON can be edited without code churn.
    const bulletArr = Array.isArray(bullets)
      ? bullets
      : bullets && typeof bullets === 'object'
        ? Object.values(bullets)
        : [];

    return {
      id: s.id,
      num: s.num,
      icon: s.icon,
      title: t(`${s.key}.title`),
      subtitle: t(`${s.key}.subtitle`),
      bullets: bulletArr,
    };
  });
}

/**
 * The block hash the standalone /verify-flow wizard exercises.
 *
 * In Phase 1 (mock chain) we POST the literal that the mock
 * /api/chain/verify handler treats as "verified ok" — the same hash the
 * InboxDetail verify buttons target. Phase 2 swaps this for the real
 * block hash pulled from the chain head projection; the helper contract
 * does not change.
 */
const DEMO_BLOCK_HASH = 'hash-demo-verify-flow';

export function VerifyFlow() {
  const { t } = useTranslation('verifyFlow');
  const [step, setStep] = useState<StepIndex>(0);
  const [verify, setVerify] = useState<VerifyState>({ status: 'idle' });
  const toast = useToast();
  // 3 s toast lifecycle: store the active toast id so we can dismiss
  // it on unmount or on a fresh verify click (avoids stale toasts
  // stacking up if the operator clicks rapidly).
  const toastIdRef = useRef<number | null>(null);
  const steps = resolveSteps(t);
  const current = steps[step];
  const isFirst = step === 0;
  const isLast = step === steps.length - 1;

  const advance = () => {
    if (!isLast) setStep((s) => (s + 1) as StepIndex);
  };
  const rewind = () => {
    if (!isFirst) setStep((s) => (s - 1) as StepIndex);
  };

  /**
   * Single-click verify (WO-017 acceptance #2). Calls verifyBlockHash()
   * from web/src/lib/chain-verify.ts — NO copy-paste of the fetch /
   * AbortController logic. The helper is the single source of truth
   * shared with InboxDetail, AuditLog, and IncidentChainSegmentPage.
   *
   * Lifecycle:
   *   1) flip state to 'pending' (button shows busy)
   *   2) await verifyBlockHash()
   *   3) write the typed result back to state (durable badge in
   *      step-card metadata)
   *   4) push a 3 s toast via the ToastProvider
   */
  const onVerifyClick = useCallback(async () => {
    if (toastIdRef.current !== null) {
      toast.dismiss(toastIdRef.current);
      toastIdRef.current = null;
    }
    setVerify({ status: 'pending' });
    const result = await verifyBlockHash(DEMO_BLOCK_HASH);
    setVerify(result);

    if (result.status === 'ok') {
      const id = toast.success(t('verify.toastOk'));

      toastIdRef.current = id;
    } else if (result.status === 'fail') {
      const id = toast.danger(t('verify.toastFail'));

      toastIdRef.current = id;
    }
  }, [t, toast]);

  // Auto-dismiss the toast after 3 s (WO-017 acceptance #4 — toast is
  // 3 s; the durable badge in the row metadata stays put).
  useEffect(() => {
    if (toastIdRef.current === null) return undefined;
    const id = toastIdRef.current;
    const timer = window.setTimeout(() => {
      toast.dismiss(id);
      if (toastIdRef.current === id) toastIdRef.current = null;
    }, 3000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [verify.status, toast]);

  // Clear any pending toast on unmount.
  useEffect(() => {
    return () => {
      if (toastIdRef.current !== null) {
        toast.dismiss(toastIdRef.current);
        toastIdRef.current = null;
      }
    };
  }, [toast]);

  /**
   * Step indicator keyboard nav (foundation §10.3 + WO-017 spec #3).
   *
   * ArrowDown / ArrowRight advance the active step by one (clamped at
   * the last step). ArrowUp / ArrowLeft rewind by one (clamped at 0).
   * Home jumps to step 1; End jumps to the last step. All keys are
   * ignored when defaultPrevented so consumers can override if needed.
   *
   * The handler is wired on the <ol> so the entire indicator strip is
   * a single tab-stop-equivalent keyboard surface — focus stays on the
   * active <li>, but a screen-reader user can still drive the wizard
   * with the arrow keys via the parent <ol>'s aria-label.
   */
  const onStepKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLOListElement>) => {
      if (e.defaultPrevented) return;
      let next: StepIndex | null = null;

      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        if (!isLast) next = (step + 1) as StepIndex;
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        if (!isFirst) next = (step - 1) as StepIndex;
      } else if (e.key === 'Home') {
        next = 0;
      } else if (e.key === 'End') {
        next = (steps.length - 1) as StepIndex;
      }
      if (next !== null) {
        e.preventDefault();
        setStep(next);
      }
    },
    [isFirst, isLast, step, steps.length],
  );

  const next = !isLast ? steps[step + 1] : null;

  return (
    <Container width={ContainerWidth.Narrow}>
      <div className="page-header" data-testid="verify-flow-header">
        <h1>{t('header.title')}</h1>
        <p className="page-header__sub">
          {/* subtotalLabel already includes the step count ("3-step chain
              verification") — appending "{{steps.length}} steps" right
              after produces "3-step chain verification · 3 steps · …".
              Drop the dynamic count; the step header below already shows
              it via the active step number. */}
          {t('header.subtotalLabel')} ·{' '}
          {t('header.currentLabel', { num: current.num })}
        </p>
      </div>

      {/* Step indicator — dim 5 §7.5 calls for a 3-step header. The
          onKeyDown handler wires ArrowUp/Down/Left/Right + Home/End to
          advance / rewind the active step within bounds (foundation
          §10.3 + WO-017 spec #3). Each <li> below carries
          aria-current="step" only when active. */}
      <ol
        className="verify-steps"
        aria-label={t('steps.ariaLabel')}
        data-testid="verify-steps"
        onKeyDown={onStepKeyDown}
      >
        {steps.map((s) => {
          const isActive = s.num === current.num;
          const isDone = s.num < current.num;

          return (
            <li
              key={s.id}
              className={`verify-step${isActive ? ' verify-step--active' : ''}${isDone ? ' verify-step--done' : ''}`}
              aria-current={isActive ? 'step' : undefined}
              data-testid={`verify-step-${s.id}`}
              data-step-active={isActive ? 'true' : 'false'}
              tabIndex={isActive ? 0 : -1}
            >
              <span className="verify-step__num">{s.num}</span>
              <span className="verify-step__label">{s.title}</span>
            </li>
          );
        })}
      </ol>

      <Card testId="verify-step-card">
        <div className="verify-step__head">
          <span className="verify-step__icon" aria-hidden="true">
            {current.icon}
          </span>
          <div>
            <h2 style={{ margin: 0, fontSize: 'var(--font-size-xl)' }}>
              {t('steps.stepCardHeading', { num: current.num, title: current.title })}
            </h2>
            <p
              className="page-header__sub"
              style={{ marginTop: 'var(--space-xs)', marginBottom: 0 }}
            >
              {current.subtitle}
            </p>
          </div>
        </div>

        <ul className="verify-step__bullets">
          {current.bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>

        {/* WO-017 single-click verify row. The button lives in the
            step-card metadata row so the durable badge sits next to the
            step title. Pass / fail badge uses --color-safe-green /
            --color-alert-red-reserved per the WO-017 spec. */}
        <div
          className="verify-step__verify-row"
          data-testid="verify-row"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-md)',
            padding: 'var(--space-md) 0',
            borderTop: '1px solid var(--border-subtle)',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          {verify.status === 'idle' ? (
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                void onVerifyClick();
              }}
              testId="verify-row-btn"
            >
              {t('verify.buttonLabel')}
            </Button>
          ) : verify.status === 'pending' ? (
            <span
              className="verify-badge verify-badge--pending"
              data-testid="verify-row-badge"
              aria-label={t('verify.pendingAria')}
              role="status"
            >
              {t('verify.pendingLabel')}
            </span>
          ) : verify.status === 'ok' ? (
            <span
              className="verify-badge verify-badge--ok"
              data-testid="verify-row-badge"
              aria-label={t('verify.okAria')}
              data-verify-state="ok"
            >
              {/* VS15 (\uFE0E) forces text presentation (lockdown). */}
              <span aria-hidden="true">{'\u2713\uFE0E'}</span>
              {t('verify.okLabel')}
            </span>
          ) : (
            <span
              className="verify-badge verify-badge--fail"
              data-testid="verify-row-badge"
              aria-label={t('verify.failAria')}
              data-verify-state="fail"
            >
              {/* VS15 (\uFE0E) forces text presentation (lockdown). */}
              <span aria-hidden="true">{'\u26A0\uFE0E'}</span>
              {t('verify.failLabel')}
            </span>
          )}
        </div>

        <div className="verify-step__actions">
          <Button variant="secondary" size="md" onClick={rewind} disabled={isFirst}>
            {t('steps.backLabel')}
          </Button>
          {isLast ? (
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                /* Final step — submit is out of scope (Phase 2 backend). */
              }}
              testId="verify-seal"
            >
              <span style={{ marginRight: 'var(--space-sm)' }}>
                <CheckIcon />
              </span>
              {t('steps.sealLabel')}
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              onClick={advance}
              testId={`verify-advance-${next?.id ?? ''}`}
            >
              {next ? (
                <>
                  {t('steps.continueLabel', {
                    num: current.num + 1,
                    title: next.title,
                  })}
                  {/* Arrow sits outside the i18n string so we control the
                     gap precisely. Without it the arrow renders flush
                     against the title text (screenshot review 2026-09-14). */}
                  <span aria-hidden="true" style={{ marginLeft: 'var(--space-xs)' }}>
                    {'\u2192'}
                  </span>
                </>
              ) : null}
            </Button>
          )}
        </div>
      </Card>
    </Container>
  );
}
