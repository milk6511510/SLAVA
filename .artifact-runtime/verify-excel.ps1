$ErrorActionPreference = 'Stop'
$path = 'C:\Users\yk752\Documents\Codex\2026-10-09\slava-logo-logo\outputs\01a11e92-a77a-7a32-84c4-2a79ea019f63\SLAVA_budget_model.xlsx'
$excel = $null; $wb = $null
try {
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $excel.DisplayAlerts = $false
    $wb = $excel.Workbooks.Open($path, $false, $true)
    $names = @(); for ($i=1; $i -le $wb.Worksheets.Count; $i++) { $names += $wb.Worksheets.Item($i).Name }
    Write-Output ('sheets=' + ($names -join ','))
    $summary = $wb.Worksheets.Item('Summary')
    $assumptions = $wb.Worksheets.Item('Assumptions')
    Write-Output ('summary_B13=' + $summary.Range('B13').Value2)
    Write-Output ('summary_B14=' + $summary.Range('B14').Value2)
    Write-Output ('summary_B15=' + $summary.Range('B15').Value2)
    Write-Output ('summary_formula_B13=' + $summary.Range('B13').Formula)
    Write-Output ('summary_formula_G8=' + $summary.Range('G8').Formula)
    Write-Output ('assumptions_B17=' + $assumptions.Range('B17').Value2)
    Write-Output ('assumptions_B19=' + $assumptions.Range('B19').Value2)
    Write-Output ('assumptions_B22=' + $assumptions.Range('B22').Value2)
    $errors = @()
    for ($s=1; $s -le $wb.Worksheets.Count; $s++) {
        $ws = $wb.Worksheets.Item($s)
        try {
            $bad = $ws.UsedRange.SpecialCells(-4123, 16)
            $errors += ($ws.Name + '!formula-error-cells=' + $bad.CountLarge)
        } catch {
            # Excel raises when no formula error cells exist.
        }
    }
    Write-Output ('formula_errors=' + $errors.Count)
    if ($errors.Count -gt 0) { $errors | ForEach-Object { Write-Output $_ } }
    $wb.Close($false); $excel.Quit()
}
finally {
    if ($wb) { try { [System.Runtime.InteropServices.Marshal]::ReleaseComObject($wb) | Out-Null } catch {} }
    if ($excel) { try { [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null } catch {} }
    [GC]::Collect(); [GC]::WaitForPendingFinalizers()
}
