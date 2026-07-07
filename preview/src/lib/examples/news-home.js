// News homepage — a city-tabloid front (in the spirit of a paper like bz-berlin.de). Full-width
// breaking bar + mega-menu navbar + a scrollable category tab strip on top, then an 80/20 split:
// the main column (80%) is a tabloid front — red section bars, a lead hero with an overlaid
// headline, and dense card grids — and the right column (20%) holds the sidebar widgets
// (most-read, latest, weather, opinion). Footer spans full width. Made-up text.
// See ../examples.js for the item shapes.

const NEWS = "mx-auto max-w-6xl px-4";

// The signature red section-header bar with a trailing chevron (full column width).
const bar = (title) =>
  `<div class="flex items-center gap-2 rounded-card bg-primary px-4 py-2.5 text-primary-contrast">` +
  `<h2 class="font-heading text-lg font-semibold">${title}</h2><span class="text-lg" aria-hidden="true">&rsaquo;</span></div>`;

// A small sidebar section heading.
const heading = (text) => `<h2 class="font-heading text-sm font-semibold uppercase tracking-wide text-on-surface-muted">${text}</h2>`;

// A vertical news card (image on top, red kicker, headline, excerpt).
const story = (category, title, excerpt, image) => ({
  id: "cards/card-blog",
  args: { category, title, excerpt, image, author: "Staff", date: "2h ago", read_time: "", href: "#" },
});

// A 2-column card grid holding the given card-blog stories.
const grid = (items) => ({
  id: "cards/card-grid",
  args: { mobile_cols: 1, tablet_cols: 2, desktop_cols: 2 },
  slots: { items },
});

// Lead hero — a big image with an overlaid headline.
const HERO = {
  id: "cards/card-overlay",
  args: {
    subtitle: "Top story",
    title: "Burst water main tears a hole in the pavement right by the station",
    image: "/stock/property-house.jpg",
    cta_label: "Read more",
    href: "#",
  },
};

// Latest-headline rows for the sidebar.
const LATEST = [
  { id: "news/story-list-item", args: { headline: "City approves new transit plan after months of debate", category: "Local", time: "3h ago", image: "/stock/cover-workspace.jpg", href: "#" } },
  { id: "news/story-list-item", args: { headline: "Weather system to bring heavy rain this weekend", category: "Weather", time: "5h ago", image: "/stock/property-house.jpg", href: "#" } },
  { id: "news/story-list-item", args: { headline: "Local team clinches playoff spot in overtime thriller", category: "Sport", time: "6h ago", image: "/stock/product-sneaker.jpg", href: "#" } },
];

export default {
  id: "news-home",
  label: "News homepage",
  description: "A city-tabloid front: full-width breaking bar + mega-menu navbar + a category tab strip, then an 80/20 split — the main column is a red-barred tabloid front (overlaid hero + card grids) and the right column holds most-read, latest, weather, and opinion. Footer spans full width. Made-up text.",
  components: [
    "news/breaking-news-bar",
    "navigation/navbar-mega",
    // The scrollable category tab strip under the header.
    {
      id: "navigation/pill-nav",
      args: {
        label: "Sections",
        items: [
          { label: "Home", href: "#", active: true },
          { label: "City", href: "#", active: false },
          { label: "Crime", href: "#", active: false },
          { label: "Politics", href: "#", active: false },
          { label: "Opinion", href: "#", active: false },
          { label: "Sport", href: "#", active: false },
          { label: "Business", href: "#", active: false },
          { label: "World", href: "#", active: false },
          { label: "Culture", href: "#", active: false },
        ],
      },
      // Scrollable when the tabs overflow, with the scrollbar hidden (touch users drag; desktop
      // scrolls via trackpad/shift-wheel) — and a little breathing room above the strip.
      wrap: `${NEWS} overflow-x-auto pt-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`,
    },
    {
      split: {
        ratio: "80-20",
        gap: "lg",
        // Main column (80%): the tabloid front.
        start: [
          { raw: bar("Top stories of the day") },
          HERO,
          { raw: bar("Around the city") },
          grid([
            story("Pawnshop raid", "Armed robbers said to have made off with a fortune", "Police are hunting two suspects and appealing for witnesses.", "/stock/cover-workspace.jpg"),
            story("Loud bang in the night", "Explosion at a workshop leaves seven cars damaged", "Residents reported a blast in the early hours.", "/stock/product-sneaker.jpg"),
            story("Caught on camera", "Two thieves clear out a supermarket shelf", "The footage has been shared widely online.", "/stock/food-plate.jpg"),
            story("Transport", "New cycle lanes spark a row in the city centre", "Residents and shopkeepers clash over the plans.", "/stock/cover-workspace.jpg"),
            story("Rail", "Weekend chaos: why the lines grind to a halt", "Engineering works knock out several routes at once.", "/stock/property-house.jpg"),
            story("Leisure", "The city's best outdoor pools for a summer cool-off", "Where to take a dip when the heat rolls in.", "/stock/food-plate.jpg"),
          ]),
          { raw: bar("Sport") },
          grid([
            story("Football", "Home side kick off the new season with a win", "A perfect start in front of a sold-out crowd.", "/stock/product-sneaker.jpg"),
            story("Basketball", "City club signs a new center", "The move answers a run of injury worries.", "/stock/cover-workspace.jpg"),
          ]),
        ],
        // Right column (20%): the sidebar widgets.
        end: [
          "news/most-read-list",
          { raw: heading("Latest") },
          ...LATEST,
          { id: "news/weather-strip", wrap: "py-4" },
          { id: "news/opinion-card", wrap: "py-4" },
        ],
      },
      wrap: `${NEWS} py-6`,
    },
    "navigation/footer-nav",
  ],
};
