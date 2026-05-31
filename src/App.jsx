import { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const CATEGORIES = ["議事録", "稟議・資料", "Amazon運用", "LP制作", "Shopify", "社内調整", "撮影", "その他"];
const INITIAL_PROJECTS_LIST = ["社内EC", "マテリアル", "Angle 3D", "グラビングシューズ", "BMZ全般", "その他"];
const STEPS = ["企画", "制作中", "レビュー", "完了"];
const COLORS = ["#00C9A7", "#845EC2", "#FF6B6B", "#FFC75F", "#4D8AF0", "#F9A8D4", "#94A3B8", "#FB923C"];

const initialTasks = [
  { id: 1, name: "キックオフMTG議事録", project: "グラビングシューズ", category: "議事録", minutes: 60, status: "完了", date: "2026-05-28" },
  { id: 2, name: "マテリアル稟議書v9", project: "マテリアル", category: "稟議・資料", minutes: 120, status: "完了", date: "2026-05-27" },
  { id: 3, name: "Amazon週次レポート", project: "社内EC", category: "Amazon運用", minutes: 90, status: "完了", date: "2026-05-29" },
  { id: 4, name: "GAIA-MAX LP企画書", project: "Angle 3D", category: "LP制作", minutes: 180, status: "未完了", date: "2026-05-30" },
  { id: 5, name: "アシトレ切替案内作成", project: "社内EC", category: "稟議・資料", minutes: 45, status: "完了", date: "2026-05-29" },
  { id: 6, name: "Shopifyテスト商品ページ", project: "Angle 3D", category: "Shopify", minutes: 60, status: "未完了", date: "2026-05-31" },
];

const initialProjects = [
  { id: 1, name: "社内EC", step: 2, mtgNotes: ["2026-05-20: アシトレ移行方針決定"], nextActions: ["在庫データ移行確認", "カートページUI調整"] },
  { id: 2, name: "マテリアル", step: 3, mtgNotes: ["2026-05-27: 稟議v9承認待ち"], nextActions: ["承認後に発注手続き"] },
  { id: 3, name: "Angle 3D", step: 1, mtgNotes: [], nextActions: ["GAIA-MAX LP企画書完成", "Shopifyページ公開"] },
  { id: 4, name: "グラビングシューズ", step: 1, mtgNotes: ["2026-05-28: キックオフ実施"], nextActions: ["競合調査", "ターゲット設定"] },
];

function KpiCard({ label, value, sub, color }) {
  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 flex flex-col gap-1">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className={`text-3xl font-bold ${color ?? "text-white"}`}>{value}</span>
      {sub && <span className="text-gray-500 text-xs">{sub}</span>}
    </div>
  );
}

function StepBar({ step, projectId, onChange }) {
  return (
    <div className="flex gap-1 flex-wrap">
      {STEPS.map((s, i) => (
        <button
          key={s}
          onClick={() => onChange(projectId, i)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
            i <= step ? "bg-teal-500 text-white" : "bg-gray-800 text-gray-500 hover:bg-gray-700"
          }`}
        >
          {s}
        </button>
      ))}
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white shadow-xl">
      <p className="font-medium mb-1 text-gray-200">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: {p.value}{p.unit ?? ""}
        </p>
      ))}
    </div>
  );
}

const inputCls = "bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-teal-500 transition-colors w-full";
const labelCls = "text-gray-400 text-xs mb-1 block";

export default function App() {
  const [tasks, setTasks] = useState(initialTasks);
  const [projects, setProjects] = useState(initialProjects);
  const [projectNames, setProjectNames] = useState(INITIAL_PROJECTS_LIST);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [form, setForm] = useState({
    name: "", project: INITIAL_PROJECTS_LIST[0], category: CATEGORIES[0],
    minutes: 30, status: "未完了", date: new Date().toISOString().slice(0, 10),
  });
  const [mtgInputs, setMtgInputs] = useState({});
  const [actionInputs, setActionInputs] = useState({});
  const [newProjectName, setNewProjectName] = useState("");
  const [showAddProject, setShowAddProject] = useState(false);
  const [gasUrl, setGasUrl] = useState(() => localStorage.getItem("gasUrl") ?? "");
  const [gasUrlDraft, setGasUrlDraft] = useState(() => localStorage.getItem("gasUrl") ?? "");
  const [syncStatus, setSyncStatus] = useState("idle"); // idle | saving | loading | success | error
  const [showSettings, setShowSettings] = useState(false);

  const projectHours = useMemo(() => {
    const map = {};
    tasks.forEach(t => { map[t.project] = (map[t.project] ?? 0) + t.minutes; });
    return Object.entries(map).map(([name, mins]) => ({ name, hours: +(mins / 60).toFixed(1) }));
  }, [tasks]);

  const categoryData = useMemo(() => {
    const map = {};
    tasks.forEach(t => { map[t.category] = (map[t.category] ?? 0) + t.minutes; });
    return Object.entries(map).map(([name, mins]) => ({ name, value: mins }));
  }, [tasks]);

  const kpi = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === "完了").length;
    const totalMins = tasks.reduce((s, t) => s + t.minutes, 0);
    return {
      total, completed,
      incomplete: total - completed,
      totalHours: (totalMins / 60).toFixed(1),
      rate: total ? Math.round((completed / total) * 100) : 0,
    };
  }, [tasks]);

  const incompleteTasks = useMemo(() => tasks.filter(t => t.status === "未完了"), [tasks]);

  const addTask = () => {
    if (!form.name.trim()) return;
    setTasks(prev => [...prev, { ...form, id: Date.now(), minutes: Number(form.minutes) }]);
    setForm(f => ({ ...f, name: "", minutes: 30 }));
  };

  const toggleStatus = id =>
    setTasks(prev => prev.map(t =>
      t.id === id ? { ...t, status: t.status === "完了" ? "未完了" : "完了" } : t
    ));

  const updateStep = (id, step) =>
    setProjects(prev => prev.map(p => p.id === id ? { ...p, step } : p));

  const addMtg = id => {
    const note = mtgInputs[id]?.trim();
    if (!note) return;
    setProjects(prev => prev.map(p => p.id === id ? { ...p, mtgNotes: [...p.mtgNotes, note] } : p));
    setMtgInputs(prev => ({ ...prev, [id]: "" }));
  };

  const addAction = id => {
    const action = actionInputs[id]?.trim();
    if (!action) return;
    setProjects(prev => prev.map(p => p.id === id ? { ...p, nextActions: [...p.nextActions, action] } : p));
    setActionInputs(prev => ({ ...prev, [id]: "" }));
  };

  const removeAction = (pid, idx) =>
    setProjects(prev => prev.map(p =>
      p.id === pid ? { ...p, nextActions: p.nextActions.filter((_, i) => i !== idx) } : p
    ));

  const addProject = () => {
    const name = newProjectName.trim();
    if (!name || projectNames.includes(name)) return;
    const newId = Date.now();
    setProjects(prev => [...prev, { id: newId, name, step: 0, mtgNotes: [], nextActions: [] }]);
    setProjectNames(prev => {
      const withoutOther = prev.filter(p => p !== "その他");
      return [...withoutOther, name, "その他"];
    });
    setNewProjectName("");
    setShowAddProject(false);
  };

  const removeProject = id => {
    setProjects(prev => prev.filter(p => p.id !== id));
    setProjectNames(prev => {
      const name = projects.find(p => p.id === id)?.name;
      return name ? prev.filter(p => p !== name) : prev;
    });
  };

  const flash = status => {
    setSyncStatus(status);
    setTimeout(() => setSyncStatus("idle"), 2500);
  };

  const saveToSheet = async () => {
    if (!gasUrl) { setShowSettings(true); return; }
    setSyncStatus("saving");
    try {
      await fetch(gasUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ tasks, projects }),
      });
      flash("success");
    } catch (_) {
      flash("error");
    }
  };

  const loadFromSheet = async () => {
    if (!gasUrl) { setShowSettings(true); return; }
    setSyncStatus("loading");
    try {
      const res = await fetch(`${gasUrl}?t=${Date.now()}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (data.tasks?.length)    setTasks(data.tasks);
      if (data.projects?.length) {
        setProjects(data.projects);
        setProjectNames(prev => {
          const existing = new Set(prev);
          const fresh = data.projects.map(p => p.name).filter(n => !existing.has(n));
          if (!fresh.length) return prev;
          const base = prev.filter(p => p !== "その他");
          return [...base, ...fresh, "その他"];
        });
      }
      flash("success");
    } catch (_) {
      flash("error");
    }
  };

  const saveGasUrl = () => {
    localStorage.setItem("gasUrl", gasUrlDraft);
    setGasUrl(gasUrlDraft);
    setShowSettings(false);
  };

  const tabs = [
    { id: "dashboard",  label: "ダッシュボード" },
    { id: "input",      label: "タスク入力" },
    { id: "projects",   label: "案件進捗" },
    { id: "incomplete", label: `未完了 (${incompleteTasks.length})` },
  ];

  const today = new Date().toLocaleDateString("ja-JP", {
    year: "numeric", month: "long", day: "numeric", weekday: "short",
  });

  const syncLabel = { idle: null, saving: "保存中…", loading: "読込中…", success: "✓ 完了", error: "エラー" }[syncStatus];
  const syncColor = { idle: "", saving: "text-yellow-400", loading: "text-blue-400", success: "text-teal-400", error: "text-red-400" }[syncStatus];

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Settings modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowSettings(false)}>
          <div className="bg-gray-900 rounded-xl border border-gray-700 p-6 w-full max-w-lg mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-semibold text-white mb-1">GAS 連携設定</h2>
            <p className="text-gray-500 text-xs mb-4">Google Apps Script の Web アプリ URL を入力してください</p>
            <label className={labelCls}>Web アプリ URL</label>
            <input
              className={`${inputCls} mb-4`}
              placeholder="https://script.google.com/macros/s/.../exec"
              value={gasUrlDraft}
              onChange={e => setGasUrlDraft(e.target.value)}
              onKeyDown={e => e.key === "Enter" && saveGasUrl()}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowSettings(false)} className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer">
                キャンセル
              </button>
              <button onClick={saveGasUrl} className="bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer">
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">BMZ 営業部1課</h1>
            <p className="text-gray-500 text-xs mt-0.5">業務管理ダッシュボード</p>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            {syncLabel && <span className={`text-xs font-medium ${syncColor}`}>{syncLabel}</span>}
            <button
              onClick={loadFromSheet}
              disabled={syncStatus !== "idle"}
              title="スプレッドシートから読込"
              className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-gray-300 text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              読込
            </button>
            <button
              onClick={saveToSheet}
              disabled={syncStatus !== "idle"}
              title="スプレッドシートへ保存"
              className="flex items-center gap-1.5 bg-teal-700 hover:bg-teal-600 disabled:opacity-40 text-white text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
              保存
            </button>
            <button
              onClick={() => { setGasUrlDraft(gasUrl); setShowSettings(true); }}
              title="GAS 設定"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${gasUrl ? "text-gray-500 hover:text-gray-300" : "text-yellow-500 hover:text-yellow-400"}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>
          </div>
          <span className="text-gray-500 text-sm hidden md:block">{today}</span>
        </div>
      </header>

      {/* Tab nav */}
      <nav className="bg-gray-900 border-b border-gray-800 px-6">
        <div className="max-w-6xl mx-auto flex gap-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                activeTab === t.id
                  ? "border-teal-500 text-teal-400"
                  : "border-transparent text-gray-400 hover:text-gray-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">

        {/* ── DASHBOARD ── */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KpiCard label="総工数"       value={`${kpi.totalHours}h`} sub="累計"        color="text-teal-400" />
              <KpiCard label="完了タスク"   value={kpi.completed}        sub={`全${kpi.total}件`} color="text-green-400" />
              <KpiCard label="未完了タスク" value={kpi.incomplete}       sub="要対応"      color="text-red-400" />
              <KpiCard label="完了率"       value={`${kpi.rate}%`}       sub="達成状況"    color="text-yellow-400" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                <h2 className="text-sm font-semibold text-gray-300 mb-4">案件別工数（時間）</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={projectHours} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="hours" name="工数" unit="h" radius={[4, 4, 0, 0]}>
                      {projectHours.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                <h2 className="text-sm font-semibold text-gray-300 mb-4">カテゴリ別工数分布</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                      {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Legend formatter={v => <span style={{ color: "#9ca3af", fontSize: 11 }}>{v}</span>} iconSize={8} />
                    <Tooltip
                      formatter={v => [`${(v / 60).toFixed(1)}h`, "工数"]}
                      contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: 8, color: "#fff" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-800">
                <h2 className="text-sm font-semibold text-gray-300">最近のタスク</h2>
              </div>
              <div className="divide-y divide-gray-800">
                {tasks.slice(-6).reverse().map(t => (
                  <div key={t.id} className="flex items-center gap-4 px-5 py-3">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${t.status === "完了" ? "bg-teal-500" : "bg-red-500"}`} />
                    <span className="text-sm flex-1 text-gray-200">{t.name}</span>
                    <span className="text-xs text-gray-500 w-28 hidden md:block">{t.project}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 hidden lg:block">{t.category}</span>
                    <span className="text-xs text-gray-500 w-12 text-right">{(t.minutes / 60).toFixed(1)}h</span>
                    <span className="text-xs text-gray-600 w-24 text-right hidden md:block">{t.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TASK INPUT ── */}
        {activeTab === "input" && (
          <div className="max-w-2xl space-y-6">
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h2 className="text-base font-semibold text-white mb-5">新規タスク登録</h2>
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>タスク名 *</label>
                  <input
                    className={inputCls}
                    placeholder="例：GAIA-MAX LP企画書作成"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    onKeyDown={e => e.key === "Enter" && addTask()}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>案件</label>
                    <select className={inputCls} value={form.project} onChange={e => setForm(f => ({ ...f, project: e.target.value }))}>
                      {projectNames.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>カテゴリ</label>
                    <select className={inputCls} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}>所要時間（分）</label>
                    <input type="number" min={1} className={inputCls} value={form.minutes}
                      onChange={e => setForm(f => ({ ...f, minutes: e.target.value }))} />
                  </div>
                  <div>
                    <label className={labelCls}>ステータス</label>
                    <select className={inputCls} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                      <option>未完了</option>
                      <option>完了</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>日付</label>
                    <input type="date" className={inputCls} value={form.date}
                      onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                  </div>
                </div>
                <button
                  onClick={addTask}
                  className="w-full bg-teal-600 hover:bg-teal-500 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm cursor-pointer"
                >
                  タスクを追加
                </button>
              </div>
            </div>

            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-300">全タスク一覧</h2>
                <span className="text-xs text-gray-500">{tasks.length}件</span>
              </div>
              <div className="divide-y divide-gray-800 max-h-96 overflow-y-auto">
                {tasks.slice().reverse().map(t => (
                  <div key={t.id} className="flex items-center gap-3 px-5 py-3">
                    <button
                      onClick={() => toggleStatus(t.id)}
                      className={`w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors cursor-pointer ${
                        t.status === "完了" ? "bg-teal-500 border-teal-500" : "border-gray-600 hover:border-teal-500"
                      }`}
                    >
                      {t.status === "完了" && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <span className={`text-sm flex-1 ${t.status === "完了" ? "line-through text-gray-500" : "text-gray-200"}`}>
                      {t.name}
                    </span>
                    <span className="text-xs text-gray-500 hidden md:block w-28">{t.project}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 hidden lg:block">{t.category}</span>
                    <span className="text-xs text-gray-500 w-12 text-right">{t.minutes}分</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── PROJECTS ── */}
        {activeTab === "projects" && (
          <div className="space-y-4">

            {/* 新規案件追加 */}
            <div className="flex items-center justify-between">
              <p className="text-gray-400 text-sm">{projects.length}件の案件</p>
              <button
                onClick={() => setShowAddProject(v => !v)}
                className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
              >
                <span className="text-lg leading-none">＋</span> 新規案件を追加
              </button>
            </div>

            {showAddProject && (
              <div className="bg-gray-900 border border-teal-700 rounded-xl p-5 flex gap-3 items-end">
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
                <button
                  onClick={addProject}
                  className="bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                >
                  追加
                </button>
                <button
                  onClick={() => { setShowAddProject(false); setNewProjectName(""); }}
                  className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer"
                >
                  キャンセル
                </button>
              </div>
            )}

            {projects.map(proj => (
              <div key={proj.id} className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-semibold text-white">{proj.name}</h3>
                    <button
                      onClick={() => removeProject(proj.id)}
                      className="text-gray-600 hover:text-red-400 text-xs transition-colors cursor-pointer"
                      title="案件を削除"
                    >
                      ✕
                    </button>
                  </div>
                  <StepBar step={proj.step} projectId={proj.id} onChange={updateStep} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">MTG記録</h4>
                    <ul className="space-y-1 mb-3 min-h-10">
                      {proj.mtgNotes.length === 0 && <li className="text-gray-600 text-xs">記録なし</li>}
                      {proj.mtgNotes.map((note, i) => (
                        <li key={i} className="text-xs text-gray-300 flex gap-2">
                          <span className="text-teal-500 flex-shrink-0">•</span>{note}
                        </li>
                      ))}
                    </ul>
                    <div className="flex gap-2">
                      <input
                        className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-teal-500 flex-1"
                        placeholder="MTG記録を追加..."
                        value={mtgInputs[proj.id] ?? ""}
                        onChange={e => setMtgInputs(prev => ({ ...prev, [proj.id]: e.target.value }))}
                        onKeyDown={e => e.key === "Enter" && addMtg(proj.id)}
                      />
                      <button onClick={() => addMtg(proj.id)} className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer">追加</button>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">ネクストアクション</h4>
                    <ul className="space-y-1.5 mb-3 min-h-10">
                      {proj.nextActions.length === 0 && <li className="text-gray-600 text-xs">アクションなし</li>}
                      {proj.nextActions.map((action, i) => (
                        <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                          <span className="text-yellow-500 flex-shrink-0 mt-0.5">→</span>
                          <span className="flex-1">{action}</span>
                          <button onClick={() => removeAction(proj.id, i)} className="text-gray-600 hover:text-red-400 transition-colors flex-shrink-0 cursor-pointer">✕</button>
                        </li>
                      ))}
                    </ul>
                    <div className="flex gap-2">
                      <input
                        className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-teal-500 flex-1"
                        placeholder="ネクストアクションを追加..."
                        value={actionInputs[proj.id] ?? ""}
                        onChange={e => setActionInputs(prev => ({ ...prev, [proj.id]: e.target.value }))}
                        onKeyDown={e => e.key === "Enter" && addAction(proj.id)}
                      />
                      <button onClick={() => addAction(proj.id)} className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer">追加</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── INCOMPLETE ── */}
        {activeTab === "incomplete" && (
          <div>
            {incompleteTasks.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <p className="text-5xl mb-4">✓</p>
                <p className="text-sm">未完了タスクはありません</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-gray-400 text-sm mb-4">
                  <span className="text-red-400 font-semibold">{incompleteTasks.length}件</span>の未完了タスクがあります
                </p>
                {incompleteTasks.map(t => (
                  <div key={t.id} className="bg-gray-900 rounded-xl border border-gray-800 px-5 py-4 flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{t.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{t.project} / {t.category} / {t.date}</p>
                    </div>
                    <span className="text-sm text-gray-400 flex-shrink-0">{t.minutes}分</span>
                    <button
                      onClick={() => toggleStatus(t.id)}
                      className="bg-teal-700 hover:bg-teal-600 text-white text-xs px-3 py-1.5 rounded-lg transition-colors flex-shrink-0 cursor-pointer"
                    >
                      完了にする
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
