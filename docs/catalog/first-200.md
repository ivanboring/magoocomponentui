# First 200 Components

The planned first batch for the skeleton component library. Principles:

- **One component per concept.** A podcast card, a movie card, and a product card are three components — each with a focused prop schema. Components are *modestly* configurable (variants, sizes, optional regions) but not generic do-everything shells.
- **Machine-name · atomic type** shown per entry. Atomic types: `atom`, `molecule`, `organism`, `full`.
- Every entry becomes a canonical source folder (`component.def.yml` + `template.html` + optional `behavior.js` + `metadata.yml`) that generates SDC / Code Component / React / Vue + Storybook, with a Drupal paragraph + custom_field mapping.
- The three domains explicitly requested — **Sports/World Cup**, **Video/Media**, **Notifications** — are covered in depth, including the complex ones (single-elimination bracket, live video player with scrubber + transcript, notification center).
- The **9-component proof set** is drawn from this list: `button`, `badge`, `card-grid` (generic slot container), `card-podcast`, `notification-toast`, `accordion`, `tabs`, `bracket-single-elim`, `video-player`.

Counts by domain: Atoms 16 · Navigation 14 · Overlays 12 · Notifications 14 · Cards 20 · Video/Media 18 · Sports/World Cup 22 · Commerce 16 · Editorial 12 · Marketing/CTA 16 · Data 12 · Forms 12 · Social 10 · Layout 6 · **Dashboard 18** = **218**.

**Build order: breadth-first** — an early wave takes a few components from each domain so the preview site shows variety quickly, then depth follows.

---

## Atoms & Primitives (1–16)

1. **button** *(atom)* — label, variant, size, optional leading/trailing icon slot, `href`.
2. **button-icon** *(atom)* — icon-only button with required accessible label.
3. **button-group** *(molecule)* — segmented set of related buttons, active state.
4. **badge** *(atom)* — status/label pill, severity/variant colors.
5. **tag** *(atom)* — content keyword/tag, optional removable.
6. **chip** *(atom)* — compact selectable chip with optional avatar/icon.
7. **avatar** *(atom)* — image with initials fallback, size + shape props.
8. **avatar-group** *(molecule)* — overlapping avatar stack with overflow count.
9. **icon** *(atom)* — inline SVG wrapper, size + accessible label.
10. **rating-stars** *(atom)* — star rating display, configurable max/value/half.
11. **progress-bar** *(atom)* — linear progress with value + optional label.
12. **progress-circle** *(atom)* — circular/radial progress indicator.
13. **spinner** *(atom)* — loading spinner, size + label.
14. **divider** *(atom)* — horizontal/vertical rule with optional centered label.
15. **tooltip** *(molecule)* — hover/focus tooltip attached to any trigger slot.
16. **price-tag** *(atom)* — formatted price, currency, optional strikethrough discount.

## Navigation (17–30)

17. **navbar** *(organism)* — logo, primary links, actions, mobile toggle.
18. **navbar-mega** *(organism)* — navbar with mega-menu dropdown panels.
19. **breadcrumb** *(molecule)* — hierarchical path with separators.
20. **pagination** *(molecule)* — page numbers with prev/next and truncation.
21. **tabs** *(organism)* — horizontal tabbed panels, arrow-key + ARIA tablist.
22. **tabs-vertical** *(organism)* — vertical tab list variant.
23. **sidebar-nav** *(organism)* — collapsible vertical navigation tree.
24. **menu-dropdown** *(molecule)* — click/hover dropdown menu list.
25. **menu-fullscreen** *(organism)* — fullscreen overlay navigation.
26. **stepper** *(molecule)* — horizontal/vertical progress steps with state.
27. **pill-nav** *(molecule)* — pill-style segmented navigation.
28. **back-to-top** *(atom)* — scroll-aware floating scroll-to-top button.
29. **language-switcher** *(molecule)* — locale selector dropdown.
30. **footer-nav** *(organism)* — multi-column footer navigation.

## Overlays & Feedback (31–42)

31. **modal** *(organism)* — centered dialog, backdrop, focus trap, ARIA.
32. **drawer** *(organism)* — slide-in side panel (left/right/top/bottom).
33. **popover** *(molecule)* — anchored floating content panel.
34. **dropdown-menu** *(molecule)* — actionable menu with keyboard nav.
35. **command-palette** *(organism)* — searchable command launcher (⌘K).
36. **cookie-consent** *(molecule)* — consent banner with accept/reject/settings.
37. **confirm-dialog** *(molecule)* — destructive/confirm yes-no modal.
38. **loading-overlay** *(molecule)* — full-area loading veil with spinner.
39. **context-menu** *(molecule)* — right-click contextual menu.
40. **snackbar** *(molecule)* — brief bottom message with single action.
41. **announcement-bar** *(molecule)* — dismissible top announcement strip.
42. **empty-state** *(molecule)* — no-content placeholder with illustration slot + CTA.

## Notifications (43–56)

43. **notification-toast** *(molecule)* — transient corner toast, severity, auto-dismiss, JS stacking.
44. **notification-banner** *(molecule)* — persistent inline banner, severity variants.
45. **notification-list-item** *(molecule)* — list row with icon, actor, read/unread state.
46. **notification-inbox** *(organism)* — dropdown/drawer list of notifications with mark-all-read.
47. **notification-badge** *(atom)* — unread count badge overlaid on an icon.
48. **notification-center** *(organism)* — full center panel with tabs/filters/grouping.
49. **notification-group-header** *(atom)* — date/section header within a list.
50. **notification-empty-state** *(molecule)* — "you're all caught up" placeholder.
51. **push-optin-card** *(molecule)* — prompt to enable browser/push notifications.
52. **in-app-message** *(molecule)* — dismissible in-app promo/announcement message.
53. **activity-feed-item** *(molecule)* — actor–verb–object activity row with timestamp.
54. **mention-item** *(molecule)* — @mention notification with context snippet.
55. **status-indicator** *(atom)* — colored status dot with label (online/away/busy).
56. **alert** *(molecule)* — inline alert, success/error/warning/info, optional dismiss.

## Cards (57–76)

57. **card-blog** *(molecule)* — image, title, excerpt, author + date meta.
58. **card-podcast** *(molecule)* — cover, vertical date, excerpt, inline audio player + scrub.
59. **card-movie** *(molecule)* — poster, rating, genre chips, runtime, year.
60. **card-product** *(molecule)* — image, title, price, rating, add-to-cart.
61. **card-profile** *(molecule)* — avatar, name, role, social links.
62. **card-event** *(molecule)* — date block, title, venue, time, CTA.
63. **card-recipe** *(molecule)* — image, prep time, servings, difficulty.
64. **card-job** *(molecule)* — title, company, location, salary, tags.
65. **card-property** *(molecule)* — image, price, beds/baths, area, location.
66. **card-course** *(molecule)* — thumbnail, progress, lessons, instructor.
67. **card-news** *(molecule)* — headline, category, timestamp, thumbnail.
68. **card-testimonial** *(molecule)* — quote, author, avatar, rating.
69. **card-team-member** *(molecule)* — photo, name, role, hover bio/socials.
70. **card-stat** *(molecule)* — single metric with trend arrow.
71. **card-download** *(molecule)* — filename, type, size, download button.
72. **card-app** *(molecule)* — app icon, name, rating, install button.
73. **card-overlay** *(molecule)* — image with gradient overlay title/CTA.
74. **card-quote** *(molecule)* — large decorative pull-quote card.
75. **card-grid** *(organism)* — generic responsive grid **slot container** for child cards; dynamic column props.
76. **card-pricing** *(organism)* — plan name, price, feature list, CTA, highlight variant.

## Video & Media (77–94)

77. **video-player** *(organism)* — VOD player: play/pause, scrubber, volume, speed, fullscreen.
78. **video-player-live** *(organism)* — live stream player with LIVE badge, viewer count, latency.
79. **video-scrubber** *(molecule)* — timeline scrubber with hover preview thumbnail + buffered range.
80. **video-transcript** *(organism)* — YouTube-style synced transcript, click-to-seek, active-cue highlight.
81. **video-chapters** *(molecule)* — chapter markers list with timestamps + thumbnails.
82. **video-playlist-item** *(molecule)* — thumbnail, title, channel, duration, now-playing state.
83. **video-grid** *(organism)* — responsive grid of video thumbnails with meta.
84. **video-hero** *(organism)* — hero with autoplay/muted background video + overlay content.
85. **live-badge** *(atom)* — animated pulsing LIVE indicator.
86. **media-gallery** *(organism)* — thumbnail strip with large active preview.
87. **image-lightbox** *(organism)* — click-to-zoom modal gallery with prev/next.
88. **image-compare** *(molecule)* — before/after draggable comparison slider.
89. **audio-player** *(molecule)* — standalone audio player with progress + time.
90. **audio-waveform** *(molecule)* — waveform seek visualization.
91. **channel-header** *(organism)* — channel banner, avatar, subscribe, stats.
92. **watch-next-rail** *(organism)* — horizontal "up next" video rail.
93. **captions-toggle** *(atom)* — CC on/off control with language menu.
94. **duration-badge** *(atom)* — video length overlay badge.

## Sports / World Cup (95–116)

95. **bracket-single-elim** *(full)* — single-elimination knockout bracket; nested rounds→matches→teams, winner highlight.
96. **bracket-double-elim** *(full)* — double-elimination bracket with winners/losers paths.
97. **match-card-live** *(molecule)* — live match: minute clock, score, scorers, cards.
98. **match-card-upcoming** *(molecule)* — upcoming fixture: teams, kickoff time, venue.
99. **match-card-result** *(molecule)* — finished match final score + status.
100. **group-standings-table** *(organism)* — group table: P, W, D, L, GF, GA, GD, Pts.
101. **fixtures-list** *(organism)* — fixtures grouped by matchday/date.
102. **league-table** *(organism)* — full standings with form guide + qualification zones.
103. **live-score-ticker** *(organism)* — horizontal auto-scrolling live scores strip.
104. **match-timeline** *(organism)* — goals/cards/subs event timeline for a match.
105. **lineup-formation** *(organism)* — pitch with players positioned by formation.
106. **player-card** *(molecule)* — photo, number, position, nationality, key stats.
107. **team-card** *(molecule)* — crest, name, group, record.
108. **top-scorers-list** *(organism)* — ranked scorers with goals/assists.
109. **match-stats-panel** *(organism)* — possession, shots, comparison bars.
110. **penalty-shootout** *(molecule)* — shootout tracker (scored/missed per kick).
111. **knockout-path** *(organism)* — a team's route through the knockout stage.
112. **matchday-selector** *(molecule)* — horizontal date/round selector.
113. **score-header** *(molecule)* — big match header: crests, score, status/minute.
114. **commentary-feed** *(organism)* — live text commentary stream.
115. **venue-card** *(molecule)* — stadium name, city, capacity, image.
116. **group-stage-grid** *(organism)* — overview grid of all groups.

## Commerce (117–132)

117. **product-grid** *(organism)* — responsive product listing grid.
118. **product-quick-view** *(organism)* — modal product preview with gallery + buy.
119. **cart-drawer** *(organism)* — slide-in cart with line items + totals.
120. **cart-line-item** *(molecule)* — image, title, qty stepper, price, remove.
121. **checkout-summary** *(organism)* — order summary, taxes, totals, CTA.
122. **price-table** *(organism)* — multi-tier feature comparison pricing table.
123. **product-gallery** *(organism)* — main image + thumbnail navigation.
124. **add-to-cart-bar** *(molecule)* — sticky add-to-cart action bar.
125. **filter-sidebar** *(organism)* — faceted filters (price, category, attributes).
126. **sort-dropdown** *(molecule)* — result sorting selector.
127. **coupon-input** *(molecule)* — promo code entry with apply + feedback.
128. **order-tracker** *(organism)* — order status step tracker (placed→delivered).
129. **wishlist-button** *(atom)* — save/favorite heart toggle.
130. **review-item** *(molecule)* — rating, title, body, author, verified badge.
131. **review-summary** *(molecule)* — average rating + per-star breakdown bars.
132. **related-products-rail** *(organism)* — horizontal recommendations rail.

## Editorial / Content (133–144)

133. **article-header** *(organism)* — title, subtitle, meta, hero image.
134. **byline** *(molecule)* — author avatar, name, date, read time.
135. **byline-popup** *(molecule)* — byline with hover author bio card.
136. **pull-quote** *(molecule)* — emphasized inline quotation.
137. **table-of-contents** *(organism)* — sticky in-article TOC with active-section tracking.
138. **reading-progress** *(atom)* — top scroll reading progress bar.
139. **related-articles** *(organism)* — grid/list of related posts.
140. **tag-list** *(molecule)* — list of topic tags/links.
141. **share-bar** *(molecule)* — social share buttons + copy link.
142. **author-bio** *(molecule)* — author bio block with links + follow.
143. **figure-caption** *(atom)* — image with caption and credit.
144. **newsletter-inline** *(molecule)* — inline mid-article newsletter prompt.

## Marketing / CTA (145–160)

145. **hero-centered** *(organism)* — centered headline, subtext, dual CTAs.
146. **hero-split** *(organism)* — text one side, media the other.
147. **hero-image-bg** *(organism)* — full-bleed background image hero.
148. **feature-grid** *(organism)* — icon + title + text feature cards grid.
149. **feature-alternating** *(organism)* — alternating image/text feature rows.
150. **cta-simple** *(molecule)* — headline + single CTA band.
151. **cta-offset-image** *(organism)* — CTA with offset overlapping image.
152. **cta-grid-images** *(organism)* — CTA over image-grid backdrop.
153. **testimonial-slider** *(organism)* — rotating testimonials carousel.
154. **logo-cloud** *(molecule)* — grid of partner/client logos.
155. **stats-band** *(molecule)* — row of headline metrics.
156. **pricing-tiers** *(organism)* — multi-plan pricing section with toggle.
157. **faq-accordion** *(organism)* — expandable FAQ list.
158. **comparison-table** *(organism)* — feature comparison matrix.
159. **countdown-banner** *(molecule)* — countdown timer promo banner (JS).
160. **newsletter-signup** *(molecule)* — email capture block with validation.

## Data Display (161–172)

161. **data-table** *(organism)* — sortable, paginated data table.
162. **stat-card** *(molecule)* — icon, value, delta/trend.
163. **kpi-tile** *(molecule)* — compact KPI tile for dashboards.
164. **timeline-vertical** *(organism)* — vertical event timeline.
165. **timeline-horizontal** *(organism)* — horizontal milestone timeline.
166. **calendar-month** *(organism)* — month grid calendar with events.
167. **calendar-agenda** *(organism)* — agenda/list day view.
168. **gauge** *(molecule)* — radial gauge for a single value/threshold.
169. **sparkline-card** *(molecule)* — metric with inline sparkline trend.
170. **progress-steps** *(molecule)* — labeled multi-step progress indicator.
171. **definition-list** *(molecule)* — term/description key-value pairs.
172. **heatmap-calendar** *(organism)* — contribution-style activity heatmap.

## Forms & Inputs (173–184)

173. **search-bar** *(molecule)* — search input with icon + clear.
174. **search-autocomplete** *(organism)* — search with suggestions dropdown (JS).
175. **filter-bar** *(organism)* — horizontal filter chips/controls with clear-all.
176. **form-field-text** *(atom)* — labeled text input with help + validation.
177. **form-field-select** *(molecule)* — labeled select field.
178. **form-field-checkbox** *(atom)* — checkbox with label + help.
179. **form-field-radio-group** *(molecule)* — radio option group.
180. **form-field-toggle** *(atom)* — on/off switch field.
181. **file-upload-dropzone** *(molecule)* — drag-and-drop file upload with preview (JS).
182. **range-slider** *(molecule)* — single/dual-handle range slider (JS).
183. **multi-step-form** *(organism)* — wizard form with step navigation.
184. **form-validation-summary** *(molecule)* — grouped error summary block.

## Social / Community (185–194)

185. **comment-thread** *(organism)* — nested/threaded comments.
186. **comment-item** *(molecule)* — comment with avatar, body, reactions, reply.
187. **user-profile-header** *(organism)* — banner, avatar, name, stats, follow.
188. **follow-button** *(atom)* — follow/unfollow toggle with count.
189. **reaction-bar** *(molecule)* — emoji reaction selector with counts.
190. **feed-post** *(organism)* — social post: author, media, actions, comments.
191. **poll** *(molecule)* — vote options with live result bars.
192. **leaderboard-row** *(molecule)* — rank, user, score, change indicator.
193. **message-bubble** *(molecule)* — chat bubble, sent/received, timestamp.
194. **presence-list** *(molecule)* — online users list with status dots.

## Layout / Structural (195–200)

195. **section-wrapper** *(full)* — padded section with heading + content slots.
196. **sidebar-layout** *(full)* — content + sidebar two-column responsive layout.
197. **masonry-grid** *(organism)* — masonry/pinterest-style item grid.
198. **accordion** *(organism)* — stacked expandable panels, keyboard + ARIA.
199. **sticky-header** *(organism)* — scroll-aware sticky/condensing header.
200. **footer-columns** *(organism)* — multi-column site footer with newsletter.

## Dashboard (201–218)

Analytics/admin building blocks. Chart components are **skeleton widget shells** (header, legend, period toggle, and a chart container/slot) — the agent supplies the actual chart; the library ships no charting library.

201. **dashboard-shell** *(full)* — sidebar + topbar + responsive widget grid layout.
202. **widget-card** *(organism)* — generic widget container: title, actions, body + footer slots.
203. **metric-tile** *(molecule)* — big number, label, delta, inline sparkline.
204. **metric-comparison** *(molecule)* — current vs previous period with change bars.
205. **chart-card-line** *(organism)* — line-chart widget shell with legend + period toggle.
206. **chart-card-bar** *(organism)* — bar-chart widget shell.
207. **chart-card-area** *(organism)* — stacked/area-chart widget shell.
208. **donut-chart-card** *(organism)* — donut/pie breakdown widget with legend.
209. **funnel-chart** *(organism)* — conversion funnel with per-stage drop-off.
210. **progress-ring-stat** *(molecule)* — radial progress KPI with center value.
211. **goal-progress** *(molecule)* — goal vs actual progress widget.
212. **top-list-widget** *(organism)* — ranked top-N list (pages, products, referrers).
213. **activity-summary** *(organism)* — recent-activity feed widget.
214. **dashboard-toolbar** *(organism)* — filters + date range + export/refresh controls.
215. **date-range-picker** *(molecule)* — presets + custom range selector (JS).
216. **world-map-stat** *(organism)* — geographic distribution map widget shell.
217. **cohort-heatmap** *(organism)* — retention cohort grid heatmap.
218. **widget-empty-state** *(molecule)* — no-data widget placeholder with CTA.

---

## Open questions for you

1. **Priority order** — should the *build* order follow domains (finish all Sports, then Video…) or breadth-first (a few from each domain) so the preview showcases variety early?
2. **Coverage gaps** — anything critical missing for World Cup / video / notifications, or any domain you want deeper (e.g., more commerce, dashboards, auth/account) before we lock the 200?
3. **Configurability line** — e.g., should `card-movie` and `card-tv-show` be one configurable card or two? I've defaulted to *separate components per concept* per your guidance; flag any you'd rather merge.
