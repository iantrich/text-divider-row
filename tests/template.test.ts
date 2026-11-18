import { describe, expect, it, vi } from 'vitest';
import type { HomeAssistant } from 'custom-card-helpers';
import { isTemplate, TemplateSubscription } from '../src/template';

type Callback = (msg: unknown) => void;

interface Deferred {
  resolve: (unsub: () => void) => void;
  reject: (err: unknown) => void;
}

/** A fake hass whose subscribeMessage captures each callback and returns a spy unsub. */
function fakeHass(opts: { manual?: boolean } = {}) {
  const callbacks: Callback[] = [];
  const unsubs: ReturnType<typeof vi.fn>[] = [];
  const pending: Deferred[] = [];
  const subscribeMessage = vi.fn((cb: Callback, _message?: unknown) => {
    void _message;
    callbacks.push(cb);
    const unsub = vi.fn();
    unsubs.push(unsub);
    if (opts.manual) {
      return new Promise<() => void>((resolve, reject) => pending.push({ resolve, reject }));
    }
    return Promise.resolve(unsub);
  });
  const hass = { connection: { subscribeMessage } } as unknown as HomeAssistant;
  return { hass, subscribeMessage, callbacks, unsubs, pending };
}

describe('isTemplate', () => {
  it('detects {{ }} and {% %}', () => {
    expect(isTemplate('{{ 1 }}')).toBe(true);
    expect(isTemplate('{% if x %}a{% endif %}')).toBe(true);
  });

  it('rejects plain values', () => {
    expect(isTemplate('plain')).toBe(false);
    expect(isTemplate('')).toBe(false);
    expect(isTemplate(123)).toBe(false);
    expect(isTemplate(undefined)).toBe(false);
  });
});

describe('TemplateSubscription', () => {
  const config = { type: 'custom:text-divider-row', text: '{{ 1 }}' };

  it('subscribes with a render_template message', async () => {
    const f = fakeHass();
    const sub = new TemplateSubscription(vi.fn(), vi.fn());
    await sub.subscribe(f.hass, '{{ 1 }}', { config });
    expect(f.subscribeMessage).toHaveBeenCalledTimes(1);
    expect(f.subscribeMessage.mock.calls[0][1]).toEqual({
      type: 'render_template',
      template: '{{ 1 }}',
      variables: { config },
      report_errors: true,
    });
  });

  it('recovers from an error event when a later result arrives', async () => {
    const f = fakeHass();
    const onResult = vi.fn();
    const onError = vi.fn();
    const sub = new TemplateSubscription(onResult, onError);
    await sub.subscribe(f.hass, '{{ states("x") | int }}', { config });
    f.callbacks[0]({ error: 'invalid literal', level: 'ERROR' });
    expect(onError).toHaveBeenCalledWith('invalid literal');
    expect(f.unsubs[0]).not.toHaveBeenCalled();
    f.callbacks[0]({ result: '5', listeners: {} });
    expect(onResult).toHaveBeenCalledWith('5');
    expect(f.subscribeMessage).toHaveBeenCalledTimes(1);
    expect(f.unsubs[0]).not.toHaveBeenCalled();
  });

  it('passes result to onResult and error to onError', async () => {
    const f = fakeHass();
    const onResult = vi.fn();
    const onError = vi.fn();
    const sub = new TemplateSubscription(onResult, onError);
    await sub.subscribe(f.hass, '{{ 1 }}', { config });
    f.callbacks[0]({ result: 'x' });
    expect(onResult).toHaveBeenCalledWith('x');
    f.callbacks[0]({ error: 'bad' });
    expect(onError).toHaveBeenCalledWith('bad');
    f.callbacks[0]({ error: '' });
    expect(onError).toHaveBeenLastCalledWith('Template error');
    f.callbacks[0]({ result: 42 });
    expect(onResult).toHaveBeenLastCalledWith('42');
  });

  it('calls onError with the rejection message when subscribeMessage rejects', async () => {
    const onError = vi.fn();
    const errorHass = {
      connection: {
        subscribeMessage: vi.fn(() => Promise.reject({ code: 'template_error', message: 'boom' })),
      },
    } as unknown as HomeAssistant;
    await new TemplateSubscription(vi.fn(), onError).subscribe(errorHass, '{{ x', { config });
    expect(onError).toHaveBeenCalledWith('boom');

    const onError2 = vi.fn();
    const errorHass2 = {
      connection: { subscribeMessage: vi.fn(() => Promise.reject(new Error('kaput'))) },
    } as unknown as HomeAssistant;
    await new TemplateSubscription(vi.fn(), onError2).subscribe(errorHass2, '{{ x', { config });
    expect(onError2).toHaveBeenCalledWith('kaput');
  });

  it('unsubscribe() calls the unsub function', async () => {
    const f = fakeHass();
    const sub = new TemplateSubscription(vi.fn(), vi.fn());
    await sub.subscribe(f.hass, '{{ 1 }}', { config });
    sub.unsubscribe();
    expect(f.unsubs[0]).toHaveBeenCalledTimes(1);
    sub.unsubscribe();
    expect(f.unsubs[0]).toHaveBeenCalledTimes(1);
  });

  it('ignores results after unsubscribe()', async () => {
    const f = fakeHass();
    const onResult = vi.fn();
    const sub = new TemplateSubscription(onResult, vi.fn());
    await sub.subscribe(f.hass, '{{ 1 }}', { config });
    sub.unsubscribe();
    f.callbacks[0]({ result: 'late' });
    expect(onResult).not.toHaveBeenCalled();
  });

  it('unsubscribe before subscribeMessage resolves still calls unsub', async () => {
    const f = fakeHass({ manual: true });
    const onResult = vi.fn();
    const sub = new TemplateSubscription(onResult, vi.fn());
    const done = sub.subscribe(f.hass, '{{ 1 }}', { config });
    sub.unsubscribe();
    const lateUnsub = vi.fn();
    f.pending[0].resolve(lateUnsub);
    await done;
    expect(lateUnsub).toHaveBeenCalledTimes(1);
    f.callbacks[0]({ result: 'stale' });
    expect(onResult).not.toHaveBeenCalled();
  });

  it('ignores a rejection that arrives after unsubscribe()', async () => {
    const f = fakeHass({ manual: true });
    const onError = vi.fn();
    const sub = new TemplateSubscription(vi.fn(), onError);
    const done = sub.subscribe(f.hass, '{{ 1 }}', { config });
    sub.unsubscribe();
    f.pending[0].reject(new Error('late'));
    await done;
    expect(onError).not.toHaveBeenCalled();
  });

  it('a second subscribe first unsubscribes the previous one', async () => {
    const f = fakeHass();
    const onResult = vi.fn();
    const sub = new TemplateSubscription(onResult, vi.fn());
    await sub.subscribe(f.hass, '{{ 1 }}', { config });
    await sub.subscribe(f.hass, '{{ 2 }}', { config });
    expect(f.unsubs[0]).toHaveBeenCalledTimes(1);
    expect(f.unsubs[1]).not.toHaveBeenCalled();
    f.callbacks[0]({ result: 'old' });
    expect(onResult).not.toHaveBeenCalled();
    f.callbacks[1]({ result: 'new' });
    expect(onResult).toHaveBeenCalledWith('new');
  });

  it('a second subscribe while the first is pending drops the first', async () => {
    const f = fakeHass({ manual: true });
    const onResult = vi.fn();
    const sub = new TemplateSubscription(onResult, vi.fn());
    const first = sub.subscribe(f.hass, '{{ 1 }}', { config });
    const second = sub.subscribe(f.hass, '{{ 2 }}', { config });
    const unsubA = vi.fn();
    const unsubB = vi.fn();
    f.pending[1].resolve(unsubB);
    f.pending[0].resolve(unsubA);
    await Promise.all([first, second]);
    expect(unsubA).toHaveBeenCalledTimes(1);
    expect(unsubB).not.toHaveBeenCalled();
    f.callbacks[0]({ result: 'old' });
    expect(onResult).not.toHaveBeenCalled();
    sub.unsubscribe();
    expect(unsubB).toHaveBeenCalledTimes(1);
  });

  it('swallows a rejecting unsub (closed connection)', async () => {
    const unsub = vi.fn(() => Promise.reject(new Error('closed')));
    const hass = {
      connection: { subscribeMessage: vi.fn(() => Promise.resolve(unsub)) },
    } as unknown as HomeAssistant;
    const sub = new TemplateSubscription(vi.fn(), vi.fn());
    await sub.subscribe(hass, '{{ 1 }}', { config });
    expect(() => sub.unsubscribe()).not.toThrow();
    await Promise.resolve();
    expect(unsub).toHaveBeenCalledTimes(1);
  });
});
