// =============================================
//  BMZ 営業部1課 ダッシュボード - GAS バックエンド
//  スプレッドシートに貼り付けて Web アプリとしてデプロイする
// =============================================

const TASKS_SHEET    = "Tasks";
const PROJECTS_SHEET = "Projects";
const TASK_HEADERS    = ["id", "name", "project", "category", "minutes", "status", "date"];
const PROJECT_HEADERS = ["id", "name", "step", "mtgNotes", "nextActions"];

// ── GET: データを JSON で返す ─────────────────
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const data = {
      tasks:    readTasks(ss),
      projects: readProjects(ss),
    };
    return buildResponse(data);
  } catch (err) {
    return buildResponse({ error: err.toString() });
  }
}

// ── POST: データを受け取りシートに書き込む ───────
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (payload.tasks    !== undefined) writeTasks(ss, payload.tasks);
    if (payload.projects !== undefined) writeProjects(ss, payload.projects);
    return buildResponse({ success: true });
  } catch (err) {
    return buildResponse({ success: false, error: err.toString() });
  }
}

// ── Tasks シート ─────────────────────────────
function readTasks(ss) {
  const sheet = ss.getSheetByName(TASKS_SHEET);
  if (!sheet || sheet.getLastRow() < 2) return [];
  return sheet
    .getRange(2, 1, sheet.getLastRow() - 1, TASK_HEADERS.length)
    .getValues()
    .filter(r => r[0] !== "")
    .map(r => ({
      id:       r[0],
      name:     r[1],
      project:  r[2],
      category: r[3],
      minutes:  Number(r[4]),
      status:   r[5],
      date:     r[6],
    }));
}

function writeTasks(ss, tasks) {
  const sheet = ensureSheet(ss, TASKS_SHEET, TASK_HEADERS);
  clearData(sheet, TASK_HEADERS.length);
  if (!tasks.length) return;
  sheet.getRange(2, 1, tasks.length, TASK_HEADERS.length).setValues(
    tasks.map(t => [t.id, t.name, t.project, t.category, t.minutes, t.status, t.date])
  );
}

// ── Projects シート ──────────────────────────
function readProjects(ss) {
  const sheet = ss.getSheetByName(PROJECTS_SHEET);
  if (!sheet || sheet.getLastRow() < 2) return [];
  return sheet
    .getRange(2, 1, sheet.getLastRow() - 1, PROJECT_HEADERS.length)
    .getValues()
    .filter(r => r[0] !== "")
    .map(r => ({
      id:          r[0],
      name:        r[1],
      step:        Number(r[2]),
      mtgNotes:    safeParseJSON(r[3], []),
      nextActions: safeParseJSON(r[4], []),
    }));
}

function writeProjects(ss, projects) {
  const sheet = ensureSheet(ss, PROJECTS_SHEET, PROJECT_HEADERS);
  clearData(sheet, PROJECT_HEADERS.length);
  if (!projects.length) return;
  sheet.getRange(2, 1, projects.length, PROJECT_HEADERS.length).setValues(
    projects.map(p => [
      p.id, p.name, p.step,
      JSON.stringify(p.mtgNotes),
      JSON.stringify(p.nextActions),
    ])
  );
}

// ── ユーティリティ ────────────────────────────
function ensureSheet(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setValues([headers]);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#1f2937");
    headerRange.setFontColor("#ffffff");
  }
  return sheet;
}

function clearData(sheet, cols) {
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, cols).clearContent();
  }
}

function safeParseJSON(value, fallback) {
  try { return value ? JSON.parse(value) : fallback; }
  catch (_) { return fallback; }
}

function buildResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
