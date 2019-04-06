var LitElement =
  LitElement ||
  Object.getPrototypeOf(customElements.get("home-assistant-main"));
var html = LitElement.prototype.html;

class TextDividerRow extends LitElement {
  static get properties() {
    return {
      _config: {}
    };
  }

  setConfig(config) {
    if (!config || !config.text) {
      throw new Error("Error in card configuration.");
    }

    this._config = config;
  }

  render() {
    if (!this._config) {
      return html``;
    }

    return html`
      ${this.renderStyle()}
      <h2 class="text-divider"><span>${this._config.text}</span></h2>
    `;
  }

  renderStyle() {
    return html`
      <style>
        .text-divider {
          margin: 2em 0;
          line-height: 0;
          text-align: center;
        }
        .text-divider span {
          background-color: var(--card-background-color);
          padding: 1em;
          color: var(--secondary-text-color);
        }
        .text-divider:before {
          content: " ";
          display: block;
          border-top: 1px solid var(--secondary-text-color);
          border-bottom: 1px solid #f7f7f7;
        }
      </style>
    `;
  }
}

customElements.define("text-divider-row", TextDividerRow);
