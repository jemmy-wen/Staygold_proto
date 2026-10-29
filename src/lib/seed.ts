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
  m("admin1", "蔡宜庭", "yiting.tsai@staygold-demo.com", "行政專員", "專員", "#C2733D"),
  m("admin2", "許雅雯", "yawen.hsu@staygold-demo.com", "行政專員", "專員", "#D0884E", { lastActive: "2 小時前" }),
  m("con1", "張書豪", "shuhao.chang@staygold-demo.com", "資深顧問", "顧問", "#3B6FB6"),
  m("con2", "李柏翰", "pohan.lee@staygold-demo.com", "顧問", "顧問", "#2F8F9D", { lastActive: "昨天" }),
  m("con3", "王志明", "chihming.wang@staygold-demo.com", "顧問", "顧問", "#5E8C3A"),
  m("fin", "黃韻如", "yunju.huang@staygold-demo.com", "財務專員", "專員", "#B4536A", { lastActive: "3 天前" }, { casesScope: "all", casesCreate: false, casesEdit: false, caseEmail: false, caseDocs: false, caseSchedule: false, customersEdit: false, gmail: false, financeAmounts: true, financeCenter: true, financeRecord: true, payables: true, exportExcel: true, audit: true }),
  m("ext", "周建宏", "jianhong.chou@gmail.com", "外部顧問", "顧問", "#8A8F3C", { joinedAt: "2026/10/02", lastActive: "昨天" }, { casesCreate: false, casesEdit: false, caseEmail: false, customers: false, customerContact: false, travel: false, gmail: false }),
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
      { id: "p2", n: 2, pct: 50, amount: 85000, trigger: "取證" },
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

export const threadsSeed: EmailThread[] = [
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
];

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
  { id: "a2", time: "2026/10/28 16:12", actor: "con3", module: "差旅費", caseId: "SINJI-ISCC-2026-01", target: "高鐵 台北－台南 來回 $2,980", action: "確認系統建議歸戶" },
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
