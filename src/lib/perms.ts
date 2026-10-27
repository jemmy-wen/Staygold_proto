import type { Perms, RolePreset } from "./types";

const NONE: Perms = {
  dashboard: false,
  cases: false,
  casesScope: "own",
  casesCreate: false,
  casesEdit: false,
  caseEmail: false,
  caseDocs: false,
  caseSchedule: false,
  reviewContent: false,
  reviewPrice: false,
  customers: false,
  customersEdit: false,
  customerContact: false,
  travel: false,
  travelAll: false,
  financeAmounts: false,
  financeCenter: false,
  financeRecord: false,
  payables: false,
  exportExcel: false,
  audit: false,
  gmail: false,
  members: false,
  settings: false,
};

const ALL: Perms = Object.fromEntries(Object.keys(NONE).map((k) => [k, true])) as unknown as Perms;
ALL.casesScope = "all";

// 層級預設值；個別成員可再以開關調整
export const PRESETS: Record<RolePreset, Perms> = {
  // 主管可檢視全部；登記開票與收款是財務的作業，預設不開，開票通知才不會進到主管的待辦
  主管: { ...ALL, financeRecord: false },
  專員: {
    ...NONE,
    dashboard: true,
    cases: true,
    casesScope: "own",
    casesCreate: true,
    casesEdit: true,
    caseEmail: true,
    caseDocs: true,
    caseSchedule: true,
    customers: true,
    customersEdit: true,
    customerContact: true,
    travel: true,
    travelAll: true,
    gmail: true,
  },
  顧問: {
    ...NONE,
    dashboard: true,
    cases: true,
    casesScope: "own",
    casesCreate: true,
    casesEdit: true,
    caseEmail: true,
    caseDocs: true,
    caseSchedule: true,
    customers: true,
    customerContact: true,
    travel: true,
    gmail: true,
  },
};

export const ROLES: RolePreset[] = ["主管", "專員", "顧問"];

export type PermItem = {
  key: keyof Perms;
  label: string;
  desc: string;
  parent?: keyof Perms;
};

export type PermGroup = { title: string; items: PermItem[] };

export const PERM_GROUPS: PermGroup[] = [
  {
    title: "頁面與功能",
    items: [
      { key: "dashboard", label: "總覽", desc: "案件進度與數量；帳務區塊需另開「財務金額」" },
      { key: "cases", label: "案件", desc: "案件列表與案件詳情頁" },
      { key: "customers", label: "客戶資料", desc: "客戶主檔、集團關係與歷屆案件" },
      { key: "travel", label: "差旅費", desc: "填報差旅費並歸戶到案件" },
      { key: "financeCenter", label: "財務中心", desc: "開票待辦、請款總表、外聘顧問請款", parent: "financeAmounts" },
      { key: "audit", label: "異動紀錄", desc: "全系統資料異動：誰、何時、改了什麼" },
      { key: "gmail", label: "Gmail 擴充功能", desc: "在 Gmail 側邊欄確認信件與案件的關聯" },
      { key: "members", label: "成員與權限", desc: "邀請成員、調整權限" },
      { key: "settings", label: "系統設定", desc: "通知天數、驗證項目選單、工作空間名稱" },
    ],
  },
  {
    title: "案件操作",
    items: [
      { key: "casesCreate", label: "建立案件", desc: "新增案件、複製舊案件建立續證案件", parent: "cases" },
      { key: "casesEdit", label: "登記進度與里程碑", desc: "拜訪、企劃書送出、回簽、開課、稽核、取證日期", parent: "cases" },
      { key: "caseEmail", label: "Email 分頁", desc: "檢視與確認案件的關聯信件", parent: "cases" },
      { key: "caseDocs", label: "文件分頁", desc: "Drive 資料夾檔案（仍以 Google 共用權限為準）", parent: "cases" },
      { key: "caseSchedule", label: "排課分頁", desc: "Calendar 日程表與堂數比對", parent: "cases" },
    ],
  },
  {
    title: "審核權限",
    items: [
      { key: "reviewContent", label: "審核輔導內容", desc: "第一關：合夥人審核服務範疇與內容", parent: "cases" },
      { key: "reviewPrice", label: "最終審核與核價", desc: "第二關：核可三層定價或退回調整", parent: "cases" },
    ],
  },
  {
    title: "資訊可見與登記",
    items: [
      { key: "financeAmounts", label: "財務金額", desc: "報價、分期請款金額、應收帳款總覽、案件財務分頁" },
      { key: "financeRecord", label: "登記開票與收款", desc: "登記發票號碼、開立日、收款日", parent: "financeAmounts" },
      { key: "payables", label: "外聘顧問請款", desc: "顧問請款金額、發票抬頭、收款帳戶", parent: "financeAmounts" },
      { key: "exportExcel", label: "匯出 Excel", desc: "依「會計」分頁格式匯出待開發票清單", parent: "financeAmounts" },
      { key: "customerContact", label: "客戶聯絡資訊與統編", desc: "聯絡人電話、Email、統一編號、發票地址", parent: "customers" },
      { key: "customersEdit", label: "編輯客戶資料", desc: "修改客戶主檔欄位、新增客戶", parent: "customers" },
      { key: "travelAll", label: "檢視全部人的差旅費", desc: "其他成員填報的差旅費", parent: "travel" },
    ],
  },
];

export const countOn = (p: Perms) =>
  PERM_GROUPS.flatMap((g) => g.items).filter((i) => p[i.key] === true && (!i.parent || p[i.parent] === true)).length;
export const totalPerms = PERM_GROUPS.flatMap((g) => g.items).length;

// 上層開關關閉時，下層開關一律視為關閉（例如沒有財務金額就不能進財務中心）
export const effectivePerms = (p: Perms): Perms => {
  const out = { ...p };
  for (const i of PERM_GROUPS.flatMap((g) => g.items)) if (i.parent && !out[i.parent]) (out as Record<string, unknown>)[i.key] = false;
  return out;
};
