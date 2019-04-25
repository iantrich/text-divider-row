import {
    LitElement,
    html,
    customElement,
    property,
    TemplateResult,
    css,
    CSSResult
} from "lit-element";
import {TextDividerRowConfig} from "./types";

@customElement("text-divider-row")
class TextDividerRow extends LitElement {
    @property() private _config?: TextDividerRowConfig;

    public setConfig(config: TextDividerRowConfig): void {
        if (!config || !config.text) {
            throw new Error("Error in card configuration.");
        }

        this._config = config;
    }

    protected render(): TemplateResult | void {
        if (!this._config) {
            return html``;
        }

        return html`
      <h2 class="text-divider"><span>${this._config.text}</span></h2>
    `;
    }

    static get styles(): CSSResult {
        return css`
        .text-divider {
          margin: 2em 0;
          line-height: 0;
          text-align: center;
        }
        .text-divider span {
          background-color: var(--paper-card-background-color);
          padding: 1em;
          color: var(--secondary-text-color);
        }
        .text-divider:before {
          content: " ";
          display: block;
          border-top: 1px solid var(--secondary-text-color);
          border-bottom: 1px solid var(--paper-card-background-color);
        }
    `;
    }
}
