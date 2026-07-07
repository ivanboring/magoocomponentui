// Blog post — a long-form article composition (nav, header, body, share, tags, author,
// related posts, newsletter, footer). See ../examples.js for the item-shape reference.

// Reading column: matches editorial/article-header's own `max-w-2xl mx-auto` so the article
// body and the in-article pieces (share, tags, author) line up in one measure.
const READ = "mx-auto max-w-2xl px-4";

// The article body — a plain HTML blob (not a catalog component). Only font/size/spacing
// utilities so it inherits the theme's on-background text colour across all four themes.
const BLOG_BODY = `<div class="${READ}">
  <div class="space-y-5 text-lg leading-relaxed">
    <p>When a component library crosses a few hundred entries, consistency stops being a nicety and becomes the whole game. Every hand-tweaked variant is a future bug; every one-off style is a token that should have existed.</p>
    <p>We took a different route: one canonical source per component, and a generator that emits every target from it &mdash; Drupal SDC, React, Vue, and Storybook. Authors never port markup by hand, so the same fix lands everywhere at once.</p>
    <h2 class="font-heading text-2xl font-semibold">One source, many targets</h2>
    <p>The template vocabulary is deliberately small: interpolation, a class-map for enum variants, and a handful of directives for loops, conditionals, and slots. Because it never reaches for framework-specific escape hatches, it transpiles cleanly to Twig, JSX, and Vue with no drift.</p>
    <h2 class="font-heading text-2xl font-semibold">Theming without forks</h2>
    <p>Components ship no CSS. Markup is tokenized Tailwind bound to CSS-variable design tokens, so a new look is a new set of values &mdash; never a new component. Four themes re-skin the entire catalog from one shared contract.</p>
  </div>
</div>`;

const TAGS_HEADING = `<div class="${READ}"><h2 class="font-heading text-lg font-semibold">Tags</h2></div>`;

export default {
  id: "blog-post",
  label: "Blog post",
  description: "A long-form article: nav, header, body, share bar, tags, author bio, related posts, newsletter, footer.",
  components: [
    "navigation/navbar",
    { section: ["editorial/article-header"] },
    { raw: BLOG_BODY },
    { id: "editorial/share-bar", wrap: READ },
    { section: [{ raw: TAGS_HEADING }, { id: "editorial/tag-list", wrap: READ }], padding: "compact" },
    { id: "editorial/author-bio", wrap: READ },
    { section: ["editorial/related-articles"], padding: "compact" },
    "editorial/newsletter-inline",
    "layout/footer-columns",
  ],
};
