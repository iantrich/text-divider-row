# text-divider-row 2.0.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship text-divider-row 2.0.0: a modernized Lit 3 card that works as an entities-card row and a standalone card, with optional text, icon, tap action, templates and a visual editor.

**Architecture:** One custom element `text-divider-row`, split into small modules (config normalization, styles, actions, template subscription, editor). Layout is flex with `::before`/`::after` lines, so no background masks the line. Actions go through `custom-card-helpers`; templates through HA's `render_template` websocket subscription.

**Tech Stack:** Lit 3, TypeScript 5, Rollup 4, ESLint (flat config) + Prettier 3, Vitest + jsdom, `custom-card-helpers` 2.2.1.

**Spec:** `docs/superpowers/specs/2026-11-17-v2-modernization-design.md`

## Global Constraints

- One element, `custom:text-divider-row`, as row and card. No second element type.
- Existing 1.x configs (`type`, `text`, `align`) and theme variables `text-divider-color`, `text-divider-font-size`, `text-divider-line-size`, `text-divider-margin` keep working unchanged.
- New theme variable `text-divider-gap`; the internal `--background` variable is removed.
- Only new runtime dependency is `custom-card-helpers`. Bundled into the single output `dist/text-divider-row.js`; HACS/release workflow unchanged.
- Markup: `.text-divider` container class stays; text lives in `.text-divider-text`.
- `tap_action` only (no hold/double-tap). Actions: `navigate`, `url`, `more-info`, `toggle`, `perform-action` (alias `call-service`), `none`.
- A value is a template if it contains `{{` or `{%`. Non-template values never open a subscription.
- `align` invalid or missing falls back to `center`.
- Version is read from `package.json` at build time; no hard-coded constant. Release as 2.0.0.
- Do not commit unless the task step says so; never push or close issues without asking Ian.

## Review Focus

1. `text: ""`, `text: null` or a number (#42 reporter tried these) must not throw; empty renders a plain line, a number renders as text. (Task 2)
2. A bare 1.x config `{ type, text }` and `align: 'bogus'` render exactly as before (centered). (Task 2)
3. Icon with no text and `align: left` renders icon plus line, no stray empty text node. (Task 2)
4. HA sets `hass` on every state change; an unchanged template must not resubscribe. (Task 5)
5. `setConfig` called repeatedly (editor live edit) must unsubscribe the previous template; a template resolving to `""` renders a plain line, never the raw template or "undefined". (Task 5)

---

## File Structure

- `src/text-divider-row.ts`: element, render, lifecycle, wiring. Registers `window.customCards`.
- `src/types.ts`: `TextDividerRowConfig`.
- `src/config.ts`: `normalizeConfig`.
- `src/styles.ts`: exported `styles` (css).
- `src/actions.ts`: `toHelperAction`, `handleTap`.
- `src/template.ts`: `isTemplate`, `TemplateSubscription`.
- `src/editor.ts`: `text-divider-row-editor`.
- `src/const.ts`: `CARD_VERSION` from build-time define.
- `tests/*.test.ts`: one per module. `vitest.config.ts`, `eslint.config.mjs`.

---

### Task 1: Tooling upgrade, behavior unchanged

**Files:**
- Modify: `package.json`, `tsconfig.json`, `rollup.config.js`, `rollup.config.dev.js`, `src/text-divider-row.ts`, `src/const.ts`, `.github/workflows/build.yml`, `.github/workflows/release.yml`
- Create: `eslint.config.mjs`, `vitest.config.ts`, `tests/smoke.test.ts`
- Delete: `.eslintrc.js`

**Interfaces:**
- Produces: `CARD_VERSION: string` from `src/const.ts` (build-time injected `__CARD_VERSION__`); npm scripts `lint`, `test`, `build`, `start`.

- [ ] **Step 1: Write the failing smoke test** in `tests/smoke.test.ts`: import `../src/text-divider-row`, create `document.createElement('text-divider-row')`, call `setConfig({ type: 'custom:text-divider-row', text: 'Hi' })`, await `updateComplete`, assert `shadowRoot.querySelector('h2 span').textContent === 'Hi'`. Also assert `CARD_VERSION` is a non-empty string.
- [ ] **Step 2: Install tooling.** Remove lit-element, lit-html, babel, uglify, old eslint/prettier/rollup plugins. Install `lit`, `custom-card-helpers`, and dev: `typescript`, `rollup`, `@rollup/plugin-node-resolve`, `@rollup/plugin-typescript`, `@rollup/plugin-terser`, `@rollup/plugin-replace`, `rollup-plugin-serve`, `eslint`, `typescript-eslint`, `eslint-config-prettier`, `prettier`, `vitest`, `jsdom`, `tslib` (current stable of each). Keep `home-assistant-js-websocket` as a dev/type dependency only if imported for types.
- [ ] **Step 3: Configure.** `tsconfig.json`: target `es2021`, `experimentalDecorators: true`, `useDefineForClassFields: false`, strict. `rollup.config.js`: input `src/text-divider-row.ts`, output `dist/text-divider-row.js` (es), plugins resolve, typescript, replace (`__CARD_VERSION__` → JSON of `package.json` version, `preventAssignment: true`), terser. `vitest.config.ts`: jsdom, same `define` for `__CARD_VERSION__`. `eslint.config.mjs`: typescript-eslint recommended + prettier config. Scripts: `lint` = `eslint src tests && prettier --check src tests`, `test` = `vitest run`, `build` = `npm run lint && npm test && rollup -c`.
- [ ] **Step 4: Migrate the element** to `lit` imports (`import { LitElement, html, css } from 'lit'`, `import { customElement, state } from 'lit/decorators.js'`), `_config` as `@state()`, same markup and CSS as today. `src/const.ts`: `declare const __CARD_VERSION__: string; export const CARD_VERSION: string = __CARD_VERSION__;`. Delete `.eslintrc.js`. Run `npx prettier --write src tests`.
- [ ] **Step 5: Update workflows** to `actions/checkout@v4`, `actions/setup-node@v4` with node 20, `actions/upload-artifact@v4`, current `svenstaro/upload-release-action`, and run `npm ci` then `npm run build`.
- [ ] **Step 6: Verify.** Run `npm run build`. Expected: lint clean, smoke test PASS, `dist/text-divider-row.js` produced.
- [ ] **Step 7: Commit** `chore: upgrade toolchain to Lit 3, TS 5, Rollup 4, Vitest`.

---

### Task 2: Config normalization and flex layout

**Files:**
- Create: `src/config.ts`, `src/styles.ts`, `tests/config.test.ts`, `tests/render.test.ts`
- Modify: `src/types.ts`, `src/text-divider-row.ts`, `tests/smoke.test.ts`

**Interfaces:**
- Produces: `TextDividerRowConfig { type: string; text?: string | number; icon?: string; align?: 'left'|'center'|'right'; tap_action?: ActionConfig }` (`ActionConfig` from `custom-card-helpers`); `normalizeConfig(raw: unknown): TextDividerRowConfig`; exported `styles: CSSResult` from `src/styles.ts`.

- [ ] **Step 1: Write failing tests.** `config.test.ts`: `normalizeConfig(undefined)` and `normalizeConfig('x')` throw `'Invalid configuration'`; `{type:'t'}` returns `align: 'center'`; `{type:'t', align:'bogus'}` returns `align: 'center'`; `{type:'t', align:'left'}` keeps `'left'`. `render.test.ts` (use `fixture` helper creating the element and awaiting `updateComplete`): config `{text:'A  B'}` → `.text-divider-text` textContent is `'A  B'` (two spaces); `{text:''}` and `{text:null}` render no `.text-divider-text` and do not throw; `{text: 123}` renders `'123'`; `{icon:'mdi:sofa', align:'left'}` renders one `ha-icon` with `icon` attribute `mdi:sofa`, no `.text-divider-text`, container has class `text-divider-left`; `{}`-with-type only renders container `.text-divider.text-divider-center` with no text and no icon; `styles.cssText` contains `white-space: pre-wrap`, `--text-divider-gap` and does not contain `background`.
- [ ] **Step 2: Run** `npx vitest run tests/config.test.ts tests/render.test.ts`. Expected: FAIL (modules missing).
- [ ] **Step 3: Implement `normalizeConfig` in `src/config.ts`.** Throws on non-object; copies known fields; coerces `text` of `null`/`''`/`undefined` to `undefined`; invalid `align` → `'center'`.
- [ ] **Step 4: Implement `styles` in `src/styles.ts`.** `.text-divider` is `display: flex; align-items: center; gap: var(--text-divider-gap, 1em); margin: var(--text-divider-margin, 1em 0); min-height` identical for all instances (fixes #20). `::before`/`::after` are `flex: 1; border-top: var(--text-divider-line-size, 1px) solid var(--text-divider-color, var(--secondary-text-color))`. `left` hides `::before`, `right` hides `::after` (hide with `display: none`; choose a fixed `flex: 0 0 1em` stub only if the result looks wrong in manual check). Text uses `font-size: var(--text-divider-font-size, 14px)`, `color` the divider color, `white-space: pre-wrap`. No background anywhere. Keep `:host { display: block }`.
- [ ] **Step 5: Rewrite `render()` and `setConfig`** to use `normalizeConfig`, render `<div class="text-divider text-divider-{align}">` with optional `<ha-icon .icon=...>` and optional `<span class="text-divider-text">`. Update `smoke.test.ts` selector to `.text-divider-text`.
- [ ] **Step 6: Run** `npm test`. Expected: PASS.
- [ ] **Step 7: Commit** `feat: flex layout, optional text, icon, preserved whitespace`.

---

### Task 3: `tap_action`

**Files:**
- Create: `src/actions.ts`, `tests/actions.test.ts`
- Modify: `src/text-divider-row.ts`, `tests/render.test.ts`

**Interfaces:**
- Consumes: `TextDividerRowConfig.tap_action`.
- Produces: `toHelperAction(action: ActionConfig): ActionConfig`; `handleTap(node: HTMLElement, hass: HomeAssistant, config: TextDividerRowConfig): void`; the element gets a `hass` property (`@property({ attribute: false })`).

Reason for `toHelperAction`: `custom-card-helpers` 2.2.1 only handles `call-service`; HA's action picker now emits `perform-action`. The card maps one to the other until the library learns `perform-action` (then the shim can be deleted).

- [ ] **Step 1: Write failing tests** with `vi.mock('custom-card-helpers')` for `handleAction`. `toHelperAction({action:'perform-action', perform_action:'light.turn_on', data:{brightness:5}, target:{entity_id:'light.a'}})` equals `{action:'call-service', service:'light.turn_on', data:{brightness:5}, target:{entity_id:'light.a'}}`; `{action:'navigate', navigation_path:'/x'}` is returned unchanged; `call-service` unchanged. `handleTap` calls `handleAction(node, hass, {tap_action: mapped}, 'tap')` once; with no `tap_action` or `action: 'none'` it calls nothing. Render tests: with a `tap_action` the container has `role="button"`, `tabindex="0"`; clicking it, and pressing Enter or Space, each call `handleAction` once; without one, no `role`/`tabindex` and a click calls nothing.
- [ ] **Step 2: Run** `npx vitest run tests/actions.test.ts tests/render.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** `toHelperAction` and `handleTap` in `src/actions.ts`; wire `@click` and `@keydown` (Enter, Space with `preventDefault`) in the element; add `cursor: pointer` and a visible `:focus-visible` outline only when interactive.
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** `feat: tap_action via custom-card-helpers`.

---

### Task 4: Visual editor and card registration

**Files:**
- Create: `src/editor.ts`, `tests/editor.test.ts`
- Modify: `src/text-divider-row.ts`, `tests/render.test.ts`

**Interfaces:**
- Consumes: `TextDividerRowConfig`.
- Produces: custom element `text-divider-row-editor` with `setConfig(config)` and `hass` property; fires `config-changed` with `detail: { config }`. Static methods on the card: `getConfigElement(): Promise<HTMLElement>`, `getStubConfig(): TextDividerRowConfig`, `getGridOptions(): { columns: 'full'; rows: 1 }`. Registers in `window.customCards`.

- [ ] **Step 1: Write failing tests.** `TextDividerRow.getStubConfig()` equals `{type:'custom:text-divider-row', text:'Divider'}`; `getGridOptions()` equals `{columns:'full', rows:1}`; `window.customCards` contains an entry with `type: 'text-divider-row'` and a `name`; editor renders an `ha-form` whose schema has fields named `text`, `icon`, `align`, `tap_action` using selectors `text`, `icon`, `select` (options left/center/right), `ui_action`; dispatching `value-changed` on the form with `{detail:{value:{...cfg, text:'New'}}}` fires `config-changed` with `config.text === 'New'`.
- [ ] **Step 2: Run** `npx vitest run tests/editor.test.ts tests/render.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** the editor in `src/editor.ts` (Lit element using `ha-form` with `computeLabel` for readable names), add the static card methods and the `window.customCards.push({ type: 'text-divider-row', name: 'Text Divider Row', description: ..., preview: true })` registration in `src/text-divider-row.ts`.
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** `feat: visual editor and card registration`.

---

### Task 5: Templates

**Files:**
- Create: `src/template.ts`, `tests/template.test.ts`
- Modify: `src/text-divider-row.ts`, `tests/render.test.ts`

**Interfaces:**
- Consumes: `hass.connection.subscribeMessage` (resolves to an unsubscribe function).
- Produces: `isTemplate(value: unknown): boolean`; `class TemplateSubscription { constructor(onResult: (value: string) => void, onError: (message: string) => void); subscribe(hass: HomeAssistant, template: string, variables: object): Promise<void>; unsubscribe(): void }`. The element holds one `TemplateSubscription` each for `text` and `icon`, and renders `_renderedText`/`_renderedIcon` state.

- [ ] **Step 1: Write failing tests** for `template.test.ts` with a fake connection whose `subscribeMessage` captures the callback and returns a spy unsub: `isTemplate('{{ 1 }}')` and `isTemplate('{% if x %}a{% endif %}')` true; `'plain'`, `''`, `123`, `undefined` false. `subscribe` calls `subscribeMessage` with message `{type:'render_template', template:'{{ 1 }}', variables:{config: ...}}`; callback `{result:'x'}` calls `onResult('x')`; callback `{error:'bad'}` calls `onError('bad')`; a rejected `subscribeMessage` calls `onError` with the rejection message; `unsubscribe()` calls the unsub spy; `unsubscribe()` called before `subscribeMessage` resolves still calls the unsub once it resolves; a second `subscribe` first unsubscribes the previous one.
- [ ] **Step 2: Write failing element tests** in `render.test.ts` with a fake `hass`: non-template `text` never calls `subscribeMessage`; template `text` renders the callback result `'Hello'`; result `''` renders no `.text-divider-text`; error renders the error string in `.text-divider-text` with class `text-divider-error`; setting `hass` to a new object with the same config does not call `subscribeMessage` again; `setConfig` with a different template unsubscribes the old one and subscribes the new one; setting `hass` after `setConfig` (initially undefined) subscribes then; `disconnectedCallback` calls unsub; `connectedCallback` after that resubscribes; a template `icon` sets the `ha-icon` `icon` to the result.
- [ ] **Step 3: Run** `npx vitest run tests/template.test.ts tests/render.test.ts`. Expected: FAIL.
- [ ] **Step 4: Implement** `src/template.ts`. In the element: subscribe in `updated()` only when config or `hass` presence changes (track the last subscribed template string per field, not `hass` identity), unsubscribe in `disconnectedCallback`, re-run in `connectedCallback`. A result of `''` or whitespace-only is treated as empty.
- [ ] **Step 5: Run** `npm test`. Expected: PASS.
- [ ] **Step 6: Commit** `feat: template support for text and icon`.

---

### Task 6: Docs, version, manual verification

**Files:**
- Modify: `README.md`, `package.json`, `package-lock.json`, `.devcontainer/ui-lovelace.yaml`

- [ ] **Step 1: README.** New options table (`text` now optional, `icon`, `align`, `tap_action`), templates section with an example, updated theme variables table (add `text-divider-gap`), "Upgrading from 1.x" section (no YAML changes; card-mod selectors move from `h2`/`span` to `.text-divider`/`.text-divider-text`), standalone card usage example.
- [ ] **Step 2: Version.** `npm version 2.0.0 --no-git-tag-version`. Verify `grep version package.json` shows `2.0.0` and the built `dist/text-divider-row.js` logs `Version 2.0.0` in its banner.
- [ ] **Step 3: Example config** in `.devcontainer/ui-lovelace.yaml`: three stacked dividers (left/center/right), an icon-only divider, a no-text divider, a template divider, a navigate tap divider, one inside an entities card and one standalone.
- [ ] **Step 4: Manual verification** with `npm start` and the devcontainer HA (or a current HA instance): light and dark theme, a transparent theme, a narrow viewport (about 360px wide) and an Android-sized one, three stacked dividers have equal height, editor shows and edits live, template updates when the entity changes, tap navigates. Record what was checked in the PR description.
- [ ] **Step 5: Run** `npm run build`. Expected: lint, tests and rollup pass.
- [ ] **Step 6: Commit** `docs: 2.0.0 readme and example config`.
- [ ] **Step 7: Ask Ian** before pushing, tagging the release, or closing issues (#42, #14, #24, #27, #30, #21, #32, #20, #11, #8, #23, #38, #39, #35 with a short "fixed in 2.0.0, reopen if still broken" comment).
