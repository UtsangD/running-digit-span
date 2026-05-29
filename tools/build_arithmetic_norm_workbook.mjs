import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { SpreadsheetFile, Workbook } from '@oai/artifact-tool';

const repoRoot = process.cwd();
const outputDir = path.join(repoRoot, 'norms');
const outputPath = path.join(outputDir, 'arithmetic-wais-style-norm-template.xlsx');

function extractArray(source, name) {
  const match = source.match(new RegExp(`const ${name} = (\\[[\\s\\S]*?\\]);`));
  if (!match) {
    throw new Error(`Could not find ${name} in arithmetic.js`);
  }
  return vm.runInNewContext(match[1], {});
}

function colName(index) {
  let n = index;
  let name = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    name = String.fromCharCode(65 + rem) + name;
    n = Math.floor((n - 1) / 26);
  }
  return name;
}

function rangeAddress(startCol, startRow, width, height) {
  const endCol = startCol + width - 1;
  const endRow = startRow + height - 1;
  return `${colName(startCol)}${startRow}:${colName(endCol)}${endRow}`;
}

function writeMatrix(sheet, startCol, startRow, values) {
  if (!values.length) return;
  const width = Math.max(...values.map((row) => row.length));
  if (!width) return;
  const normalized = values.map((row) => {
    const out = [...row];
    while (out.length < width) out.push('');
    return out;
  });
  sheet.getRange(rangeAddress(startCol, startRow, width, normalized.length)).values = normalized;
}

function writeFormulas(sheet, startCol, startRow, formulas) {
  if (!formulas.length || !formulas[0].length) return;
  sheet.getRange(rangeAddress(startCol, startRow, formulas[0].length, formulas.length)).formulas = formulas;
}

function styleHeader(sheet, startCol, startRow, width) {
  const range = sheet.getRange(rangeAddress(startCol, startRow, width, 1));
  range.format = {
    fill: '#1F4E79',
    font: { bold: true, color: '#FFFFFF' },
    horizontalAlignment: 'center',
    verticalAlignment: 'center',
    wrapText: true,
  };
}

function styleUsedRange(sheet) {
  const used = sheet.getUsedRange();
  used.format = {
    font: { name: 'Aptos', size: 10, color: '#1F2937' },
    verticalAlignment: 'top',
    wrapText: true,
  };
  used.format.borders = { preset: 'outside', style: 'thin', color: '#D1D5DB' };
}

function setColumnWidths(sheet, widths) {
  widths.forEach((width, idx) => {
    sheet.getRange(`${colName(idx + 1)}:${colName(idx + 1)}`).format.columnWidthPx = width;
  });
}

const source = await fs.readFile(path.join(repoRoot, 'arithmetic.js'), 'utf8');
const tiers = extractArray(source, 'TIER_CONFIG');
const questionBank = extractArray(source, 'QUESTION_BANK');
const tierById = new Map(tiers.map((tier) => [tier.id, tier]));
const sortedItems = questionBank
  .map((item) => ({
    ...item,
    tierLabel: tierById.get(item.tier).label,
    seedAccuracy: tierById.get(item.tier).seedAccuracy,
    seedMedianSeconds: tierById.get(item.tier).seedMedianSeconds,
  }))
  .sort((a, b) => {
    const tierDiff = tiers.findIndex((tier) => tier.id === a.tier) - tiers.findIndex((tier) => tier.id === b.tier);
    return tierDiff || a.id.localeCompare(b.id);
  });

const sessionHeaders = [
  'testType', 'schemaVersion',
  'sessionId', 'timestamp', 'age', 'caitWmi', 'coreWmi', 'completed', 'totalItemsExpected',
  'totalScore', 'maxScore', 'accuracy', 'itemsCompleted',
  'meanResponseTimeMs', 'timedOutCount', 'skippedCount', 'repeatCount',
  'scaledEstimate', 'speechRate',
  'very_easy_correct', 'very_easy_max', 'very_easy_pct',
  'easy_correct', 'easy_max', 'easy_pct',
  'medium_correct', 'medium_max', 'medium_pct',
  'semi_hard_correct', 'semi_hard_max', 'semi_hard_pct',
];

const responseHeaders = [
  'sessionId', 'timestamp', 'age', 'caitWmi', 'coreWmi',
  'itemPosition', 'itemId', 'tier', 'tierLabel', 'concept',
  'score', 'correct', 'rawAnswer', 'correctAnswer',
  'responseTimeMs', 'responseTimeSec', 'timedOut', 'skipped', 'repeatCount',
  'seedAccuracy', 'seedMedianSeconds',
];

const workbook = Workbook.create();
const dashboard = workbook.worksheets.add('Dashboard');
const sessions = workbook.worksheets.add('Sessions');
const responses = workbook.worksheets.add('Item Responses');
const itemBank = workbook.worksheets.add('Item Bank');
const itemNorms = workbook.worksheets.add('Item Norms');
const readme = workbook.worksheets.add('README');

writeMatrix(dashboard, 1, 1, [
  ['Arithmetic WAIS-style norming dashboard', '', '', '', '', '', '', '', '', ''],
  ['Paste session rows into Sessions and item rows into Item Responses. Formulas update the dashboard and item norms.', '', '', '', '', '', '', '', '', ''],
  [],
  ['Sessions', '=COUNTA(Sessions!C2:C2000)', 'Mean accuracy', '=IFERROR(AVERAGE(Sessions!L2:L2000)/100,"")', 'Avg response sec', '=IFERROR(AVERAGE(Sessions!N2:N2000)/1000,"")', 'Mean CAIT WMI', '=IFERROR(AVERAGE(Sessions!F2:F2000),"")', 'Mean CORE WMI', '=IFERROR(AVERAGE(Sessions!G2:G2000),"")'],
  ['Total repeats', '=SUM(Sessions!Q2:Q2000)', '', '', '', '', '', '', '', ''],
  [],
  ['Tier ID', 'Tier', 'Attempts', 'Correct', 'Accuracy', 'Avg RT sec', 'Timeouts', 'Repeats'],
]);
writeMatrix(dashboard, 1, 8, tiers.map((tier) => [tier.id, tier.label, '', '', '', '', '', '']));
writeFormulas(dashboard, 3, 8, tiers.map((tier, index) => {
  const row = 8 + index;
  return [
    `=COUNTIF('Item Responses'!H$2:H$5000,A${row})`,
    `=SUMIF('Item Responses'!H$2:H$5000,A${row},'Item Responses'!K$2:K$5000)`,
    `=IFERROR(D${row}/C${row},"")`,
    `=IFERROR(AVERAGEIF('Item Responses'!H$2:H$5000,A${row},'Item Responses'!P$2:P$5000),"")`,
    `=COUNTIFS('Item Responses'!H$2:H$5000,A${row},'Item Responses'!Q$2:Q$5000,1)`,
    `=SUMIF('Item Responses'!H$2:H$5000,A${row},'Item Responses'!S$2:S$5000)`,
  ];
}));
dashboard.getRange('A1:J1').format = {
  fill: '#0F172A',
  font: { bold: true, color: '#FFFFFF', size: 16 },
  verticalAlignment: 'center',
};
dashboard.getRange('A2:J2').format = {
  fill: '#E0F2FE',
  font: { color: '#0F172A' },
  wrapText: true,
};
dashboard.getRange('A4:J5').format = {
  fill: '#F8FAFC',
  font: { bold: true },
  borders: { preset: 'outside', style: 'thin', color: '#CBD5E1' },
};
styleHeader(dashboard, 1, 7, 8);
dashboard.getRange('D4:D4').format.numberFormat = '0%';
dashboard.getRange('F4:F4').format.numberFormat = '0.0';
dashboard.getRange('H4:J4').format.numberFormat = '0';
dashboard.getRange('E8:E11').format.numberFormat = '0%';
dashboard.getRange('F8:F11').format.numberFormat = '0.0';
setColumnWidths(dashboard, [130, 120, 105, 90, 120, 95, 125, 95, 130, 95]);
dashboard.freezePanes.freezeRows(7);

writeMatrix(sessions, 1, 1, [sessionHeaders]);
styleHeader(sessions, 1, 1, sessionHeaders.length);
setColumnWidths(sessions, sessionHeaders.map((header) => header.length > 18 ? 150 : 112));
sessions.freezePanes.freezeRows(1);

writeMatrix(responses, 1, 1, [responseHeaders]);
styleHeader(responses, 1, 1, responseHeaders.length);
setColumnWidths(responses, responseHeaders.map((header) => {
  if (header === 'concept') return 180;
  if (header === 'rawAnswer' || header === 'correctAnswer') return 120;
  return header.length > 15 ? 140 : 105;
}));
responses.freezePanes.freezeRows(1);

const itemBankHeaders = [
  'itemId', 'tier', 'tierLabel', 'concept', 'prompt', 'correctAnswer',
  'seedAccuracy', 'seedMedianSeconds', 'source', 'normStatus',
];
const itemRows = sortedItems.map((item) => [
  item.id,
  item.tier,
  item.tierLabel,
  item.concept,
  item.prompt,
  item.answerText || item.answer,
  item.seedAccuracy,
  item.seedMedianSeconds,
  'Original non-proprietary WAIS-inspired practice item',
  'Collect local item-level data',
]);
writeMatrix(itemBank, 1, 1, [itemBankHeaders, ...itemRows]);
styleHeader(itemBank, 1, 1, itemBankHeaders.length);
itemBank.getRange(`G2:G${itemRows.length + 1}`).format.numberFormat = '0%';
setColumnWidths(itemBank, [105, 105, 115, 180, 520, 115, 115, 130, 230, 180]);
itemBank.freezePanes.freezeRows(1);

const itemNormHeaders = [
  'itemId', 'tier', 'tierLabel', 'concept', 'seedAccuracy', 'seedMedianSec',
  'attempts', 'correct', 'empiricalAccuracy', 'avgResponseSec', 'timeouts', 'repeats',
];
writeMatrix(itemNorms, 1, 1, [itemNormHeaders]);
writeMatrix(itemNorms, 1, 2, sortedItems.map((item) => [
  item.id,
  item.tier,
  item.tierLabel,
  item.concept,
  item.seedAccuracy,
  item.seedMedianSeconds,
  '',
  '',
  '',
  '',
  '',
  '',
]));
writeFormulas(itemNorms, 7, 2, sortedItems.map((item, idx) => {
  const row = idx + 2;
  return [
    `=COUNTIF('Item Responses'!G$2:G$5000,A${row})`,
    `=SUMIF('Item Responses'!G$2:G$5000,A${row},'Item Responses'!K$2:K$5000)`,
    `=IFERROR(H${row}/G${row},"")`,
    `=IFERROR(AVERAGEIF('Item Responses'!G$2:G$5000,A${row},'Item Responses'!P$2:P$5000),"")`,
    `=COUNTIFS('Item Responses'!G$2:G$5000,A${row},'Item Responses'!Q$2:Q$5000,1)`,
    `=SUMIF('Item Responses'!G$2:G$5000,A${row},'Item Responses'!S$2:S$5000)`,
  ];
}));
styleHeader(itemNorms, 1, 1, itemNormHeaders.length);
itemNorms.getRange(`E2:E${sortedItems.length + 1}`).format.numberFormat = '0%';
itemNorms.getRange(`I2:I${sortedItems.length + 1}`).format.numberFormat = '0%';
itemNorms.getRange(`J2:J${sortedItems.length + 1}`).format.numberFormat = '0.0';
setColumnWidths(itemNorms, [105, 105, 115, 180, 115, 125, 90, 90, 130, 130, 90, 90]);
itemNorms.freezePanes.freezeRows(1);

writeMatrix(readme, 1, 1, [
  ['Arithmetic WAIS-style Norming Template'],
  ['Purpose', 'Track anonymous arithmetic test sessions and item-level responses for local baseline/norm development.'],
  ['How to use', 'Deploy apps_script.js to Google Apps Script, collect submissions, then paste/export the Arithmetic Sessions and Arithmetic Item Responses sheets into this workbook.'],
  ['Important caveat', 'Official WAIS item content and age-based norm tables are proprietary. This workbook uses original practice items and seed difficulty estimates only.'],
  ['Public reference notes', 'WAIS-IV Arithmetic is publicly described as a Working Memory subtest with 22 dichotomous items and a 0-22 raw score range; Pearson telepractice guidance confirms timed item administration.'],
  ['Recommended analysis', 'Use empirical accuracy, response time, repeats, timeouts, age band, CAIT WMI, and CORE WMI once enough local observations have been collected.'],
]);
readme.getRange('A1:B1').format = {
  fill: '#0F172A',
  font: { bold: true, color: '#FFFFFF', size: 16 },
};
readme.getRange('A2:A6').format = {
  fill: '#E0F2FE',
  font: { bold: true, color: '#0F172A' },
};
setColumnWidths(readme, [180, 720]);

for (const sheetName of ['Dashboard', 'Sessions', 'Item Responses', 'Item Bank', 'Item Norms', 'README']) {
  styleUsedRange(workbook.worksheets.getItem(sheetName));
}

await fs.mkdir(outputDir, { recursive: true });

const dashboardInspect = await workbook.inspect({
  kind: 'table',
  range: 'Dashboard!A1:J11',
  include: 'values,formulas',
  tableMaxRows: 11,
  tableMaxCols: 10,
});
console.log(dashboardInspect.ndjson);

const errors = await workbook.inspect({
  kind: 'match',
  searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A',
  options: { useRegex: true, maxResults: 200 },
  summary: 'formula error scan',
});
console.log(errors.ndjson);

for (const sheetName of ['Dashboard', 'Sessions', 'Item Responses', 'Item Bank', 'Item Norms', 'README']) {
  const rendered = await workbook.render({ sheetName, scale: 1 });
  console.log(`${sheetName} render bytes: ${rendered.size}`);
}

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);
console.log(`Saved ${outputPath}`);
