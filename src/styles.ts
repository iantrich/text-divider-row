import { css } from 'lit';

export const styles = css`
  :host {
    display: block;
  }

  .text-divider {
    --_gap: var(--text-divider-gap, 1em);
    display: flex;
    align-items: center;
    margin: var(--text-divider-margin, 0.5em 0);
    /* Same as the text's line height, so a divider with no text is as tall as one with text. */
    min-height: calc(var(--text-divider-font-size, 14px) * 1.6);
    color: var(--text-divider-color, var(--secondary-text-color));
  }

  /*
   * Each line includes its gap to the text; clip-path hides the gap part of the border. Lines shrink
   * far faster than the text, so in a narrow card the lines go first, then the gaps, and only then
   * does the text wrap. A short label keeps its lines as long as there is room for them.
   */
  .text-divider::before,
  .text-divider::after {
    content: '';
    flex: 1 1000 var(--_gap);
    min-width: 0;
    border-top: var(--text-divider-line-size, 1px) solid var(--text-divider-color, var(--secondary-text-color));
  }

  .text-divider::before {
    clip-path: inset(-1em var(--_gap) -1em 0);
  }

  .text-divider::after {
    clip-path: inset(-1em 0 -1em var(--_gap));
  }

  .text-divider-left::before,
  .text-divider-right::after {
    flex: 0 1000 calc(1em + var(--_gap));
  }

  /* The icon and the text are spaced like the text and a line. */
  ha-icon + .text-divider-text {
    margin-inline-start: var(--_gap);
  }

  /* No text or icon: one continuous line, whatever the alignment. */
  .text-divider-empty::before {
    flex: 1;
    clip-path: none;
  }

  .text-divider-empty::after {
    display: none;
  }

  .text-divider-action {
    cursor: pointer;
  }

  .text-divider-action:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }

  ha-icon {
    flex: none;
    --mdc-icon-size: calc(var(--text-divider-font-size, 14px) * 1.25);
  }

  .text-divider-text {
    flex: 0 1 auto;
    min-width: 0;
    overflow-wrap: anywhere;
    font-size: var(--text-divider-font-size, 14px);
    line-height: 1.6;
    font-weight: bold;
    white-space: pre-wrap;
  }

  .text-divider-error {
    color: var(--error-color, #db4437);
  }
`;
