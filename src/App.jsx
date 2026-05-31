import { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

// ── Constants ─────────────────────────────────────────────────────────────────
const STATUSES   = ["未着手", "進行中", "レビュー中", "完了", "保留"];
const TASK_TYPES = ["議事録", "稟議・資料", "Amazon運用", "LP制作", "Shopify", "社内調整", "撮影", "企画", "その他"];
const CATEGORIES = ["マーケティング", "EC運用", "制作", "管理", "撮影", "その他"];
const SCALES     = ["S", "M", "L", "XL"];
const PHASES     = ["企画", "要件定義", "制作", "レビュー", "承認待ち", "完了"];
const COLORS     = ["#00C9A7", "#845EC2", "#FF6B6B", "#FFC75F", "#4D8AF0", "#F9A8D4", "#94A3B8", "#FB923C"];
const PROJECT_PALETTE = ["#00C9A7", "#845EC2", "#FF6B6B", "#FFC75F", "#4D8AF0", "#F9A8D4", "#FB923C", "#34D399"];

const STATUS_CLS = {
  "未着手":     "bg-slate-700/70 text-slate-300",
  "進行中":     "bg-blue-900/70 text-blue-300",
  "レビュー中": "bg-yellow-900/70 text-yellow-300",
  "完了":       "bg-teal-900/70 text-teal-300",
  "保留":       "bg-red-900/70 text-red-300",
};
const STATUS_DOT = {
  "未着手": "bg-slate-400", "進行中": "bg-blue-400",
  "レビュー中": "bg-yellow-400", "完了": "bg-teal-400", "保留": "bg-red-400",
};
const STATUS_PIE_COLOR = ["#94A3B8", "#4D8AF0", "#FFC75F", "#00C9A7", "#FF6B6B"];

const EMPTY_TASK = () => ({
  id: `T${String(Date.now()).slice(-6)}`,
  起案日: new Date().toISOString().slice(0, 10),
  タスク名: "", タスク種別: TASK_TYPES[0], プロジェクト名: "",
  関係者: "", 役員関与: false, 規模: "M", ステータス: "未着手",
  期日: "", 次のアクション: "", 完了日: "", EC依頼: false,
  進捗ログ登録: false, 進捗メモ: "", カテゴリ: CATEGORIES[0],
  撮影依頼: false, 撮影メモ: "",
});

const EMPTY_LOG = () => ({
  日付: new Date().toISOString().slice(0, 10),
  プロジェクト名: "", フェーズ: PHASES[0],
  進捗内容: "", 関係者: "", 次のマイルストーン: "",
});

// ── Sample data ───────────────────────────────────────────────────────────────
const initialTasks = [
  { id: "T001", 起案日: "2026-05-20", タスク名: "キックオフMTG議事録", タスク種別: "議事録", プロジェクト名: "グラビングシューズ", 関係者: "田中・佐藤", 役員関与: false, 規模: "S", ステータス: "完了", 期日: "2026-05-28", 次のアクション: "", 完了日: "2026-05-28", EC依頼: false, 進捗ログ登録: true, 進捗メモ: "キックオフ完了", カテゴリ: "管理", 撮影依頼: false, 撮影メモ: "" },
  { id: "T002", 起案日: "2026-05-22", タスク名: "GAIA-MAX LP企画書", タスク種別: "LP制作", プロジェクト名: "Angle 3D", 関係者: "山田", 役員関与: true, 規模: "L", ステータス: "進行中", 期日: "2026-06-05", 次のアクション: "デザイン確認", 完了日: "", EC依頼: false, 進捗ログ登録: false, 進捗メモ: "構成案作成中", カテゴリ: "制作", 撮影依頼: false, 撮影メモ: "" },
  { id: "T003", 起案日: "2026-05-25", タスク名: "Amazon週次レポート", タスク種別: "Amazon運用", プロジェクト名: "社内EC", 関係者: "鈴木", 役員関与: false, 規模: "S", ステータス: "完了", 期日: "2026-05-29", 次のアクション: "", 完了日: "2026-05-29", EC依頼: true, 進捗ログ登録: false, 進捗メモ: "", カテゴリ: "EC運用", 撮影依頼: false, 撮影メモ: "" },
  { id: "T004", 起案日: "2026-05-26", タスク名: "Shopifyテスト商品ページ", タスク種別: "Shopify", プロジェクト名: "Angle 3D", 関係者: "田中", 役員関与: false, 規模: "M", ステータス: "未着手", 期日: "2026-06-03", 次のアクション: "商品データ整理", 完了日: "", EC依頼: false, 進捗ログ登録: false, 進捗メモ: "", カテゴリ: "EC運用", 撮影依頼: true, 撮影メモ: "商品写真10点" },
  { id: "T005", 起案日: "2026-05-27", タスク名: "マテリアル稟議書v9", タスク種別: "稟議・資料", プロジェクト名: "マテリアル", 関係者: "部長・山本", 役員関与: true, 規模: "M", ステータス: "レビュー中", 期日: "2026-06-01", 次のアクション: "部長確認", 完了日: "", EC依頼: false, 進捗ログ登録: true, 進捗メモ: "v9提出済み", カテゴリ: "管理", 撮影依頼: false, 撮影メモ: "" },
];

const initialLogs = [
  { id: 1, 日付: "2026-05-29", プロジェクト名: "メディアエンジン施策", フェーズ: "社内決定共有", 進捗内容: "KV・販売方針の決定事項をメディアエンジンに正式共有（田波対応）", 関係者: "田波、兵藤", 次のマイルストーン: "KV・ロゴ制作・撮影調整" },
  { id: 2, 日付: "2026-05-28", プロジェクト名: "メディアエンジン施策", フェーズ: "KV決定", 進捗内容: "KVをA案「カラダをつくる靴」に決定。AirとRootsはクラファンで販売。スポルテックは試し履き会場として活用", 関係者: "田波、兵藤", 次のマイルストーン: "クリエイティブ制作・撮影段取り" },
  { id: 3, 日付: "2026-05-28", プロジェクト名: "グラビングシューズ", フェーズ: "企画", 進捗内容: "キックオフMTG実施。ターゲット・競合調査方針決定", 関係者: "田中・佐藤", 次のマイルストーン: "競合調査完了（6/5）" },
  { id: 4, 日付: "2026-05-27", プロジェクト名: "Angle 3D", フェーズ: "制作", 進捗内容: "GAIA-MAX LP構成案作成開始", 関係者: "山田", 次のマイルストーン: "LP企画書提出（6/5）" },
  { id: 5, 日付: "2026-05-27", プロジェクト名: "マテリアル", フェーズ: "レビュー", 進捗内容: "稟議書v9提出。部長レビュー待ち", 関係者: "部長・山本", 次のマイルストーン: "承認（6/1）" },
  { id: 6, 日付: "2026-05-22", プロジェクト名: "メディアエンジン施策", フェーズ: "すり合わせ", 進捗内容: "KVアンケート結果共有（A案「カラダをつくる靴」が全指標トップ）。重点施策・スケジュール・見積もり提示", 関係者: "坂庭、兵藤", 次のマイルストーン: "5/28 MTG" },
  { id: 7, 日付: "2026-05-14", プロジェクト名: "メディアエンジン施策", フェーズ: "提案", 進捗内容: "ソウルドアウトグループによるブランド戦略提案（BMZみなかみ来社5名）。KPI52,000足・予算2,500万〜1.9億円の2プラン提示", 関係者: "山中、高橋、深澤、坂庭、田波、兵藤", 次のマイルストーン: "KV・施策すり合わせMTG" },
  { id: 8, 日付: "2026-05-08", プロジェクト名: "メディアエンジン施策", フェーズ: "調整", 進捗内容: "ロゴ提案スコープ確認。グラビングシリーズロゴはMEが提案（5月末目途）。化粧箱は中長期課題に", 関係者: "田波、兵藤", 次のマイルストーン: "5/14提案MTG" },
  { id: 9, 日付: "2026-04-27", プロジェクト名: "メディアエンジン施策", フェーズ: "クリエイティブ深掘り", 進捗内容: "深澤同席・コンセプト深掘りMTG。契約書やりとり開始", 関係者: "坂庭、深澤、兵藤", 次のマイルストーン: "提案MTG日程調整" },
  { id: 10, 日付: "2026-04-22", プロジェクト名: "メディアエンジン施策", フェーズ: "ヒアリング", 進捗内容: "商品・ブランド深掘りMTG。NDAドラフト送付・BMZ側修正対応", 関係者: "坂庭、兵藤", 次のマイルストーン: "クリエイティブ深掘りMTG" },
  { id: 11, 日付: "2026-04-16", プロジェクト名: "メディアエンジン施策", フェーズ: "キックオフ", 進捗内容: "初回MTG。商品・ブランド・スケジュール・予算の初期ヒアリング", 関係者: "田波、兵藤", 次のマイルストーン: "商品深掘りMTG" },
  { id: 12, 日付: "2026-05-29", プロジェクト名: "GAIA-MAX-PRO（Angle 3D）", フェーズ: "修正確認", 進捗内容: "修正6点について回答。ロゴ変更は現状維持、ピンクのみクリーム色調整、ステッチの分離修正を依頼。最終版の修正対応待ち", 関係者: "田波、Gabriele", 次のマイルストーン: "最終版確認・本番公開" },
  { id: 13, 日付: "2026-05-27", プロジェクト名: "GAIA-MAX-PRO（Angle 3D）", フェーズ: "修正対応", 進捗内容: "6点の修正フィードバックをWordファイルにまとめて送付。日本語表示対応の可否も確認→チュートリアルURLを受領", 関係者: "田波、Gabriele", 次のマイルストーン: "修正完了・本番反映" },
  { id: 14, 日付: "2026-05-21", プロジェクト名: "GAIA-MAX-PRO（Angle 3D）", フェーズ: "納品・レビュー", 進捗内容: "Gabrieleよりコンフィギュレータ納品。Loomビデオで確認。ヒールカウンターの長さ・ソールの明るさについてフィードバック送付", 関係者: "田波、Gabriele", 次のマイルストーン: "修正対応" },
  { id: 15, 日付: "2026-05-18", プロジェクト名: "GAIA-MAX-PRO（Angle 3D）", フェーズ: "テスト環境構築", 進捗内容: "テスト用商品ページ（下書き）を作成しAngle 3Dに共有。コンフィギュレータのテスト設置を依頼", 関係者: "田波、Gabriele", 次のマイルストーン: "コンフィギュレータ納品・レビュー" },
  { id: 16, 日付: "2026-05-13", プロジェクト名: "GAIA-MAX-PRO（Angle 3D）", フェーズ: "確認・承認", 進捗内容: "PREMIUMプラン加入完了。Shopifyストアへのアクセス承認。コンフィギュレータ設置先商品ページ（Full/Semi/Easy Order）を指定。シルエットのスリム化を追加依頼", 関係者: "田波、Gabriele", 次のマイルストーン: "コンフィギュレータ納品" },
  { id: 17, 日付: "2026-05-04", プロジェクト名: "GAIA-MAX-PRO（Angle 3D）", フェーズ: "3Dモデル制作", 進捗内容: "Gabrieleより3Dモデルの制作進捗共有（作業中画像）。1足表示か2足表示かの確認あり", 関係者: "Ahmet、Gabriele", 次のマイルストーン: "モデル確認・PREMIUM加入" },
  { id: 18, 日付: "2026-04-15", プロジェクト名: "GAIA-MAX-PRO（Angle 3D）", フェーズ: "契約・支払い", 進捗内容: "社内承認完了。Angle 3DへStripe経由で支払い完了。制作開始の連絡受領", 関係者: "Ahmet、Maël", 次のマイルストーン: "3Dモデル制作" },
  { id: 19, 日付: "2026-04-03", プロジェクト名: "GAIA-MAX-PRO（Angle 3D）", フェーズ: "見積もり", 進捗内容: "Angle 3DよりGAIA-MAX-PROの見積もり受領。PREMIUMプラン（$69/月）加入が必要と確認。3Dモデル制作・コンフィギュレータ構築・設置費用が対象", 関係者: "Ahmet、Maël", 次のマイルストーン: "社内承認・支払い" },
];

const initialProjects = ["社内EC", "マテリアル", "Angle 3D", "グラビングシューズ", "BMZ全般"];

// ── Sub components ────────────────────────────────────────────────────────────
function Badge({ status }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_CLS[status] ?? "bg-gray-700 text-gray-300"}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[status] ?? "bg-gray-400"}`} />
      {status}
    </span>
  );
}

function KpiCard({ label, value, sub, color = "text-white" }) {
  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
    </div>
  );
}

function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white shadow-xl">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.fill ?? p.color }}>{p.name}: {p.value}</p>)}
    </div>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`w-9 h-5 rounded-full relative transition-colors flex-shrink-0 ${value ? "bg-teal-500" : "bg-gray-700"}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${value ? "translate-x-4" : ""}`} />
      </button>
      <span className="text-xs text-gray-300">{label}</span>
    </label>
  );
}

// ── Task Modal ────────────────────────────────────────────────────────────────
function TaskModal({ task, projects, onSave, onClose }) {
  const [f, setF] = useState({ ...task });
  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }));
  const inp = "bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-teal-500 transition-colors w-full";
  const lbl = "text-gray-400 text-xs mb-1 block";
  const sec = "text-xs font-semibold text-teal-400 uppercase tracking-wide mb-3";

  return (
    <div className="fixed inset-0 bg-black/75 flex items-start justify-center z-50 overflow-y-auto py-8" onClick={onClose}>
      <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-2xl mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-base font-semibold text-white">{task.タスク名 ? "タスク編集" : "タスク追加"}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 cursor-pointer text-lg">✕</button>
        </div>

        <div className="p-6 space-y-6">
          {/* 基本情報 */}
          <section>
            <h3 className={sec}>基本情報</h3>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>ID</label>
                <input className={inp} value={f.id} onChange={e => set("id", e.target.value)} placeholder="T001" /></div>
              <div><label className={lbl}>起案日</label>
                <input type="date" className={inp} value={f.起案日} onChange={e => set("起案日", e.target.value)} /></div>
              <div className="col-span-2"><label className={lbl}>タスク名 *</label>
                <input className={inp} value={f.タスク名} onChange={e => set("タスク名", e.target.value)} placeholder="タスク名を入力" /></div>
              <div><label className={lbl}>タスク種別</label>
                <select className={inp} value={f.タスク種別} onChange={e => set("タスク種別", e.target.value)}>
                  {TASK_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
              <div><label className={lbl}>カテゴリ</label>
                <select className={inp} value={f.カテゴリ} onChange={e => set("カテゴリ", e.target.value)}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
              <div className="col-span-2"><label className={lbl}>プロジェクト名</label>
                <select className={inp} value={f.プロジェクト名} onChange={e => set("プロジェクト名", e.target.value)}>
                  <option value="">-- 選択 --</option>
                  {projects.map(p => <option key={p}>{p}</option>)}</select></div>
            </div>
          </section>

          {/* 体制・規模 */}
          <section>
            <h3 className={sec}>体制・規模</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className={lbl}>関係者</label>
                <input className={inp} value={f.関係者} onChange={e => set("関係者", e.target.value)} placeholder="田中・佐藤" /></div>
              <div><label className={lbl}>規模</label>
                <select className={inp} value={f.規模} onChange={e => set("規模", e.target.value)}>
                  {SCALES.map(s => <option key={s}>{s}</option>)}</select></div>
              <div className="flex items-end pb-2">
                <Toggle label="役員関与" value={f.役員関与} onChange={v => set("役員関与", v)} /></div>
            </div>
          </section>

          {/* スケジュール */}
          <section>
            <h3 className={sec}>スケジュール</h3>
            <div className="grid grid-cols-3 gap-3">
              <div><label className={lbl}>ステータス</label>
                <select className={inp} value={f.ステータス} onChange={e => set("ステータス", e.target.value)}>
                  {STATUSES.map(s => <option key={s}>{s}</option>)}</select></div>
              <div><label className={lbl}>期日</label>
                <input type="date" className={inp} value={f.期日} onChange={e => set("期日", e.target.value)} /></div>
              <div><label className={lbl}>完了日</label>
                <input type="date" className={inp} value={f.完了日} onChange={e => set("完了日", e.target.value)} /></div>
            </div>
          </section>

          {/* アクション・メモ */}
          <section>
            <h3 className={sec}>アクション・メモ</h3>
            <div className="space-y-3">
              <div><label className={lbl}>次のアクション</label>
                <input className={inp} value={f.次のアクション} onChange={e => set("次のアクション", e.target.value)} placeholder="次に何をするか" /></div>
              <div><label className={lbl}>進捗メモ</label>
                <textarea className={`${inp} resize-none`} rows={2} value={f.進捗メモ}
                  onChange={e => set("進捗メモ", e.target.value)} placeholder="進捗の補足メモ" /></div>
            </div>
          </section>

          {/* フラグ */}
          <section>
            <h3 className={sec}>フラグ・依頼</h3>
            <div className="grid grid-cols-3 gap-4 mb-3">
              <Toggle label="EC依頼"       value={f.EC依頼}       onChange={v => set("EC依頼", v)} />
              <Toggle label="進捗ログ登録" value={f.進捗ログ登録} onChange={v => set("進捗ログ登録", v)} />
              <Toggle label="撮影依頼"     value={f.撮影依頼}     onChange={v => set("撮影依頼", v)} />
            </div>
            {f.撮影依頼 && (
              <div><label className={lbl}>撮影メモ</label>
                <input className={inp} value={f.撮影メモ} onChange={e => set("撮影メモ", e.target.value)} placeholder="撮影内容・本数など" /></div>
            )}
          </section>
        </div>

        <div className="px-6 py-4 border-t border-gray-800 flex justify-end gap-2">
          <button onClick={onClose} className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer">キャンセル</button>
          <button
            onClick={() => { if (f.タスク名.trim()) onSave(f); }}
            className="bg-teal-600 hover:bg-teal-500 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >保存</button>
        </div>
      </div>
    </div>
  );
}

// ── Shared styles ─────────────────────────────────────────────────────────────
const inputCls = "bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-teal-500 transition-colors w-full";
const labelCls = "text-gray-400 text-xs mb-1 block";

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [tasks,    setTasks]    = useState(initialTasks);
  const [logs,     setLogs]     = useState(initialLogs);
  const [projects, setProjects] = useState(initialProjects);
  const [activeTab, setActiveTab] = useState("dashboard");

  // GAS sync
  const [gasUrl,      setGasUrl]      = useState(() => localStorage.getItem("gasUrl") ?? "");
  const [gasUrlDraft, setGasUrlDraft] = useState(() => localStorage.getItem("gasUrl") ?? "");
  const [syncStatus,  setSyncStatus]  = useState("idle");
  const [showSettings, setShowSettings] = useState(false);

  // Task list filters
  const [filterProject, setFilterProject] = useState("");
  const [filterStatus,  setFilterStatus]  = useState("");
  const [filterText,    setFilterText]    = useState("");

  // Log navigation: null = project cards, string = selected project detail
  const [selectedLogProject, setSelectedLogProject] = useState(null);
  const [showAddProject,  setShowAddProject]  = useState(false);
  const [newProjectName,  setNewProjectName]  = useState("");

  // Modals
  const [taskModal,  setTaskModal]  = useState(null);
  const [showLogForm, setShowLogForm] = useState(false);
  const [logForm,    setLogForm]    = useState(EMPTY_LOG());

  // ── Computed ────────────────────────────────────────────────────────────
  const today = new Date().toISOString().slice(0, 10);

  const kpi = useMemo(() => {
    const total    = tasks.length;
    const active   = tasks.filter(t => ["未着手", "進行中", "レビュー中"].includes(t.ステータス)).length;
    const done     = tasks.filter(t => t.ステータス === "完了").length;
    const overdue  = tasks.filter(t => t.期日 && t.期日 < today && t.ステータス !== "完了").length;
    const photo    = tasks.filter(t => t.撮影依頼 && t.ステータス !== "完了").length;
    return { total, active, done, overdue, photo };
  }, [tasks, today]);

  const projectChartData = useMemo(() => {
    const map = {};
    tasks.filter(t => t.ステータス !== "完了" && t.プロジェクト名)
      .forEach(t => { map[t.プロジェクト名] = (map[t.プロジェクト名] ?? 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [tasks]);

  const statusChartData = useMemo(() => {
    const map = {};
    tasks.forEach(t => { map[t.ステータス] = (map[t.ステータス] ?? 0) + 1; });
    return STATUSES.filter(s => map[s]).map(s => ({ name: s, value: map[s] }));
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks
      .filter(t => {
        if (filterProject && t.プロジェクト名 !== filterProject) return false;
        if (filterStatus  && t.ステータス !== filterStatus)       return false;
        if (filterText    && !t.タスク名.includes(filterText) && !t.次のアクション.includes(filterText)) return false;
        return true;
      })
      .sort((a, b) => {
        const ord = ["未着手", "進行中", "レビュー中", "保留", "完了"];
        const d = ord.indexOf(a.ステータス) - ord.indexOf(b.ステータス);
        if (d !== 0) return d;
        return (a.期日 ?? "").localeCompare(b.期日 ?? "");
      });
  }, [tasks, filterProject, filterStatus, filterText]);

  // ── Actions ─────────────────────────────────────────────────────────────
  const saveTask = task => {
    setTasks(prev => {
      const idx = prev.findIndex(t => t.id === task.id);
      return idx >= 0 ? prev.map(t => t.id === task.id ? task : t) : [...prev, task];
    });
    setTaskModal(null);
  };

  const deleteProject = name => {
    if (!confirm(`「${name}」を削除しますか？\n関連する進捗ログとタスクもすべて削除されます。`)) return;
    setProjects(prev => prev.filter(p => p !== name));
    setLogs(prev => prev.filter(l => l.プロジェクト名 !== name));
    setTasks(prev => prev.filter(t => t.プロジェクト名 !== name));
  };

  const addProject = () => {
    const name = newProjectName.trim();
    if (!name || projects.includes(name)) return;
    setProjects(prev => [...prev, name]);
    setNewProjectName("");
    setShowAddProject(false);
  };

  const deleteTask = id => {
    if (!confirm("このタスクを削除しますか？")) return;
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const addLog = () => {
    if (!logForm.進捗内容.trim()) return;
    setLogs(prev => [{ ...logForm, id: Date.now() }, ...prev]);
    setLogForm(EMPTY_LOG());
    setShowLogForm(false);
  };

  const deleteLog = id => setLogs(prev => prev.filter(l => l.id !== id));

  // ── Log helpers ──────────────────────────────────────────────────────────
  const logProjects = useMemo(() => {
    const seen = new Set();
    logs.forEach(l => { if (l.プロジェクト名) seen.add(l.プロジェクト名); });
    return [...seen];
  }, [logs]);

  const filteredLogs = useMemo(() =>
    selectedLogProject ? logs.filter(l => l.プロジェクト名 === selectedLogProject) : logs
  , [logs, selectedLogProject]);

  const projectColor = (name) => {
    const allNames = [...new Set([...projects, ...logProjects])];
    const idx = allNames.indexOf(name);
    return PROJECT_PALETTE[(idx >= 0 ? idx : 0) % PROJECT_PALETTE.length];
  };

  const projectCardData = useMemo(() => {
    const allNames = [...new Set([...projects, ...logProjects])];
    return allNames.map(name => {
      const pl = logs.filter(l => l.プロジェクト名 === name);
      const sorted = [...pl].sort((a, b) => b.日付.localeCompare(a.日付));
      const pt = tasks.filter(t => t.プロジェクト名 === name);
      const inc = pt.filter(t => t.ステータス !== "完了").length;
      return {
        name,
        logCount:    pl.length,
        taskCount:   pt.length,
        incCount:    inc,
        latestPhase: sorted[0]?.フェーズ ?? "—",
        lastDate:    sorted[0]?.日付    ?? "—",
        color:       projectColor(name),
      };
    }).sort((a, b) => b.lastDate.localeCompare(a.lastDate));
  }, [logs, logProjects, projects, tasks]);

  // ── GAS Sync ─────────────────────────────────────────────────────────────
  const flash = s => { setSyncStatus(s); setTimeout(() => setSyncStatus("idle"), 2500); };

  const saveToSheet = async () => {
    if (!gasUrl) { setShowSettings(true); return; }
    setSyncStatus("saving");
    try {
      await fetch(gasUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ action: "saveAll", tasks, logs, projects }),
      });
      flash("success");
    } catch (_) { flash("error"); }
  };

  const loadFromSheet = async () => {
    if (!gasUrl) { setShowSettings(true); return; }
    setSyncStatus("loading");
    try {
      const res = await fetch(`${gasUrl}?t=${Date.now()}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (data.tasks?.length)    setTasks(data.tasks);
      if (data.logs?.length)     setLogs(data.logs);
      if (data.projects?.length) setProjects(data.projects);
      flash("success");
    } catch (_) { flash("error"); }
  };

  const saveGasUrl = () => {
    localStorage.setItem("gasUrl", gasUrlDraft);
    setGasUrl(gasUrlDraft);
    setShowSettings(false);
  };

  // ── UI helpers ───────────────────────────────────────────────────────────
  const syncLabel = { saving: "保存中…", loading: "読込中…", success: "✓ 完了", error: "エラー" }[syncStatus];
  const syncColor = { saving: "text-yellow-400", loading: "text-blue-400", success: "text-teal-400", error: "text-red-400" }[syncStatus];
  const todayJP = new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "short" });

  const tabs = [
    { id: "dashboard", label: "ダッシュボード" },
    { id: "tasks",     label: `タスク一覧 (${tasks.length})` },
    { id: "logs",      label: "進捗ログ" },
  ];

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Task Modal */}
      {taskModal && <TaskModal task={taskModal} projects={projects} onSave={saveTask} onClose={() => setTaskModal(null)} />}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowSettings(false)}>
          <div className="bg-gray-900 rounded-xl border border-gray-700 p-6 w-full max-w-lg mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-semibold text-white mb-1">GAS 連携設定</h2>
            <p className="text-gray-500 text-xs mb-4">Google Apps Script の Web アプリ URL を入力してください</p>
            <label className={labelCls}>Web アプリ URL</label>
            <input className={`${inputCls} mb-4`} placeholder="https://script.google.com/macros/s/.../exec"
              value={gasUrlDraft} onChange={e => setGasUrlDraft(e.target.value)}
              onKeyDown={e => e.key === "Enter" && saveGasUrl()} autoFocus />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowSettings(false)} className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-2 rounded-lg text-sm cursor-pointer">キャンセル</button>
              <button onClick={saveGasUrl} className="bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-pointer">保存</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <div className="flex-shrink-0">
            <h1 className="text-xl font-bold">BMZ 営業部1課</h1>
            <p className="text-gray-500 text-xs mt-0.5">業務管理ダッシュボード</p>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            {syncLabel && <span className={`text-xs font-medium ${syncColor}`}>{syncLabel}</span>}
            <button onClick={loadFromSheet} disabled={syncStatus !== "idle"}
              title="スプレッドシートから読込"
              className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-gray-300 text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              読込
            </button>
            <button onClick={saveToSheet} disabled={syncStatus !== "idle"}
              title="スプレッドシートへ保存"
              className="flex items-center gap-1.5 bg-teal-700 hover:bg-teal-600 disabled:opacity-40 text-white text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
              保存
            </button>
            <button onClick={() => { setGasUrlDraft(gasUrl); setShowSettings(true); }}
              title="GAS 設定"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${gasUrl ? "text-gray-500 hover:text-gray-300" : "text-yellow-500 hover:text-yellow-400"}`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>
          </div>
          <span className="text-gray-500 text-sm hidden lg:block flex-shrink-0">{todayJP}</span>
        </div>
      </header>

      {/* ── Tab Nav ── */}
      <nav className="bg-gray-900 border-b border-gray-800 px-6">
        <div className="max-w-7xl mx-auto flex gap-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                activeTab === t.id ? "border-teal-500 text-teal-400" : "border-transparent text-gray-400 hover:text-gray-200"
              }`}>{t.label}</button>
          ))}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* ════ DASHBOARD ════ */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* KPI */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <KpiCard label="総タスク数"   value={kpi.total}  sub="全件"              />
              <KpiCard label="進行中"        value={kpi.active} sub="未着手+進行+レビュー" color="text-blue-400" />
              <KpiCard label="完了"          value={kpi.done}   sub="完了済み"          color="text-teal-400" />
              <KpiCard label="期日超過"      value={kpi.overdue} sub="要対応"           color="text-red-400" />
              <KpiCard label="撮影依頼 未完了" value={kpi.photo} sub="撮影案件"        color="text-yellow-400" />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                <h2 className="text-sm font-semibold text-gray-300 mb-4">案件別 未完了タスク数</h2>
                {projectChartData.length ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={projectChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<ChartTip />} />
                      <Bar dataKey="value" name="タスク数" radius={[4, 4, 0, 0]}>
                        {projectChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="text-gray-600 text-sm text-center py-16">未完了タスクなし</p>}
              </div>

              <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                <h2 className="text-sm font-semibold text-gray-300 mb-4">ステータス分布</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={statusChartData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" nameKey="name">
                      {statusChartData.map((entry, i) => (
                        <Cell key={i} fill={STATUS_PIE_COLOR[STATUSES.indexOf(entry.name)] ?? COLORS[i]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v + "件", n]}
                      contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: 8, color: "#fff", fontSize: 12 }} />
                    <Legend formatter={v => <span style={{ color: "#9ca3af", fontSize: 11 }}>{v}</span>} iconSize={8} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 期日超過 */}
            {kpi.overdue > 0 && (
              <div className="bg-gray-900 rounded-xl border border-red-900/50 overflow-hidden">
                <div className="px-5 py-3 border-b border-red-900/30 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <h2 className="text-sm font-semibold text-red-400">期日超過タスク</h2>
                </div>
                <div className="divide-y divide-gray-800">
                  {tasks.filter(t => t.期日 && t.期日 < today && t.ステータス !== "完了").map(t => (
                    <div key={t.id} className="flex items-center gap-4 px-5 py-3">
                      <Badge status={t.ステータス} />
                      <span className="text-sm flex-1 text-white">{t.タスク名}</span>
                      <span className="text-xs text-gray-500 hidden md:block">{t.プロジェクト名}</span>
                      <span className="text-xs text-red-400 font-medium">{t.期日}</span>
                      <button onClick={() => setTaskModal({ ...t })} className="text-xs text-gray-500 hover:text-white cursor-pointer">編集</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 最近の進捗ログ */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-300">最近の進捗ログ</h2>
                <button onClick={() => setActiveTab("logs")} className="text-xs text-teal-400 hover:text-teal-300 cursor-pointer">すべて見る →</button>
              </div>
              <div className="divide-y divide-gray-800">
                {logs.slice(0, 5).map((l, i) => (
                  <div key={l.id ?? i} className="px-5 py-3 flex gap-4 items-start">
                    <span className="text-xs text-gray-500 w-24 flex-shrink-0 pt-0.5">{l.日付}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-xs font-medium text-teal-400">{l.プロジェクト名}</span>
                        <span className="text-xs text-gray-600 bg-gray-800 px-1.5 py-0.5 rounded">{l.フェーズ}</span>
                      </div>
                      <p className="text-xs text-gray-300 line-clamp-2">{l.進捗内容}</p>
                    </div>
                    {l.次のマイルストーン && (
                      <p className="text-xs text-yellow-400/70 hidden lg:block flex-shrink-0 max-w-xs truncate">→ {l.次のマイルストーン}</p>
                    )}
                  </div>
                ))}
                {logs.length === 0 && <p className="text-center py-8 text-gray-600 text-sm">進捗ログなし</p>}
              </div>
            </div>
          </div>
        )}

        {/* ════ TASK LIST ════ */}
        {activeTab === "tasks" && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <input
                className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-teal-500 flex-1 min-w-48"
                placeholder="タスク名・アクションで検索..."
                value={filterText} onChange={e => setFilterText(e.target.value)} />
              <select className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                value={filterProject} onChange={e => setFilterProject(e.target.value)}>
                <option value="">全案件</option>
                {projects.map(p => <option key={p}>{p}</option>)}
              </select>
              <select className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">全ステータス</option>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
              <button onClick={() => setTaskModal(EMPTY_TASK())}
                className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer ml-auto">
                ＋ タスク追加
              </button>
            </div>
            <p className="text-gray-500 text-xs">{filteredTasks.length} 件表示</p>

            {/* Table */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 text-left text-xs font-medium text-gray-400">
                      <th className="px-4 py-3 w-32">ステータス</th>
                      <th className="px-4 py-3">タスク名</th>
                      <th className="px-4 py-3 w-32 hidden md:table-cell">案件</th>
                      <th className="px-4 py-3 w-28 hidden lg:table-cell">種別</th>
                      <th className="px-4 py-3 w-10 hidden lg:table-cell text-center">規模</th>
                      <th className="px-4 py-3 w-28 hidden md:table-cell">期日</th>
                      <th className="px-4 py-3 hidden xl:table-cell">次のアクション</th>
                      <th className="px-4 py-3 w-16 text-center hidden lg:table-cell">フラグ</th>
                      <th className="px-4 py-3 w-20"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {filteredTasks.map(t => {
                      const overdue = t.期日 && t.期日 < today && t.ステータス !== "完了";
                      return (
                        <tr key={t.id} className="hover:bg-gray-800/40 transition-colors group">
                          <td className="px-4 py-3"><Badge status={t.ステータス} /></td>
                          <td className="px-4 py-3">
                            <p className={`font-medium ${t.ステータス === "完了" ? "line-through text-gray-500" : "text-white"}`}>{t.タスク名}</p>
                            {t.進捗メモ && <p className="text-xs text-gray-500 truncate max-w-sm mt-0.5">{t.進捗メモ}</p>}
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-xs hidden md:table-cell">{t.プロジェクト名}</td>
                          <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">{t.タスク種別}</td>
                          <td className="px-4 py-3 text-center hidden lg:table-cell">
                            <span className="text-xs text-gray-500 font-mono">{t.規模}</span>
                          </td>
                          <td className={`px-4 py-3 text-xs hidden md:table-cell font-medium ${overdue ? "text-red-400" : "text-gray-400"}`}>
                            {t.期日 || "—"}{overdue && " ⚠"}
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-xs hidden xl:table-cell max-w-xs">
                            <span className="truncate block">{t.次のアクション}</span>
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <div className="flex gap-1 justify-center">
                              {t.役員関与     && <span title="役員関与"     className="text-xs">👔</span>}
                              {t.EC依頼       && <span title="EC依頼"       className="text-xs">🛒</span>}
                              {t.撮影依頼     && <span title="撮影依頼"     className="text-xs">📷</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => setTaskModal({ ...t })} className="text-xs text-gray-400 hover:text-white cursor-pointer">編集</button>
                              <button onClick={() => deleteTask(t.id)} className="text-xs text-gray-600 hover:text-red-400 cursor-pointer">削除</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filteredTasks.length === 0 && (
                  <p className="text-center py-12 text-gray-500 text-sm">該当するタスクがありません</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ════ LOGS ════ */}
        {activeTab === "logs" && (
          <div>

            {/* ── トップ: 案件カード一覧 ── */}
            {!selectedLogProject && (
              <div className="space-y-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-gray-400 text-sm">{projectCardData.length} 案件</p>
                  <button
                    onClick={() => { setShowAddProject(v => !v); setNewProjectName(""); }}
                    className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
                  >
                    ＋ 案件を追加
                  </button>
                </div>

                {/* 案件追加フォーム */}
                {showAddProject && (
                  <div className="bg-gray-900 border border-teal-800 rounded-xl p-4 flex gap-3 items-end">
                    <div className="flex-1">
                      <label className={labelCls}>案件名 *</label>
                      <input
                        className={inputCls}
                        placeholder="例：新商品ローンチ"
                        value={newProjectName}
                        onChange={e => setNewProjectName(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && addProject()}
                        autoFocus
                      />
                    </div>
                    <button onClick={addProject}
                      className="bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer flex-shrink-0">
                      追加
                    </button>
                    <button onClick={() => setShowAddProject(false)}
                      className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer flex-shrink-0">
                      キャンセル
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projectCardData.map(p => (
                    <div key={p.name}
                      className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-left hover:bg-gray-800/60 transition-colors group relative"
                      style={{ borderTopColor: p.color, borderTopWidth: "3px" }}
                    >
                      {/* 削除ボタン */}
                      <button
                        onClick={() => deleteProject(p.name)}
                        className="absolute top-3 right-3 w-5 h-5 flex items-center justify-center rounded-full text-gray-700 hover:text-red-400 hover:bg-red-400/10 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                        title="案件を削除"
                      >✕</button>

                      {/* 案件名 + 最終更新 */}
                      <div
                        className="flex items-start justify-between mb-3 cursor-pointer"
                        onClick={() => setSelectedLogProject(p.name)}
                      >
                        <h3 className="font-semibold text-sm leading-snug pr-6" style={{ color: p.color }}>{p.name}</h3>
                        <span className="text-xs text-gray-600 flex-shrink-0 mt-0.5">{p.lastDate}</span>
                      </div>

                      {/* 最新フェーズ〜カウント行（クリックで詳細遷移） */}
                      <div className="cursor-pointer" onClick={() => setSelectedLogProject(p.name)}>
                        <div className="mb-4">
                          <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                            style={{ backgroundColor: p.color + "20", color: p.color, border: `1px solid ${p.color}40` }}>
                            {p.latestPhase}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 pt-3 border-t border-gray-800">
                          <div className="flex-1">
                            <p className="text-xs text-gray-500 mb-0.5">進捗ログ</p>
                            <p className="text-xl font-bold" style={{ color: p.color }}>{p.logCount}</p>
                          </div>
                          <div className="w-px h-8 bg-gray-800" />
                          <div className="flex-1">
                            <p className="text-xs text-gray-500 mb-0.5">タスク</p>
                            <p className="text-xl font-bold text-white">
                              {p.taskCount}
                              {p.incCount > 0 && (
                                <span className="text-xs font-normal text-red-400 ml-1">({p.incCount}未完)</span>
                              )}
                            </p>
                          </div>
                          <span className="text-gray-600 text-xs group-hover:text-gray-300 transition-colors self-end">→</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {projectCardData.length === 0 && (
                    <p className="col-span-3 text-center py-16 text-gray-500 text-sm">進捗ログがありません</p>
                  )}
                </div>
              </div>
            )}

            {/* ── 案件詳細 ── */}
            {selectedLogProject && (() => {
              const color = projectColor(selectedLogProject);
              const projectTasks = tasks.filter(t => t.プロジェクト名 === selectedLogProject);
              const sortedLogs = [...filteredLogs].sort((a, b) => b.日付.localeCompare(a.日付));

              return (
                <div className="space-y-8">
                  {/* ページヘッダー */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <button
                      onClick={() => { setSelectedLogProject(null); setShowLogForm(false); }}
                      className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      戻る
                    </button>
                    <div className="w-px h-4 bg-gray-700" />
                    <h2 className="text-lg font-bold" style={{ color }}>{selectedLogProject}</h2>
                  </div>

                  {/* ══ セクション1: 進捗ログ ══ */}
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-5 rounded-full" style={{ backgroundColor: color }} />
                        <h3 className="text-sm font-semibold text-white">進捗ログ</h3>
                        <span className="text-xs text-gray-500">{sortedLogs.length} 件</span>
                      </div>
                      <button
                        onClick={() => { setLogForm({ ...EMPTY_LOG(), プロジェクト名: selectedLogProject }); setShowLogForm(v => !v); }}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                        style={{ backgroundColor: color + "20", color, border: `1px solid ${color}40` }}
                      >
                        ＋ 進捗ログを追加
                      </button>
                    </div>

                    {/* 追加フォーム */}
                    {showLogForm && (
                      <div className="bg-gray-900 rounded-xl p-5 space-y-4 mb-4"
                        style={{ border: `1px solid ${color}50` }}>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          <div><label className={labelCls}>日付</label>
                            <input type="date" className={inputCls} value={logForm.日付}
                              onChange={e => setLogForm(f => ({ ...f, 日付: e.target.value }))} /></div>
                          <div><label className={labelCls}>フェーズ</label>
                            <select className={inputCls} value={logForm.フェーズ}
                              onChange={e => setLogForm(f => ({ ...f, フェーズ: e.target.value }))}>
                              {PHASES.map(p => <option key={p}>{p}</option>)}</select></div>
                          <div className="col-span-2 md:col-span-3"><label className={labelCls}>進捗内容 *</label>
                            <textarea className={`${inputCls} resize-none`} rows={2} value={logForm.進捗内容}
                              placeholder="今回の進捗を記入"
                              onChange={e => setLogForm(f => ({ ...f, 進捗内容: e.target.value }))} /></div>
                          <div className="col-span-2"><label className={labelCls}>関係者</label>
                            <input className={inputCls} value={logForm.関係者}
                              onChange={e => setLogForm(f => ({ ...f, 関係者: e.target.value }))} placeholder="田中・佐藤" /></div>
                          <div><label className={labelCls}>次のマイルストーン</label>
                            <input className={inputCls} value={logForm.次のマイルストーン}
                              onChange={e => setLogForm(f => ({ ...f, 次のマイルストーン: e.target.value }))} placeholder="○○完了（6/5）" /></div>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => { setShowLogForm(false); setLogForm(EMPTY_LOG()); }}
                            className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-2 rounded-lg text-sm cursor-pointer">キャンセル</button>
                          <button onClick={addLog}
                            className="text-white px-5 py-2 rounded-lg text-sm font-medium cursor-pointer"
                            style={{ backgroundColor: color }}>追加</button>
                        </div>
                      </div>
                    )}

                    {/* タイムライン */}
                    {sortedLogs.length > 0 ? (
                      <div className="relative">
                        {sortedLogs.map((l, i) => (
                          <div key={l.id ?? i} className="flex gap-4 group">
                            {/* 軸 */}
                            <div className="flex flex-col items-center flex-shrink-0 w-6">
                              <div className="w-3 h-3 rounded-full mt-1 flex-shrink-0 ring-2 ring-gray-950"
                                style={{ backgroundColor: color }} />
                              {i < sortedLogs.length - 1 && (
                                <div className="w-px flex-1 mt-1" style={{ backgroundColor: color + "30", minHeight: "1.5rem" }} />
                              )}
                            </div>

                            {/* コンテンツ */}
                            <div className={`flex-1 pb-6 ${i === sortedLogs.length - 1 ? "pb-0" : ""}`}>
                              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                <span className="text-xs text-gray-500 font-mono">{l.日付}</span>
                                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                                  style={{ backgroundColor: color + "20", color, border: `1px solid ${color}40` }}>
                                  {l.フェーズ}
                                </span>
                                {l.関係者 && <span className="text-xs text-gray-500">👤 {l.関係者}</span>}
                                <button onClick={() => deleteLog(l.id ?? i)}
                                  className="ml-auto text-gray-700 hover:text-red-400 text-xs cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                              </div>
                              <p className="text-sm text-gray-200 leading-relaxed">{l.進捗内容}</p>
                              {l.次のマイルストーン && (
                                <p className="text-xs mt-1.5" style={{ color: color + "bb" }}>
                                  <span className="opacity-50 mr-1">→</span>{l.次のマイルストーン}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center py-10 text-gray-600 text-sm bg-gray-900 rounded-xl border border-gray-800">
                        進捗ログがありません
                      </p>
                    )}
                  </section>

                  {/* ══ セクション2: タスク ══ */}
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-5 rounded-full bg-gray-600" />
                        <h3 className="text-sm font-semibold text-white">タスク</h3>
                        <span className="text-xs text-gray-500">{projectTasks.length} 件</span>
                        {projectTasks.filter(t => t.ステータス !== "完了").length > 0 && (
                          <span className="text-xs text-red-400">
                            ({projectTasks.filter(t => t.ステータス !== "完了").length} 未完了)
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => setTaskModal({ ...EMPTY_TASK(), プロジェクト名: selectedLogProject })}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors cursor-pointer border border-gray-700"
                      >
                        ＋ タスクを追加
                      </button>
                    </div>

                    {projectTasks.length > 0 ? (
                      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                        <div className="divide-y divide-gray-800">
                          {projectTasks
                            .sort((a, b) => {
                              const ord = ["未着手","進行中","レビュー中","保留","完了"];
                              return ord.indexOf(a.ステータス) - ord.indexOf(b.ステータス);
                            })
                            .map(t => {
                              const overdue = t.期日 && t.期日 < today && t.ステータス !== "完了";
                              return (
                                <div key={t.id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-800/40 group transition-colors">
                                  <div className="pt-0.5 flex-shrink-0"><Badge status={t.ステータス} /></div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium ${t.ステータス === "完了" ? "line-through text-gray-500" : "text-white"}`}>
                                      {t.タスク名}
                                    </p>
                                    {t.次のアクション && (
                                      <p className="text-xs text-gray-500 mt-0.5 truncate">→ {t.次のアクション}</p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 flex-shrink-0">
                                    {t.期日 && (
                                      <span className={`text-xs ${overdue ? "text-red-400 font-medium" : "text-gray-500"}`}>
                                        {t.期日}{overdue && " ⚠"}
                                      </span>
                                    )}
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button onClick={() => setTaskModal({ ...t })}
                                        className="text-xs text-gray-500 hover:text-white cursor-pointer">編集</button>
                                      <button onClick={() => deleteTask(t.id)}
                                        className="text-xs text-gray-600 hover:text-red-400 cursor-pointer">削除</button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    ) : (
                      <p className="text-center py-10 text-gray-600 text-sm bg-gray-900 rounded-xl border border-gray-800">
                        タスクがありません
                      </p>
                    )}
                  </section>
                </div>
              );
            })()}
          </div>
        )}
      </main>
    </div>
  );
}
