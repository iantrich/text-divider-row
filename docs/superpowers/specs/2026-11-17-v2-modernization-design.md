# text-divider-row 2.0.0: modernization design

Date: 2026-11-17. Status: approved (with custom-card-helpers for actions; #38/#39 closed after upgrade).

## Intent and why

The card has not had a real refresh since 2020. The stack is old (lit-element 2, TypeScript 3.9, Rollup 1, ESLint 6, Prettier 1), 14 issues are open, and the core rendering trick causes several of the bugs. 2.0.0 modernizes the card, keeps existing configs working, and closes the reported bugs and requests. The card must work both as an entities-card row and as a standalone dashboard card.

## Goals

- Rebuild on Lit 3, TypeScript 5, Rollup 4 and current ESLint/Prettier. Keep the single `dist/text-divider-row.js` output and the existing HACS and release workflow.
- One custom element, `custom:text-divider-row`, usable as a row and as a card. Existing configs (`text`, `align`, theme variables) keep working unchanged.
- Close the open issues listed below.
- Fix the version drift (`CARD_VERSION` 1.4.1 vs `package.json` 1.4.0) by having one source of truth. Ship as 2.0.0.

## Non-goals

- No second element type (`text-divider-card`). The only new runtime dependency is `custom-card-helpers` (the maintainer's own library) for action handling; no others.
- No styling options beyond the theme variables below. Heavier styling stays with card-mod.
- No hold/double-tap actions. Only `tap_action`.

## Anti-goals (a failure even if it technically works)

- Breaking an existing user's YAML without a documented migration.
- Shipping templates in a way that leaks websocket subscriptions or breaks the card when `hass` is unavailable.

## Constraints

- Must render inside an entities card and standalone. HA calls `setConfig` and sets `hass` in both cases.
- Shipped as a single ES module bundle that bundles its own Lit.
- The current markup is `<h2 class="text-divider ...">` with a `<span>`. card-mod users target it (see #23), so changing markup is a visible breaking change. See Migration.

## Approaches considered

- **A. One element for row and card (chosen).** Least code, one name for users, one entry point to test. Add the card hooks (`getGridOptions`, `getStubConfig`, `getConfigElement`) and register in `window.customCards`.
- **B. Separate row and card elements sharing a renderer.** Cleaner separation, but two types for users and two entry points to test, for no feature that needs it.
- **C. Plain web component without Lit.** Smaller bundle, but diverges from what most HA cards use and loses editor ergonomics.

## Design

### Config

```yaml
type: custom:text-divider-row
text: Living room          # optional (#42); supports templates
icon: mdi:sofa             # optional (#14); supports templates
align: center              # left | center | right (default center)
tap_action:                # optional (#24)
  action: navigate
  navigation_path: /lovelace/living-room
```

- `setConfig` no longer requires `text`. It requires an object and rejects an invalid `align` by falling back to `center`, as today. A config with neither `text` nor `icon` renders a plain line (#42).
- `tap_action.action` supports `navigate`, `url`, `more-info`, `toggle`, `perform-action` (and the older `call-service` as an alias) and `none`. Actions are dispatched with `handleAction` from `custom-card-helpers`. The builder must confirm the installed version supports `perform-action` (renamed from `call-service` in HA 2024.8) and, if it does not, release a fix to that library first or alias the action in the card. When `tap_action` is set the divider gets pointer cursor, keyboard focus and Enter/Space activation.

### Layout (fixes #21, #32, #20, #8, #38, #11)

Replace the masked-border trick with flex: `[line] [icon text] [line]` centered vertically. The lines are `::before`/`::after` pseudo elements. For `left` and `right` alignment the line on the aligned side is removed or shortened to a fixed stub so the text sits at the edge. There is no background on the text, so transparent themes work and nothing needs overriding. Row height is determined by one shared line height, so consecutive dividers match. `white-space: pre-wrap` on the text keeps repeated spaces (#30).

Theme variables kept: `text-divider-color`, `text-divider-font-size`, `text-divider-line-size`, `text-divider-margin`. Added: `text-divider-gap` (space between text and lines). The unused `--background` variable is removed.

### Templates (#27)

A value is a template if it contains `{{` or `{%`. For `text` and `icon`, when a template is present the card subscribes via `hass.connection.subscribeMessage` with `{ type: "render_template", template, variables: { config } }` and re-renders on each result. It unsubscribes in `disconnectedCallback` and resubscribes in `connectedCallback` and whenever the template text changes. If `hass` is not set yet, it waits. If the template errors, it shows the error text from HA's `error` field rather than blank. Non-template values never open a subscription.

### Visual editor

`hui-card-editor`-compatible `text-divider-row-editor` built on `ha-form` with selectors: text, icon, select (align), `ui_action` (tap_action). Fires `config-changed`.

### Tooling

Lit 3, TypeScript 5, Rollup 4 with `@rollup/plugin-node-resolve`, `@rollup/plugin-typescript`, `@rollup/plugin-terser`, ESLint with `typescript-eslint` flat config, Prettier 3. Version is read from `package.json` at build time and injected, replacing the hard-coded constant. Vitest with jsdom for unit tests. CI builds, lints, tests.

### Issues addressed

Closed by design: #42, #14, #24, #27, #30, #21, #32, #20, #11, #8 (already done, confirm and close), #23 (flex with pseudo elements). Closed as resolved by the upgrade, to be reopened if re-reported: #38 (Android tablet), #39 (outdated for HA 2024.11), #35 (Polymer; already Lit). The builder still smoke-tests on a current HA and a narrow viewport before release.

### Migration

- No YAML change needed for existing configs.
- card-mod users targeting `h2` or `.text-divider span` will need new selectors. The new markup keeps the `.text-divider` class on the container and puts the text in `.text-divider-text`. This goes in the README and release notes.

### Testing

- Unit: config validation and defaults, template detection, action routing, subscription lifecycle (subscribe, resubscribe on change, unsubscribe on disconnect, error display).
- Manual: load in a current HA via the existing `.devcontainer`, check row and card placement, light and dark themes, a transparent theme, a narrow viewport, three dividers in a stack, and the editor.

### Implementation order

1. Tooling upgrade with behavior unchanged; build and lint pass.
2. New layout, optional text, icon, whitespace, `align`.
3. `tap_action`.
4. Visual editor and card registration.
5. Templates (last, so it can be cut without affecting the rest).
6. README, release notes, 2.0.0 version bump.

## Left to the builder

Exact flex stub width for `left`/`right`, icon size and spacing, how to word the template error, test file layout, and exact devDependency versions (use current stable at implementation time).
