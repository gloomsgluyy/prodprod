# Dashboard Widget Revision Context

**Source:** `revisi_widgetdasboard`  
**Date:** 2026-08-30  
**Scope:** `/` Dashboard only

## Approved Revision

1. Market Price Index is the first dashboard widget. Cards are monochrome and show latest date, 2-week, 4-week, and 30-day averages with date ranges. Delta amount and percentage compare latest price only to the prior 2-week average.
2. Overview filters move below Market Price on the left. Compact summary cards move beside them: total shipments, total volume, then Revenue and Margin only for executive roles.
3. Quantity per Month remains on the left with year selector and Local versus Export comparison. Stock Inventory and recent Active Shipments share the right area.
4. Active Shipment rows show shipment status, current stage, and open-issue state.
5. Remove Blocker Control Tower from the dashboard.
6. Replace Document Aging with Pending Alerts: SI overdue within H-10 without SI, Draft BL pending more than three days, invoice overdue, and surveyor report pending. "COO pending" requires a confirmed source field before implementation.
7. AI Forecast Urgency remains in progress. Do not invent high-risk parameters.

## Boundaries

- Revenue and Margin stay server-side restricted by executive role.
- Dashboard filters must drive summary metrics. Other widgets retain their existing module-specific controls until filter contracts are expanded.
- Alert records are links, never direct mutations.
