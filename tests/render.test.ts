import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('custom-card-helpers', () => ({ handleAction: vi.fn() }));

import { handleAction } from 'custom-card-helpers';
import { styles } from '../src/styles';
import { normalizeConfig } from '../src/config';
import { fixture, type DividerElement } from './fixture';

const q = (el: HTMLElement, sel: string) => el.shadowRoot?.querySelector(sel) ?? null;

describe('text-divider-row render', () => {
  it('preserves whitespace in text', async () => {
    const el = await fixture({ type: 't', text: 'A  B' });
    expect(q(el, '.text-divider-text')?.textContent).toBe('A  B');
  });

  it('renders no text element for empty string', async () => {
    const el = await fixture({ type: 't', text: '' });
    expect(q(el, '.text-divider')).not.toBeNull();
    expect(q(el, '.text-divider-text')).toBeNull();
  });

  it('renders no text element for null', async () => {
    const el = await fixture({ type: 't', text: null });
    expect(q(el, '.text-divider-text')).toBeNull();
  });

  it('renders numeric text as a string', async () => {
    const el = await fixture({ type: 't', text: 123 });
    expect(q(el, '.text-divider-text')?.textContent).toBe('123');
  });

  it('renders a bare 1.x config centered', async () => {
    const el = await fixture({ type: 'custom:text-divider-row', text: 'Hi' });
    expect(q(el, '.text-divider.text-divider-center')).not.toBeNull();
  });

  it('falls back to center for a bogus align', async () => {
    const el = await fixture({ type: 't', text: 'Hi', align: 'bogus' });
    expect(q(el, '.text-divider.text-divider-center')).not.toBeNull();
  });

  it('renders icon without text and without a stray text node', async () => {
    const el = await fixture({ type: 't', icon: 'mdi:sofa', align: 'left' });
    const container = q(el, '.text-divider') as HTMLElement;
    expect(container.classList.contains('text-divider-left')).toBe(true);
    const icons = el.shadowRoot!.querySelectorAll('ha-icon');
    expect(icons.length).toBe(1);
    expect(icons[0].getAttribute('icon')).toBe('mdi:sofa');
    expect(q(el, '.text-divider-text')).toBeNull();
    expect(container.children.length).toBe(1);
    expect(container.querySelector('.text-divider-text')).toBeNull();
    const strayText = Array.from(container.childNodes).filter(
      (n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? '').trim() !== '',
    );
    expect(strayText).toEqual([]);
    expect(container.classList.contains('text-divider-empty')).toBe(false);
  });

  it('marks the container empty only when there is no text and no icon', async () => {
    const empty = await fixture({ type: 't' });
    expect(q(empty, '.text-divider')?.classList.contains('text-divider-empty')).toBe(true);
    const emptyLeft = await fixture({ type: 't', align: 'left', text: '' });
    expect(q(emptyLeft, '.text-divider')?.classList.contains('text-divider-empty')).toBe(true);
    const withText = await fixture({ type: 't', text: 'Hi' });
    expect(q(withText, '.text-divider')?.classList.contains('text-divider-empty')).toBe(false);
    const withIcon = await fixture({ type: 't', icon: 'mdi:sofa' });
    expect(q(withIcon, '.text-divider')?.classList.contains('text-divider-empty')).toBe(false);
  });

  it('renders an empty centered divider with only a type', async () => {
    const el = await fixture({ type: 't' });
    expect(q(el, '.text-divider.text-divider-center')).not.toBeNull();
    expect(q(el, '.text-divider-text')).toBeNull();
    expect(q(el, 'ha-icon')).toBeNull();
  });
});

describe('styles', () => {
  it('uses pre-wrap, gap variable and no background', () => {
    const css = styles.cssText;
    expect(css).toContain('white-space: pre-wrap');
    expect(css).toContain('--text-divider-gap');
    expect(css).not.toContain('background');
    expect(css).toContain('.text-divider-empty');
  });
});

describe('tap_action interactivity', () => {
  beforeEach(() => vi.mocked(handleAction).mockClear());

  const tap = { action: 'navigate', navigation_path: '/x' };

  async function withHass(config: unknown) {
    const el = await fixture(config);
    (el as unknown as { hass: unknown }).hass = { user: { id: 'u' } };
    await el.updateComplete;
    return el;
  }

  it('is a focusable button when tap_action is set', async () => {
    const el = await fixture({ type: 't', text: 'Hi', tap_action: tap });
    const c = q(el, '.text-divider')!;
    expect(c.getAttribute('role')).toBe('button');
    expect(c.getAttribute('tabindex')).toBe('0');
  });

  it('click, Enter and Space each dispatch once; Space prevents default', async () => {
    const el = await withHass({ type: 't', text: 'Hi', tap_action: tap });
    const c = q(el, '.text-divider') as HTMLElement;
    c.click();
    expect(handleAction).toHaveBeenCalledTimes(1);
    c.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    expect(handleAction).toHaveBeenCalledTimes(2);
    const space = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
    c.dispatchEvent(space);
    expect(handleAction).toHaveBeenCalledTimes(3);
    expect(space.defaultPrevented).toBe(true);
    c.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true }));
    expect(handleAction).toHaveBeenCalledTimes(3);
  });

  it('is inert without tap_action or with action none', async () => {
    for (const cfg of [{ type: 't' }, { type: 't', tap_action: { action: 'none' } }]) {
      const el = await withHass(cfg);
      const c = q(el, '.text-divider') as HTMLElement;
      expect(c.hasAttribute('role')).toBe(false);
      expect(c.hasAttribute('tabindex')).toBe(false);
      expect(c.classList.contains('text-divider-action')).toBe(false);
      c.click();
    }
    expect(handleAction).not.toHaveBeenCalled();
  });

  it('does not throw when clicked before hass is set', async () => {
    const el = await fixture({ type: 't', tap_action: tap });
    expect(() => (q(el, '.text-divider') as HTMLElement).click()).not.toThrow();
    expect(handleAction).not.toHaveBeenCalled();
  });
});

describe('templates', () => {
  type Callback = (msg: unknown) => void;
  interface Sub {
    callback: Callback;
    message: { type: string; template: string; variables: { config: unknown } };
    unsub: ReturnType<typeof vi.fn>;
    resolve: () => void;
  }

  interface TemplatedElement extends DividerElement {
    hass?: unknown;
  }

  /** Fake hass; with `manual`, subscribeMessage stays pending until `resolve()`. */
  function fakeHass(opts: { manual?: boolean; reject?: unknown } = {}) {
    const subs: Sub[] = [];
    const subscribeMessage = vi.fn((callback: Callback, message: Sub['message']) => {
      const unsub = vi.fn();
      let resolve!: () => void;
      const p = new Promise<() => void>((res, rej) => {
        resolve = () => res(unsub);
        if (opts.reject !== undefined) rej(opts.reject);
      });
      subs.push({ callback, message, unsub, resolve });
      if (!opts.manual) resolve();
      return p;
    });
    const make = () => ({ connection: { subscribeMessage }, states: {} });
    return { hass: make(), make, subscribeMessage, subs };
  }

  const flush = async (el: DividerElement) => {
    for (let i = 0; i < 3; i++) await Promise.resolve();
    await el.updateComplete;
  };

  const mountedHere: HTMLElement[] = [];
  afterEach(() => {
    while (mountedHere.length) mountedHere.pop()?.remove();
  });

  async function mount(config: unknown, hass?: unknown): Promise<TemplatedElement> {
    const el = document.createElement('text-divider-row') as TemplatedElement;
    el.setConfig(config);
    if (hass) el.hass = hass;
    document.body.appendChild(el);
    mountedHere.push(el);
    await flush(el);
    return el;
  }

  const textOf = (el: HTMLElement) => q(el, '.text-divider-text')?.textContent ?? null;

  it('never subscribes for a non-template text', async () => {
    const f = fakeHass();
    const el = await mount({ type: 't', text: 'plain', icon: 'mdi:sofa' }, f.hass);
    el.hass = f.make();
    await flush(el);
    expect(f.subscribeMessage).not.toHaveBeenCalled();
    expect(textOf(el)).toBe('plain');
  });

  it('renders the template result, not the raw template', async () => {
    const f = fakeHass();
    const el = await mount({ type: 't', text: '{{ "Hello" }}' }, f.hass);
    expect(f.subscribeMessage).toHaveBeenCalledTimes(1);
    expect(textOf(el)).toBeNull();
    expect(q(el, '.text-divider')?.classList.contains('text-divider-empty')).toBe(true);
    f.subs[0].callback({ result: 'Hello' });
    await flush(el);
    expect(textOf(el)).toBe('Hello');
    expect(q(el, '.text-divider')?.classList.contains('text-divider-empty')).toBe(false);
  });

  it('passes the normalized config as template variables', async () => {
    const f = fakeHass();
    const raw = { type: 't', text: '{{ config.align }}', bogus: 1 };
    await mount(raw, f.hass);
    expect(f.subs[0].message).toEqual({
      type: 'render_template',
      template: '{{ config.align }}',
      variables: { config: normalizeConfig(raw) },
    });
  });

  it('renders a plain line for an empty or whitespace-only result', async () => {
    const f = fakeHass();
    const el = await mount({ type: 't', text: '{{ "" }}' }, f.hass);
    for (const result of ['', '   \n ']) {
      f.subs[0].callback({ result });
      await flush(el);
      expect(q(el, '.text-divider-text')).toBeNull();
      expect(q(el, '.text-divider')?.classList.contains('text-divider-empty')).toBe(true);
      expect(el.shadowRoot!.textContent).not.toContain('{{');
      expect(el.shadowRoot!.textContent).not.toContain('undefined');
    }
  });

  it('shows HA error text with the error class', async () => {
    const f = fakeHass();
    const el = await mount({ type: 't', text: '{{ x' }, f.hass);
    f.subs[0].callback({ error: 'bad' });
    await flush(el);
    const span = q(el, '.text-divider-text');
    expect(span?.textContent).toBe('bad');
    expect(span?.classList.contains('text-divider-error')).toBe(true);
    f.subs[0].callback({ result: 'ok' });
    await flush(el);
    expect(textOf(el)).toBe('ok');
    expect(q(el, '.text-divider-text')?.classList.contains('text-divider-error')).toBe(false);
  });

  it('shows the rejection message when subscribing fails', async () => {
    const f = fakeHass({ reject: { code: 'template_error', message: 'boom' } });
    const el = await mount({ type: 't', text: '{{ x' }, f.hass);
    await flush(el);
    expect(q(el, '.text-divider-text.text-divider-error')?.textContent).toBe('boom');
  });

  it('styles the error with the theme error color and no background', () => {
    expect(styles.cssText).toContain('.text-divider-error');
    expect(styles.cssText).toContain('var(--error-color, #db4437)');
    expect(styles.cssText).not.toContain('background');
  });

  it('does not resubscribe or re-render when only hass changes', async () => {
    const f = fakeHass();
    const el = await mount({ type: 't', text: '{{ 1 }}' }, f.hass);
    f.subs[0].callback({ result: '1' });
    await flush(el);
    const renderSpy = vi.spyOn(el as unknown as { render: () => unknown }, 'render');
    for (let i = 0; i < 5; i++) {
      el.hass = f.make();
      await flush(el);
    }
    expect(f.subscribeMessage).toHaveBeenCalledTimes(1);
    expect(f.subs[0].unsub).not.toHaveBeenCalled();
    expect(renderSpy).not.toHaveBeenCalled();
    expect(textOf(el)).toBe('1');
    f.subs[0].callback({ result: '2' });
    await flush(el);
    expect(renderSpy).toHaveBeenCalledTimes(1);
    expect(textOf(el)).toBe('2');
  });

  it('tap actions use the latest hass even though hass does not re-render', async () => {
    vi.mocked(handleAction).mockClear();
    const f = fakeHass();
    const el = await mount(
      { type: 't', text: 'Hi', tap_action: { action: 'navigate', navigation_path: '/x' } },
      f.hass,
    );
    const latest = f.make();
    el.hass = latest;
    (q(el, '.text-divider') as HTMLElement).click();
    expect(vi.mocked(handleAction).mock.calls[0][1]).toBe(latest);
  });

  it('subscribes when hass arrives after setConfig', async () => {
    const f = fakeHass();
    const el = await mount({ type: 't', text: '{{ 1 }}' });
    expect(f.subscribeMessage).not.toHaveBeenCalled();
    el.hass = f.hass;
    await flush(el);
    expect(f.subscribeMessage).toHaveBeenCalledTimes(1);
    f.subs[0].callback({ result: 'one' });
    await flush(el);
    expect(textOf(el)).toBe('one');
  });

  it('setConfig with a different template swaps subscriptions and ignores stale results', async () => {
    const f = fakeHass();
    const el = await mount({ type: 't', text: '{{ "a" }}' }, f.hass);
    f.subs[0].callback({ result: 'A' });
    await flush(el);
    el.setConfig({ type: 't', text: '{{ "b" }}' });
    await flush(el);
    expect(f.subs[0].unsub).toHaveBeenCalledTimes(1);
    expect(f.subscribeMessage).toHaveBeenCalledTimes(2);
    expect(f.subs[1].message.template).toBe('{{ "b" }}');
    expect(textOf(el)).toBeNull();
    f.subs[1].callback({ result: 'B' });
    await flush(el);
    expect(textOf(el)).toBe('B');
    f.subs[0].callback({ result: 'STALE' });
    await flush(el);
    expect(textOf(el)).toBe('B');
  });

  it('switching to a plain value unsubscribes and renders it directly', async () => {
    const f = fakeHass();
    const el = await mount({ type: 't', text: '{{ "a" }}' }, f.hass);
    el.setConfig({ type: 't', text: 'plain' });
    await flush(el);
    expect(f.subs[0].unsub).toHaveBeenCalledTimes(1);
    expect(f.subscribeMessage).toHaveBeenCalledTimes(1);
    expect(textOf(el)).toBe('plain');
  });

  it('a late result from a subscription pending during setConfig is ignored', async () => {
    const f = fakeHass({ manual: true });
    const el = await mount({ type: 't', text: '{{ "a" }}' }, f.hass);
    el.setConfig({ type: 't', text: '{{ "b" }}' });
    await flush(el);
    f.subs[1].resolve();
    f.subs[0].resolve();
    await flush(el);
    expect(f.subs[0].unsub).toHaveBeenCalledTimes(1);
    expect(f.subs[1].unsub).not.toHaveBeenCalled();
    f.subs[0].callback({ result: 'STALE' });
    await flush(el);
    expect(textOf(el)).toBeNull();
    f.subs[1].callback({ result: 'B' });
    await flush(el);
    expect(textOf(el)).toBe('B');
  });

  it('unsubscribes on disconnect and resubscribes on reconnect', async () => {
    const f = fakeHass();
    const el = await mount({ type: 't', text: '{{ 1 }}' }, f.hass);
    f.subs[0].callback({ result: 'one' });
    await flush(el);
    el.remove();
    expect(f.subs[0].unsub).toHaveBeenCalledTimes(1);
    const renderSpy = vi.spyOn(el as unknown as { render: () => unknown }, 'render');
    f.subs[0].callback({ result: 'ghost' });
    await flush(el);
    expect(renderSpy).not.toHaveBeenCalled();
    document.body.appendChild(el);
    mountedHere.push(el);
    await flush(el);
    expect(f.subscribeMessage).toHaveBeenCalledTimes(2);
    expect(textOf(el)).toBe('one');
    f.subs[1].callback({ result: 'two' });
    await flush(el);
    expect(textOf(el)).toBe('two');
  });

  it('calls the late unsub when disconnected while subscribing', async () => {
    const f = fakeHass({ manual: true });
    const el = await mount({ type: 't', text: '{{ 1 }}' }, f.hass);
    el.remove();
    f.subs[0].resolve();
    await flush(el);
    expect(f.subs[0].unsub).toHaveBeenCalledTimes(1);
  });

  it('a template icon sets the ha-icon icon; an empty result means no icon', async () => {
    const f = fakeHass();
    const el = await mount({ type: 't', icon: '{{ "mdi:sofa" }}' }, f.hass);
    expect(q(el, 'ha-icon')).toBeNull();
    f.subs[0].callback({ result: 'mdi:sofa' });
    await flush(el);
    expect(q(el, 'ha-icon')?.getAttribute('icon')).toBe('mdi:sofa');
    f.subs[0].callback({ result: ' ' });
    await flush(el);
    expect(q(el, 'ha-icon')).toBeNull();
    expect(q(el, '.text-divider')?.classList.contains('text-divider-empty')).toBe(true);
  });

  it('subscribes text and icon independently', async () => {
    const f = fakeHass();
    const el = await mount({ type: 't', text: '{{ "t" }}', icon: '{{ "i" }}' }, f.hass);
    expect(f.subscribeMessage).toHaveBeenCalledTimes(2);
    const textSub = f.subs.find((s) => s.message.template === '{{ "t" }}')!;
    const iconSub = f.subs.find((s) => s.message.template === '{{ "i" }}')!;
    textSub.callback({ result: 'Text' });
    iconSub.callback({ result: 'mdi:x' });
    await flush(el);
    expect(textOf(el)).toBe('Text');
    expect(q(el, 'ha-icon')?.getAttribute('icon')).toBe('mdi:x');
    el.remove();
    expect(textSub.unsub).toHaveBeenCalledTimes(1);
    expect(iconSub.unsub).toHaveBeenCalledTimes(1);
  });
});
