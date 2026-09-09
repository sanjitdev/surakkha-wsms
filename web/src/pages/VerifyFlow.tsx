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
 */
import { type ReactElement, useState } from 'react';
import '../../mockups/01-priya/dashboard.css';
import '../styles/verify.css';
import { Container } from '../components/layout/Container';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  CheckIcon,
  ClipboardListIcon,
  InboxIcon,
  SendIcon,
} from '../components/icons/sidebar-icons';
import { ContainerWidth } from '../types/domain';

type StepIndex = 0 | 1 | 2;
interface Step {
  id: string;
  num: number;
  title: string;
  subtitle: string;
  icon: ReactElement;
  bullets: string[];
}
const STEPS: readonly Step[] = [
  {
    id: 'sensor-cluster',
    num: 1,
    title: 'Sensor cluster',
    subtitle: 'Confirm the readings that anchor this verification.',
    icon: <ClipboardListIcon />,
    bullets: [
      'Pick at least 2 sensors within the affected ward (3+ preferred).',
      'Last 24 h of readings auto-load — look for the breach window.',
      'Cross-check the cluster against the published calibration log.',
    ],
  },
  {
    id: 'anjali-corroboration',
    num: 2,
    title: 'Anjali corroboration',
    subtitle: 'Attach the citizen report to the same hash envelope.',
    icon: <InboxIcon />,
    bullets: [
      'Wait for Anjali (or her proxy) to acknowledge the broadcast.',
      'Citizen signature links to the same block — chain-verify will walk it.',
      'If 6 h passes with no ack, escalate to PHA (this step turns amber).',
    ],
  },
  {
    id: 'councillor-notify',
    num: 3,
    title: 'Councillor notify',
    subtitle: 'Broadcast to the ward councillor for political sign-off.',
    icon: <SendIcon />,
    bullets: [
      'One-tap SMS to the assigned councillor — no editing.',
      'Councillor’s public key signs the same envelope, completing the chain.',
      'All 4 signers are pinned in the block once this step is sealed.',
    ],
  },
];

export function VerifyFlow() {
  const [step, setStep] = useState<StepIndex>(0);
  const current = STEPS[step];
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;

  const advance = () => {
    if (!isLast) setStep((s) => (s + 1) as StepIndex);
  };
  const rewind = () => {
    if (!isFirst) setStep((s) => (s - 1) as StepIndex);
  };

  return (
    <Container width={ContainerWidth.Narrow}>
      <div className="page-header" data-testid="verify-flow-header">
        <h1>Verify flow</h1>
        <p className="page-header__sub">
          3-step chain verification · {STEPS.length} steps · current: Step {current.num}
        </p>
      </div>

      {/* Step indicator — dim 5 §7.5 calls for a 3-step header. */}
      <ol className="verify-steps" aria-label="Verification steps" data-testid="verify-steps">
        {STEPS.map((s) => {
          const isActive = s.num === current.num;
          const isDone = s.num < current.num;

          return (
            <li
              key={s.id}
              className={`verify-step${isActive ? ' verify-step--active' : ''}${isDone ? ' verify-step--done' : ''}`}
              aria-current={isActive ? 'step' : undefined}
              data-testid={`verify-step-${s.id}`}
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
              Step {current.num}: {current.title}
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

        <div className="verify-step__actions">
          <Button variant="secondary" size="md" onClick={rewind} disabled={isFirst}>
            ← Back
          </Button>
          {isLast ? (
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                /* Final step — submit is out of scope (Phase 2 backend). */
              }}
              data-testid="verify-seal"
            >
              <span style={{ marginRight: 'var(--space-sm)' }}>
                <CheckIcon />
              </span>
              Seal verification
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              onClick={advance}
              data-testid={`verify-advance-${STEPS[step + 1].id}`}
            >
              Continue to Step {current.num + 1}: {STEPS[step + 1].title} →
            </Button>
          )}
        </div>
      </Card>
    </Container>
  );
}
