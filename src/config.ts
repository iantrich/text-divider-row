import type { TextDividerAlign, TextDividerRowConfig } from './types';

const ALIGNMENTS: readonly TextDividerAlign[] = ['left', 'center', 'right'];

export function normalizeConfig(raw: unknown): TextDividerRowConfig {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('Invalid configuration');
  }
  const input = raw as Record<string, unknown>;

  const config: TextDividerRowConfig = {
    type: typeof input.type === 'string' ? input.type : '',
    align: ALIGNMENTS.includes(input.align as TextDividerAlign) ? (input.align as TextDividerAlign) : 'center',
  };

  // Whitespace-only text would draw an invisible gap in the line; treat it as no text.
  if (typeof input.text === 'string' && input.text.trim() !== '') {
    config.text = input.text;
  } else if (typeof input.text === 'number' && Number.isFinite(input.text)) {
    config.text = input.text;
  }

  if (typeof input.icon === 'string' && input.icon !== '') {
    config.icon = input.icon;
  }

  if (typeof input.entity === 'string' && input.entity !== '') {
    config.entity = input.entity;
  }

  if (input.tap_action && typeof input.tap_action === 'object') {
    config.tap_action = input.tap_action as TextDividerRowConfig['tap_action'];
  }

  // card-mod finds its styles on the card element's config; without this a standalone card is never styled.
  if (input.card_mod && typeof input.card_mod === 'object') {
    config.card_mod = input.card_mod as TextDividerRowConfig['card_mod'];
  }

  return config;
}
