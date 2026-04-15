// ============================================================
// Google Apps Script — Running Digit Span Norm Collector
// ============================================================
// This script receives anonymous test results via POST and
// writes them to the active Google Sheet.
//
// SETUP:
// 1. Create a new Google Sheet (this is where data will land)
// 2. Go to Extensions → Apps Script
// 3. Paste this entire file into Code.gs (replace any default code)
// 4. Click "Deploy" → "New deployment"
// 5. Type: "Web app"
// 6. Execute as: "Me"
// 7. Who has access: "Anyone"
// 8. Click "Deploy"
// 9. Copy the web app URL
// 10. Paste the URL into app.js → SHEETS_ENDPOINT variable
//
// The sheet will auto-create headers on the first submission.
// ============================================================

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);

    // Only accept completed tests
    if (!data.completed) {
      return ContentService.createTextOutput(
        JSON.stringify({ status: 'skipped', reason: 'incomplete test' })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // Check for duplicate sessionId
    if (data.sessionId && sheet.getLastRow() > 1) {
      var sessionCol = 1; // sessionId is the first column
      var existingIds = sheet.getRange(2, sessionCol, sheet.getLastRow() - 1, 1).getValues();
      for (var i = 0; i < existingIds.length; i++) {
        if (existingIds[i][0] === data.sessionId) {
          return ContentService.createTextOutput(
            JSON.stringify({ status: 'duplicate', reason: 'session already submitted' })
          ).setMimeType(ContentService.MimeType.JSON);
        }
      }
    }

    // Define the column order
    var headers = [
      'sessionId', 'timestamp', 'age', 'completed', 'totalTrialsExpected',
      'totalScore', 'maxScore', 'accuracy',
      'trialsCompleted', 'discontinued', 'runningSpan', 'speechRate',
      'last_3_correct', 'last_3_max', 'last_3_pct',
      'last_4_correct', 'last_4_max', 'last_4_pct',
      'last_5_correct', 'last_5_max', 'last_5_pct',
      'last_6_correct', 'last_6_max', 'last_6_pct',
      'last_7_correct', 'last_7_max', 'last_7_pct'
    ];

    // Create headers if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
      // Bold and freeze the header row
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    // Build the row in the correct order
    var row = headers.map(function(key) {
      return data[key] !== undefined ? data[key] : '';
    });

    sheet.appendRow(row);

    return ContentService.createTextOutput(
      JSON.stringify({ status: 'ok', sessionId: data.sessionId })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ status: 'error', message: err.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// Allow GET requests too (for testing the endpoint is live)
function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({ status: 'ok', message: 'Running Digit Span norm collector is active.' })
  ).setMimeType(ContentService.MimeType.JSON);
}
