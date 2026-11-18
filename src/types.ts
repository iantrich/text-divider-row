import type { ActionConfig } from 'custom-card-helpers';

export type TextDividerAlign = 'left' | 'center' | 'right';

/**
 * Home Assistant's action picker emits `perform-action` (since 2024.8), which
 * custom-card-helpers 2.2.1 does not know. It is mapped to `call-service`.
 */
export interface PerformActionConfig {
  action: 'perform-action';
  perform_action: string;
  data?: Record<string, unknown>;
  target?: Record<string, unknown>;
  confirmation?: boolean | { text?: string; exemptions?: { user: string }[] };
}

export type TapAction = ActionConfig | PerformActionConfig;

export interface TextDividerRowConfig {
  type: string;
  text?: string | number;
  icon?: string;
  align?: TextDividerAlign;
  entity?: string;
  tap_action?: TapAction;
}

export interface CustomCardEntry {
  type: string;
  name: string;
  description?: string;
  preview?: boolean;
}

declare global {
  interface Window {
    customCards?: CustomCardEntry[];
  }
}
