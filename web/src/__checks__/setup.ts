/**
 * Vitest setup file — global per-suite initialisation.
 *
 * Loaded by `vitest.config.ts > test.setupFiles`. Runs once per test
 * worker before any test module is imported.
 *
 * Filters the `react-i18next:: useTranslation: You will need to pass in
 * an i18next instance` warning that fires whenever a component tree is
 * rendered without a `<I18nextProvider>` ancestor. Most of the
 * foundation-component tests (Dropdown, Sidebar, Table, useIncidentActions
 * hook) intentionally don't wrap their renders in `<I18nextProvider>` —
 * they exercise isolated units that don't need a real i18n instance — so
 * the warning is pure noise that drowns out genuine failures in stderr.
 *
 * Note: react-i18next emits this warning via `console.warn` (not
 * `console.error`), and the message is prefixed with "react-i18next::"
 * and carries `{ code: 'NO_I18NEXT_INSTANCE' }` as a second argument.
 *
 * Tests that DO exercise the i18n integration explicitly wrap their
 * renders with `<I18nextProvider i18n={i18n}>` (see the fe-b6-* family),
 * so this filter doesn't mask any real bug there: if `i18n.changeLanguage`
 * were called in a real consumer without a provider, that bug surfaces
 * differently (a runtime error inside `t()`, not this warning).
 */

const ORIGINAL_WARN = console.warn.bind(console);
const ORIGINAL_ERROR = console.error.bind(console);

function isNoI18NextInstanceWarning(args: unknown[]): boolean {
  // Args shape from react-i18next:
  //   ["react-i18next:: useTranslation: You will need to pass in an
  //     i18next instance by using initReactI18next",
  //    { code: 'NO_I18NEXT_INSTANCE' }]
  // Some builds prefix only the first arg with "react-i18next::"; we
  // match on either the code object or the message text + prefix.
  for (const a of args) {
    if (
      typeof a === 'object' &&
      a !== null &&
      'code' in a &&
      (a as { code: unknown }).code === 'NO_I18NEXT_INSTANCE'
    ) {
      return true;
    }
  }
  if (
    typeof args[0] === 'string' &&
    args[0].includes('NO_I18NEXT_INSTANCE') &&
    args[0].includes('react-i18next')
  ) {
    return true;
  }
  return false;
}

console.warn = (...args: unknown[]) => {
  if (isNoI18NextInstanceWarning(args)) return;
  ORIGINAL_WARN(...args);
};

console.error = (...args: unknown[]) => {
  if (isNoI18NextInstanceWarning(args)) return;
  ORIGINAL_ERROR(...args);
};
