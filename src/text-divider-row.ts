import { LitElement, html, nothing, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import type { HomeAssistant } from 'custom-card-helpers';
import { TextDividerRowConfig } from './types';
import { normalizeConfig } from './config';
import { handleTap, isInteractive } from './actions';
import { styles } from './styles';
import { isTemplate, TemplateSubscription } from './template';
import { CARD_VERSION } from './const';
import './editor';

/* eslint no-console: 0 */
console.info(
  `%c  TEXT-DIVIDER-ROW  \n%c  Version ${CARD_VERSION}     `,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray',
);

type TemplateField = 'text' | 'icon';
const TEMPLATE_FIELDS: readonly TemplateField[] = ['text', 'icon'];

/** The latest message for a field, tagged with the template it was rendered from. */
interface TemplateOutput {
  template: string;
  value?: string;
  error?: string;
}

/** What render() shows for one field. */
interface Resolved {
  value?: string | number;
  error?: string;
}

@customElement('text-divider-row')
export class TextDividerRow extends LitElement {
  @state() private _config?: TextDividerRowConfig;

  @state() private _outputs: Partial<Record<TemplateField, TemplateOutput>> = {};

  private _hass?: HomeAssistant;

  private _connected = false;

  /** Template string and config each field is currently subscribed with. */
  private _subscribed: Partial<Record<TemplateField, { template: string; config: TextDividerRowConfig }>> = {};

  private _subs: Record<TemplateField, TemplateSubscription> = {
    text: this._subscription('text'),
    icon: this._subscription('icon'),
  };

  /**
   * HA sets `hass` on every state change. It is deliberately not a reactive
   * property: this row only re-renders for config, template output or
   * connection changes. It is kept for tap actions and template subscriptions.
   */
  public get hass(): HomeAssistant | undefined {
    return this._hass;
  }

  public set hass(hass: HomeAssistant | undefined) {
    this._hass = hass;
    this._syncTemplates();
  }

  public setConfig(config: unknown): void {
    this._config = normalizeConfig(config);
    this._syncTemplates();
  }

  public connectedCallback(): void {
    super.connectedCallback();
    this._connected = true;
    this._syncTemplates();
  }

  public disconnectedCallback(): void {
    super.disconnectedCallback();
    this._connected = false;
    this._syncTemplates();
  }

  private _subscription(field: TemplateField): TemplateSubscription {
    return new TemplateSubscription(
      (value) => this._setOutput(field, { value }),
      (error) => this._setOutput(field, { error }),
    );
  }

  private _setOutput(field: TemplateField, output: Omit<TemplateOutput, 'template'>): void {
    const current = this._subscribed[field];
    if (!current) return;
    this._outputs = { ...this._outputs, [field]: { template: current.template, ...output } };
  }

  /**
   * Opens, keeps or closes each field's subscription. Only the template text,
   * the config object, hass presence and connection state matter; a new
   * `hass` object with the same config is a no-op.
   */
  private _syncTemplates(): void {
    const config = this._config;
    for (const field of TEMPLATE_FIELDS) {
      const raw = config?.[field];
      const wanted = config && this._hass && this._connected && isTemplate(raw) ? raw : undefined;
      const current = this._subscribed[field];
      if (current ? current.template === wanted && current.config === config : wanted === undefined) {
        continue;
      }
      this._subs[field].unsubscribe();
      delete this._subscribed[field];
      if (wanted !== undefined && config && this._hass) {
        this._subscribed[field] = { template: wanted, config };
        void this._subs[field].subscribe(this._hass, wanted, { config });
      }
    }
  }

  private _resolve(field: TemplateField): Resolved {
    const raw = this._config?.[field];
    if (!isTemplate(raw)) return { value: raw };
    const output = this._outputs[field];
    if (!output || output.template !== raw) return {};
    if (output.error !== undefined) return { error: output.error };
    return { value: output.value && output.value.trim() !== '' ? output.value : undefined };
  }

  private _onClick(): void {
    if (this._config) handleTap(this, this.hass, this._config);
  }

  private _onKeydown(ev: KeyboardEvent): void {
    if (ev.repeat) return;
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      this._onClick();
    }
  }

  protected render(): TemplateResult | typeof nothing {
    if (!this._config) {
      return nothing;
    }

    const { align } = this._config;
    const resolvedText = this._resolve('text');
    const resolvedIcon = this._resolve('icon');
    const icon = typeof resolvedIcon.value === 'string' ? resolvedIcon.value.trim() : undefined;
    const error = resolvedText.error ?? resolvedIcon.error;
    const text = error ?? resolvedText.value;

    const empty = !icon && text === undefined ? ' text-divider-empty' : '';

    const interactive = isInteractive(this._config);
    const iconName = icon ? icon.slice(icon.indexOf(':') + 1) : undefined;
    const label = interactive && text === undefined && iconName ? iconName : undefined;
    const cls = `text-divider text-divider-${align}${empty}${interactive ? ' text-divider-action' : ''}`;

    return html`
      <div
        class="${cls}"
        role="${interactive ? 'button' : nothing}"
        tabindex="${interactive ? '0' : nothing}"
        aria-label="${label ?? nothing}"
        @click="${this._onClick}"
        @keydown="${this._onKeydown}"
      >
        ${icon ? html`<ha-icon icon="${icon}" aria-hidden="true"></ha-icon>` : nothing}
        ${
          text !== undefined
            ? html`<span class="text-divider-text${error !== undefined ? ' text-divider-error' : ''}">${text}</span>`
            : nothing
        }
      </div>
    `;
  }

  public static async getConfigElement(): Promise<HTMLElement> {
    return document.createElement('text-divider-row-editor');
  }

  public static getStubConfig(): TextDividerRowConfig {
    return { type: 'custom:text-divider-row', text: 'Divider' };
  }

  public getCardSize(): number {
    return 1;
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
