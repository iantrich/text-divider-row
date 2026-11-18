import { LitElement, html, nothing, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { TextDividerRowConfig } from './types';
import { normalizeConfig } from './config';
import { styles } from './styles';
import { CARD_VERSION } from './const';

/* eslint no-console: 0 */
console.info(
  `%c  TEXT-DIVIDER-ROW  \n%c  Version ${CARD_VERSION}     `,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray',
);

@customElement('text-divider-row')
export class TextDividerRow extends LitElement {
  @state() private _config?: TextDividerRowConfig;

  public setConfig(config: unknown): void {
    this._config = normalizeConfig(config);
  }

  protected render(): TemplateResult | typeof nothing {
    if (!this._config) {
      return nothing;
    }

    const { align, icon, text } = this._config;

    const empty = !icon && text === undefined ? ' text-divider-empty' : '';

    return html`
      <div class="${`text-divider text-divider-${align}${empty}`}">
        ${icon ? html`<ha-icon icon="${icon}"></ha-icon>` : nothing}
        ${text !== undefined ? html`<span class="text-divider-text">${text}</span>` : nothing}
      </div>
    `;
  }

  static styles = styles;
}
