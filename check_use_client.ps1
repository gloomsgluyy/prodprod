$hookPattern = 'useState|useEffect|useQuery|useMutation|useForm|useStore'
$results = @()
$files = Get-ChildItem -Path "c:\CoalTrade-Production\src\modules" -Recurse -Filter "*.tsx" -ErrorAction SilentlyContinue
foreach ($f in $files) {
    $content = Get-Content $f.FullName -Raw -ErrorAction SilentlyContinue
    if (-not $content) { continue }
    $firstLine = ($content -split "`n")[0].Trim().Trim('"').Trim("'")
    if ($firstLine -eq 'use client') { continue }
    if ($content -match $hookPattern) {
        $results += $f.FullName
    }
}
$results | Sort-Object
