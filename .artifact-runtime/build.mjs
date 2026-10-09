import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = "C:/Users/yk752/Documents/Codex/2026-10-09/slava-logo-logo/outputs/01a11e92-a77a-7a32-84c4-2a79ea019f63";
const outputPath = `${outputDir}/SLAVA_budget_model.xlsx`;
const previewDir = "C:/Users/yk752/Documents/Codex/2026-10-09/slava-logo-logo/.artifact-runtime";
const fontFamily = "Arial";
const wine = "#351924";
const wineLight = "#5C2434";
const cream = "#F7F2E9";
const brass = "#B9824A";
const ink = "#1C2024";
const muted = "#77756F";
const inputFill = "#FFF2C2";
const inputBlue = "#0000FF";
const linkGreen = "#008000";

await fs.mkdir(outputDir, { recursive: true });

const workbook = Workbook.create();
const summary = workbook.worksheets.add("Summary");
const assumptions = workbook.worksheets.add("Assumptions");
const unitEconomics = workbook.worksheets.add("Unit_Economics");
const sources = workbook.worksheets.add("Sources");

for (const sheet of [summary, assumptions, unitEconomics, sources]) {
  sheet.showGridLines = false;
  sheet.getRange("A1:L60").format.font = { name: fontFamily, size: 10, color: ink };
}

const title = (sheet, text, subtitle, endColumn) => {
  sheet.getRange(`A2:${endColumn}2`).format.font = { name: fontFamily, size: 16, bold: true, color: wine };
  sheet.getRange("A2").values = [[text]];
  sheet.getRange(`A2:${endColumn}2`).format.borders = { bottom: { style: "thin", color: brass } };
  sheet.getRange("A3").values = [[subtitle]];
  sheet.getRange(`A3:${endColumn}3`).format.font = { name: fontFamily, size: 10, italic: true, color: muted };
};

const header = (sheet, range) => {
  const r = sheet.getRange(range);
  r.format = { fill: wine, font: { name: fontFamily, size: 10, bold: true, color: "#FFFFFF" }, verticalAlignment: "center", wrapText: true };
  r.format.borders = { bottom: { style: "thin", color: "#FFFFFF" } };
};

const section = (sheet, range, text) => {
  sheet.getRange(range).merge();
  sheet.getRange(range).values = [[text]];
  sheet.getRange(range).format = { fill: wineLight, font: { name: fontFamily, size: 10, bold: true, color: "#FFFFFF" } };
};

const setWidths = (sheet, widths) => {
  Object.entries(widths).forEach(([column, width]) => {
    sheet.getRange(`${column}:${column}`).format.columnWidth = width;
  });
};

// Summary
title(summary, "SLAVA 資金準備模型", "NT$；初始示例值均可修改，模型用來估算啟動現金與嘖嘖募資目標。", "J");
summary.getRange("A5").values = [["情境比較"]];
summary.getRange("A5").format.font = { name: fontFamily, size: 11, bold: true, color: wine };
summary.getRange("A6:J6").values = [["情境", "用途", "前置固定費", "生產與履約", "預備金", "需先準備現金", "建議募資總額", "混合貢獻／件", "損益平衡件數", "備註"]];
header(summary, "A6:J6");
summary.getRange("A7:J9").values = [
  ["", "", null, null, null, null, null, null, null, ""],
  ["", "", null, null, null, null, null, null, null, ""],
  ["", "", null, null, null, null, null, null, null, ""]
];
summary.getRange("A7:A9").formulas = [["=Assumptions!D9"], ["=Assumptions!D10"], ["=Assumptions!D11"]];
summary.getRange("B7:B9").formulas = [["=Assumptions!E9"], ["=Assumptions!E10"], ["=Assumptions!E11"]];
summary.getRange("C7:C9").formulas = [["=Assumptions!F9"], ["=Assumptions!F10"], ["=Assumptions!F11"]];
summary.getRange("D7:D9").formulas = [["=Assumptions!G9*Assumptions!$B$17+Assumptions!H9*Assumptions!$B$18"], ["=Assumptions!G10*Assumptions!$B$17+Assumptions!H10*Assumptions!$B$18"], ["=Assumptions!G11*Assumptions!$B$17+Assumptions!H11*Assumptions!$B$18"]];
summary.getRange("E7:E9").formulas = [["=(C7+D7)*Assumptions!I9"], ["=(C8+D8)*Assumptions!I10"], ["=(C9+D9)*Assumptions!I11"]];
summary.getRange("F7:F9").formulas = [["=C7+D7+E7"], ["=C8+D8+E8"], ["=C9+D9+E9"]];
summary.getRange("G7:G9").formulas = [["=F7/(1-Assumptions!$B$8)"], ["=F8/(1-Assumptions!$B$8)"], ["=F9/(1-Assumptions!$B$8)"]];
summary.getRange("H7:H9").formulas = [["=Assumptions!$B$21*Assumptions!$B$19+Assumptions!$B$22*Assumptions!$B$20"], ["=Assumptions!$B$21*Assumptions!$B$19+Assumptions!$B$22*Assumptions!$B$20"], ["=Assumptions!$B$21*Assumptions!$B$19+Assumptions!$B$22*Assumptions!$B$20"]];
summary.getRange("I7:I9").formulas = [["=F7/H7"], ["=F8/H8"], ["=F9/H9"]];
summary.getRange("J7:J9").values = [["先做驗證，不先大量備貨"], ["建議作為第一輪嘖嘖目標"], ["MOQ／交期壓力較高時使用"]];
summary.getRange("A7:J9").format.borders = { insideHorizontal: { style: "thin", color: "#E2D8CD" }, bottom: { style: "thin", color: "#E2D8CD" } };
summary.getRange("A7:I9").format.font = { name: fontFamily, size: 10, color: linkGreen };
summary.getRange("J7:J9").format.font = { name: fontFamily, size: 9, color: muted };
summary.getRange("C7:H9").format.numberFormat = [["#,##0", "#,##0", "#,##0", "#,##0", "#,##0", "#,##0"], ["#,##0", "#,##0", "#,##0", "#,##0", "#,##0", "#,##0"], ["#,##0", "#,##0", "#,##0", "#,##0", "#,##0", "#,##0"]];
summary.getRange("I7:I9").format.numberFormat = [["#,##0"], ["#,##0"], ["#,##0"]];

section(summary, "A12:D12", "本輪建議");
summary.getRange("A13:B16").values = [["建議先準備現金", null], ["建議募資總額", null], ["預計平台／金流費率", null], ["模型限制", "產品成本、MOQ、運費與售價尚未取得供應商正式報價"]];
summary.getRange("B13").formulas = [["=F8"]];
summary.getRange("B14").formulas = [["=G8"]];
summary.getRange("B15").formulas = [["=Assumptions!B8"]];
summary.getRange("A13:A16").format.font = { name: fontFamily, size: 10, bold: true, color: wine };
summary.getRange("B13:B15").format.font = { name: fontFamily, size: 12, bold: true, color: wine };
summary.getRange("B13:B14").format.numberFormat = [["#,##0"], ["#,##0"]];
summary.getRange("B15").format.numberFormat = [["0.0%"]];
summary.getRange("B16").format.font = { name: fontFamily, size: 9, color: muted };
summary.getRange("A13:B16").format.borders = { bottom: { style: "thin", color: "#E2D8CD" } };

section(summary, "F12:J12", "如何使用");
summary.getRange("F13:J16").merge();
summary.getRange("F13:J16").values = [["先在 Assumptions 工作表把黃色欄位換成真實報價。\n\n1. 填入兩款產品的單位成本、包裝、檢測與履約預備金。\n2. 填入你預計的首批數量與前置製作費。\n3. 回到 Summary 看需先準備的現金與嘖嘖募資總額。\n\n這不是會計報表；它是募資前的現金需求與單位經濟估算。"]];
summary.getRange("F13:J16").format = { fill: cream, font: { name: fontFamily, size: 10, color: muted }, wrapText: true, verticalAlignment: "top" };

summary.freezePanes.freezeRows(6);
setWidths(summary, { A: 17, B: 18, C: 14, D: 15, E: 12, F: 15, G: 15, H: 14, I: 14, J: 25 });

// Assumptions
title(assumptions, "可修改假設", "黃色底／藍色字為需要替換的初始示例值；所有金額單位為 NT$。", "J");
section(assumptions, "A6:B6", "共通假設");
assumptions.getRange("A8:B22").values = [
  ["平台＋金流費率", 0.08],
  ["退款／瑕疵預備率", 0.05],
  ["LONG 預計售價", 2480],
  ["ROUND 預計售價", 2880],
  ["LONG 產品製造成本／件", 1000],
  ["ROUND 產品製造成本／件", 1200],
  ["包裝／件", 250],
  ["檢測與裝配／件", 100],
  ["出貨與履約預備／件", 180],
  ["LONG 變動成本／件", null],
  ["ROUND 變動成本／件", null],
  ["LONG 單位貢獻", null],
  ["ROUND 單位貢獻", null],
  ["預計 LONG 銷售占比", 0.6],
  ["預計 ROUND 銷售占比", null]
];
assumptions.getRange("B17:B20").formulas = [["=B12+B14+B15+B16"], ["=B13+B14+B15+B16"], ["=B10-B17"], ["=B11-B18"]];
assumptions.getRange("B22").formulas = [["=1-B21"]];
assumptions.getRange("A8:A22").format.font = { name: fontFamily, size: 10, color: ink };
assumptions.getRange("B8:B16").format = { fill: inputFill, font: { name: fontFamily, size: 10, color: inputBlue } };
assumptions.getRange("B21").format = { fill: inputFill, font: { name: fontFamily, size: 10, color: inputBlue } };
assumptions.getRange("B17:B20").format.font = { name: fontFamily, size: 10, color: ink };
assumptions.getRange("B22").format.font = { name: fontFamily, size: 10, color: ink };
assumptions.getRange("B8:B9").format.numberFormat = [["0.0%"], ["0.0%"]];
assumptions.getRange("B10:B20").format.numberFormat = Array.from({ length: 11 }, () => ["#,##0"]);
assumptions.getRange("B21:B22").format.numberFormat = [["0.0%"], ["0.0%"]];

section(assumptions, "D6:J6", "募資情境假設");
assumptions.getRange("D8:J8").values = [["情境", "用途", "前置固定費", "LONG 件數", "ROUND 件數", "預備金率", "用途說明"]];
header(assumptions, "D8:J8");
assumptions.getRange("D9:J11").values = [
  ["Lean validation", "學生／老師試用", 180000, 10, 6, 0.10, "先驗證需求與適配"],
  ["Launch ready", "嘖嘖第一輪", 320000, 36, 24, 0.10, "含內容、樣品與首批小量"],
  ["Production safe", "MOQ／交期安全", 520000, 120, 80, 0.15, "含較大首批與現金緩衝"]
];
assumptions.getRange("D9:J11").format.borders = { insideHorizontal: { style: "thin", color: "#E2D8CD" }, bottom: { style: "thin", color: "#E2D8CD" } };
assumptions.getRange("F9:I11").format = { fill: inputFill, font: { name: fontFamily, size: 10, color: inputBlue } };
assumptions.getRange("D9:E11").format.font = { name: fontFamily, size: 10, color: ink };
assumptions.getRange("J9:J11").format.font = { name: fontFamily, size: 9, color: muted };
assumptions.getRange("F9:F11").format.numberFormat = [["#,##0"], ["#,##0"], ["#,##0"]];
assumptions.getRange("I9:I11").format.numberFormat = [["0.0%"], ["0.0%"], ["0.0%"]];

section(assumptions, "A25:D25", "格式圖例");
assumptions.getRange("A26:B29").values = [["藍字＋黃色底", "需要換成你的真實報價／數量"], ["黑字", "同一張表內的計算"], ["綠字", "跨工作表連結"], ["資料狀態", "初始示例值，不代表正式報價"]];
assumptions.getRange("A26:A29").format.font = { name: fontFamily, size: 9, bold: true, color: wine };
assumptions.getRange("B26:B29").format.font = { name: fontFamily, size: 9, color: muted };
assumptions.getRange("A26:B29").format.borders = { bottom: { style: "thin", color: "#E2D8CD" } };
assumptions.freezePanes.freezeRows(8);
setWidths(assumptions, { A: 27, B: 15, C: 3, D: 18, E: 17, F: 15, G: 12, H: 13, I: 12, J: 27 });

// Unit economics
title(unitEconomics, "單位經濟", "以產品售價與每件變動成本估算貢獻；價格與成本皆為可替換的初始示例。", "G");
unitEconomics.getRange("A6:G6").values = [["產品", "預計售價", "變動成本／件", "單位貢獻", "毛利率", "預計銷售占比", "加權貢獻"]];
header(unitEconomics, "A6:G6");
unitEconomics.getRange("A7:G9").values = [["LONG", null, null, null, null, null, null], ["ROUND", null, null, null, null, null, null], ["加權平均", null, null, null, null, null, null]];
unitEconomics.getRange("B7:B8").formulas = [["=Assumptions!B10"], ["=Assumptions!B11"]];
unitEconomics.getRange("C7:C8").formulas = [["=Assumptions!B17"], ["=Assumptions!B18"]];
unitEconomics.getRange("D7:D8").formulas = [["=B7-C7"], ["=B8-C8"]];
unitEconomics.getRange("E7:E8").formulas = [["=D7/B7"], ["=D8/B8"]];
unitEconomics.getRange("F7:F8").formulas = [["=Assumptions!B21"], ["=Assumptions!B22"]];
unitEconomics.getRange("G7:G8").formulas = [["=D7*F7"], ["=D8*F8"]];
unitEconomics.getRange("B9").formulas = [["=B7*F7+B8*F8"]];
unitEconomics.getRange("C9").formulas = [["=C7*F7+C8*F8"]];
unitEconomics.getRange("D9").formulas = [["=D7*F7+D8*F8"]];
unitEconomics.getRange("E9").formulas = [["=D9/B9"]];
unitEconomics.getRange("F9").formulas = [["=F7+F8"]];
unitEconomics.getRange("G9").formulas = [["=G7+G8"]];
unitEconomics.getRange("A7:G8").format.font = { name: fontFamily, size: 10, color: linkGreen };
unitEconomics.getRange("A9:G9").format = { fill: cream, font: { name: fontFamily, size: 10, bold: true, color: ink } };
unitEconomics.getRange("A7:G9").format.borders = { insideHorizontal: { style: "thin", color: "#E2D8CD" }, bottom: { style: "thin", color: "#E2D8CD" } };
unitEconomics.getRange("B7:D9").format.numberFormat = [["#,##0", "#,##0", "#,##0"], ["#,##0", "#,##0", "#,##0"], ["#,##0", "#,##0", "#,##0"]];
unitEconomics.getRange("E7:F9").format.numberFormat = [["0.0%", "0.0%"], ["0.0%", "0.0%"], ["0.0%", "0.0%"]];
unitEconomics.getRange("G7:G9").format.numberFormat = [["#,##0"], ["#,##0"], ["#,##0"]];
section(unitEconomics, "A13:G13", "解讀");
unitEconomics.getRange("A14:G16").merge();
unitEconomics.getRange("A14:G16").values = [["單位貢獻 = 售價 − 變動成本。\n\n損益平衡件數以 Summary 的需先準備現金 ÷ 混合貢獻／件估算，實際募資還要依兩款產品的真實訂單組合、平台費、稅務、退貨與交期修正。"]];
unitEconomics.getRange("A14:G16").format = { fill: cream, font: { name: fontFamily, size: 10, color: muted }, wrapText: true, verticalAlignment: "top" };
unitEconomics.freezePanes.freezeRows(6);
setWidths(unitEconomics, { A: 18, B: 15, C: 17, D: 14, E: 12, F: 14, G: 14 });

// Sources
title(sources, "來源與假設備註", "官方來源保留在此頁；成本、售價、數量是待替換的工作假設。", "F");
sources.getRange("A6:F6").values = [["項目", "內容", "單位", "來源類型", "來源／網址", "備註"]];
header(sources, "A6:F6");
sources.getRange("A7:F12").values = [
  ["嘖嘖平台＋金流費", "8.0%（可修改）", "%", "官方平台資訊", "https://www.zeczec.com/docs/funds-rules", "公開資訊約 5.5% 平台費＋約 2.5% 金流費，實際依契約與付款方式為準"],
  ["商業登記", "正式預購／營利交易前建議評估行號", "制度", "政府官方", "https://www.gov.tw/News_Content_2_828377", "商業登記申辦說明"],
  ["SBIR", "補助資格與上限依最新公告", "制度", "政府官方", "https://sbir.sme.gov.tw/", "是否適用取決於登記狀態與研發計畫"],
  ["產品製造成本", "示例值，請替換", "NT$/件", "使用者／供應商報價", "", "尚未取得正式報價"],
  ["包裝、檢測、履約", "示例值，請替換", "NT$/件", "工作假設", "", "待打樣、跌落測試與物流報價"],
  ["售價與首批數量", "示例值，請替換", "NT$／件、件數", "工作假設", "", "需依學生客群、MOQ 與實測價值修正"]
];
sources.getRange("A7:F12").format.wrapText = true;
sources.getRange("A7:F12").format.borders = { insideHorizontal: { style: "thin", color: "#E2D8CD" }, bottom: { style: "thin", color: "#E2D8CD" } };
sources.getRange("A7:F12").format.verticalAlignment = "top";
sources.getRange("A7:A12").format.font = { name: fontFamily, size: 10, bold: true, color: wine };
sources.getRange("B7:F12").format.font = { name: fontFamily, size: 9, color: ink };
setWidths(sources, { A: 20, B: 27, C: 14, D: 18, E: 48, F: 42 });

const summaryPreview = await workbook.render({ sheetName: "Summary", range: "A1:J16", scale: 1.2, format: "png" });
await fs.writeFile(`${previewDir}/summary-preview.png`, new Uint8Array(await summaryPreview.arrayBuffer()));
const assumptionsPreview = await workbook.render({ sheetName: "Assumptions", range: "A1:J29", scale: 1.0, format: "png" });
await fs.writeFile(`${previewDir}/assumptions-preview.png`, new Uint8Array(await assumptionsPreview.arrayBuffer()));

const keyInspect = await workbook.inspect({ kind: "table", range: "Summary!A1:J16", include: "values,formulas", tableMaxRows: 20, tableMaxCols: 12, tableMaxCellChars: 120 });
console.log(keyInspect.ndjson);
const errors = await workbook.inspect({ kind: "match", searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!", options: { useRegex: true, maxResults: 300 }, summary: "final formula error scan" });
console.log(errors.ndjson);

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);
console.log(`saved=${outputPath}`);
