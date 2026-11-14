/**
 * The Chill Freelancers Club — join form → Google Sheet
 *
 * Paste this into the Apps Script editor of the EXISTING sheet that Framer
 * writes to (Extensions → Apps Script), then Deploy → New deployment →
 * Web app, "Execute as: Me", "Who has access: Anyone". Copy the /exec URL
 * into data-endpoint on #join-form in index.html.
 *
 * Each POST appends one row. Values are matched to columns by header name
 * (row 1), so the existing "Name / Email / What field / How long / Purpose"
 * columns keep filling. A header called Timestamp, Date, Submitted, Created
 * or "Submitted at" gets the submission time. Unknown fields get a new column
 * at the end instead of being dropped.
 */

// Name of the tab that holds the responses. Leave '' to use the first tab.
var SHEET_NAME = '';

// Email yourself a copy of each application (true) or only when saving fails (false).
var NOTIFY_EVERY_SUBMISSION = false;

var FIELDS = ['Name', 'Email', 'What field', 'How long', 'Purpose', 'Page'];
var TIME_HEADERS = ['timestamp', 'date', 'submitted', 'submitted at', 'created', 'created at', 'time'];
var MAX_LEN = 5000;

function doPost(e) {
  var params = (e && e.parameter) || {};

  // Honeypot — bots fill every field. Pretend it worked.
  if (params._website) return json_({ result: 'success' });

  var data = {};
  FIELDS.forEach(function (f) {
    data[f] = sanitize_(params[f]);
  });

  if (!data.Name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.Email)) {
    return json_({ result: 'error', error: 'Name and a valid email are required.' });
  }

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    appendRow_(data);
    if (NOTIFY_EVERY_SUBMISSION) notify_('New TCFC application: ' + data.Name, data);
    return json_({ result: 'success' });
  } catch (err) {
    // Same idea as Framer's fallback: if the sheet fails, email the owner.
    try { notify_('TCFC form: could not save to sheet', data, err); } catch (ignored) {}
    return json_({ result: 'error', error: 'Could not save right now.' });
  } finally {
    try { lock.releaseLock(); } catch (ignored) {}
  }
}

// Visiting the /exec URL in a browser shows this — handy to check it's live.
function doGet() {
  return json_({ result: 'ok', message: 'TCFC join form endpoint is running.' });
}

function appendRow_(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = SHEET_NAME ? ss.getSheetByName(SHEET_NAME) : ss.getSheets()[0];
  if (!sheet) throw new Error('Sheet "' + SHEET_NAME + '" not found');

  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(String);
  if (headers.length === 1 && headers[0] === '') headers = [];

  // Add missing columns (first run on an empty sheet, or a new field)
  var missing = FIELDS.filter(function (f) { return headers.indexOf(f) === -1; });
  if (headers.length === 0) missing.unshift('Timestamp');
  if (missing.length) {
    sheet.getRange(1, headers.length + 1, 1, missing.length).setValues([missing]);
    headers = headers.concat(missing);
  }

  var now = new Date();
  var row = headers.map(function (h) {
    if (Object.prototype.hasOwnProperty.call(data, h)) return data[h];
    if (TIME_HEADERS.indexOf(h.trim().toLowerCase()) !== -1) return now;
    return '';
  });
  sheet.appendRow(row);
}

function sanitize_(v) {
  v = (v == null ? '' : String(v)).trim().slice(0, MAX_LEN);
  // Stop spreadsheet formula injection (=, +, -, @ at the start of a cell)
  if (/^[=+\-@]/.test(v)) v = "'" + v;
  return v;
}

function notify_(subject, data, err) {
  var to = Session.getEffectiveUser().getEmail();
  var body = FIELDS.map(function (f) { return f + ': ' + (data[f] || ''); }).join('\n');
  if (err) body += '\n\nError: ' + err;
  MailApp.sendEmail(to, subject, body);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
