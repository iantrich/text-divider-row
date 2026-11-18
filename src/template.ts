import type { HomeAssistant } from 'custom-card-helpers';

/** A value is a template if it is a string containing `{{` or `{%`. */
export function isTemplate(value: unknown): value is string {
  return typeof value === 'string' && (value.includes('{{') || value.includes('{%'));
}

interface RenderTemplateMessage {
  result?: unknown;
  error?: unknown;
  level?: unknown;
}

function errorMessage(err: unknown): string {
  let message: string;
  if (err instanceof Error) {
    message = err.message;
  } else if (err && typeof err === 'object' && typeof (err as { message?: unknown }).message === 'string') {
    message = (err as { message: string }).message;
  } else {
    message = String(err);
  }
  // Never show a blank error.
  return message.trim() !== '' ? message : 'Template error';
}

/**
 * HA renders templates to native types. Lists and objects would become "1,2,3" and
 * "[object Object]" with String(), so show them as JSON.
 */
function formatResult(result: unknown): string {
  if (result === undefined || result === null) return '';
  return typeof result === 'object' ? JSON.stringify(result) : String(result);
}

function safeCall(unsub: () => unknown): void {
  try {
    // home-assistant-js-websocket unsubs return a promise that can reject
    // once the connection has closed; nothing useful can be done with that.
    Promise.resolve(unsub()).catch(() => undefined);
  } catch {
    // Same as above, for a synchronous throw.
  }
}

/**
 * One live `render_template` subscription. Each subscribe() or unsubscribe()
 * starts a new generation; anything that arrives for an older generation
 * (results, errors, a late-resolving unsub) is dropped, and a late unsub is called.
 */
export class TemplateSubscription {
  private _generation = 0;
  private _unsub?: () => unknown;

  constructor(
    private readonly _onResult: (value: string) => void,
    private readonly _onError: (message: string) => void,
  ) {}

  public async subscribe(hass: HomeAssistant, template: string, variables: object): Promise<void> {
    this.unsubscribe();
    const generation = this._generation;
    const current = () => generation === this._generation;
    try {
      const unsub = await hass.connection.subscribeMessage<RenderTemplateMessage>(
        (msg) => {
          if (!current()) return;
          if (msg.error !== undefined && msg.error !== null) {
            // WARNING events are advisory; the template still renders.
            if (msg.level === 'WARNING') return;
            this._onError(errorMessage(msg.error));
          } else {
            this._onResult(formatResult(msg.result));
          }
        },
        // report_errors makes HA send `{error, level}` events instead of only logging.
        { type: 'render_template', template, variables, report_errors: true },
      );
      if (current()) {
        this._unsub = unsub;
      } else {
        safeCall(unsub);
      }
    } catch (err) {
      if (current()) this._onError(errorMessage(err));
    }
  }

  public unsubscribe(): void {
    this._generation++;
    const unsub = this._unsub;
    this._unsub = undefined;
    if (unsub) safeCall(unsub);
  }
}
