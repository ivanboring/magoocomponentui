<?php

/**
 * @file
 * Theme settings for magoo_agentic_base_theme and every subtheme of it.
 *
 * The whole form is generated from tokens.manifest.json — add a token there and it shows up
 * here, in the runtime CSS, and in the child-theme generator at once.
 */

/**
 * Implements hook_form_system_theme_settings_alter().
 */
function magoo_agentic_base_theme_form_system_theme_settings_alter(array &$form, \Drupal\Core\Form\FormStateInterface $form_state): void {
  $path = \Drupal::service('extension.list.theme')->getPath('magoo_agentic_base_theme');
  require_once DRUPAL_ROOT . '/' . $path . '/includes/tokens.php';

  $form['magoo'] = [
    '#type' => 'vertical_tabs',
    '#title' => t('Design tokens'),
    '#weight' => -100,
    '#description' => t('Every value here is written into the page as a CSS variable. Components restyle immediately — no CSS rebuild. Only newly ADDED component classes need a Tailwind rebuild.'),
  ];

  foreach (magoo_tokens_manifest()['groups'] as $group) {
    $key = 'magoo_group_' . $group['key'];
    $form[$key] = [
      '#type' => 'details',
      '#title' => $group['label'],
      '#group' => 'magoo',
    ];
    // html_tag, not a hand-built '#markup' => '<p>' . $string . '</p>': the render system builds and
    // escapes the element for us. The strings come from the manifest (a data file, not a source
    // file), so they are handled the same way as the token labels/descriptions below.
    if (!empty($group['description'])) {
      $form[$key]['description'] = [
        '#type' => 'html_tag',
        '#tag' => 'p',
        '#value' => $group['description'],
      ];
    }

    foreach ($group['tokens'] as $token) {
      $name = 'magoo_' . $token['key'];
      $element = [
        '#title' => $token['label'],
        '#default_value' => theme_get_setting($name) ?? $token['default'],
      ];
      if (!empty($token['description'])) {
        $element['#description'] = $token['description'];
      }

      switch ($token['type']) {
        case 'color':
          $element['#type'] = 'color';
          break;

        case 'select':
          $element['#type'] = 'select';
          $element['#options'] = $token['options'];
          break;

        case 'checkbox':
          $element['#type'] = 'checkbox';
          break;

        case 'textarea':
          $element['#type'] = 'textarea';
          $element['#rows'] = 6;
          break;

        default:
          $element['#type'] = 'textfield';
      }

      $form[$key][$name] = $element;

      // Colors get a dark-mode counterpart right beside the light value.
      if ($token['type'] === 'color') {
        $form[$key][$name . '_dark'] = [
          '#type' => 'color',
          '#title' => t('@label (dark)', ['@label' => $token['label']]),
          '#default_value' => theme_get_setting($name . '_dark') ?? ($token['dark'] ?? $token['default']),
        ];
      }
    }
  }
}
