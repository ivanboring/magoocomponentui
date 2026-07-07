// Marketing landing page — a product landing composition. The hero is a 40/60 split-view: a
// visual on the left, and on the right a stylized-header (typewriter title), a rich-text
// subtitle, and two CTA buttons. The rest are catalog components' curated default examples.
// See ../examples.js for the item-shape reference.

const HERO_WRAP = "mx-auto max-w-6xl px-4 py-12";
const SUBTITLE =
  "<p>One canonical source per component generates every target &mdash; Drupal, React, Vue, and Storybook &mdash; so a single fix lands everywhere at once, with no CSS to ship.</p>";

export default {
  id: "marketing-landing",
  label: "Marketing landing page",
  description: "A product landing page: nav, a 40/60 split hero (typewriter title + subtitle + CTAs), logo cloud, feature grid, alternating features, testimonials, pricing, FAQ, CTA, footer.",
  components: [
    "navigation/navbar",
    {
      split: {
        ratio: "40-60",
        gap: "lg",
        // Left (40%): the hero visual.
        start: { raw: `<img src="/stock/cover-workspace.jpg" alt="" class="aspect-[4/3] w-full rounded-card object-cover shadow-card">` },
        // Right (60%): typewriter title, rich-text subtitle, and two CTAs.
        end: [
          { id: "marketing/stylized-header", args: { static_text: "We build", words: ["design systems", "component libraries", "themeable UIs", "1000+ components"] } },
          { id: "editorial/rich-text", args: { html: SUBTITLE } },
          {
            row: [
              // $slots: {} clears the icon slots (whose default is placeholder text).
              { id: "atoms/button", args: { label: "Get Started", variant: "primary", size: "lg", href: "#", $slots: {} } },
              { id: "atoms/button", args: { label: "Learn More", variant: "secondary", size: "lg", href: "#", $slots: {} } },
            ],
            wrap: "flex flex-wrap items-center gap-3 pt-2",
          },
        ],
      },
      wrap: HERO_WRAP,
    },
    // logo-cloud / feature-alternating / cta-simple already carry --space-section padding; the
    // rest ship none, so wrap them to match the section rhythm (top & bottom).
    "marketing/logo-cloud",
    { id: "marketing/feature-grid", wrap: "py-(--space-section)" },
    "marketing/feature-alternating",
    { id: "marketing/testimonial-slider", wrap: "py-(--space-section)" },
    {
      id: "marketing/pricing-tiers",
      args: { title: "Simple, transparent pricing" },
      // Real card-pricing plans (the default uses feature-less raw articles). The middle plan
      // is featured and carries the most features.
      slots: {
        plans: [
          {
            id: "cards/card-pricing",
            args: {
              plan: "Starter", price: "$0", period: "/mo",
              description: "Everything you need to explore the catalog.",
              features: [
                { label: "Full component catalog", included: true },
                { label: "Tokenized Tailwind markup", included: true },
                { label: "One theme", included: true },
                { label: "Community support", included: true },
              ],
              cta_label: "Get started", cta_href: "#", featured: false,
            },
          },
          {
            id: "cards/card-pricing",
            args: {
              plan: "Pro", price: "$29", period: "/mo",
              description: "For teams shipping across every framework.",
              features: [
                { label: "Everything in Starter", included: true },
                { label: "All four themes", included: true },
                { label: "SDC, React, Vue & Storybook output", included: true },
                { label: "Drupal config export", included: true },
                { label: "Screenshot pipeline", included: true },
                { label: "Custom theme generator", included: true },
                { label: "Priority support", included: true },
              ],
              cta_label: "Start free trial", cta_href: "#", featured: true,
            },
          },
          {
            id: "cards/card-pricing",
            args: {
              plan: "Enterprise", price: "Custom", period: "",
              description: "Advanced control and support at scale.",
              features: [
                { label: "Everything in Pro", included: true },
                { label: "SSO & SAML", included: true },
                { label: "Dedicated onboarding", included: true },
                { label: "SLA & uptime guarantee", included: true },
                { label: "Private component library", included: true },
              ],
              cta_label: "Contact sales", cta_href: "#", featured: false,
            },
          },
        ],
      },
      wrap: "py-(--space-section)",
    },
    { id: "marketing/faq-accordion", wrap: "py-(--space-section)" },
    "marketing/cta-simple",
    "layout/footer-columns",
  ],
};
