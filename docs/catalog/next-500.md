# Next 500 Components

Additional components extending `first-200.md` (218 planned there) — **dedup-checked** so
none repeat that list. Same principles: one component per concept, each modestly
configurable; `machine-name · (atomic type · domain)`. Numbered 1–500 within this doc.

Domains: Travel · Real Estate · Food · Healthcare · Finance · Education · Events · Jobs ·
Automotive · Fashion · Music · Gaming · News · Weather · Maps · Auth · Onboarding · Billing ·
Calendar · Analytics · AI/Chat · Developer · SaaS · Email · Crypto · Nonprofit · Government ·
Fitness · Portfolio · Legal · Community · Search · Feedback · DataViz · UI Utilities.

---

## Travel & Hospitality (1–18)

1. **flight-result-card** *(molecule)* — airline, times, duration, stops, price.
2. **flight-search-summary** *(molecule)* — route, dates, passengers, edit.
3. **hotel-result-card** *(molecule)* — image, rating, amenities, price/night.
4. **room-type-card** *(molecule)* — room photo, beds, perks, rate.
5. **booking-summary** *(organism)* — dates, guests, price breakdown, CTA.
6. **itinerary-timeline** *(organism)* — day-by-day trip schedule.
7. **destination-card** *(molecule)* — place photo, name, teaser, from-price.
8. **seat-map** *(organism)* — selectable aircraft seat grid.
9. **boarding-pass** *(molecule)* — flight, gate, seat, barcode.
10. **price-calendar** *(organism)* — month grid of fares by day.
11. **amenities-list** *(molecule)* — icon+label grid of amenities.
12. **trip-map** *(organism)* — route/pins overview map shell.
13. **tour-card** *(molecule)* — excursion image, duration, price, rating.
14. **car-rental-card** *(molecule)* — vehicle, seats, transmission, price.
15. **loyalty-tier-card** *(molecule)* — status, points, perks progress.
16. **check-in-stepper** *(molecule)* — online check-in steps.
17. **baggage-allowance** *(molecule)* — cabin/checked allowance summary.
18. **review-score-badge** *(atom)* — big score + label (e.g. 8.9 Fabulous).

## Real Estate (19–34)

19. **listing-hero** *(organism)* — property gallery hero + key facts.
20. **mortgage-calculator** *(organism)* — inputs + monthly result.
21. **floor-plan-viewer** *(organism)* — floor plan with room tags.
22. **agent-contact-card** *(molecule)* — agent photo, phone, message.
23. **open-house-schedule** *(molecule)* — upcoming viewing slots.
24. **property-facts-grid** *(molecule)* — beds/baths/area/year tiles.
25. **price-history** *(organism)* — past prices list/chart shell.
26. **neighborhood-stats** *(organism)* — walk/transit/school scores.
27. **saved-search-alert** *(molecule)* — criteria + notify toggle.
28. **affordability-meter** *(molecule)* — income vs price gauge.
29. **listing-status-badge** *(atom)* — for-sale/pending/sold pill.
30. **property-compare** *(organism)* — side-by-side property table.
31. **virtual-tour-embed** *(organism)* — 360/tour player shell.
32. **map-search-panel** *(organism)* — map + result list combo.
33. **tour-request-form** *(molecule)* — schedule-a-tour capture.
34. **school-district-card** *(molecule)* — nearby schools + ratings.

## Food & Restaurant (35–50)

35. **menu-item-row** *(molecule)* — dish name, description, price, image.
36. **menu-section** *(organism)* — titled group of menu items.
37. **restaurant-card** *(molecule)* — cuisine, rating, delivery time.
38. **reservation-widget** *(organism)* — date/time/party booking.
39. **delivery-tracker** *(organism)* — order status map + ETA.
40. **dish-detail** *(organism)* — photo, options, add-to-order.
41. **dietary-badges** *(atom)* — vegan/gluten-free/spicy icons.
42. **nutrition-facts** *(molecule)* — calories/macros panel.
43. **table-availability** *(molecule)* — time-slot chips.
44. **cuisine-filter** *(molecule)* — cuisine chip filter bar.
45. **chef-card** *(molecule)* — chef photo, bio, specialty.
46. **combo-builder** *(organism)* — build-your-meal selector.
47. **tip-selector** *(molecule)* — preset/custom tip buttons.
48. **allergen-list** *(molecule)* — allergen icons + notes.
49. **order-item-row** *(molecule)* — qty, item, modifiers, price.
50. **loyalty-stamp-card** *(molecule)* — punch-card progress.

## Healthcare & Medical (51–66)

51. **doctor-card** *(molecule)* — photo, specialty, rating, book.
52. **appointment-booker** *(organism)* — provider + slot picker.
53. **symptom-checker-step** *(molecule)* — question + options.
54. **prescription-card** *(molecule)* — medication, dosage, refills.
55. **lab-result-row** *(molecule)* — test, value, range, flag.
56. **vitals-tile** *(molecule)* — metric with normal range.
57. **medication-schedule** *(organism)* — daily dose timeline.
58. **health-timeline** *(organism)* — visits/events history.
59. **insurance-card** *(molecule)* — plan, member id, coverage.
60. **telehealth-waiting-room** *(organism)* — pre-call status.
61. **clinic-locator** *(organism)* — map + clinic list.
62. **consent-form** *(molecule)* — consent text + signature.
63. **care-team-list** *(molecule)* — providers with roles.
64. **dosage-calculator** *(molecule)* — weight-based dose result.
65. **patient-header** *(organism)* — patient banner + key info.
66. **triage-badge** *(atom)* — severity-level pill.

## Finance & Banking (67–82)

67. **account-balance-card** *(molecule)* — balance, account, trend.
68. **transaction-row** *(molecule)* — merchant, date, amount, category.
69. **transaction-list** *(organism)* — grouped transactions.
70. **spending-breakdown** *(organism)* — category donut shell + legend.
71. **budget-progress** *(molecule)* — spent vs budget bar.
72. **transfer-form** *(organism)* — from/to/amount transfer.
73. **card-wallet** *(molecule)* — payment card visual.
74. **statement-row** *(molecule)* — period, balance, download.
75. **credit-score-gauge** *(molecule)* — score dial + band.
76. **holding-row** *(molecule)* — ticker, shares, value, change.
77. **portfolio-summary** *(organism)* — total value + allocation.
78. **currency-converter** *(molecule)* — amount + rate result.
79. **bill-pay-card** *(molecule)* — payee, due date, amount.
80. **savings-goal** *(molecule)* — goal progress ring.
81. **interest-calculator** *(organism)* — principal/rate/term result.
82. **fraud-alert-banner** *(molecule)* — suspicious-activity notice.

## Education & LMS (83–98)

83. **course-hero** *(organism)* — title, instructor, enroll, stats.
84. **lesson-list** *(organism)* — modular lessons with progress.
85. **lesson-row** *(molecule)* — title, duration, complete state.
86. **quiz-question** *(molecule)* — question + answer options.
87. **quiz-result** *(organism)* — score + review answers.
88. **course-progress** *(molecule)* — % complete + next lesson.
89. **certificate-card** *(molecule)* — completion certificate.
90. **instructor-card** *(molecule)* — bio, rating, courses.
91. **flashcard** *(molecule)* — flippable term/definition.
92. **assignment-card** *(molecule)* — due date, status, submit.
93. **grade-table** *(organism)* — assignments + grades.
94. **discussion-thread-edu** *(organism)* — course Q&A.
95. **syllabus-accordion** *(organism)* — expandable syllabus.
96. **video-lesson-player** *(organism)* — player + notes + transcript.
97. **skill-badge** *(atom)* — earned skill token.
98. **enrollment-cta** *(molecule)* — price + enroll button.

## Events & Ticketing (99–114)

99. **event-hero** *(organism)* — banner, date, venue, tickets CTA.
100. **ticket-card** *(molecule)* — tier, price, quantity.
101. **ticket-selector** *(organism)* — tiers + quantity + total.
102. **seat-picker-venue** *(organism)* — venue seat selection.
103. **event-schedule** *(organism)* — agenda by time/track.
104. **session-card** *(molecule)* — talk title, speaker, time.
105. **speaker-card** *(molecule)* — photo, name, session.
106. **countdown-event** *(molecule)* — days/hours to event.
107. **venue-info** *(molecule)* — address, map, parking.
108. **e-ticket** *(molecule)* — QR ticket with details.
109. **lineup-poster** *(organism)* — festival lineup grid.
110. **rsvp-widget** *(molecule)* — going/maybe/no + count.
111. **sponsor-wall** *(molecule)* — tiered sponsor logos.
112. **add-to-calendar** *(atom)* — calendar dropdown button.
113. **waitlist-form** *(molecule)* — join-waitlist capture.
114. **order-confirmation-ticket** *(organism)* — purchase summary.

## Jobs & Careers (115–128)

115. **job-hero** *(organism)* — role, company, apply CTA.
116. **job-detail** *(organism)* — description, requirements, benefits.
117. **application-form** *(organism)* — resume + fields.
118. **application-status** *(molecule)* — pipeline stage tracker.
119. **salary-range-badge** *(atom)* — comp range pill.
120. **company-culture-card** *(molecule)* — perks/values.
121. **candidate-card** *(molecule)* — recruiter view of applicant.
122. **resume-upload** *(molecule)* — drag-drop resume + parse.
123. **saved-jobs-list** *(organism)* — bookmarked roles.
124. **job-filter-panel** *(organism)* — role/type/location filters.
125. **interview-schedule** *(molecule)* — upcoming interview slots.
126. **skills-match-meter** *(molecule)* — fit % vs requirements.
127. **referral-card** *(molecule)* — refer-a-friend widget.
128. **benefits-grid** *(organism)* — icon+label benefits.

## Automotive (129–142)

129. **vehicle-listing-card** *(molecule)* — car photo, specs, price.
130. **vehicle-detail-hero** *(organism)* — gallery + key specs.
131. **spec-comparison** *(organism)* — trim/spec compare table.
132. **finance-calculator-auto** *(organism)* — loan/lease result.
133. **trade-in-estimator** *(molecule)* — value estimate form.
134. **dealer-card** *(molecule)* — dealer info + contact.
135. **test-drive-booker** *(molecule)* — schedule test drive.
136. **color-picker-vehicle** *(molecule)* — exterior color swatches.
137. **feature-list-auto** *(molecule)* — equipment checklist.
138. **mileage-badge** *(atom)* — odometer/efficiency pill.
139. **ev-range-meter** *(molecule)* — battery range gauge.
140. **service-history** *(organism)* — maintenance records.
141. **build-your-own** *(organism)* — configurator steps.
142. **warranty-card** *(molecule)* — coverage summary.

## Fashion & Beauty (143–156)

143. **lookbook-grid** *(organism)* — editorial outfit grid.
144. **product-card-apparel** *(molecule)* — item, price, color dots.
145. **size-selector** *(molecule)* — size chips + guide link.
146. **size-guide** *(organism)* — measurement table.
147. **color-swatch-row** *(molecule)* — selectable color swatches.
148. **outfit-builder** *(organism)* — mix-and-match pieces.
149. **shade-finder** *(organism)* — beauty shade matcher.
150. **fabric-detail** *(molecule)* — material + care.
151. **model-info** *(atom)* — "model wears size" note.
152. **wishlist-grid** *(organism)* — saved fashion items.
153. **trend-carousel** *(organism)* — trending looks slider.
154. **fit-quiz-step** *(molecule)* — sizing question.
155. **lookbook-hero** *(organism)* — campaign hero.
156. **restock-notify** *(molecule)* — notify-when-available.

## Music & Audio (157–172)

157. **now-playing-bar** *(organism)* — track, controls, progress.
158. **track-row** *(molecule)* — title, artist, duration, play.
159. **album-card** *(molecule)* — cover, artist, year.
160. **playlist-header** *(organism)* — cover, title, play-all.
161. **artist-hero** *(organism)* — banner, follow, monthly listeners.
162. **lyrics-panel** *(organism)* — synced lyrics view.
163. **queue-list** *(organism)* — up-next tracks.
164. **audio-visualizer** *(molecule)* — waveform/bars shell.
165. **podcast-episode-row** *(molecule)* — episode, duration, play.
166. **mini-player** *(molecule)* — compact player widget.
167. **equalizer-panel** *(molecule)* — band sliders.
168. **genre-tile** *(atom)* — colored genre card.
169. **concert-card** *(molecule)* — artist tour date.
170. **song-credits** *(molecule)* — writers/producers list.
171. **volume-control** *(atom)* — slider + mute.
172. **sleep-timer** *(molecule)* — countdown to stop.

## Gaming & Esports (173–188)

173. **game-card** *(molecule)* — cover, genre, rating, price.
174. **game-hero** *(organism)* — trailer, buy, specs.
175. **achievement-row** *(molecule)* — icon, name, rarity, progress.
176. **leaderboard-esports** *(organism)* — ranked players/teams.
177. **match-lobby** *(organism)* — players ready-state.
178. **player-profile-game** *(organism)* — stats, rank, badges.
179. **loadout-card** *(molecule)* — weapons/gear setup.
180. **tournament-bracket-esports** *(full)* — esports bracket layout.
181. **server-status-list** *(molecule)* — region ping/status.
182. **quest-card** *(molecule)* — objective, reward, progress.
183. **skin-item** *(molecule)* — cosmetic item card.
184. **rank-badge-game** *(atom)* — tier emblem.
185. **stream-card** *(molecule)* — live streamer thumbnail.
186. **party-invite** *(molecule)* — invite to squad.
187. **loot-reveal** *(molecule)* — reward reveal card.
188. **controls-legend** *(molecule)* — key/button mapping.

## News & Magazine (189–202)

189. **breaking-news-bar** *(molecule)* — urgent alert strip.
190. **article-lead** *(organism)* — big lead story block.
191. **story-list-item** *(molecule)* — headline, thumb, time.
192. **opinion-card** *(molecule)* — columnist piece.
193. **live-blog-entry** *(molecule)* — timestamped update.
194. **photo-essay** *(organism)* — captioned image sequence.
195. **topic-header** *(organism)* — section masthead.
196. **quote-card-news** *(molecule)* — pull quote with source.
197. **fact-box** *(molecule)* — key facts sidebar.
198. **correction-notice** *(molecule)* — editorial correction.
199. **paywall-prompt** *(organism)* — subscribe-to-read gate.
200. **election-result-card** *(organism)* — vote tallies + bars.
201. **most-read-list** *(molecule)* — ranked popular stories.
202. **weather-strip** *(molecule)* — compact forecast bar.

## Weather & Environment (203–214)

203. **current-weather** *(organism)* — temp, condition, location.
204. **hourly-forecast** *(organism)* — scrollable hourly strip.
205. **daily-forecast** *(organism)* — 7-day list.
206. **weather-map** *(organism)* — radar map shell.
207. **air-quality-index** *(molecule)* — AQI gauge + advice.
208. **uv-index** *(molecule)* — UV level meter.
209. **wind-compass** *(molecule)* — direction + speed dial.
210. **precipitation-chart** *(molecule)* — rain probability bars.
211. **sunrise-sunset** *(molecule)* — daylight arc.
212. **severe-alert-card** *(molecule)* — storm warning.
213. **pollen-forecast** *(molecule)* — allergen levels.
214. **tide-table** *(molecule)* — high/low tide times.

## Maps & Location (215–226)

215. **map-hero** *(organism)* — full-bleed map with search.
216. **location-pin-card** *(molecule)* — place popup card.
217. **directions-panel** *(organism)* — turn-by-turn steps.
218. **place-result-row** *(molecule)* — name, distance, rating.
219. **store-locator** *(organism)* — map + store list.
220. **route-summary** *(molecule)* — distance, time, mode.
221. **geofence-toggle** *(molecule)* — area-alert setting.
222. **nearby-grid** *(organism)* — nearby places grid.
223. **map-legend** *(molecule)* — symbol key.
224. **travel-mode-switch** *(atom)* — drive/walk/transit toggle.
225. **coordinate-badge** *(atom)* — lat/long chip.
226. **distance-slider** *(molecule)* — radius filter.

## Auth & Account (227–242)

227. **login-form** *(organism)* — email/password + social.
228. **signup-form** *(organism)* — register fields + terms.
229. **social-login-buttons** *(molecule)* — provider buttons.
230. **forgot-password** *(molecule)* — reset request form.
231. **otp-input** *(molecule)* — one-time-code fields.
232. **two-factor-setup** *(organism)* — 2FA enable flow.
233. **password-strength** *(molecule)* — strength meter + rules.
234. **account-menu** *(molecule)* — avatar dropdown.
235. **profile-settings** *(organism)* — edit profile form.
236. **session-list** *(organism)* — active devices/sessions.
237. **email-verify-banner** *(molecule)* — verify prompt.
238. **magic-link-sent** *(molecule)* — check-your-email state.
239. **role-permissions** *(organism)* — role toggle matrix.
240. **delete-account** *(molecule)* — danger-zone confirm.
241. **avatar-uploader** *(molecule)* — crop + upload avatar.
242. **consent-preferences** *(organism)* — privacy toggles.

## Onboarding & System States (243–256)

243. **welcome-modal** *(organism)* — first-run welcome.
244. **onboarding-checklist** *(organism)* — setup tasks + progress.
245. **feature-tour-tooltip** *(molecule)* — guided coachmark.
246. **progress-dots** *(atom)* — carousel/step dots.
247. **empty-inbox** *(molecule)* — no-messages state.
248. **no-results** *(molecule)* — search empty state.
249. **error-404** *(organism)* — not-found page block.
250. **error-500** *(organism)* — server-error block.
251. **maintenance-mode** *(organism)* — down-for-maintenance.
252. **offline-banner** *(molecule)* — no-connection notice.
253. **loading-skeleton-card** *(molecule)* — placeholder shimmer.
254. **permission-request** *(molecule)* — grant-access prompt.
255. **success-state** *(organism)* — completed confirmation.
256. **upgrade-prompt** *(molecule)* — hit-a-limit upsell.

## Pricing & Billing (257–272)

257. **pricing-toggle** *(molecule)* — monthly/annual switch.
258. **plan-column** *(organism)* — single plan column in a table.
259. **feature-matrix** *(organism)* — plans × features grid.
260. **usage-meter** *(molecule)* — quota used vs limit.
261. **invoice-row** *(molecule)* — date, amount, status, download.
262. **invoice-detail** *(organism)* — line items + totals.
263. **payment-method-card** *(molecule)* — saved card + edit.
264. **add-payment-method** *(molecule)* — card entry form.
265. **subscription-summary** *(organism)* — plan, renewal, manage.
266. **proration-notice** *(molecule)* — mid-cycle change note.
267. **discount-banner** *(molecule)* — promo/coupon strip.
268. **tax-id-form** *(molecule)* — VAT/tax entry.
269. **billing-history** *(organism)* — invoices list.
270. **seat-management** *(organism)* — team seats add/remove.
271. **cancel-flow** *(organism)* — retention/cancel steps.
272. **credit-balance** *(molecule)* — account credits tile.

## Calendar & Scheduling (273–286)

273. **calendar-week-view** *(organism)* — 7-day time grid.
274. **calendar-day-view** *(organism)* — single-day hours.
275. **mini-calendar** *(molecule)* — compact month picker.
276. **booking-date-range** *(molecule)* — start/end range picker.
277. **time-slot-grid** *(organism)* — bookable slots.
278. **availability-scheduler** *(organism)* — set weekly availability.
279. **event-quick-create** *(molecule)* — inline new-event popover.
280. **recurring-rule** *(molecule)* — repeat-frequency builder.
281. **timezone-picker** *(molecule)* — timezone select.
282. **meeting-scheduler** *(organism)* — propose/confirm times.
283. **appointment-slot** *(molecule)* — single bookable slot.
284. **calendar-event-chip** *(atom)* — event pill in a grid.
285. **resource-timeline** *(organism)* — bookings per resource.
286. **shift-planner** *(organism)* — staff shift grid.

## Analytics & Reporting (287–300)

287. **report-header** *(organism)* — title, range, export.
288. **period-comparison** *(molecule)* — this vs previous period.
289. **conversion-funnel-report** *(organism)* — stage drop-off.
290. **cohort-table** *(organism)* — retention cohort grid.
291. **attribution-breakdown** *(organism)* — channel contribution.
292. **segment-builder** *(organism)* — audience rule builder.
293. **report-filter-bar** *(organism)* — dimensions/measures filters.
294. **export-panel** *(molecule)* — format + schedule export.
295. **scheduled-report-row** *(molecule)* — recurring report entry.
296. **realtime-counter** *(molecule)* — live active-users number.
297. **top-events-list** *(organism)* — ranked events/pages.
298. **retention-curve** *(organism)* — retention over time shell.
299. **anomaly-callout** *(molecule)* — spike/drop flag.
300. **kpi-scorecard** *(organism)* — grid of target vs actual.

## AI & Chat (301–314)

301. **chat-thread** *(organism)* — conversation transcript.
302. **chat-message-ai** *(molecule)* — assistant message bubble.
303. **chat-composer** *(molecule)* — input, attach, send.
304. **prompt-suggestions** *(molecule)* — starter prompt chips.
305. **streaming-response** *(molecule)* — typing/stream indicator.
306. **model-picker** *(molecule)* — model select dropdown.
307. **token-usage** *(molecule)* — usage/cost meter.
308. **citation-list** *(molecule)* — sources with links.
309. **tool-call-card** *(molecule)* — tool invocation + result.
310. **assistant-hero** *(organism)* — landing prompt + examples.
311. **feedback-thumbs** *(atom)* — up/down response rating.
312. **conversation-list** *(organism)* — past chats sidebar.
313. **code-block-ai** *(molecule)* — code with copy + run.
314. **image-generation-card** *(molecule)* — prompt + generated image.

## Developer & API (315–328)

315. **endpoint-row** *(molecule)* — method, path, summary.
316. **api-method-badge** *(atom)* — GET/POST/PUT pill.
317. **code-sample-tabs** *(organism)* — multi-language snippets.
318. **request-response-viewer** *(organism)* — request + response panes.
319. **api-key-card** *(molecule)* — key, scope, reveal/rotate.
320. **rate-limit-meter** *(molecule)* — calls used vs limit.
321. **webhook-row** *(molecule)* — event, url, status.
322. **changelog-entry** *(molecule)* — version, date, notes.
323. **status-service-row** *(molecule)* — service, uptime, state.
324. **version-selector** *(molecule)* — API/docs version dropdown.
325. **schema-table** *(organism)* — params/fields with types.
326. **try-it-console** *(organism)* — live request builder.
327. **sdk-install-card** *(molecule)* — install command + copy.
328. **error-code-table** *(organism)* — codes + meanings.

## SaaS Shell & Settings (329–342)

329. **app-sidebar** *(organism)* — primary app navigation.
330. **app-topbar** *(organism)* — search, notifications, account.
331. **workspace-switcher** *(molecule)* — org/workspace dropdown.
332. **settings-nav** *(organism)* — settings section navigation.
333. **settings-section** *(organism)* — titled group + description.
334. **toggle-setting-row** *(molecule)* — label + switch + help.
335. **select-setting-row** *(molecule)* — label + select + help.
336. **danger-zone** *(organism)* — destructive actions block.
337. **team-member-row** *(molecule)* — member, role, actions.
338. **invite-member** *(molecule)* — email + role invite.
339. **api-token-list** *(organism)* — tokens with scopes.
340. **billing-tab** *(organism)* — plan + payment summary.
341. **notification-preferences** *(organism)* — channel toggles.
342. **profile-completeness** *(molecule)* — setup progress nudge.

## Email & Messaging (343–356)

343. **inbox-list** *(organism)* — message list with previews.
344. **email-row** *(molecule)* — sender, subject, snippet, time.
345. **email-reader** *(organism)* — full message view.
346. **compose-email** *(organism)* — to/subject/body editor.
347. **thread-message** *(molecule)* — one message in a thread.
348. **label-chip** *(atom)* — colored email label.
349. **attachment-row** *(molecule)* — file name, size, download.
350. **folder-nav** *(molecule)* — mailbox folder list.
351. **mailbox-folder** *(molecule)* — folder with unread count.
352. **snooze-menu** *(molecule)* — snooze-until options.
353. **signature-block** *(molecule)* — email signature.
354. **bulk-actions-bar** *(molecule)* — select + batch actions.
355. **read-receipt** *(atom)* — read/delivered indicator.
356. **newsletter-template** *(organism)* — email layout block.

## Crypto & Web3 (357–370)

357. **wallet-connect** *(molecule)* — connect-wallet button/modal.
358. **token-balance-row** *(molecule)* — token, amount, value.
359. **token-price-card** *(molecule)* — price, change, sparkline.
360. **swap-widget** *(organism)* — token swap interface.
361. **transaction-hash** *(atom)* — truncated hash + copy.
362. **gas-fee-selector** *(molecule)* — slow/normal/fast fees.
363. **nft-card** *(molecule)* — artwork, name, price.
364. **nft-gallery** *(organism)* — grid of NFTs.
365. **staking-card** *(molecule)* — stake, APY, rewards.
366. **portfolio-allocation-crypto** *(organism)* — holdings donut shell.
367. **network-switcher** *(molecule)* — chain select dropdown.
368. **price-chart-crypto** *(organism)* — candlestick shell + ranges.
369. **defi-pool-row** *(molecule)* — pair, TVL, APR.
370. **mint-widget** *(organism)* — quantity + mint button.

## Nonprofit & Fundraising (371–382)

371. **donation-form** *(organism)* — amount, frequency, pay.
372. **donation-amount-picker** *(molecule)* — preset amount buttons.
373. **fundraiser-progress** *(molecule)* — goal thermometer.
374. **campaign-card** *(molecule)* — cause image, raised, goal.
375. **impact-stat** *(molecule)* — "$50 = 10 meals".
376. **donor-wall** *(organism)* — recent donors list.
377. **volunteer-signup** *(organism)* — role + shift signup.
378. **recurring-donation-toggle** *(molecule)* — one-time vs monthly.
379. **cause-hero** *(organism)* — mission banner + donate.
380. **pledge-card** *(molecule)* — pledge amount + confirm.
381. **transparency-breakdown** *(molecule)* — where funds go.
382. **petition-signer** *(molecule)* — sign + count.

## Government & Civic (383–394)

383. **service-finder** *(organism)* — find-a-service search.
384. **form-wizard-gov** *(organism)* — multi-step official form.
385. **eligibility-checker** *(organism)* — qualify questionnaire.
386. **document-upload-gov** *(molecule)* — upload required docs.
387. **appointment-gov** *(molecule)* — book an office visit.
388. **notice-banner-official** *(molecule)* — public notice strip.
389. **representative-card** *(molecule)* — official, district, contact.
390. **ballot-measure** *(organism)* — measure summary + arguments.
391. **public-record-row** *(molecule)* — record, date, access.
392. **accessibility-statement** *(organism)* — a11y compliance page.
393. **translate-bar** *(molecule)* — language selection strip.
394. **feedback-gov** *(molecule)* — report-an-issue form.

## Fitness & Wellness (395–408)

395. **workout-card** *(molecule)* — title, duration, level.
396. **exercise-row** *(molecule)* — exercise, sets, reps.
397. **activity-ring** *(molecule)* — move/exercise/stand rings.
398. **workout-timer** *(molecule)* — interval/rest timer.
399. **progress-photo** *(molecule)* — before/after photo tile.
400. **meal-plan-day** *(organism)* — daily meals plan.
401. **calorie-tracker** *(organism)* — intake vs goal.
402. **water-intake** *(molecule)* — hydration tracker.
403. **sleep-summary** *(molecule)* — sleep stages/hours.
404. **heart-rate-zone** *(molecule)* — HR zone meter.
405. **streak-card** *(molecule)* — day-streak counter.
406. **body-metrics** *(organism)* — weight/BMI/measurements.
407. **challenge-card** *(molecule)* — fitness challenge join.
408. **rep-counter** *(atom)* — increment rep count.

## Portfolio & Agency (409–422)

409. **project-case-study** *(organism)* — problem/solution/result.
410. **portfolio-grid** *(organism)* — filterable work grid.
411. **work-tile** *(molecule)* — thumbnail + title + hover.
412. **service-card** *(molecule)* — service, blurb, icon.
413. **team-grid** *(organism)* — team member grid.
414. **agency-process** *(organism)* — numbered process steps.
415. **client-marquee** *(molecule)* — scrolling client logos.
416. **testimonial-spotlight** *(organism)* — featured quote + client.
417. **award-row** *(molecule)* — award, year, category.
418. **contact-hero** *(organism)* — big contact CTA + form.
419. **capabilities-list** *(molecule)* — service checklist.
420. **bio-hero** *(organism)* — personal intro + portrait.
421. **showreel-embed** *(organism)* — video reel block.
422. **pricing-quote** *(molecule)* — request-a-quote card.

## Legal & Compliance (423–432)

423. **terms-section** *(organism)* — numbered legal section.
424. **consent-checkbox-legal** *(molecule)* — agree + link.
425. **cookie-preferences** *(organism)* — granular category toggles.
426. **policy-toc** *(organism)* — legal doc table of contents.
427. **signature-pad** *(molecule)* — draw/e-sign field.
428. **disclosure-accordion** *(organism)* — expandable disclosures.
429. **age-gate** *(organism)* — verify age to enter.
430. **data-request-form** *(molecule)* — GDPR/DSAR request.
431. **license-badge** *(atom)* — license/compliance mark.
432. **compliance-checklist** *(organism)* — requirement checklist.

## Community & Forum (433–446)

433. **thread-list** *(organism)* — forum topics list.
434. **thread-row** *(molecule)* — title, replies, last activity.
435. **post-detail** *(organism)* — post + author + actions.
436. **reply-composer** *(molecule)* — reply editor.
437. **vote-control** *(molecule)* — up/down + score.
438. **user-flair** *(atom)* — role/badge next to name.
439. **subforum-card** *(molecule)* — category, topics, posts.
440. **pinned-post** *(molecule)* — highlighted sticky post.
441. **moderator-tools** *(molecule)* — lock/pin/remove actions.
442. **reputation-card** *(molecule)* — karma/points summary.
443. **tag-filter-forum** *(molecule)* — topic tag filter.
444. **online-members** *(molecule)* — who's-online list.
445. **report-post** *(molecule)* — flag content form.
446. **badge-showcase** *(organism)* — earned community badges.

## Search & Discovery (447–460)

447. **search-hero** *(organism)* — prominent search + suggestions.
448. **faceted-results** *(organism)* — filters + result grid.
449. **filter-chip-row** *(molecule)* — active filter chips.
450. **sort-and-view** *(molecule)* — sort + grid/list toggle.
451. **result-card-generic** *(molecule)* — title, snippet, meta.
452. **did-you-mean** *(molecule)* — spelling suggestion.
453. **recent-searches** *(molecule)* — history chips.
454. **trending-searches** *(molecule)* — popular queries.
455. **autocomplete-panel** *(organism)* — grouped suggestions.
456. **no-results-suggestions** *(organism)* — empty + alternatives.
457. **saved-filters** *(molecule)* — saved query presets.
458. **range-facet** *(molecule)* — min/max range filter.
459. **map-list-toggle** *(molecule)* — switch results view.
460. **search-result-highlight** *(atom)* — matched-term highlight.

## Feedback & Surveys (461–472)

461. **nps-survey** *(organism)* — 0–10 recommend scale.
462. **rating-prompt** *(molecule)* — rate-this-experience.
463. **star-rating-input** *(molecule)* — interactive stars.
464. **emoji-reaction-survey** *(molecule)* — emoji sentiment.
465. **feedback-widget** *(molecule)* — floating feedback launcher.
466. **survey-question** *(molecule)* — single survey item.
467. **survey-progress** *(molecule)* — step X of Y bar.
468. **poll-inline** *(molecule)* — quick inline poll.
469. **thumbs-feedback** *(atom)* — helpful yes/no.
470. **testimonial-collect** *(organism)* — request a testimonial.
471. **bug-report-form** *(organism)* — report + attach.
472. **csat-score** *(molecule)* — satisfaction summary.

## DataViz Shells (473–486)

473. **line-chart-shell** *(organism)* — line chart container.
474. **bar-chart-shell** *(organism)* — bar chart container.
475. **area-chart-shell** *(organism)* — area/stacked container.
476. **pie-chart-shell** *(organism)* — pie/donut container.
477. **scatter-plot-shell** *(organism)* — scatter container.
478. **radar-chart-shell** *(organism)* — radar/spider container.
479. **candlestick-shell** *(organism)* — OHLC container.
480. **sankey-shell** *(organism)* — flow diagram container.
481. **treemap-shell** *(organism)* — nested rectangles container.
482. **bubble-chart-shell** *(organism)* — bubble container.
483. **chart-legend** *(molecule)* — series legend.
484. **chart-tooltip** *(molecule)* — hover value tooltip.
485. **axis-controls** *(molecule)* — range/scale controls.
486. **data-point-callout** *(atom)* — annotated point marker.

## UI Utilities (Advanced) (487–500)

487. **split-pane** *(organism)* — resizable two-pane layout.
488. **resizable-panel** *(molecule)* — draggable panel edge.
489. **virtual-list** *(organism)* — windowed long-list shell.
490. **infinite-scroll-sentinel** *(atom)* — load-more trigger.
491. **scroll-spy-nav** *(molecule)* — section-tracking side nav.
492. **copy-to-clipboard** *(atom)* — copy button with feedback.
493. **color-picker-input** *(molecule)* — swatch + hex input.
494. **rich-text-toolbar** *(molecule)* — formatting controls.
495. **code-editor-shell** *(organism)* — editor with gutter/tabs.
496. **tree-view** *(organism)* — nested expandable tree.
497. **transfer-list** *(organism)* — dual-list move picker.
498. **rating-slider** *(molecule)* — slider with value bubble.
499. **segmented-control** *(molecule)* — iOS-style segment switch.
500. **floating-action-button** *(atom)* — primary floating action.

---

## Notes for the authoring model

- These extend `first-200.md`; total planned catalog ≈ **718**. Names here were chosen to
  not collide with that list.
- Keep authoring **breadth-first** — take a few from each domain before going deep, so the
  preview shows variety.
- Relate parent/child where real (e.g. `menu-section` contains `menu-item-row`;
  `inbox-list` contains `email-row`; `faceted-results` uses `filter-chip-row`) via
  `relationships` in metadata — the catalog derives the reverse link.
- Chart/`*-shell` components ship the container, controls, and legend only — the agent
  supplies the actual chart; no charting library is bundled.
