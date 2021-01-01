import { LitElement, html, customElement, property, TemplateResult, css, CSSResult } from 'lit-element';
import { TextDividerRowConfig } from './types';
import { CARD_VERSION } from './const';

/* eslint no-console: 0 */
console.info(
  `%c  TEXT-DIVIDER-ROW  \n%c  Version ${CARD_VERSION}     `,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray',
);

@customElement('text-divider-row')
class TextDividerRow extends LitElement {
  @property() private _config?: TextDividerRowConfig;

  public setConfig(config: TextDividerRowConfig): void {
    if (!config || !config.text) {
      throw new Error('Error in card configuration.');
    }

    this._config = config;
  }

  protected getMargin(): string {
    // Explicilty check for undefined as 0 is a valid margin CSS value
    if (!this._config || this._config.margin === undefined) {
      return '1em 0';
    } else {
      return `${this._config.margin}`;
    }
  }

  protected render(): TemplateResult | void {
    if (!this._config) {
      return html``;
    }

    return html`
      <h2 class="text-divider" style="margin: ${this.getMargin()};"><span>${this._config.text}</span></h2>
    `;
  }

  static get styles(): CSSResult {
    return css`
      :host {
        display: block;
        position: relative;
        --divider-color: var(--text-divider-color, var(--secondary-text-color));
        --font-size: var(--text-divider-font-size, 14px);
        --line-size: var(--text-divider-line-size, 1px);
      }
      .text-divider {
        line-height: 0;
        text-align: center;
        white-space: nowrap;
        display: flex;
        align-items: center;
      }
      .text-divider span {
        padding: 1em;
        color: var(--divider-color);
        font-size: var(--font-size);
      }
      .text-divider:before,
      .text-divider:after {
        content: '';
        background: var(--divider-color);
        display: block;
        height: var(--line-size);
        width: 100%;
      }
    `;
  }
}
