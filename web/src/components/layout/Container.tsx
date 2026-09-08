import type { ReactNode } from 'react';
import { ContainerWidth } from '../../types/domain';

export interface ContainerProps {
  width?: ContainerWidth;
  children: ReactNode;
  testId?: string;
}
const WIDTH_CLASS: Record<ContainerWidth, string> = {
  [ContainerWidth.Narrow]: 'container--narrow',
  [ContainerWidth.Bangla]: 'container--bangla',
  [ContainerWidth.Wide]: 'container--wide',
};

export function Container({ width = ContainerWidth.Wide, children, testId }: ContainerProps) {
  return (
    <div
      className={`container ${WIDTH_CLASS[width]}`}
      data-testid={testId ?? `container-${width.toLowerCase()}`}
    >
      {children}
    </div>
  );
}
