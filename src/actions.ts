import { handleAction } from 'custom-card-helpers';
import type { ActionConfig, HomeAssistant } from 'custom-card-helpers';
import type { TapAction, TextDividerRowConfig } from './types';

/**
 * custom-card-helpers only knows `call-service`; map the newer `perform-action`
 * onto it. Delete once the library handles `perform-action` itself.
 */
export function toHelperAction(action: TapAction): ActionConfig {
  if (action.action !== 'perform-action') {
    return action;
  }
  const mapped: Record<string, unknown> = { action: 'call-service', service: action.perform_action };
  if (action.data !== undefined) mapped.data = action.data;
  if (action.target !== undefined) mapped.target = action.target;
  return mapped as unknown as ActionConfig;
}

export function isInteractive(config?: TextDividerRowConfig): boolean {
  return !!config?.tap_action && config.tap_action.action !== 'none';
}

export function handleTap(node: HTMLElement, hass: HomeAssistant | undefined, config: TextDividerRowConfig): void {
  if (!hass || !isInteractive(config) || !config.tap_action) {
    return;
  }
  handleAction(node, hass, { tap_action: toHelperAction(config.tap_action) }, 'tap');
}
