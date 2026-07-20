# Extra 200 Components

Net-new components beyond the 718-item plan (`first-200.md` + `next-500.md`), all built. These open
**new domains** rather than duplicate existing categories — e.g. `finance` already covers personal
banking, so this adds **trading/wealth**; `jobs` is seeker-side, so this adds employer-side **HR**;
`food` is discovery/delivery, so this adds **restaurant POS/kitchen**. Same authoring shape as the
rest of the catalog (`component.def.yml` + `template.html` + optional `behavior.js` + `metadata.yml`
+ `examples/`), tokenized-Tailwind only, generating every target.

Build order: waves of 3 clusters (~42) each, verified in-browser per wave.

---

## CRM & Sales (`crm`, 15)
1. **pipeline-board** *(organism)* — kanban of deal stages.
2. **deal-card** *(molecule)* — opportunity value, stage, owner.
3. **contact-card** *(molecule)* — person, company, channels.
4. **lead-score-badge** *(atom)* — hot/warm/cold score.
5. **activity-timeline** *(organism)* — calls/emails/notes log.
6. **quote-builder** *(organism)* — line items + totals.
7. **sales-forecast** *(organism)* — quota vs pipeline.
8. **deal-stage-progress** *(molecule)* — horizontal stage stepper.
9. **contact-list-row** *(molecule)* — contact + last touch.
10. **note-composer** *(molecule)* — quick note + mention.
11. **task-followup-row** *(molecule)* — follow-up due.
12. **company-account-card** *(molecule)* — account overview.
13. **email-sequence-step** *(molecule)* — cadence step.
14. **win-loss-summary** *(molecule)* — won/lost donut.
15. **territory-map** *(organism)* — region assignment (map facade).

## Project Management (`pm`, 15)
1. **kanban-board** *(organism)* — columns of task cards.
2. **task-card** *(molecule)* — title, assignee, priority.
3. **gantt-row** *(molecule)* — bar positioned by dates.
4. **sprint-header** *(molecule)* — sprint name, dates, points.
5. **backlog-item** *(molecule)* — story + estimate.
6. **burndown-chart** *(organism)* — line shell.
7. **milestone-marker** *(atom)* — dated milestone.
8. **subtask-checklist** *(molecule)* — nested checklist.
9. **assignee-avatars** *(atom)* — stacked assignees.
10. **priority-flag** *(atom)* — priority level.
11. **epic-progress** *(molecule)* — stories done %.
12. **time-log-row** *(molecule)* — logged hours.
13. **board-column-header** *(molecule)* — WIP-limited column.
14. **dependency-link** *(atom)* — blocked-by badge.
15. **project-health-card** *(molecule)* — on-track/at-risk.

## HR & People Ops (`hr`, 15)
1. **org-chart-node** *(molecule)* — person + reports.
2. **pto-request** *(organism)* — leave request form.
3. **payslip-summary** *(organism)* — earnings/deductions.
4. **performance-review** *(organism)* — rating + goals.
5. **employee-card** *(molecule)* — profile summary.
6. **time-off-balance** *(molecule)* — days remaining.
7. **onboarding-checklist** *(organism)* — new-hire tasks.
8. **headcount-stat** *(molecule)* — headcount + change.
9. **attendance-row** *(molecule)* — clock in/out.
10. **benefits-enrollment** *(organism)* — plan selection.
11. **goal-okr-row** *(molecule)* — objective + progress.
12. **team-directory-grid** *(organism)* — people grid.
13. **approval-request-row** *(molecule)* — approve/deny.
14. **shift-schedule** *(organism)* — weekly shift grid.
15. **anniversary-card** *(atom)* — work anniversary.

## Logistics & Shipping (`logistics`, 14)
1. **shipment-tracker** *(organism)* — stop timeline.
2. **package-status-row** *(molecule)* — parcel status.
3. **fleet-vehicle-card** *(molecule)* — vehicle status.
4. **route-map** *(organism)* — route facade.
5. **warehouse-bin** *(molecule)* — bin capacity.
6. **delivery-proof** *(molecule)* — signature/photo.
7. **manifest-row** *(molecule)* — line on a manifest.
8. **carrier-rate-card** *(molecule)* — shipping option.
9. **eta-badge** *(atom)* — estimated arrival.
10. **load-board-row** *(molecule)* — freight load.
11. **tracking-timeline** *(organism)* — scan events.
12. **dock-schedule** *(organism)* — dock slots.
13. **cold-chain-monitor** *(molecule)* — temperature log.
14. **returns-label** *(molecule)* — RMA label.

## Smart Home & IoT (`smarthome`, 14)
1. **device-tile** *(molecule)* — on/off device.
2. **thermostat-dial** *(molecule)* — temperature dial.
3. **scene-card** *(molecule)* — activate scene.
4. **energy-usage-meter** *(molecule)* — usage now.
5. **camera-feed-tile** *(molecule)* — live cam facade.
6. **automation-rule-row** *(molecule)* — if/then.
7. **sensor-reading** *(atom)* — value + status.
8. **light-control** *(molecule)* — brightness/color.
9. **lock-status** *(molecule)* — locked/unlocked.
10. **room-grid** *(organism)* — devices per room.
11. **schedule-timer** *(molecule)* — device timer.
12. **device-group-card** *(molecule)* — grouped devices.
13. **air-quality-tile** *(molecule)* — AQI reading.
14. **hub-status** *(molecule)* — connected devices.

## Insurance (`insurance`, 14)
1. **policy-card** *(molecule)* — policy summary.
2. **claim-status** *(organism)* — claim timeline.
3. **coverage-breakdown** *(molecule)* — coverage bars.
4. **quote-comparison** *(organism)* — plan compare.
5. **deductible-meter** *(molecule)* — progress to deductible.
6. **agent-card** *(molecule)* — agent contact.
7. **fnol-form** *(organism)* — first notice of loss.
8. **premium-summary** *(molecule)* — premium breakdown.
9. **beneficiary-row** *(molecule)* — beneficiary + share.
10. **claim-document-upload** *(molecule)* — upload docs.
11. **risk-assessment** *(molecule)* — risk factors.
12. **policy-renewal-banner** *(molecule)* — renewal notice.
13. **coverage-toggle-row** *(molecule)* — add/remove coverage.
14. **incident-report** *(organism)* — incident details.

## Restaurant POS & Kitchen (`pos`, 14)
1. **order-ticket** *(molecule)* — kitchen ticket.
2. **table-map** *(organism)* — floor plan facade.
3. **check-split** *(organism)* — split the bill.
4. **pos-keypad** *(molecule)* — numeric keypad.
5. **tab-card** *(molecule)* — open tab.
6. **menu-tile-grid** *(organism)* — POS menu buttons.
7. **modifier-picker** *(molecule)* — item modifiers.
8. **kitchen-display** *(organism)* — KDS board.
9. **tip-out-row** *(molecule)* — staff tip-out.
10. **shift-report** *(organism)* — sales summary.
11. **order-status-rail** *(molecule)* — new/prep/ready.
12. **payment-terminal** *(molecule)* — tap/insert.
13. **void-comp-row** *(molecule)* — void/comp entry.
14. **seat-course-timeline** *(molecule)* — coursing.

## Wealth & Trading (`trading`, 14)
1. **order-ticket-trade** *(molecule)* — buy/sell ticket.
2. **watchlist-row** *(molecule)* — symbol + change.
3. **options-chain-row** *(molecule)* — strike, bid/ask.
4. **position-card** *(molecule)* — holding P/L.
5. **market-depth** *(organism)* — order book bars.
6. **dividend-row** *(molecule)* — dividend + yield.
7. **portfolio-rebalance** *(organism)* — target vs actual.
8. **price-ticker-tape** *(molecule)* — scrolling quotes.
9. **order-book-ladder** *(organism)* — price ladder.
10. **performance-chart-trade** *(organism)* — line shell.
11. **asset-allocation-donut** *(organism)* — allocation.
12. **trade-confirmation** *(molecule)* — fill confirmation.
13. **margin-meter** *(molecule)* — margin usage.
14. **earnings-calendar-row** *(molecule)* — earnings date.

## Pets & Veterinary (`pets`, 14)
1. **pet-profile-card** *(molecule)* — pet summary.
2. **vaccination-record** *(organism)* — shots history.
3. **vet-appointment** *(molecule)* — booking.
4. **breed-card** *(molecule)* — breed info.
5. **feeding-schedule** *(molecule)* — meals.
6. **adoption-card** *(molecule)* — adoptable pet.
7. **grooming-booking** *(molecule)* — groom service.
8. **pet-health-timeline** *(organism)* — care history.
9. **weight-tracker-pet** *(molecule)* — weight trend.
10. **medication-reminder-pet** *(molecule)* — dose reminder.
11. **lost-pet-alert** *(molecule)* — missing pet.
12. **pet-insurance-card** *(molecule)* — coverage.
13. **walk-tracker** *(molecule)* — walk log.
14. **vet-clinic-card** *(molecule)* — clinic info.

## Manufacturing & Industrial (`industrial`, 14)
1. **machine-status-tile** *(molecule)* — machine state.
2. **oee-gauge** *(molecule)* — OEE %.
3. **work-order-card** *(molecule)* — production order.
4. **production-line-status** *(organism)* — line stations.
5. **defect-log-row** *(molecule)* — defect entry.
6. **inventory-bin-row** *(molecule)* — stock level.
7. **downtime-tracker** *(molecule)* — downtime reasons.
8. **quality-control-checklist** *(organism)* — QC steps.
9. **shift-handover** *(organism)* — handover notes.
10. **maintenance-schedule-row** *(molecule)* — PM task.
11. **throughput-chart** *(organism)* — bar shell.
12. **sensor-alarm-banner** *(molecule)* — alarm.
13. **batch-record** *(molecule)* — batch details.
14. **andon-board** *(organism)* — station status board.

## Energy & Sustainability (`energy`, 14)
1. **solar-production-card** *(molecule)* — solar output.
2. **meter-reading-row** *(molecule)* — meter value.
3. **carbon-footprint** *(molecule)* — CO2 breakdown.
4. **ev-charging-status** *(molecule)* — charge session.
5. **grid-status** *(molecule)* — grid state.
6. **tariff-comparison** *(organism)* — plan compare.
7. **usage-forecast** *(organism)* — line shell.
8. **energy-mix-donut** *(organism)* — sources.
9. **bill-estimate** *(molecule)* — projected bill.
10. **demand-response-banner** *(molecule)* — event notice.
11. **battery-storage-tile** *(molecule)* — charge %.
12. **appliance-usage-row** *(molecule)* — per-appliance.
13. **renewable-goal** *(molecule)* — % renewable.
14. **outage-map** *(organism)* — outage facade.

## Loyalty & Rewards (`loyalty`, 14)
1. **points-balance-card** *(molecule)* — points total.
2. **tier-progress** *(molecule)* — to next tier.
3. **reward-catalog-item** *(molecule)* — redeemable reward.
4. **punch-card** *(molecule)* — stamps.
5. **referral-invite** *(molecule)* — invite + bonus.
6. **redemption-row** *(molecule)* — redemption entry.
7. **member-card** *(molecule)* — digital card + barcode.
8. **streak-reward** *(molecule)* — daily streak.
9. **points-history-row** *(molecule)* — earn/spend.
10. **perks-grid** *(organism)* — member perks.
11. **challenge-progress** *(molecule)* — reward challenge.
12. **birthday-reward** *(atom)* — birthday perk.
13. **tier-benefits-table** *(organism)* — tier compare.
14. **cashback-summary** *(molecule)* — cashback earned.

## Field Service & Home Services (`fieldservice`, 14)
1. **job-dispatch-card** *(molecule)* — assigned job.
2. **technician-card** *(molecule)* — tech status/location.
3. **service-appointment** *(molecule)* — booking window.
4. **work-order-detail** *(organism)* — full work order.
5. **parts-list** *(molecule)* — parts used.
6. **route-schedule** *(organism)* — day's jobs.
7. **before-after-service** *(molecule)* — photo pair.
8. **checklist-inspection** *(organism)* — inspection.
9. **time-on-site** *(molecule)* — on-site timer.
10. **customer-signoff** *(molecule)* — sign-off.
11. **equipment-card** *(molecule)* — serviced asset.
12. **dispatch-map** *(organism)* — dispatch facade.
13. **sla-timer** *(molecule)* — SLA countdown.
14. **invoice-onsite** *(molecule)* — on-site invoice.

## Creator & Monetization (`creator`, 15)
1. **subscriber-tier-card** *(molecule)* — membership tier.
2. **tip-jar** *(molecule)* — send a tip.
3. **content-paywall** *(organism)* — locked content.
4. **revenue-dashboard** *(organism)* — earnings overview.
5. **sponsorship-card** *(molecule)* — brand deal.
6. **merch-drop-card** *(molecule)* — merch release.
7. **live-stream-chrome** *(organism)* — stream overlay.
8. **supporter-wall** *(organism)* — top supporters.
9. **payout-summary** *(molecule)* — payout breakdown.
10. **content-scheduler** *(organism)* — post calendar.
11. **engagement-stat** *(molecule)* — engagement metric.
12. **membership-perks** *(molecule)* — perk list.
13. **digital-product-card** *(molecule)* — sellable download.
14. **super-chat-message** *(molecule)* — paid highlight.
15. **brand-deal-tracker** *(molecule)* — deliverables status.
