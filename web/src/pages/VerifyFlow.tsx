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
import { useTranslation } from 'react-i18next';
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

export function VerifyFlow() {
  const { t } = useTranslation('verifyFlow');
  const [step, setStep] = useState<StepIndex>(0);
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

  const next = !isLast ? steps[step + 1] : null;

  return (
    <Container width={ContainerWidth.Narrow}>
      <div className="page-header" data-testid="verify-flow-header">
        <h1>{t('header.title')}</h1>
        <p className="page-header__sub">
          {t('header.subtotalLabel')} · {steps.length} steps ·{' '}
          {t('header.currentLabel', { num: current.num })}
        </p>
      </div>

      {/* Step indicator — dim 5 §7.5 calls for a 3-step header. */}
      <ol
        className="verify-steps"
        aria-label={t('steps.ariaLabel')}
        data-testid="verify-steps"
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
              {next
                ? t('steps.continueLabel', { num: current.num + 1, title: next.title })
                : ''}
            </Button>
          )}
        </div>
      </Card>
    </Container>
  );
}
