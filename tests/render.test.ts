import { describe, expect, it } from 'vitest';
import { styles } from '../src/styles';
import { fixture } from './fixture';

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
