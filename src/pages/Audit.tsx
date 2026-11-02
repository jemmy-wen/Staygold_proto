import { useMemo, useState } from "react";
import { CalendarDays, ChevronDown, History } from "lucide-react";
import { useStore } from "../lib/store";
import type { AuditEntry } from "../lib/types";
import { ActivityTimeline, auditDay } from "../components/Activity";
import { Button, Empty, Input, OptionList, PageHeader, Popover, SearchInput } from "../components/ui";
import { FilterChips, FilterMenu, Toolbar, pass, useFacets, type Facet } from "../components/filters";
import { TODAY, addDays, fmtDate, inRange, weekRange } from "../lib/utils";

const MODULES: AuditEntry["module"][] = ["案件", "客戶", "財務", "差旅費", "Email", "成員與權限", "系統設定"];
type Span = { label: string; from: string; to: string };
const PRESETS: Span[] = [
  { label: "今天", from: TODAY, to: TODAY },
  { label: "本週", from: weekRange()[0], to: weekRange()[1] },
  { label: "本月", from: TODAY.slice(0, 8) + "01", to: TODAY },
  { label: "近 30 天", from: addDays(TODAY, -29), to: TODAY },
];

// 時間：常用區間一鍵選，也可自訂起訖日（只填一邊也可以）
function TimeFilter({ value, onChange }: { value: Span | null; onChange: (v: Span | null) => void }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  return (
    <Popover
      width={260}
      scroll={false}
      trigger={({ toggle }) => (
        <Button icon={<CalendarDays className="size-4" />} onClick={toggle}>
          {value ? value.label : "時間"}
          <ChevronDown className="size-3.5 text-ink-400" />
        </Button>
      )}
    >
      {(close) => (
        <div>
          <OptionList
            options={PRESETS.map((p) => ({ value: p.label, label: p.label }))}
            selected={value ? [value.label] : []}
            onPick={(x) => {
              onChange(PRESETS.find((p) => p.label === x) ?? null);
              close();
            }}
          />
          <div className="mt-1 space-y-2 border-t border-ink-100 px-1.5 pb-1 pt-2.5">
            <p className="text-[12px] font-medium text-ink-600">自訂區間</p>
            <Input type="date" aria-label="開始日期" value={from} onChange={(e) => setFrom(e.target.value)} />
            <Input type="date" aria-label="結束日期" value={to} onChange={(e) => setTo(e.target.value)} />
            <Button
              size="sm"
              variant="dark"
              className="w-full"
              disabled={!from && !to}
              onClick={() => {
                onChange({ label: `${from ? fmtDate(from) : "最早"}－${to ? fmtDate(to) : "最新"}`, from: from || "0000", to: to || "9999" });
                close();
              }}
            >
              套用
            </Button>
          </div>
        </div>
      )}
    </Popover>
  );
}

export function AuditLog() {
  const s = useStore();
  const [q, setQ] = useState("");
  const [span, setSpan] = useState<Span | null>(null);
  const f = useFacets();
  const nameOf = (id: string) => s.memberOf(id)?.nickname ?? s.memberOf(id)?.name ?? id;
  const facets: Facet[] = [
    { key: "actor", label: "人員", options: [...new Set(s.audit.map((a) => a.actor))].map((id) => ({ value: id, label: nameOf(id), hint: String(s.audit.filter((a) => a.actor === id).length) })) },
    { key: "module", label: "模組", options: MODULES.map((m) => ({ value: m, label: m, hint: String(s.audit.filter((a) => a.module === m).length) })) },
    { key: "case", label: "案件", options: [...new Set(s.audit.map((a) => a.caseId).filter((x): x is string => !!x))].map((id) => ({ value: id, label: id, hint: String(s.audit.filter((a) => a.caseId === id).length) })) },
  ];
  const list = useMemo(
    () =>
      s.audit.filter(
        (a) =>
          (!span || inRange(auditDay(a), [span.from, span.to])) &&
          pass(f.value, "module", a.module) &&
          pass(f.value, "actor", a.actor) &&
          pass(f.value, "case", a.caseId ?? "") &&
          (!q || [a.target, a.action, a.caseId ?? "", a.after ?? "", a.before ?? ""].some((x) => x.toLowerCase().includes(q.toLowerCase()))),
      ),
    [s.audit, q, f.value, span],
  );
  return (
    <div className="pb-10">
      <PageHeader title="異動紀錄總覽" />
      <div className="px-8 pt-5">
        <Toolbar
          search={<SearchInput value={q} onChange={setQ} placeholder="搜尋案件編號、項目、內容" className="w-72" />}
          filter={<FilterMenu facets={facets} f={f} />}
          extra={<TimeFilter value={span} onChange={setSpan} />}
          count={`${list.length} 筆紀錄`}
        />
        <FilterChips facets={facets} f={f} extra={span ? [{ key: "span", label: <><span className="text-ink-400">時間</span>{span.label}</>, onRemove: () => setSpan(null) }] : []} onClearAll={() => setSpan(null)} />
      </div>
      <div className="max-w-[760px] px-8 pt-3">{list.length ? <ActivityTimeline entries={list} dayHeaders /> : <Empty icon={<History />} title="沒有符合條件的紀錄" />}</div>
    </div>
  );
}
