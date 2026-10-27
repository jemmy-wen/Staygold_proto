import clsx, { type ClassValue } from "clsx";
import type { Case, CaseStatus, Customer, Period, Settings } from "./types";

export const cn = (...v: ClassValue[]) => clsx(v);

// Prototype 的「今天」固定，讓提醒規則的天數計算可以重現
export const TODAY = "2026-10-29";

export const toDate = (s: string) => new Date(s + "T00:00:00");
export const diffDays = (a: string, b: string) => Math.round((toDate(a).getTime() - toDate(b).getTime()) / 86400000);
export const daysSince = (d: string) => diffDays(TODAY, d);
export const daysUntil = (d: string) => diffDays(d, TODAY);
export const addDays = (d: string, n: number) => {
  const x = toDate(d);
  x.setDate(x.getDate() + n);
  return iso(x);
};
export const iso = (x: Date) =>
  `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
export const fmtDate = (d?: string) => (d ? d.replace(/-/g, "/") : "—");
export const fmtShort = (d?: string) => (d ? `${Number(d.slice(5, 7))}/${Number(d.slice(8, 10))}` : "—");
const WEEK = ["日", "一", "二", "三", "四", "五", "六"];
export const weekday = (d: string) => `週${WEEK[toDate(d).getDay()]}`;
export const weekRange = (d = TODAY) => {
  const x = toDate(d);
  const day = (x.getDay() + 6) % 7; // 週一為一週開始
  const start = addDays(d, -day);
  return [start, addDays(start, 6)] as const;
};
export const inRange = (d: string | undefined, [a, b]: readonly [string, string]) => !!d && d >= a && d <= b;

let clock = 0;
export const nowStamp = () => {
  clock += 1;
  const m = 9 + Math.floor(clock / 60);
  const s = clock % 60;
  return `${fmtDate(TODAY)} ${String(Math.min(m, 18)).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

export const money = (n?: number) => (n == null || Number.isNaN(n) ? "—" : `$${Math.round(n).toLocaleString("en-US")}`);
export const tax = (n: number) => Math.round(n * 0.05);
export const withTax = (n: number) => n + tax(n);

export const uid = (p = "id") => `${p}-${Math.random().toString(36).slice(2, 8)}`;

// 驗證項目 → 案件編號中的類別代碼
const ITEM_CODE: Record<string, string> = {
  "ISCC EU": "ISCC",
  "ISCC PLUS": "ISCCPLUS",
  "ISCC CORSIA": "CORSIA",
  "ISO 14064-1": "ISO14064",
  "ISO 14064-1 組織溫室氣體盤查": "ISO14064",
  "ISO 14067 產品碳足跡": "ISO14067",
  "IECQ QC 080000": "QC080000",
  碳排放先期評估: "CARBON",
  星巴克稽核: "SBUX",
  驗廠輔導: "AUDIT",
  廢清案: "WASTE",
  辦理清除許可證變更作業: "PERMIT",
};
export const itemCode = (item: string) => {
  if (ITEM_CODE[item]) return ITEM_CODE[item];
  const ascii = item.replace(/[^A-Za-z0-9 ]/g, " ").trim().split(/\s+/).slice(0, 2).join("");
  return ascii ? ascii.toUpperCase() : "OTHER";
};

export const casePrefix = (c: Pick<Customer, "enCode">, site: string | undefined, item: string, year: string) =>
  [c.enCode, site, itemCode(item), year].filter(Boolean).join("-");

export const nextCaseId = (prefix: string, existing: string[]) => {
  const n = existing.filter((id) => id.startsWith(prefix + "-")).length + 1;
  return `${prefix}-${String(n).padStart(2, "0")}`;
};

// 依《電子文件命名辦法》第 3 層：客戶簡稱/廠區-輔導類別-稽核年度
export const folderL3 = (c: Pick<Customer, "short">, site: string | undefined, item: string, year: string) =>
  `${c.short}${site ? "/" + site : ""}-${itemCode(item)}-${year}`;
export const folderL1 = (c: Pick<Customer, "short" | "pinyin">) => `${c.pinyin}-${c.short}`;

export const STATUSES: CaseStatus[] = [
  "洽詢中",
  "企劃書撰寫中",
  "內容審核中",
  "核價審核中",
  "已報價待回簽",
  "已簽約排課中",
  "輔導中",
  "稽核中",
  "已取證",
  "續證期",
];

export const STATUS_PHASE: Record<CaseStatus, string> = {
  洽詢中: "接洽建檔",
  企劃書撰寫中: "企劃與審核",
  內容審核中: "企劃與審核",
  核價審核中: "企劃與審核",
  已報價待回簽: "簽約",
  已簽約排課中: "輔導執行",
  輔導中: "輔導執行",
  稽核中: "稽核取證",
  已取證: "稽核取證",
  續證期: "續證",
};

// 進行中：尚未取證的案件（已取證、續證期另由續證雷達追蹤）
export const ACTIVE_STATUSES: CaseStatus[] = STATUSES.filter((x) => x !== "已取證" && x !== "續證期");

export const lineOf = (item: string) => (item.includes("ISCC") ? "ISCC" : "ISCC 以外");

export const STATUS_TONE: Record<CaseStatus, string> = {
  洽詢中: "bg-ink-100 text-ink-600",
  企劃書撰寫中: "bg-sky-50 text-sky-700",
  內容審核中: "bg-violet-50 text-violet-700",
  核價審核中: "bg-indigo-50 text-indigo-700",
  已報價待回簽: "bg-amber-50 text-amber-700",
  已簽約排課中: "bg-cyan-50 text-cyan-700",
  輔導中: "bg-brand-50 text-brand-700",
  稽核中: "bg-orange-50 text-orange-700",
  已取證: "bg-emerald-50 text-emerald-700",
  續證期: "bg-rose-50 text-rose-700",
};

export const STATUS_DOT: Record<CaseStatus, string> = {
  洽詢中: "bg-ink-400",
  企劃書撰寫中: "bg-sky-500",
  內容審核中: "bg-violet-500",
  核價審核中: "bg-indigo-500",
  已報價待回簽: "bg-amber-500",
  已簽約排課中: "bg-cyan-500",
  輔導中: "bg-brand-500",
  稽核中: "bg-orange-500",
  已取證: "bg-emerald-500",
  續證期: "bg-rose-500",
};

// 案件狀態不存欄位，一律由里程碑日期與審核進度推導
export function deriveStatus(c: Case, s: Pick<Settings, "renewDays">): CaseStatus {
  const m = c.milestones;
  if (m.certified) {
    if (m.certExpiry && daysUntil(m.certExpiry) <= s.renewDays[0]) return "續證期";
    return "已取證";
  }
  if (m.audits.length) return "稽核中";
  if (m.courseStart && m.courseStart <= TODAY) return "輔導中";
  if (m.signed) return "已簽約排課中";
  if (c.review === "approved") return "已報價待回簽";
  if (c.review === "price") return "核價審核中";
  if (c.review === "content") return "內容審核中";
  if (c.review === "drafting") return "企劃書撰寫中";
  return "洽詢中";
}

// 案件目前的狀態：人手動設定的優先，否則依里程碑與審核結果自動推得（PRD 3.9.4 狀態自動更新）
export const caseStatus = (c: Case, s: Pick<Settings, "renewDays">): CaseStatus => c.manualStatus ?? deriveStatus(c, s);

// 手動設定後，若之後登記的資料推得新的狀態，提出建議由人決定是否採用
// 只在新資料推得的狀態比手動設定的更後面時提出（例如手動設「輔導中」後補登回簽日，不會建議退回「已簽約排課中」）
export const statusSuggestion = (c: Case, s: Pick<Settings, "renewDays">): CaseStatus | undefined => {
  if (!c.manualStatus) return undefined;
  const d = deriveStatus(c, s);
  return d !== c.manualBasis && STATUSES.indexOf(d) > STATUSES.indexOf(c.manualStatus) ? d : undefined;
};

export type InvoiceStatus = "未觸發" | "待開立" | "已開立";
export type PayStatus = "—" | "待收款" | "已收款";

export function periodState(c: Case, p: Period) {
  const triggered =
    p.trigger === "開課"
      ? (!!c.milestones.courseStart && c.milestones.courseStart <= TODAY) || (!!c.manualStatus && STATUSES.indexOf(c.manualStatus) >= STATUSES.indexOf("輔導中")) // 手動改到輔導中以後視為已開課
      : p.trigger === "取證"
        ? !!c.milestones.certified || c.manualStatus === "已取證" || c.manualStatus === "續證期" // PRD 3.11：案件狀態轉為「已取證」時
        : !!p.customDate && p.customDate <= TODAY;
  const invoice: InvoiceStatus = p.invoiceNo ? "已開立" : triggered ? "待開立" : "未觸發";
  const pay: PayStatus = p.paidDate ? "已收款" : p.invoiceNo ? "待收款" : "—";
  const overdue = p.invoiceNo && !p.paidDate && p.invoiceDate ? daysSince(p.invoiceDate) : 0;
  const triggeredOn =
    p.trigger === "開課" ? c.milestones.courseStart : p.trigger === "取證" ? c.milestones.certified : p.customDate;
  return { triggered, invoice, pay, overdue, triggeredOn };
}

export const triggerLabel = (p: Period) =>
  p.trigger === "開課" ? "第一堂課開課當月" : p.trigger === "取證" ? "取證後" : `自訂 ${fmtDate(p.customDate)}`;

export const contractTotal = (c: Case) => c.pricing.coaching.special + c.pricing.audit.special;

export const agingBucket = (d: number) => (d <= 30 ? "0–30 天" : d <= 60 ? "31–60 天" : d <= 90 ? "61–90 天" : "90 天以上");

export const initials = (name: string) => {
  const ascii = name.match(/[A-Za-z]+/);
  if (ascii) return ascii[0].slice(0, 2);
  return name.slice(-2);
};

// 網址參數：畫面規格頁以 iframe 直接開到指定角色、頁面與彈窗
export const param = (k: string) => (typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get(k));
export const openParam = (name: string) => param("open") === name;
