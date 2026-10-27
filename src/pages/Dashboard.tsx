import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, CircleCheck, Plus } from "lucide-react";
import { useStore } from "../lib/store";
import type { Case } from "../lib/types";
import { ACTIVE_STATUSES, TODAY, addDays, agingBucket, cn, contractTotal, daysUntil, fmtDate, inRange, iso, lineOf, money, openParam, periodState, toDate, weekRange, weekday, withTax } from "../lib/utils";
import { Avatar, Badge, Button, Card, Empty, Segmented, StatGroup, ease } from "../components/ui";
import { openNotif } from "../components/layout";
import { NotifIcon } from "./Notifications";
import { NewCaseModal } from "./cases/NewCaseModal";

type Range = "week" | "month" | "year";
type Span = readonly [string, string];
type Line = "all" | "ISCC" | "ISCC 以外";
const RANGE_LABEL: Record<Range, string> = { week: "本週", month: "本月", year: "今年" };
const PREV_LABEL: Record<Range, string> = { week: "上週", month: "上月", year: "去年" };

const rangeOf = (r: Range): Span => (r === "week" ? weekRange() : r === "month" ? [TODAY.slice(0, 8) + "01", TODAY] : [TODAY.slice(0, 5) + "01-01", TODAY]);
const prevRangeOf = (r: Range): Span => {
  if (r === "week") {
    const [a, b] = weekRange();
    return [addDays(a, -7), addDays(b, -7)];
  }
  if (r === "month") {
    const first = toDate(TODAY.slice(0, 8) + "01");
    return [iso(new Date(first.getFullYear(), first.getMonth() - 1, 1)), addDays(iso(first), -1)];
  }
  const y = Number(TODAY.slice(0, 4)) - 1;
  return [`${y}-01-01`, `${y}-12-31`];
};

const METRICS: { name: string; date: (c: Case) => string | undefined }[] = [
  { name: "新增案件", date: (c) => c.createdAt.replace(/\//g, "-") },
  { name: "拜訪", date: (c) => c.milestones.visit },
  { name: "寄出企劃書", date: (c) => c.milestones.proposalSent },
  { name: "簽約", date: (c) => c.milestones.signed },
];

// 總覽：先看數字（手上幾件、這段期間做了多少），再看待辦、證書到期與帳務
// 全部案件範圍：進行中＋活動量；僅參與範圍：只顯示我的進行中案件。證書到期給有建立案件權限的人（處理動作是建立續證案件）
export function Dashboard() {
  const s = useStore();
  const [creating, setCreating] = useState(openParam("newCase"));
  const [range, setRange] = useState<Range>("month");
  const [line, setLine] = useState<Line>("all");
  const company = s.perms.casesScope === "all";
  const cases = s.visibleCases.filter((c) => line === "all" || lineOf(c.item) === line);
  const active = cases.filter((c) => ACTIVE_STATUSES.includes(s.statusOf(c)));
  const r = rangeOf(range);
  const prev = prevRangeOf(range);
  const label = RANGE_LABEL[range];
  const lineLabel = line === "all" ? "" : `${line}・`;
  const showRenewal = s.perms.casesCreate && s.visibleCases.some((c) => c.milestones.certExpiry && daysUntil(c.milestones.certExpiry) >= 0 && daysUntil(c.milestones.certExpiry) <= s.settings.renewDays[0]);
  const hasMain = !company || showRenewal || s.perms.financeAmounts;
  // 進行中案件是目前的總數，不隨期間變動，與活動量分開放
  const inProgress = {
    label: company ? "進行中案件" : "我的進行中案件",
    value: active.length,
    sub: <>共 {cases.length} 件</>,
    onClick: () => s.go({ page: "cases", filter: { ids: active.map((c) => c.id), label: `${lineLabel}${company ? "進行中案件" : "我的進行中案件"}` } }),
  };

  return (
    <div className="px-8 py-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[13px] text-ink-500">
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
          {(company || s.perms.financeAmounts) && (
            <Segmented
              value={range}
              onChange={setRange}
              items={[
                { value: "week", label: "本週" },
                { value: "month", label: "本月" },
                { value: "year", label: "今年" },
              ]}
            />
          )}
          {s.perms.casesCreate && (
            <Button variant="dark" icon={<Plus className="size-4" />} onClick={() => setCreating(true)}>
              新增案件
            </Button>
          )}
        </div>
      </div>

      {company && (
        <div className="mt-6 grid grid-cols-[minmax(0,1fr)_minmax(0,4fr)] gap-5">
          <StatGroup items={[inProgress]} />
          <StatGroup
            items={METRICS.map((m) => {
              const now = cases.filter((c) => inRange(m.date(c), r));
              const before = cases.filter((c) => inRange(m.date(c), prev)).length;
              return {
                label: `${label}${m.name}`,
                value: now.length,
                sub: (
                  <>
                    {PREV_LABEL[range]} {before}
                  </>
                ),
                onClick: now.length ? () => s.go({ page: "cases", filter: { ids: now.map((c) => c.id), label: `${lineLabel}${label}${m.name}` } }) : undefined,
              };
            })}
          />
        </div>
      )}

      <div className={cn("mt-5 grid items-start gap-5", hasMain && "grid-cols-[minmax(0,1fr)_340px]")}>
        {hasMain && (
          <div className="min-w-0 space-y-5">
            {!company && (
              <div className="max-w-[240px]">
                <StatGroup items={[inProgress]} />
              </div>
            )}
            {showRenewal && <RenewalRadar cases={s.visibleCases} />}
            {s.perms.financeAmounts && <Finance cases={s.visibleCases} range={range} />}
          </div>
        )}
        <div className={cn(hasMain && "sticky top-6")}>
          <Todos compact={hasMain} />
        </div>
      </div>
      <NewCaseModal open={creating} onClose={() => setCreating(false)} />
    </div>
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
      title={
        <span className="flex items-baseline gap-2">
          待辦
          <span className="text-[12.5px] font-normal text-ink-500">
            {todos.length} 則{unread ? `・未讀 ${unread}` : ""}
          </span>
        </span>
      }
      pad={false}
      action={
        <button onClick={() => s.go({ page: "notifications" })} className="flex items-center gap-1 text-[12.5px] font-medium text-brand-600 hover:text-brand-700">
          全部 <ArrowRight className="size-3.5" />
        </button>
      }
    >
      {todos.length === 0 && <Empty icon={<CircleCheck />} title="目前沒有待辦事項" />}
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
          className="flex w-full items-start gap-2.5 border-b border-ink-100 px-4 py-2.5 text-left transition-colors last:border-b-0 hover:bg-ink-25"
        >
          <NotifIcon type={n.type} />
          <span className="min-w-0 flex-1">
            <span className={cn("block text-[12.5px] leading-snug text-ink-900", compact ? "line-clamp-2" : "truncate", n.status === "未讀" ? "font-semibold" : "font-medium")}>{n.title}</span>
            <span className="mt-0.5 block truncate text-[11px] text-ink-400">
              {n.type}・{n.createdAt.slice(5, 10)}
            </span>
          </span>
          {n.status === "未讀" && <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-500" />}
        </motion.button>
      ))}
    </Card>
  );
}

// 續證雷達：續證準備天數內到期的證書，依到期日排序
function RenewalRadar({ cases }: { cases: Case[] }) {
  const s = useStore();
  const days = s.settings.renewDays[0];
  const list = cases
    .filter((c) => c.milestones.certExpiry && daysUntil(c.milestones.certExpiry) >= 0 && daysUntil(c.milestones.certExpiry) <= days)
    .sort((a, b) => a.milestones.certExpiry!.localeCompare(b.milestones.certExpiry!));
  if (!list.length) return null;
  return (
    <Card
      title={
        <span className="flex items-baseline gap-2">
          證書到期
          <span className="text-[12.5px] font-normal text-ink-500">
            {days} 天內 {list.length} 件
          </span>
        </span>
      }
      pad={false}
    >
      {list.map((c) => {
        const renewal = s.cases.find((x) => x.previousCase === c.id);
        const owner = s.memberOf(c.owner);
        return (
          <button key={c.id} onClick={() => s.go({ page: "case", id: c.id })} className="flex w-full items-center gap-4 border-b border-ink-100 px-5 py-2.5 text-left transition-colors last:border-b-0 hover:bg-ink-25">
            <span className="w-24 shrink-0 text-[12.5px] tabular-nums text-ink-700">{fmtDate(c.milestones.certExpiry)}</span>
            <span className="w-20 shrink-0 text-[12.5px] tabular-nums text-ink-500">{daysUntil(c.milestones.certExpiry!)} 天後</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium text-ink-900">
                {s.customerOf(c).short}
                {c.site ? ` ${c.site}` : ""} {c.item}
              </span>
              <span className="block truncate font-mono text-[11px] text-ink-400">{c.id}</span>
            </span>
            <span className="flex w-28 shrink-0 items-center gap-1.5 text-[12px] text-ink-500">
              <Avatar m={owner} size={20} />
              <span className="truncate">{owner?.nickname ?? owner?.name}</span>
            </span>
            <span className="w-32 shrink-0 text-right">
              {renewal ? <Badge tone="outline">已建立續證案件</Badge> : c.noRenew ? <Badge tone="gray">本次不續證</Badge> : <span className="text-[12px] text-ink-400">尚未建立續證案件</span>}
            </span>
          </button>
        );
      })}
    </Card>
  );
}

// 帳務：金額一律為含稅
function Finance({ cases, range }: { cases: Case[]; range: Range }) {
  const s = useStore();
  const r = rangeOf(range);
  const label = RANGE_LABEL[range];
  const ar = cases.flatMap((c) => c.periods.map((p) => ({ c, p, st: periodState(c, p) }))).filter((x) => x.st.pay === "待收款");
  const signed = cases.filter((c) => inRange(c.milestones.signed, r) && contractTotal(c) > 0);
  const paid = cases.flatMap((c) => c.periods).filter((p) => inRange(p.paidDate, r));
  const toFinance = s.perms.financeCenter ? () => s.go({ page: "finance", tab: "billing" }) : undefined;

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[13px] font-semibold text-ink-700">帳務（含稅）</h2>
        {toFinance && (
          <button onClick={toFinance} className="flex items-center gap-1 text-[12.5px] font-medium text-brand-600 hover:text-brand-700">
            財務中心 <ArrowRight className="size-3.5" />
          </button>
        )}
      </div>
      <div className="space-y-3">
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

// 應收帳款依開票後天數分段（PRD 3.2 應收帳款總覽）
function Aging({ ar }: { ar: { p: { amount: number }; st: { overdue: number } }[] }) {
  const buckets = ["0–30 天", "31–60 天", "61–90 天", "90 天以上"].map((b) => ({ b, amt: 0, n: 0 }));
  for (const x of ar) {
    const k = buckets.find((y) => y.b === agingBucket(x.st.overdue))!;
    k.amt += withTax(x.p.amount);
    k.n += 1;
  }
  const total = Math.max(1, buckets.reduce((n, b) => n + b.amt, 0));
  return (
    <div className="rounded-xl border border-ink-200 bg-white px-5 py-4 shadow-card">
      <p className="text-[13px] font-medium text-ink-600">應收帳款帳齡</p>
      <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-ink-100">
        {buckets.map((a, i) => (
          <motion.div key={a.b} className="h-full" style={{ background: ["#ABD4CF", "#7DB9B2", "#4F9A92", "#23504B"][i] }} initial={{ width: 0 }} animate={{ width: `${(a.amt / total) * 100}%` }} transition={{ duration: 0.5, ease }} />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-4 gap-3">
        {buckets.map((a, i) => (
          <div key={a.b}>
            <p className="flex items-center gap-1.5 text-[12px] text-ink-500">
              <span className="size-2 rounded-full" style={{ background: ["#ABD4CF", "#7DB9B2", "#4F9A92", "#23504B"][i] }} />
              {a.b}
            </p>
            <p className="mt-1 text-[15px] font-semibold tabular-nums text-ink-900">{money(a.amt)}</p>
            <p className="text-[11.5px] text-ink-400">{a.n} 筆</p>
          </div>
        ))}
      </div>
    </div>
  );
}
