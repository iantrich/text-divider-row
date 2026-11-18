import { LitElement, html, nothing, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { HomeAssistant } from 'custom-card-helpers';
import { TextDividerRowConfig } from './types';

const SCHEMA = [
  { name: 'text', selector: { text: {} } },
  { name: 'icon', selector: { icon: {} } },
  {
    name: 'align',
    default: 'center',
    selector: {
      select: {
        mode: 'dropdown',
        options: [
          { value: 'left', label: 'Left' },
          { value: 'center', label: 'Center' },
          { value: 'right', label: 'Right' },
        ],
      },
    },
  },
  { name: 'entity', selector: { entity: {} } },
  { name: 'tap_action', selector: { ui_action: {} } },
];

const LABELS: Record<string, string> = {
  text: 'Text',
  icon: 'Icon',
  align: 'Alignment',
  entity: 'Entity (optional)',
  tap_action: 'Tap action',
};

@customElement('text-divider-row-editor')
export class TextDividerRowEditor extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;

  @state() private _config?: TextDividerRowConfig;

  public setConfig(config: TextDividerRowConfig): void {
    this._config = config;
  }

  private _computeLabel = (schema: { name: string }): string => LABELS[schema.name] ?? schema.name;

  private _valueChanged(ev: CustomEvent): void {
    ev.stopPropagation();
    const value = (ev.detail?.value ?? {}) as Record<string, unknown>;
    const config: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      if (val === '' || val === undefined) continue;
      config[key] = val;
    }
    config.type = value.type ?? this._config?.type ?? 'custom:text-divider-row';
    this.dispatchEvent(
      new CustomEvent('config-changed', {
        detail: { config },
        bubbles: true,
        composed: true,
      }),
    );
  }

  protected render(): TemplateResult | typeof nothing {
    if (!this._config) {
      return nothing;
    }

    return html`
      <ha-form
        .hass=${this.hass}
        .data=${this._config}
        .schema=${SCHEMA}
        .computeLabel=${this._computeLabel}
        @value-changed=${this._valueChanged}
      ></ha-form>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'text-divider-row-editor': TextDividerRowEditor;
  }
}
