# QA TESTING CHECKLIST - CoalTrade OS Rewrite
**Version:** 2.0  
**Last Updated:** 2026-07-26  
**Test Coverage:** Phase 1-4 Features (20 modules)

---

## TESTING OVERVIEW

### Scope
- 15 Phase 1-3 features (100% implemented)
- 3 Phase 4 features (60% implemented)
- 18/20 modules (90% complete)
- 6 new database migrations
- 50+ files modified

### Test Environment Required
- Node.js 18+
- PostgreSQL database
- Environment variables configured
- Test user accounts (CEO, Manager, Staff roles)

---

## PHASE 1: CRITICAL BUSINESS LOGIC (5 Features)

### 1.1 Forecast Buyer Feedback Workflow
**File:** src/modules/forecast-sales/components/forecast-detail-drawer.tsx

**Test Cases:**
- [ ] Open forecast detail with status 'approved'
- [ ] Verify 'Buyer Feedback' section visible
- [ ] Change feedback status to 'fco_sent' -> save -> verify history array updated
- [ ] Change to 'negotiation' with reason -> verify reason saved
- [ ] Change to 'deal' -> verify conversion gate prevents marking as failed
- [ ] Change to 'failed' with reason -> verify forecast marked failed
- [ ] Reload page -> verify history timeline shows all changes with timestamps

**Expected Results:**
- History array shows all status changes
- Reason field required for 'failed' status
- Deal conversion gate prevents conflicting status
- Timestamps in ISO format

---

### 1.2 Sales Monitor Rollup
**File:** src/modules/sales-monitor/components/sales-monitor-client.tsx

**Test Cases:**
- [ ] Navigate to /sales-monitor
- [ ] Verify 'Deals' tab shows individual deals
- [ ] Verify 'Project Rollup' tab shows aggregated forecasts
- [ ] Check summary cards show: Revenue, Volume, Deals count, Shipments count
- [ ] Filter by status -> verify both tabs update
- [ ] Search by project name -> verify results filter correctly
- [ ] Click deal row -> verify detail modal opens
- [ ] Verify rollup merges forecast + deal + shipment by projectId

**Expected Results:**
- Dual-tab interface functional
- Summary cards show correct aggregations
- Rollup logic merges related records
- Detail modal shows deal info

---

### 1.3 Dashboard Filter Wiring
**File:** src/modules/dashboard/components/filter-bar.tsx

**Test Cases:**
- [ ] Navigate to dashboard
- [ ] Change Country filter -> verify all widgets update
- [ ] Change Region filter -> verify data refreshes
- [ ] Change Status filter -> verify shipments filtered
- [ ] Change Market Type (domestic/export) -> verify metrics update
- [ ] Select time range (30d/90d/YTD) -> verify charts update
- [ ] Custom date range -> verify date pickers work
- [ ] Combine multiple filters -> verify AND logic applied

**Expected Results:**
- All filters apply to widgets
- Date range affects charts
- Metrics recalculate on filter change
- No console errors

---

### 1.4 Approval Center Expense Integration
**File:** src/modules/approval-center/components/approval-center-client.tsx

**Test Cases:**
- [ ] Create expense with 'Submit for approval' checked
- [ ] Navigate to /approval-center (CEO role required)
- [ ] Verify expense appears in approval queue
- [ ] Click expense -> verify detail shows amount, category, receipt
- [ ] Approve with comment -> verify status changes to 'approved'
- [ ] Create another expense -> Reject with comment
- [ ] Verify expense status updates in /purchase-requests
- [ ] Check history tab shows approval actions

**Expected Results:**
- Expenses visible in approval queue
- Approve/reject actions work
- Comments saved
- Status syncs across modules

---

### 1.5 Daily Delivery Document Tab
**File:** src/modules/shipment-monitor/components/shipment-detail-drawer.tsx

**Test Cases:**
- [ ] Open shipment detail (domestic shipment)
- [ ] Click 'Daily Delivery' tab
- [ ] Verify DailyDeliveryTab component renders
- [ ] (If upload UI exists) Upload SKAB document
- [ ] (If upload UI exists) Upload DSR document
- [ ] Verify documents listed with status
- [ ] Check document aging indicators

**Expected Results:**
- Tab accessible from shipment detail
- Component renders without error
- Document upload functional (if implemented)

---

## PHASE 2: UX ENHANCEMENT (5 Features)

### 2.1 Forecast Urgent Analysis
**File:** src/modules/forecast-sales/components/urgent-analysis-button.tsx

**Test Cases:**
- [ ] Open forecast detail (CEO/DIRUT/ASS_DIRUT role required)
- [ ] Verify 'Urgent Analysis' button visible
- [ ] Click button -> verify loading state shows
- [ ] Wait for analysis completion (5-10 seconds)
- [ ] Verify modal opens with:
  - Urgency Level (CRITICAL/HIGH/MEDIUM/LOW)
  - Urgency Score (0-100)
  - Report sections: Executive Summary, Key Factors, Timeline Impact, Financial Impact, Risk Factors, Recommendations
- [ ] Close modal -> reopen forecast -> verify analysis cached
- [ ] Check database: urgencyScore, urgencyLevel, urgencyReport fields populated

**Expected Results:**
- Button only visible to executives
- Analysis generates score based on: approval status, shipment count, timeline, documents, P&L, market, news
- Report saved to database
- Cached result displayed on reload

---

### 2.2 Deal Detail Modal
**File:** src/modules/sales-monitor/components/deal-detail-modal.tsx

**Test Cases:**
- [ ] Navigate to /sales-monitor -> 'Deals' tab
- [ ] Click anywhere on deal row -> verify modal opens
- [ ] Verify modal shows: Deal info, Project link, Buyer, Amount, Status, Created date
- [ ] Click backdrop -> verify modal closes
- [ ] Click X button -> verify modal closes
- [ ] Open multiple deals sequentially -> verify no stale data

**Expected Results:**
- Click-to-open on entire row
- View-only display (no edit actions)
- Smooth open/close transitions
- Correct data per deal

---

### 2.3 Market Price Comparison
**File:** src/modules/market-price/components/market-comparison-card.tsx

**Test Cases:**
- [ ] Navigate to /market-price
- [ ] Scroll to 'Market Comparison' section
- [ ] Verify benchmark selector shows: ICI3, ICI4, HBA, Newcastle
- [ ] Select ICI3 -> verify sales spread calculated
- [ ] Select HBA -> verify buying spread calculated
- [ ] Check color coding: Green (spread >3), Red (<-3), Yellow (neutral)
- [ ] Verify margin analysis shows percentage
- [ ] Change benchmark -> verify all values recalculate

**Expected Results:**
- Benchmark selector functional
- Spread calculation correct
- Color coding matches thresholds
- No calculation errors

---

### 2.4 Blending Report Export
**File:** src/modules/blending-simulator/components/blending-client.tsx

**Test Cases:**
- [ ] Navigate to /blending
- [ ] Add 2+ cargoes with specs
- [ ] Set target specs
- [ ] Click 'Simulate' -> verify result shows
- [ ] Click 'Export CSV' button
- [ ] Verify download starts (blending-report-{timestamp}.csv)
- [ ] Open CSV file -> verify contains:
  - Cargo table (name, qty, GAR, TS, ASH, TM)
  - Target specs
  - Result specs
  - Comparison delta
- [ ] Check CSV format (proper commas, no encoding issues)

**Expected Results:**
- CSV downloads successfully
- All data included
- Readable format
- Timestamp in filename

---

### 2.5 Scraper Interval Persistence
**File:** src/modules/market-price/components/market-price-client.tsx

**Test Cases:**
- [ ] Navigate to /market-price
- [ ] Click 'Scraping Settings' button
- [ ] Open modal -> verify current interval displayed
- [ ] Change interval to '1 minute' -> click 'Save Interval'
- [ ] Verify localStorage updated (key: coaltrade:marketScrapeIntervalMs)
- [ ] Refresh page -> verify interval persists
- [ ] Check console for 'marketScrapeIntervalChanged' event dispatch
- [ ] Change to '6 hours' -> save -> verify scraper reschedules

**Expected Results:**
- Interval saves to localStorage
- Event dispatches for global scraper
- Persists across page reloads
- Scraper respects interval

---

## PHASE 3: AUDIT & COMPLIANCE (5 Features)

### 3.1 Directory News Display
**File:** src/modules/directory/components/directory-client.tsx

**Test Cases:**
- [ ] Navigate to /directory
- [ ] Click 'Analyze' button on a partner
- [ ] Wait for due diligence completion
- [ ] Click partner to open detail drawer
- [ ] Scroll to 'AI Due Diligence' section
- [ ] Verify 'External News' subsection visible
- [ ] Check news items show: Title (link), Source, Published date
- [ ] Click news link -> verify opens in new tab
- [ ] Verify up to 5 news items displayed

**Expected Results:**
- News displayed after due diligence
- Links clickable and open externally
- Source and date formatted correctly
- No broken links

---

### 3.2 Expense Anomaly Persistence
**File:** src/app/api/expenses/route.ts

**Test Cases:**
- [ ] Navigate to /purchase-requests -> Add expense
- [ ] Enter receipt image URL
- [ ] Click 'OCR Receipt' button
- [ ] If anomaly detected (amount >2x average) -> verify warning shows
- [ ] Submit expense -> save
- [ ] Check database: isAnomaly = true, anomalyReason populated
- [ ] Verify notes field contains anomaly text
- [ ] Query expense via API: /api/expenses -> verify anomaly fields returned
- [ ] Test with normal amount -> verify isAnomaly = false

**Expected Results:**
- Anomaly flags saved to database
- anomalyReason contains flag descriptions
- Persists for audit trail
- Visible in notes for user

---

### 3.3 Outstanding Payment Dispute Status
**File:** src/modules/outstanding-payment/components/payment-form-modal.tsx

**Test Cases:**
- [ ] Navigate to /outstanding-payment -> Add payment
- [ ] Verify 'Dispute Status' field visible
- [ ] Enter value: 'none' -> save
- [ ] Edit payment -> change to 'disputed'
- [ ] Save -> reload -> verify persists
- [ ] Change to 'under review' -> save
- [ ] Check database: disputeStatus field updated
- [ ] Filter payments by dispute status (if filter exists)

**Expected Results:**
- Field visible in form
- Values save correctly
- Persists to database
- Editable after creation

---

### 3.4 Forecast Document Templates
**File:** src/modules/forecast-sales/components/forecast-form-modal.tsx

**Test Cases:**
- [ ] Create new forecast
- [ ] Verify 'Document Template' dropdown shows: Export Shipment, Domestic Delivery, Spot Purchase
- [ ] Select 'Export Shipment' -> verify checklist shows 11 items (a-k)
- [ ] Check item 'a' (LAPORAN HASIL VERIFIKASI) -> save draft
- [ ] Edit forecast -> verify checkbox persists
- [ ] Change template to 'Domestic Delivery' -> verify checklist updates (5 items)
- [ ] Select 'Spot Purchase' -> verify checklist updates (5 items)
- [ ] Submit forecast -> check database: templateType, templateChecklist saved

**Expected Results:**
- Template selector functional
- Checklist updates dynamically
- Checkbox states persist
- Correct items per template type

---

### 3.5 Market Price History Detail
**File:** src/modules/market-price/components/price-history.tsx

**Test Cases:**
- [ ] Navigate to /market-price
- [ ] Scroll to 'Price History' table
- [ ] Click expand button (chevron) on any row
- [ ] Verify expanded section shows:
  - Record Info (ID, Created date)
  - Source
  - Action
  - Actor
  - Notes (if present)
  - Full Snapshot (6-column grid with all 12 indices)
- [ ] Verify all indices shown: ICI1-5, Newcastle, HBA, HBA I-III, MGO, USD/IDR
- [ ] Click collapse -> verify row collapses
- [ ] Expand different row -> verify correct data

**Expected Results:**
- Expand shows full snapshot
- All 12 indices visible in grid
- Metadata (ID, date, source) displayed
- Grid layout responsive

---

## PHASE 4: ADVANCED FEATURES (3 Features)

### 4.1 Meetings Video MOM Tab
**File:** src/modules/meetings/components/meetings-client.tsx

**Test Cases:**
- [ ] Navigate to /meetings -> Open meeting detail
- [ ] Verify 'Video MOM' tab exists
- [ ] Click 'Video MOM' tab
- [ ] Verify warning shows: 'Requires Flask MOM processor at localhost:8080'
- [ ] Verify file input shows (video upload placeholder)
- [ ] Select video file -> verify alert shows with instructions
- [ ] Read instructions for Flask integration
- [ ] Verify status section explains workflow

**Expected Results:**
- Tab structure exists
- Placeholder UI functional
- Instructions clear
- No crashes when clicking

---

### 4.2 AI Agent Shipment/Source Context
**File:** src/app/api/ai-agent/excel-context/route.ts

**Test Cases:**
- [ ] Test API endpoint: GET /api/ai-agent/excel-context
- [ ] Verify response includes 4 workbooks: Shipment Monitor, Daily Delivery Log, Forecast Sales, Coal Sources
- [ ] Test POST /api/ai-agent/excel-context with question: 'How many shipments?'
- [ ] Verify context includes shipment data (latest 20)
- [ ] Test question: 'Show me sources' -> verify source context returned
- [ ] Test question: 'List deliveries' -> verify delivery data returned
- [ ] Test generic question -> verify summary stats returned

**Expected Results:**
- Context includes 4 data sources
- Keyword detection works (shipment/source/delivery/forecast)
- Latest 20 records returned per query
- Generic fallback shows counts

---

### 4.3 Forecast SI Generation
**File:** src/modules/forecast-sales/components/forecast-detail-drawer.tsx

**Test Cases:**
- [ ] Open forecast with status 'approved' or 'deal'
- [ ] Verify 'Generate SI' button visible
- [ ] Click button -> verify PDF download starts
- [ ] Open PDF (SI-{projectName}.pdf)
- [ ] Verify PDF contains:
  - Header: 'SHIPPING INSTRUCTION'
  - SI Number
  - TO: PT. FONTANA RESOURCES INDONESIA
  - Project Name
  - Shipper, Consignee, Notify Party
  - Quantity, Nomination, Loading Port, Discharge Port
  - Laycan
  - Shipping Term
  - Coal Specification (if specs exist)
  - Analysis Method
  - Marked text
- [ ] Generate from different forecast -> verify unique SI number

**Expected Results:**
- Button only visible for approved/deal status
- PDF generates and downloads
- All fields populated correctly
- Specs shown if present
- Professional formatting

---

## DATABASE MIGRATION TESTING

### Migration Files Created (6 total)
1. 20260726021900_add_deal_project_id.sql
2. 20260726024900_add_expense_approval_fields.sql
3. 20260726031200_add_urgency_analysis_fields.sql
4. 20260726043400_add_expense_anomaly_fields.sql
5. 20260726043600_add_outstanding_payment_dispute_status.sql (no-op)
6. 20260726044000_add_forecast_template_fields.sql

**Test Cases:**
- [ ] Run: npx prisma migrate deploy
- [ ] Verify all 6 migrations apply successfully
- [ ] Check database schema:
  - [ ] Deal.projectId exists (foreign key to ForecastProject)
  - [ ] Deal.forecastProjectId exists
  - [ ] Expense.approvalStatus, approvalComment, shipmentId, expenseDate, receiptUrl, ocrData exist
  - [ ] ForecastProject.urgencyScore, urgencyLevel, urgencyReport, lastUrgencyAnalyzedAt, requiredDocuments exist
  - [ ] Expense.isAnomaly, anomalyReason exist
  - [ ] OutstandingPayment.disputeStatus exists
  - [ ] ForecastProject.templateType, templateChecklist exist
- [ ] Run: npx prisma generate
- [ ] Verify TypeScript types updated
- [ ] Test backward compatibility: existing data not corrupted

**Expected Results:**
- All migrations succeed
- No schema conflicts
- Types generated correctly
- Existing data intact

---

## CROSS-MODULE INTEGRATION TESTS

### Forecast → Deal → Shipment Flow
- [ ] Create forecast -> submit -> approve -> convert to deal
- [ ] Verify Deal.projectId links to ForecastProject
- [ ] Convert deal to shipment -> verify shipment.forecastProjectId populated
- [ ] Open Sales Monitor rollup -> verify forecast + deal + shipment merged
- [ ] Check dashboard metrics -> verify counts include new records

### Expense → Approval → P&L Flow
- [ ] Create expense with receipt OCR -> anomaly detected
- [ ] Submit for approval -> verify appears in Approval Center
- [ ] Approve expense -> verify status updates
- [ ] Link expense to shipment
- [ ] Open P&L page -> verify expense included in cost calculation

### Market Price → Forecast → Comparison
- [ ] Update market price (manual input)
- [ ] Create forecast with sales price
- [ ] Open Market Comparison -> verify spread calculated
- [ ] Open forecast detail -> verify no market reference card (Web 1 feature not in Web 2)

---

## PERFORMANCE TESTING

### Load Times
- [ ] Dashboard initial load < 3 seconds
- [ ] Forecast list load < 2 seconds
- [ ] Shipment list load < 2 seconds
- [ ] Market price history load < 2 seconds

### API Response Times
- [ ] /api/dashboard/metrics < 1 second
- [ ] /api/forecasts < 1 second
- [ ] /api/shipments < 1 second
- [ ] /api/sales-monitor/rollup < 2 seconds
- [ ] /api/forecasts/[id]/urgent-analysis < 10 seconds

### Client-Side Performance
- [ ] No console errors on any page
- [ ] No memory leaks (check DevTools Memory profiler)
- [ ] React DevTools: No unnecessary re-renders
- [ ] Lighthouse score > 80 (Performance)

---

## SECURITY & PERMISSIONS TESTING

### Role-Based Access
- [ ] CEO role: Access all modules, see P&L data, approve all
- [ ] DIRUT role: Same as CEO
- [ ] ASS_DIRUT role: Same as CEO
- [ ] MANAGER role: No P&L data, limited approval
- [ ] STAFF role: No approvals, no sensitive data

### Test Cases per Role
- [ ] Login as STAFF -> navigate to /approval-center -> verify redirected/empty
- [ ] Login as MANAGER -> open forecast detail -> verify no P&L section
- [ ] Login as CEO -> open forecast detail -> verify P&L visible
- [ ] Login as STAFF -> try to approve expense via API -> verify 403 error
- [ ] Test urgent analysis button only visible to CEO/DIRUT/ASS_DIRUT

---

## BROWSER COMPATIBILITY

### Desktop Browsers
- [ ] Chrome 120+ (primary target)
- [ ] Firefox 120+
- [ ] Edge 120+
- [ ] Safari 17+

### Mobile Responsive
- [ ] iPhone 12-15 (Safari)
- [ ] Android Chrome
- [ ] Tablet iPad Pro

### Test Responsive Breakpoints
- [ ] 1920x1080 (desktop)
- [ ] 1366x768 (laptop)
- [ ] 768x1024 (tablet)
- [ ] 375x812 (mobile)

---

## REGRESSION TESTING (Critical Paths)

### Must Not Break
- [ ] User login/logout flow
- [ ] Forecast create/edit/delete
- [ ] Shipment create/edit/close
- [ ] Market price manual input
- [ ] Approval approve/reject
- [ ] Document upload in shipments
- [ ] Blending simulator calculation
- [ ] Quality control spec input
- [ ] Sources CRUD operations
- [ ] Meetings create/transcribe

---

## KNOWN ISSUES & LIMITATIONS

### Not Implemented (Documented Gaps)
- ❌ AI Agent frontend (backend only)
- ❌ Document Drive frontend (backend only)
- ❌ Sources RKAB/COB/Issue UI (backend only)
- ❌ P&L cost breakdown UI
- ❌ Blending composition percentages display
- ❌ Transshipment report download
- ❌ Quality document links in UI
- ❌ Flask MOM Processor full integration (placeholder only)

### Test Strategy for Gaps
- Mark as 'Known Limitation' in test results
- Do NOT test missing features
- Focus on testing what IS implemented

---

## TEST EXECUTION CHECKLIST

### Pre-Testing Setup
- [ ] Fresh database with test data
- [ ] Environment variables configured
- [ ] Test user accounts created (CEO, Manager, Staff)
- [ ] npm run build successful
- [ ] npm run dev running
- [ ] Browser DevTools open

### During Testing
- [ ] Record all failures with screenshots
- [ ] Note console errors/warnings
- [ ] Check network tab for failed requests
- [ ] Verify database state after mutations

### Post-Testing
- [ ] Compile test results summary
- [ ] Create GitHub issues for bugs found
- [ ] Document test coverage percentage
- [ ] Sign off on tested features

---

## TEST SIGN-OFF

**Tested By:** _________________  
**Date:** _________________  
**Test Coverage:** _____ / 100 test cases passed  
**Critical Bugs Found:** _____  
**Minor Issues Found:** _____  
**Ready for Production:** [ ] Yes  [ ] No  

**Notes:**
_______________________________________________
_______________________________________________
_______________________________________________

---

Generated: 2026-07-26 06:53 UTC
