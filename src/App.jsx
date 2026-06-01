import { useState, useMemo, useEffect } from "react";
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
const COLORS     = ["#58CC02", "#1CB0F6", "#FF9600", "#FFD900", "#845EC2", "#FF4B4B", "#94A3B8", "#34D399"];
const PROJECT_PALETTE = ["#58CC02", "#1CB0F6", "#FF9600", "#FFD900", "#845EC2", "#FF4B4B", "#94A3B8", "#34D399"];

const PHOTO_STATUSES = ["依頼中", "撮影済", "納品済", "完了"];
const EC_STATUSES    = ["受付", "対応中", "完了"];
const PHOTO_TYPES    = ["商品単体", "着用カット", "動画", "ライフスタイル", "パッケージ", "その他"];
const EC_TYPES       = ["商品登録", "在庫更新", "価格変更", "画像差替", "ページ作成", "キャンペーン設定", "その他"];
const EC_SITES       = ["Amazon", "楽天", "Yahoo!", "自社EC", "Shopify", "その他"];

const STATUS_CLS = {
  "未着手":     "bg-gray-100 text-gray-500",
  "進行中":     "bg-[#E8F4FF] text-[#1CB0F6]",
  "レビュー中": "bg-[#FFFBE6] text-yellow-600",
  "完了":       "bg-[#E8F8D8] text-[#58CC02]",
  "保留":       "bg-[#FFEDED] text-[#FF4B4B]",
};
const STATUS_DOT = {
  "未着手":     "bg-gray-300",
  "進行中":     "bg-[#1CB0F6]",
  "レビュー中": "bg-yellow-400",
  "完了":       "bg-[#58CC02]",
  "保留":       "bg-[#FF4B4B]",
};
const STATUS_PIE_COLOR = ["#94A3B8", "#1CB0F6", "#FFD900", "#58CC02", "#FF4B4B"];

const PHOTO_STATUS_CLS = {
  "依頼中": "bg-orange-100 text-orange-600 border-orange-200",
  "撮影済": "bg-blue-100 text-[#1CB0F6] border-blue-200",
  "納品済": "bg-purple-100 text-purple-600 border-purple-200",
  "完了":   "bg-gray-100 text-gray-400 border-gray-200",
};
const EC_STATUS_CLS = {
  "受付":   "bg-gray-100 text-gray-500 border-gray-200",
  "対応中": "bg-[#E8F4FF] text-[#1CB0F6] border-blue-200",
  "完了":   "bg-gray-100 text-gray-400 border-gray-200",
};

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

const EMPTY_PHOTO = () => ({
  id: Date.now(),
  受付日: new Date().toISOString().slice(0, 10),
  タスク名: "", プロジェクト: "", 撮影種別: PHOTO_TYPES[0],
  撮影点数: "", 希望撮影日: "", 納品希望日: "", 撮影メモ: "",
  ステータス: "依頼中",
});
const EMPTY_EC = () => ({
  id: Date.now(),
  受付日: new Date().toISOString().slice(0, 10),
  種別: EC_TYPES[0], 依頼者: "", 依頼内容: "", 対象サイト: EC_SITES[0],
  期日: "", ステータス: "受付", 完了日: "", 備考: "",
});

// ── Initial data ──────────────────────────────────────────────────────────────
const initialTasks = [];

const initialLogs = [
  { id: 1, 日付: "2026-05-29", プロジェクト名: "メディアエンジン施策", フェーズ: "社内決定共有", 進捗内容: "KV・販売方針の決定事項をメディアエンジンに正式共有（田波対応）", 関係者: "田波、兵藤", 次のマイルストーン: "KV・ロゴ制作・撮影調整" },
  { id: 2, 日付: "2026-05-28", プロジェクト名: "メディアエンジン施策", フェーズ: "KV決定", 進捗内容: "KVをA案「カラダをつくる靴」に決定。AirとRootsはクラファンで販売。スポルテックは試し履き会場として活用", 関係者: "田波、兵藤", 次のマイルストーン: "クリエイティブ制作・撮影段取り" },
  { id: 3, 日付: "2026-05-28", プロジェクト名: "グラビングシューズ", フェーズ: "企画", 進捗内容: "キックオフMTG実施。ターゲット・競合調査方針決定", 関係者: "田中・佐藤", 次のマイルストーン: "競合調査完了（6/5）" },
  { id: 4, 日付: "2026-05-27", プロジェクト名: "Angle 3D", フェーズ: "制作", 進捗内容: "GAIA-MAX LP構成案作成開始", 関係者: "山田", 次のマイルストーン: "LP企画書提出（6/5）" },
  { id: 6, 日付: "2026-05-22", プロジェクト名: "メディアエンジン施策", フェーズ: "すり合わせ", 進捗内容: "KVアンケート結果共有（A案「カラダをつくる靴」が全指標トップ）。重点施策・スケジュール・見積もり提示", 関係者: "坂庭、兵藤", 次のマイルストーン: "5/28 MTG" },
  { id: 7, 日付: "2026-05-14", プロジェクト名: "メディアエンジン施策", フェーズ: "提案", 進捗内容: "ソウルドアウトグループによるブランド戦略提案（BMZみなかみ来社5名）。KPI52,000足・予算2,500万〜1.9億円の2プラン提示", 関係者: "山中、高橋、深澤、坂庭、田波、兵藤", 次のマイルストーン: "KV・施策すり合わせMTG" },
  { id: 8, 日付: "2026-05-08", プロジェクト名: "メディアエンジン施策", フェーズ: "調整", 進捗内容: "ロゴ提案スコープ確認。グラビングシリーズロゴはMEが提案（5月末目途）。化粧箱は中長期課題に", 関係者: "田波、兵藤", 次のマイルストーン: "5/14提案MTG" },
  { id: 9, 日付: "2026-04-27", プロジェクト名: "メディアエンジン施策", フェーズ: "クリエイティブ深掘り", 進捗内容: "深澤同席・コンセプト深掘りMTG。契約書やりとり開始", 関係者: "坂庭、深澤、兵藤", 次のマイルストーン: "提案MTG日程調整" },
  { id: 10, 日付: "2026-04-22", プロジェクト名: "メディアエンジン施策", フェーズ: "ヒアリング", 進捗内容: "商品・ブランド深掘りMTG。NDAドラフト送付・BMZ側修正対応", 関係者: "坂庭、兵藤", 次のマイルストーン: "クリエイティブ深掘りMTG" },
  { id: 11, 日付: "2026-04-16", プロジェクト名: "メディアエンジン施策", フェーズ: "キックオフ", 進捗内容: "初回MTG。商品・ブランド・スケジュール・予算の初期ヒアリング", 関係者: "田波、兵藤", 次のマイルストーン: "商品深掘りMTG" },
  { id: 12, 日付: "2026-05-29", プロジェクト名: "Angle 3D", フェーズ: "修正確認", 進捗内容: "修正6点について回答。ロゴ変更は現状維持、ピンクのみクリーム色調整、ステッチの分離修正を依頼。最終版の修正対応待ち", 関係者: "田波、Gabriele", 次のマイルストーン: "最終版確認・本番公開" },
  { id: 13, 日付: "2026-05-27", プロジェクト名: "Angle 3D", フェーズ: "修正対応", 進捗内容: "6点の修正フィードバックをWordファイルにまとめて送付。日本語表示対応の可否も確認→チュートリアルURLを受領", 関係者: "田波、Gabriele", 次のマイルストーン: "修正完了・本番反映" },
  { id: 14, 日付: "2026-05-21", プロジェクト名: "Angle 3D", フェーズ: "納品・レビュー", 進捗内容: "Gabrieleよりコンフィギュレータ納品。Loomビデオで確認。ヒールカウンターの長さ・ソールの明るさについてフィードバック送付", 関係者: "田波、Gabriele", 次のマイルストーン: "修正対応" },
  { id: 15, 日付: "2026-05-18", プロジェクト名: "Angle 3D", フェーズ: "テスト環境構築", 進捗内容: "テスト用商品ページ（下書き）を作成しAngle 3Dに共有。コンフィギュレータのテスト設置を依頼", 関係者: "田波、Gabriele", 次のマイルストーン: "コンフィギュレータ納品・レビュー" },
  { id: 16, 日付: "2026-05-13", プロジェクト名: "Angle 3D", フェーズ: "確認・承認", 進捗内容: "PREMIUMプラン加入完了。Shopifyストアへのアクセス承認。コンフィギュレータ設置先商品ページ（Full/Semi/Easy Order）を指定。シルエットのスリム化を追加依頼", 関係者: "田波、Gabriele", 次のマイルストーン: "コンフィギュレータ納品" },
  { id: 17, 日付: "2026-05-04", プロジェクト名: "Angle 3D", フェーズ: "3Dモデル制作", 進捗内容: "Gabrieleより3Dモデルの制作進捗共有（作業中画像）。1足表示か2足表示かの確認あり", 関係者: "Ahmet、Gabriele", 次のマイルストーン: "モデル確認・PREMIUM加入" },
  { id: 18, 日付: "2026-04-15", プロジェクト名: "Angle 3D", フェーズ: "契約・支払い", 進捗内容: "社内承認完了。Angle 3DへStripe経由で支払い完了。制作開始の連絡受領", 関係者: "Ahmet、Maël", 次のマイルストーン: "3Dモデル制作" },
  { id: 19, 日付: "2026-04-03", プロジェクト名: "Angle 3D", フェーズ: "見積もり", 進捗内容: "Angle 3DよりGAIA-MAX-PROの見積もり受領。PREMIUMプラン（$69/月）加入が必要と確認。3Dモデル制作・コンフィギュレータ構築・設置費用が対象", 関係者: "Ahmet、Maël", 次のマイルストーン: "社内承認・支払い" },
  { id: 20, 日付: "2026-05-28", プロジェクト名: "㈱マテリアル", フェーズ: "追加提案MTG", 進捗内容: "オンラインMTG実施（13:30〜14:30）。アシトレサンダルのリニューアル案件についても相談。対面提案（6/16優先）の日程候補を受領", 関係者: "田波、飯伏", 次のマイルストーン: "対面提案MTG（6/16）・社内稟議" },
  { id: 21, 日付: "2026-05-18", プロジェクト名: "㈱マテリアル", フェーズ: "再提案MTG", 進捗内容: "オンラインMTG実施。アシトレスニーカー向けの再提案内容を確認。次回日程調整へ", 関係者: "田波、飯伏、池田", 次のマイルストーン: "提案内容確認・稟議" },
  { id: 22, 日付: "2026-05-11", プロジェクト名: "㈱マテリアル", フェーズ: "ヒアリング", 進捗内容: "オンラインMTG実施（池田氏）。ブランド信念・背景を深くヒアリング。次回5/18 17:00に確定", 関係者: "田波、飯伏、池田", 次のマイルストーン: "5/18 再提案MTG" },
  { id: 23, 日付: "2026-05-08", プロジェクト名: "㈱マテリアル", フェーズ: "方針変更", 進捗内容: "社内稟議中に方針変更。主軸商品をアシトレサンダルからアシトレスニーカーに変更。マテリアルに提案資料の再作成を依頼。支払い条件（N+2月末払い）を確認", 関係者: "田波、飯伏", 次のマイルストーン: "再提案MTG" },
  { id: 24, 日付: "2026-05-01", プロジェクト名: "㈱マテリアル", フェーズ: "提案MTG", 進捗内容: "オンラインMTG実施。マテリアルより提案資料・Amazon商品画像見積もり受領。Amazonセラー権限付与URLを共有。支払い条件を確認", 関係者: "山中、田波、飯伏、池田", 次のマイルストーン: "社内稟議・次回MTG" },
  { id: 25, 日付: "2026-04-28", プロジェクト名: "㈱マテリアル", フェーズ: "担当引継ぎ", 進捗内容: "坂庭より田波に窓口・実務対応を引継ぎ。基本契約書社内確認・Amazonセラー権限確認を開始", 関係者: "田波、飯伏", 次のマイルストーン: "5/1 MTG" },
  { id: 26, 日付: "2026-04-27", プロジェクト名: "㈱マテリアル", フェーズ: "契約準備", 進捗内容: "NDA締結完了。基本契約書雛形を受領。Amazonセラー権限付与の依頼あり（飯伏氏メアド）。5/1オンラインMTGのURL受領", 関係者: "坂庭、飯伏", 次のマイルストーン: "5/1 MTG・Amazonセラー権限付与" },
  { id: 27, 日付: "2026-04-16", プロジェクト名: "㈱マテリアル", フェーズ: "キックオフ", 進捗内容: "マテリアル飯伏氏がBMZみなかみに来社。初回対面MTG。NDA雛形を受領", 関係者: "山中、高橋、深澤、坂庭、飯伏", 次のマイルストーン: "NDA締結・次回MTG調整" },
];

const initialProjects = ["社内EC", "㈱マテリアル", "Angle 3D", "グラビングシューズ", "BMZ全般"];

// ── Sub components ────────────────────────────────────────────────────────────
function Badge({ status }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${STATUS_CLS[status] ?? "bg-gray-100 text-gray-500"}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[status] ?? "bg-gray-300"}`} />
      {status}
    </span>
  );
}

function KpiCard({ label, value, sub, color = "text-gray-900", bg = "bg-white" }) {
  return (
    <div className={`${bg} rounded-2xl p-5 border-2 border-gray-100 shadow-sm`}>
      <p className="text-gray-500 text-xs font-bold uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-4xl font-extrabold ${color}`}>{value}</p>
      {sub && <p className="text-gray-400 text-xs mt-1 font-medium">{sub}</p>}
    </div>
  );
}

function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border-2 border-gray-200 rounded-2xl px-4 py-3 text-xs text-gray-800 shadow-lg">
      <p className="font-bold mb-1">{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.fill ?? p.color }} className="font-semibold">{p.name}: {p.value}</p>)}
    </div>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <button type="button" onClick={() => onChange(!value)}
        className={`w-10 h-6 rounded-full relative transition-colors flex-shrink-0 border-2 ${value ? "bg-[#58CC02] border-[#46a302]" : "bg-gray-100 border-gray-200"}`}>
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${value ? "translate-x-4" : ""}`} />
      </button>
      <span className="text-xs font-semibold text-gray-600">{label}</span>
    </label>
  );
}

// ── Task Modal ────────────────────────────────────────────────────────────────
function TaskModal({ task, projects, onSave, onClose }) {
  const [f, setF] = useState({ ...task });
  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }));
  const sec = "text-xs font-extrabold text-[#58CC02] uppercase tracking-wider mb-3";

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start justify-center z-50 overflow-y-auto py-8" onClick={onClose}>
      <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-2xl w-full max-w-2xl mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b-2 border-gray-100">
          <h2 className="text-lg font-extrabold text-gray-900">{task.タスク名 ? "タスク編集" : "タスク追加"}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 cursor-pointer text-sm font-bold transition-colors">✕</button>
        </div>

        <div className="p-6 space-y-6">
          <section>
            <h3 className={sec}>基本情報</h3>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-gray-500 text-xs font-bold uppercase tracking-wide mb-1 block">ID</label>
                <input className="duo-input" value={f.id} onChange={e => set("id", e.target.value)} placeholder="T001" /></div>
              <div><label className="text-gray-500 text-xs font-bold uppercase tracking-wide mb-1 block">起案日</label>
                <input type="date" className="duo-input" value={f.起案日} onChange={e => set("起案日", e.target.value)} /></div>
              <div className="col-span-2"><label className="text-gray-500 text-xs font-bold uppercase tracking-wide mb-1 block">タスク名 *</label>
                <input className="duo-input" value={f.タスク名} onChange={e => set("タスク名", e.target.value)} placeholder="タスク名を入力" /></div>
              <div><label className="text-gray-500 text-xs font-bold uppercase tracking-wide mb-1 block">タスク種別</label>
                <select className="duo-input" value={f.タスク種別} onChange={e => set("タスク種別", e.target.value)}>
                  {TASK_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
              <div><label className="text-gray-500 text-xs font-bold uppercase tracking-wide mb-1 block">カテゴリ</label>
                <select className="duo-input" value={f.カテゴリ} onChange={e => set("カテゴリ", e.target.value)}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
              <div className="col-span-2"><label className="text-gray-500 text-xs font-bold uppercase tracking-wide mb-1 block">プロジェクト名</label>
                <select className="duo-input" value={f.プロジェクト名} onChange={e => set("プロジェクト名", e.target.value)}>
                  <option value="">-- 選択 --</option>
                  {projects.map(p => <option key={p}>{p}</option>)}</select></div>
            </div>
          </section>

          <section>
            <h3 className={sec}>体制・規模</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className="text-gray-500 text-xs font-bold uppercase tracking-wide mb-1 block">関係者</label>
                <input className="duo-input" value={f.関係者} onChange={e => set("関係者", e.target.value)} placeholder="田中・佐藤" /></div>
              <div><label className="text-gray-500 text-xs font-bold uppercase tracking-wide mb-1 block">規模</label>
                <select className="duo-input" value={f.規模} onChange={e => set("規模", e.target.value)}>
                  {SCALES.map(s => <option key={s}>{s}</option>)}</select></div>
              <div className="flex items-end pb-2">
                <Toggle label="役員関与" value={f.役員関与} onChange={v => set("役員関与", v)} /></div>
            </div>
          </section>

          <section>
            <h3 className={sec}>スケジュール</h3>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-gray-500 text-xs font-bold uppercase tracking-wide mb-1 block">ステータス</label>
                <select className="duo-input" value={f.ステータス} onChange={e => set("ステータス", e.target.value)}>
                  {STATUSES.map(s => <option key={s}>{s}</option>)}</select></div>
              <div><label className="text-gray-500 text-xs font-bold uppercase tracking-wide mb-1 block">期日</label>
                <input type="date" className="duo-input" value={f.期日} onChange={e => set("期日", e.target.value)} /></div>
              <div><label className="text-gray-500 text-xs font-bold uppercase tracking-wide mb-1 block">完了日</label>
                <input type="date" className="duo-input" value={f.完了日} onChange={e => set("完了日", e.target.value)} /></div>
            </div>
          </section>

          <section>
            <h3 className={sec}>アクション・メモ</h3>
            <div className="space-y-3">
              <div><label className="text-gray-500 text-xs font-bold uppercase tracking-wide mb-1 block">次のアクション</label>
                <input className="duo-input" value={f.次のアクション} onChange={e => set("次のアクション", e.target.value)} placeholder="次に何をするか" /></div>
              <div><label className="text-gray-500 text-xs font-bold uppercase tracking-wide mb-1 block">進捗メモ</label>
                <textarea className="duo-input resize-none" rows={2} value={f.進捗メモ}
                  onChange={e => set("進捗メモ", e.target.value)} placeholder="進捗の補足メモ" /></div>
            </div>
          </section>

          <section>
            <h3 className={sec}>フラグ・依頼</h3>
            <div className="grid grid-cols-3 gap-4 mb-3">
              <Toggle label="EC依頼"       value={f.EC依頼}       onChange={v => set("EC依頼", v)} />
              <Toggle label="進捗ログ登録" value={f.進捗ログ登録} onChange={v => set("進捗ログ登録", v)} />
              <Toggle label="撮影依頼"     value={f.撮影依頼}     onChange={v => set("撮影依頼", v)} />
            </div>
            {f.撮影依頼 && (
              <div><label className="text-gray-500 text-xs font-bold uppercase tracking-wide mb-1 block">撮影メモ</label>
                <input className="duo-input" value={f.撮影メモ} onChange={e => set("撮影メモ", e.target.value)} placeholder="撮影内容・本数など" /></div>
            )}
          </section>
        </div>

        <div className="px-6 py-5 border-t-2 border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="duo-btn duo-btn-gray px-5 py-2.5 rounded-2xl text-sm font-bold">キャンセル</button>
          <button onClick={() => { if (f.タスク名.trim()) onSave(f); }}
            className="duo-btn duo-btn-green px-6 py-2.5 rounded-2xl text-sm font-bold">保存</button>
        </div>
      </div>
    </div>
  );
}

// ── localStorage helpers ──────────────────────────────────────────────────────
function load(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// ── Shared styles ─────────────────────────────────────────────────────────────
const inputCls = "duo-input";
const labelCls = "text-gray-500 text-xs font-bold uppercase tracking-wide mb-1 block";

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [tasks,    setTasks]    = useState(() => load("bmz_tasks_v2", initialTasks));
  const [logs,     setLogs]     = useState(() => load("bmz_logs_v2",     initialLogs));
  const [projects, setProjects] = useState(() => load("bmz_projects_v2", initialProjects));
  const [activeTab, setActiveTab] = useState("dashboard");

  const [gasUrl,      setGasUrl]      = useState(() => localStorage.getItem("gasUrl") ?? "");
  const [gasUrlDraft, setGasUrlDraft] = useState(() => localStorage.getItem("gasUrl") ?? "");
  const [syncStatus,  setSyncStatus]  = useState("idle");
  const [showSettings, setShowSettings] = useState(false);

  const [filterProject, setFilterProject] = useState("");
  const [filterStatus,  setFilterStatus]  = useState("");
  const [filterText,    setFilterText]    = useState("");

  const [selectedLogProject, setSelectedLogProject] = useState(null);
  const [showAddProject,  setShowAddProject]  = useState(false);
  const [newProjectName,  setNewProjectName]  = useState("");

  const [photoRequests, setPhotoRequests] = useState(() => load("bmz_photo", []));
  const [ecRequests,    setEcRequests]    = useState(() => load("bmz_ec",    []));
  const [showPhotoForm, setShowPhotoForm] = useState(false);
  const [showEcForm,    setShowEcForm]    = useState(false);
  const [photoForm,     setPhotoForm]     = useState(EMPTY_PHOTO());
  const [ecForm,        setEcForm]        = useState(EMPTY_EC());
  const [showPhotoCompleted, setShowPhotoCompleted] = useState(false);
  const [showEcCompleted,    setShowEcCompleted]    = useState(false);

  const [taskModal,   setTaskModal]   = useState(null);
  const [showLogForm, setShowLogForm] = useState(false);
  const [logForm,     setLogForm]     = useState(EMPTY_LOG());

  // ── localStorage 自動保存 ────────────────────────────────────────────────
  useEffect(() => { save("bmz_tasks_v2", tasks);        }, [tasks]);
  useEffect(() => { save("bmz_logs_v2",     logs);         }, [logs]);
  useEffect(() => { save("bmz_projects_v2", projects);     }, [projects]);
  useEffect(() => { save("bmz_photo",    photoRequests);}, [photoRequests]);
  useEffect(() => { save("bmz_ec",       ecRequests);   }, [ecRequests]);

  // ── Computed ────────────────────────────────────────────────────────────
  const today = new Date().toISOString().slice(0, 10);

  const kpi = useMemo(() => {
    const total   = tasks.length;
    const active  = tasks.filter(t => ["未着手", "進行中", "レビュー中"].includes(t.ステータス)).length;
    const done    = tasks.filter(t => t.ステータス === "完了").length;
    const overdue = tasks.filter(t => t.期日 && t.期日 < today && t.ステータス !== "完了").length;
    const photo   = tasks.filter(t => t.撮影依頼 && t.ステータス !== "完了").length;
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
        if (filterStatus  && t.ステータス !== filterStatus) return false;
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

  // ── Actions ─────────────────────────────────────────────────────────────
  const saveTask = task => {
    setTasks(prev => {
      const idx = prev.findIndex(t => t.id === task.id);
      return idx >= 0 ? prev.map(t => t.id === task.id ? task : t) : [...prev, task];
    });
    setTaskModal(null);
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

  const deleteProject = name => {
    if (!confirm(`「${name}」を削除しますか？\n関連する進捗ログとタスクもすべて削除されます。`)) return;
    setProjects(prev => prev.filter(p => p !== name));
    setLogs(prev => prev.filter(l => l.プロジェクト名 !== name));
    setTasks(prev => prev.filter(t => t.プロジェクト名 !== name));
  };

  const cycleStatus = (statuses, current) =>
    statuses[(statuses.indexOf(current) + 1) % statuses.length];

  const addPhotoRequest = () => {
    if (!photoForm.タスク名.trim()) return;
    setPhotoRequests(prev => [{ ...photoForm, id: Date.now() }, ...prev]);
    setPhotoForm(EMPTY_PHOTO());
    setShowPhotoForm(false);
  };
  const cyclePhotoStatus = id =>
    setPhotoRequests(prev => prev.map(r =>
      r.id === id ? { ...r, ステータス: cycleStatus(PHOTO_STATUSES, r.ステータス) } : r
    ));
  const deletePhotoRequest = id =>
    setPhotoRequests(prev => prev.filter(r => r.id !== id));

  const addEcRequest = () => {
    if (!ecForm.依頼内容.trim()) return;
    setEcRequests(prev => [{ ...ecForm, id: Date.now() }, ...prev]);
    setEcForm(EMPTY_EC());
    setShowEcForm(false);
  };
  const cycleEcStatus = id =>
    setEcRequests(prev => prev.map(r =>
      r.id === id ? {
        ...r,
        ステータス: cycleStatus(EC_STATUSES, r.ステータス),
        完了日: cycleStatus(EC_STATUSES, r.ステータス) === "完了"
          ? new Date().toISOString().slice(0, 10) : r.完了日,
      } : r
    ));
  const deleteEcRequest = id =>
    setEcRequests(prev => prev.filter(r => r.id !== id));

  // 設定：案件リネーム
  const [editingProject, setEditingProject] = useState(null); // { old, draft }

  const renameProject = () => {
    const oldName = editingProject.old;
    const newName = editingProject.draft.trim();
    if (!newName || newName === oldName) { setEditingProject(null); return; }
    if (projects.includes(newName)) { alert("その案件名は既に存在します"); return; }
    setProjects(prev => prev.map(p => p === oldName ? newName : p));
    setTasks(prev => prev.map(t => t.プロジェクト名 === oldName ? { ...t, プロジェクト名: newName } : t));
    setLogs(prev => prev.map(l => l.プロジェクト名 === oldName ? { ...l, プロジェクト名: newName } : l));
    setEditingProject(null);
  };

  const addProject = () => {
    const name = newProjectName.trim();
    if (!name || projects.includes(name)) return;
    setProjects(prev => [...prev, name]);
    setNewProjectName("");
    setShowAddProject(false);
  };

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
  const photoActive = photoRequests.filter(r => r.ステータス !== "完了").length;
  const ecActive    = ecRequests.filter(r => r.ステータス !== "完了").length;

  const syncLabel = { saving: "保存中…", loading: "読込中…", success: "✓ 完了", error: "エラー" }[syncStatus];
  const syncColor = { saving: "text-[#FF9600]", loading: "text-[#1CB0F6]", success: "text-[#58CC02]", error: "text-[#FF4B4B]" }[syncStatus];
  const todayJP = new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "short" });

  const tabs = [
    { id: "dashboard", label: "ダッシュボード" },
    { id: "tasks",     label: `タスク一覧 (${tasks.length})` },
    { id: "logs",      label: "受持案件(進捗ログ)" },
    { id: "requests",  label: photoActive + ecActive > 0 ? `依頼管理 (${photoActive + ecActive})` : "依頼管理" },
    { id: "settings",  label: "⚙ 設定" },
  ];

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f7f7f7] text-gray-900">

      {/* Task Modal */}
      {taskModal && <TaskModal task={taskModal} projects={projects} onSave={saveTask} onClose={() => setTaskModal(null)} />}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowSettings(false)}>
          <div className="bg-white rounded-3xl border-2 border-gray-100 p-6 w-full max-w-lg mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-extrabold text-gray-900 mb-1">GAS 連携設定</h2>
            <p className="text-gray-400 text-xs mb-5 font-medium">Google Apps Script の Web アプリ URL を入力</p>
            <label className={labelCls}>Web アプリ URL</label>
            <input className="duo-input mb-5" placeholder="https://script.google.com/macros/s/.../exec"
              value={gasUrlDraft} onChange={e => setGasUrlDraft(e.target.value)}
              onKeyDown={e => e.key === "Enter" && saveGasUrl()} autoFocus />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowSettings(false)} className="duo-btn duo-btn-gray px-5 py-2.5 rounded-2xl text-sm font-bold">キャンセル</button>
              <button onClick={saveGasUrl} className="duo-btn duo-btn-green px-5 py-2.5 rounded-2xl text-sm font-bold">保存</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <header className="bg-white border-b-2 border-gray-100 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <div className="flex-shrink-0">
            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">🏃 BMZ営業部</h1>
            <p className="text-gray-400 text-xs mt-0.5 font-semibold">業務管理ダッシュボード</p>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <a
              href="https://docs.google.com/spreadsheets/d/16FgIbuPKEAC3N-ctCKfkQ4gYAw35nbYus-8BLGHAItQ"
              target="_blank"
              rel="noopener noreferrer"
              className="duo-btn duo-btn-gray flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl"
              title="スプレッドシートを開く"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
              </svg>
              スプシ
            </a>
            {syncLabel && <span className={`text-xs font-bold ${syncColor}`}>{syncLabel}</span>}
            <button onClick={loadFromSheet} disabled={syncStatus !== "idle"}
              className="duo-btn duo-btn-gray gap-1.5 text-xs px-3 py-2 rounded-xl font-bold disabled:opacity-40">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              読込
            </button>
            <button onClick={saveToSheet} disabled={syncStatus !== "idle"}
              className="duo-btn duo-btn-green gap-1.5 text-xs px-3 py-2 rounded-xl font-bold disabled:opacity-40">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
              保存
            </button>
            <button onClick={() => { setGasUrlDraft(gasUrl); setShowSettings(true); }}
              className={`duo-btn w-9 h-9 rounded-xl ${gasUrl ? "duo-btn-gray" : "duo-btn-yellow"}`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>
          </div>
          <span className="text-gray-400 text-xs font-semibold hidden lg:block flex-shrink-0">{todayJP}</span>
        </div>
      </header>

      {/* ── Tab Nav ── */}
      <nav className="bg-white border-b-2 border-gray-100 px-6">
        <div className="max-w-7xl mx-auto flex gap-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-4 py-3 text-sm font-extrabold border-b-4 transition-all cursor-pointer ${
                activeTab === t.id
                  ? "border-[#58CC02] text-[#58CC02]"
                  : "border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-200"
              }`}>{t.label}</button>
          ))}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* ════ DASHBOARD ════ */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <KpiCard label="総タスク数"     value={kpi.total}   sub="全件"              color="text-gray-900" />
              <KpiCard label="進行中"         value={kpi.active}  sub="未着手+進行+レビュー" color="text-[#1CB0F6]" />
              <KpiCard label="完了"           value={kpi.done}    sub="完了済み"           color="text-[#58CC02]" />
              <KpiCard label="期日超過"       value={kpi.overdue} sub="要対応"             color="text-[#FF4B4B]" />
              <KpiCard label="撮影依頼 未完了" value={kpi.photo}  sub="撮影案件"           color="text-[#FF9600]" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-5 border-2 border-gray-100 shadow-sm">
                <h2 className="text-sm font-extrabold text-gray-700 mb-4">案件別 未完了タスク数</h2>
                {projectChartData.length ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={projectChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <XAxis dataKey="name" tick={{ fill: "#999", fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#999", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<ChartTip />} />
                      <Bar dataKey="value" name="タスク数" radius={[8, 8, 0, 0]}>
                        {projectChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="text-gray-300 text-sm text-center py-16 font-semibold">未完了タスクなし</p>}
              </div>

              <div className="bg-white rounded-2xl p-5 border-2 border-gray-100 shadow-sm">
                <h2 className="text-sm font-extrabold text-gray-700 mb-4">ステータス分布</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={statusChartData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" nameKey="name">
                      {statusChartData.map((entry, i) => (
                        <Cell key={i} fill={STATUS_PIE_COLOR[STATUSES.indexOf(entry.name)] ?? COLORS[i]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v + "件", n]}
                      contentStyle={{ backgroundColor: "#fff", border: "2px solid #e5e5e5", borderRadius: 16, color: "#333", fontSize: 12, fontWeight: 600 }} />
                    <Legend formatter={v => <span style={{ color: "#888", fontSize: 11, fontWeight: 600 }}>{v}</span>} iconSize={8} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {kpi.overdue > 0 && (
              <div className="bg-white rounded-2xl border-2 border-[#FFEDED] overflow-hidden shadow-sm">
                <div className="px-5 py-3 border-b-2 border-[#FFEDED] flex items-center gap-2 bg-[#FFEDED]">
                  <span className="text-lg">⚠️</span>
                  <h2 className="text-sm font-extrabold text-[#FF4B4B]">期日超過タスク</h2>
                </div>
                <div className="divide-y-2 divide-[#FFEDED]">
                  {tasks.filter(t => t.期日 && t.期日 < today && t.ステータス !== "完了").map(t => (
                    <div key={t.id} className="flex items-center gap-4 px-5 py-3">
                      <Badge status={t.ステータス} />
                      <span className="text-sm flex-1 text-gray-900 font-semibold">{t.タスク名}</span>
                      <span className="text-xs text-gray-400 font-semibold hidden md:block">{t.プロジェクト名}</span>
                      <span className="text-xs text-[#FF4B4B] font-bold">{t.期日}</span>
                      <button onClick={() => setTaskModal(t)} className="text-xs text-gray-400 hover:text-gray-700 cursor-pointer font-bold">編集</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b-2 border-gray-100 flex items-center justify-between">
                <h2 className="text-sm font-extrabold text-gray-700">最近の進捗ログ</h2>
                <button onClick={() => setActiveTab("logs")} className="text-xs text-[#58CC02] hover:text-[#46a302] cursor-pointer font-extrabold">すべて見る →</button>
              </div>
              <div className="divide-y-2 divide-gray-50">
                {logs.slice(0, 5).map((l, i) => (
                  <div key={l.id ?? i} className="px-5 py-3 flex gap-4 items-start">
                    <span className="text-xs text-gray-400 w-24 flex-shrink-0 pt-0.5 font-semibold">{l.日付}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-xs font-extrabold" style={{ color: projectColor(l.プロジェクト名) }}>{l.プロジェクト名}</span>
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold">{l.フェーズ}</span>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2 font-medium">{l.進捗内容}</p>
                    </div>
                    {l.次のマイルストーン && (
                      <p className="text-xs text-[#FF9600] font-bold hidden lg:block flex-shrink-0 max-w-xs truncate">→ {l.次のマイルストーン}</p>
                    )}
                  </div>
                ))}
                {logs.length === 0 && <p className="text-center py-8 text-gray-300 text-sm font-bold">進捗ログなし</p>}
              </div>
            </div>
          </div>
        )}

        {/* ════ TASK LIST ════ */}
        {activeTab === "tasks" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <input
                className="duo-input flex-1 min-w-48"
                placeholder="タスク名・アクションで検索..."
                value={filterText} onChange={e => setFilterText(e.target.value)} />
              <select className="duo-input w-auto" value={filterProject} onChange={e => setFilterProject(e.target.value)}>
                <option value="">全案件</option>
                {projects.map(p => <option key={p}>{p}</option>)}
              </select>
              <select className="duo-input w-auto" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">全ステータス</option>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
              <button onClick={() => setTaskModal(EMPTY_TASK())}
                className="duo-btn duo-btn-green gap-1.5 text-sm font-bold px-5 py-2.5 rounded-2xl">
                ＋ タスク追加
              </button>
            </div>
            <p className="text-gray-400 text-xs font-bold">{filteredTasks.length} 件表示</p>

            <div className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-100 text-left">
                      <th className="px-4 py-3 text-xs font-extrabold text-gray-400 uppercase tracking-wide w-32">ステータス</th>
                      <th className="px-4 py-3 text-xs font-extrabold text-gray-400 uppercase tracking-wide">タスク名</th>
                      <th className="px-4 py-3 text-xs font-extrabold text-gray-400 uppercase tracking-wide w-32 hidden md:table-cell">案件</th>
                      <th className="px-4 py-3 text-xs font-extrabold text-gray-400 uppercase tracking-wide w-28 hidden lg:table-cell">種別</th>
                      <th className="px-4 py-3 text-xs font-extrabold text-gray-400 uppercase tracking-wide w-10 hidden lg:table-cell text-center">規模</th>
                      <th className="px-4 py-3 text-xs font-extrabold text-gray-400 uppercase tracking-wide w-28 hidden md:table-cell">期日</th>
                      <th className="px-4 py-3 text-xs font-extrabold text-gray-400 uppercase tracking-wide hidden xl:table-cell">次のアクション</th>
                      <th className="px-4 py-3 w-16 text-center hidden lg:table-cell text-xs font-extrabold text-gray-400">フラグ</th>
                      <th className="px-4 py-3 w-20"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-gray-50">
                    {filteredTasks.map(t => {
                      const overdue = t.期日 && t.期日 < today && t.ステータス !== "完了";
                      return (
                        <tr key={t.id} className="hover:bg-[#f7fff0] transition-colors group">
                          <td className="px-4 py-3"><Badge status={t.ステータス} /></td>
                          <td className="px-4 py-3">
                            <p className={`font-bold text-sm ${t.ステータス === "完了" ? "line-through text-gray-300" : "text-gray-900"}`}>{t.タスク名}</p>
                            {t.進捗メモ && <p className="text-xs text-gray-400 truncate max-w-sm mt-0.5 font-medium">{t.進捗メモ}</p>}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500 font-semibold hidden md:table-cell">{t.プロジェクト名}</td>
                          <td className="px-4 py-3 text-xs text-gray-400 font-semibold hidden lg:table-cell">{t.タスク種別}</td>
                          <td className="px-4 py-3 text-center hidden lg:table-cell">
                            <span className="text-xs text-gray-400 font-extrabold bg-gray-100 px-2 py-0.5 rounded-full">{t.規模}</span>
                          </td>
                          <td className={`px-4 py-3 text-xs hidden md:table-cell font-bold ${overdue ? "text-[#FF4B4B]" : "text-gray-400"}`}>
                            {t.期日 || "—"}{overdue && " ⚠"}
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-xs hidden xl:table-cell font-medium max-w-xs">
                            <span className="truncate block">{t.次のアクション}</span>
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <div className="flex gap-1 justify-center">
                              {t.役員関与 && <span title="役員関与" className="text-sm">👔</span>}
                              {t.EC依頼   && <span title="EC依頼"   className="text-sm">🛒</span>}
                              {t.撮影依頼 && <span title="撮影依頼" className="text-sm">📷</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => setTaskModal({ ...t })} className="text-xs text-gray-400 hover:text-gray-700 cursor-pointer font-bold">編集</button>
                              <button onClick={() => deleteTask(t.id)} className="text-xs text-gray-300 hover:text-[#FF4B4B] cursor-pointer font-bold">削除</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filteredTasks.length === 0 && (
                  <p className="text-center py-12 text-gray-300 text-sm font-bold">該当するタスクがありません</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ════ LOGS ════ */}
        {activeTab === "logs" && (
          <div>
            {/* トップ: 案件カード一覧 */}
            {!selectedLogProject && (
              <div className="space-y-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-gray-500 text-sm font-bold">{projectCardData.length} 案件</p>
                  <button onClick={() => { setShowAddProject(v => !v); setNewProjectName(""); }}
                    className="duo-btn duo-btn-green gap-1.5 text-sm font-bold px-5 py-2.5 rounded-2xl">
                    ＋ 案件を追加
                  </button>
                </div>

                {showAddProject && (
                  <div className="bg-white border-2 border-[#58CC02] rounded-2xl p-4 flex gap-3 items-end shadow-sm">
                    <div className="flex-1">
                      <label className={labelCls}>案件名 *</label>
                      <input className={inputCls} placeholder="例：新商品ローンチ"
                        value={newProjectName} onChange={e => setNewProjectName(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && addProject()} autoFocus />
                    </div>
                    <button onClick={addProject} className="duo-btn duo-btn-green px-4 py-2.5 rounded-xl text-sm font-bold flex-shrink-0">追加</button>
                    <button onClick={() => setShowAddProject(false)} className="duo-btn duo-btn-gray px-4 py-2.5 rounded-xl text-sm font-bold flex-shrink-0">キャンセル</button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projectCardData.map(p => (
                    <div key={p.name}
                      className="bg-white border-2 border-gray-100 rounded-2xl p-5 hover:shadow-md transition-all group relative"
                      style={{ borderTopColor: p.color, borderTopWidth: "4px" }}
                    >
                      <button onClick={() => deleteProject(p.name)}
                        className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full text-gray-300 hover:text-[#FF4B4B] hover:bg-red-50 transition-colors cursor-pointer opacity-0 group-hover:opacity-100 text-xs font-bold"
                        title="案件を削除">✕</button>

                      <div className="flex items-start justify-between mb-3 cursor-pointer" onClick={() => setSelectedLogProject(p.name)}>
                        <h3 className="font-extrabold text-sm leading-snug pr-6" style={{ color: p.color }}>{p.name}</h3>
                        <span className="text-xs text-gray-300 flex-shrink-0 mt-0.5 font-semibold">{p.lastDate}</span>
                      </div>

                      <div className="mb-4 cursor-pointer" onClick={() => setSelectedLogProject(p.name)}>
                        <span className="text-xs px-2.5 py-1 rounded-full font-extrabold"
                          style={{ backgroundColor: p.color + "20", color: p.color }}>
                          {p.latestPhase}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 pt-3 border-t-2 border-gray-50 cursor-pointer" onClick={() => setSelectedLogProject(p.name)}>
                        <div className="flex-1">
                          <p className="text-xs text-gray-400 mb-0.5 font-bold">進捗ログ</p>
                          <p className="text-2xl font-extrabold" style={{ color: p.color }}>{p.logCount}</p>
                        </div>
                        <div className="w-px h-8 bg-gray-100" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-400 mb-0.5 font-bold">タスク</p>
                          <p className="text-2xl font-extrabold text-gray-900">
                            {p.taskCount}
                            {p.incCount > 0 && (
                              <span className="text-xs font-bold text-[#FF4B4B] ml-1">({p.incCount}未完)</span>
                            )}
                          </p>
                        </div>
                        <span className="text-gray-300 text-xs group-hover:text-gray-500 transition-colors self-end font-bold">→</span>
                      </div>
                    </div>
                  ))}
                  {projectCardData.length === 0 && (
                    <p className="col-span-3 text-center py-16 text-gray-300 text-sm font-bold">進捗ログがありません</p>
                  )}
                </div>
              </div>
            )}

            {/* 案件詳細 */}
            {selectedLogProject && (() => {
              const color = projectColor(selectedLogProject);
              const projectTasks = tasks.filter(t => t.プロジェクト名 === selectedLogProject);
              const sortedLogs = [...filteredLogs].sort((a, b) => b.日付.localeCompare(a.日付));

              return (
                <div className="space-y-8">
                  <div className="flex items-center gap-3 flex-wrap">
                    <button onClick={() => { setSelectedLogProject(null); setShowLogForm(false); }}
                      className="duo-btn duo-btn-gray flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                      戻る
                    </button>
                    <div className="w-px h-6 bg-gray-200" />
                    <h2 className="text-xl font-extrabold" style={{ color }}>{selectedLogProject}</h2>
                  </div>

                  {/* 進捗ログセクション */}
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: color }} />
                        <h3 className="text-sm font-extrabold text-gray-900">進捗ログ</h3>
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold">{sortedLogs.length} 件</span>
                      </div>
                      <button onClick={() => { setLogForm({ ...EMPTY_LOG(), プロジェクト名: selectedLogProject }); setShowLogForm(v => !v); }}
                        className="duo-btn text-xs font-bold px-4 py-2 rounded-xl"
                        style={{ backgroundColor: color + "20", color, boxShadow: `0 3px 0 ${color}40` }}>
                        ＋ 進捗ログを追加
                      </button>
                    </div>

                    {showLogForm && (
                      <div className="bg-white border-2 rounded-2xl p-5 space-y-4 mb-4 shadow-sm" style={{ borderColor: color + "50" }}>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          <div><label className={labelCls}>日付</label>
                            <input type="date" className={inputCls} value={logForm.日付}
                              onChange={e => setLogForm(f => ({ ...f, 日付: e.target.value }))} /></div>
                          <div><label className={labelCls}>フェーズ</label>
                            <select className={inputCls} value={logForm.フェーズ}
                              onChange={e => setLogForm(f => ({ ...f, フェーズ: e.target.value }))}>
                              {PHASES.map(p => <option key={p}>{p}</option>)}</select></div>
                          <div className="col-span-2 md:col-span-3"><label className={labelCls}>進捗内容 *</label>
                            <textarea className="duo-input resize-none" rows={2} value={logForm.進捗内容}
                              placeholder="今回の進捗を記入"
                              onChange={e => setLogForm(f => ({ ...f, 進捗内容: e.target.value }))} /></div>
                          <div className="col-span-2"><label className={labelCls}>関係者</label>
                            <input className={inputCls} value={logForm.関係者}
                              onChange={e => setLogForm(f => ({ ...f, 関係者: e.target.value }))} placeholder="田中・佐藤" /></div>
                          <div><label className={labelCls}>次のマイルストーン</label>
                            <input className={inputCls} value={logForm.次のマイルストーン}
                              onChange={e => setLogForm(f => ({ ...f, 次のマイルストーン: e.target.value }))} placeholder="○○完了（6/5）" /></div>
                        </div>
                        <div className="flex gap-3 justify-end">
                          <button onClick={() => { setShowLogForm(false); setLogForm(EMPTY_LOG()); }}
                            className="duo-btn duo-btn-gray px-4 py-2 rounded-xl text-sm font-bold">キャンセル</button>
                          <button onClick={addLog} className="duo-btn text-white px-5 py-2 rounded-xl text-sm font-bold"
                            style={{ backgroundColor: color, boxShadow: `0 4px 0 ${color}80` }}>追加</button>
                        </div>
                      </div>
                    )}

                    {sortedLogs.length > 0 ? (
                      <div>
                        {sortedLogs.map((l, i) => (
                          <div key={l.id ?? i} className="flex gap-4 group">
                            <div className="flex flex-col items-center flex-shrink-0 w-7">
                              <div className="w-3.5 h-3.5 rounded-full mt-1 flex-shrink-0 ring-3 ring-white shadow-sm"
                                style={{ backgroundColor: color }} />
                              {i < sortedLogs.length - 1 && (
                                <div className="w-0.5 flex-1 mt-1" style={{ backgroundColor: color + "30", minHeight: "1.5rem" }} />
                              )}
                            </div>
                            <div className={`flex-1 pb-6 ${i === sortedLogs.length - 1 ? "pb-0" : ""}`}>
                              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                <span className="text-xs text-gray-400 font-bold">{l.日付}</span>
                                <span className="text-xs px-2 py-0.5 rounded-full font-extrabold"
                                  style={{ backgroundColor: color + "20", color }}>
                                  {l.フェーズ}
                                </span>
                                {l.関係者 && <span className="text-xs text-gray-400 font-semibold">👤 {l.関係者}</span>}
                                <button onClick={() => deleteLog(l.id ?? i)}
                                  className="ml-auto text-gray-200 hover:text-[#FF4B4B] text-xs cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity font-bold">✕</button>
                              </div>
                              <p className="text-sm text-gray-700 leading-relaxed font-medium">{l.進捗内容}</p>
                              {l.次のマイルストーン && (
                                <p className="text-xs mt-1.5 font-bold" style={{ color: color + "bb" }}>
                                  <span className="opacity-50 mr-1">→</span>{l.次のマイルストーン}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center py-10 text-gray-300 text-sm font-bold bg-white rounded-2xl border-2 border-gray-100">進捗ログがありません</p>
                    )}
                  </section>

                  {/* タスクセクション */}
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-6 rounded-full bg-gray-200" />
                        <h3 className="text-sm font-extrabold text-gray-900">タスク</h3>
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold">{projectTasks.length} 件</span>
                        {projectTasks.filter(t => t.ステータス !== "完了").length > 0 && (
                          <span className="text-xs bg-[#FFEDED] text-[#FF4B4B] px-2 py-0.5 rounded-full font-bold">
                            {projectTasks.filter(t => t.ステータス !== "完了").length} 未完了
                          </span>
                        )}
                      </div>
                      <button onClick={() => setTaskModal({ ...EMPTY_TASK(), プロジェクト名: selectedLogProject })}
                        className="duo-btn duo-btn-gray text-xs font-bold px-4 py-2 rounded-xl">
                        ＋ タスクを追加
                      </button>
                    </div>

                    {projectTasks.length > 0 ? (
                      <div className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden shadow-sm">
                        <div className="divide-y-2 divide-gray-50">
                          {projectTasks
                            .sort((a, b) => {
                              const ord = ["未着手","進行中","レビュー中","保留","完了"];
                              return ord.indexOf(a.ステータス) - ord.indexOf(b.ステータス);
                            })
                            .map(t => {
                              const overdue = t.期日 && t.期日 < today && t.ステータス !== "完了";
                              return (
                                <div key={t.id} className="flex items-start gap-3 px-4 py-3 hover:bg-[#f7fff0] group transition-colors">
                                  <div className="pt-0.5 flex-shrink-0"><Badge status={t.ステータス} /></div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-bold ${t.ステータス === "完了" ? "line-through text-gray-300" : "text-gray-900"}`}>{t.タスク名}</p>
                                    {t.次のアクション && (
                                      <p className="text-xs text-gray-400 mt-0.5 truncate font-semibold">→ {t.次のアクション}</p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 flex-shrink-0">
                                    {t.期日 && (
                                      <span className={`text-xs font-bold ${overdue ? "text-[#FF4B4B]" : "text-gray-400"}`}>
                                        {t.期日}{overdue && " ⚠"}
                                      </span>
                                    )}
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button onClick={() => setTaskModal({ ...t })} className="text-xs text-gray-400 hover:text-gray-700 cursor-pointer font-bold">編集</button>
                                      <button onClick={() => deleteTask(t.id)} className="text-xs text-gray-300 hover:text-[#FF4B4B] cursor-pointer font-bold">削除</button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    ) : (
                      <p className="text-center py-10 text-gray-300 text-sm font-bold bg-white rounded-2xl border-2 border-gray-100">タスクがありません</p>
                    )}
                  </section>
                </div>
              );
            })()}
          </div>
        )}

        {/* ════ REQUESTS ════ */}
        {activeTab === "requests" && (
          <div className="space-y-10">

            {/* 📷 撮影依頼 */}
            {(() => {
              const active    = photoRequests.filter(r => r.ステータス !== "完了");
              const completed = photoRequests.filter(r => r.ステータス === "完了");
              return (
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">📷</span>
                      <h2 className="text-base font-extrabold text-gray-900">撮影依頼</h2>
                      {active.length > 0 && (
                        <span className="text-xs bg-orange-100 text-orange-600 px-2.5 py-0.5 rounded-full font-extrabold">
                          {active.length} 件対応中
                        </span>
                      )}
                    </div>
                    <button onClick={() => { setShowPhotoForm(v => !v); setPhotoForm(EMPTY_PHOTO()); }}
                      className="duo-btn duo-btn-orange text-xs font-bold px-4 py-2 rounded-xl gap-1">
                      ＋ 追加
                    </button>
                  </div>

                  {showPhotoForm && (
                    <div className="bg-white border-2 border-orange-200 rounded-2xl p-5 space-y-4 mb-4 shadow-sm">
                      <h3 className="text-xs font-extrabold text-orange-500 uppercase tracking-wider">新規撮影依頼</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div><label className={labelCls}>受付日</label>
                          <input type="date" className={inputCls} value={photoForm.受付日}
                            onChange={e => setPhotoForm(f => ({ ...f, 受付日: e.target.value }))} /></div>
                        <div className="col-span-2 md:col-span-1"><label className={labelCls}>タスク名 *</label>
                          <input className={inputCls} value={photoForm.タスク名}
                            onChange={e => setPhotoForm(f => ({ ...f, タスク名: e.target.value }))} placeholder="例：GAIA-MAX 商品撮影" /></div>
                        <div><label className={labelCls}>プロジェクト</label>
                          <select className={inputCls} value={photoForm.プロジェクト}
                            onChange={e => setPhotoForm(f => ({ ...f, プロジェクト: e.target.value }))}>
                            <option value="">-- 選択 --</option>
                            {projects.map(p => <option key={p}>{p}</option>)}</select></div>
                        <div><label className={labelCls}>撮影種別</label>
                          <select className={inputCls} value={photoForm.撮影種別}
                            onChange={e => setPhotoForm(f => ({ ...f, 撮影種別: e.target.value }))}>
                            {PHOTO_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
                        <div><label className={labelCls}>撮影点数</label>
                          <input className={inputCls} value={photoForm.撮影点数}
                            onChange={e => setPhotoForm(f => ({ ...f, 撮影点数: e.target.value }))} placeholder="例：10点" /></div>
                        <div><label className={labelCls}>希望撮影日</label>
                          <input type="date" className={inputCls} value={photoForm.希望撮影日}
                            onChange={e => setPhotoForm(f => ({ ...f, 希望撮影日: e.target.value }))} /></div>
                        <div><label className={labelCls}>納品希望日</label>
                          <input type="date" className={inputCls} value={photoForm.納品希望日}
                            onChange={e => setPhotoForm(f => ({ ...f, 納品希望日: e.target.value }))} /></div>
                        <div className="col-span-2 md:col-span-3"><label className={labelCls}>撮影メモ</label>
                          <textarea className="duo-input resize-none" rows={2} value={photoForm.撮影メモ}
                            placeholder="撮影指示・参考画像URLなど"
                            onChange={e => setPhotoForm(f => ({ ...f, 撮影メモ: e.target.value }))} /></div>
                      </div>
                      <div className="flex gap-3 justify-end">
                        <button onClick={() => setShowPhotoForm(false)} className="duo-btn duo-btn-gray px-4 py-2.5 rounded-xl text-sm font-bold">キャンセル</button>
                        <button onClick={addPhotoRequest} className="duo-btn duo-btn-orange px-5 py-2.5 rounded-xl text-sm font-bold">追加</button>
                      </div>
                    </div>
                  )}

                  {active.length > 0 ? (
                    <div className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden shadow-sm mb-3">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b-2 border-gray-100 text-left">
                              <th className="px-4 py-3 text-xs font-extrabold text-gray-400 uppercase tracking-wide w-24">ステータス</th>
                              <th className="px-4 py-3 text-xs font-extrabold text-gray-400 uppercase tracking-wide">タスク名</th>
                              <th className="px-4 py-3 text-xs font-extrabold text-gray-400 uppercase tracking-wide hidden md:table-cell w-28">案件</th>
                              <th className="px-4 py-3 text-xs font-extrabold text-gray-400 uppercase tracking-wide hidden lg:table-cell w-24">種別</th>
                              <th className="px-4 py-3 text-xs font-extrabold text-gray-400 uppercase tracking-wide hidden lg:table-cell w-16 text-center">点数</th>
                              <th className="px-4 py-3 text-xs font-extrabold text-gray-400 uppercase tracking-wide hidden md:table-cell w-24">希望撮影日</th>
                              <th className="px-4 py-3 text-xs font-extrabold text-gray-400 uppercase tracking-wide hidden md:table-cell w-24">納品希望日</th>
                              <th className="px-4 py-3 w-8"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y-2 divide-gray-50">
                            {active.map(r => (
                              <tr key={r.id} className="hover:bg-orange-50/30 group transition-colors">
                                <td className="px-4 py-3">
                                  <button onClick={() => cyclePhotoStatus(r.id)}
                                    className={`text-xs px-2.5 py-0.5 rounded-full border-2 cursor-pointer font-extrabold transition-all hover:-translate-y-0.5 ${PHOTO_STATUS_CLS[r.ステータス]}`}
                                    title="クリックで次のステータスへ">{r.ステータス}</button>
                                </td>
                                <td className="px-4 py-3">
                                  <p className="font-bold text-sm text-gray-900">{r.タスク名}</p>
                                  {r.撮影メモ && <p className="text-xs text-gray-400 truncate max-w-xs mt-0.5 font-medium">{r.撮影メモ}</p>}
                                </td>
                                <td className="px-4 py-3 text-xs text-gray-500 font-semibold hidden md:table-cell">{r.プロジェクト}</td>
                                <td className="px-4 py-3 text-xs text-gray-400 font-semibold hidden lg:table-cell">{r.撮影種別}</td>
                                <td className="px-4 py-3 text-xs text-gray-400 text-center hidden lg:table-cell font-semibold">{r.撮影点数}</td>
                                <td className="px-4 py-3 text-xs text-gray-400 hidden md:table-cell font-semibold">{r.希望撮影日 || "—"}</td>
                                <td className="px-4 py-3 text-xs text-gray-400 hidden md:table-cell font-semibold">{r.納品希望日 || "—"}</td>
                                <td className="px-4 py-3">
                                  <button onClick={() => deletePhotoRequest(r.id)}
                                    className="text-gray-200 hover:text-[#FF4B4B] text-xs cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity font-bold">✕</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    !showPhotoForm && <p className="text-center py-8 text-gray-300 text-sm font-bold bg-white rounded-2xl border-2 border-gray-100 mb-3">対応中の撮影依頼はありません</p>
                  )}

                  {completed.length > 0 && (
                    <div>
                      <button onClick={() => setShowPhotoCompleted(v => !v)}
                        className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-600 cursor-pointer mb-2 font-bold transition-colors">
                        <span>{showPhotoCompleted ? "▾" : "▸"}</span>完了済み {completed.length} 件
                      </button>
                      {showPhotoCompleted && (
                        <div className="bg-gray-50 rounded-2xl border-2 border-gray-100 overflow-hidden">
                          <div className="divide-y-2 divide-gray-100">
                            {completed.map(r => (
                              <div key={r.id} className="flex items-center gap-4 px-4 py-2.5 group">
                                <span className={`text-xs px-2.5 py-0.5 rounded-full border-2 flex-shrink-0 font-bold ${PHOTO_STATUS_CLS["完了"]}`}>完了</span>
                                <span className="text-xs text-gray-400 line-through flex-1 font-medium">{r.タスク名}</span>
                                <span className="text-xs text-gray-300 hidden md:block font-medium">{r.プロジェクト}</span>
                                <span className="text-xs text-gray-300 hidden md:block font-medium">{r.受付日}</span>
                                <button onClick={() => deletePhotoRequest(r.id)}
                                  className="text-gray-200 hover:text-[#FF4B4B] text-xs cursor-pointer opacity-0 group-hover:opacity-100 font-bold">✕</button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </section>
              );
            })()}

            {/* 🛒 EC依頼 */}
            {(() => {
              const active    = ecRequests.filter(r => r.ステータス !== "完了");
              const completed = ecRequests.filter(r => r.ステータス === "完了");
              return (
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🛒</span>
                      <h2 className="text-base font-extrabold text-gray-900">EC依頼</h2>
                      {active.length > 0 && (
                        <span className="text-xs bg-[#E8F4FF] text-[#1CB0F6] px-2.5 py-0.5 rounded-full font-extrabold">
                          {active.length} 件対応中
                        </span>
                      )}
                    </div>
                    <button onClick={() => { setShowEcForm(v => !v); setEcForm(EMPTY_EC()); }}
                      className="duo-btn duo-btn-blue text-xs font-bold px-4 py-2 rounded-xl gap-1">
                      ＋ 追加
                    </button>
                  </div>

                  {showEcForm && (
                    <div className="bg-white border-2 border-blue-200 rounded-2xl p-5 space-y-4 mb-4 shadow-sm">
                      <h3 className="text-xs font-extrabold text-[#1CB0F6] uppercase tracking-wider">新規EC依頼</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div><label className={labelCls}>受付日</label>
                          <input type="date" className={inputCls} value={ecForm.受付日}
                            onChange={e => setEcForm(f => ({ ...f, 受付日: e.target.value }))} /></div>
                        <div><label className={labelCls}>種別</label>
                          <select className={inputCls} value={ecForm.種別}
                            onChange={e => setEcForm(f => ({ ...f, 種別: e.target.value }))}>
                            {EC_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
                        <div><label className={labelCls}>依頼者</label>
                          <input className={inputCls} value={ecForm.依頼者}
                            onChange={e => setEcForm(f => ({ ...f, 依頼者: e.target.value }))} placeholder="田中" /></div>
                        <div className="col-span-2 md:col-span-3"><label className={labelCls}>依頼内容 *</label>
                          <textarea className="duo-input resize-none" rows={2} value={ecForm.依頼内容}
                            placeholder="依頼内容を具体的に記入"
                            onChange={e => setEcForm(f => ({ ...f, 依頼内容: e.target.value }))} /></div>
                        <div><label className={labelCls}>対象サイト</label>
                          <select className={inputCls} value={ecForm.対象サイト}
                            onChange={e => setEcForm(f => ({ ...f, 対象サイト: e.target.value }))}>
                            {EC_SITES.map(s => <option key={s}>{s}</option>)}</select></div>
                        <div><label className={labelCls}>期日</label>
                          <input type="date" className={inputCls} value={ecForm.期日}
                            onChange={e => setEcForm(f => ({ ...f, 期日: e.target.value }))} /></div>
                        <div><label className={labelCls}>備考</label>
                          <input className={inputCls} value={ecForm.備考}
                            onChange={e => setEcForm(f => ({ ...f, 備考: e.target.value }))} placeholder="補足事項" /></div>
                      </div>
                      <div className="flex gap-3 justify-end">
                        <button onClick={() => setShowEcForm(false)} className="duo-btn duo-btn-gray px-4 py-2.5 rounded-xl text-sm font-bold">キャンセル</button>
                        <button onClick={addEcRequest} className="duo-btn duo-btn-blue px-5 py-2.5 rounded-xl text-sm font-bold">追加</button>
                      </div>
                    </div>
                  )}

                  {active.length > 0 ? (
                    <div className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden shadow-sm mb-3">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b-2 border-gray-100 text-left">
                              <th className="px-4 py-3 text-xs font-extrabold text-gray-400 uppercase tracking-wide w-24">ステータス</th>
                              <th className="px-4 py-3 text-xs font-extrabold text-gray-400 uppercase tracking-wide hidden md:table-cell w-24">種別</th>
                              <th className="px-4 py-3 text-xs font-extrabold text-gray-400 uppercase tracking-wide">依頼内容</th>
                              <th className="px-4 py-3 text-xs font-extrabold text-gray-400 uppercase tracking-wide hidden lg:table-cell w-20">依頼者</th>
                              <th className="px-4 py-3 text-xs font-extrabold text-gray-400 uppercase tracking-wide hidden md:table-cell w-20">対象サイト</th>
                              <th className="px-4 py-3 text-xs font-extrabold text-gray-400 uppercase tracking-wide hidden md:table-cell w-24">期日</th>
                              <th className="px-4 py-3 w-8"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y-2 divide-gray-50">
                            {active.map(r => {
                              const overdue = r.期日 && r.期日 < today && r.ステータス !== "完了";
                              return (
                                <tr key={r.id} className="hover:bg-blue-50/30 group transition-colors">
                                  <td className="px-4 py-3">
                                    <button onClick={() => cycleEcStatus(r.id)}
                                      className={`text-xs px-2.5 py-0.5 rounded-full border-2 cursor-pointer font-extrabold transition-all hover:-translate-y-0.5 ${EC_STATUS_CLS[r.ステータス]}`}
                                      title="クリックで次のステータスへ">{r.ステータス}</button>
                                  </td>
                                  <td className="px-4 py-3 text-xs text-gray-500 font-semibold hidden md:table-cell">{r.種別}</td>
                                  <td className="px-4 py-3">
                                    <p className="text-sm text-gray-900 font-bold truncate max-w-xs">{r.依頼内容}</p>
                                    {r.備考 && <p className="text-xs text-gray-400 truncate mt-0.5 font-medium">{r.備考}</p>}
                                  </td>
                                  <td className="px-4 py-3 text-xs text-gray-400 hidden lg:table-cell font-semibold">{r.依頼者}</td>
                                  <td className="px-4 py-3 text-xs text-gray-400 hidden md:table-cell font-semibold">{r.対象サイト}</td>
                                  <td className={`px-4 py-3 text-xs hidden md:table-cell font-bold ${overdue ? "text-[#FF4B4B]" : "text-gray-400"}`}>
                                    {r.期日 || "—"}{overdue && " ⚠"}
                                  </td>
                                  <td className="px-4 py-3">
                                    <button onClick={() => deleteEcRequest(r.id)}
                                      className="text-gray-200 hover:text-[#FF4B4B] text-xs cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity font-bold">✕</button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    !showEcForm && <p className="text-center py-8 text-gray-300 text-sm font-bold bg-white rounded-2xl border-2 border-gray-100 mb-3">対応中のEC依頼はありません</p>
                  )}

                  {completed.length > 0 && (
                    <div>
                      <button onClick={() => setShowEcCompleted(v => !v)}
                        className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-600 cursor-pointer mb-2 font-bold transition-colors">
                        <span>{showEcCompleted ? "▾" : "▸"}</span>完了済み {completed.length} 件
                      </button>
                      {showEcCompleted && (
                        <div className="bg-gray-50 rounded-2xl border-2 border-gray-100 overflow-hidden">
                          <div className="divide-y-2 divide-gray-100">
                            {completed.map(r => (
                              <div key={r.id} className="flex items-center gap-4 px-4 py-2.5 group">
                                <span className={`text-xs px-2.5 py-0.5 rounded-full border-2 flex-shrink-0 font-bold ${EC_STATUS_CLS["完了"]}`}>完了</span>
                                <span className="text-xs text-gray-400 line-through flex-1 truncate font-medium">{r.依頼内容}</span>
                                <span className="text-xs text-gray-300 hidden md:block font-medium">{r.対象サイト}</span>
                                <span className="text-xs text-gray-300 hidden md:block font-medium">{r.完了日 || r.受付日}</span>
                                <button onClick={() => deleteEcRequest(r.id)}
                                  className="text-gray-200 hover:text-[#FF4B4B] text-xs cursor-pointer opacity-0 group-hover:opacity-100 font-bold">✕</button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </section>
              );
            })()}
          </div>
        )}

        {/* ════ SETTINGS ════ */}
        {activeTab === "settings" && (
          <div className="max-w-2xl space-y-8">

            {/* 案件管理 */}
            <section>
              <h2 className="text-base font-extrabold text-gray-900 mb-1">案件管理</h2>
              <p className="text-gray-400 text-xs font-medium mb-4">案件名を変更すると、タスク・進捗ログの紐付けも自動で更新されます</p>

              <div className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden shadow-sm">
                <div className="divide-y-2 divide-gray-50">
                  {projects.map((p, i) => (
                    <div key={p} className="flex items-center gap-3 px-5 py-3 group hover:bg-gray-50 transition-colors">
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-extrabold flex-shrink-0"
                        style={{ backgroundColor: PROJECT_PALETTE[i % PROJECT_PALETTE.length] }}>
                        {p.charAt(0)}
                      </span>

                      {editingProject?.old === p ? (
                        /* 編集モード */
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            className="duo-input flex-1"
                            value={editingProject.draft}
                            onChange={e => setEditingProject(prev => ({ ...prev, draft: e.target.value }))}
                            onKeyDown={e => {
                              if (e.key === "Enter") renameProject();
                              if (e.key === "Escape") setEditingProject(null);
                            }}
                            autoFocus
                          />
                          <button onClick={renameProject}
                            className="duo-btn duo-btn-green px-3 py-1.5 rounded-xl text-xs font-bold flex-shrink-0">保存</button>
                          <button onClick={() => setEditingProject(null)}
                            className="duo-btn duo-btn-gray px-3 py-1.5 rounded-xl text-xs font-bold flex-shrink-0">キャンセル</button>
                        </div>
                      ) : (
                        /* 表示モード */
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-sm font-bold text-gray-900 flex-1">{p}</span>
                          <span className="text-xs text-gray-400 font-medium">
                            タスク {tasks.filter(t => t.プロジェクト名 === p).length}件 ／
                            ログ {logs.filter(l => l.プロジェクト名 === p).length}件
                          </span>
                          <button
                            onClick={() => setEditingProject({ old: p, draft: p })}
                            className="duo-btn duo-btn-gray px-3 py-1.5 rounded-xl text-xs font-bold flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >✏️ 変更</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* 新規案件追加 */}
                <div className="px-5 py-4 border-t-2 border-gray-100 bg-gray-50">
                  {showAddProject ? (
                    <div className="flex gap-2 items-center">
                      <input className="duo-input flex-1" placeholder="新しい案件名"
                        value={newProjectName} onChange={e => setNewProjectName(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") addProject(); if (e.key === "Escape") setShowAddProject(false); }}
                        autoFocus />
                      <button onClick={addProject} className="duo-btn duo-btn-green px-4 py-2 rounded-xl text-sm font-bold flex-shrink-0">追加</button>
                      <button onClick={() => setShowAddProject(false)} className="duo-btn duo-btn-gray px-4 py-2 rounded-xl text-sm font-bold flex-shrink-0">キャンセル</button>
                    </div>
                  ) : (
                    <button onClick={() => setShowAddProject(true)}
                      className="duo-btn duo-btn-green w-full py-2.5 rounded-xl text-sm font-bold">
                      ＋ 新規案件を追加
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* GAS 連携設定 */}
            <section>
              <h2 className="text-base font-extrabold text-gray-900 mb-1">GAS 連携設定</h2>
              <p className="text-gray-400 text-xs font-medium mb-4">Google Apps Script の Web アプリ URL を設定するとスプレッドシートと同期できます</p>
              <div className="bg-white rounded-2xl border-2 border-gray-100 p-5 shadow-sm space-y-4">
                <div>
                  <label className={labelCls}>Web アプリ URL</label>
                  <input className={inputCls} placeholder="https://script.google.com/macros/s/.../exec"
                    value={gasUrlDraft} onChange={e => setGasUrlDraft(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && saveGasUrl()} />
                </div>
                {gasUrl && (
                  <p className="text-xs text-[#58CC02] font-bold">✓ 連携済み：{gasUrl.slice(0, 60)}…</p>
                )}
                <div className="flex gap-3">
                  <button onClick={saveGasUrl} className="duo-btn duo-btn-green px-5 py-2.5 rounded-2xl text-sm font-bold">保存</button>
                  {gasUrl && (
                    <button onClick={() => { setGasUrlDraft(""); localStorage.removeItem("gasUrl"); setGasUrl(""); setGasUrlDraft(""); }}
                      className="duo-btn duo-btn-gray px-5 py-2.5 rounded-2xl text-sm font-bold">連携解除</button>
                  )}
                </div>
              </div>
            </section>

          </div>
        )}
      </main>
    </div>
  );
}
