$files = @(
  "src\modules\audit-logs\components\audit-logs-client.tsx",
  "src\modules\auth\components\login-form.tsx",
  "src\modules\blending-simulator\components\blending-client.tsx",
  "src\modules\dashboard\components\executive-panels.tsx",
  "src\modules\directory\components\directory-client.tsx",
  "src\modules\expenses\components\expense-client.tsx",
  "src\modules\expenses\components\expense-form-modal.tsx",
  "src\modules\forecast-sales\components\approval-modal.tsx",
  "src\modules\forecast-sales\components\convert-shipment-modal.tsx",
  "src\modules\forecast-sales\components\forecast-form-modal.tsx",
  "src\modules\forecast-sales\components\mark-failed-modal.tsx",
  "src\modules\market-price\components\price-history.tsx",
  "src\modules\market-price\components\price-input-form.tsx",
  "src\modules\meetings\components\meetings-client.tsx",
  "src\modules\outstanding-payment\components\payment-form-modal.tsx",
  "src\modules\profit-loss\components\pl-client.tsx",
  "src\modules\quality-control\components\quality-form-modal.tsx",
  "src\modules\sales-monitor\components\deal-modal.tsx",
  "src\modules\shipment-monitor\components\daily-delivery-tab.tsx",
  "src\modules\shipment-monitor\components\shipment-form-modal.tsx",
  "src\modules\shipment-monitor\components\tabs\tab-documents.tsx",
  "src\modules\shipment-monitor\components\tabs\tab-financial.tsx",
  "src\modules\shipment-monitor\components\tabs\tab-info.tsx",
  "src\modules\shipment-monitor\components\tabs\tab-issues.tsx",
  "src\modules\shipment-monitor\components\tabs\tab-si.tsx",
  "src\modules\shipment-monitor\components\tabs\tab-source-barge.tsx",
  "src\modules\sources\components\source-form-modal.tsx",
  "src\modules\tasks\components\task-detail-dialog.tsx",
  "src\modules\tasks\components\task-form-modal.tsx",
  "src\modules\tasks\components\task-kanban.tsx",
  "src\modules\transshipment\components\transshipment-client.tsx",
  "src\modules\user-management\components\users-client.tsx"
)

$root = "c:\CoalTrade-Production"
$fixed = 0
$skipped = 0

foreach ($rel in $files) {
  $path = Join-Path $root $rel
  if (-not (Test-Path $path)) {
    Write-Host "SKIP (not found): $rel"
    $skipped++
    continue
  }
  $content = Get-Content $path -Raw
  if ($content.TrimStart().StartsWith('"use client"')) {
    Write-Host "SKIP (already has): $rel"
    $skipped++
    continue
  }
  # Prepend "use client"; with newline
  $newContent = '"use client";' + "`r`n" + $content
  Set-Content $path -Value $newContent -NoNewline
  Write-Host "FIXED: $rel"
  $fixed++
}

Write-Host ""
Write-Host "Done - Fixed: $fixed  Skipped: $skipped"
