// ============================================================
// Google Apps Script - Cognitive Test Norm Collector
// ============================================================
// Receives anonymous test results via POST and writes them to
// Google Sheets. Supports:
//   - running_digit_span
//   - arithmetic_wais_style
//
// SETUP:
// 1. Create a new Google Sheet.
// 2. Go to Extensions -> Apps Script.
// 3. Paste this entire file into Code.gs.
// 4. Click Deploy -> New deployment.
// 5. Type: Web app.
// 6. Execute as: Me.
// 7. Who has access: Anyone.
// 8. Click Deploy.
// 9. Copy the web app URL into app.js and arithmetic.js.
//
// Sheets and headers are created automatically on first submit.
// ============================================================

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents || '{}');

    if (!data.completed) {
      return jsonOutput({ status: 'skipped', reason: 'incomplete test' });
    }

    var testType = data.testType || 'running_digit_span';
    if (testType === 'arithmetic_wais_style') {
      return handleArithmeticPost(data);
    }

    return handleRunningDigitPost(data);

  } catch (err) {
    return jsonOutput({ status: 'error', message: err.toString() });
  }
}

function handleRunningDigitPost(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Running Digit Span') || ss.getActiveSheet();
  if (sheet.getLastRow() === 0) {
    sheet.setName('Running Digit Span');
  }

  var headers = ensureHeaders(sheet, [
    'testType', 'schemaVersion',
    'sessionId', 'timestamp', 'age', 'completed', 'totalTrialsExpected',
    'totalScore', 'maxScore', 'accuracy',
    'trialsCompleted', 'discontinued', 'runningSpan', 'speechRate',
    'last_3_correct', 'last_3_max', 'last_3_pct',
    'last_4_correct', 'last_4_max', 'last_4_pct',
    'last_5_correct', 'last_5_max', 'last_5_pct',
    'last_6_correct', 'last_6_max', 'last_6_pct',
    'last_7_correct', 'last_7_max', 'last_7_pct'
  ]);

  if (isDuplicateSession(sheet, headers, data.sessionId)) {
    return jsonOutput({ status: 'duplicate', reason: 'session already submitted' });
  }

  appendDataRow(sheet, headers, data);
  return jsonOutput({ status: 'ok', testType: 'running_digit_span', sessionId: data.sessionId });
}

function handleArithmeticPost(data) {
  var sessionsSheet = getOrCreateSheet('Arithmetic Sessions');
  var sessionHeaders = ensureHeaders(sessionsSheet, [
    'testType', 'schemaVersion',
    'sessionId', 'timestamp', 'age', 'completed', 'totalItemsExpected',
    'totalScore', 'maxScore', 'accuracy', 'itemsCompleted',
    'meanResponseTimeMs', 'timedOutCount', 'skippedCount', 'repeatCount',
    'scaledEstimate', 'speechRate',
    'very_easy_correct', 'very_easy_max', 'very_easy_pct',
    'easy_correct', 'easy_max', 'easy_pct',
    'medium_correct', 'medium_max', 'medium_pct',
    'semi_hard_correct', 'semi_hard_max', 'semi_hard_pct'
  ]);

  if (isDuplicateSession(sessionsSheet, sessionHeaders, data.sessionId)) {
    return jsonOutput({ status: 'duplicate', reason: 'session already submitted' });
  }

  appendDataRow(sessionsSheet, sessionHeaders, data);
  appendArithmeticItems(data);

  return jsonOutput({ status: 'ok', testType: 'arithmetic_wais_style', sessionId: data.sessionId });
}

function appendArithmeticItems(data) {
  var items = data.items || [];
  if (!items.length) return;

  var itemSheet = getOrCreateSheet('Arithmetic Item Responses');
  var headers = ensureHeaders(itemSheet, [
    'sessionId', 'timestamp', 'age',
    'itemPosition', 'itemId', 'tier', 'tierLabel', 'concept',
    'score', 'correct', 'rawAnswer', 'correctAnswer',
    'responseTimeMs', 'responseTimeSec', 'timedOut', 'skipped', 'repeatCount',
    'seedAccuracy', 'seedMedianSeconds'
  ]);

  var rows = [];
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    rows.push(headers.map(function(key) {
      if (key === 'sessionId') return data.sessionId || '';
      if (key === 'timestamp') return data.timestamp || '';
      if (key === 'age') return data.age || '';
      if (key === 'responseTimeSec') {
        return item.responseTimeMs !== undefined ? item.responseTimeMs / 1000 : '';
      }
      if (key === 'correct') return item.correct ? 1 : 0;
      if (key === 'timedOut') return item.timedOut ? 1 : 0;
      if (key === 'skipped') return item.skipped ? 1 : 0;
      return item[key] !== undefined ? item[key] : '';
    }));
  }

  itemSheet.getRange(itemSheet.getLastRow() + 1, 1, rows.length, headers.length).setValues(rows);
}

function getOrCreateSheet(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function ensureHeaders(sheet, defaultHeaders) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(defaultHeaders);
    sheet.getRange(1, 1, 1, defaultHeaders.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
    return defaultHeaders;
  }

  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var existing = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var headers = [];
  for (var i = 0; i < existing.length; i++) {
    if (existing[i] !== '') headers.push(existing[i]);
  }
  return headers.length ? headers : defaultHeaders;
}

function appendDataRow(sheet, headers, data) {
  var row = headers.map(function(key) {
    return data[key] !== undefined ? data[key] : '';
  });
  sheet.appendRow(row);
}

function isDuplicateSession(sheet, headers, sessionId) {
  if (!sessionId || sheet.getLastRow() <= 1) return false;

  var sessionCol = headers.indexOf('sessionId') + 1;
  if (sessionCol < 1) return false;

  var existingIds = sheet.getRange(2, sessionCol, sheet.getLastRow() - 1, 1).getValues();
  for (var i = 0; i < existingIds.length; i++) {
    if (existingIds[i][0] === sessionId) return true;
  }
  return false;
}

function jsonOutput(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return jsonOutput({
    status: 'ok',
    message: 'Cognitive test norm collector is active.',
    supportedTests: ['running_digit_span', 'arithmetic_wais_style']
  });
}
