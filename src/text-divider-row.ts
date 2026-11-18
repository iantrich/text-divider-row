import { LitElement, html, nothing, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { HomeAssistant } from 'custom-card-helpers';
import { TextDividerRowConfig } from './types';
import { normalizeConfig } from './config';
import { handleTap, isInteractive } from './actions';
import { styles } from './styles';
import { CARD_VERSION } from './const';
import './editor';

/* eslint no-console: 0 */
console.info(
  `%c  TEXT-DIVIDER-ROW  \n%c  Version ${CARD_VERSION}     `,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray',
);

@customElement('text-divider-row')
export class TextDividerRow extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;

  @state() private _config?: TextDividerRowConfig;

  public setConfig(config: unknown): void {
    this._config = normalizeConfig(config);
  }

  private _onClick(): void {
    if (this._config) handleTap(this, this.hass, this._config);
  }

  private _onKeydown(ev: KeyboardEvent): void {
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      this._onClick();
    }
  }

  protected render(): TemplateResult | typeof nothing {
    if (!this._config) {
      return nothing;
    }

    const { align, icon, text } = this._config;

    const empty = !icon && text === undefined ? ' text-divider-empty' : '';

    const interactive = isInteractive(this._config);
    const cls = `text-divider text-divider-${align}${empty}${interactive ? ' text-divider-action' : ''}`;

    return html`
      <div
        class="${cls}"
        role="${interactive ? 'button' : nothing}"
        tabindex="${interactive ? '0' : nothing}"
        @click="${this._onClick}"
        @keydown="${this._onKeydown}"
      >
        ${icon ? html`<ha-icon icon="${icon}"></ha-icon>` : nothing}
        ${text !== undefined ? html`<span class="text-divider-text">${text}</span>` : nothing}
      </div>
    `;
  }

  public static async getConfigElement(): Promise<HTMLElement> {
    return document.createElement('text-divider-row-editor');
  }

  public static getStubConfig(): TextDividerRowConfig {
    return { type: 'custom:text-divider-row', text: 'Divider' };
  }

  public getGridOptions(): { columns: 'full'; rows: 1 } {
    return TextDividerRow.getGridOptions();
  }

  public static getGridOptions(): { columns: 'full'; rows: 1 } {
    return { columns: 'full', rows: 1 };
  }

  static styles = styles;
}

window.customCards = window.customCards || [];
if (!window.customCards.some((card) => card.type === 'text-divider-row')) {
  window.customCards.push({
    type: 'text-divider-row',
    name: 'Text Divider Row',
    description: 'A divider line with optional text and icon, usable as an entities row or a card.',
    preview: true,
  });
}
