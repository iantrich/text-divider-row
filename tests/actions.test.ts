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

  it.each([[true], [{ text: 'Sure?' }]])('preserves confirmation %j', (confirmation) => {
    expect(toHelperAction({ action: 'perform-action', perform_action: 'a.b', confirmation })).toStrictEqual({
      action: 'call-service',
      service: 'a.b',
      confirmation,
    });
  });

  it('omits absent data and target', () => {
    const out = toHelperAction({ action: 'perform-action', perform_action: 'a.b' });
    expect(out).toStrictEqual({ action: 'call-service', service: 'a.b' });
  });

  it.each([
    ['perform-action', { action: 'perform-action', perform_action: 'a.b' }],
    ['call-service', { action: 'call-service', service: 'a.b' }],
  ])('maps service_data to data for %s', (_name, base) => {
    const out = toHelperAction({ ...base, service_data: { x: 1 } } as never) as unknown as Record<string, unknown>;
    expect(out.data).toEqual({ x: 1 });
    expect('service_data' in out).toBe(false);
    expect(out.action).toBe('call-service');
  });

  it.each([
    ['perform-action', { action: 'perform-action', perform_action: 'a.b' }],
    ['call-service', { action: 'call-service', service: 'a.b' }],
  ])('data wins over service_data for %s', (_name, base) => {
    const out = toHelperAction({ ...base, data: { y: 2 }, service_data: { x: 1 } } as never) as unknown as Record<
      string,
      unknown
    >;
    expect(out.data).toEqual({ y: 2 });
  });

  it('returns other actions unchanged', () => {
    const nav = { action: 'navigate', navigation_path: '/x' } as const;
    expect(toHelperAction(nav)).toBe(nav);
    const cs = { action: 'call-service', service: 'a.b', data: { x: 1 } } as const;
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

  it.each(['more-info', 'toggle'] as const)('passes entity to handleAction for %s', (action) => {
    handleTap(node, hass, { type: 't', entity: 'light.kitchen', tap_action: { action } });
    expect(handleAction).toHaveBeenCalledWith(node, hass, { entity: 'light.kitchen', tap_action: { action } }, 'tap');
  });

  it('omits the entity key when no entity is configured', () => {
    handleTap(node, hass, { type: 't', tap_action: { action: 'more-info' } });
    const cfg = vi.mocked(handleAction).mock.calls[0][2];
    expect('entity' in cfg).toBe(false);
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
