// Canonical domain enums for the FE-1 app — AD-FE-6 mandates the `as const`
// pattern (no `enum` keyword) so values tree-shake and avoid reverse-mapping
// overhead. Hooks return verbatim; primitives lowercase only inside their own
// JSX class-mapping.

export const Priority = { P1: 'P1', P2: 'P2', P3: 'P3', P4: 'P4' } as const;
export type Priority = (typeof Priority)[keyof typeof Priority];
export const Band = { High: 'High', Medium: 'Medium', Low: 'Low' } as const;
export type Band = (typeof Band)[keyof typeof Band];
export const ToastVariant = {
  Success: 'Success',
  Warning: 'Warning',
  Danger: 'Danger',
  Info: 'Info',
} as const;
export type ToastVariant = (typeof ToastVariant)[keyof typeof ToastVariant];
export const ContainerWidth = {
  Narrow: 'Narrow',
  Bangla: 'Bangla',
  Wide: 'Wide',
} as const;
export type ContainerWidth = (typeof ContainerWidth)[keyof typeof ContainerWidth];
export const Locale = { En: 'en', Bn: 'bn' } as const;
export type Locale = (typeof Locale)[keyof typeof Locale];
export const Theme = { Light: 'light', Dark: 'dark' } as const;
export type Theme = (typeof Theme)[keyof typeof Theme];
