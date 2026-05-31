// =============================================
//  BMZ 営業部1課 ダッシュボード - GAS バックエンド v2
//  既存スプレッドシートのシート構成に完全対応
//  ※ スプレッドシートにバインドしてデプロイする
// =============================================

const SHEET_TASKS    = "タスク一覧";
const SHEET_LOGS     = "進捗ログ";
const SHEET_PROJECTS = "プロジェクトマスタ";

// タスク一覧の列定義（既存スプシの列順に合わせる）
const TASK_COLS = [
  "ID", "起案日", "タスク名", "タスク種別", "プロジェクト名",
  "関係者", "役員関与", "規模", "ステータス", "期日",
  "次のアクション", "完了日", "EC依頼", "進捗ログ登録", "進捗メモ",
  "カテゴリ", "撮影依頼", "撮影メモ"
];

const LOG_COLS = [
  "日付", "プロジェクト名", "フェーズ", "進捗内容", "関係者", "次のマイルストーン"
];

// ─────────────────────────────────────────────
//  GET: 全データを JSON で返す
// ─────────────────────────────────────────────
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    return buildResponse({
      tasks:    readTasks(ss),
      logs:     readLogs(ss),
      projects: readProjects(ss),
    });
  } catch (err) {
    return buildResponse({ error: err.toString() });
  }
}

// ─────────────────────────────────────────────
//  POST: データを受け取り CRUD 処理
// ─────────────────────────────────────────────
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const action = payload.action ?? "saveAll";

    switch (action) {
      case "saveAll":
        if (payload.tasks    !== undefined) writeTasks(ss, payload.tasks);
        if (payload.logs     !== undefined) writeLogs(ss, payload.logs);
        if (payload.projects !== undefined) writeProjects(ss, payload.projects);
        break;
      case "addTask":
        appendTask(ss, payload.task);
        break;
      case "updateTask":
        updateTaskById(ss, payload.task);
        break;
      case "deleteTask":
        deleteTaskById(ss, payload.id);
        break;
      case "addLog":
        appendLog(ss, payload.log);
        break;
      default:
        throw new Error("Unknown action: " + action);
    }
    return buildResponse({ success: true, action });
  } catch (err) {
    return buildResponse({ success: false, error: err.toString() });
  }
}

// ─────────────────────────────────────────────
//  タスク一覧 CRUD
// ─────────────────────────────────────────────
function readTasks(ss) {
  const sheet = ss.getSheetByName(SHEET_TASKS);
  if (!sheet || sheet.getLastRow() < 2) return [];
  return sheet
    .getRange(2, 1, sheet.getLastRow() - 1, TASK_COLS.length)
    .getValues()
    .filter(r => r[0] !== "")
    .map(rowToTask);
}

function writeTasks(ss, tasks) {
  const sheet = ensureSheet(ss, SHEET_TASKS, TASK_COLS);
  clearData(sheet, TASK_COLS.length);
  if (!tasks.length) return;
  sheet.getRange(2, 1, tasks.length, TASK_COLS.length).setValues(tasks.map(taskToRow));
}

function appendTask(ss, task) {
  const sheet = ensureSheet(ss, SHEET_TASKS, TASK_COLS);
  sheet.appendRow(taskToRow(task));
}

function updateTaskById(ss, task) {
  const sheet = ss.getSheetByName(SHEET_TASKS);
  if (!sheet || sheet.getLastRow() < 2) { appendTask(ss, task); return; }
  const ids = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues().flat().map(String);
  const idx = ids.indexOf(String(task.id));
  if (idx < 0) { appendTask(ss, task); return; }
  sheet.getRange(idx + 2, 1, 1, TASK_COLS.length).setValues([taskToRow(task)]);
}

function deleteTaskById(ss, id) {
  const sheet = ss.getSheetByName(SHEET_TASKS);
  if (!sheet || sheet.getLastRow() < 2) return;
  const ids = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues().flat().map(String);
  const idx = ids.indexOf(String(id));
  if (idx >= 0) sheet.deleteRow(idx + 2);
}

function rowToTask(r) {
  return {
    id:             String(r[0] ?? ""),
    起案日:         formatDate(r[1]),
    タスク名:       String(r[2] ?? ""),
    タスク種別:     String(r[3] ?? ""),
    プロジェクト名: String(r[4] ?? ""),
    関係者:         String(r[5] ?? ""),
    役員関与:       toBool(r[6]),
    規模:           String(r[7] ?? ""),
    ステータス:     String(r[8] ?? ""),
    期日:           formatDate(r[9]),
    次のアクション: String(r[10] ?? ""),
    完了日:         formatDate(r[11]),
    EC依頼:         toBool(r[12]),
    進捗ログ登録:   toBool(r[13]),
    進捗メモ:       String(r[14] ?? ""),
    カテゴリ:       String(r[15] ?? ""),
    撮影依頼:       toBool(r[16]),
    撮影メモ:       String(r[17] ?? ""),
  };
}

function taskToRow(t) {
  return [
    t.id,           t.起案日,       t.タスク名,     t.タスク種別, t.プロジェクト名,
    t.関係者,       !!t.役員関与,   t.規模,         t.ステータス, t.期日,
    t.次のアクション, t.完了日,     !!t.EC依頼,     !!t.進捗ログ登録, t.進捗メモ,
    t.カテゴリ,     !!t.撮影依頼,   t.撮影メモ,
  ];
}

// ─────────────────────────────────────────────
//  進捗ログ CRUD
// ─────────────────────────────────────────────
function readLogs(ss) {
  const sheet = ss.getSheetByName(SHEET_LOGS);
  if (!sheet || sheet.getLastRow() < 2) return [];
  return sheet
    .getRange(2, 1, sheet.getLastRow() - 1, LOG_COLS.length)
    .getValues()
    .filter(r => r[0] !== "")
    .map((r, i) => ({
      id:             i + 1,
      日付:           formatDate(r[0]),
      プロジェクト名: String(r[1] ?? ""),
      フェーズ:       String(r[2] ?? ""),
      進捗内容:       String(r[3] ?? ""),
      関係者:         String(r[4] ?? ""),
      次のマイルストーン: String(r[5] ?? ""),
    }));
}

function writeLogs(ss, logs) {
  const sheet = ensureSheet(ss, SHEET_LOGS, LOG_COLS);
  clearData(sheet, LOG_COLS.length);
  if (!logs.length) return;
  sheet.getRange(2, 1, logs.length, LOG_COLS.length).setValues(
    logs.map(l => [l.日付, l.プロジェクト名, l.フェーズ, l.進捗内容, l.関係者, l.次のマイルストーン])
  );
}

function appendLog(ss, log) {
  const sheet = ensureSheet(ss, SHEET_LOGS, LOG_COLS);
  sheet.appendRow([log.日付, log.プロジェクト名, log.フェーズ, log.進捗内容, log.関係者, log.次のマイルストーン]);
}

// ─────────────────────────────────────────────
//  プロジェクトマスタ
// ─────────────────────────────────────────────
function readProjects(ss) {
  const sheet = ss.getSheetByName(SHEET_PROJECTS);
  if (!sheet || sheet.getLastRow() < 2) return [];
  return sheet
    .getRange(2, 1, sheet.getLastRow() - 1, 1)
    .getValues()
    .flat()
    .filter(v => v !== "")
    .map(String);
}

function writeProjects(ss, projects) {
  const sheet = ensureSheet(ss, SHEET_PROJECTS, ["プロジェクト名"]);
  clearData(sheet, 1);
  if (!projects.length) return;
  sheet.getRange(2, 1, projects.length, 1).setValues(projects.map(p => [p]));
}

// ─────────────────────────────────────────────
//  ユーティリティ
// ─────────────────────────────────────────────
function ensureSheet(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    const r = sheet.getRange(1, 1, 1, headers.length);
    r.setValues([headers]);
    r.setFontWeight("bold");
    r.setBackground("#1f2937");
    r.setFontColor("#ffffff");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function clearData(sheet, cols) {
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, cols).clearContent();
  }
}

function toBool(v) {
  return v === true || v === "TRUE" || v === "true" || v === 1;
}

function formatDate(v) {
  if (!v) return "";
  if (v instanceof Date) {
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1).padStart(2, "0");
    const d = String(v.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return String(v).slice(0, 10);
}

function buildResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
