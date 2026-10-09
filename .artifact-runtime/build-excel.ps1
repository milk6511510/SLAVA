$ErrorActionPreference = 'Stop'

$outputDir = 'C:\Users\yk752\Documents\Codex\2026-10-09\slava-logo-logo\outputs\01a11e92-a77a-7a32-84c4-2a79ea019f63'
$outputPath = Join-Path $outputDir 'SLAVA_budget_model.xlsx'
New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

function HexColor([string]$hex) {
    $h = $hex.TrimStart('#')
    $r = [Convert]::ToInt32($h.Substring(0, 2), 16)
    $g = [Convert]::ToInt32($h.Substring(2, 2), 16)
    $b = [Convert]::ToInt32($h.Substring(4, 2), 16)
    return ($b -shl 16) -bor ($g -shl 8) -bor $r
}

$wine = HexColor '#351924'
$wineLight = HexColor '#5C2434'
$cream = HexColor '#F7F2E9'
$brass = HexColor '#B9824A'
$ink = HexColor '#1C2024'
$muted = HexColor '#77756F'
$inputFill = HexColor '#FFF2C2'
$inputBlue = HexColor '#0000FF'
$linkGreen = HexColor '#008000'
$line = HexColor '#E2D8CD'
$white = HexColor '#FFFFFF'

function Set-Cell($ws, [string]$address, $value) {
    $ws.Range($address).Value2 = $value
}

function Set-Formula($ws, [string]$address, [string]$formula) {
    $ws.Range($address).Formula = $formula
}

function Set-Values($ws, [int]$startRow, [int]$startCol, [object[]]$rows) {
    for ($r = 0; $r -lt $rows.Count; $r++) {
        $row = $rows[$r]
        for ($c = 0; $c -lt $row.Count; $c++) {
            $cell = $ws.Cells.Item($startRow + $r, $startCol + $c)
            try {
                $value = $row[$c]
                if ($null -eq $value) {
                    $cell.Value2 = ''
                } elseif ($value -is [ValueType] -and $value -isnot [bool]) {
                    $cell.Value2 = [double]$value
                } else {
                    $cell.Value2 = [string]$value
                }
            } catch {
                throw ("Set-Values failed at row={0}, col={1}; valueType={2}; value={3}; error={4}" -f ($startRow + $r), ($startCol + $c), $value.GetType().FullName, $value, $_.Exception.Message)
            }
        }
    }
}

function Apply-Font($range, [int]$size = 10, [int]$color = $ink, [bool]$bold = $false, [bool]$italic = $false) {
    $range.Font.Name = 'Arial'
    $range.Font.Size = $size
    $range.Font.Color = $color
    $range.Font.Bold = $bold
    $range.Font.Italic = $italic
}

function Apply-Borders($range, [int]$color = $line) {
    $range.Borders.LineStyle = 1
    $range.Borders.Color = $color
}

function Apply-Title($ws, [string]$text, [string]$subtitle, [int]$endCol) {
    $ws.Cells.Item(2, 1).Value2 = $text
    Apply-Font $ws.Range($ws.Cells.Item(2, 1), $ws.Cells.Item(2, $endCol)) 16 $wine $true $false
    $ws.Range($ws.Cells.Item(2, 1), $ws.Cells.Item(2, $endCol)).Borders.Item(9).LineStyle = 1
    $ws.Range($ws.Cells.Item(2, 1), $ws.Cells.Item(2, $endCol)).Borders.Item(9).Color = $brass
    $ws.Cells.Item(3, 1).Value2 = $subtitle
    Apply-Font $ws.Range($ws.Cells.Item(3, 1), $ws.Cells.Item(3, $endCol)) 10 $muted $false $true
}

function Apply-Header($ws, [string]$address) {
    $range = $ws.Range($address)
    $range.Interior.Color = $wine
    Apply-Font $range 10 $white $true $false
    $range.WrapText = $true
    $range.VerticalAlignment = -4108
    Apply-Borders $range $white
}

function Apply-Section($ws, [string]$address, [string]$text) {
    $range = $ws.Range($address)
    $range.Merge()
    $range.Cells.Item(1, 1).Value2 = $text
    $range.Interior.Color = $wineLight
    Apply-Font $range 10 $white $true $false
}

function Set-ColumnWidths($ws, [hashtable]$widths) {
    foreach ($pair in $widths.GetEnumerator()) {
        $col = [int][char]$pair.Key.ToUpperInvariant() - [int][char]'A' + 1
        $ws.Columns.Item($col).ColumnWidth = $pair.Value
    }
}

$excel = $null
$wb = $null
try {
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $excel.DisplayAlerts = $false
    $excel.ScreenUpdating = $false
    $wb = $excel.Workbooks.Add()

    $summary = $wb.Worksheets.Item(1)
    $summary.Name = 'Summary'
    $assumptions = $wb.Worksheets.Add()
    $assumptions.Name = 'Assumptions'
    $unitEconomics = $wb.Worksheets.Add()
    $unitEconomics.Name = 'Unit_Economics'
    $sources = $wb.Worksheets.Add()
    $sources.Name = 'Sources'

    foreach ($ws in @($summary, $assumptions, $unitEconomics, $sources)) {
        $ws.Activate()
        $excel.ActiveWindow.DisplayGridlines = $false
        Apply-Font $ws.Range('A1:L60') 10 $ink $false $false
    }

    # Summary
    Apply-Title $summary 'SLAVA 資金準備模型' 'NT$；初始示例值均可修改，模型用來估算啟動現金與嘖嘖募資目標。' 10
    Set-Cell $summary 'A5' '情境比較'
    Apply-Font $summary.Range('A5') 11 $wine $true $false
    Set-Values $summary 6 1 @(
        @('情境','用途','前置固定費','生產與履約','預備金','需先準備現金','建議募資總額','混合貢獻／件','損益平衡件數','備註'),
        @($null,$null,$null,$null,$null,$null,$null,$null,$null,$null),
        @($null,$null,$null,$null,$null,$null,$null,$null,$null,$null),
        @($null,$null,$null,$null,$null,$null,$null,$null,$null,$null)
    )
    Apply-Header $summary 'A6:J6'
    Set-Formula $summary 'A7' '=Assumptions!D9'; Set-Formula $summary 'A8' '=Assumptions!D10'; Set-Formula $summary 'A9' '=Assumptions!D11'
    Set-Formula $summary 'B7' '=Assumptions!E9'; Set-Formula $summary 'B8' '=Assumptions!E10'; Set-Formula $summary 'B9' '=Assumptions!E11'
    Set-Formula $summary 'C7' '=Assumptions!F9'; Set-Formula $summary 'C8' '=Assumptions!F10'; Set-Formula $summary 'C9' '=Assumptions!F11'
    Set-Formula $summary 'D7' '=Assumptions!G9*Assumptions!$B$17+Assumptions!H9*Assumptions!$B$18'; Set-Formula $summary 'D8' '=Assumptions!G10*Assumptions!$B$17+Assumptions!H10*Assumptions!$B$18'; Set-Formula $summary 'D9' '=Assumptions!G11*Assumptions!$B$17+Assumptions!H11*Assumptions!$B$18'
    Set-Formula $summary 'E7' '=(C7+D7)*Assumptions!I9'; Set-Formula $summary 'E8' '=(C8+D8)*Assumptions!I10'; Set-Formula $summary 'E9' '=(C9+D9)*Assumptions!I11'
    Set-Formula $summary 'F7' '=C7+D7+E7'; Set-Formula $summary 'F8' '=C8+D8+E8'; Set-Formula $summary 'F9' '=C9+D9+E9'
    Set-Formula $summary 'G7' '=F7/(1-Assumptions!$B$8)'; Set-Formula $summary 'G8' '=F8/(1-Assumptions!$B$8)'; Set-Formula $summary 'G9' '=F9/(1-Assumptions!$B$8)'
    Set-Formula $summary 'H7' '=Assumptions!$B$21*Assumptions!$B$19+Assumptions!$B$22*Assumptions!$B$20'; Set-Formula $summary 'H8' '=Assumptions!$B$21*Assumptions!$B$19+Assumptions!$B$22*Assumptions!$B$20'; Set-Formula $summary 'H9' '=Assumptions!$B$21*Assumptions!$B$19+Assumptions!$B$22*Assumptions!$B$20'
    Set-Formula $summary 'I7' '=F7/H7'; Set-Formula $summary 'I8' '=F8/H8'; Set-Formula $summary 'I9' '=F9/H9'
    Set-Values $summary 7 10 @(@('先做驗證，不先大量備貨'),@('建議作為第一輪嘖嘖目標'),@('MOQ／交期壓力較高時使用'))
    Apply-Font $summary.Range('A7:I9') 10 $linkGreen $false $false
    Apply-Font $summary.Range('J7:J9') 9 $muted $false $false
    $summary.Range('C7:H9').NumberFormat = '#,##0'; $summary.Range('I7:I9').NumberFormat = '#,##0'
    Apply-Borders $summary.Range('A7:J9')

    Apply-Section $summary 'A12:D12' '本輪建議'
    Set-Values $summary 13 1 @(
        @('建議先準備現金',$null), @('建議募資總額',$null), @('預計平台／金流費率',$null), @('模型限制','產品成本、MOQ、運費與售價尚未取得供應商正式報價')
    )
    Set-Formula $summary 'B13' '=F8'; Set-Formula $summary 'B14' '=G8'; Set-Formula $summary 'B15' '=Assumptions!B8'
    Apply-Font $summary.Range('A13:A16') 10 $wine $true $false; Apply-Font $summary.Range('B13:B15') 12 $wine $true $false; Apply-Font $summary.Range('B16') 9 $muted $false $false
    $summary.Range('B13:B14').NumberFormat = '#,##0'; $summary.Range('B15').NumberFormat = '0.0%'; Apply-Borders $summary.Range('A13:B16')

    Apply-Section $summary 'F12:J12' '如何使用'
    $summary.Range('F13:J16').Merge()
    $summary.Range('F13').Value2 = "先在 Assumptions 工作表把黃色欄位換成真實報價。`n`n1. 填入兩款產品的單位成本、包裝、檢測與履約預備金。`n2. 填入你預計的首批數量與前置製作費。`n3. 回到 Summary 看需先準備的現金與嘖嘖募資總額。`n`n這不是會計報表；它是募資前的現金需求與單位經濟估算。"
    $summary.Range('F13:J16').Interior.Color = $cream; Apply-Font $summary.Range('F13:J16') 10 $muted $false $false; $summary.Range('F13:J16').WrapText = $true; $summary.Range('F13:J16').VerticalAlignment = -4160
    Set-ColumnWidths $summary @{A=17;B=18;C=14;D=15;E=12;F=15;G=15;H=14;I=14;J=25}

    # Assumptions
    Apply-Title $assumptions '可修改假設' '黃色底／藍色字為需要替換的初始示例值；所有金額單位為 NT$。' 10
    Apply-Section $assumptions 'A6:B6' '共通假設'
    Set-Values $assumptions 8 1 @(
        @('平台＋金流費率',0.08),@('退款／瑕疵預備率',0.05),@('LONG 預計售價',2480),@('ROUND 預計售價',2880),@('LONG 產品製造成本／件',1000),@('ROUND 產品製造成本／件',1200),@('包裝／件',250),@('檢測與裝配／件',100),@('出貨與履約預備／件',180),@('LONG 變動成本／件',$null),@('ROUND 變動成本／件',$null),@('LONG 單位貢獻',$null),@('ROUND 單位貢獻',$null),@('預計 LONG 銷售占比',0.6),@('預計 ROUND 銷售占比',$null)
    )
    Set-Formula $assumptions 'B17' '=B12+B14+B15+B16'; Set-Formula $assumptions 'B18' '=B13+B14+B15+B16'; Set-Formula $assumptions 'B19' '=B10-B17'; Set-Formula $assumptions 'B20' '=B11-B18'; Set-Formula $assumptions 'B22' '=1-B21'
    Apply-Font $assumptions.Range('A8:A22') 10 $ink $false $false; $assumptions.Range('B8:B16').Interior.Color = $inputFill; Apply-Font $assumptions.Range('B8:B16') 10 $inputBlue $false $false; $assumptions.Range('B21').Interior.Color = $inputFill; Apply-Font $assumptions.Range('B21') 10 $inputBlue $false $false
    Apply-Font $assumptions.Range('B17:B20') 10 $ink $false $false; Apply-Font $assumptions.Range('B22') 10 $ink $false $false
    $assumptions.Range('B8:B9').NumberFormat = '0.0%'; $assumptions.Range('B10:B20').NumberFormat = '#,##0'; $assumptions.Range('B21:B22').NumberFormat = '0.0%'

    Apply-Section $assumptions 'D6:J6' '募資情境假設'
    Set-Values $assumptions 8 4 @(@('情境','用途','前置固定費','LONG 件數','ROUND 件數','預備金率','用途說明'),@('Lean validation','學生／老師試用',180000,10,6,0.10,'先驗證需求與適配'),@('Launch ready','嘖嘖第一輪',320000,36,24,0.10,'含內容、樣品與首批小量'),@('Production safe','MOQ／交期安全',520000,120,80,0.15,'含較大首批與現金緩衝'))
    Apply-Header $assumptions 'D8:J8'; $assumptions.Range('F9:I11').Interior.Color = $inputFill; Apply-Font $assumptions.Range('F9:I11') 10 $inputBlue $false $false; Apply-Font $assumptions.Range('D9:E11') 10 $ink $false $false; Apply-Font $assumptions.Range('J9:J11') 9 $muted $false $false; $assumptions.Range('F9:F11').NumberFormat = '#,##0'; $assumptions.Range('I9:I11').NumberFormat = '0.0%'; Apply-Borders $assumptions.Range('D9:J11')
    Apply-Section $assumptions 'A25:D25' '格式圖例'
    Set-Values $assumptions 26 1 @(@('藍字＋黃色底','需要換成你的真實報價／數量'),@('黑字','同一張表內的計算'),@('綠字','跨工作表連結'),@('資料狀態','初始示例值，不代表正式報價'))
    Apply-Font $assumptions.Range('A26:A29') 9 $wine $true $false; Apply-Font $assumptions.Range('B26:B29') 9 $muted $false $false; Apply-Borders $assumptions.Range('A26:B29')
    Set-ColumnWidths $assumptions @{A=27;B=15;C=3;D=18;E=17;F=15;G=12;H=13;I=12;J=27}

    # Unit economics
    Apply-Title $unitEconomics '單位經濟' '以產品售價與每件變動成本估算貢獻；價格與成本皆為可替換的初始示例。' 7
    Set-Values $unitEconomics 6 1 @(@('產品','預計售價','變動成本／件','單位貢獻','毛利率','預計銷售占比','加權貢獻'),@('LONG',$null,$null,$null,$null,$null,$null),@('ROUND',$null,$null,$null,$null,$null,$null),@('加權平均',$null,$null,$null,$null,$null,$null))
    Apply-Header $unitEconomics 'A6:G6'
    Set-Formula $unitEconomics 'B7' '=Assumptions!B10'; Set-Formula $unitEconomics 'B8' '=Assumptions!B11'; Set-Formula $unitEconomics 'C7' '=Assumptions!B17'; Set-Formula $unitEconomics 'C8' '=Assumptions!B18'; Set-Formula $unitEconomics 'D7' '=B7-C7'; Set-Formula $unitEconomics 'D8' '=B8-C8'; Set-Formula $unitEconomics 'E7' '=D7/B7'; Set-Formula $unitEconomics 'E8' '=D8/B8'; Set-Formula $unitEconomics 'F7' '=Assumptions!B21'; Set-Formula $unitEconomics 'F8' '=Assumptions!B22'; Set-Formula $unitEconomics 'G7' '=D7*F7'; Set-Formula $unitEconomics 'G8' '=D8*F8'
    Set-Formula $unitEconomics 'B9' '=B7*F7+B8*F8'; Set-Formula $unitEconomics 'C9' '=C7*F7+C8*F8'; Set-Formula $unitEconomics 'D9' '=D7*F7+D8*F8'; Set-Formula $unitEconomics 'E9' '=D9/B9'; Set-Formula $unitEconomics 'F9' '=F7+F8'; Set-Formula $unitEconomics 'G9' '=G7+G8'
    Apply-Font $unitEconomics.Range('A7:G8') 10 $linkGreen $false $false; $unitEconomics.Range('A9:G9').Interior.Color = $cream; Apply-Font $unitEconomics.Range('A9:G9') 10 $ink $true $false; Apply-Borders $unitEconomics.Range('A7:G9'); $unitEconomics.Range('B7:D9').NumberFormat = '#,##0'; $unitEconomics.Range('E7:F9').NumberFormat = '0.0%'; $unitEconomics.Range('G7:G9').NumberFormat = '#,##0'
    Apply-Section $unitEconomics 'A13:G13' '解讀'; $unitEconomics.Range('A14:G16').Merge(); $unitEconomics.Range('A14').Value2 = "單位貢獻 = 售價 − 變動成本。`n`n損益平衡件數以 Summary 的需先準備現金 ÷ 混合貢獻／件估算，實際募資還要依兩款產品的真實訂單組合、平台費、稅務、退貨與交期修正。"; $unitEconomics.Range('A14:G16').Interior.Color = $cream; Apply-Font $unitEconomics.Range('A14:G16') 10 $muted $false $false; $unitEconomics.Range('A14:G16').WrapText = $true; $unitEconomics.Range('A14:G16').VerticalAlignment = -4160
    Set-ColumnWidths $unitEconomics @{A=18;B=15;C=17;D=14;E=12;F=14;G=14}

    # Sources
    Apply-Title $sources '來源與假設備註' '官方來源保留在此頁；成本、售價、數量是待替換的工作假設。' 6
    Set-Values $sources 6 1 @(@('項目','內容','單位','來源類型','來源／網址','備註'),@('嘖嘖平台＋金流費','8.0%（可修改）','%','官方平台資訊','https://www.zeczec.com/docs/funds-rules','公開資訊約 5.5% 平台費＋約 2.5% 金流費，實際依契約與付款方式為準'),@('商業登記','正式預購／營利交易前建議評估行號','制度','政府官方','https://www.gov.tw/News_Content_2_828377','商業登記申辦說明'),@('SBIR','補助資格與上限依最新公告','制度','政府官方','https://sbir.sme.gov.tw/','是否適用取決於登記狀態與研發計畫'),@('產品製造成本','示例值，請替換','NT$/件','使用者／供應商報價',$null,'尚未取得正式報價'),@('包裝、檢測、履約','示例值，請替換','NT$/件','工作假設',$null,'待打樣、跌落測試與物流報價'),@('售價與首批數量','示例值，請替換','NT$／件、件數','工作假設',$null,'需依學生客群、MOQ 與實測價值修正'))
    Apply-Header $sources 'A6:F6'; $sources.Range('A7:F12').WrapText = $true; $sources.Range('A7:F12').VerticalAlignment = -4160; Apply-Borders $sources.Range('A7:F12'); Apply-Font $sources.Range('A7:A12') 10 $wine $true $false; Apply-Font $sources.Range('B7:F12') 9 $ink $false $false
    for ($row = 7; $row -le 9; $row++) { $url = $sources.Cells.Item($row,5).Value2; if ($url) { $sources.Hyperlinks.Add($sources.Cells.Item($row,5), $url) | Out-Null } }
    Set-ColumnWidths $sources @{A=20;B=27;C=14;D=18;E=48;F=42}

    # Calculation and freeze panes
    $excel.CalculateFullRebuild()
    foreach ($ws in @($summary,$assumptions,$unitEconomics,$sources)) {
        $ws.Activate()
        $excel.ActiveWindow.SplitRow = 6
        $excel.ActiveWindow.FreezePanes = $true
    }
    $summary.Activate()
    $wb.SaveAs($outputPath, 51)
    $wb.Close($true)
    $excel.Quit()
    Write-Output ("saved=" + $outputPath)
}
finally {
    if ($wb) { try { [System.Runtime.InteropServices.Marshal]::ReleaseComObject($wb) | Out-Null } catch {} }
    if ($excel) { try { [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null } catch {} }
    [GC]::Collect(); [GC]::WaitForPendingFinalizers()
}
