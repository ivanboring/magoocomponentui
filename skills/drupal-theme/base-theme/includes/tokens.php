<?php

/**
 * @file
 * Token manifest reader. The manifest (tokens.manifest.json) is the single source of truth
 * shared with the JS generator; this file turns theme settings into the runtime :root block.
 */

/**
 * Loads the token manifest from the BASE theme (a subtheme has none of its own).
 */
function magoo_tokens_manifest(): array {
  static $manifest = NULL;
  if ($manifest === NULL) {
    $path = \Drupal::service('extension.list.theme')->getPath('magoo_agentic_base_theme') . '/tokens.manifest.json';
    $manifest = json_decode(file_get_contents(DRUPAL_ROOT . '/' . $path), TRUE) ?: ['groups' => []];
  }
  return $manifest;
}

/**
 * Flat list of every token in the manifest.
 */
function magoo_tokens_list(): array {
  $out = [];
  foreach (magoo_tokens_manifest()['groups'] as $group) {
    foreach ($group['tokens'] as $token) {
      $out[$token['key']] = $token;
    }
  }
  return $out;
}

/**
 * Every setting at its manifest default (plus the _dark counterpart of each color).
 */
function magoo_tokens_defaults(): array {
  $out = [];
  foreach (magoo_tokens_list() as $key => $token) {
    $out['magoo_' . $key] = (string) $token['default'];
    if ($token['type'] === 'color') {
      $out['magoo_' . $key . '_dark'] = (string) ($token['dark'] ?? $token['default']);
    }
  }
  return $out;
}

/**
 * Reads a setting, falling back to the manifest default when it is unset or empty.
 */
function magoo_token_value(string $theme, string $key, array $defaults): string {
  $value = theme_get_setting('magoo_' . $key, $theme);
  if ($value === NULL || $value === '') {
    return $defaults['magoo_' . $key] ?? '';
  }
  return (string) $value;
}

/**
 * Derives --text-sm … --text-5xl from the base size and the scale ratio.
 *
 * Tailwind pairs every --text-<name> with a --text-<name>--line-height; if we only moved the
 * sizes, a non-default ratio would leave the leading at Tailwind's stock values and big headings
 * would end up airy while small text stayed cramped. So each step also gets a line height off a
 * monotonic ramp: generous (1.6) at the smallest step, tightening to nearly solid (1.1) at the
 * largest — the usual "the bigger the type, the tighter the leading" rule.
 */
function magoo_type_scale(string $base, string $ratio): array {
  $unit = str_ends_with($base, 'px') ? 'px' : 'rem';
  $size = (float) $base;
  $r = (float) $ratio ?: 1.25;
  $steps = ['xs' => -2, 'sm' => -1, 'base' => 0, 'lg' => 1, 'xl' => 2, '2xl' => 3, '3xl' => 4, '4xl' => 5, '5xl' => 6];
  $leading = [
    'xs' => '1.6',
    'sm' => '1.55',
    'base' => '1.5',
    'lg' => '1.45',
    'xl' => '1.35',
    '2xl' => '1.3',
    '3xl' => '1.2',
    '4xl' => '1.15',
    '5xl' => '1.1',
  ];
  $out = [];
  foreach ($steps as $name => $exp) {
    $out['--text-' . $name] = round($size * pow($r, $exp), 4) . $unit;
    $out['--text-' . $name . '--line-height'] = $leading[$name];
  }
  return $out;
}

/**
 * "#4f46e5" -> "79, 70, 229". Returns '' for anything that is not a 3/6-digit hex color.
 */
function magoo_hex_to_rgb(string $hex): string {
  $hex = ltrim(trim($hex), '#');
  if (strlen($hex) === 3) {
    $hex = $hex[0] . $hex[0] . $hex[1] . $hex[1] . $hex[2] . $hex[2];
  }
  if (!preg_match('/^[0-9a-fA-F]{6}$/', $hex)) {
    return '';
  }
  return hexdec(substr($hex, 0, 2)) . ', ' . hexdec(substr($hex, 2, 2)) . ', ' . hexdec(substr($hex, 4, 2));
}

/**
 * Re-tints a default shadow with a new "r, g, b" triplet, keeping every offset/blur/alpha.
 */
function magoo_shadow_retint(string $shadow, string $rgb): string {
  return preg_replace('/rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,/', 'rgba(' . $rgb . ',', $shadow) ?? $shadow;
}

/**
 * Applies the "Shadow tint" setting to the shadows that are still at their manifest default.
 *
 * shadow_card / shadow_raised are neutral shadows: they take the configured shadow_rgb. shadow_focus
 * is deliberately tinted with the brand color, so it takes the configured color_primary instead. A
 * shadow the site explicitly customized is never touched — an author-written value always wins.
 */
function magoo_shadow_values(string $theme, array $tokens, array $defaults): array {
  $out = [];
  $rgb = trim(magoo_token_value($theme, 'shadow_rgb', $defaults));
  $primary_rgb = magoo_hex_to_rgb(magoo_token_value($theme, 'color_primary', $defaults));

  foreach (['shadow_card', 'shadow_raised', 'shadow_focus'] as $key) {
    if (!isset($tokens[$key])) {
      continue;
    }
    $default = (string) $tokens[$key]['default'];
    $value = magoo_token_value($theme, $key, $defaults);
    // Customized by the site: leave it exactly as authored.
    if ($value !== $default) {
      continue;
    }
    $tint = $key === 'shadow_focus' ? $primary_rgb : $rgb;
    if ($tint === '' || !preg_match('/^\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*$/', $tint)) {
      continue;
    }
    $out[$tokens[$key]['var']] = magoo_shadow_retint($default, preg_replace('/\s+/', ' ', trim($tint)));
  }
  return $out;
}

/**
 * The full runtime :root block for a theme — light values, dark values, and the escape hatch.
 *
 * The selector is `html:root`, not `:root`. Drupal renders html_head (this <style>) BEFORE the
 * css-placeholder, so the compiled Tailwind stylesheet — which carries the build-time @theme
 * defaults on plain `:root` — comes later in the document. At equal specificity the later rule
 * wins, and the settings would do nothing. `html:root` (0,1,1) outranks `:root` (0,1,0), so the
 * runtime values win regardless of source order. Do not "simplify" this back to `:root`.
 */
function magoo_tokens_css(string $theme): string {
  // Specificity bump; see the doc block above.
  $root = 'html:root';

  $defaults = magoo_tokens_defaults();
  $tokens = magoo_tokens_list();

  $light = [];
  $dark = [];
  foreach ($tokens as $key => $token) {
    if (empty($token['var'])) {
      continue;
    }
    $light[$token['var']] = magoo_token_value($theme, $key, $defaults);
    if ($token['type'] === 'color') {
      $value = theme_get_setting('magoo_' . $key . '_dark', $theme);
      $dark[$token['var']] = ($value === NULL || $value === '')
        ? ($defaults['magoo_' . $key . '_dark'] ?? '')
        : (string) $value;
    }
  }

  // The type scale rides on the same two settings.
  $light += magoo_type_scale(
    magoo_token_value($theme, 'text_base', $defaults),
    magoo_token_value($theme, 'scale_ratio', $defaults)
  );

  // Shadows still at their default get re-tinted from shadow_rgb / color_primary. Overwrites the
  // plain values collected above (array + only fills gaps), which is exactly the intent.
  $light = magoo_shadow_values($theme, $tokens, $defaults) + $light;

  $declare = static function (array $vars): string {
    $out = '';
    foreach ($vars as $name => $value) {
      if ($value !== '') {
        $out .= $name . ':' . $value . ';';
      }
    }
    return $out;
  };

  $custom = magoo_token_value($theme, 'custom_css_vars', $defaults);
  $css = $root . '{' . $declare($light) . $custom . '}';

  $scheme = magoo_token_value($theme, 'color_scheme', $defaults);
  $darkCss = $declare($dark);
  // A light-only site must emit NO dark rules at all. Otherwise a stale magoo-color-scheme=dark in
  // localStorage (left by another Magoo site on the same origin, or by an earlier setting) still
  // matches [data-color-scheme="dark"] and silently flips the site to dark.
  if ($darkCss !== '' && $scheme !== 'light') {
    if ($scheme === 'dark') {
      $css .= $root . '{' . $darkCss . '}';
    }
    if ($scheme === 'auto' || $scheme === 'toggle') {
      $css .= '@media (prefers-color-scheme: dark){' . $root . ':not([data-color-scheme="light"]){' . $darkCss . '}}';
    }
    $css .= $root . '[data-color-scheme="dark"]{' . $darkCss . '}';
  }
  return $css;
}
