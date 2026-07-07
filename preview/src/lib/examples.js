/**
 * Example pages: realistic compositions of catalog components, shown on /examples so an
 * agent (or human) can see how the skeletons combine into a full page across the four themes.
 * Each `components` entry is a catalog id; it's rendered with the component's own curated
 * default example args (see loadRender), then the pieces are stacked in order.
 */
export const EXAMPLE_PAGES = [
  {
    id: "blog-post",
    label: "Blog post",
    description: "A long-form article: nav, header, byline, body, pull-quote, share, tags, author bio, related posts, newsletter, footer.",
    components: [
      "navigation/navbar",
      "editorial/article-header",
      "editorial/byline",
      "news/article-lead",
      "editorial/figure-caption",
      "editorial/pull-quote",
      "editorial/share-bar",
      "editorial/tag-list",
      "editorial/author-bio",
      "editorial/related-articles",
      "editorial/newsletter-inline",
      "layout/footer-columns",
    ],
  },
  {
    id: "marketing-landing",
    label: "Marketing landing page",
    description: "A product landing page: nav, split hero, logo cloud, feature grid, alternating features, testimonials, pricing, FAQ, CTA, footer.",
    components: [
      "navigation/navbar",
      "marketing/hero-split",
      "marketing/logo-cloud",
      "marketing/feature-grid",
      "marketing/feature-alternating",
      "marketing/testimonial-slider",
      "marketing/pricing-tiers",
      "marketing/faq-accordion",
      "marketing/cta-simple",
      "layout/footer-columns",
    ],
  },
  {
    id: "news-home",
    label: "News homepage",
    description: "A news front page: breaking bar, nav, topic header, story list, most-read, weather strip, opinion, footer.",
    components: [
      "news/breaking-news-bar",
      "navigation/navbar",
      "news/topic-header",
      "news/story-list-item",
      "news/story-list-item",
      "news/story-list-item",
      "news/most-read-list",
      "news/weather-strip",
      "news/opinion-card",
      "navigation/footer-nav",
    ],
  },
];
