import { describe, expect, it } from 'vitest';
import { CARD_VERSION } from '../src/const';
import { fixture } from './fixture';

describe('text-divider-row smoke test', () => {
  it('renders the configured text', async () => {
    const el = await fixture({ type: 'custom:text-divider-row', text: 'Hi' });

    const span = el.shadowRoot?.querySelector('.text-divider-text');
    expect(span?.textContent).toBe('Hi');
  });

  it('exposes a non-empty card version', () => {
    expect(typeof CARD_VERSION).toBe('string');
    expect(CARD_VERSION.length).toBeGreaterThan(0);
  });
});
