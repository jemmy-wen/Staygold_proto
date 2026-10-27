import type { CalEvent, Case, Customer, EmailThread, Member, NotifHit, Recipient, Settings, Travel } from "./types";
import { effectivePerms } from "./perms";
import { TODAY, caseStatus, daysSince, daysUntil, fmtDate, periodState, toDate } from "./utils";

export const sessionsOf = (c: Case, events: CalEvent[]) =>
  events.filter((e) => e.caseId === c.id && e.kind === "排課").sort((a, b) => a.date.localeCompare(b.date));

type Ctx = {
  cases: Case[];
  customers: Customer[];
  events: CalEvent[];
  threads: EmailThread[];
  travel: Travel[];
  members: Member[];
  settings: Settings;
};

export function computeNotifications(ctx: Ctx): NotifHit[] {
  const { cases, customers, events, threads, travel, members, settings } = ctx;
  const out: NotifHit[] = [];
  const cust = (c: Case) => customers.find((x) => x.id === c.customerId);
  const label = (c: Case) => `${cust(c)?.short ?? ""}${c.site ? " " + c.site : ""} ${c.item}`;

  for (const c of cases) {
    const status = caseStatus(c, settings);
    const m = c.milestones;
    const base = { caseId: c.id, memberId: c.owner, members: [c.owner, ...c.coOwners], goto: "case" as const };

    if (status === "內容審核中")
      out.push({ ...base, key: `content:${c.id}`, type: "待審核（內容）", group: "案件進度", title: `${label(c)} 待審核輔導內容`, desc: "顧問已送出企劃書，請審核服務範疇與輔導內容。", recipients: ["partner"], email: true, done: "內容審核通過或退回" });
    if (status === "核價審核中")
      out.push({ ...base, key: `price:${c.id}`, type: "待審核（核價）", group: "案件進度", title: `${label(c)} 待核價`, desc: "輔導內容已核可，請進行最終審核與核價。", recipients: ["exec"], email: true, done: "核價核可或退回" });
    const last = c.reviewLog[c.reviewLog.length - 1];
    if (status === "企劃書撰寫中" && last?.action === "退回")
      out.push({ ...base, key: `return:${c.id}:${c.reviewLog.length}`, type: "審核退回", group: "案件進度", title: `${label(c)} ${last.stage}審核被退回`, desc: last.note ?? "請依意見修改後重新送出。", recipients: ["owner"], email: true, done: "顧問重新送出審核" });
    if (status === "已報價待回簽" && !m.proposalSent)
      out.push({ ...base, key: `send:${c.id}`, type: "審核核可・待寄送企劃書", group: "案件進度", title: `${label(c)} 已核可，待寄送企劃書`, desc: "寄出後請登記企劃書送出日，回簽提醒會從這天開始計算。", recipients: ["admin", "owner"], email: true, done: "登記企劃書送出日" });
    if (status === "已報價待回簽" && m.proposalSent && daysSince(m.proposalSent) > settings.signWaitDays)
      out.push({ ...base, key: `sign:${c.id}`, type: "待回簽", group: "案件進度", title: `${label(c)} 企劃書送出 ${daysSince(m.proposalSent)} 天未回簽`, desc: `企劃書於 ${fmtDate(m.proposalSent)} 送出，超過 ${settings.signWaitDays} 天仍未登記回簽。`, recipients: ["owner", "admin"], email: false, done: "登記客戶已回簽" });
    const sessions = sessionsOf(c, events).length;
    if ((status === "已簽約排課中" || status === "輔導中") && c.contractSessions > 0 && sessions > c.contractSessions)
      out.push({ ...base, key: `sess:${c.id}`, type: "堂數不符", group: "案件進度", title: `${label(c)} 行事曆 ${sessions} 堂，合約 ${c.contractSessions} 堂`, desc: "行事曆已排堂數超過合約堂數，若為追加課程請確認是否需補簽或調整請款。", recipients: ["owner"], email: false, done: "堂數一致", tab: "schedule" });

    for (const p of c.periods) {
      const st = periodState(c, p);
      if (st.invoice === "待開立" && p.n === 1 && p.trigger === "開課")
        out.push({ ...base, key: `inv:${c.id}:${p.id}`, type: "發票待開立（第一期）", group: "發票與請款", title: `${label(c)} 第 1 期發票待開立`, desc: m.courseStart ? `第一堂課於 ${fmtDate(m.courseStart)} 開課，本期 ${p.pct}%。` : `案件已進入輔導中，本期 ${p.pct}%。`, recipients: ["finance", "admin"], email: true, done: "登記發票已開立", goto: "finance" });
      else if (st.invoice === "待開立")
        out.push({ ...base, key: `inv:${c.id}:${p.id}`, type: "發票待開立（取證後各期）", group: "發票與請款", title: `${label(c)} 第 ${p.n} 期發票待開立`, desc: p.trigger === "取證" ? `已於 ${fmtDate(m.certified)} 取證，本期 ${p.pct}%。` : `約定開票日 ${fmtDate(p.customDate)}，本期 ${p.pct}%。`, recipients: ["finance", "admin"], email: true, done: "登記發票已開立", goto: "finance" });
      if (st.pay === "待收款" && st.overdue > settings.overdueDays)
        out.push({ ...base, key: `due:${c.id}:${p.id}`, type: "收款逾期", group: "發票與請款", title: `${label(c)} 第 ${p.n} 期已開票 ${st.overdue} 天未收款`, desc: `發票 ${p.invoiceNo} 於 ${fmtDate(p.invoiceDate)} 開立。`, recipients: ["finance", "exec"], email: false, done: "登記已收款", goto: "finance" });
    }

    if (m.certified && m.certExpiry && !c.noRenew) {
      const left = daysUntil(m.certExpiry);
      const renewed = cases.some((x) => x.previousCase === c.id);
      const [d1, d2, d3] = settings.renewDays;
      if (!renewed && left <= d1) {
        if (left <= d3)
          out.push({ ...base, key: `renew3:${c.id}`, type: "證書即將到期", group: "證書到期與續證", title: `${label(c)} 證書 ${left} 天後到期`, desc: `到期日 ${fmtDate(m.certExpiry)}，尚未建立續證案件。請建立續證案件，或由核價主管標記本次不續證。`, recipients: ["owner", "admin", "exec"], email: true, done: "已建立續證案件，或標記本次不續證" });
        else if (left <= d2)
          out.push({ ...base, key: `renew2:${c.id}`, type: "續證再提醒", group: "證書到期與續證", title: `${label(c)} 證書 ${left} 天後到期`, desc: `到期日 ${fmtDate(m.certExpiry)}，仍未建立續證案件。`, recipients: ["owner", "admin"], email: true, done: "已建立續證案件" });
        else
          out.push({ ...base, key: `renew1:${c.id}`, type: "續證準備", group: "證書到期與續證", title: `${label(c)} 證書 ${left} 天後到期`, desc: `到期日 ${fmtDate(m.certExpiry)}，案件已進入續證期，請開始準備續證。`, recipients: ["owner", "admin"], email: true, done: "已建立續證案件" });
      }
    }
  }

  // 信件待確認：每封有系統建議、尚未確認的信件各一則（PRD 3.11）
  for (const t of threads)
    if (t.state === "suggested")
      out.push({ key: `mail:${t.id}`, type: "信件待確認", group: "案件進度", title: `信件待確認：${t.subject}`, desc: `${t.fromName}・建議關聯 ${t.suggestedCaseIds?.[0] ?? ""}`, caseId: t.suggestedCaseIds?.[0], memberId: t.mailbox, recipients: ["owner"], email: false, done: "確認或忽略建議", goto: "case", tab: "email" });

  const day = toDate(TODAY).getDate();
  if (day >= settings.travelRemindDay)
    for (const mem of members.filter((x) => x.status === "active" && x.perms.travel && x.role === "顧問"))
      out.push({ key: `travelmonth:${mem.id}`, type: "差旅費填報提醒", group: "差旅費報帳", title: "請填報本月差旅費", desc: `每月 ${settings.travelRemindDay} 日起提醒，次月 1 日自動結束。`, memberId: mem.id, recipients: ["reporter"], email: false, done: "次月 1 日自動結束", goto: "travel" });

  for (const t of travel)
    if (t.link === "未歸戶" && daysSince(t.date) > settings.unassignedDays)
      out.push({ key: `unassigned:${t.id}`, type: "差旅費未歸戶", group: "差旅費報帳", title: `差旅費 ${t.detail} 尚未歸戶`, desc: `${fmtDate(t.date)} 填報，已超過 ${settings.unassignedDays} 天未指定所屬案件。`, memberId: t.memberId, recipients: ["reporter", "admin"], email: false, done: "指定所屬案件", goto: "travel" });

  return out;
}

export const RECIPIENT_LABEL: Record<Recipient, string> = {
  owner: "負責人",
  admin: "專員",
  finance: "財務登記",
  exec: "核價主管",
  partner: "內容審核主管",
  reporter: "填報人",
};

// 通知對象不綁職稱，依層級與權限判斷，人員異動時不需改規則
export function matchesRecipient(r: Recipient, member: Member, memberId?: string, members?: string[]) {
  const m = { ...member, perms: effectivePerms(member.perms) };
  if (r === "owner" || r === "reporter") return memberId === m.id;
  if (r === "admin") return m.role === "專員" && m.perms.casesEdit && (m.perms.casesScope === "all" || !members || members.includes(m.id));
  if (r === "finance") return m.perms.financeRecord;
  if (r === "exec") return m.role === "主管" && m.perms.reviewPrice;
  if (r === "partner") return m.perms.reviewContent && !m.perms.reviewPrice;
  return false;
}

export function isRecipient(hit: NotifHit, me: Member) {
  return hit.recipients.some((r) => matchesRecipient(r, me, hit.memberId, hit.members));
}

export type Candidate = { date: string; event: CalEvent };

// 3.6：Calendar 已有對應事件時，帶入里程碑的候選日期
export function milestoneCandidates(c: Case, cust: Customer | undefined, events: CalEvent[]) {
  const mine = events.filter(
    (e) => (e.memberId === c.owner || c.coOwners.includes(e.memberId)) && (e.caseId === c.id || (!e.caseId && cust && e.title.includes(cust.short))),
  );
  const pick = (kind: CalEvent["kind"]) => mine.filter((e) => e.kind === kind && e.date <= TODAY).sort((a, b) => b.date.localeCompare(a.date));
  const out: Partial<Record<"visit" | "courseStart" | "audit", Candidate>> = {};
  const v = pick("拜訪")[0];
  if (v && !c.milestones.visit) out.visit = { date: v.date, event: v };
  const sessions = mine.filter((e) => e.kind === "排課" && e.caseId === c.id).sort((a, b) => a.date.localeCompare(b.date));
  if (sessions[0] && !c.milestones.courseStart) out.courseStart = { date: sessions[0].date, event: sessions[0] };
  const a = pick("稽核").find((e) => !c.milestones.audits.includes(e.date));
  if (a && c.milestones.audits.length < 4) out.audit = { date: a.date, event: a };
  return out;
}

// 3.7：依填報日期比對顧問當天的 Calendar 排課／稽核／拜訪事件
export function travelCandidates(date: string, memberId: string, events: CalEvent[], cases: Case[], customers: Customer[]) {
  const dayEvents = events.filter((e) => e.date === date && e.memberId === memberId);
  const result: { event: CalEvent; caseId: string }[] = [];
  for (const e of dayEvents) {
    if (e.caseId) {
      result.push({ event: e, caseId: e.caseId });
      continue;
    }
    // 事件名稱含客戶簡稱與驗證項目（PRD 4）；同客戶同項目有多個廠區時全部列為候選，由填報人選擇
    const hits = cases.filter((c) => {
      const cu = customers.find((x) => x.id === c.customerId);
      if (!cu || !e.title.includes(cu.short) || !e.title.includes(c.item)) return false;
      return c.owner === memberId || c.coOwners.includes(memberId);
    });
    hits.forEach((c) => result.push({ event: e, caseId: c.id }));
  }
  const seen = new Set<string>();
  return result.filter((r) => (seen.has(r.caseId) ? false : (seen.add(r.caseId), true)));
}
