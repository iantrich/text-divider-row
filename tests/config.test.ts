import { describe, expect, it } from 'vitest';
import { normalizeConfig } from '../src/config';

describe('normalizeConfig', () => {
  it('throws on undefined', () => {
    expect(() => normalizeConfig(undefined)).toThrow('Invalid configuration');
  });

  it('throws on a non-object', () => {
    expect(() => normalizeConfig('x')).toThrow('Invalid configuration');
  });

  it('defaults align to center', () => {
    expect(normalizeConfig({ type: 't' }).align).toBe('center');
  });

  it('falls back to center for an invalid align', () => {
    expect(normalizeConfig({ type: 't', align: 'bogus' }).align).toBe('center');
  });

  it('keeps a valid align', () => {
    expect(normalizeConfig({ type: 't', align: 'left' }).align).toBe('left');
  });

  it('keeps an object card_mod (card-mod reads it from the card element) and drops other values', () => {
    const cardMod = { style: ':host { color: red; }' };
    expect(normalizeConfig({ type: 't', card_mod: cardMod }).card_mod).toBe(cardMod);
    expect(normalizeConfig({ type: 't', card_mod: 'x' }).card_mod).toBeUndefined();
    expect(normalizeConfig({ type: 't', card_mod: null }).card_mod).toBeUndefined();
    expect(normalizeConfig({ type: 't' }).card_mod).toBeUndefined();
  });

  it('treats whitespace-only text as no text but keeps padded text', () => {
    expect(normalizeConfig({ type: 't', text: ' ' }).text).toBeUndefined();
    expect(normalizeConfig({ type: 't', text: ' \t\n ' }).text).toBeUndefined();
    expect(normalizeConfig({ type: 't', text: '  padded  ' }).text).toBe('  padded  ');
  });

  it('coerces empty and null text to undefined', () => {
    expect(normalizeConfig({ type: 't', text: '' }).text).toBeUndefined();
    expect(normalizeConfig({ type: 't', text: null }).text).toBeUndefined();
  });
});

describe('normalizeConfig entity', () => {
  it('keeps a non-empty string entity', () => {
    expect(normalizeConfig({ type: 't', entity: 'light.a' }).entity).toBe('light.a');
  });

  it.each([
    ['empty string', ''],
    ['number', 5],
    ['null', null],
  ])('drops %s', (_n, v) => {
    expect('entity' in normalizeConfig({ type: 't', entity: v })).toBe(false);
  });
});
