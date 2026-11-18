import { handleAction } from 'custom-card-helpers';
import type { ActionConfig, HomeAssistant } from 'custom-card-helpers';
import type { TapAction, TextDividerRowConfig } from './types';

/**
 * custom-card-helpers only knows `call-service`; map the newer `perform-action`
 * onto it. Delete once the library handles `perform-action` itself.
 */
export function toHelperAction(action: TapAction): ActionConfig {
  if (action.action === 'call-service') {
    // Older configs use `service_data`; the helper reads `data`.
    const { service_data: legacy, ...rest } = action as typeof action & { service_data?: unknown };
    const out =
      rest.data === undefined && legacy && typeof legacy === 'object'
        ? ({ ...rest, data: legacy } as ActionConfig)
        : action;
    return withConfirmationText(out, action.service);
  }
  if (action.action !== 'perform-action') {
    return action;
  }
  // Carry over every other field (confirmation, data, target, ...) so the shim is transparent.
  const mapped: Record<string, unknown> = { action: 'call-service', service: action.perform_action };
  for (const [key, value] of Object.entries(action)) {
    if (key !== 'action' && key !== 'perform_action' && key !== 'service_data' && value !== undefined) {
      mapped[key] = value;
    }
  }
  const legacy = (action as { service_data?: unknown }).service_data;
  if (mapped.data === undefined && legacy && typeof legacy === 'object') mapped.data = legacy;
  return withConfirmationText(mapped as unknown as ActionConfig, action.perform_action);
}

/**
 * The helper words its default prompt after the action ("...want to call-service?"). Spell out the
 * service instead, unless the user supplied their own text. Returns the same object when there is
 * nothing to add.
 */
function withConfirmationText(config: ActionConfig, service: unknown): ActionConfig {
  const confirmation = (config as { confirmation?: unknown }).confirmation;
  if (typeof service !== 'string' || service === '') return config;
  const text = `Are you sure you want to run action "${service}"?`;
  if (confirmation === true) return { ...config, confirmation: { text } } as ActionConfig;
  if (confirmation && typeof confirmation === 'object') {
    const current = (confirmation as { text?: unknown }).text;
    if (typeof current === 'string' && current !== '') return config;
    return { ...config, confirmation: { ...confirmation, text } } as ActionConfig;
  }
  return config;
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
