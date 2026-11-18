import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('custom-card-helpers', () => ({ handleAction: vi.fn() }));

import { handleAction } from 'custom-card-helpers';
import { handleTap, toHelperAction } from '../src/actions';
import type { TextDividerRowConfig } from '../src/types';

const node = document.createElement('div');
const hass = { user: { id: 'u' } } as never;

beforeEach(() => vi.mocked(handleAction).mockClear());

describe('toHelperAction', () => {
  it('maps perform-action to call-service', () => {
    expect(
      toHelperAction({
        action: 'perform-action',
        perform_action: 'light.turn_on',
        data: { brightness: 5 },
        target: { entity_id: 'light.a' },
      }),
    ).toEqual({
      action: 'call-service',
      service: 'light.turn_on',
      data: { brightness: 5 },
      target: { entity_id: 'light.a' },
    });
  });

  it('omits absent data and target', () => {
    const out = toHelperAction({ action: 'perform-action', perform_action: 'a.b' });
    expect(out).toStrictEqual({ action: 'call-service', service: 'a.b' });
  });

  it('returns other actions unchanged', () => {
    const nav = { action: 'navigate', navigation_path: '/x' } as const;
    expect(toHelperAction(nav)).toBe(nav);
    const cs = { action: 'call-service', service: 'a.b' } as const;
    expect(toHelperAction(cs)).toBe(cs);
  });
});

describe('handleTap', () => {
  it('dispatches the mapped action once', () => {
    const config: TextDividerRowConfig = {
      type: 't',
      tap_action: { action: 'perform-action', perform_action: 'a.b' },
    };
    handleTap(node, hass, config);
    expect(handleAction).toHaveBeenCalledTimes(1);
    expect(handleAction).toHaveBeenCalledWith(
      node,
      hass,
      { tap_action: { action: 'call-service', service: 'a.b' } },
      'tap',
    );
  });

  it('does nothing without tap_action', () => {
    handleTap(node, hass, { type: 't' });
    expect(handleAction).not.toHaveBeenCalled();
  });

  it('does nothing for action none', () => {
    handleTap(node, hass, { type: 't', tap_action: { action: 'none' } });
    expect(handleAction).not.toHaveBeenCalled();
  });

  it('does not throw and calls nothing when hass is undefined', () => {
    expect(() =>
      handleTap(node, undefined, { type: 't', tap_action: { action: 'navigate', navigation_path: '/x' } }),
    ).not.toThrow();
    expect(handleAction).not.toHaveBeenCalled();
  });
});
