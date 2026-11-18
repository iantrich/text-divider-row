import type { ActionConfig } from 'custom-card-helpers';

export type TextDividerAlign = 'left' | 'center' | 'right';

export interface TextDividerRowConfig {
  type: string;
  text?: string | number;
  icon?: string;
  align?: TextDividerAlign;
  tap_action?: ActionConfig;
}
