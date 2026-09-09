module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Allow common Surakkha-specific types in addition to the conventional
    // defaults (feat, fix, chore, docs, style, refactor, perf, test, build,
    // ci, revert).
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'build',
        'ci',
        'chore',
        'revert',
        // Surakkha-specific
        'story',
        'lock',
        'amend',
        'defer',
        'wip',
      ],
    ],
    // Subject max length — keep titles greppable.
    'header-max-length': [2, 'always', 100],
    // Subject must not end with a period.
    'header-period': [2, 'never'],
    // Subject must be lowercase (after the type).
    'header-case': [2, 'always', ['lower-case', 'sentence-case']],
    // Body lines max length (best-effort; commitlint won't fail on a single
    // 101-char URL, but this caps most prose).
    'body-max-line-length': [1, 'always', 100],
  },
};
