import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, CircleCheck, Plus, TrendingUp } from "lucide-react";
import { useStore } from "../lib/store";
import type { Case, CaseStatus } from "../lib/types";
import { ACTIVE_STATUSES, AGING, STATUSES, TODAY, agingBucket, cn, contractTotal, daysUntil, fmtDate, inRange, lineOf, money, openParam, periodState, weekRange, weekday, withTax } from "../lib/utils";
import { Button, Card, Empty, Segmented, StatGroup, ease } from "../components/ui";
import { NotifBell, openNotif } from "../components/layout";
import { NotifIcon, NotifKind } from "./Notifications";
import { NewCaseModal } from "./cases/NewCaseModal";

type Range = "week" | "month" | "year";
type Span = readonly [string, string];
type Line = "all" | "ISCC" | "ISCC 以外";
const RANGE_LABEL: Record<Range, string> = { week: "本週", month: "本月", year: "今年" };

const rangeOf = (r: Range): Span => (r === "week" ? weekRange() : r === "month" ? [TODAY.slice(0, 8) + "01", TODAY] : [TODAY.slice(0, 5) + "01-01", TODAY]);
// 活動量底下標這批案件有多少已進到下一階段，依案件目前的狀態判斷，手動改狀態也算；只呈現事實，0 件不做警示
const METRICS: { name: string; date: (c: Case) => string | undefined; next: string; reached: CaseStatus }[] = [
  { name: "新增案件", date: (c) => c.createdAt.replace(/\//g, "-"), next: "進企劃", reached: "企劃書撰寫中" },
  { name: "拜訪", date: (c) => c.milestones.visit, next: "進企劃", reached: "企劃書撰寫中" },
  { name: "寄出企劃書", date: (c) => c.milestones.proposalSent, next: "簽約", reached: "已簽約排課中" },
  { name: "簽約", date: (c) => c.milestones.signed, next: "開課", reached: "輔導中" },
];

// 總覽：先看數字（手上幾件、這段期間做了多少），再看待辦、證書到期與帳務
// 全部案件範圍看全公司，僅參與範圍看自己的案件；證書到期給有建立案件權限的人（處理動作是建立續證案件）
export function Dashboard() {
  const s = useStore();
  const [creating, setCreating] = useState(openParam("newCase"));
  const [range, setRange] = useState<Range>("month");
  const [line, setLine] = useState<Line>("all");
  const company = s.perms.casesScope === "all";
  const cases = s.visibleCases.filter((c) => line === "all" || lineOf(c.item) === line);
  const active = cases.filter((c) => ACTIVE_STATUSES.includes(s.statusOf(c)));
  const r = rangeOf(range);
  const label = RANGE_LABEL[range];
  const lineLabel = line === "all" ? "" : `${line}・`;
  // 證書到期是目前的存量，不隨期間變動；標示已建立續證案件的件數，與活動量的推進標記同一種寫法
  const renewDays = s.settings.renewDays[0];
  const expiring = cases.filter((c) => c.milestones.certExpiry && daysUntil(c.milestones.certExpiry) >= 0 && daysUntil(c.milestones.certExpiry) <= renewDays);
  // 進行中案件是目前的總數，不隨期間變動，與活動量分開放
  const inProgress = {
    label: company ? "進行中案件" : "我的進行中案件",
    value: active.length,
    sub: <>共 {cases.length} 件</>,
    period: label,
    added: cases.filter((c) => inRange(c.createdAt.replace(/\//g, "-"), r)).length,
    onClick: () => s.go({ page: "cases", filter: { ids: active.map((c) => c.id), label: `${lineLabel}${company ? "進行中案件" : "我的進行中案件"}` } }),
  };

  return (
    <div className="px-8 py-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[13px] text-ink-600">
            {fmtDate(TODAY)} {weekday(TODAY)}
          </p>
          <h1 className="mt-1 text-[24px] font-semibold tracking-tight text-ink-900">總覽</h1>
        </div>
        <div className="flex items-center gap-2">
          {company && (
            <Segmented
              value={line}
              onChange={setLine}
              items={[
                { value: "all", label: "全部" },
                { value: "ISCC", label: "ISCC" },
                { value: "ISCC 以外", label: "ISCC 以外" },
              ]}
            />
          )}
          <Segmented
            value={range}
            onChange={setRange}
            items={[
              { value: "week", label: "本週" },
              { value: "month", label: "本月" },
              { value: "year", label: "今年" },
            ]}
          />
          {s.perms.casesCreate && (
            <Button variant="dark" icon={<Plus className="size-4" />} onClick={() => setCreating(true)}>
              新增案件
            </Button>
          )}
          <NotifBell />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-[minmax(0,1.35fr)_minmax(0,4fr)] gap-5">
        <HeroStat {...inProgress} />
        <MetricStrip
          items={[
            ...METRICS.map((m) => {
            const now = cases.filter((c) => inRange(m.date(c), r));
            return {
              label: `${label}${m.name}`,
              value: now.length,
              advanced: now.filter((c) => STATUSES.indexOf(s.statusOf(c)) >= STATUSES.indexOf(m.reached)).length,
              next: m.next,
              onClick: now.length ? () => s.go({ page: "cases", filter: { ids: now.map((c) => c.id), label: `${lineLabel}${label}${m.name}` } }) : undefined,
            };
          }),
            ...(s.perms.casesCreate
              ? [
                  {
                    label: "證書到期",
                    hint: `${renewDays} 天內到期的證書`,
                    value: expiring.length,
                    advanced: expiring.filter((c) => s.cases.some((x) => x.previousCase === c.id)).length,
                    next: "建立續證",
                    onClick: expiring.length ? () => s.go({ page: "cases", filter: { ids: expiring.map((c) => c.id), label: `${lineLabel}證書 ${renewDays} 天內到期` } }) : undefined,
                  },
                ]
              : []),
          ]}
        />
      </div>

      <div className="mt-5 grid grid-cols-[minmax(0,1fr)_340px] items-start gap-5">
        <div className="min-w-0 space-y-5">
          <StatusBreakdown cases={cases} prefix={lineLabel} />
          {s.perms.financeAmounts && <Finance cases={s.visibleCases} range={range} />}
        </div>
        <div className="sticky top-6">
          <Todos compact />
        </div>
      </div>
      <NewCaseModal open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}

// 本期活動量：不加框，靠留白與細分隔線區分；可點的項目滑過才出現底色
function MetricStrip({ items }: { items: { label: string; hint?: string; value: number; advanced: number; next: string; onClick?: () => void }[] }) {
  return (
    <div className="grid" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
      {items.map((m, i) => (
        <button
          key={m.label}
          type="button"
          onClick={m.onClick}
          disabled={!m.onClick}
          title={m.hint}
          className={cn("relative flex flex-col justify-center rounded-lg px-4 py-[18px] text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-default", m.onClick && "hover:bg-brand-100/60")}
        >
          {i > 0 && <span aria-hidden className="absolute inset-y-5 left-0 w-px bg-ink-900/[.08]" />}
          <span className="block whitespace-nowrap text-[13px] font-medium text-ink-700">{m.label}</span>
          <motion.span key={m.value} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease }} className="mt-2 block font-num text-[28px] font-semibold leading-none tracking-tight text-ink-900 tabular-nums">
            {m.value}
          </motion.span>
          <span className={cn("mt-2 flex items-center gap-1 whitespace-nowrap text-[12px] tabular-nums", m.advanced ? "font-medium text-brand-700" : "text-ink-600")}>
            {m.advanced > 0 && <TrendingUp className="size-3.5 shrink-0" />}
            {m.advanced} 件已{m.next}
          </span>
        </button>
      ))}
    </div>
  );
}

// 最重要的數字用深色卡凸顯
function HeroStat({ label, value, sub, period, added, onClick }: { label: string; value: number; sub: React.ReactNode; period: string; added: number; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="glass-dark glass-arc flex h-full w-full flex-col justify-center rounded-xl px-5 py-[18px] text-left transition duration-150 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2">
      <span className="block whitespace-nowrap text-[13px] font-medium text-white/80">{label}</span>
      <span className="mt-2 flex items-baseline gap-1">
        <motion.span key={value} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease }} className="font-num text-[36px] font-semibold leading-none tracking-tight text-white tabular-nums">
          {value}
        </motion.span>
        <span className="text-[14px] font-medium text-white/80">件</span>
      </span>
      <span className="mt-2 flex items-center gap-2 whitespace-nowrap text-[12px] text-white/90">
        <span className={cn("flex items-center gap-1 tabular-nums", added > 0 && "font-medium text-brand-100")}>
          {added > 0 && <TrendingUp className="size-3.5" />}
          {period}新增 {added} 件
        </span>
        <span aria-hidden className="h-3 w-px bg-white/25" />
        {sub}
      </span>
    </button>
  );
}

// 案件狀態分布：只列目前有案件的狀態，依流程順序由淺到深；點狀態可看該批案件
const mixHex = (from: number[], to: number[], t: number) => `rgb(${from.map((c, i) => Math.round(c + (to[i] - c) * t)).join(",")})`;

function StatusBreakdown({ cases, prefix }: { cases: Case[]; prefix: string }) {
  const s = useStore();
  const rows = STATUSES.map((st) => ({ st, list: cases.filter((c) => s.statusOf(c) === st) })).filter((x) => x.list.length);
  const colorOf = (i: number) => (rows.length > 1 ? mixHex([171, 212, 207], [21, 48, 45], i / (rows.length - 1)) : "#32716A");
  return (
    <Card
      glass
      pad={false}
      title={
        <span className="flex items-baseline gap-2">
          案件狀態
          <span className="text-[12.5px] font-normal text-ink-600">共 {cases.length} 件</span>
        </span>
      }
    >
      {rows.length === 0 ? (
        <Empty icon={<CircleCheck />} title="目前沒有案件" />
      ) : (
        <div className="glass-tile mx-2 mb-2 rounded-lg p-3">
          <div className="flex h-5 gap-0.5 overflow-hidden rounded-md">
            {rows.map((x, i) => (
              <motion.div key={x.st} title={`${x.st} ${x.list.length} 件`} className="h-full" style={{ background: colorOf(i) }} initial={{ width: 0 }} animate={{ width: `${(x.list.length / cases.length) * 100}%` }} transition={{ duration: 0.5, ease }} />
            ))}
          </div>
          <div className="mt-2 grid gap-1" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(104px, 1fr))" }}>
            {rows.map((x, i) => (
              <button
                key={x.st}
                type="button"
                onClick={() => s.go({ page: "cases", filter: { ids: x.list.map((c) => c.id), label: `${prefix}${x.st}` } })}
                className="rounded-md px-1.5 py-1.5 text-left transition-colors duration-150 hover:bg-brand-100/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <span className="flex items-center gap-1.5 whitespace-nowrap text-[12px] text-ink-600">
                  <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: colorOf(i) }} />
                  {x.st}
                </span>
                <span className="mt-1 flex items-baseline gap-1">
                  <span className="font-num text-[20px] font-semibold leading-none text-ink-900 tabular-nums">{x.list.length}</span>
                  <span className="text-[12px] text-ink-600">件</span>
                  <span className="ml-1 text-[12px] tabular-nums text-ink-600">{Math.round((x.list.length / cases.length) * 100)}%</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

// 待辦：只列前幾則，完整清單在通知中心；有主欄內容時收在右側窄欄
function Todos({ compact }: { compact?: boolean }) {
  const s = useStore();
  const todos = s.myNotifs.filter((n) => n.status !== "已完成");
  const unread = todos.filter((n) => n.status === "未讀").length;
  const shown = todos.slice(0, 6);
  return (
    <Card
      glass
      title={
        <span className="flex items-baseline gap-2">
          待辦
          <span className="text-[12.5px] font-normal text-ink-600">
            {todos.length} 則{unread ? `・未讀 ${unread}` : ""}
          </span>
        </span>
      }
      pad={false}
      action={
        <button onClick={() => s.go({ page: "notifications" })} className="flex items-center gap-1 text-[12.5px] font-medium text-brand-700 hover:text-brand-900">
          全部 <ArrowRight className="size-3.5" />
        </button>
      }
    >
      {todos.length === 0 && <Empty icon={<CircleCheck />} title="目前沒有待辦事項" />}
      <div className={cn("space-y-1.5 px-2", shown.length > 0 && "pb-2")}>
      {shown.map((n, i) => (
        <motion.button
          key={n.key}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, ease, delay: i * 0.02 }}
          onClick={() => {
            s.markRead(n.key);
            openNotif(s, n);
          }}
          className="glass-tile flex w-full items-start gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-brand-100/70"
        >
          <NotifIcon type={n.type} />
          <span className="min-w-0 flex-1">
            <span className={cn("block text-[12.5px] leading-snug text-ink-900", compact ? "line-clamp-2" : "truncate", n.status === "未讀" ? "font-semibold" : "font-medium")}>{n.title}</span>
            <span className="mt-0.5 flex items-center gap-1.5 truncate text-[11px] text-ink-600">
              <NotifKind type={n.type} quiet />
              <span>・{n.createdAt.slice(5, 10)}</span>
            </span>
          </span>
          {n.status === "未讀" && <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-500" />}
        </motion.button>
      ))}
      </div>
    </Card>
  );
}

// 帳務：金額一律為含稅
function Finance({ cases, range }: { cases: Case[]; range: Range }) {
  const s = useStore();
  const r = rangeOf(range);
  const label = RANGE_LABEL[range];
  const ar = cases.flatMap((c) => c.periods.map((p) => ({ c, p, st: periodState(p, s.settings.payDays) }))).filter((x) => x.st.pay === "待收款");
  const signed = cases.filter((c) => inRange(c.milestones.signed, r) && contractTotal(c) > 0);
  const paid = cases.flatMap((c) => c.periods).filter((p) => inRange(p.paidDate, r));
  const toFinance = s.perms.financeCenter ? () => s.go({ page: "finance", tab: "billing" }) : undefined;

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[13px] font-semibold text-ink-800">帳務（含稅）</h2>
        {toFinance && (
          <button onClick={toFinance} className="flex items-center gap-1 text-[12.5px] font-medium text-brand-700 hover:text-brand-900">
            財務中心 <ArrowRight className="size-3.5" />
          </button>
        )}
      </div>
      <div className="space-y-5">
        <StatGroup
          items={[
            { label: `${label}簽約金額`, value: money(signed.reduce((n, c) => n + withTax(contractTotal(c)), 0)), sub: <>{signed.length} 件</> },
            { label: `${label}已收款`, value: money(paid.reduce((n, p) => n + withTax(p.amount), 0)), sub: <>{paid.length} 筆</> },
            { label: "未收金額", value: money(ar.reduce((n, x) => n + withTax(x.p.amount), 0)), sub: <>{ar.length} 筆</>, onClick: toFinance },
          ]}
        />
        <Aging ar={ar} />
      </div>
    </section>
  );
}

// 帳齡：逾期越久主色越深，只有最嚴重的一段用紅
const AGING_COLOR = ["#C8CFCE", "#ABD4CF", "#5AA69E", "#1C514B", "#BA3E44"];

// 應收帳款依超過約定付款日的天數分段（PRD 3.2 應收帳款總覽：未收金額、逾期天數）
function Aging({ ar }: { ar: { p: { amount: number }; st: { overdue: number } }[] }) {
  const buckets = AGING.map((b) => ({ b, amt: 0, n: 0 }));
  for (const x of ar) {
    const k = buckets.find((y) => y.b === agingBucket(x.st.overdue))!;
    k.amt += withTax(x.p.amount);
    k.n += 1;
  }
  const total = Math.max(1, buckets.reduce((n, b) => n + b.amt, 0));
  return (
    <div className="glass-surface glass-arc glass-arc-corner rounded-xl p-2">
      <p className="px-2 pt-1 text-[13px] font-medium text-ink-700">應收帳款帳齡</p>
      <div className="mx-2 mt-3 flex h-2.5 overflow-hidden rounded-full bg-ink-100">
        {buckets.map((a, i) => (
          <motion.div key={a.b} className="h-full" style={{ background: AGING_COLOR[i] }} initial={{ width: 0 }} animate={{ width: `${(a.amt / total) * 100}%` }} transition={{ duration: 0.5, ease }} />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-5 gap-2">
        {buckets.map((a, i) => (
          <div key={a.b} className="glass-tile rounded-lg px-3 py-2.5">
            <p className="flex items-center gap-1.5 text-[12px] text-ink-600">
              <span className="size-2 rounded-full" style={{ background: AGING_COLOR[i] }} />
              {a.b}
            </p>
            <p className="mt-1 font-num text-[15px] font-semibold tabular-nums text-ink-900">{money(a.amt)}</p>
            <p className="text-[11.5px] text-ink-600">{a.n} 筆</p>
          </div>
        ))}
      </div>
    </div>
  );
}
