// 權限層級沿用恆永「權限」分頁的三級：高－主管、中－專員、低－顧問；細項再以開關調整
export type RolePreset = "主管" | "專員" | "顧問";

export type Perms = {
  dashboard: boolean;
  cases: boolean;
  casesScope: "all" | "own";
  casesCreate: boolean;
  casesEdit: boolean;
  caseEmail: boolean;
  caseDocs: boolean;
  caseSchedule: boolean;
  reviewContent: boolean;
  reviewPrice: boolean;
  customers: boolean;
  customersEdit: boolean;
  customerContact: boolean;
  travel: boolean;
  travelAll: boolean;
  financeAmounts: boolean;
  financeCenter: boolean;
  financeRecord: boolean;
  payables: boolean;
  exportExcel: boolean;
  audit: boolean;
  gmail: boolean;
  members: boolean;
  settings: boolean;
};

export type Member = {
  id: string;
  name: string;
  nickname?: string;
  email: string;
  title: string;
  phone?: string;
  role: RolePreset;
  isOwner?: boolean;
  status: "active" | "invited";
  invitedAt?: string;
  invitedBy?: string;
  joinedAt?: string;
  lastActive?: string;
  color: string;
  avatar?: string; // 頭像圖片路徑
  perms: Perms;
};

export type Customer = {
  id: string;
  code: string; // 系統客戶編號
  enCode: string; // 案件編號用英文代碼
  short: string; // 客戶簡稱
  pinyin: string; // Drive 第 1 層英文標頭
  name: string;
  taxId: string;
  industry: string;
  region: string;
  sites: string[];
  contact: { name: string; title?: string; phone: string; email: string };
  address: string;
  invoiceTitle: string;
  invoiceAddress: string;
  referral: { type: "驗證單位介紹" | "舊客戶轉介" | "官網" | "其他"; source: string };
  domain: string;
  note?: string;
  createdAt: string;
};

// 客戶關係（8/13 訪談：供應鏈上下游、客戶介紹客戶；kickoff：集團層級）
// 集團：from 為母公司、to 為子公司；介紹：from 介紹了 to；供應鏈：from 為上游、to 為下游
export type RelationType = "集團" | "介紹" | "供應鏈";
export type CustomerRelation = { id: string; from: string; to: string; type: RelationType };

// 案件列表的個人檢視（篩選、分組、版面），只屬於建立的人
export type CaseFilters = { status: string[]; item: string[]; line: string[]; member: string[]; industry: string[]; region: string[]; verifier: string[]; year: string[] };
export type CaseLayout = "list" | "board" | "gantt" | "calendar";
export type CaseGroup = "status" | "phase" | "item" | "line" | "owner" | "none";
export type DateField = "createdAt" | "visit" | "proposalSent" | "signed" | "courseStart" | "audit" | "certified" | "certExpiry";
export type DateCond = { id: string; field: DateField; op: "between" | "empty" | "filled"; from?: string; to?: string };
export type SavedView = { id: string; owner: string; name: string; filters: CaseFilters; dates?: DateCond[]; group: CaseGroup; layout: CaseLayout };

export type CaseStatus =
  | "洽詢中"
  | "企劃書撰寫中"
  | "內容審核中"
  | "核價審核中"
  | "已報價待回簽"
  | "已簽約排課中"
  | "輔導中"
  | "稽核中"
  | "已取證"
  | "續證期";

export type ReviewState = "none" | "drafting" | "content" | "price" | "approved";

export type ReviewEvent = {
  time: string;
  by: string;
  action: "送出審核" | "內容核可" | "核價核可" | "退回";
  stage?: "內容" | "核價";
  note?: string;
};

export type PriceTier = { list: number; base: number; special: number };

export type Period = {
  id: string;
  n: number;
  pct: number;
  amount: number; // 未稅
  trigger: "開課" | "取證" | "自訂";
  customDate?: string;
  notifyDate?: string; // 通知財務開票的日期
  invoiceNo?: string;
  invoiceDate?: string;
  invoiceKind?: "紙本" | "電子發票";
  paidDate?: string;
  note?: string;
};

export type Milestones = {
  visit?: string;
  proposalSent?: string;
  signed?: string;
  courseStart?: string;
  audits: string[];
  certified?: string;
  certExpiry?: string;
};

export type OwnerChange = { time: string; from: string; to: string; by: string };

export type Case = {
  id: string;
  customerId: string;
  site?: string;
  item: string;
  category: "新案" | "續證" | "追加輔導" | "轉證";
  year: string;
  owner: string; // member id
  coOwners: string[];
  verifier: string;
  contractSessions: number;
  folder?: { url: string; name: string; sharedWith: string[] };
  review: ReviewState;
  reviewLog: ReviewEvent[];
  pricing: { coaching: PriceTier; audit: PriceTier };
  milestones: Milestones;
  periods: Period[];
  invoiceItem: string;
  invoiceNote: string;
  previousCase?: string;
  noRenew?: boolean;
  // 手動設定的狀態：有值時以此為準；manualBasis 為設定當下依日期推得的狀態，之後資料變動時用來提出建議
  manualStatus?: CaseStatus;
  manualBasis?: CaseStatus;
  ownerLog: OwnerChange[];
  createdAt: string;
  createdBy: string;
};

export type CalEvent = {
  id: string;
  memberId: string;
  date: string;
  start: string;
  end: string;
  title: string;
  kind: "排課" | "稽核" | "拜訪" | "其他";
  location?: string;
  caseId?: string; // 已連結到案件（排課分頁）
  link: string;
};

export type EmailThread = {
  id: string;
  mailbox: string; // member id
  fromName: string;
  fromEmail: string;
  subject: string;
  snippet: string;
  body: string[];
  signature?: string[];
  date: string;
  time: string;
  count: number;
  unread?: boolean;
  hasAttachment?: string;
  state: "suggested" | "linked" | "ignored" | "none";
  caseId?: string;
  suggestedCaseIds?: string[];
  reasons?: string[];
  linkedBy?: string;
  linkedAt?: string;
};

export type DriveFile = { name: string; folder: string; modified: string; by: string; kind: "doc" | "sheet" | "pdf" | "image" | "folder" };

export type Travel = {
  id: string;
  date: string;
  memberId: string;
  category: "交通費" | "住宿費" | "膳食費" | "其他費用";
  detail: string;
  amount: number;
  caseId?: string;
  link: "系統建議已確認" | "人工手動指定" | "未歸戶";
  createdAt: string;
};

export type Payable = {
  id: string;
  memberId: string;
  caseId: string;
  desc: string;
  requestDate: string;
  amount: number;
  invoiceTitle: string;
  taxId: string;
  invoiceNo?: string;
  account: string;
  status: "待核准" | "已核准" | "已付款";
  paidDate?: string;
};

export type AuditEntry = {
  id: string;
  time: string;
  actor: string;
  module: "案件" | "客戶" | "財務" | "差旅費" | "成員與權限" | "系統設定" | "Email";
  caseId?: string;
  target: string;
  action: string;
  before?: string;
  after?: string;
};

export type NotifType =
  | "待審核（內容）"
  | "待審核（核價）"
  | "審核退回"
  | "審核核可・待寄送企劃書"
  | "待回簽"
  | "堂數不符"
  | "信件待確認"
  | "發票待開立（第一期）"
  | "發票待開立（取證後各期）"
  | "收款逾期"
  | "差旅費填報提醒"
  | "差旅費未歸戶"
  | "續證準備"
  | "續證再提醒"
  | "證書即將到期";

export type Recipient = "owner" | "admin" | "finance" | "exec" | "partner" | "reporter";

export type NotifHit = {
  key: string;
  type: NotifType;
  group: "案件進度" | "發票與請款" | "差旅費報帳" | "證書到期與續證";
  title: string;
  desc: string;
  caseId?: string;
  memberId?: string; // 案件負責人或填報人
  members?: string[]; // 案件負責人與協作者
  recipients: Recipient[];
  email: boolean;
  done: string;
  goto: "case" | "travel" | "email" | "finance";
  tab?: string;
};

export type Notif = NotifHit & {
  status: "未讀" | "已讀" | "已完成";
  createdAt: string;
  completedAt?: string;
};

export type Settings = {
  renewDays: [number, number, number];
  signWaitDays: number;
  overdueDays: number;
  unassignedDays: number;
  travelRemindDay: number;
  items: string[];
  workspaceName: string;
};
