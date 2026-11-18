import { afterEach, describe, expect, it } from 'vitest';
import { TextDividerRow } from '../src/text-divider-row';
import type { TextDividerRowEditor } from '../src/editor';
import type { TextDividerRowConfig } from '../src/types';

const mounted: HTMLElement[] = [];
afterEach(() => {
  while (mounted.length) mounted.pop()?.remove();
});

async function editorFixture(config: TextDividerRowConfig): Promise<TextDividerRowEditor> {
  const el = (await TextDividerRow.getConfigElement()) as TextDividerRowEditor;
  el.setConfig(config);
  document.body.appendChild(el);
  mounted.push(el);
  await el.updateComplete;
  return el;
}

interface FormEl {
  schema: { name: string; selector: Record<string, unknown> }[];
  data: Record<string, unknown>;
  hass: unknown;
  computeLabel: (s: { name: string }) => string;
  dispatchEvent(e: Event): boolean;
}

const form = (el: HTMLElement) => el.shadowRoot?.querySelector('ha-form') as unknown as FormEl;

describe('card registration', () => {
  it('returns the stub config', () => {
    expect(TextDividerRow.getStubConfig()).toEqual({ type: 'custom:text-divider-row', text: 'Divider' });
  });

  it('returns grid options', () => {
    expect(TextDividerRow.getGridOptions()).toEqual({ columns: 'full', rows: 1 });
  });

  it('registers in window.customCards once', () => {
    const entries = (window.customCards ?? []).filter((c) => c.type === 'text-divider-row');
    expect(entries).toHaveLength(1);
    expect(entries[0].name).toBeTruthy();
    expect(entries[0].preview).toBe(true);
  });

  it('getConfigElement creates the editor element', async () => {
    const el = await TextDividerRow.getConfigElement();
    expect(el.tagName.toLowerCase()).toBe('text-divider-row-editor');
  });
});

describe('text-divider-row-editor', () => {
  it('renders ha-form with the expected schema', async () => {
    const el = await editorFixture({ type: 'custom:text-divider-row', text: 'Hi' });
    const f = form(el);
    expect(f).not.toBeNull();
    expect(f.schema.map((s) => s.name)).toEqual(['text', 'icon', 'align', 'entity', 'tap_action']);
    expect(f.schema.map((s) => Object.keys(s.selector)[0])).toEqual(['text', 'icon', 'select', 'entity', 'ui_action']);
    const align = f.schema[2] as unknown as {
      default: string;
      selector: { select: { options: { value: string }[] } };
    };
    expect(align.selector.select.options.map((o) => o.value)).toEqual(['left', 'center', 'right']);
    expect(align.default).toBe('center');
    expect(f.data).toEqual({ type: 'custom:text-divider-row', text: 'Hi' });
    expect(f.computeLabel({ name: 'tap_action' })).not.toBe('tap_action');
  });

  it('passes hass to the form', async () => {
    const el = await editorFixture({ type: 't' });
    const hass = { states: {} };
    (el as unknown as { hass: unknown }).hass = hass;
    await el.updateComplete;
    expect(form(el).hass).toBe(hass);
  });

  it('fires config-changed on value-changed', async () => {
    const el = await editorFixture({ type: 'custom:text-divider-row', text: 'Old' });
    const events: CustomEvent[] = [];
    el.addEventListener('config-changed', (e) => events.push(e as CustomEvent));
    form(el).dispatchEvent(
      new CustomEvent('value-changed', {
        detail: { value: { type: 'custom:text-divider-row', text: 'New' } },
      }),
    );
    expect(events).toHaveLength(1);
    expect(events[0].detail.config.text).toBe('New');
    expect(events[0].bubbles).toBe(true);
    expect(events[0].composed).toBe(true);
  });

  it('drops empty values but keeps type', async () => {
    const el = await editorFixture({ type: 'custom:text-divider-row', text: 'Old' });
    let config: Record<string, unknown> = {};
    el.addEventListener('config-changed', (e) => (config = (e as CustomEvent).detail.config));
    form(el).dispatchEvent(
      new CustomEvent('value-changed', {
        detail: { value: { type: 'custom:text-divider-row', text: '', icon: '', align: undefined } },
      }),
    );
    expect(config).toEqual({ type: 'custom:text-divider-row' });
  });
});
