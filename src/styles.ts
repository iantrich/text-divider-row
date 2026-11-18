import { css } from 'lit';

export const styles = css`
  :host {
    display: block;
    container-type: inline-size;
  }

  .text-divider {
    display: flex;
    align-items: center;
    gap: var(--text-divider-gap, 1em);
    margin: var(--text-divider-margin, 0.5em 0);
    min-height: 1.5em;
    color: var(--text-divider-color, var(--secondary-text-color));
  }

  .text-divider::before,
  .text-divider::after {
    content: '';
    flex: 1;
    min-width: 1em;
    border-top: var(--text-divider-line-size, 1px) solid var(--text-divider-color, var(--secondary-text-color));
  }

  .text-divider-left::before,
  .text-divider-right::after {
    flex: 0 0 1em;
  }

  /* No text or icon: one continuous line, whatever the alignment. */
  .text-divider-empty {
    gap: 0;
  }

  .text-divider-empty::before {
    display: block;
    flex: 1;
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
    font-weight: bold;
    white-space: pre-wrap;
  }

  .text-divider-error {
    color: var(--error-color, #db4437);
  }

  /*
   * Very narrow containers (a few columns side by side): the lines and gaps would reserve more
   * room than the text gets, so drop the lines and let the text use the width. An empty divider
   * has no text to protect and keeps its one line.
   */
  @container (max-width: 11em) {
    .text-divider:not(.text-divider-empty)::before,
    .text-divider:not(.text-divider-empty)::after {
      display: none;
    }

    .text-divider-left {
      justify-content: flex-start;
    }

    .text-divider-center {
      justify-content: center;
    }

    .text-divider-right {
      justify-content: flex-end;
    }
  }
`;
