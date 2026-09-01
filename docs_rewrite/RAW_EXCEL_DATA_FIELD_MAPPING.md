# Raw Excel Data Field Mapping

**Source files**

- `00. MV_Barge&Source 2021,2022, 2023,2024-7-19.xlsx`
- `10.Daily Delivery Report (Recap Shipment) 2020, 2021, 2022, 2023, 2024, 2025, 2026.xlsx`

## Findings

The client Excel files contain real source fields previously missing from the workspace UI. They are not normalized databases; headers vary by year, sheets contain merged/header rows, duplicate labels, Excel serial dates, status text, and inconsistent naming. Import must be a staged, idempotent mapping process.

## MV/Barge Source Fields

Recurring source sheets: `MV_Barge&Source 2021`, `MV_Barge&Source 2022`, `MV_Barge&Source 2023`, `MV_Barge&Source 2024`, `MV_Barge&Source 2025`, `MV_Barge&Source 2026`, `BARGE MV SSI AVENGER`, `PURCHASE REPORT`.

Observed fields:

| Raw field | Target context |
|---|---|
| `MV NAME` / `MV./PROJECT NAME` | Parent MV identity/project key |
| `LAYCAN` | Parent/child laycan; parse range manually where text |
| `BUYER` | Shipment buyer |
| `IUP OP` / `IUP-OPK` | Supplier permit holder |
| `SOURCE` | Source/location |
| `JETTY` / `JETTY / LOADING PORT` | Loading port |
| `TB./BG.` / `NOMINATION` | Child barge nomination |
| `QTY (MT)` / `PLAN` | Child planned quantity |
| `COB` / `ACTUAL` / `STOCK JETTY/COB` | Child actual/COB quantity |
| `SHIPMENT STATUS` | Parent/child status |
| `ISSUE` / `ISSUE / NOTES` / `REMARKS` | Issue/remarks |
| `BL DATE` | BL milestone |
| `LHV Terbit` / `LHV` | LHV issued/status |
| `Surveyor LHV` | LHV surveyor |
| `LOSS/GAIN CARGO` | Quantity reconciliation |
| `SP` | Shipping/contract reference |
| `DEADFREIGHT` | Freight/claim field |
| `SHIPPING` | Shipping term/flow |
| `PRICE FREIGHT` / `Barge Price` | Restricted freight price |
| `ALLOWANCE` / `Allowance Time` | Laytime allowance |
| `DEMM` / `Demurrage rate` | Restricted demurrage |
| `LAYTIME CALCULATION` | Laytime result |
| `Contract Section` / `SOURCE (CONTRACT)` | Contract metadata |
| `Softcopy` / `Hardcopy` / `CONTRACT STATUS` | Contract document state |
| `Ops` / `QA` / `Legal` | Approval state |
| `Persyaratan PEB` | PEB checklist |
| `Persyaratan Legalitas` | Legal checklist |
| `SI` / `SI MV` | Shipping instruction status/reference |
| `SKAB` / `SKB` / `DSR` / `Royalty` / `RKBM` / `SPB` | Operational/legal documents |
| `COA` / `CDS` / `COW` | Quality/document records |
| `NO SI` / `NO SPAL` | Document/reference IDs |
| `SENT TO SUPPLIER` / `SENT TO BARGE OWNER` | Communication handoff |
| `COA DATE` / `RESULT` | Quality result |

## Daily Delivery / Buyer Fields

Recurring sheets: `2020`, `2021`, `2022-EXP`, `2022-DOM`, `2023-EXP`, `2023-DOM`, `2024-EXP`, `2024-DOM`, `2025-EXP`, `2025-DOM`, `2026-EXP`, `2026-DOM`, `DOCS 2022`, `DOCS 2023`.

Observed Buyer Side fields:

| Raw field | Target context |
|---|---|
| `Project Name` | Forecast/project link |
| `MSE/BPG` | Entity |
| `Buyer` | Buyer |
| `Product` | Contract product/spec |
| `Supplier` | Supplier |
| `Shipping Term` | Contract/shipping term |
| `PO No.` / `Contract No.` | Contract identity |
| `Contract Position (Physical)` | Contract state |
| `FCO/MoM/MoU` / `FCO` | Commercial reference |
| `MV/Barge Nomination` | MV or child nomination; requires parsing |
| `POL` / `POD` / `Port & Country of POD` | Route |
| `Latest ETA at POD` | Buyer communication ETA |
| `Arrive at POD` | POD milestone |
| `Complete Discharged` / `Discharge Completion` | POD milestone |
| `BL Quantity` / `BL DATE` | BL result |
| `POD Quantity` / `POD/Weightbridge Quantity` | POD result |
| `Weightbridge Quantity` | Factory result |
| `(Loss)/Gain Cargo` | Quantity variance |
| `Late (days)` / `Late POD/Day` | Delivery alert |
| `POL Surveyor` / `POD Surveyor` / `Surveyor LS` | Quality/survey |
| `ANALYSIS METHOD` | Quality method |
| `LC Issuing Bank` | Bank metadata |
| `Beneficiary Bank` | Bank metadata |
| `Submit LC Document to bank` | Document/payment workflow |
| `Received Payment Date` | Payment |
| `Payment Status /Paid` | Payment status |
| `Invoice Price` / `Invoice Amount` | Buyer financial/payment |
| `Demurrage Rate` / `Demurrage/Despatch` | Buyer freight/claim |
| `Deadfreight USD` | Restricted commercial/claim |
| `Notify Party` | Vessel/contract |
| `SPEC CONTRACT` | Contract quality limits |
| `ACTUAL GAR/GCV/NAR/TS/ASH/TM/IM/VM` | Actual quality |
| `Diff Calorie. Actual Vs. SPA` | Quality variance |
| `Any Notes` / `Notes` | Communication |

## Document Timing Fields

The `DOCS` sheets contain more granular handoff dates than current `ShipmentDocument`:

- Supplier → Operation.
- Operation → Traffic.
- Traffic → Finance.
- Surveyor → Traffic.
- COA POD.
- BL/CM.
- SKAB/SK.
- DSR Carbon.
- Due date physical document collection.
- Days between handoffs.
- Delay notes.

These fields should become document workflow metadata, not be flattened into a single `status` string.

## Financial and Settlement Fields

The `MV_Barge&Source` and `Fin` sheets expose:

- Barge price.
- Base/actual price.
- Freight.
- Allowance.
- Demurrage/despatch.
- Royalty billing ID.
- Royalty quantity and amount.
- Invoice amount.
- Payment status.
- DP/TOP.
- First/second/third/fourth payment.
- Deadfreight.
- Bank.

These must remain role-restricted. Importing them into Prisma must not make them visible to non-executive users.

## Quality Fields

Raw Excel contains:

- GAR/GCV/GAD.
- NAR/NCV.
- TM.
- IM.
- TS.
- Ash.
- VM.
- FC.
- HGI.
- Calorie.
- Analysis method.
- Contract specification.
- Actual specification.
- Difference against SPA.
- COA dates/results.
- POL/POD/LS surveyors.

Map to `QualityResult` JSON only after normalizing units/basis (`ARB`, `ADB`, `GAR`, `GAD`). Never compare values across basis without conversion/labeling.

## Date Handling

Observed Excel dates are serial numbers such as `44576`, `44603`, `45306` and text ranges such as `16-22 Aug 2026`, `10-12 JAN`.

Import requirements:

1. Convert numeric serials using Excel date epoch.
2. Preserve original raw value.
3. Parse date ranges with year context from sheet/year.
4. Mark ambiguous dates for review.
5. Never infer timezone for date-only values.
6. Store date-only milestones as `@db.Date` where applicable.
7. Keep original sheet/row/column provenance.

## MV/TB Parsing Rules

Examples:

```text
MV. MVOLYVOS LUCK
MV G Taishan
TB. MOMENTUM 09 / BG. MOMENTUM 3005
TB Pacific Five / BG Pacific 3302
```

Recommended import:

- MV-only value → parent Shipment candidate.
- TB/BG-only value → ChildNomination candidate only when parent MV key exists.
- Combined MV/Barge value → split only with reviewed parser result.
- `or SUBS` → preserve as nomination option/notes, not a second child automatically.
- Duplicate barge names across projects → require project/laycan/buyer context.

## Import Safety

- Read-only profiling first.
- Dry-run output before DB write.
- Idempotency key: source file + sheet + row + normalized project/nomination identity.
- Upsert only after reviewer approval.
- Preserve raw cell values and provenance.
- Do not overwrite manually maintained fields without conflict report.
- Store unmapped/ambiguous rows for review.
- Backup DB before import.
- Reconcile parent/child quantities after import.

## Direct Gap Closure

The Excel data can materially close these UI gaps:

- Buyer contract info.
- MV/vessel nomination.
- BL/discharge/factory quantities.
- Payment/bank status.
- Quality contract-versus-actual.
- Supplier allocation source/jetty/barge/COB.
- LHV/BL/document status.
- Contract/legal/PEB checklist.
- Freight/laytime/demurrage.
- Remarks/issues and document handoffs.

It does **not** automatically prove:

- Current production truth after the spreadsheet date.
- Correct parent mapping for every row.
- Safe automated status transitions.
- Current file attachments, unless files are separately available.

## Importer Execution Status

`scripts/enrich-from-excel.ts` now supports:

- Both client workbooks.
- Dry-run default; no DB connection required.
- Provenance: file/sheet/row.
- Normalized parent candidate and child nomination candidate.
- Excel serial date parsing.
- Text laycan range parsing.
- Basic conflict report.
- TB-only rows excluded from automatic MV creation.
- `--apply` remains explicit and requires live DB/reviewed source.

Latest dry-run result after forward-filling `MV./PROJECT NAME` across child rows and excluding ambiguous TB-only parents:

```text
candidates: 162
parent groups: 18
child nomination candidates: 140
conflicts: 0
```

Report:

```text
docs_rewrite/excel-import-dry-run.json
```

The importer now reads the main MV/Barge sheets with the actual row structure: one MV parent value followed by multiple nomination rows. It forward-fills the parent MV across those rows. It does not guess parent relationships for TB-only rows. Duplicate nomination candidates remain visible in provenance for later idempotent review.

## Next Implementation Standard

Build an import/provenance layer before populating missing UI fields. The importer must produce:

```text
normalized parent MV
normalized child nomination
buyer-side delivery record
supplier-side allocation record
payment/bank record
quality comparison record
document workflow record
provenance and conflict report
```

*End of raw Excel mapping document.*
