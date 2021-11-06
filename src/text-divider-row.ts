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

  protected getClass(): string {
    const allowedValues = ['center', 'left', 'right'];
    if (this._config && this._config.align) {
      if (allowedValues.includes(this._config.align)) {
        return `text-divider text-divider-${this._config.align}`;
      }
    }
    return 'text-divider text-divider-center';
  }

  protected render(): TemplateResult | void {
    if (!this._config) {
      return html``;
    }

    return html`
      <div class="text-divider-container">
        <h2 class="${this.getClass()}">
          <span>${this._config.text}</span>
        </h2>
      </div>
    `;
  }

  static get styles(): CSSResult {
    return css`
      :host {
        display: block;
        position: relative;
        --background: var(--ha-card-background, var(--card-background-color));
        --divider-color: var(--text-divider-color, var(--secondary-text-color));
        --font-size: var(--text-divider-font-size, 14px);
        --line-size: var(--text-divider-line-size, 1px);
      }

      .text-divider {
        width: 100%;
        border-bottom: var(--line-size) solid var(--divider-color);
        line-height: 0;
        margin: 10px 0 20px;
      }

      .text-divider-container {
        margin: var(--text-divider-margin, 1em 0);
      }

      .text-divider-center {
        text-align: center;
      }

      .text-divider-left {
        text-align: left;
      }

      .text-divider-right {
        text-align: right;
      }

      .text-divider span {
        color: var(--divider-color);
        font-size: var(--font-size);
        background: var(--background);
        padding: 1px 1em;
      }
      .text-divider-center span {
        margin: 0px;
      }

      .text-divider-left span {
        margin: 0 0 0 1em;
      }

      .text-divider-right span {
        margin: 0 1em 0 0;
      }
    `;
  }
}
