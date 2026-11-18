import { afterEach, describe, expect, it, vi } from 'vitest';
import { handleTap } from '../src/actions';

// Deliberately NOT mocking custom-card-helpers: exercises the real handleAction.
describe('handleTap with the real custom-card-helpers', () => {
  it('fires hass-more-info with the configured entity', () => {
    const node = document.createElement('div');
    const events: CustomEvent[] = [];
    node.addEventListener('hass-more-info', (e) => events.push(e as CustomEvent));
    const hass = { user: { id: 'u' } } as never;
    handleTap(node, hass, { type: 't', entity: 'light.kitchen', tap_action: { action: 'more-info' } });
    expect(events).toHaveLength(1);
    expect(events[0].detail.entityId).toBe('light.kitchen');
  });

  it('calls the service for perform-action via the call-service mapping', () => {
    const node = document.createElement('div');
    const calls: unknown[][] = [];
    const hass = { user: { id: 'u' }, callService: (...a: unknown[]) => calls.push(a) } as never;
    handleTap(node, hass, {
      type: 't',
      tap_action: { action: 'perform-action', perform_action: 'light.turn_on', data: { brightness: 5 } },
    });
    expect(calls).toEqual([['light', 'turn_on', { brightness: 5 }, undefined]]);
  });
});

describe('perform-action confirmation with the real custom-card-helpers', () => {
  afterEach(() => vi.restoreAllMocks());

  const run = (confirmResult: boolean) => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(confirmResult);
    const callService = vi.fn();
    const hass = { user: { id: 'u' }, callService } as never;
    handleTap(document.createElement('div'), hass, {
      type: 't',
      tap_action: { action: 'perform-action', perform_action: 'light.turn_on', confirmation: true },
    });
    return { confirmSpy, callService };
  };

  it('does not call the service when the user declines', () => {
    const { confirmSpy, callService } = run(false);
    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(callService).not.toHaveBeenCalled();
  });

  it('calls the service when the user confirms', () => {
    const { confirmSpy, callService } = run(true);
    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(callService).toHaveBeenCalledTimes(1);
  });
});
