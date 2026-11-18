import { afterEach } from 'vitest';
import '../src/text-divider-row';

export interface DividerElement extends HTMLElement {
  setConfig(config: unknown): void;
  updateComplete: Promise<boolean>;
}

const mounted: HTMLElement[] = [];

afterEach(() => {
  while (mounted.length) {
    mounted.pop()?.remove();
  }
});

export async function fixture(config: unknown): Promise<DividerElement> {
  const el = document.createElement('text-divider-row') as DividerElement;
  el.setConfig(config);
  document.body.appendChild(el);
  mounted.push(el);
  await el.updateComplete;
  return el;
}
