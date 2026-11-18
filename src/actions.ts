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
  // Carry over every other field (confirmation, data, target, ...) so the shim is transparent.
  const mapped: Record<string, unknown> = { action: 'call-service', service: action.perform_action };
  for (const [key, value] of Object.entries(action)) {
    if (key !== 'action' && key !== 'perform_action' && value !== undefined) mapped[key] = value;
  }
  return mapped as unknown as ActionConfig;
}

export function isInteractive(config?: TextDividerRowConfig): boolean {
  return !!config?.tap_action && config.tap_action.action !== 'none';
}

export function handleTap(node: HTMLElement, hass: HomeAssistant | undefined, config: TextDividerRowConfig): void {
  if (!hass || !isInteractive(config) || !config.tap_action) {
    return;
  }
  const helperConfig = {
    tap_action: toHelperAction(config.tap_action),
    ...(config.entity ? { entity: config.entity } : {}),
  };
  handleAction(node, hass, helperConfig, 'tap');
}
