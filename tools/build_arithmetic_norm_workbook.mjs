import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { SpreadsheetFile, Workbook } from '@oai/artifact-tool';

const repoRoot = process.cwd();
const outputDir = path.join(repoRoot, 'norms');
const outputPath = path.join(outputDir, 'arithmetic-wais-style-norm-template.xlsx');
const qaDir = path.join(repoRoot, '.codex-arithmetic-workbook-qa');

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
  sheet.getRange(rangeAddress(startCol, startRow, width, 1)).format = {
    fill: '#1F4E79',
    font: { bold: true, color: '#FFFFFF' },
    horizontalAlignment: 'center',
    verticalAlignment: 'center',
    wrapText: true,
  };
}

function styleTitle(sheet, range) {
  sheet.getRange(range).format = {
    fill: '#172033',
    font: { bold: true, color: '#FFFFFF', size: 16 },
    verticalAlignment: 'center',
  };
}

function styleUsedRange(sheet) {
  const used = sheet.getUsedRange();
  used.format = {
    verticalAlignment: 'top',
    wrapText: true,
  };
  used.format.borders = { preset: 'outside', style: 'thin', color: '#D1D5DB' };
}

function setColumnWidths(sheet, widths) {
  widths.forEach((width, index) => {
    sheet.getRange(`${colName(index + 1)}:${colName(index + 1)}`).format.columnWidthPx = width;
  });
}

const bankSource = await fs.readFile(path.join(repoRoot, 'arithmetic_bank.js'), 'utf8');
const context = {};
vm.createContext(context);
vm.runInContext(bankSource, context, { filename: 'arithmetic_bank.js' });
const bankApi = context.ArithmeticBank;
if (!bankApi) throw new Error('Could not load ArithmeticBank from arithmetic_bank.js');

const tiers = bankApi.TIER_CONFIG.map((tier) => ({ ...tier }));
const bankSummary = bankApi.getBankSummary();
const itemBank = bankApi.createItemBank().sort((a, b) => {
  const tierDiff = tiers.findIndex((tier) => tier.id === a.tier) - tiers.findIndex((tier) => tier.id === b.tier);
  return tierDiff || a.difficultyOrder - b.difficultyOrder || a.id.localeCompare(b.id);
});
const itemModels = bankApi.ITEM_MODELS.map((itemModel) => ({
  familyId: `AR2-${itemModel.id}`,
  tier: itemModel.tier,
  tierLabel: tiers.find((tier) => tier.id === itemModel.tier).label,
  concept: itemModel.concept,
  difficultyOrder: itemModel.difficultyOrder,
  operationCount: itemModel.operationCount,
  workingMemoryLoad: itemModel.workingMemoryLoad,
  variantCount: bankApi.VARIANTS_PER_MODEL,
})).sort((a, b) => {
  const tierDiff = tiers.findIndex((tier) => tier.id === a.tier) - tiers.findIndex((tier) => tier.id === b.tier);
  return tierDiff || a.difficultyOrder - b.difficultyOrder;
});

const sessionHeaders = [
  'testType', 'schemaVersion', 'sessionId', 'timestamp', 'age', 'caitWmi', 'coreWmi',
  'completed', 'totalItemsExpected', 'totalScore', 'maxScore', 'accuracy', 'itemsCompleted',
  'meanResponseTimeMs', 'timedOutCount', 'skippedCount', 'repeatCount', 'scaledEstimate',
  'speechRate', 'very_easy_correct', 'very_easy_max', 'very_easy_pct', 'easy_correct',
  'easy_max', 'easy_pct', 'medium_correct', 'medium_max', 'medium_pct',
  'semi_hard_correct', 'semi_hard_max', 'semi_hard_pct', 'participantId', 'bankVersion',
  'bankItemCount', 'bankModelCount', 'variantsPerModel', 'selectionMethod',
  'priorSessionsTracked', 'scoreStatus',
];

const responseHeaders = [
  'sessionId', 'timestamp', 'age', 'caitWmi', 'coreWmi', 'itemPosition', 'itemId',
  'tier', 'tierLabel', 'concept', 'score', 'correct', 'rawAnswer', 'correctAnswer',
  'responseTimeMs', 'responseTimeSec', 'timedOut', 'skipped', 'repeatCount',
  'seedAccuracy', 'seedMedianSeconds', 'participantId', 'bankVersion', 'familyId',
  'variantIndex', 'difficultyOrder', 'operationCount', 'workingMemoryLoad',
  'calibrationStatus', 'prompt',
];

const sources = [
  ['WAIS-IV Arithmetic structure', '22 dichotomous Arithmetic items in Working Memory; easy starts and generally increasing difficulty.', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8297006/'],
  ['Oral timing and construct', 'Orally presented word problems, increasing difficulty, 30-second limit, working memory and quantitative reasoning demands.', 'https://www.taylorfrancis.com/chapters/edit/10.1201/9781003309604-19/wais-iv-arithmetic-christina-nunez'],
  ['WAIS-5 Arithmetic raw range', 'Pearson score entry allows Arithmetic total raw scores from 0 to 25 and states that standard scores are age-normed.', 'https://qglobal.pearsonclinical.com/qg/static/Product/fr_ca/WAIS-5/WAIS-5_Enter_Scores.htm'],
  ['WAIS-5 subtest placement', 'Pearson overview lists Arithmetic as a secondary Fluid Reasoning subtest.', 'https://www.pearsonclinical.asia/content/dam/school/global/clinical/asia/assets/wais-5/wais-5-overview-brochure.pdf'],
  ['Score-report fields', 'Pearson sample report includes raw, scaled, percentile, reference-group score, and SEM; examples are not a norm table.', 'https://www.pearsonassessments.com/content/dam/school/global/clinical/us/assets/wais-5/wais-5-sample-score-report-with-demographically-referenced-scores.pdf'],
  ['WAIS-5 standardization sample', 'N=2,020, ages 16-90, stratified against 2022 US population characteristics.', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11595985/'],
  ['WAIS-5 product details', 'Pearson confirms publication date, age range, updated norms, and clinical administration.', 'https://www.pearsonassessments.com/en-us/Store/ProfessionalAssessments/Cognition-%26-Neuro/Wechsler-Adult-Intelligence-Scale-%7C-FifthEdition/p/P100071002'],
  ['2PL calibration planning', 'Practical review cites at least 500 people and 20+ items under favorable conditions, with accuracy improving at larger N.', 'https://onlinelibrary.wiley.com/doi/full/10.1002/ets2.12376'],
  ['Automatic item generation', 'Item models require psychometric evaluation; generated variants should not be assumed equivalent.', 'https://doi.org/10.1080/15305058.2011.635830'],
];

const ageBands = [
  ['16-17', 16, 17], ['18-19', 18, 19], ['20-24', 20, 24], ['25-29', 25, 29],
  ['30-34', 30, 34], ['35-44', 35, 44], ['45-54', 45, 54], ['55-64', 55, 64],
  ['65-69', 65, 69], ['70-74', 70, 74], ['75-79', 75, 79], ['80-84', 80, 84],
  ['85-90', 85, 90],
];

const workbook = Workbook.create();
const dashboard = workbook.worksheets.add('Dashboard');
const sessions = workbook.worksheets.add('Sessions');
const responses = workbook.worksheets.add('Item Responses');
const modelsSheet = workbook.worksheets.add('Item Models');
const modelNorms = workbook.worksheets.add('Model Norms');
const itemsSheet = workbook.worksheets.add('Item Bank');
const itemNorms = workbook.worksheets.add('Item Norms');
const ageNorms = workbook.worksheets.add('Age Norm Readiness');
const sourcesSheet = workbook.worksheets.add('Sources');
const readme = workbook.worksheets.add('README');

writeMatrix(dashboard, 1, 1, [
  ['Arithmetic calibration dashboard', '', '', '', '', '', '', '', '', ''],
  [`Bank ${bankSummary.bankVersion}: ${bankSummary.itemCount} stable items from ${bankSummary.modelCount} models. Scores remain uncalibrated until representative data are collected.`, '', '', '', '', '', '', '', '', ''],
  [],
  ['Submitted sessions', '=COUNTA(Sessions!C2:C10000)', 'Mean raw score', '=IFERROR(AVERAGE(Sessions!J2:J10000),"")', 'Mean accuracy', '=IFERROR(AVERAGE(Sessions!L2:L10000)/100,"")', 'Mean CAIT WMI', '=IFERROR(AVERAGE(Sessions!F2:F10000),"")', 'Mean CORE WMI', '=IFERROR(AVERAGE(Sessions!G2:G10000),"")'],
  ['Total item responses', "=COUNTA('Item Responses'!G2:G5000)", 'Mean response sec', "=IFERROR(AVERAGE('Item Responses'!P2:P5000),\"\")", 'Total repeats', '=SUM(Sessions!Q2:Q10000)', 'Total timeouts', '=SUM(Sessions!O2:O10000)', 'Uncalibrated sessions', '=COUNTIF(Sessions!AM2:AM10000,"uncalibrated")'],
  [],
  ['Tier ID', 'Tier', 'Models', 'Bank items', 'Attempts', 'Correct', 'Empirical accuracy', 'Avg RT sec', 'Timeouts', 'Repeats'],
]);
writeMatrix(dashboard, 1, 8, tiers.map((tier) => [
  tier.id,
  tier.label,
  itemModels.filter((itemModel) => itemModel.tier === tier.id).length,
  itemBank.filter((item) => item.tier === tier.id).length,
  '', '', '', '', '', '',
]));
writeFormulas(dashboard, 5, 8, tiers.map((tier, index) => {
  const row = index + 8;
  return [
    `=COUNTIF('Item Responses'!H$2:H$5000,A${row})`,
    `=SUMIF('Item Responses'!H$2:H$5000,A${row},'Item Responses'!K$2:K$5000)`,
    `=IFERROR(F${row}/E${row},"")`,
    `=IFERROR(AVERAGEIF('Item Responses'!H$2:H$5000,A${row},'Item Responses'!P$2:P$5000),"")`,
    `=COUNTIFS('Item Responses'!H$2:H$5000,A${row},'Item Responses'!Q$2:Q$5000,1)`,
    `=SUMIF('Item Responses'!H$2:H$5000,A${row},'Item Responses'!S$2:S$5000)`,
  ];
}));
dashboard.getRange('A1:J1').merge();
dashboard.getRange('A2:J2').merge();
styleTitle(dashboard, 'A1:J1');
dashboard.getRange('A2:J2').format = { fill: '#E8F1F8', font: { color: '#172033' }, wrapText: true };
dashboard.getRange('A4:J5').format = { fill: '#F8FAFC', font: { bold: true } };
styleHeader(dashboard, 1, 7, 10);
dashboard.getRange('F4:F4').format.numberFormat = '0%';
dashboard.getRange('G8:G11').format.numberFormat = '0%';
dashboard.getRange('H8:H11').format.numberFormat = '0.0';
dashboard.getRange('1:1').format.rowHeightPx = 34;
dashboard.getRange('2:2').format.rowHeightPx = 42;
setColumnWidths(dashboard, [145, 120, 92, 105, 105, 90, 130, 105, 95, 95]);
dashboard.freezePanes.freezeRows(7);

writeMatrix(sessions, 1, 1, [sessionHeaders]);
styleHeader(sessions, 1, 1, sessionHeaders.length);
setColumnWidths(sessions, sessionHeaders.map((header) => {
  if (header === 'selectionMethod') return 260;
  if (header === 'participantId' || header === 'sessionId') return 175;
  return header.length > 18 ? 145 : 108;
}));
sessions.freezePanes.freezeRows(1);

writeMatrix(responses, 1, 1, [responseHeaders]);
styleHeader(responses, 1, 1, responseHeaders.length);
setColumnWidths(responses, responseHeaders.map((header) => {
  if (header === 'prompt') return 520;
  if (header === 'concept') return 190;
  if (header === 'participantId' || header === 'sessionId') return 175;
  return header.length > 17 ? 145 : 105;
}));
responses.freezePanes.freezeRows(1);

const modelHeaders = [
  'familyId', 'tier', 'tierLabel', 'concept', 'difficultyOrder', 'operationCount',
  'workingMemoryLoad', 'variantCount', 'source', 'normStatus',
];
writeMatrix(modelsSheet, 1, 1, [modelHeaders, ...itemModels.map((itemModel) => [
  itemModel.familyId, itemModel.tier, itemModel.tierLabel, itemModel.concept,
  itemModel.difficultyOrder, itemModel.operationCount, itemModel.workingMemoryLoad,
  itemModel.variantCount, 'Original non-proprietary item model', 'Collect model-level calibration data',
])]);
styleHeader(modelsSheet, 1, 1, modelHeaders.length);
setColumnWidths(modelsSheet, [115, 105, 115, 210, 115, 115, 145, 105, 230, 220]);
modelsSheet.freezePanes.freezeRows(1);

const modelNormHeaders = [
  'familyId', 'tier', 'tierLabel', 'concept', 'difficultyOrder', 'operationCount',
  'workingMemoryLoad', 'variants', 'attempts', 'correct', 'empiricalAccuracy',
  'avgResponseSec', 'timeouts', 'repeats', 'pilotReadiness',
];
writeMatrix(modelNorms, 1, 1, [modelNormHeaders]);
writeMatrix(modelNorms, 1, 2, itemModels.map((itemModel) => [
  itemModel.familyId, itemModel.tier, itemModel.tierLabel, itemModel.concept,
  itemModel.difficultyOrder, itemModel.operationCount, itemModel.workingMemoryLoad,
  itemModel.variantCount, '', '', '', '', '', '', '',
]));
writeFormulas(modelNorms, 9, 2, itemModels.map((itemModel, index) => {
  const row = index + 2;
  return [
    `=COUNTIF('Item Responses'!X$2:X$5000,A${row})`,
    `=SUMIF('Item Responses'!X$2:X$5000,A${row},'Item Responses'!K$2:K$5000)`,
    `=IFERROR(J${row}/I${row},"")`,
    `=IFERROR(AVERAGEIF('Item Responses'!X$2:X$5000,A${row},'Item Responses'!P$2:P$5000),"")`,
    `=COUNTIFS('Item Responses'!X$2:X$5000,A${row},'Item Responses'!Q$2:Q$5000,1)`,
    `=SUMIF('Item Responses'!X$2:X$5000,A${row},'Item Responses'!S$2:S$5000)`,
    `=IF(I${row}>=100,"Calibration candidate",IF(I${row}>=50,"Pilot review","Collect more"))`,
  ];
}));
styleHeader(modelNorms, 1, 1, modelNormHeaders.length);
modelNorms.getRange(`K2:K${itemModels.length + 1}`).format.numberFormat = '0%';
modelNorms.getRange(`L2:L${itemModels.length + 1}`).format.numberFormat = '0.0';
setColumnWidths(modelNorms, [115, 105, 115, 205, 115, 115, 145, 90, 90, 90, 130, 130, 90, 90, 145]);
modelNorms.freezePanes.freezeRows(1);

const itemHeaders = [
  'itemId', 'bankVersion', 'familyId', 'variantIndex', 'tier', 'tierLabel', 'concept',
  'difficultyOrder', 'operationCount', 'workingMemoryLoad', 'prompt', 'correctAnswer',
  'source', 'calibrationStatus',
];
writeMatrix(itemsSheet, 1, 1, [itemHeaders, ...itemBank.map((item) => [
  item.id, item.bankVersion, item.familyId, item.variantIndex, item.tier, item.tierLabel,
  item.concept, item.difficultyOrder, item.operationCount, item.workingMemoryLoad,
  item.prompt, item.answerText || item.answer, item.source, item.calibrationStatus,
])]);
styleHeader(itemsSheet, 1, 1, itemHeaders.length);
setColumnWidths(itemsSheet, [145, 105, 115, 100, 105, 115, 190, 115, 115, 145, 540, 115, 240, 135]);
itemsSheet.freezePanes.freezeRows(1);

const itemNormHeaders = [
  'itemId', 'familyId', 'tier', 'concept', 'variantIndex', 'attempts', 'correct',
  'empiricalAccuracy', 'avgResponseSec', 'timeouts', 'repeats', 'itemReadiness',
];
writeMatrix(itemNorms, 1, 1, [
  ['Exact-item analysis staging table', '', '', '', '', '', '', '', '', '', '', ''],
  ['Stable item IDs are listed below. Populate the statistic columns from an external pivot/IRT analysis after model-level pilot review; live formulas across 960 sparse variants are intentionally omitted.', '', '', '', '', '', '', '', '', '', '', ''],
  [],
  itemNormHeaders,
]);
writeMatrix(itemNorms, 1, 5, itemBank.map((item) => [
  item.id, item.familyId, item.tier, item.concept, item.variantIndex, '', '', '', '', '', '', '',
]));
itemNorms.getRange('A1:L1').merge();
itemNorms.getRange('A2:L2').merge();
styleTitle(itemNorms, 'A1:L1');
itemNorms.getRange('A2:L2').format = { fill: '#FFF4D6', font: { color: '#5C4513' }, wrapText: true };
styleHeader(itemNorms, 1, 4, itemNormHeaders.length);
itemNorms.getRange(`H5:H${itemBank.length + 4}`).format.numberFormat = '0%';
itemNorms.getRange(`I5:I${itemBank.length + 4}`).format.numberFormat = '0.0';
itemNorms.getRange('1:1').format.rowHeightPx = 34;
itemNorms.getRange('2:2').format.rowHeightPx = 44;
setColumnWidths(itemNorms, [145, 115, 105, 205, 100, 90, 90, 130, 130, 90, 90, 125]);
itemNorms.freezePanes.freezeRows(4);

const ageHeaders = [
  'ageBand', 'minAge', 'maxAge', 'minimumTargetN', 'preferredTargetN', 'currentN',
  'meanRaw', 'rawSD', 'meanAccuracy', 'meanResponseSec', 'meanCAITWMI', 'meanCOREWMI',
  'sampleReadiness', 'representativenessReview',
];
writeMatrix(ageNorms, 1, 1, [
  ['Age-band norm readiness', '', '', '', '', '', '', '', '', '', '', '', '', ''],
  ['Counts are readiness checks only. Norms require planned representative recruitment, weighting, reliability, equating, and psychometric review.', '', '', '', '', '', '', '', '', '', '', '', '', ''],
  [],
  ageHeaders,
  ...ageBands.map(([label, minAge, maxAge]) => [label, minAge, maxAge, 100, 180, '', '', '', '', '', '', '', '', '']),
]);
writeFormulas(ageNorms, 6, 5, ageBands.map((band, index) => {
  const row = index + 5;
  return [
    `=COUNTIFS(Sessions!E$2:E$10000,">="&B${row},Sessions!E$2:E$10000,"<="&C${row})`,
    `=IFERROR(AVERAGEIFS(Sessions!J$2:J$10000,Sessions!E$2:E$10000,">="&B${row},Sessions!E$2:E$10000,"<="&C${row}),"")`,
    `=IF(F${row}<2,"",SQRT((SUMPRODUCT((Sessions!E$2:E$10000>=B${row})*(Sessions!E$2:E$10000<=C${row})*(Sessions!J$2:J$10000^2))-(SUMIFS(Sessions!J$2:J$10000,Sessions!E$2:E$10000,">="&B${row},Sessions!E$2:E$10000,"<="&C${row})^2/F${row}))/(F${row}-1)))`,
    `=IFERROR(AVERAGEIFS(Sessions!L$2:L$10000,Sessions!E$2:E$10000,">="&B${row},Sessions!E$2:E$10000,"<="&C${row})/100,"")`,
    `=IFERROR(AVERAGEIFS(Sessions!N$2:N$10000,Sessions!E$2:E$10000,">="&B${row},Sessions!E$2:E$10000,"<="&C${row})/1000,"")`,
    `=IFERROR(AVERAGEIFS(Sessions!F$2:F$10000,Sessions!E$2:E$10000,">="&B${row},Sessions!E$2:E$10000,"<="&C${row}),"")`,
    `=IFERROR(AVERAGEIFS(Sessions!G$2:G$10000,Sessions!E$2:E$10000,">="&B${row},Sessions!E$2:E$10000,"<="&C${row}),"")`,
    `=IF(F${row}>=E${row},"Preferred target met",IF(F${row}>=D${row},"Provisional target met","Collect more"))`,
    '',
  ];
}));
ageNorms.getRange('A1:N1').merge();
ageNorms.getRange('A2:N2').merge();
styleTitle(ageNorms, 'A1:N1');
ageNorms.getRange('A2:N2').format = { fill: '#FFF4D6', font: { color: '#5C4513' }, wrapText: true };
styleHeader(ageNorms, 1, 4, ageHeaders.length);
ageNorms.getRange(`I5:I${ageBands.length + 4}`).format.numberFormat = '0%';
ageNorms.getRange(`G5:L${ageBands.length + 4}`).format.numberFormat = '0.0';
ageNorms.getRange('1:1').format.rowHeightPx = 34;
ageNorms.getRange('2:2').format.rowHeightPx = 44;
setColumnWidths(ageNorms, [105, 80, 80, 120, 130, 90, 95, 95, 120, 135, 120, 125, 165, 220]);
ageNorms.freezePanes.freezeRows(4);

writeMatrix(sourcesSheet, 1, 1, [
  ['Public evidence used for design and norm planning', '', ''],
  ['Topic', 'Evidence used', 'Source URL'],
  ...sources,
]);
sourcesSheet.getRange('A1:C1').merge();
styleTitle(sourcesSheet, 'A1:C1');
styleHeader(sourcesSheet, 1, 2, 3);
setColumnWidths(sourcesSheet, [210, 580, 520]);
sourcesSheet.freezePanes.freezeRows(2);

writeMatrix(readme, 1, 1, [
  ['Arithmetic Calibration Workbook', ''],
  ['Purpose', 'Collect and audit anonymous session and item-response data for this original 22-item mental-arithmetic assessment.'],
  ['Bank', `${bankSummary.itemCount} deterministic items from ${bankSummary.modelCount} item models; ${bankSummary.variantsPerModel} variants per model; bank version ${bankSummary.bankVersion}.`],
  ['Import', 'Deploy apps_script.js, then paste/export Arithmetic Sessions into Sessions and Arithmetic Item Responses into Item Responses. Keep the header names unchanged.'],
  ['Current score status', 'Uncalibrated. Report raw score, accuracy, timing, repeats, and tier performance only. Do not report IQ, WAIS-equivalent scaled scores, percentiles, or clinical classifications.'],
  ['Why WAIS norms are not used', 'Official item wording and age conversion tables are proprietary, and this bank has different content and item parameters. A WAIS conversion would not be valid for these forms.'],
  ['First analysis unit', 'Use Item Models and Model Norms first. Generated variants share structure, so treating all variants as independent can understate uncertainty.'],
  ['Pilot thresholds', '50 responses per model for basic review; 100 per model for a calibration candidate. These are workflow gates, not claims of norm quality.'],
  ['IRT milestone', 'At least 500 distinct participants for initial 1PL/2PL model work; 1,000 or more is preferred. Use linked/hierarchical models for sparse variants.'],
  ['Age norms', 'Use Age Norm Readiness to monitor 13 adult bands. Target at least 100 per band and preferably 180, with representative recruitment and weighting.'],
  ['Retest fields', 'participantId, priorSessionsTracked, familyId, itemId, repeats, timing, CAIT WMI, and CORE WMI support practice-effect and validity analyses.'],
  ['Research notes', 'See ARITHMETIC_RESEARCH.md and the Sources sheet for the evidence review and reporting rules.'],
]);
readme.getRange('A1:B1').merge();
styleTitle(readme, 'A1:B1');
readme.getRange('A2:A12').format = { fill: '#E8F1F8', font: { bold: true, color: '#172033' } };
setColumnWidths(readme, [190, 800]);

const sheetNames = [
  'Dashboard', 'Sessions', 'Item Responses', 'Item Models', 'Model Norms', 'Item Bank',
  'Item Norms', 'Age Norm Readiness', 'Sources', 'README',
];
for (const sheetName of sheetNames) {
  styleUsedRange(workbook.worksheets.getItem(sheetName));
}

await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(qaDir, { recursive: true });

for (const request of [
  { range: 'Dashboard!A1:J11', label: 'dashboard' },
  { range: 'Item Models!A1:J12', label: 'models' },
  { range: 'Age Norm Readiness!A1:N17', label: 'age-readiness' },
  { range: 'Sources!A1:C11', label: 'sources' },
]) {
  const inspection = await workbook.inspect({
    kind: 'table',
    range: request.range,
    include: 'values,formulas',
    tableMaxRows: 20,
    tableMaxCols: 14,
  });
  console.log(`${request.label}: ${inspection.ndjson}`);
}

const errors = await workbook.inspect({
  kind: 'match',
  searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A',
  options: { useRegex: true, maxResults: 300 },
  summary: 'formula error scan',
});
console.log(errors.ndjson);

const renderRanges = {
  Dashboard: 'A1:J11',
  Sessions: 'A1:N8',
  'Item Responses': 'A1:N8',
  'Item Models': 'A1:J18',
  'Model Norms': 'A1:O18',
  'Item Bank': 'A1:N18',
  'Item Norms': 'A1:L20',
  'Age Norm Readiness': 'A1:N17',
  Sources: 'A1:C11',
  README: 'A1:B12',
};
for (const sheetName of sheetNames) {
  const rendered = await workbook.render({ sheetName, range: renderRanges[sheetName], scale: 1 });
  const filename = `${sheetName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
  await fs.writeFile(path.join(qaDir, filename), Buffer.from(await rendered.arrayBuffer()));
  console.log(`${sheetName} preview bytes: ${rendered.size}`);
}

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);
console.log(`Saved ${outputPath}`);
