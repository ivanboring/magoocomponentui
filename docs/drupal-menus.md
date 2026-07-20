# Wiring Magoo nav components to Drupal menus

How to render the catalog's navigation components (`navbar`, `navbar-mega`, `bottom-nav`,
`nav-rail`, `tree-nav`, `menubar`, `sidebar-nav`, `account-menu`, …) from **real Drupal menus**
(`main`, `account`, a custom one), place several menus at once (e.g. a login menu **and** a primary
menu), and gate each on theme settings + content presence.

> TL;DR
> - A Drupal **menu** is a config entity; its **links** are content (`menu_link_content`) or
>   module-defined. Core ships `main`, `account` (the login/logout menu), `footer`, `tools`, `admin`.
> - The generator emits each nav component as a **paragraph with a hand-entered links field** — good
>   for one-off marketing headers, but **not** bound to a Drupal menu. To bind a component to a real
>   menu, override that menu's Twig template to `{% embed %}` the component's SDC, mapping the menu
>   tree onto the component's `links`/`items` prop.
> - "Only show when the component is there" is mostly **native**: `page.html.twig` renders a region
>   only `{% if page[region] %}`, a menu template renders nothing when the menu is empty, and the
>   `account` block hides itself for the wrong auth state. A theme-settings toggle adds an explicit
>   on/off on top (worked example at the end).

---

## 1. The two rendering paths (pick per component)

| Path | Use for | How content is authored |
|---|---|---|
| **A. Paragraph** (generator default) | A bespoke header/footer whose links are page content an editor curates (navbar with logo + CTA buttons + a short link list) | Editor fills a `field_*_links` custom-field table on the paragraph |
| **B. Drupal menu → SDC** (this guide) | Anything that should reflect a **managed menu** at `/admin/structure/menu` — site nav, login menu, docs tree | Site builder edits the menu; the component re-renders |

Path A is what `dist/<id>/drupal/paragraph--<id>.html.twig` already gives you. Path B is a small
Twig override you add to your **child theme** (never the base — see invariants). The rest of this
doc is Path B.

The generated **SDC** (`<childtheme>:<component>`) is the reusable unit both paths share. Its
`*.component.yml` declares the props (`links`, `items`, `menus`, …); we just feed those props from a
menu tree instead of a paragraph field.

---

## 2. Drupal's menu model

- **Menu** = a config entity (`system.menu.<id>`), exportable with `drush config:export`.
- **Menu link** = usually a `menu_link_content` **content** entity (created in the UI/API — *not*
  captured by `drush cex`), or a static link defined by a module in `MODULE.links.menu.yml`, or a
  route-derived link. Menus are config; their links are (mostly) content — plan deployment
  accordingly (§6).
- **Placement** = a **block** (plugin `system_menu_block:<menu>`) dropped into a region, itself a
  config entity (`block.block.<id>`).

Core menus you already have:

| Machine name | UI label | Contains | Typical component |
|---|---|---|---|
| `main` | Main navigation | Your primary links | `navbar`, `navbar-mega`, `bottom-nav`, `nav-rail`, `tree-nav`, `menubar` |
| `account` | User account menu | **Log in / Log out / My account** (auto by auth state) | `account-menu`, `menu-dropdown`, a small `navbar` links slot |
| `footer` | Footer | Footer links | `footer-nav` |
| `tools` | Tools | Admin/user utilities | — |
| `admin` | Administration | Admin tree | — |

So the "login menu by itself, primary menu as the other" split is built in: `account` **is** the
login menu, `main` is the primary. §5 places them into two components at once.

---

## 3. Create / populate menus

### Via the UI
1. `/admin/structure/menu` → **Add menu** for a custom one (e.g. *Primary*, machine name `primary`).
   `main`, `account`, `footer` already exist.
2. **Add link** on each menu (title + path, parent for nesting, weight for order).
3. `/admin/structure/block` → place a **menu block** into a region (§4/§5).

### As config (custom menu)
`config/sync/system.menu.primary.yml`:
```yaml
langcode: en
status: true
dependencies: {  }
id: primary
label: 'Primary navigation'
description: 'Main site navigation.'
locked: false
```
Then `drush config:import`. (The `account`/`main` menus need no config — they ship with core.)

### Reproducible links
`menu_link_content` links are **content**, so they don't ride along in `drush cex`. Options:
- **UI / API** for site content (simplest), or
- a tiny module with `MODULE.links.menu.yml` for links that must deploy as code:
  ```yaml
  mymodule.home:
    title: 'Home'
    route_name: '<front>'
    menu_name: main
    weight: -10
  mymodule.docs:
    title: 'Docs'
    url: 'internal:/docs'
    menu_name: main
    weight: 0
  ```
- or `default_content` / a content export for `menu_link_content` entities.

---

## 4. Bind a menu to a component (the override)

Drupal renders a menu through `menu.html.twig`, and you can target one menu with
`menu--<MENU>.html.twig`. Inside it, Drupal gives you an `items` tree where each entry has
`.title`, `.url`, `.is_expanded`, `.in_active_trail`, and `.below` (its children). Map that onto the
component's prop and `{% embed %}` the SDC.

Put these in your **child theme**: `web/themes/custom/<child>/templates/`.

### 4a. Flat menu → `navbar` / `bottom-nav` / `pill-nav`
`templates/menu--main.html.twig`:
```twig
{#
  Render the "main" menu through the Magoo navbar SDC.
  navbar expects: links = [{ label, href, active }]
#}
{% set nav_links = [] %}
{% for item in items %}
  {% set nav_links = nav_links|merge([{
    label: item.title,
    href: item.url,
    active: item.in_active_trail,
  }]) %}
{% endfor %}

{% embed 'yourchild:navbar' with {
  logo_text: 'Acme',
  logo_href: '/',
  links: nav_links,
} only %}{% endembed %}
```
Swap `yourchild:navbar` for `yourchild:bottom-nav` (prop `items`, each `{ label, icon, href,
active, badge }` — pass an `icon` per link if your menu links carry one) or `yourchild:pill-nav`,
etc. `item.url` is a Drupal `Url` object; Twig prints it as the href string.

### 4b. Nested menu → `tree-nav` / `menubar` / `navbar-mega` / `sidebar-nav`
These components take a nested model (an item may have `children`). Drupal nests via `.below`, so
map recursively with a macro. `templates/menu--docs.html.twig`:
```twig
{% import _self as m %}

{% macro to_items(tree) %}
  {% import _self as m %}
  {% set out = [] %}
  {% for item in tree %}
    {% if item.below %}
      {% set out = out|merge([{ label: item.title, children: m.to_items(item.below) }]) %}
    {% else %}
      {% set out = out|merge([{ label: item.title, href: item.url, active: item.in_active_trail }]) %}
    {% endif %}
  {% endfor %}
  {{ out|json_encode|raw }}
{% endmacro %}

{% set tree_items = m.to_items(items)|json_decode(true) %}

{% embed 'yourchild:tree-nav' with { label: 'Docs', items: tree_items } only %}{% endembed %}
```
(The `json_encode`/`json_decode` round-trip is the cleanest way to return a built array from a Twig
macro. If your Drupal lacks a `json_decode` filter, build the tree in a small preprocess instead —
see §6 note.) For `menubar`, map top level → `menus` with `{ label, items }`; for `navbar-mega`,
map to `links[].groups[].items[]`.

### 4c. The `account` menu → a login menu component
`templates/menu--account.html.twig`:
```twig
{% set account_links = [] %}
{% for item in items %}
  {% set account_links = account_links|merge([{
    label: item.title,
    href: item.url,
    active: item.in_active_trail,
  }]) %}
{% endfor %}

{% embed 'yourchild:account-menu' with { items: account_links } only %}{% endembed %}
```
The `account` menu already swaps **Log in** ↔ **Log out / My account** by auth state, so this
component becomes a self-contained login menu with no extra logic. (`menu-dropdown` or a `navbar`
actions slot work equally well as the target SDC.)

---

## 5. Two menus at once — login menu **and** primary menu

Goal: primary nav in the `primary_menu` region, the login/account menu in `secondary_menu` (or the
header). The base theme already exposes both regions (`primary_menu`, `secondary_menu`) and renders
each only when it has content.

1. **Place the blocks** (UI: `/admin/structure/block`, region column) or as config:

   `config/sync/block.block.child_main_menu.yml`:
   ```yaml
   langcode: en
   status: true
   id: child_main_menu
   theme: yourchild
   region: primary_menu
   weight: 0
   plugin: 'system_menu_block:main'
   settings:
     label: 'Main navigation'
     label_display: '0'
     level: 1
     depth: 0
   visibility: {  }
   ```

   `config/sync/block.block.child_account_menu.yml`:
   ```yaml
   langcode: en
   status: true
   id: child_account_menu
   theme: yourchild
   region: secondary_menu
   weight: 0
   plugin: 'system_menu_block:account'
   settings:
     label: 'User account menu'
     label_display: '0'
     level: 1
     depth: 0
   visibility: {  }
   ```
   `drush config:import`.

2. **Each block picks up its override** from §4 (`menu--main.html.twig`, `menu--account.html.twig`)
   because the template suggestion is keyed by menu name regardless of which block rendered it. Result:
   the primary menu renders as your `navbar`/`bottom-nav`; the account menu renders as your login
   component — two different components, fed by two different Drupal menus, in two regions.

3. `page.html.twig` outputs `{{ r.region(page, 'primary_menu', …) }}` and
   `{{ r.region(page, 'secondary_menu', …) }}` already, each guarded by `{% if page[name] %}`.

---

## 6. "Only show up when the component is there" — theme-settings + content presence

Yes — and there are three layers, cheapest first.

### Layer 1 — native content-presence (no code)
Already true in this theme:
- **Empty region collapses.** `page.html.twig` renders a region only `{% if page[region] %}`. No
  block/output in `primary_menu` → the wrapper is never printed.
- **Empty menu renders nothing.** A `system_menu_block` with zero visible links produces no output,
  so its region collapses too.
- **Auth-aware.** The `account` block shows Log in to anonymous users and Log out to authenticated
  ones automatically — the "login menu" appears only when relevant.
- **Per-block visibility.** Each block has visibility **conditions** (pages, roles, content type) at
  `/admin/structure/block`, stored under `visibility:` in the block config above.

So a component "only shows up when it's there" out of the box: place it, give its menu links, and it
appears; remove the links or the block and the region disappears.

### Layer 2 — an explicit theme-settings toggle (connect a component to a setting)
The base theme drives **all** settings from `tokens.manifest.json`: add an entry and it appears in
the theme-settings form, and you thread it into Twig via `preprocess_page()` (exactly how
`sticky_header`, `hidden_regions`, `sidebar_position` already work — see
`magoo_agentic_base_theme.theme`). To add a "Show primary menu" switch:

1. **Manifest** — add a `checkbox` token to the relevant group in
   `skills/drupal-theme/base-theme/tokens.manifest.json` (mirrors `sticky_header`):
   ```json
   { "key": "show_primary_menu", "label": "Show primary menu", "type": "checkbox", "default": "1" }
   ```
   (Regenerate: the settings form, schema, and child `settings.yml` all loop the manifest.)

2. **Preprocess** — expose it on the `magoo` Twig variable in
   `magoo_agentic_base_theme_preprocess_page()` alongside the existing keys:
   ```php
   $variables['magoo']['show_primary_menu'] = (bool) magoo_token_value($theme, 'show_primary_menu', $defaults);
   ```

3. **Gate it** in `page.html.twig` (or the menu override) — combine the toggle **and** content
   presence so it shows only when enabled *and* the menu actually has links:
   ```twig
   {% if magoo.show_primary_menu and page.primary_menu %}
     {{ r.region(page, 'primary_menu', bleed, '') }}
   {% endif %}
   ```
   `page.primary_menu` is truthy only when the block rendered links, so `enabled AND has-content` is
   the whole condition. Use the same shape for any component/region.

For a project-wide "drop these regions entirely" switch you don't even need a new token — the
existing **`hidden_regions`** setting (comma list, consumed by `preprocess_page()` which `unset()`s
them) already removes `primary_menu`, `secondary_menu`, etc.

### Layer 3 — inside a composite component
If a single component (say `navbar`) has an optional sub-part (a search box, an account dropdown),
gate that part on its own prop and pass the prop from the setting. The component's `data-if="…"`
directive renders the sub-part only when the prop is truthy — so
`{% embed 'yourchild:navbar' with { show_search: magoo.show_search, … } %}` makes the search appear
only when both the setting is on and the slot has content.

---

## 7. Invariants & gotchas

- **Menu template overrides live in the CHILD theme** (`web/themes/custom/<child>/templates/`), not
  in `skills/drupal-theme/base-theme/` (that's the `install-base` source) and not in the deployed
  base copy. Styling stays tokens + props — never fork a component's Twig to restyle.
- After adding classes that weren't already in the catalog, the **child recompiles its own CSS**
  (`npm run build:css`) before `drush theme:enable`; the base ships prebuilt. A menu override that
  only reuses existing component classes needs no rebuild.
- **Cache:** menu blocks carry the menu's cache tags, so edits at `/admin/structure/menu` invalidate
  the render automatically. A render gated on a **theme setting** must depend on
  `<theme>.settings` config — `preprocess_page()` already adds that dependency for the token block;
  extend it if you gate on a new setting elsewhere.
- **`url` printing:** `item.url` is a `Url` object. It prints as a string in an href; if you need
  the raw string (e.g. to compare), use `item.url.toString()`.
- **`json_decode` in Twig:** available via Twig Tweak / Drupal's Twig extensions on most sites; if
  absent, build the nested `items` array in a `hook_preprocess_menu__<menu>()` in PHP and hand it to
  the embed instead of doing it in Twig.
- **Machine names:** replace `yourchild` with your child theme's machine name (the SDC namespace),
  and `child_*` block ids with your own.
```
