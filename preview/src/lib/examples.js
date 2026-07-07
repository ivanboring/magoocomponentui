/**
 * Example pages: realistic compositions of catalog components, shown on /examples so an
 * agent (or human) can see how the skeletons combine into a full page across the four themes.
 *
 * Each example lives in its own module under ./examples/ (one file per example, default-
 * exporting a { id, label, description, components[] } page object). This file just collects
 * them, in display order, into EXAMPLE_PAGES — consumed by preview/src/pages/examples.astro.
 *
 * A `components[]` item is one of:
 *   "category/name"                a catalog component (its curated default example)
 *   { id, args }                   a component rendered with prop overrides merged over its default
 *   { id, slots: { name: item } }  slot a child item's rendered HTML into a component's named slot
 *   { id, wrap }                   a component placed inside a CSS container class
 *   { raw }                        a raw tokenized-Tailwind HTML blob (heading, body copy)
 *   { split: { ratio, gap, stack, start, end }, wrap }   two items in layout/split-view
 *   { section: [items], title, padding }                 items wrapped in layout/section-wrapper
 * (These shapes are implemented in examples.astro's renderItem.)
 */
import blogPost from "./examples/blog-post.js";
import marketingLanding from "./examples/marketing-landing.js";
import newsHome from "./examples/news-home.js";
import videoLesson from "./examples/video-lesson.js";

export const EXAMPLE_PAGES = [blogPost, marketingLanding, newsHome, videoLesson];
