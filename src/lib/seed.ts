import { PRESETS } from "./perms";
import type {
  Perms,
  AuditEntry,
  CalEvent,
  Case,
  Customer,
  EmailThread,
  Member,
  Notif,
  Payable,
  PriceTier,
  Settings,
  ThreadMessage,
  Travel,
} from "./types";

export const ITEMS = [
  "ISCC EU",
  "ISCC PLUS",
  "ISCC CORSIA",
  "FSC",
  "ISO 9001",
  "ISO 14001",
  "ISO 14064-1",
  "ISO 14064-1 組織溫室氣體盤查",
  "ISO 14067 產品碳足跡",
  "ISO 22716",
  "ISO 27001",
  "ISO 45001",
  "IECQ QC 080000",
  "GRS",
  "SMETA",
  "EcoVadis",
  "HACCP",
  "FSSC",
  "碳排放先期評估",
  "星巴克稽核",
  "驗廠輔導",
  "廢清案",
  "辦理清除許可證變更作業",
  "30人-FSC",
  "30人-ISCC",
  "30人-ISO",
  "其他-FSC和其他",
  "其他-FSC和其他-雙數驗證項目",
  "其他-ISCC-雙數驗證項目",
  "其他-旅運費",
  "其他-其他雜項",
];

export const VERIFIERS = ["BV", "SGS", "TÜV NORD", "Control Union", "DNV", "Intertek"];
export const INDUSTRIES = ["油脂化工", "塑化", "造紙", "印刷", "木材加工", "生質能源", "精密機械", "食品", "紡織", "包材", "化工", "化妝品", "成衣", "鋼鐵"];
export const REGIONS = ["台北市", "新北市", "桃園市", "新竹縣", "台中市", "彰化縣", "南投縣", "雲林縣", "台南市", "高雄市", "屏東縣"];

// 示範頭像：Radian UI avatars（MIT），見 public/avatars/NOTICE.txt
const AVATAR: Record<string, string> = Object.fromEntries(["exec1", "partner", "admin1", "admin2", "con1", "con2", "con3", "fin", "ext"].map((id, i) => [id, `/avatars/${i + 1}.png`]));

const m = (
  id: string,
  name: string,
  email: string,
  title: string,
  role: Member["role"],
  color: string,
  extra: Partial<Member> = {},
  override: Partial<Perms> = {},
): Member => ({
  id,
  name,
  email,
  title,
  role,
  color,
  status: "active",
  joinedAt: "2026/09/15",
  lastActive: "今天",
  perms: { ...PRESETS[role], ...override },
  avatar: AVATAR[id],
  ...extra,
});

export const membersSeed: Member[] = [
  m("exec1", "林雅婷", "yating.lin@staygold-demo.com", "營運主管", "主管", "#32716A", {
    isOwner: true,
    phone: "0912-345-678",
    joinedAt: "2026/09/01",
  }),
  m("partner", "吳承翰", "chenghan.wu@staygold-demo.com", "合夥人", "主管", "#7C5CBF", { lastActive: "昨天" }, { reviewPrice: false, members: false, settings: false, financeRecord: false, payables: false }),
  m("admin1", "蔡宜庭", "yiting.tsai@staygold-demo.com", "行政專員", "專員", "#C2733D", { google: { gmail: "none" } }),
  m("admin2", "許雅雯", "yawen.hsu@staygold-demo.com", "行政專員", "專員", "#D0884E", { lastActive: "2 小時前" }),
  m("con1", "張書豪", "shuhao.chang@staygold-demo.com", "資深顧問", "顧問", "#3B6FB6", { google: { calendar: "expired" } }),
  m("con2", "李柏翰", "pohan.lee@staygold-demo.com", "顧問", "顧問", "#2F8F9D", { lastActive: "昨天" }),
  m("con3", "王志明", "chihming.wang@staygold-demo.com", "顧問", "顧問", "#5E8C3A"),
  m("fin", "黃韻如", "yunju.huang@staygold-demo.com", "財務專員", "專員", "#B4536A", { lastActive: "3 天前" }, { casesScope: "all", casesCreate: false, casesEdit: false, caseEmail: false, caseDocs: false, caseSchedule: false, customersEdit: false, gmail: false, financeAmounts: true, financeCenter: true, financeRecord: true, payables: true, exportExcel: true, audit: true }),
  m("ext", "周建宏", "jianhong.chou@gmail.com", "顧問", "外部顧問", "#8A8F3C", { joinedAt: "2026/10/02", lastActive: "昨天", google: { gmail: "none" } }),
  m("yian", "yian.chen", "yian.chen@staygold-demo.com", "顧問", "顧問", "#5E8C3A", {
    avatar: undefined,
    status: "invited",
    invitedAt: "2026/10/27",
    invitedBy: "exec1",
    joinedAt: undefined,
    lastActive: undefined,
  }),
];

const contact = (name: string, title: string, phone: string, email: string) => ({ name, title, phone, email });

export const customersSeed: Customer[] = [
  { id: "c1", code: "C-0031", enCode: "SINJI", short: "新吉成", pinyin: "X", name: "新吉成實業股份有限公司", taxId: "28476193", industry: "油脂化工", region: "台南市", sites: [], contact: contact("鄭雅文", "品保課長", "06-2615-338", "yawen.cheng@sinji-oil.com.tw"), address: "台南市安南區工業二路 61 號", invoiceTitle: "新吉成實業股份有限公司", invoiceAddress: "台南市安南區工業二路 61 號", referral: { type: "驗證單位介紹", source: "Control Union / 陳經理" }, domain: "sinji-oil.com.tw", createdAt: "2024/12/10" },
  { id: "c2", code: "C-0044", enCode: "TAIYA", short: "台亞塑化", pinyin: "T", name: "台亞塑化工業股份有限公司", taxId: "53810267", industry: "塑化", region: "高雄市", sites: ["仁武廠", "林園廠"], contact: contact("陳國輝", "環安課長", "07-3712-905", "chen.kh@taiya-petro.com.tw"), address: "高雄市仁武區八德南路 220 號", invoiceTitle: "台亞塑化工業股份有限公司", invoiceAddress: "高雄市仁武區八德南路 220 號", referral: { type: "舊客戶轉介", source: "立昇化工 / 王副理" }, domain: "taiya-petro.com.tw", createdAt: "2026/09/24" },
  { id: "c3", code: "C-0038", enCode: "JINHE", short: "金禾紙品", pinyin: "J", name: "金禾紙品有限公司", taxId: "90215478", industry: "造紙", region: "彰化縣", sites: [], contact: contact("許志明", "廠長", "04-8823-117", "jm.hsu@jinhe-paper.com.tw"), address: "彰化縣芳苑鄉工區一路 18 號", invoiceTitle: "金禾紙品有限公司", invoiceAddress: "彰化縣芳苑鄉工區一路 18 號", referral: { type: "驗證單位介紹", source: "BV / Lucas" }, domain: "jinhe-paper.com.tw", createdAt: "2026/08/20" },
  { id: "c4", code: "C-0040", enCode: "CHENGYING", short: "承穎印刷", pinyin: "C", name: "承穎彩色印刷股份有限公司", taxId: "16639052", industry: "印刷", region: "台南市", sites: [], contact: contact("林淑芬", "管理部經理", "06-2532-480", "sf.lin@chengying-print.com"), address: "台南市永康區中正南路 702 號", invoiceTitle: "承穎彩色印刷股份有限公司", invoiceAddress: "台南市永康區中正南路 702 號", referral: { type: "驗證單位介紹", source: "SGS / Amy" }, domain: "chengying-print.com", createdAt: "2026/09/03" },
  { id: "c5", code: "C-0047", enCode: "SENMAO", short: "森茂木業", pinyin: "S", name: "森茂木業股份有限公司", taxId: "", industry: "木材加工", region: "南投縣", sites: [], contact: contact("黃建銘", "總經理特助", "049-2251-336", "jm.huang@senmao-wood.com"), address: "南投縣南投市南崗三路 95 號", invoiceTitle: "", invoiceAddress: "", referral: { type: "官網", source: "官網聯絡表單" }, domain: "senmao-wood.com", createdAt: "2026/10/21" },
  { id: "c6", code: "C-0042", enCode: "LVNENG", short: "綠能生質", pinyin: "L", name: "綠能生質科技股份有限公司", taxId: "42917635", industry: "生質能源", region: "雲林縣", sites: [], contact: contact("吳宗翰", "研發經理", "05-6931-220", "th.wu@lvneng-bio.com.tw"), address: "雲林縣麥寮鄉中興村工業路 3 號", invoiceTitle: "綠能生質科技股份有限公司", invoiceAddress: "雲林縣麥寮鄉中興村工業路 3 號", referral: { type: "舊客戶轉介", source: "新吉成實業 / 鄭雅文" }, domain: "lvneng-bio.com.tw", createdAt: "2026/08/14" },
  { id: "c7", code: "C-0035", enCode: "HONGSHUO", short: "宏碩精密", pinyin: "H", name: "宏碩精密工業股份有限公司", taxId: "27705841", industry: "精密機械", region: "台中市", sites: [], contact: contact("張家豪", "品保經理", "04-2359-6618", "chiahao.chang@hongshuo.com.tw"), address: "台中市西屯區工業區三十八路 27 號", invoiceTitle: "宏碩精密工業股份有限公司", invoiceAddress: "台中市西屯區工業區三十八路 27 號", referral: { type: "驗證單位介紹", source: "TÜV NORD / Kevin" }, domain: "hongshuo.com.tw", createdAt: "2026/03/02" },
  { id: "c8", code: "C-0036", enCode: "HECHANG", short: "和昌食品", pinyin: "H", name: "和昌食品股份有限公司", taxId: "84390126", industry: "食品", region: "屏東縣", sites: [], contact: contact("蔡美玲", "品管主任", "08-7623-445", "ml.tsai@hechang-food.com.tw"), address: "屏東縣屏東市工業五路 12 號", invoiceTitle: "和昌食品股份有限公司", invoiceAddress: "屏東縣屏東市工業五路 12 號", referral: { type: "舊客戶轉介", source: "大宇美妝 / 何經理" }, domain: "hechang-food.com.tw", createdAt: "2026/04/18" },
  { id: "c9", code: "C-0041", enCode: "GUANGCAI", short: "光彩紡織", pinyin: "G", name: "光彩紡織股份有限公司", taxId: "70358214", industry: "紡織", region: "桃園市", sites: [], contact: contact("李欣怡", "永續專員", "03-3861-502", "hy.lee@guangcai-tex.com"), address: "桃園市觀音區工業五路 8 號", invoiceTitle: "光彩紡織股份有限公司", invoiceAddress: "桃園市觀音區工業五路 8 號", referral: { type: "驗證單位介紹", source: "Control Union / 林小姐" }, domain: "guangcai-tex.com", createdAt: "2026/08/30" },
  { id: "c10", code: "C-0045", enCode: "JIAHE", short: "佳和包材", pinyin: "J", name: "佳和包裝材料股份有限公司", taxId: "35162870", industry: "包材", region: "新北市", sites: [], contact: contact("周育成", "業務副理", "02-2298-7731", "yc.chou@jiahe-pack.com"), address: "新北市五股區五權路 33 號", invoiceTitle: "佳和包裝材料股份有限公司", invoiceAddress: "新北市五股區五權路 33 號", referral: { type: "舊客戶轉介", source: "承穎印刷 / 林淑芬" }, domain: "jiahe-pack.com", createdAt: "2026/09/30" },
  { id: "c11", code: "C-0022", enCode: "LISHENG", short: "立昇化工", pinyin: "L", name: "立昇化學工業股份有限公司", taxId: "12048597", industry: "化工", region: "高雄市", sites: ["大社廠", "觀音廠"], contact: contact("王俊傑", "環安副理", "07-3513-280", "cj.wang@lisheng-chem.com.tw"), address: "高雄市大社區興工路 6 號", invoiceTitle: "立昇化學工業股份有限公司", invoiceAddress: "高雄市大社區興工路 6 號", referral: { type: "驗證單位介紹", source: "DNV / 黃經理" }, domain: "lisheng-chem.com.tw", createdAt: "2024/05/16" },
  { id: "c12", code: "C-0029", enCode: "DAYU", short: "大宇美妝", pinyin: "D", name: "大宇美妝生技股份有限公司", taxId: "54728361", industry: "化妝品", region: "新竹縣", sites: [], contact: contact("何佩珊", "品保經理", "03-5982-117", "ps.ho@dayu-beauty.com"), address: "新竹縣湖口鄉光復北路 52 號", invoiceTitle: "大宇美妝生技股份有限公司", invoiceAddress: "新竹縣湖口鄉光復北路 52 號", referral: { type: "驗證單位介紹", source: "SGS / Amy" }, domain: "dayu-beauty.com", createdAt: "2025/03/11" },
  { id: "c13", code: "C-0048", enCode: "WEIXIN", short: "維新製衣", pinyin: "W", name: "維新製衣股份有限公司", taxId: "", industry: "成衣", region: "台北市", sites: [], contact: contact("郭思妤", "CSR 專員", "02-2765-3302", "sy.kuo@weixin-apparel.com"), address: "台北市內湖區瑞光路 513 號", invoiceTitle: "", invoiceAddress: "", referral: { type: "官網", source: "官網聯絡表單" }, domain: "weixin-apparel.com", createdAt: "2026/10/27" },
];

export const relationsSeed: import("./types").CustomerRelation[] = [
  { id: "r1", from: "c11", to: "c2", type: "介紹" },
  { id: "r2", from: "c1", to: "c6", type: "介紹" },
  { id: "r3", from: "c12", to: "c8", type: "介紹" },
  { id: "r4", from: "c4", to: "c10", type: "介紹" },
  { id: "r5", from: "c1", to: "c6", type: "供應鏈" },
  { id: "r6", from: "c3", to: "c4", type: "供應鏈" },
  { id: "r7", from: "c9", to: "c13", type: "供應鏈" },
];

const tier = (list: number, base: number, special: number): PriceTier => ({ list, base, special });
const EMPTY_TIER = tier(0, 0, 0);
const folder = (name: string, sharedWith: string[]) => ({
  url: `https://drive.google.com/drive/folders/1${name.length}${Math.abs(hash(name)).toString(36)}`,
  name,
  sharedWith,
});
function hash(s: string) {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return h;
}
const STAFF = ["exec1", "partner", "admin1", "admin2", "fin"];

const base = {
  coOwners: [] as string[],
  ownerLog: [],
  reviewLog: [],
  periods: [],
  invoiceNote: "",
  createdBy: "admin1",
} satisfies Partial<Case>;

// 建立案件的專員同時是案件協作者
function withCollaborators(list: Case[]): Case[] {
  return list.map((c) => (c.createdBy.startsWith("admin") && !c.coOwners.includes(c.createdBy) ? { ...c, coOwners: [...c.coOwners, c.createdBy] } : c));
}

export const casesSeed: Case[] = withCollaborators([
  {
    ...base,
    id: "SINJI-ISCC-2025-01", customerId: "c1", item: "ISCC EU", category: "新案", year: "2025", owner: "con3", verifier: "Control Union", contractSessions: 6,
    folder: folder("新吉成-ISCC-2025", [...STAFF, "con3"]),
    review: "approved",
    reviewLog: [
      { time: "2025/03/12 10:20", by: "con3", action: "送出審核" },
      { time: "2025/03/14 15:02", by: "partner", action: "內容核可", stage: "內容" },
      { time: "2025/03/17 09:40", by: "exec1", action: "核價核可", stage: "核價" },
    ],
    pricing: { coaching: tier(400000, 380000, 360000), audit: tier(70000, 65000, 60000) },
    milestones: { visit: "2025-03-05", proposalSent: "2025-03-20", signed: "2025-04-02", courseStart: "2025-05-06", audits: ["2025-09-15"], certified: "2025-11-12", certExpiry: "2026-11-11" },
    periods: [
      { id: "p1", n: 1, pct: 50, amount: 210000, trigger: "開課", invoiceNo: "QA-21874530", invoiceDate: "2025-05-08", invoiceKind: "電子發票", paidDate: "2025-06-20" },
      { id: "p2", n: 2, pct: 50, amount: 210000, trigger: "取證", invoiceNo: "QA-23106642", invoiceDate: "2025-11-20", invoiceKind: "電子發票", paidDate: "2026-01-15" },
    ],
    invoiceItem: "ISCC EU 驗證輔導服務費", invoiceNote: "ISCC EU 輔導 6 堂＋陪同稽核 1 次",
    ownerLog: [{ time: "2025/02/26 11:00", from: "—", to: "con3", by: "admin1" }],
    createdAt: "2025/02/26", createdBy: "admin1",
  },
  {
    ...base,
    id: "SINJI-ISCC-2026-01", customerId: "c1", item: "ISCC EU", category: "續證", year: "2026", owner: "con3", verifier: "Control Union", contractSessions: 6,
    previousCase: "SINJI-ISCC-2025-01",
    folder: folder("新吉成-ISCC-2026", [...STAFF, "con3"]),
    review: "approved",
    reviewLog: [
      { time: "2026/06/16 14:10", by: "con3", action: "送出審核" },
      { time: "2026/06/18 10:00", by: "partner", action: "內容核可", stage: "內容" },
      { time: "2026/06/22 16:45", by: "exec1", action: "核價核可", stage: "核價" },
    ],
    pricing: { coaching: tier(420000, 400000, 380000), audit: tier(70000, 65000, 60000) },
    milestones: { visit: "2026-06-10", proposalSent: "2026-06-24", signed: "2026-07-08", courseStart: "2026-08-05", audits: [] },
    periods: [
      { id: "p1", n: 1, pct: 50, amount: 220000, trigger: "開課", invoiceNo: "QA-27719054", invoiceDate: "2026-08-12", invoiceKind: "電子發票" },
      { id: "p2", n: 2, pct: 50, amount: 220000, trigger: "取證" },
    ],
    invoiceItem: "ISCC EU 驗證輔導服務費", invoiceNote: "ISCC EU 續證輔導 6 堂＋陪同稽核 1 次",
    ownerLog: [
      { time: "2026/05/30 09:12", from: "—", to: "con2", by: "admin1" },
      { time: "2026/06/03 13:30", from: "con2", to: "con3", by: "exec1" },
    ],
    createdAt: "2026/05/30",
  },
  {
    ...base,
    id: "TAIYA-仁武廠-ISO14064-2026-01", customerId: "c2", site: "仁武廠", item: "ISO 14064-1", category: "新案", year: "2026", owner: "con1", verifier: "BV", contractSessions: 8,
    review: "price",
    reviewLog: [
      { time: "2026/10/20 17:05", by: "con1", action: "送出審核" },
      { time: "2026/10/23 11:30", by: "partner", action: "內容核可", stage: "內容", note: "盤查邊界含外包運輸，範疇三請在企劃書附錄說明。" },
    ],
    pricing: { coaching: tier(480000, 450000, 420000), audit: tier(80000, 72000, 65000) },
    milestones: { visit: "2026-10-02", audits: [] },
    periods: [
      { id: "p1", n: 1, pct: 50, amount: 242500, trigger: "開課" },
      { id: "p2", n: 2, pct: 50, amount: 242500, trigger: "取證" },
    ],
    invoiceItem: "ISO 14064-1 溫室氣體盤查輔導服務費", invoiceNote: "仁武廠 ISO 14064-1 盤查輔導 8 堂＋查證陪同",
    ownerLog: [{ time: "2026/09/24 10:40", from: "—", to: "con1", by: "con1" }],
    createdAt: "2026/09/24", createdBy: "con1",
  },
  {
    ...base,
    id: "TAIYA-林園廠-ISO14064-2026-01", customerId: "c2", site: "林園廠", item: "ISO 14064-1", category: "新案", year: "2026", owner: "con1", verifier: "BV", contractSessions: 6,
    review: "content",
    reviewLog: [{ time: "2026/10/27 18:20", by: "con1", action: "送出審核" }],
    pricing: { coaching: tier(380000, 360000, 340000), audit: tier(80000, 72000, 65000) },
    milestones: { visit: "2026-10-02", audits: [] },
    periods: [
      { id: "p1", n: 1, pct: 50, amount: 202500, trigger: "開課" },
      { id: "p2", n: 2, pct: 50, amount: 202500, trigger: "取證" },
    ],
    invoiceItem: "ISO 14064-1 溫室氣體盤查輔導服務費", invoiceNote: "林園廠 ISO 14064-1 盤查輔導 6 堂",
    ownerLog: [{ time: "2026/09/24 10:52", from: "—", to: "con1", by: "con1" }],
    createdAt: "2026/09/24", createdBy: "con1",
  },
  {
    ...base,
    id: "JINHE-FSC-2026-01", customerId: "c3", item: "FSC", category: "新案", year: "2026", owner: "con2", verifier: "BV", contractSessions: 4,
    folder: folder("金禾紙品-FSC-2026", [...STAFF, "con2"]),
    review: "approved",
    reviewLog: [
      { time: "2026/09/15 10:00", by: "con2", action: "送出審核" },
      { time: "2026/09/18 09:20", by: "partner", action: "內容核可", stage: "內容" },
      { time: "2026/09/24 14:00", by: "exec1", action: "核價核可", stage: "核價" },
    ],
    pricing: { coaching: tier(180000, 165000, 150000), audit: tier(40000, 36000, 32000) },
    milestones: { visit: "2026-08-28", proposalSent: "2026-09-29", audits: [] },
    periods: [
      { id: "p1", n: 1, pct: 50, amount: 91000, trigger: "開課" },
      { id: "p2", n: 2, pct: 50, amount: 91000, trigger: "取證" },
    ],
    invoiceItem: "FSC 驗證輔導服務費",
    ownerLog: [{ time: "2026/08/20 16:00", from: "—", to: "con2", by: "admin1" }],
    createdAt: "2026/08/20",
  },
  {
    ...base,
    id: "CHENGYING-FSC-2026-01", customerId: "c4", item: "FSC", category: "新案", year: "2026", owner: "con2", verifier: "SGS", contractSessions: 4,
    folder: folder("承穎印刷-FSC-2026", [...STAFF, "con2"]),
    review: "approved",
    reviewLog: [
      { time: "2026/10/19 11:00", by: "con2", action: "送出審核" },
      { time: "2026/10/22 15:40", by: "partner", action: "內容核可", stage: "內容" },
      { time: "2026/10/27 10:15", by: "exec1", action: "核價核可", stage: "核價" },
    ],
    pricing: { coaching: tier(180000, 165000, 160000), audit: tier(40000, 36000, 36000) },
    milestones: { visit: "2026-09-10", audits: [] },
    periods: [
      { id: "p1", n: 1, pct: 50, amount: 98000, trigger: "開課" },
      { id: "p2", n: 2, pct: 50, amount: 98000, trigger: "取證" },
    ],
    invoiceItem: "FSC 驗證輔導服務費",
    ownerLog: [{ time: "2026/09/03 10:00", from: "—", to: "con2", by: "admin2" }],
    createdAt: "2026/09/03", createdBy: "admin2",
  },
  {
    ...base,
    id: "SENMAO-FSC-2026-01", customerId: "c5", item: "FSC", category: "新案", year: "2026", owner: "con2", verifier: "", contractSessions: 0,
    review: "none",
    pricing: { coaching: EMPTY_TIER, audit: EMPTY_TIER },
    milestones: { audits: [] },
    invoiceItem: "FSC 驗證輔導服務費",
    ownerLog: [{ time: "2026/10/21 09:30", from: "—", to: "con2", by: "admin2" }],
    createdAt: "2026/10/21", createdBy: "admin2",
  },
  {
    ...base,
    id: "LVNENG-ISCCPLUS-2026-01", customerId: "c6", item: "ISCC PLUS", category: "新案", year: "2026", owner: "con3", verifier: "Control Union", contractSessions: 5,
    folder: folder("綠能生質-ISCCPLUS-2026", [...STAFF, "con3"]),
    review: "approved",
    reviewLog: [
      { time: "2026/08/27 10:00", by: "con3", action: "送出審核" },
      { time: "2026/08/29 14:20", by: "partner", action: "內容核可", stage: "內容" },
      { time: "2026/09/02 09:00", by: "exec1", action: "核價核可", stage: "核價" },
    ],
    pricing: { coaching: tier(320000, 300000, 285000), audit: tier(60000, 55000, 50000) },
    milestones: { visit: "2026-08-20", proposalSent: "2026-09-05", signed: "2026-10-15", audits: [] },
    periods: [
      { id: "p1", n: 1, pct: 50, amount: 167500, trigger: "開課" },
      { id: "p2", n: 2, pct: 50, amount: 167500, trigger: "取證" },
    ],
    invoiceItem: "ISCC PLUS 驗證輔導服務費",
    ownerLog: [{ time: "2026/08/14 15:00", from: "—", to: "con3", by: "admin1" }],
    createdAt: "2026/08/14",
  },
  {
    ...base,
    id: "HONGSHUO-ISO9001-2026-01", customerId: "c7", item: "ISO 9001", category: "新案", year: "2026", owner: "con1", coOwners: ["ext"], verifier: "TÜV NORD", contractSessions: 5,
    folder: folder("宏碩精密-ISO9001-2026", [...STAFF, "con1", "ext"]),
    review: "approved",
    reviewLog: [
      { time: "2026/03/16 10:00", by: "con1", action: "送出審核" },
      { time: "2026/03/18 11:00", by: "partner", action: "內容核可", stage: "內容" },
      { time: "2026/03/20 15:30", by: "exec1", action: "核價核可", stage: "核價" },
    ],
    pricing: { coaching: tier(260000, 240000, 230000), audit: tier(50000, 45000, 45000) },
    milestones: { visit: "2026-03-05", proposalSent: "2026-03-23", signed: "2026-04-10", courseStart: "2026-05-06", audits: ["2026-10-14"] },
    periods: [
      { id: "p1", n: 1, pct: 30, amount: 82500, trigger: "開課", invoiceNo: "QA-25530918", invoiceDate: "2026-05-08", invoiceKind: "紙本", paidDate: "2026-06-05" },
      { id: "p2", n: 2, pct: 40, amount: 110000, trigger: "自訂", customDate: "2026-08-31", invoiceNo: "QA-27936615", invoiceDate: "2026-09-02", invoiceKind: "紙本" },
      { id: "p3", n: 3, pct: 30, amount: 82500, trigger: "取證" },
    ],
    invoiceItem: "ISO 9001 品質管理系統輔導服務費",
    ownerLog: [{ time: "2026/03/02 14:00", from: "—", to: "con1", by: "admin1" }],
    createdAt: "2026/03/02",
  },
  {
    ...base,
    id: "HECHANG-HACCP-2026-01", customerId: "c8", item: "HACCP", category: "新案", year: "2026", owner: "con2", verifier: "SGS", contractSessions: 4,
    folder: folder("和昌食品-HACCP-2026", [...STAFF, "con2"]),
    review: "approved",
    pricing: { coaching: tier(160000, 150000, 140000), audit: tier(35000, 32000, 30000) },
    milestones: { visit: "2026-04-20", proposalSent: "2026-05-02", signed: "2026-05-14", courseStart: "2026-06-03", audits: ["2026-09-22"], certified: "2026-10-20" },
    periods: [
      { id: "p1", n: 1, pct: 50, amount: 85000, trigger: "開課", invoiceNo: "QA-26114702", invoiceDate: "2026-06-05", invoiceKind: "電子發票", paidDate: "2026-07-10" },
      { id: "p2", n: 2, pct: 50, amount: 85000, trigger: "取證", requestedAt: "2026-10-22", requestedBy: "con2", requestNote: "已取證，客戶要求本月開立" },
    ],
    invoiceItem: "HACCP 食品安全管制系統輔導服務費",
    ownerLog: [{ time: "2026/04/18 10:30", from: "—", to: "con2", by: "admin1" }],
    createdAt: "2026/04/18",
  },
  {
    ...base,
    id: "GUANGCAI-GRS-2026-01", customerId: "c9", item: "GRS", category: "新案", year: "2026", owner: "con3", verifier: "Control Union", contractSessions: 6,
    folder: folder("光彩紡織-GRS-2026", [...STAFF]),
    review: "approved",
    pricing: { coaching: tier(240000, 225000, 210000), audit: tier(45000, 40000, 40000) },
    milestones: { visit: "2026-08-25", proposalSent: "2026-09-04", signed: "2026-09-18", courseStart: "2026-10-06", audits: [] },
    periods: [
      { id: "p1", n: 1, pct: 50, amount: 125000, trigger: "開課" },
      { id: "p2", n: 2, pct: 50, amount: 125000, trigger: "取證" },
    ],
    invoiceItem: "GRS 全球回收標準驗證輔導服務費",
    ownerLog: [{ time: "2026/08/30 11:00", from: "—", to: "con3", by: "admin1" }],
    createdAt: "2026/08/30",
  },
  {
    ...base,
    id: "JIAHE-ISO14067-2026-01", customerId: "c10", item: "ISO 14067 產品碳足跡", category: "新案", year: "2026", owner: "con1", verifier: "SGS", contractSessions: 6,
    review: "drafting",
    reviewLog: [
      { time: "2026/10/15 16:30", by: "con1", action: "送出審核" },
      { time: "2026/10/19 10:10", by: "partner", action: "內容核可", stage: "內容" },
      { time: "2026/10/22 14:25", by: "exec1", action: "退回", stage: "核價", note: "特惠價低於報價基準 15%，請調整陪稽費用或補充折讓原因。" },
    ],
    pricing: { coaching: tier(300000, 280000, 238000), audit: tier(50000, 45000, 38000) },
    milestones: { visit: "2026-10-06", audits: [] },
    periods: [
      { id: "p1", n: 1, pct: 50, amount: 138000, trigger: "開課" },
      { id: "p2", n: 2, pct: 50, amount: 138000, trigger: "取證" },
    ],
    invoiceItem: "ISO 14067 產品碳足跡輔導服務費",
    ownerLog: [{ time: "2026/09/30 09:00", from: "—", to: "con1", by: "admin2" }],
    createdAt: "2026/09/30", createdBy: "admin2",
  },
  {
    ...base,
    id: "LISHENG-大社廠-ISO14001-2025-01", customerId: "c11", site: "大社廠", item: "ISO 14001", category: "新案", year: "2025", owner: "con1", verifier: "DNV", contractSessions: 5,
    folder: folder("立昇化工/大社廠-ISO14001-2025", [...STAFF, "con1"]),
    review: "approved",
    pricing: { coaching: tier(250000, 235000, 225000), audit: tier(50000, 45000, 45000) },
    milestones: { visit: "2025-05-02", proposalSent: "2025-05-20", signed: "2025-06-04", courseStart: "2025-07-01", audits: ["2025-11-18"], certified: "2025-12-10", certExpiry: "2027-03-20" },
    periods: [
      { id: "p1", n: 1, pct: 50, amount: 135000, trigger: "開課", invoiceNo: "QA-21990327", invoiceDate: "2025-07-03", invoiceKind: "紙本", paidDate: "2025-08-12" },
      { id: "p2", n: 2, pct: 50, amount: 135000, trigger: "取證", invoiceNo: "QA-23314509", invoiceDate: "2025-12-15", invoiceKind: "紙本", paidDate: "2026-02-03" },
    ],
    invoiceItem: "ISO 14001 環境管理系統輔導服務費",
    ownerLog: [
      { time: "2025/04/28 10:00", from: "—", to: "con2", by: "admin1" },
      { time: "2025/06/10 09:00", from: "con2", to: "con1", by: "exec1" },
    ],
    createdAt: "2025/04/28",
  },
  {
    ...base,
    id: "DAYU-ISO22716-2025-01", customerId: "c12", item: "ISO 22716", category: "新案", year: "2025", owner: "con2", verifier: "SGS", contractSessions: 4,
    folder: folder("大宇美妝-ISO22716-2025", [...STAFF, "con2"]),
    review: "approved",
    pricing: { coaching: tier(170000, 160000, 150000), audit: tier(35000, 32000, 30000) },
    milestones: { visit: "2025-04-01", proposalSent: "2025-04-15", signed: "2025-05-02", courseStart: "2025-06-10", audits: ["2025-10-30"], certified: "2025-11-26", certExpiry: "2026-11-25" },
    periods: [
      { id: "p1", n: 1, pct: 50, amount: 90000, trigger: "開課", invoiceNo: "QA-22011846", invoiceDate: "2025-06-12", invoiceKind: "電子發票", paidDate: "2025-07-30" },
      { id: "p2", n: 2, pct: 50, amount: 90000, trigger: "取證", invoiceNo: "QA-23290175", invoiceDate: "2025-12-03", invoiceKind: "電子發票" },
    ],
    invoiceItem: "ISO 22716 化粧品優良製造規範輔導服務費",
    ownerLog: [{ time: "2025/03/11 10:00", from: "—", to: "con2", by: "admin1" }],
    createdAt: "2025/03/11",
  },
  {
    ...base,
    id: "HONGSHUO-ISO45001-2026-01", customerId: "c7", item: "ISO 45001", category: "追加輔導", year: "2026", owner: "con1", verifier: "TÜV NORD", contractSessions: 5,
    folder: folder("宏碩精密-ISO45001-2026", [...STAFF, "con1"]),
    review: "approved",
    reviewLog: [
      { time: "2026/10/14 10:00", by: "con1", action: "送出審核" },
      { time: "2026/10/16 09:30", by: "partner", action: "內容核可", stage: "內容" },
      { time: "2026/10/21 11:20", by: "exec1", action: "核價核可", stage: "核價" },
    ],
    pricing: { coaching: tier(240000, 225000, 215000), audit: tier(45000, 42000, 40000) },
    milestones: { visit: "2026-10-08", proposalSent: "2026-10-26", audits: [] },
    periods: [
      { id: "p1", n: 1, pct: 50, amount: 127500, trigger: "開課" },
      { id: "p2", n: 2, pct: 50, amount: 127500, trigger: "取證" },
    ],
    invoiceItem: "ISO 45001 職業安全衛生管理系統輔導服務費",
    ownerLog: [{ time: "2026/10/08 17:00", from: "—", to: "con1", by: "con1" }],
    createdAt: "2026/10/08", createdBy: "con1",
  },
  {
    ...base,
    id: "WEIXIN-SMETA-2026-01", customerId: "c13", item: "SMETA", category: "新案", year: "2026", owner: "con2", verifier: "", contractSessions: 0,
    review: "none",
    pricing: { coaching: EMPTY_TIER, audit: EMPTY_TIER },
    milestones: { audits: [] },
    invoiceItem: "SMETA 社會責任稽核輔導服務費",
    ownerLog: [{ time: "2026/10/27 10:05", from: "—", to: "con2", by: "admin2" }],
    createdAt: "2026/10/27", createdBy: "admin2",
  },
]);

const ev = (
  id: string,
  memberId: string,
  date: string,
  title: string,
  kind: CalEvent["kind"],
  caseId?: string,
  start = "09:30",
  end = "12:30",
  location?: string,
): CalEvent => ({ id, memberId, date, start, end, title, kind, caseId, location, link: `https://calendar.google.com/calendar/event?eid=${id}` });

const sinji = ["08-05", "08-19", "09-02", "09-16", "09-30", "10-14", "10-28"];
export const eventsSeed: CalEvent[] = [
  ...sinji.map((d, i) => ev(`sj${i + 1}`, "con3", `2026-${d}`, `新吉成 ISCC EU 第${i + 1}堂`, "排課", "SINJI-ISCC-2026-01", "13:30", "17:00", "新吉成 安南廠")),
  ...["10-06", "10-13", "10-20", "10-27", "11-03", "11-10"].map((d, i) =>
    ev(`gc${i + 1}`, "con3", `2026-${d}`, `光彩紡織 GRS 第${i + 1}堂`, "排課", "GUANGCAI-GRS-2026-01", "09:30", "12:30", "光彩紡織 觀音廠"),
  ),
  ev("gc7", "con3", "2026-11-17", "光彩紡織 GRS 加課（TC 文件）", "排課", undefined, "09:30", "12:00", "光彩紡織 觀音廠"),
  ev("lv1", "con3", "2026-11-04", "綠能生質 ISCC PLUS 第1堂", "排課", "LVNENG-ISCCPLUS-2026-01", "09:30", "16:30", "綠能生質 麥寮廠"),
  ev("lv2", "con3", "2026-11-18", "綠能生質 ISCC PLUS 第2堂", "排課", "LVNENG-ISCCPLUS-2026-01", "09:30", "16:30", "綠能生質 麥寮廠"),
  ev("lv3", "con3", "2026-12-02", "綠能生質 ISCC PLUS 第3堂", "排課", undefined, "09:30", "16:30", "綠能生質 麥寮廠"),
  ...["05-06", "05-27", "06-17", "07-08", "07-29"].map((d, i) =>
    ev(`hs${i + 1}`, "con1", `2026-${d}`, `宏碩精密 ISO 9001 第${i + 1}堂`, "排課", "HONGSHUO-ISO9001-2026-01", "13:30", "17:30", "宏碩精密 台中廠"),
  ),
  ev("hsa", "con1", "2026-10-14", "宏碩精密 ISO 9001 驗證稽核（TÜV NORD）", "稽核", undefined, "09:00", "17:00", "宏碩精密 台中廠"),
  ev("ty1", "con1", "2026-10-02", "台亞塑化 ISO 14064-1 仁武廠＋林園廠 拜訪", "拜訪", undefined, "10:00", "15:00", "台亞塑化 仁武廠"),
  ev("hs-m", "con1", "2026-10-27", "宏碩精密 ISO 9001 稽核缺失改善討論", "其他", undefined, "10:00", "12:00", "宏碩精密 台中廠"),
  ev("ty2", "con1", "2026-10-27", "台亞塑化 ISO 14064-1 林園廠 盤查邊界現勘", "拜訪", undefined, "14:30", "17:00", "台亞塑化 林園廠"),
  ev("jh1", "con1", "2026-10-06", "佳和包材 ISO 14067 產品碳足跡 需求訪談", "拜訪", undefined, "14:00", "16:00", "佳和包材 五股廠"),
  ev("ty3", "con1", "2026-10-30", "台亞塑化 ISO 14064-1 仁武廠 盤查邊界確認會議", "其他", undefined, "10:00", "12:00", "台亞塑化 仁武廠"),
  ev("ls1", "con1", "2026-11-02", "立昇化工 ISO 14001 大社廠 續證需求訪談", "拜訪", undefined, "14:00", "16:00", "立昇化工 大社廠"),
  ev("hs-r", "con1", "2026-11-06", "宏碩精密 ISO 9001 缺失改善複查", "其他", undefined, "09:30", "11:30", "宏碩精密 台中廠"),
  ev("hs-t", "con1", "2026-11-20", "宏碩精密 ISO 9001 追查稽核（TÜV NORD）", "稽核", undefined, "09:00", "12:00", "宏碩精密 台中廠"),
  ev("sm1", "con2", "2026-10-28", "森茂木業 FSC 初次拜訪", "拜訪", undefined, "10:00", "12:00", "森茂木業 南投廠"),
  ...["06-03", "06-24", "07-15", "08-05"].map((d, i) =>
    ev(`hc${i + 1}`, "con2", `2026-${d}`, `和昌食品 HACCP 第${i + 1}堂`, "排課", "HECHANG-HACCP-2026-01", "09:30", "16:00", "和昌食品 屏東廠"),
  ),
  ev("hca", "con2", "2026-09-22", "和昌食品 HACCP 稽核（SGS）", "稽核", undefined, "09:00", "17:00", "和昌食品 屏東廠"),
  ev("wx1", "con2", "2026-11-05", "維新製衣 SMETA 需求訪談", "拜訪", undefined, "14:00", "15:30", "維新製衣 內湖總部"),
];

const threadsBase: EmailThread[] = [
  {
    id: "e1", mailbox: "con1", fromName: "陳國輝", fromEmail: "chen.kh@taiya-petro.com.tw",
    subject: "RE: 仁武廠 ISO 14064-1 盤查範疇確認", snippet: "張顧問您好，附件為仁武廠外包運輸商清單，範疇三的部分想再確認是否需要納入…",
    body: [
      "張顧問您好：",
      "附件為仁武廠的外包運輸商清單（共 7 家），範疇三的部分想再確認是否需要納入本次盤查邊界。",
      "另外，林園廠那邊的盤查會另外由製程課對口，下週再另行寄給您。",
      "麻煩您再協助確認，謝謝。",
    ],
    signature: ["陳國輝 環安課長", "台亞塑化工業股份有限公司 仁武廠", "07-3712-905"],
    date: "2026-10-29", time: "09:42", count: 4, unread: true, hasAttachment: "仁武廠-外包運輸商清單.xlsx",
    state: "suggested", suggestedCaseIds: ["TAIYA-仁武廠-ISO14064-2026-01", "TAIYA-林園廠-ISO14064-2026-01"],
    reasons: ["寄件網域 taiya-petro.com.tw 對應客戶「台亞塑化」", "主旨含「仁武廠」「ISO 14064」", "信件時間落在案件時程內"],
  },
  {
    id: "e2", mailbox: "con1", fromName: "張家豪", fromEmail: "chiahao.chang@hongshuo.com.tw",
    subject: "稽核缺失改善計畫（ISO 9001）", snippet: "張顧問好，TÜV 稽核開出的 2 項次要缺失，改善計畫初稿如附件…",
    body: [
      "張顧問好：",
      "10/14 TÜV NORD 稽核開出的 2 項次要缺失，改善計畫初稿如附件。",
      "預計 11/10 前回覆驗證單位，想請您先幫忙看過內容是否足夠。",
    ],
    signature: ["張家豪 品保經理", "宏碩精密工業股份有限公司"],
    date: "2026-10-28", time: "16:05", count: 2, unread: true, hasAttachment: "ISO9001-缺失改善計畫-261028-v1.docx",
    state: "suggested", suggestedCaseIds: ["HONGSHUO-ISO9001-2026-01"],
    reasons: ["寄件網域 hongshuo.com.tw 對應客戶「宏碩精密」", "主旨含「ISO 9001」", "信件時間落在案件時程內（稽核中）"],
  },
  {
    id: "e3", mailbox: "con1", fromName: "蔡佩君", fromEmail: "tsai.pj@hsingda-steel.com.tw",
    subject: "詢問 ISO 14064-1 碳盤查輔導", snippet: "您好，經 BV 的 Lucas 介紹，我們今年需要進行組織溫室氣體盤查，想詢問輔導方式與報價…",
    body: [
      "您好：",
      "經 BV 的 Lucas 介紹，敝公司今年需要進行組織溫室氣體盤查（ISO 14064-1），客戶端要求 2027 年第一季前完成查證。",
      "想詢問輔導的方式、時程與大概的報價，方便的話是否能安排時間到廠拜訪？",
    ],
    signature: ["蔡佩君 襄理", "興達鋼鐵股份有限公司 環安部", "07-6118-202"],
    date: "2026-10-28", time: "11:20", count: 1, unread: false,
    state: "none",
  },
  {
    id: "e4", mailbox: "con1", fromName: "王俊傑", fromEmail: "cj.wang@lisheng-chem.com.tw",
    subject: "大社廠 ISO 14001 續證時程詢問", snippet: "張顧問您好，大社廠 ISO 14001 證書明年 3 月到期，想先了解續證的準備時程…",
    body: ["張顧問您好：", "大社廠 ISO 14001 證書明年 3 月到期，想先了解續證的準備時程與今年是否需要先做內部稽核。", "另外觀音廠今年也有意願導入，再請一併評估。"],
    signature: ["王俊傑 環安副理", "立昇化學工業股份有限公司"],
    date: "2026-10-27", time: "10:12", count: 1,
    state: "suggested", suggestedCaseIds: ["LISHENG-大社廠-ISO14001-2025-01"],
    reasons: ["寄件網域 lisheng-chem.com.tw 對應客戶「立昇化工」", "主旨含「大社廠」「ISO 14001」"],
  },
  {
    id: "e5", mailbox: "con1", fromName: "周育成", fromEmail: "yc.chou@jiahe-pack.com",
    subject: "碳足跡盤查邊界說明", snippet: "附件為三項主力產品的 BOM 表，請顧問協助確認盤查邊界…",
    body: ["張顧問：", "附件為三項主力產品的 BOM 表，請顧問協助確認盤查邊界是否從搖籃到大門即可。"],
    signature: ["周育成 業務副理", "佳和包裝材料股份有限公司"],
    date: "2026-10-16", time: "14:40", count: 3, hasAttachment: "主力產品BOM-261016.xlsx",
    state: "linked", caseId: "JIAHE-ISO14067-2026-01", linkedBy: "con1", linkedAt: "2026/10/16 15:02",
  },
  {
    id: "e6", mailbox: "con1", fromName: "張家豪", fromEmail: "chiahao.chang@hongshuo.com.tw",
    subject: "第五堂課教材與簽到表", snippet: "張顧問，第五堂的簽到表與教材已上傳到共用資料夾…",
    body: ["張顧問：", "第五堂的簽到表與教材已上傳到共用資料夾，再麻煩確認。"],
    date: "2026-07-30", time: "09:10", count: 2,
    state: "linked", caseId: "HONGSHUO-ISO9001-2026-01", linkedBy: "con1", linkedAt: "2026/07/30 10:00",
  },
  {
    id: "e7", mailbox: "con1", fromName: "BV Taiwan", fromEmail: "newsletter@bv-events.com",
    subject: "【活動】2026 碳管理趨勢論壇 報名開始", snippet: "誠摯邀請您參加 2026 碳管理趨勢論壇…",
    body: ["誠摯邀請您參加 2026 碳管理趨勢論壇。"],
    date: "2026-10-26", time: "08:00", count: 1,
    state: "ignored",
  },
  {
    id: "z1", mailbox: "con3", fromName: "鄭雅文", fromEmail: "yawen.cheng@sinji-oil.com.tw",
    subject: "RE: 第八堂課時間調整", snippet: "王顧問好，11/11 那天廠內有年度消防演練，第八堂可否改到 11/13？",
    body: ["王顧問好：", "11/11 那天廠內有年度消防演練，第八堂可否改到 11/13（五）下午？", "麻煩您了。"],
    signature: ["鄭雅文 品保課長", "新吉成實業股份有限公司"],
    date: "2026-10-29", time: "08:55", count: 3, unread: true,
    state: "suggested", suggestedCaseIds: ["SINJI-ISCC-2026-01"],
    reasons: ["寄件網域 sinji-oil.com.tw 對應客戶「新吉成」", "主旨含「堂課」", "信件時間落在案件時程內（輔導中）"],
  },
  {
    id: "z2", mailbox: "con3", fromName: "吳宗翰", fromEmail: "th.wu@lvneng-bio.com.tw",
    subject: "第一堂課場地與出席名單", snippet: "王顧問您好，11/4 第一堂課安排在二樓會議室，出席名單如下…",
    body: ["王顧問您好：", "11/4 第一堂課安排在二樓會議室，出席名單共 9 人如附件。"],
    date: "2026-10-28", time: "15:30", count: 1, hasAttachment: "出席名單.xlsx",
    state: "suggested", suggestedCaseIds: ["LVNENG-ISCCPLUS-2026-01"],
    reasons: ["寄件網域 lvneng-bio.com.tw 對應客戶「綠能生質」", "信件時間落在案件時程內"],
  },
  {
    id: "z3", mailbox: "con3", fromName: "李欣怡", fromEmail: "hy.lee@guangcai-tex.com",
    subject: "GRS 交易證書 TC 申請文件", snippet: "顧問好，TC 申請需要的出貨單與發票已上傳…",
    body: ["顧問好：", "TC 申請需要的出貨單與發票已上傳到客戶文件上傳區。"],
    date: "2026-10-21", time: "11:00", count: 2,
    state: "linked", caseId: "GUANGCAI-GRS-2026-01", linkedBy: "con3", linkedAt: "2026/10/21 11:30",
  },
  {
    id: "r1", mailbox: "con2", fromName: "許志明", fromEmail: "jm.hsu@jinhe-paper.com.tw",
    subject: "RE: FSC 輔導企劃書", snippet: "李顧問您好，企劃書已收到，目前內部還在討論預算…",
    body: ["李顧問您好：", "企劃書已收到，目前內部還在討論預算，預計下週給您回覆。"],
    date: "2026-10-20", time: "17:12", count: 2,
    state: "suggested", suggestedCaseIds: ["JINHE-FSC-2026-01"],
    reasons: ["寄件網域 jinhe-paper.com.tw 對應客戶「金禾紙品」", "主旨含「FSC」「企劃書」"],
  },
  {
    id: "r2", mailbox: "con2", fromName: "蔡美玲", fromEmail: "ml.tsai@hechang-food.com.tw",
    subject: "HACCP 證書寄送地址", snippet: "李顧問好，證書請寄到屏東廠品管室…",
    body: ["李顧問好：", "證書請寄到屏東廠品管室，收件人寫我即可。"],
    date: "2026-10-22", time: "10:30", count: 1,
    state: "linked", caseId: "HECHANG-HACCP-2026-01", linkedBy: "con2", linkedAt: "2026/10/22 11:00",
  },
  // 以下補齊各案件的往來信件，日期對應各案件的里程碑
  {
    id: "s1", mailbox: "con3", fromName: "鄭雅文", fromEmail: "yawen.cheng@sinji-oil.com.tw",
    subject: "ISCC EU 稽核當日流程與文件清單", snippet: "王顧問好，9/15 稽核當天的流程與要準備的文件我整理成清單，請您幫忙看是否有遺漏…",
    body: ["王顧問好：", "9/15 Control Union 稽核當天的流程與要準備的文件，我整理成清單如附件。", "質量平衡的月報表目前補到 8 月，再請您幫忙看是否有遺漏的項目。"],
    signature: ["鄭雅文 品保課長", "新吉成實業股份有限公司"],
    date: "2025-09-08", time: "14:20", count: 5, hasAttachment: "ISCC稽核文件清單-250908.xlsx",
    state: "linked", caseId: "SINJI-ISCC-2025-01", linkedBy: "con3", linkedAt: "2025/09/08 15:05",
  },
  {
    id: "s2", mailbox: "con3", fromName: "Control Union Taiwan", fromEmail: "certification@controlunion-demo.com",
    subject: "新吉成實業 ISCC EU 證書核發通知", snippet: "新吉成實業股份有限公司 ISCC EU 驗證已通過，證書有效期間 2025/11/12 至 2026/11/11…",
    body: ["您好：", "新吉成實業股份有限公司 ISCC EU 驗證已通過審查，證書有效期間為 2025/11/12 至 2026/11/11。", "電子證書請至 ISCC 官網查詢，紙本證書將另行寄送。"],
    date: "2025-11-13", time: "10:02", count: 1, hasAttachment: "ISCC-EU-Certificate-SINJI.pdf",
    state: "linked", caseId: "SINJI-ISCC-2025-01", linkedBy: "con3", linkedAt: "2025/11/13 11:20",
  },
  {
    id: "s3", mailbox: "con3", fromName: "鄭雅文", fromEmail: "yawen.cheng@sinji-oil.com.tw",
    subject: "RE: ISCC EU 續證輔導企劃書", snippet: "王顧問您好，企劃書內容沒有問題，用印版本下週一寄回…",
    body: ["王顧問您好：", "續證輔導企劃書內容我們看過了，堂數與今年相同沒有問題。", "用印版本下週一寄回，再麻煩您安排第一堂課的時間。"],
    signature: ["鄭雅文 品保課長", "新吉成實業股份有限公司"],
    date: "2026-06-26", time: "17:45", count: 3,
    state: "linked", caseId: "SINJI-ISCC-2026-01", linkedBy: "con3", linkedAt: "2026/06/27 09:10",
  },
  {
    id: "s4", mailbox: "con3", fromName: "鄭雅文", fromEmail: "yawen.cheng@sinji-oil.com.tw",
    subject: "第 3 堂課後作業：質量平衡表", snippet: "王顧問，第 3 堂課的作業已完成，7、8 月的質量平衡表如附件…",
    body: ["王顧問：", "第 3 堂課的作業已完成，7、8 月的質量平衡表如附件。", "其中 8 月有一批原料的永續聲明文件還在等供應商補，先用黃色標註。"],
    signature: ["鄭雅文 品保課長", "新吉成實業股份有限公司"],
    date: "2026-09-16", time: "10:35", count: 4, hasAttachment: "質量平衡表-2026-07-08.xlsx",
    state: "linked", caseId: "SINJI-ISCC-2026-01", linkedBy: "con3", linkedAt: "2026/09/16 11:00",
  },
  {
    id: "t1", mailbox: "con1", fromName: "陳國輝", fromEmail: "chen.kh@taiya-petro.com.tw",
    subject: "10/2 拜訪會議紀錄與盤查需求", snippet: "張顧問您好，謝謝您 10/2 來廠說明，會議紀錄與我們整理的盤查需求如附件…",
    body: ["張顧問您好：", "謝謝您 10/2 來仁武廠說明，會議紀錄與我們整理的盤查需求如附件。", "總公司希望仁武、林園兩廠分開報價，但查證時程盡量一起安排。"],
    signature: ["陳國輝 環安課長", "台亞塑化工業股份有限公司 仁武廠", "07-3712-905"],
    date: "2026-10-03", time: "11:15", count: 2, hasAttachment: "1002拜訪會議紀錄.docx",
    state: "linked", caseId: "TAIYA-仁武廠-ISO14064-2026-01", linkedBy: "con1", linkedAt: "2026/10/03 13:40",
  },
  {
    id: "t2", mailbox: "con1", fromName: "林志遠", fromEmail: "lin.cy@taiya-petro.com.tw",
    subject: "林園廠溫室氣體盤查窗口", snippet: "張顧問您好，我是林園廠製程課的林志遠，陳課長請我與您聯繫…",
    body: ["張顧問您好：", "我是林園廠製程課的林志遠，陳課長請我與您聯繫，林園廠的盤查之後由我對口。", "廠內排放源目前有鍋爐 2 座、加熱爐 3 座，詳細清單整理好再寄給您。"],
    signature: ["林志遠 製程課工程師", "台亞塑化工業股份有限公司 林園廠"],
    date: "2026-10-05", time: "09:30", count: 1,
    state: "linked", caseId: "TAIYA-林園廠-ISO14064-2026-01", linkedBy: "con1", linkedAt: "2026/10/05 10:12",
  },
  {
    id: "j1", mailbox: "con2", fromName: "許志明", fromEmail: "jm.hsu@jinhe-paper.com.tw",
    subject: "FSC COC 輔導需求與廠區資料", snippet: "李顧問您好，附上工廠平面圖與目前的原料來源清單，供您評估輔導範圍…",
    body: ["李顧問您好：", "附上工廠平面圖與目前的原料來源清單，供您評估 FSC COC 的輔導範圍。", "我們主要客戶是日系品牌，希望明年第二季前取得證書。"],
    signature: ["許志明 廠長", "金禾紙品有限公司"],
    date: "2026-08-29", time: "15:50", count: 3, hasAttachment: "金禾-廠區平面圖與原料清單.pdf",
    state: "linked", caseId: "JINHE-FSC-2026-01", linkedBy: "con2", linkedAt: "2026/08/29 16:30",
  },
  {
    id: "c1", mailbox: "con2", fromName: "林淑芬", fromEmail: "sf.lin@chengying-print.com",
    subject: "FSC 驗證輔導詢價（承穎印刷）", snippet: "李顧問您好，謝謝您說明輔導流程，費用的部分想請您到廠看過後再報價…",
    body: ["李顧問您好：", "謝謝您說明輔導流程。費用的部分想請您到廠看過產線後再報價。", "9/10 下午方便的話，歡迎到廠參觀我們的印刷產線。"],
    signature: ["林淑芬 管理部經理", "承穎彩色印刷股份有限公司"],
    date: "2026-09-02", time: "10:08", count: 3,
    state: "linked", caseId: "CHENGYING-FSC-2026-01", linkedBy: "con2", linkedAt: "2026/09/02 11:00",
  },
  {
    id: "c2", mailbox: "admin2", fromName: "林淑芬", fromEmail: "sf.lin@chengying-print.com",
    subject: "RE: 企劃書寄送時間", snippet: "許小姐您好，請問企劃書預計何時寄出？我們董事會 11/5 要審…",
    body: ["許小姐您好：", "請問 FSC 輔導企劃書預計何時寄出？我們董事會 11/5 要審預算，希望能在這之前收到。", "謝謝。"],
    signature: ["林淑芬 管理部經理", "承穎彩色印刷股份有限公司"],
    date: "2026-10-28", time: "14:12", count: 2, unread: true,
    state: "suggested", suggestedCaseIds: ["CHENGYING-FSC-2026-01"],
    reasons: ["寄件網域 chengying-print.com 對應客戶「承穎印刷」", "主旨含「企劃書」", "信件時間落在案件時程內（已報價待回簽）"],
  },
  {
    id: "m1", mailbox: "admin2", fromName: "黃建銘", fromEmail: "cm.huang@senmao-wood.com",
    subject: "詢問 FSC 森林管理與 COC 驗證", snippet: "您好，我們是木材加工廠，想同時了解 FM 與 COC 驗證的差別與輔導方式…",
    body: ["您好：", "我們是木材加工廠，部分原木來自自有林地，想了解 FSC FM 與 COC 驗證的差別與輔導方式。", "總經理希望先安排一次電話說明。"],
    signature: ["黃建銘 總經理特助", "森茂木業股份有限公司"],
    date: "2026-10-23", time: "16:40", count: 1,
    state: "linked", caseId: "SENMAO-FSC-2026-01", linkedBy: "admin2", linkedAt: "2026/10/24 09:15",
  },
  {
    id: "l1", mailbox: "con3", fromName: "吳宗翰", fromEmail: "th.wu@lvneng-bio.com.tw",
    subject: "RE: ISCC PLUS 輔導企劃書", snippet: "王顧問您好，企劃書第 4 頁的課程規劃想把供應鏈追溯提前…",
    body: ["王顧問您好：", "企劃書第 4 頁的課程規劃，想請您把供應鏈追溯的課程提前到第 2 堂。", "其餘內容沒有問題。"],
    signature: ["吳宗翰 研發經理", "綠能生質科技股份有限公司"],
    date: "2026-09-08", time: "11:25", count: 3,
    state: "linked", caseId: "LVNENG-ISCCPLUS-2026-01", linkedBy: "con3", linkedAt: "2026/09/08 13:00",
  },
  {
    id: "l2", mailbox: "con3", fromName: "吳宗翰", fromEmail: "th.wu@lvneng-bio.com.tw",
    subject: "ISCC PLUS 輔導合約用印回傳", snippet: "王顧問您好，用印後的合約如附件，正本已掛號寄出…",
    body: ["王顧問您好：", "用印後的合約如附件，正本已掛號寄出。", "第一堂課的時間再請您協調。"],
    signature: ["吳宗翰 研發經理", "綠能生質科技股份有限公司"],
    date: "2026-10-15", time: "16:05", count: 1, hasAttachment: "ISCC PLUS 輔導合約_用印版.pdf",
    state: "linked", caseId: "LVNENG-ISCCPLUS-2026-01", linkedBy: "con3", linkedAt: "2026/10/15 16:30",
  },
  {
    id: "h1", mailbox: "con1", fromName: "TÜV NORD Taiwan", fromEmail: "audit@tuvnord-demo.com",
    subject: "宏碩精密 ISO 9001 驗證稽核排程確認", snippet: "張顧問您好，宏碩精密 ISO 9001 驗證稽核排定於 10/14（三）…",
    body: ["張顧問您好：", "宏碩精密工業股份有限公司 ISO 9001 驗證稽核排定於 10/14（三）09:00–17:00，稽核員 2 名。", "稽核計畫如附件，請協助轉知受稽單位。"],
    date: "2026-09-25", time: "13:10", count: 2, hasAttachment: "稽核計畫-宏碩精密-ISO9001.pdf",
    state: "linked", caseId: "HONGSHUO-ISO9001-2026-01", linkedBy: "con1", linkedAt: "2026/09/25 14:00",
  },
  {
    id: "h2", mailbox: "con1", fromName: "張家豪", fromEmail: "chiahao.chang@hongshuo.com.tw",
    subject: "內部稽核報告與管理審查紀錄", snippet: "張顧問，內部稽核報告與 9/26 管理審查會議紀錄如附件，請協助檢查…",
    body: ["張顧問：", "內部稽核報告與 9/26 管理審查會議紀錄如附件，請協助檢查是否符合驗證稽核要求。"],
    signature: ["張家豪 品保經理", "宏碩精密工業股份有限公司"],
    date: "2026-09-30", time: "18:20", count: 2, hasAttachment: "內稽報告與管審紀錄-260930.zip",
    state: "linked", caseId: "HONGSHUO-ISO9001-2026-01", linkedBy: "con1", linkedAt: "2026/10/01 09:00",
  },
  {
    id: "o1", mailbox: "con1", fromName: "張家豪", fromEmail: "chiahao.chang@hongshuo.com.tw",
    subject: "RE: ISO 45001 追加輔導報價", snippet: "張顧問，報價單收到了，目前在跑內部簽核，預計下週回覆…",
    body: ["張顧問：", "ISO 45001 的報價單收到了，目前在跑內部簽核，預計下週回覆。", "如果能和 ISO 9001 的追查稽核同一週，對我們比較方便。"],
    signature: ["張家豪 品保經理", "宏碩精密工業股份有限公司"],
    date: "2026-10-27", time: "15:02", count: 2,
    state: "linked", caseId: "HONGSHUO-ISO45001-2026-01", linkedBy: "con1", linkedAt: "2026/10/27 15:30",
  },
  {
    id: "k1", mailbox: "con2", fromName: "蔡美玲", fromEmail: "ml.tsai@hechang-food.com.tw",
    subject: "HACCP 稽核缺失改善回覆", snippet: "李顧問好，SGS 開的 3 項缺失改善照片與紀錄已整理好，請您先過目…",
    body: ["李顧問好：", "SGS 9/22 稽核開的 3 項缺失，改善照片與紀錄已整理好，請您先過目再回覆驗證單位。"],
    signature: ["蔡美玲 品管主任", "和昌食品股份有限公司"],
    date: "2026-09-29", time: "11:45", count: 3, hasAttachment: "HACCP缺失改善-照片紀錄.pdf",
    state: "linked", caseId: "HECHANG-HACCP-2026-01", linkedBy: "con2", linkedAt: "2026/09/29 13:20",
  },
  {
    id: "k2", mailbox: "con2", fromName: "SGS Taiwan", fromEmail: "certification@sgs-demo.com",
    subject: "和昌食品 HACCP 驗證通過通知", snippet: "和昌食品股份有限公司 HACCP 驗證已通過，證書將於兩週內寄出…",
    body: ["您好：", "和昌食品股份有限公司 HACCP 驗證已通過審查，證書將於兩週內寄出。", "請確認證書寄送地址。"],
    date: "2026-10-20", time: "09:40", count: 1,
    state: "linked", caseId: "HECHANG-HACCP-2026-01", linkedBy: "con2", linkedAt: "2026/10/20 10:05",
  },
  {
    id: "g1", mailbox: "con3", fromName: "李欣怡", fromEmail: "hy.lee@guangcai-tex.com",
    subject: "GRS 化學品清單與廢水檢測報告", snippet: "王顧問好，第一堂課提到的化學品清單與最近一次廢水檢測報告如附件…",
    body: ["王顧問好：", "第一堂課提到的化學品清單與最近一次廢水檢測報告如附件。", "染整廠的部分還在跟外包商要資料。"],
    signature: ["李欣怡 永續專員", "光彩紡織股份有限公司"],
    date: "2026-10-14", time: "17:05", count: 2, hasAttachment: "化學品清單與廢水檢測.zip",
    state: "linked", caseId: "GUANGCAI-GRS-2026-01", linkedBy: "con3", linkedAt: "2026/10/15 09:00",
  },
  {
    id: "i1", mailbox: "admin2", fromName: "周育成", fromEmail: "yc.chou@jiahe-pack.com",
    subject: "產品碳足跡輔導需求（三項主力產品）", snippet: "您好，品牌客戶要求明年提供三項主力產品的碳足跡，想安排顧問拜訪…",
    body: ["您好：", "品牌客戶要求明年提供三項主力產品的碳足跡（ISO 14067），想安排顧問來廠拜訪。", "10/6 上午或 10/7 下午都可以。"],
    signature: ["周育成 業務副理", "佳和包裝材料股份有限公司"],
    date: "2026-10-01", time: "10:20", count: 1,
    state: "linked", caseId: "JIAHE-ISO14067-2026-01", linkedBy: "admin2", linkedAt: "2026/10/01 11:05",
  },
  {
    id: "p1", mailbox: "con1", fromName: "王俊傑", fromEmail: "cj.wang@lisheng-chem.com.tw",
    subject: "ISO 14001 環境考量面鑑別表", snippet: "張顧問您好，大社廠環境考量面鑑別表初稿如附件，顯著考量面共 12 項…",
    body: ["張顧問您好：", "大社廠環境考量面鑑別表初稿如附件，目前判定的顯著考量面共 12 項。", "下次上課再請您協助確認評分標準。"],
    signature: ["王俊傑 環安副理", "立昇化學工業股份有限公司"],
    date: "2025-08-12", time: "14:30", count: 4, hasAttachment: "環境考量面鑑別表-大社廠-v1.xlsx",
    state: "linked", caseId: "LISHENG-大社廠-ISO14001-2025-01", linkedBy: "con1", linkedAt: "2025/08/12 15:00",
  },
  {
    id: "p2", mailbox: "con1", fromName: "DNV Taiwan", fromEmail: "certification@dnv-demo.com",
    subject: "立昇化學大社廠 ISO 14001 證書", snippet: "立昇化學工業股份有限公司大社廠 ISO 14001 證書已核發，有效期限至 2027/03/20…",
    body: ["您好：", "立昇化學工業股份有限公司大社廠 ISO 14001 證書已核發，有效期限至 2027/03/20。", "電子證書如附件。"],
    date: "2025-12-11", time: "10:15", count: 1, hasAttachment: "ISO14001-Certificate-LISHENG.pdf",
    state: "linked", caseId: "LISHENG-大社廠-ISO14001-2025-01", linkedBy: "con1", linkedAt: "2025/12/11 11:00",
  },
  {
    id: "d1", mailbox: "con2", fromName: "何佩珊", fromEmail: "ps.ho@dayu-beauty.com",
    subject: "GMP 稽核前文件總檢核", snippet: "李顧問好，稽核前的文件總檢核清單已全部打勾，剩下批次紀錄抽樣待確認…",
    body: ["李顧問好：", "ISO 22716 稽核前的文件總檢核清單已全部打勾，剩下批次紀錄的抽樣方式待您確認。"],
    signature: ["何佩珊 品保經理", "大宇美妝生技股份有限公司"],
    date: "2025-10-20", time: "16:10", count: 6, hasAttachment: "稽核前文件檢核表.xlsx",
    state: "linked", caseId: "DAYU-ISO22716-2025-01", linkedBy: "con2", linkedAt: "2025/10/20 16:45",
  },
  {
    id: "d2", mailbox: "con2", fromName: "何佩珊", fromEmail: "ps.ho@dayu-beauty.com",
    subject: "ISO 22716 續證時程與報價", snippet: "李顧問好，我們的 ISO 22716 證書 11/25 到期，想了解續證的時程與報價…",
    body: ["李顧問好：", "我們的 ISO 22716 證書 11/25 到期，想了解續證的時程與報價。", "今年新增了一條乳液產線，不知道會不會影響稽核範圍？"],
    signature: ["何佩珊 品保經理", "大宇美妝生技股份有限公司"],
    date: "2026-10-27", time: "09:18", count: 1, unread: true,
    state: "suggested", suggestedCaseIds: ["DAYU-ISO22716-2025-01"],
    reasons: ["寄件網域 dayu-beauty.com 對應客戶「大宇美妝」", "主旨含「ISO 22716」「續證」", "證書即將到期（27 天）"],
  },
  {
    id: "w1", mailbox: "admin2", fromName: "郭思妤", fromEmail: "sy.kuo@weixin-apparel.com",
    subject: "SMETA 稽核輔導需求（品牌客戶要求）", snippet: "您好，歐洲品牌客戶要求明年第一季前完成 SMETA 稽核，想了解輔導方式…",
    body: ["您好：", "歐洲品牌客戶要求我們明年第一季前完成 SMETA 4-Pillar 稽核，想了解輔導方式與時程。", "品牌商的要求說明如附件。"],
    signature: ["郭思妤 CSR 專員", "維新製衣股份有限公司"],
    date: "2026-10-24", time: "11:30", count: 1, hasAttachment: "品牌商 SMETA 要求說明.pdf",
    state: "linked", caseId: "WEIXIN-SMETA-2026-01", linkedBy: "admin2", linkedAt: "2026/10/24 13:10",
  },
];

// 恆永同仁寄出的信
const STAFF_MAIL: Record<string, [string, string]> = {
  con1: ["張書豪", "shuhao.chang@staygold-demo.com"],
  con2: ["李柏翰", "pohan.lee@staygold-demo.com"],
  con3: ["王志明", "chihming.wang@staygold-demo.com"],
  admin2: ["許雅雯", "yawen.hsu@staygold-demo.com"],
};
const sent = (id: string, to: string, date: string, time: string, body: string[], hasAttachment?: string): ThreadMessage => ({
  fromName: STAFF_MAIL[id][0],
  fromEmail: STAFF_MAIL[id][1],
  to,
  date,
  time,
  body,
  hasAttachment,
});

// 各串信較早的往來，由舊到新；封數（count）＝這裡的封數＋最新一封
const THREAD_HISTORY: Record<string, ThreadMessage[]> = {
  e1: [
    sent("con1", "陳國輝", "2026-10-20", "10:15", ["陳課長您好：", "仁武廠盤查邊界的初步建議：範疇一、二全部納入；範疇三想先了解廠內有哪些委外活動，再判斷是否具重大性。", "方便的話請協助列出委外的運輸、廢棄物處理與員工通勤狀況。"]),
    { fromName: "陳國輝", fromEmail: "chen.kh@taiya-petro.com.tw", to: "張書豪", date: "2026-10-22", time: "16:30", body: ["張顧問您好：", "廠內的原料與成品運輸都委外，廢棄物由 2 家合格清運商處理，員工通勤沒有統計資料。", "運輸的部分需要提供哪些資料？"] },
    sent("con1", "陳國輝", "2026-10-27", "09:05", ["陳課長您好：", "運輸的部分請先提供外包運輸商清單（廠商名稱、運送品項、年度趟次），我會依重大性評估是否納入本次邊界。", "通勤沒有統計的話，這次可以先不納入，在報告中說明即可。"]),
  ],
  e2: [
    sent("con1", "張家豪", "2026-10-26", "11:20", ["張經理您好：", "TÜV NORD 的稽核報告收到了，10/14 開出 2 項次要缺失：文件管制紀錄不完整、校正設備標示未更新。", "驗證單位要求 11/10 前回覆改善計畫，請先擬初稿，我再協助檢視。"]),
  ],
  e5: [
    sent("con1", "周育成", "2026-10-08", "13:40", ["周副理您好：", "謝謝 10/6 的接待。要開始估算碳足跡，需要三項主力產品的 BOM 表與主要原料供應商清單，再麻煩提供。"]),
    { fromName: "周育成", fromEmail: "yc.chou@jiahe-pack.com", to: "張書豪", date: "2026-10-12", time: "17:10", body: ["張顧問：", "BOM 表整理中，這週會給您。", "想先問品牌客戶的要求是提供到出廠為止，這樣盤查邊界是否從搖籃到大門就夠了？"] },
  ],
  e6: [
    sent("con1", "張家豪", "2026-07-29", "17:30", ["張經理您好：", "今天第五堂課辛苦了。簽到表與上課教材再麻煩上傳到共用資料夾存檔，驗證稽核時會用到。"]),
  ],
  z1: [
    sent("con3", "鄭雅文", "2026-10-26", "14:00", ["鄭課長您好：", "第八堂課暫定 11/11（三）下午，內容是稽核前的文件總檢視，請品保與採購同仁一起參加。"]),
    { fromName: "鄭雅文", fromEmail: "yawen.cheng@sinji-oil.com.tw", to: "王志明", date: "2026-10-27", time: "09:20", body: ["王顧問好：", "收到，我跟採購確認時間後再回覆您。"] },
  ],
  z3: [
    sent("con3", "李欣怡", "2026-10-19", "15:20", ["李小姐您好：", "第一批 TC 申請需要這批貨的出貨單與發票，再請上傳到 Drive 的客戶文件上傳區，我確認後送件。"]),
  ],
  r1: [
    sent("con2", "許志明", "2026-10-19", "10:00", ["許廠長您好：", "FSC 輔導企劃書已於 9/29 寄出，想請問目前內部評估的進度，有需要調整的地方都可以討論。"]),
  ],
  s1: [
    sent("con3", "鄭雅文", "2025-08-25", "11:00", ["鄭課長您好：", "Control Union 回覆稽核日期確定為 9/15（一）。接下來兩週我們會開始稽核前的準備。"]),
    { fromName: "鄭雅文", fromEmail: "yawen.cheng@sinji-oil.com.tw", to: "王志明", date: "2025-08-27", time: "10:40", body: ["王顧問好：", "收到。稽核當天需要哪些部門的人在場？文件要先準備哪些？"] },
    sent("con3", "鄭雅文", "2025-09-01", "09:30", ["鄭課長您好：", "當天請品保、採購、倉管的主管在場。文件的部分，質量平衡月報表、原料永續聲明、供應商清單是重點，請先備齊。"]),
    { fromName: "鄭雅文", fromEmail: "yawen.cheng@sinji-oil.com.tw", to: "王志明", date: "2025-09-04", time: "16:15", body: ["王顧問好：", "質量平衡月報表目前補到 7 月，8 月下週可以完成。", "永續聲明有 2 家供應商還沒給，我再催。"] },
  ],
  s3: [
    sent("con3", "鄭雅文", "2026-06-24", "15:30", ["鄭課長您好：", "ISCC EU 續證輔導企劃書如附件，堂數 6 堂比照去年，並加上陪同稽核 1 次。"], "ISCC-EU-續證企劃書-2026.pdf"),
    sent("con3", "鄭雅文", "2026-06-25", "09:10", ["鄭課長您好：", "補充說明，報價頁已更新為 2026 年度費率，請以昨天附件的第 6 頁為準。"]),
  ],
  s4: [
    sent("con3", "鄭雅文", "2026-09-09", "17:20", ["鄭課長您好：", "第 3 堂課的作業：請依上課範本填寫 7、8 月的質量平衡表，下週上課前寄給我。"]),
    { fromName: "鄭雅文", fromEmail: "yawen.cheng@sinji-oil.com.tw", to: "王志明", date: "2026-09-11", time: "11:00", body: ["王顧問好：", "7 月沒問題。8 月有一批原料的永續聲明還沒收到，這批要怎麼填？"] },
    sent("con3", "鄭雅文", "2026-09-12", "09:00", ["鄭課長您好：", "這批先填入並用黃色標註，等供應商補文件後再確認。若稽核前仍未補齊，就不能算入永續料。"]),
  ],
  t1: [
    sent("con1", "陳國輝", "2026-09-30", "10:30", ["陳課長您好：", "10/2（五）上午 10 點到仁武廠拜訪，會說明 ISO 14064-1 的盤查流程與時程，約需 1.5 小時。", "如果林園廠的同仁也能參加，可以一起討論。"]),
  ],
  j1: [
    sent("con2", "許志明", "2026-08-25", "14:10", ["許廠長您好：", "8/28（五）下午 2 點到廠拜訪，會說明 FSC COC 的驗證流程。"]),
    sent("con2", "許志明", "2026-08-28", "17:40", ["許廠長您好：", "謝謝今天的接待。要評估輔導範圍，再請提供廠區平面圖與目前的原料來源清單。"]),
  ],
  c1: [
    { fromName: "林淑芬", fromEmail: "sf.lin@chengying-print.com", to: "李柏翰", date: "2026-08-26", time: "11:30", body: ["李顧問您好：", "敝司因出版社客戶要求，需要在明年取得 FSC COC 證書，想詢問輔導流程與費用。"] },
    sent("con2", "林淑芬", "2026-08-28", "09:45", ["林經理您好：", "輔導流程大致是：現況訪視、建立程序文件、教育訓練、內部稽核、驗證稽核，約需 4 到 6 個月。", "費用會依產線與紙張來源的複雜度而定，建議先到廠了解。"]),
  ],
  c2: [
    sent("admin2", "林淑芬", "2026-10-20", "10:50", ["林經理您好：", "FSC 輔導企劃書目前在內部審核，核可後會立即寄給您，有進度再通知。"]),
  ],
  l1: [
    sent("con3", "吳宗翰", "2026-09-05", "16:00", ["吳經理您好：", "ISCC PLUS 輔導企劃書如附件，共 5 堂課，請參考。"], "ISCC-PLUS-輔導企劃書-綠能生質.pdf"),
    { fromName: "吳宗翰", fromEmail: "th.wu@lvneng-bio.com.tw", to: "王志明", date: "2026-09-07", time: "09:15", body: ["王顧問您好：", "收到，我今天和研發、採購一起看過後回覆您。"] },
  ],
  h1: [
    sent("con1", "TÜV NORD Taiwan", "2026-09-22", "10:20", ["您好：", "宏碩精密的內部稽核與管理審查將於 9 月底完成，驗證稽核希望安排在 10 月中，10/14 是否可行？"]),
  ],
  h2: [
    sent("con1", "張家豪", "2026-09-28", "09:30", ["張經理您好：", "驗證稽核排定 10/14。內部稽核報告與管理審查紀錄完成後請先寄給我，確認符合稽核要求。"]),
  ],
  o1: [
    sent("con1", "張家豪", "2026-10-26", "17:00", ["張經理您好：", "ISO 45001 追加輔導的企劃書與報價單如附件，共 5 堂課，再請參考。"], "ISO45001-企劃書與報價-宏碩精密.pdf"),
  ],
  k1: [
    sent("con2", "蔡美玲", "2026-09-23", "10:00", ["蔡主任您好：", "SGS 昨天開了 3 項缺失：原料暫存區溫度紀錄缺漏、清潔紀錄未簽核、部分員工訓練紀錄不全。", "請在 9/30 前完成改善並拍照留存。"]),
    { fromName: "蔡美玲", fromEmail: "ml.tsai@hechang-food.com.tw", to: "李柏翰", date: "2026-09-25", time: "14:30", body: ["李顧問好：", "前兩項已改善。訓練紀錄的部分今天補訓，下週一可以給您完整資料。"] },
  ],
  g1: [
    sent("con3", "李欣怡", "2026-10-07", "09:40", ["李小姐您好：", "昨天第一堂課提到的資料，請提供化學品清單與最近一次的廢水檢測報告，外包染整廠的部分也請一併詢問。"]),
  ],
  p1: [
    sent("con1", "王俊傑", "2025-07-22", "16:20", ["王副理您好：", "這次上課的作業是鑑別大社廠的環境考量面，範本如附件，請各課室先填。"], "環境考量面鑑別表-範本.xlsx"),
    { fromName: "王俊傑", fromEmail: "cj.wang@lisheng-chem.com.tw", to: "張書豪", date: "2025-07-28", time: "10:05", body: ["張顧問您好：", "各課室的填法不太一致，評分標準有建議的寫法嗎？"] },
    sent("con1", "王俊傑", "2025-08-01", "09:15", ["王副理您好：", "建議用發生頻率、影響程度、法規要求三個面向評分，各 1 到 5 分。先試算一輪，下次上課再一起校正。"]),
  ],
  d1: [
    sent("con2", "何佩珊", "2025-09-30", "11:00", ["何經理您好：", "ISO 22716 驗證稽核排定 10/30，這個月開始做文件總檢核，檢核清單如附件。"], "稽核前文件檢核表-範本.xlsx"),
    { fromName: "何佩珊", fromEmail: "ps.ho@dayu-beauty.com", to: "李柏翰", date: "2025-10-03", time: "15:25", body: ["李顧問好：", "清單收到，我分給各單位，預計兩週內填完。"] },
    sent("con2", "何佩珊", "2025-10-08", "10:10", ["何經理您好：", "上次課程提到的新進人員 GMP 教育訓練紀錄，也請一併放入檢核範圍。"]),
    { fromName: "何佩珊", fromEmail: "ps.ho@dayu-beauty.com", to: "李柏翰", date: "2025-10-13", time: "17:40", body: ["李顧問好：", "新進人員的訓練紀錄已補齊。批次紀錄要準備多少才夠？"] },
    sent("con2", "何佩珊", "2025-10-16", "09:30", ["何經理您好：", "批次紀錄先準備近 6 個月，抽樣方式我看過清單後再跟您確認。"]),
  ],
};

export const threadsSeed: EmailThread[] = threadsBase.map((t) => ({ ...t, earlier: THREAD_HISTORY[t.id] }));

export const travelSeed: Travel[] = [
  { id: "t1", date: "2026-10-28", memberId: "con3", category: "交通費", detail: "高鐵 台北－台南 來回", amount: 2980, caseId: "SINJI-ISCC-2026-01", link: "系統建議已確認", createdAt: "2026/10/28" },
  { id: "t2", date: "2026-10-28", memberId: "con3", category: "膳食費", detail: "午餐", amount: 180, caseId: "SINJI-ISCC-2026-01", link: "系統建議已確認", createdAt: "2026/10/28" },
  { id: "t3", date: "2026-10-27", memberId: "con1", category: "交通費", detail: "高鐵 台北－左營 來回", amount: 2980, link: "未歸戶", createdAt: "2026/10/27" },
  { id: "t4", date: "2026-10-27", memberId: "con3", category: "交通費", detail: "計程車 桃園高鐵站－觀音廠", amount: 650, caseId: "GUANGCAI-GRS-2026-01", link: "系統建議已確認", createdAt: "2026/10/27" },
  { id: "t5", date: "2026-10-22", memberId: "con2", category: "住宿費", detail: "屏東 商旅 1 晚", amount: 2200, caseId: "HECHANG-HACCP-2026-01", link: "人工手動指定", createdAt: "2026/10/23" },
  { id: "t6", date: "2026-10-16", memberId: "con2", category: "交通費", detail: "計程車 台中高鐵站－客戶端", amount: 460, link: "未歸戶", createdAt: "2026/10/16" },
  { id: "t7", date: "2026-10-14", memberId: "con1", category: "交通費", detail: "自駕 台北－台中 來回 320 km", amount: 1920, caseId: "HONGSHUO-ISO9001-2026-01", link: "系統建議已確認", createdAt: "2026/10/15" },
  { id: "t8", date: "2026-10-06", memberId: "con3", category: "交通費", detail: "高鐵 台北－桃園 來回", amount: 560, caseId: "GUANGCAI-GRS-2026-01", link: "系統建議已確認", createdAt: "2026/10/06" },
  { id: "t9", date: "2026-10-02", memberId: "con1", category: "交通費", detail: "高鐵 台北－左營 來回", amount: 2980, caseId: "TAIYA-仁武廠-ISO14064-2026-01", link: "系統建議已確認", createdAt: "2026/10/03" },
  { id: "t10", date: "2026-10-02", memberId: "con1", category: "其他費用", detail: "停車費", amount: 120, caseId: "TAIYA-仁武廠-ISO14064-2026-01", link: "人工手動指定", createdAt: "2026/10/03" },
];

export const payablesSeed: Payable[] = [
  { id: "ap1", memberId: "con3", caseId: "SINJI-ISCC-2026-01", desc: "第 1–4 堂輔導費", requestDate: "2026-09-30", amount: 96000, invoiceTitle: "志明永續顧問工作室", taxId: "93518602", invoiceNo: "RB-30018842", account: "國泰世華 013 ‧‧‧‧ 2281", status: "已核准" },
  { id: "ap2", memberId: "con1", caseId: "HONGSHUO-ISO9001-2026-01", desc: "第 1–5 堂輔導費", requestDate: "2026-08-05", amount: 75000, invoiceTitle: "張書豪", taxId: "—", account: "玉山 808 ‧‧‧‧ 6630", status: "已付款", paidDate: "2026-08-25" },
  { id: "ap3", memberId: "con2", caseId: "HECHANG-HACCP-2026-01", desc: "HACCP 輔導費＋陪同稽核", requestDate: "2026-10-25", amount: 60000, invoiceTitle: "柏翰管理顧問有限公司", taxId: "82270915", invoiceNo: "RB-30551027", account: "台新 812 ‧‧‧‧ 0917", status: "待核准" },
  { id: "ap4", memberId: "con3", caseId: "GUANGCAI-GRS-2026-01", desc: "第 1–4 堂輔導費", requestDate: "2026-10-28", amount: 72000, invoiceTitle: "志明永續顧問工作室", taxId: "93518602", account: "國泰世華 013 ‧‧‧‧ 2281", status: "待核准" },
];

export const auditSeed: AuditEntry[] = [
  { id: "a1", time: "2026/10/28 17:40", actor: "admin1", module: "案件", caseId: "HECHANG-HACCP-2026-01", target: "里程碑", action: "登記取證日", before: "—", after: "2026/10/20" },
  { id: "a2", time: "2026/10/28 16:12", actor: "con3", module: "差旅費", caseId: "SINJI-ISCC-2026-01", refId: "t1", target: "高鐵 台北－台南 來回 $2,980", action: "確認系統建議歸戶" },
  { id: "a3", time: "2026/10/27 18:20", actor: "con1", module: "案件", caseId: "TAIYA-林園廠-ISO14064-2026-01", target: "審核", action: "送出內容審核" },
  { id: "a4", time: "2026/10/27 10:15", actor: "exec1", module: "案件", caseId: "CHENGYING-FSC-2026-01", target: "審核", action: "核價核可", before: "核價審核中", after: "已報價待回簽" },
  { id: "a5", time: "2026/10/27 10:05", actor: "admin2", module: "案件", caseId: "WEIXIN-SMETA-2026-01", target: "案件", action: "建立案件", after: "WEIXIN-SMETA-2026-01" },
  { id: "a6", time: "2026/10/27 09:50", actor: "exec1", module: "成員與權限", target: "yian.chen@staygold-demo.com", action: "寄送邀請", after: "顧問" },
  { id: "a7", time: "2026/10/23 11:30", actor: "partner", module: "案件", caseId: "TAIYA-仁武廠-ISO14064-2026-01", target: "審核", action: "內容核可", before: "內容審核中", after: "核價審核中" },
  { id: "a8", time: "2026/10/22 14:25", actor: "exec1", module: "案件", caseId: "JIAHE-ISO14067-2026-01", target: "審核", action: "核價退回", before: "核價審核中", after: "企劃書撰寫中" },
  { id: "a9", time: "2026/10/21 09:30", actor: "admin2", module: "客戶", target: "森茂木業", action: "新增客戶" },
  { id: "a10", time: "2026/10/15 15:20", actor: "admin1", module: "案件", caseId: "LVNENG-ISCCPLUS-2026-01", target: "里程碑", action: "登記回簽日", before: "—", after: "2026/10/15" },
  { id: "a11", time: "2026/10/14 18:02", actor: "con1", module: "案件", caseId: "HONGSHUO-ISO9001-2026-01", target: "里程碑", action: "採用行事曆候選日期：稽核日", after: "2026/10/14" },
  { id: "a12", time: "2026/09/02 15:10", actor: "fin", module: "財務", caseId: "HONGSHUO-ISO9001-2026-01", target: "第 2 期發票", action: "登記發票已開立", after: "QA-27936615" },
  { id: "a13", time: "2026/08/12 10:30", actor: "fin", module: "財務", caseId: "SINJI-ISCC-2026-01", target: "第 1 期發票", action: "登記發票已開立", after: "QA-27719054" },
];

export const notifHistorySeed: Notif[] = [
  {
    key: "renew1:SINJI-ISCC-2025-01", type: "續證準備", group: "證書到期與續證", title: "新吉成 ISCC EU 證書 180 天後到期",
    desc: "到期日 2026/11/11，已建立續證案件 SINJI-ISCC-2026-01。", caseId: "SINJI-ISCC-2025-01", memberId: "con3",
    recipients: ["owner", "admin"], email: true, done: "已建立續證案件", goto: "case", status: "已完成", createdAt: "2026/05/15 08:00", completedAt: "2026/05/30 09:12",
  },
  {
    key: "price:CHENGYING-FSC-2026-01", type: "待審核（核價）", group: "案件進度", title: "承穎印刷 FSC 待核價",
    desc: "合夥人已核可內容，請進行最終審核與核價。", caseId: "CHENGYING-FSC-2026-01", memberId: "con2",
    recipients: ["exec"], email: true, done: "經營層核可或退回", goto: "case", status: "已完成", createdAt: "2026/10/22 15:40", completedAt: "2026/10/27 10:15",
  },
  {
    key: "sign:LVNENG-ISCCPLUS-2026-01", type: "待回簽", group: "案件進度", title: "綠能生質 企劃書送出已超過 14 天未回簽",
    desc: "企劃書於 2026/09/05 送出。", caseId: "LVNENG-ISCCPLUS-2026-01", memberId: "con3",
    recipients: ["owner", "admin"], email: false, done: "登記客戶已回簽", goto: "case", status: "已完成", createdAt: "2026/09/19 08:00", completedAt: "2026/10/15 15:20",
  },
];

export const settingsSeed: Settings = {
  renewDays: [180, 90, 30],
  signWaitDays: 14,
  payDays: 30,
  unassignedDays: 7,
  travelRemindDay: 25,
  items: ITEMS,
  workspaceName: "恆永顧問",
};

export const DRIVE_L4 = ["NDA", "企劃書", "合約", "投標", "客戶文件上傳區", "客戶文件上傳區(上課暫存區)", "輔導日程表", "輔導前相關文件"];

// 依資料夾名稱產生示意檔案（第 4 層文件類別＋檔名規則）
export function filesFor(c: Case, short: string): { folder: string; files: { name: string; modified: string; by: string; kind: "doc" | "sheet" | "pdf" | "image" }[] }[] {
  const l3 = c.folder?.name ?? "";
  const d = (s?: string) => (s ? s.slice(2).replace(/-/g, "") : "260101");
  const out: ReturnType<typeof filesFor> = [];
  out.push({ folder: "NDA", files: [{ name: `${l3}-NDA-${d(c.milestones.visit)}-signed.pdf`, modified: c.milestones.visit ?? "", by: "行政", kind: "pdf" }] });
  out.push({
    folder: "企劃書",
    files: [
      { name: `${l3}-企劃書-${d(c.milestones.proposalSent)}-v1.docx`, modified: c.milestones.proposalSent ?? "", by: "顧問", kind: "doc" },
      ...(c.milestones.proposalSent ? [{ name: `${l3}-企劃書-${d(c.milestones.proposalSent)}-ok.pdf`, modified: c.milestones.proposalSent, by: "行政", kind: "pdf" as const }] : []),
    ],
  });
  if (c.milestones.signed)
    out.push({ folder: "合約", files: [{ name: `${l3}-合約-${d(c.milestones.signed)}-signed.pdf`, modified: c.milestones.signed, by: "行政", kind: "pdf" }] });
  if (c.milestones.courseStart) {
    out.push({ folder: "輔導日程表", files: [{ name: `${l3}-輔導日程表-${d(c.milestones.courseStart)}.xlsx`, modified: c.milestones.courseStart, by: "顧問", kind: "sheet" }] });
    out.push({
      folder: "客戶文件上傳區",
      files: [
        { name: `${short}-內稽任命書-${d(c.milestones.courseStart)}.pdf`, modified: c.milestones.courseStart, by: "客戶", kind: "pdf" },
        { name: `${short}-程序書-管理程序-v2.docx`, modified: "2026-10-12", by: "客戶", kind: "doc" },
        { name: `${short}-產銷存彙總表-2026Q3.xlsx`, modified: "2026-10-20", by: "客戶", kind: "sheet" },
      ],
    });
  }
  out.push({
    folder: "輔導前相關文件",
    files: [
      { name: `${short}-組織圖.pdf`, modified: c.milestones.visit ?? "", by: "客戶", kind: "pdf" },
      { name: `${short}-廠區平面圖.png`, modified: c.milestones.visit ?? "", by: "客戶", kind: "image" },
    ],
  });
  return out;
}
