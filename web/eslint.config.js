// ESLint v9 flat config for the Surakkha web app.
//
// Goal: catch malformatted code, unused code, unnecessary empty lines,
// and enforce strict coding conventions across the Phase 1 React + TS
// codebase. Runs in CI as `pnpm lint`. Auto-fixable where possible.
//
// Layout:
//   1. Globals — declare browser + vitest globals
//   2. Ignores — generated output, lockfile, public assets
//   3. JS — base strict JS rules
//   4. TS — typescript-eslint strict preset + extras
//   5. React — react-hooks + react-refresh + jsx-a11y
//   6. Test files — relax a few rules so test ergonomics stay
//   7. Mock files — relax `no-explicit-any` (fixture payloads are
//      intentionally `Record<string, unknown>` in places)

import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-config-prettier';

export default [
  // ───────────────────────────────────────────── ignores ──────────
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'public/**',
      'coverage/**',
      '*.tsbuildinfo',
      // Mockup sources are static HTML — not our TS.
      'mockups/**',
      // The eslint config file itself — eslint loads it but we don't
      // want to lint it. The typescript-eslint config above uses
      // projectService: true which would try to resolve a tsconfig for
      // eslint.config.js and fail.
      'eslint.config.js',
      // commitlint config is plain CJS, not part of the TS project.
      // We don't lint it (commitlint lints commit messages, not code).
      'commitlint.config.cjs',
      // Playwright artefacts — large video/trace blobs that live alongside
      // test output. Lint ignores them; the .gitignore under e2e/ covers
      // the same paths for git.
      'test-results/**',
      'playwright-report/**',
    ],
  },

  // ───────────────────────────────────────────── base ─────────────
  js.configs.recommended,

  // ───────────────────────────────────────────── globals ───────────
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
  },

  // ───────────────────────────────────────────── strict JS rules ───
  {
    rules: {
      // Empty lines & whitespace ────────────────────────────────
      'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 0, maxBOF: 0 }],
      'no-trailing-spaces': ['error', { skipBlankLines: false }],
      'eol-last': ['error', 'always'],
      'no-multi-spaces': ['error', { ignoreEOLComments: false }],
      'no-whitespace-before-property': 'error',
      'no-mixed-spaces-and-tabs': ['error', 'smart-tabs'],
      indent: ['error', 2, { SwitchCase: 1 }],
      'padding-line-between-statements': [
        'error',
        // Always require blank line after a sequence of variable declarations
        // that crosses a logical break.
        { blankLine: 'always', prev: ['const', 'let', 'var'], next: '*' },
        { blankLine: 'any', prev: ['const', 'let', 'var'], next: ['const', 'let', 'var'] },
        // No blank line after a function/exports/return/throw.
        { blankLine: 'never', prev: ['export', 'function', 'return', 'throw'], next: '*' },
        // Imports stay tight.
        { blankLine: 'never', prev: 'import', next: 'import' },
      ],

      // Code clarity & correctness ──────────────────────────────
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-alert': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-implicit-coercion': 'error',
      'no-lonely-if': 'error',
      'no-else-return': ['error', { allowElseIf: false }],
      // Nested ternaries are a code-smell, but the codebase has a few
      // short two-level cases (role → landing, status → class). Downgrade
      // to warn so they still surface without breaking the build; a
      // follow-up story can refactor to switch/lookup tables.
      'no-nested-ternary': 'warn',
      'no-unneeded-ternary': 'error',
      'no-unused-expressions': ['error', { allowTaggedTemplates: true, allowShortCircuit: true }],
      'no-useless-call': 'error',
      'no-useless-concat': 'error',
      'no-useless-rename': 'error',
      'no-useless-return': 'error',
      'consistent-return': 'error',
      curly: ['error', 'multi-line'],
      'default-case-last': 'error',
      'default-param-last': 'error',
      'no-duplicate-imports': 'error',
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-fallthrough': 'error',
      'no-irregular-whitespace': [
        'error',
        { skipComments: true, skipStrings: false, skipRegExps: false, skipTemplates: false },
      ],
      'no-mixed-operators': [
        'error',
        {
          groups: [
            ['%', '**'],
            ['%', '+'],
            ['%', '-'],
            ['%', '*'],
            ['%', '/'],
            ['/', '*'],
            ['&', '|', '<<', '>>', '>>>'],
            ['==', '!=', '===', '!=='],
            ['&&', '||'],
          ],
          allowSamePrecedence: false,
        },
      ],
      'no-new': 'error',
      'no-new-func': 'error',
      'no-param-reassign': ['error', { props: true }],
      'no-redeclare': 'error',
      'no-shadow': ['error', { allow: ['_', 'props', 'state'] }],
      'no-throw-literal': 'error',
      'no-undef-init': 'error',
      // `no-undefined` is too aggressive for TypeScript: `T | undefined` is
      // the standard "may be absent" pattern. Downgrade to warn so genuine
      // "explicit undefined" mistakes still surface, but idiomatic code
      // doesn't get flagged.
      'no-undefined': 'warn',
      'no-underscore-dangle': [
        'error',
        { allowAfterThis: false, allowAfterSuper: false, allowInArrayDestructuring: false },
      ],
      'no-unreachable': 'error',
      'no-use-before-define': ['error', { functions: false, classes: false, variables: true }],
      'prefer-arrow-callback': ['error', { allowNamedFunctions: false, allowUnboundThis: true }],
      'prefer-template': 'error',
      radix: 'error',
      yoda: 'error',
      'sort-imports': ['error', { ignoreDeclarationSort: true }],
      'spaced-comment': ['error', 'always', { exceptions: ['-', '+'], markers: ['/'] }],
      'arrow-body-style': ['error', 'as-needed', { requireReturnForObjectLiteral: true }],
      'object-shorthand': ['error', 'always', { avoidQuotes: true, ignoreConstructors: false }],
      'quote-props': ['error', 'as-needed'],
      'no-array-constructor': 'error',
      'no-bitwise': 'error',
      'no-empty-function': ['error', { allow: ['arrowFunctions'] }],
    },
  },

  // ───────────────────────────────────────────── TS ───────────────
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Unused — type-aware variants are stricter
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          ignoreRestSiblings: true,
          vars: 'all',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-unused-imports': 'off', // deprecated alias; use no-unused-vars

      // Strict type hygiene
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'separate-type-imports',
          disallowTypeAnnotations: false,
        },
      ],
      '@typescript-eslint/no-import-type-side-effects': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false, arguments: false } },
      ],
      '@typescript-eslint/no-unnecessary-condition': [
        'error',
        { allowConstantLoopConditions: true },
      ],
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/return-await': ['error', 'in-try-catch'],
      '@typescript-eslint/no-confusing-void-expression': ['error', { ignoreArrowShorthand: false }],
      '@typescript-eslint/only-throw-error': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/prefer-readonly': 'error',
      '@typescript-eslint/prefer-as-const': 'error',
      '@typescript-eslint/no-duplicate-enum-values': 'error',
      '@typescript-eslint/no-empty-object-type': 'error',
      '@typescript-eslint/no-unnecessary-template-expression': 'error',
      '@typescript-eslint/no-unused-private-class-members': 'error',
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/consistent-indexed-object-style': ['error', 'record'],
      '@typescript-eslint/array-type': ['error', { default: 'array', readonly: 'array' }],
      '@typescript-eslint/consistent-generic-constructors': ['error', 'constructor'],
      '@typescript-eslint/naming-convention': [
        'error',
        // camelCase / PascalCase / UPPER_CASE only — no snake_case in code.
        // variableLike covers vars + params + functions in one rule.
        {
          selector: 'variableLike',
          leadingUnderscore: 'allow',
          format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
          trailingUnderscore: 'allow',
        },
        { selector: 'typeLike', format: ['PascalCase'] },
        { selector: 'enumMember', format: ['UPPER_CASE', 'PascalCase'] },
        { selector: 'property', format: null },
      ],
      '@typescript-eslint/no-redeclare': 'error',
      '@typescript-eslint/no-shadow': 'off', // base rule covers this; TS variant conflicts
      '@typescript-eslint/dot-notation': ['error', { allowKeywords: true }],
      '@typescript-eslint/no-non-null-asserted-nullish-coalescing': 'error',
      '@typescript-eslint/no-redundant-type-constituents': 'error',
      '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'error',
      '@typescript-eslint/no-useless-empty-export': 'error',
    },
  },

  // ───────────────────────────────────────────── React ────────────
  {
    files: ['**/*.{ts,tsx,jsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      // React Hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // React Refresh (Vite HMR)
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // Accessibility
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/anchor-has-content': 'error',
      'jsx-a11y/aria-role': 'error',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/heading-has-content': 'error',
      'jsx-a11y/html-has-lang': 'warn',
      'jsx-a11y/iframe-has-title': 'error',
      'jsx-a11y/img-redundant-alt': 'error',
      'jsx-a11y/interactive-supports-focus': 'error',
      'jsx-a11y/label-has-associated-control': 'error',
      'jsx-a11y/lang': 'warn',
      'jsx-a11y/media-has-caption': 'warn',
      'jsx-a11y/mouse-events-have-key-events': 'warn',
      'jsx-a11y/no-access-key': 'error',
      'jsx-a11y/no-autofocus': 'warn',
      'jsx-a11y/no-distracting-elements': 'error',
      'jsx-a11y/no-interactive-element-to-noninteractive-role': 'error',
      'jsx-a11y/no-noninteractive-element-interactions': 'error',
      'jsx-a11y/no-noninteractive-element-to-interactive-role': 'error',
      'jsx-a11y/no-noninteractive-tabindex': 'error',
      'jsx-a11y/no-onchange': 'warn',
      'jsx-a11y/no-redundant-roles': 'error',
      'jsx-a11y/no-static-element-interactions': 'error',
      'jsx-a11y/role-has-required-aria-props': 'error',
      'jsx-a11y/role-supports-aria-props': 'error',
      'jsx-a11y/scope': 'error',
      'jsx-a11y/tabindex-no-positive': 'error',
    },
  },

  // ───────────────────────────────────────────── e2e (Playwright) ───
  // Playwright fixtures take a `use` callback that the react-hooks rule
  // mis-classifies as the React hook. E2E specs run under @playwright/test
  // (not Vitest + RTL), so disable the rule here — there's no JSX, no
  // useEffect, no rules-of-hooks surface to lint.
  {
    files: ['e2e/**/*.{ts,tsx}', 'playwright.config.ts'],
    rules: {
      'react-hooks/rules-of-hooks': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'react-refresh/only-export-components': 'off',
      // Playwright tests use describe/it that read better with blank
      // lines between groups. Disable the no-blank-line-after-function
      // clause for test files only.
      'padding-line-between-statements': 'off',
      // Fixtures destructure `loginAs`, `page`, `context` etc. that
      // some tests don't use (the fixture is for OTHER specs). Allow
      // unused destructured args here — same convention as vitest tests.
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'none',
          caughtErrors: 'none',
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],
    },
  },

  // ───────────────────────────────────────────── test files ───────
  {
    files: [
      'src/__checks__/**/*.{ts,tsx}',
      '**/*.test.{ts,tsx}',
      'vitest.config.ts',
      'vite.config.ts',
    ],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      'no-console': 'off',
      'react-refresh/only-export-components': 'off',
      // Test files use describe/it blocks that read better with blank
      // lines between groups. Disable the no-blank-line-after-function
      // clause for test files only.
      'padding-line-between-statements': 'off',
      // TS narrows HTMLElement.textContent incorrectly in the testing
      // library return type — the rule complains `?? ''` is unnecessary
      // when the runtime type is genuinely `string | null`. Allow ??.
      '@typescript-eslint/no-unnecessary-condition': 'off',
    },
  },

  // ───────────────────────────────────────────── mocks ────────────
  {
    files: ['src/mocks/**/*.ts', 'src/mocks/**/*.tsx'],
    rules: {
      // Mock fixtures are intentionally permissive — wire payloads are
      // often `Record<string, unknown>` and strict TS checks would
      // require every fixture to model the full event shape. Keep
      // base eslint strict, but relax TS-only strictness.
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      'no-console': 'off',
      // Wire-format snake_case keys come straight from dim 7 lockdown
      // (event_id, block_hash, ingested_at, occurred_at, prev_block_hash,
      // event_type, ward_id). Renaming locally would break the contract.
      // Loosen naming-convention + camelCase prefs for mocks only.
      '@typescript-eslint/naming-convention': 'off',
      '@typescript-eslint/only-throw-error': 'off',
    },
  },

  // ───────────────────────────────────────────── canonical / fixtures
  // mocks/canonical.ts + mocks/fixtures.ts build hash chains by mutating
  // accumulator params. Loosening no-param-reassign keeps the algorithm
  // readable without forcing copy-on-write plumbing for trivial loops.
  {
    files: ['src/mocks/canonical.ts', 'src/mocks/fixtures.ts'],
    rules: {
      'no-param-reassign': 'off',
    },
  },

  // ───────────────────────────────────────────── domain enums ──────
  // src/types/domain.ts intentionally declares both a TS enum and a const
  // object with the same name (enum for runtime, const for narrower
  // union types). Loosen no-redeclare + prefer-as-const for that file.
  {
    files: ['src/types/domain.ts'],
    rules: {
      '@typescript-eslint/no-redeclare': 'off',
      '@typescript-eslint/prefer-as-const': 'off',
    },
  },

  // ───────────────────────────────────────────── React primitives ──
  // Page primitives like InboxRow export a function that shares its name
  // with the imported type. TypeScript handles this fine but base ESLint
  // no-redeclare fires. Off for the small set of typed primitives.
  {
    files: ['src/components/pages/*.tsx', 'src/components/ui/*.tsx', 'src/components/layout/*.tsx'],
    rules: {
      '@typescript-eslint/no-redeclare': 'off',
    },
  },

  // eslint.config.js is in the `ignores` block above — it's not linted.

  // ───────────────────────────────────────────── prettier compat ──
  // MUST be the last entry in the array. Disables ESLint stylistic rules
  // that conflict with Prettier so the two tools don't fight over the
  // same lines. `pnpm format` runs Prettier; `pnpm lint` runs ESLint.
  prettier,
];
