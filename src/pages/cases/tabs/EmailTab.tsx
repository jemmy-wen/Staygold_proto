import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Check, ChevronDown, CircleAlert, EyeOff, Mail, Paperclip, Search, Unlink, X } from "lucide-react";
import { useStore } from "../../../lib/store";
import type { Case, EmailThread, ThreadMessage } from "../../../lib/types";
import { cn, daysSince, fmtDate, fmtShort, mailKeywords, nowStamp } from "../../../lib/utils";
import { Avatar, Badge, Button, Empty, OptionList, Popover, SearchInput } from "../../../components/ui";

const threadMessages = (t: EmailThread, ownerName: string): (ThreadMessage & { signature?: string[] })[] => [...(t.earlier ?? []), { fromName: t.fromName, fromEmail: t.fromEmail, to: ownerName, date: t.date, time: t.time, body: t.body, signature: t.signature, hasAttachment: t.hasAttachment }];

// Email 分頁有兩個方案給恆永選：完整內文是左邊選信件串、右邊讀整串內容；關鍵字方案見 ContactLog。建議關聯都收在上方一條
export function EmailTab({ c }: { c: Case }) {
  const s = useStore();
  const suggested = s.threads.filter((t) => t.state === "suggested" && t.suggestedCaseIds?.includes(c.id));
  const linked = s.threads.filter((t) => t.state === "linked" && t.caseId === c.id).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  const [openId, setOpenId] = useState<string | null>(null);
  const open = linked.find((t) => t.id === openId) ?? linked[0];
  const total = linked.reduce((n, t) => n + t.count, 0);

  return (
    <div className="space-y-4">
      {suggested.length > 0 && <SuggestedBar c={c} list={suggested} />}
      {linked.length === 0 ? (
        <div className="rounded-xl border border-ink-200 bg-white shadow-card">
          <Empty icon={<Mail />} title="還沒有關聯的信件" />
        </div>
      ) : s.mailView === "log" ? (
        <ContactLog c={c} linked={linked} />
      ) : (
        <div className="grid grid-cols-[320px_minmax(0,1fr)] items-start gap-4">
          <aside className="sticky top-4 overflow-hidden rounded-xl border border-ink-200 bg-white shadow-card">
            <p className="border-b border-ink-100 px-4 py-3 text-[13px] font-semibold text-ink-900">
              通聯紀錄
              <span className="ml-2 text-[12px] font-normal text-ink-500">
                {linked.length} 串・{total} 封
              </span>
            </p>
            <div className="max-h-[calc(100vh-180px)] overflow-y-auto">
              {linked.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setOpenId(t.id)}
                  className={cn("block w-full border-b border-ink-100 px-4 py-3 text-left transition-colors last:border-b-0", t.id === open?.id ? "bg-brand-50/60" : "hover:bg-ink-25")}
                >
                  <span className="flex items-center gap-2 text-[12px] text-ink-500">
                    <span className="min-w-0 flex-1 truncate">{t.fromName}</span>
                    <span className="shrink-0 tabular-nums">{fmtShort(t.date)}</span>
                  </span>
                  <span className="mt-1 flex items-start gap-1.5 text-[13px] font-medium leading-snug text-ink-900">
                    <span className="min-w-0 flex-1">{t.subject}</span>
                    {t.hasAttachment && <Paperclip className="mt-0.5 size-3.5 shrink-0 text-ink-400" />}
                    {t.count > 1 && <span className="shrink-0 rounded bg-ink-100 px-1.5 text-[11px] font-normal text-ink-500">{t.count}</span>}
                  </span>
                  <span className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-ink-500">{t.snippet}</span>
                </button>
              ))}
            </div>
          </aside>
          {open && <ThreadReader key={open.id} t={open} c={c} />}
        </div>
      )}
    </div>
  );
}

type LogFilter = { kind: "keyword" | "contact" | "search"; value: string } | null;

// 關鍵字方案：不顯示內文，用搜尋或關鍵字找出出現在哪幾封信，再依「在誰的信箱」回去翻原信
function ContactLog({ c, linked }: { c: Case; linked: EmailThread[] }) {
  const s = useStore();
  const [picked, setPicked] = useState<LogFilter>(null);
  const entries = linked.map((t) => {
    const owner = s.memberOf(t.mailbox);
    return { t, owner, rows: threadMessages(t, owner?.name ?? "").map((m) => ({ ...m, keywords: mailKeywords(m.body.join(" ")) })) };
  });
  const all = entries.flatMap((e) => e.rows);
  // 搜尋也認詞庫的同義詞，例如搜「費用」會找到關鍵字「報價」
  const keywordHit = (f: LogFilter, k: string) => {
    if (!f || f.kind === "contact") return false;
    if (f.kind === "keyword") return f.value === k;
    return k.toLowerCase().includes(f.value.trim().toLowerCase()) || mailKeywords(f.value).includes(k);
  };
  const matches = (f: LogFilter, m: (typeof all)[number]) => {
    if (!f) return true;
    if (f.kind === "contact") return m.fromName === f.value || m.to === f.value;
    if (m.keywords.some((k) => keywordHit(f, k))) return true;
    return f.kind === "search" && [m.fromName, m.to, m.hasAttachment ?? ""].some((x) => x.toLowerCase().includes(f.value.trim().toLowerCase()));
  };
  // 移除信件串後選到的條件可能已不存在，這時回到不篩選；搜尋則保留，讓使用者看到找不到
  const filter = picked && (picked.kind === "search" || all.some((m) => matches(picked, m))) ? picked : null;
  const toggle = (next: NonNullable<LogFilter>) => setPicked(filter?.kind === next.kind && filter.value === next.value ? null : next);

  // 主旨是整串共用的：同串有信比對到就只算那幾封，只有主旨符合時才算整串，封數才會和關鍵字清單一致
  const results = entries.map((e) => {
    const direct = e.rows.map((m) => matches(filter, m));
    const bySubject = filter?.kind === "search" && !direct.some(Boolean) && e.t.subject.toLowerCase().includes(filter.value.trim().toLowerCase());
    return { ...e, hits: direct.map((d) => d || bySubject) };
  });
  const hitCount = results.reduce((n, e) => n + e.hits.filter(Boolean).length, 0);
  const shown = results.filter((e) => e.hits.some(Boolean));
  const months = [...new Set(shown.map((e) => e.t.date.slice(0, 7)))];
  const byTime = [...all].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const first = byTime[0];
  const last = byTime[byTime.length - 1];
  const ago = daysSince(last.date);

  const people = new Map<string, { name: string; count: number; last: string }>();
  for (const m of byTime) {
    for (const name of new Set([m.fromName, m.to])) {
      if (name) people.set(name, { name, count: (people.get(name)?.count ?? 0) + 1, last: m.date });
    }
  }
  const staffOf = (name: string) => s.members.find((x) => x.name === name);
  const contacts = [...people.values()].sort((a, b) => b.last.localeCompare(a.last));
  const counts = new Map<string, number>();
  for (const k of all.flatMap((m) => m.keywords)) counts.set(k, (counts.get(k) ?? 0) + 1);
  const keywords = [...counts.entries()].sort((a, b) => b[1] - a[1]).filter(([k]) => filter?.kind !== "search" || keywordHit(filter, k));

  const chip = (k: string, n?: number) => (
    <button
      key={k}
      onClick={() => toggle({ kind: "keyword", value: k })}
      className={cn("rounded px-1.5 py-1 text-[11.5px] leading-none transition-colors", keywordHit(filter, k) ? "bg-brand-500 text-white" : "bg-ink-100 text-ink-600 hover:bg-ink-200")}
    >
      {k}
      {n != null && <span className="ml-1 tabular-nums opacity-70">{n}</span>}
    </button>
  );
  const contactGroup = (title: string, list: typeof contacts) =>
    list.length > 0 && (
      <div className="border-t border-ink-100 py-2">
        <p className="px-4 py-1 text-[12px] text-ink-500">{title}</p>
        {list.map((p) => (
          <button
            key={p.name}
            onClick={() => toggle({ kind: "contact", value: p.name })}
            className={cn("flex w-full items-center gap-2.5 px-4 py-1.5 text-left transition-colors", filter?.kind === "contact" && filter.value === p.name ? "bg-brand-50" : "hover:bg-ink-25")}
          >
            <Avatar m={staffOf(p.name) ?? { name: p.name, color: "#9CA5A3" }} size={24} />
            <span className="min-w-0 flex-1 truncate text-[13px] text-ink-900">{p.name}</span>
            <span className="shrink-0 text-[12px] tabular-nums text-ink-500">
              {p.count} 封・{fmtShort(p.last)}
            </span>
          </button>
        ))}
      </div>
    );

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_272px] items-start gap-4">
      <section className="min-w-0 overflow-hidden rounded-xl border border-ink-200 bg-white shadow-card">
        <header className="flex h-12 items-center gap-2 border-b border-ink-100 px-5 text-[13px]">
          <span className="font-semibold text-ink-900">通聯紀錄</span>
          <span className="text-[12px] text-ink-500">
            {linked.length} 串・{all.length} 封
          </span>
          {filter && (
            <button onClick={() => setPicked(null)} className="ml-auto flex items-center gap-1 rounded-md bg-brand-50 px-2 py-1 text-[12px] text-brand-700 hover:bg-brand-100">
              {filter.value}：{hitCount} 封
              <X className="size-3.5" />
            </button>
          )}
        </header>
        {shown.length === 0 && <Empty icon={<Search />} title={`沒有符合「${filter?.value}」的信件`} desc="搜尋範圍是關鍵字、主旨、人名與附件檔名，不含信件內文" />}
        {months.map((month) => (
          <div key={month}>
            <p className="border-b border-ink-100 bg-ink-25 px-5 py-1.5 text-[12px] font-medium text-ink-600">
              {month.slice(0, 4)} 年 {Number(month.slice(5))} 月
            </p>
            {shown
              .filter((e) => e.t.date.startsWith(month))
              .map(({ t, owner, rows, hits }) => (
                <article key={t.id} className="group border-b border-ink-100 px-5 py-4 last:border-b-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-[14px] font-semibold leading-snug text-ink-900">{t.subject}</h3>
                      <p className="mt-1 flex items-center gap-1.5 text-[12px] text-ink-600">
                        <Mail className="size-3.5 text-ink-400" />
                        {t.mailbox === s.me.id ? "在你的信箱" : `在 ${owner?.nickname ?? owner?.name} 的信箱`}
                        {t.mailbox === s.me.id && (
                          <button onClick={() => s.go({ page: "gmail", threadId: t.id })} className="flex items-center gap-0.5 text-brand-600 hover:underline">
                            到 Gmail 開啟
                            <ArrowUpRight className="size-3" />
                          </button>
                        )}
                      </p>
                    </div>
                    {/* 掃讀時不干擾，滑過這串信或用鍵盤移到時才出現 */}
                    <div className="opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                      <ThreadActions t={t} c={c} />
                    </div>
                  </div>
                  <div className="mt-3 border-t border-ink-100">
                    {rows.map((m, i) => {
                      const sent = s.members.some((x) => x.email === m.fromEmail);
                      return (
                        <div key={i} className={cn("grid grid-cols-[88px_16px_minmax(0,172px)_minmax(0,1fr)] items-center gap-x-2 border-b border-ink-50 py-2 text-[12.5px] last:border-b-0", !hits[i] && "opacity-35")}>
                          <span className="tabular-nums text-ink-500">
                            {fmtShort(m.date)} {m.time}
                          </span>
                          <span title={sent ? "恆永寄出" : "恆永收到"}>{sent ? <ArrowUpRight className="size-3.5 text-brand-600" /> : <ArrowDownLeft className="size-3.5 text-ink-400" />}</span>
                          <span className="truncate text-ink-800" title={m.fromEmail}>
                            {m.fromName} → {m.to}
                          </span>
                          <span className="flex min-w-0 flex-wrap items-center gap-1">
                            {m.keywords.map((k) => chip(k))}
                            {m.hasAttachment && (
                              <span className="flex min-w-0 max-w-full items-center gap-1 text-[12px] text-ink-500" title={m.hasAttachment}>
                                <Paperclip className="size-3 shrink-0 text-ink-400" />
                                <span className="truncate">{m.hasAttachment}</span>
                              </span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </article>
              ))}
          </div>
        ))}
      </section>
      <aside className="sticky top-4 overflow-hidden rounded-xl border border-ink-200 bg-white shadow-card">
        <div className="px-4 py-3">
          <SearchInput value={filter?.kind === "search" ? filter.value : ""} onChange={(v) => setPicked(v.trim() ? { kind: "search", value: v } : null)} placeholder="搜尋關鍵字、主旨、人名、附件" />
          <p className="mb-2 mt-3 text-[12px] text-ink-500">出現過的關鍵字</p>
          {keywords.length > 0 ? <div className="flex flex-wrap gap-1">{keywords.map(([k, n]) => chip(k, n))}</div> : <p className="text-[12px] text-ink-400">沒有符合的關鍵字</p>}
        </div>
        {contactGroup("客戶與外部", contacts.filter((p) => !staffOf(p.name)))}
        {contactGroup("恆永", contacts.filter((p) => staffOf(p.name)))}
        <div className="border-t border-ink-100 px-4 py-3">
          <p className="text-[12px] text-ink-500">最後聯絡</p>
          <p className="mt-0.5 text-[18px] font-semibold text-ink-900">{ago <= 0 ? "今天" : `${ago} 天前`}</p>
          <p className="mt-0.5 truncate text-[12px] text-ink-500">
            {fmtDate(last.date)}・{last.fromName} → {last.to}
          </p>
          <p className="mt-3 text-[12px] text-ink-500">往來期間</p>
          <p className="mt-0.5 text-[13px] tabular-nums text-ink-800">
            {fmtDate(first.date)} – {fmtDate(last.date)}
          </p>
        </div>
      </aside>
    </div>
  );
}

function SuggestedBar({ c, list }: { c: Case; list: EmailThread[] }) {
  const s = useStore();
  const [expanded, setExpanded] = useState(false);
  const others = s.visibleCases.filter((x) => x.id !== c.id);
  const link = (t: EmailThread, caseId: string, how: string) => {
    s.updateThread(t.id, { state: "linked", caseId, linkedBy: s.me.id, linkedAt: nowStamp() });
    s.log({ module: "Email", caseId, target: t.subject, action: how });
    s.toast(caseId === c.id ? "已加入本案通聯紀錄" : `已歸檔至 ${caseId}`);
  };
  return (
    <div className="rounded-xl border border-ink-200 bg-white shadow-card">
      <button onClick={() => setExpanded((v) => !v)} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-[13px] text-ink-800" aria-expanded={expanded}>
        <CircleAlert className="size-4 shrink-0 text-brand-500" />
        <span className="flex-1">
          有 <span className="font-medium">{list.length}</span> 串信件可能屬於本案，確認後才會加入通聯紀錄
        </span>
        <span className="text-[12.5px] text-ink-500">{expanded ? "收合" : "查看"}</span>
        <ChevronDown className={cn("size-4 text-ink-400 transition-transform", expanded && "rotate-180")} />
      </button>
      {expanded && (
        <div className="border-t border-ink-100">
          {list.map((t) => (
            <div key={t.id} className="flex items-center gap-4 border-b border-ink-100 px-4 py-3 last:border-b-0">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] text-ink-900">
                  <span className="font-medium">{t.subject}</span>
                  {t.count > 1 && <span className="ml-1.5 text-[12px] text-ink-400">{t.count} 封</span>}
                </p>
                <p className="mt-0.5 truncate text-[12px] text-ink-500">
                  {t.fromName}・{fmtShort(t.date)} {t.time}・{t.reasons?.join("、")}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<EyeOff className="size-3.5" />}
                  onClick={() => {
                    s.updateThread(t.id, { state: "ignored" });
                    s.log({ module: "Email", caseId: c.id, target: t.subject, action: "忽略建議" });
                    s.toast("已忽略", "info");
                  }}
                >
                  忽略
                </Button>
                <Popover
                  align="right"
                  width={320}
                  trigger={({ toggle }) => (
                    <Button size="sm" onClick={toggle}>
                      改選
                    </Button>
                  )}
                >
                  {(close) => (
                    <OptionList
                      searchAt={1}
                      placeholder="搜尋案件編號或客戶"
                      selected={[]}
                      options={[
                        ...(t.suggestedCaseIds ?? []).filter((x) => x !== c.id && others.some((o) => o.id === x)).map((id) => ({ value: id, label: id, hint: "候選" })),
                        ...others.filter((o) => !t.suggestedCaseIds?.includes(o.id)).map((o) => ({ value: o.id, label: o.id, hint: s.customerOf(o).short })),
                      ]}
                      onPick={(id) => (link(t, id, "改選案件後歸檔"), close())}
                    />
                  )}
                </Popover>
                <Button size="sm" variant="brand" icon={<Check className="size-3.5" />} onClick={() => link(t, c.id, "確認系統建議並歸檔")}>
                  歸到本案
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ThreadActions({ t, c }: { t: EmailThread; c: Case }) {
  const s = useStore();
  return (
    <div className="flex shrink-0 gap-1">
      <Popover
        align="right"
        width={300}
        trigger={({ toggle }) => (
          <Button size="sm" variant="ghost" onClick={toggle}>
            重新指定
          </Button>
        )}
      >
        {(close) => (
          <OptionList
            searchAt={1}
            placeholder="搜尋案件編號或客戶"
            selected={[]}
            options={s.visibleCases.filter((x) => x.id !== c.id).map((o) => ({ value: o.id, label: o.id, hint: s.customerOf(o).short }))}
            onPick={(id) => {
              s.updateThread(t.id, { caseId: id, linkedBy: s.me.id, linkedAt: nowStamp() });
              s.log({ module: "Email", caseId: id, target: t.subject, action: "重新指定案件", before: c.id, after: id });
              s.toast(`已改歸檔至 ${id}`);
              close();
            }}
          />
        )}
      </Popover>
      <Button
        size="sm"
        variant="ghost"
        icon={<Unlink className="size-3.5" />}
        onClick={() => {
          s.updateThread(t.id, { state: "none", caseId: undefined });
          s.log({ module: "Email", caseId: c.id, target: t.subject, action: "移除關聯" });
          s.toast("已從通聯紀錄移除", "info", { label: "復原", run: () => s.updateThread(t.id, { state: "linked", caseId: c.id }) });
        }}
      >
        移除
      </Button>
    </div>
  );
}

// 整串信由舊到新完整列出，讓接手的人不用翻別人的信箱就能看懂來龍去脈
function ThreadReader({ t, c }: { t: EmailThread; c: Case }) {
  const s = useStore();
  const owner = s.memberOf(t.mailbox);
  const by = s.memberOf(t.linkedBy);
  const messages = threadMessages(t, owner?.name ?? "");
  return (
    <section className="min-w-0 rounded-xl border border-ink-200 bg-white shadow-card">
      <header className="flex items-start justify-between gap-4 border-b border-ink-100 px-6 py-4">
        <div className="min-w-0">
          <h3 className="text-[16px] font-semibold leading-snug text-ink-900">{t.subject}</h3>
          <p className="mt-1 text-[12px] text-ink-500">
            {messages.length} 封・來自 {owner?.nickname ?? owner?.name} 的信箱・{by?.nickname ?? by?.name} 於 {t.linkedAt} 歸檔
          </p>
        </div>
        <ThreadActions t={t} c={c} />
      </header>
      <div className="divide-y divide-ink-100">
        {messages.map((m, i) => {
          const staff = s.members.find((x) => x.email === m.fromEmail);
          return (
            <article key={i} className="px-6 py-5">
              <div className="flex items-start gap-3">
                <Avatar m={staff ?? { name: m.fromName, color: "#9CA5A3" }} size={32} />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-x-2 text-[13px]">
                    <span className="font-medium text-ink-900">{m.fromName}</span>
                    {staff && <Badge tone="outline">恆永</Badge>}
                    <span className="text-[12px] text-ink-400">{m.fromEmail}</span>
                  </p>
                  <p className="mt-0.5 text-[12px] text-ink-500">寄給 {m.to}</p>
                </div>
                <span className="shrink-0 text-[12px] tabular-nums text-ink-400">
                  {fmtDate(m.date)} {m.time}
                </span>
              </div>
              <div className="ml-11 mt-3 space-y-2 text-[13.5px] leading-relaxed text-ink-800">
                {m.body.map((p, j) => (
                  <p key={j}>{p}</p>
                ))}
                {m.signature && (
                  <div className="pt-2 text-[12px] leading-relaxed text-ink-500">
                    {m.signature.map((l) => (
                      <p key={l}>{l}</p>
                    ))}
                  </div>
                )}
                {m.hasAttachment && (
                  <p className="!mt-3 inline-flex items-center gap-1.5 rounded-lg border border-ink-200 px-2.5 py-1.5 text-[12.5px] text-ink-700">
                    <Paperclip className="size-3.5 text-ink-400" />
                    {m.hasAttachment}
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
