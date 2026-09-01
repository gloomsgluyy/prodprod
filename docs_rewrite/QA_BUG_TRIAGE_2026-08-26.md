# QA Bug Triage - 2026-08-26

**Source:** `QA_Checklist_CoalTrade_OS.md`  
**Scope:** verified code defects only. Browser-extension `content.js`, ColorScanner, and CSS Inspector logs are excluded.

## Conclusion

| QA finding | Code evidence | Decision |
|---|---|---|
| Non-market users receive repeated `POST /api/market-scrape` 403 | `GlobalMarketScraper` ran for every authenticated session while `/api/market-scrape` is role-gated | Fixed: schedule only allowed market-edit roles. |
| Expense create returns 422 | Form sends `relatedShipmentId: ""`; API required UUID when field exists; Prisma persists `shipmentId` | Fixed: normalize empty optional UUID and map input to schema field. |
| OCR failure crashes client JSON parsing | OCR client parsed all responses as JSON without fallback | Fixed: safe JSON parsing and field-level error. |
| Urgent Analysis modal remains loading | Modal created a `useMutation` but never invoked it | Fixed: fetch persisted report after analysis mutation succeeds. |
| Deal click appears unavailable | Default Sales Monitor tab was non-clickable Rollup, not Deals table | Fixed: default tab is Deals. |
| Blending totals concatenate strings | Row updates persisted numeric input strings into numeric fields | Fixed: numeric fields coerce to finite number. |
| Video MOM has no file input | Video section was present in state but rendered no content | Fixed: upload input now invokes existing transcription handoff. Full Flask MOM remains stub. |

## Deferred

- AI Agent is explicitly stubbed. Buyer total must use a defined quantity policy (`qtyFinal` versus loaded/planned), then aggregate-intent parsing can be added.
- Dashboard filter work is handled by the dashboard-widget revision. Full filter propagation to every legacy widget remains a separate scope.
- Production `500` reports for Meetings/OCR require VPS logs and production environment verification; local code now returns JSON-safe errors in the repaired client path.
- Global Search is a non-existent feature, not a regression. It requires a separate search contract and RBAC-safe indexed endpoints.
- Sales Monitor summary/filter ordering requires browser reproduction against production data before changing query semantics.

## Verification

- Expense draft and submit with blank related shipment ID.
- Non-market role navigation: no automatic `/api/market-scrape` request.
- Urgent analysis report modal opens after successful POST.
- Deals opens by default and row opens detail modal.
- Blending quantities `15000 + 25000 + 10000 = 50000`.
- Video upload shows clear fallback behavior without Flask/Groq.

## Gap Closure - Integrated Revision

- Entity filter now uses `ForecastUIState.filterEntity`, query parameter `entity`, API filtering, and persisted `ForecastProject.entity` display.
- Forecast custom fields now rehydrate from persisted detail data when editing.
- Buyer feedback now has role and state-transition guards.
- Last-known previous lookup now includes same-date earlier entries using `createdAt` ordering.
- Canonical Offer No and separate Deal record remain deferred pending business identifier/model decisions.
