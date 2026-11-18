import { describe, expect, it } from 'vitest';
import '../src/text-divider-row';
import { CARD_VERSION } from '../src/const';

describe('text-divider-row smoke test', () => {
  it('renders the configured text', async () => {
    const el = document.createElement('text-divider-row') as HTMLElement & {
      setConfig(config: { type: string; text: string }): void;
      updateComplete: Promise<boolean>;
    };
    el.setConfig({ type: 'custom:text-divider-row', text: 'Hi' });
    document.body.appendChild(el);
    await el.updateComplete;

    const span = el.shadowRoot?.querySelector('h2 span');
    expect(span?.textContent).toBe('Hi');
  });

  it('exposes a non-empty card version', () => {
    expect(typeof CARD_VERSION).toBe('string');
    expect(CARD_VERSION.length).toBeGreaterThan(0);
  });
});
