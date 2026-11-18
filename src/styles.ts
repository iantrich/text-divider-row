import { css } from 'lit';

export const styles = css`
  :host {
    display: block;
  }

  .text-divider {
    display: flex;
    align-items: center;
    gap: var(--text-divider-gap, 1em);
    margin: var(--text-divider-margin, 1em 0);
    min-height: 1.5em;
    color: var(--text-divider-color, var(--secondary-text-color));
  }

  .text-divider::before,
  .text-divider::after {
    content: '';
    flex: 1;
    border-top: var(--text-divider-line-size, 1px) solid var(--text-divider-color, var(--secondary-text-color));
  }

  .text-divider-left::before {
    display: none;
  }

  .text-divider-right::after {
    display: none;
  }

  /* No text or icon: one continuous line, whatever the alignment. */
  .text-divider-empty {
    gap: 0;
  }

  .text-divider-empty::before {
    display: block;
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
    --mdc-icon-size: 1.25em;
  }

  .text-divider-text {
    flex: none;
    font-size: var(--text-divider-font-size, 14px);
    white-space: pre-wrap;
  }
`;
