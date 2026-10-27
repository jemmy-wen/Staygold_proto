import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Filter, GanttChart, Kanban, List, Plus, Rows3, Search, X } from "lucide-react";
import { useStore, type CaseFilter } from "../../lib/store";
import type { Case, CaseFilters, CaseGroup, CaseLayout, CaseStatus, DateCond, DateField, SavedView } from "../../lib/types";
import { STATUSES, STATUS_PHASE, TODAY, addDays, cn, contractTotal, fmtDate, lineOf, money, openParam, toDate, uid } from "../../lib/utils";
import { Avatar, Button, Empty, Input, MenuItem, OptionList, Popover, SearchInput, Segmented, Select, StatusIcon, StatusPill, ease, inputCls } from "../../components/ui";
import { NewCaseModal } from "./NewCaseModal";
import { FilterChips, FilterMenu, Toolbar, type Facet, type FacetValue } from "../../components/filters";
import { useStatusChange } from "../../components/StatusChange";

const EMPTY: CaseFilters = { status: [], item: [], line: [], member: [], industry: [], region: [], verifier: [], year: [] };
const FILTER_LABEL: Record<keyof CaseFilters, string> = { status: "案件狀態", item: "驗證項目", line: "類別", member: "負責人／協作者", industry: "產業別", region: "地區", verifier: "驗證單位", year: "稽核年度" };
const GROUPS: { value: CaseGroup; label: string }[] = [
  { value: "status", label: "案件狀態" },
  { value: "phase", label: "流程階段" },
  { value: "item", label: "驗證項目" },
  { value: "line", label: "ISCC／ISCC 以外" },
  { value: "owner", label: "負責人" },
  { value: "none", label: "不分組" },
];
const LAYOUTS: { value: CaseLayout; label: string; icon: React.ReactNode }[] = [
  { value: "list", label: "列表", icon: <List className="size-4" /> },
  { value: "board", label: "看板", icon: <Kanban className="size-4" /> },
  { value: "gantt", label: "甘特圖", icon: <GanttChart className="size-4" /> },
  { value: "calendar", label: "行事曆", icon: <CalendarDays className="size-4" /> },
];

type View = { id: string; name: string; filters: CaseFilters; dates?: DateCond[]; group: CaseGroup; layout: CaseLayout; builtin?: boolean };

// 里程碑日期條件：期間內、空白、已填，可多條件同時成立（例：七、八月已送企劃書＋回簽日空白）
const DATE_FIELDS: { value: DateField; label: string }[] = [
  { value: "createdAt", label: "建立日" },
  { value: "visit", label: "拜訪日" },
  { value: "proposalSent", label: "企劃書送出日" },
  { value: "signed", label: "回簽日" },
  { value: "courseStart", label: "開課日" },
  { value: "audit", label: "稽核日" },
  { value: "certified", label: "取證日" },
  { value: "certExpiry", label: "證書到期日" },
];
const DATE_LABEL = Object.fromEntries(DATE_FIELDS.map((f) => [f.value, f.label])) as Record<DateField, string>;
const datesOf = (c: Case, f: DateField): string[] =>
  f === "createdAt" ? [c.createdAt.replace(/\//g, "-")] : f === "audit" ? c.milestones.audits : c.milestones[f] ? [c.milestones[f] as string] : [];
const matchDate = (c: Case, d: DateCond) => {
  const v = datesOf(c, d.field);
  if (d.op === "empty") return v.length === 0;
  if (d.op === "filled") return v.length > 0;
  return v.some((x) => (!d.from || x >= d.from) && (!d.to || x <= d.to));
};
const dateChip = (d: DateCond) =>
  `${DATE_LABEL[d.field]} ${d.op === "empty" ? "空白" : d.op === "filled" ? "已填" : `${d.from ? fmtDate(d.from) : "…"}–${d.to ? fmtDate(d.to) : "…"}`}`;

export function CaseList({ filter }: { filter?: CaseFilter }) {
  const s = useStore();
  const builtin: View[] = [
    { id: "all", name: "全部案件", filters: EMPTY, group: "status", layout: "list", builtin: true },
    { id: "mine", name: "我參與的", filters: { ...EMPTY, member: [s.me.id] }, group: "status", layout: "list", builtin: true },
  ];
  const views: View[] = [...builtin, ...s.views.filter((v) => v.owner === s.me.id)];
  const [viewId, setViewId] = useState(filter?.view ?? (filter?.status || filter?.ids ? "" : "all"));
  const base = views.find((v) => v.id === viewId) ?? builtin[0];
  const [filters, setFilters] = useState<CaseFilters>(filter?.status ? { ...EMPTY, status: filter.status } : base.filters);
  const [group, setGroup] = useState<CaseGroup>(filter?.group ?? base.group);
  const [layout, setLayout] = useState<CaseLayout>(filter?.layout ?? base.layout);
  const [dates, setDates] = useState<DateCond[]>(base.dates ?? []);
  const [preset, setPreset] = useState(filter?.ids ? { ids: filter.ids, label: filter.label ?? "" } : null);
  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(openParam("newCase") || openParam("copyCase"));
  const dirty = !!preset || !viewId || JSON.stringify(filters) !== JSON.stringify(base.filters) || JSON.stringify(dates) !== JSON.stringify(base.dates ?? []) || group !== base.group || layout !== base.layout;

  const applyView = (v: View) => {
    setPreset(null);
    setViewId(v.id);
    setFilters(v.filters);
    setDates(v.dates ?? []);
    setGroup(v.group);
    setLayout(v.layout);
  };

  const all = s.visibleCases;
  const list = useMemo(() => {
    const k = q.trim().toLowerCase();
    return all.filter((c) => {
      const cu = s.customerOf(c);
      const f = filters;
      if (preset && !preset.ids.includes(c.id)) return false;
      if (!dates.every((d) => matchDate(c, d))) return false;
      if (f.status.length && !f.status.includes(s.statusOf(c))) return false;
      if (f.item.length && !f.item.includes(c.item)) return false;
      if (f.line.length && !f.line.includes(lineOf(c.item))) return false;
      if (f.member.length && !f.member.some((m) => c.owner === m || c.coOwners.includes(m))) return false;
      if (f.industry.length && !f.industry.includes(cu.industry)) return false;
      if (f.region.length && !f.region.includes(cu.region)) return false;
      if (f.verifier.length && !f.verifier.includes(c.verifier)) return false;
      if (f.year.length && !f.year.includes(c.year)) return false;
      if (k && ![c.id, cu.short, cu.name, c.item, c.verifier].some((x) => x.toLowerCase().includes(k))) return false;
      return true;
    });
  }, [all, filters, q, s, preset, dates]);

  const options = useMemo(() => {
    const uniq = (arr: string[]) => [...new Set(arr.filter(Boolean))];
    const opt = (arr: string[]) => arr.map((x) => ({ value: x, label: x }));
    return {
      status: opt(STATUSES),
      item: opt(uniq(all.map((c) => c.item))),
      line: opt(["ISCC", "ISCC 以外"]),
      member: uniq(all.flatMap((c) => [c.owner, ...c.coOwners])).map((id) => ({ value: id, label: s.memberOf(id)?.name ?? id })),
      industry: opt(uniq(all.map((c) => s.customerOf(c).industry))),
      region: opt(uniq(all.map((c) => s.customerOf(c).region))),
      verifier: opt(uniq(all.map((c) => c.verifier))),
      year: opt(uniq(all.map((c) => c.year)).sort().reverse()),
    } as Record<keyof CaseFilters, { value: string; label: string }[]>;
  }, [all, s]);
  const facets: Facet[] = (Object.keys(FILTER_LABEL) as (keyof CaseFilters)[]).map((k) => ({
    key: k,
    label: FILTER_LABEL[k],
    options: options[k].map((o) => ({ ...o, hint: String(all.filter((c) => caseValues(c, k, s).includes(o.value)).length) })),
  }));
  const f = {
    value: filters as unknown as FacetValue,
    setValue: (v: FacetValue | ((x: FacetValue) => FacetValue)) => setFilters((x) => ({ ...EMPTY, ...(typeof v === "function" ? v(x as unknown as FacetValue) : v) }) as CaseFilters),
    toggle: (k: string, v: string) => setFilters((x) => ({ ...x, [k]: x[k as keyof CaseFilters].includes(v) ? x[k as keyof CaseFilters].filter((y) => y !== v) : [...x[k as keyof CaseFilters], v] })),
    set: (k: string, vals: string[]) => setFilters((x) => ({ ...x, [k]: vals })),
    clear: () => setFilters(EMPTY),
    count: Object.values(filters).reduce((n, a) => n + a.length, 0),
  };
  const groups = useMemo(() => groupCases(list, group, s, layout === "board"), [list, group, s, layout]);

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex items-center justify-between gap-6 px-8 pb-3 pt-6">
        <h1 className="text-[22px] font-semibold tracking-tight text-ink-900">案件</h1>
        {s.perms.casesCreate && (
          <Button variant="dark" icon={<Plus className="size-4" />} onClick={() => setCreating(true)}>
            新增案件
          </Button>
        )}
      </div>

      <div className="flex items-center gap-1 border-b border-ink-100 px-8">
        {views.map((v) => (
          <div key={v.id} className="group relative">
            <button onClick={() => applyView(v)} className={cn("relative px-3 py-2.5 text-[13px] font-medium transition-colors", viewId === v.id ? "text-ink-900" : "text-ink-500 hover:text-ink-800")}>
              {v.name}
              {viewId === v.id && <motion.span layoutId="case-view" className="absolute inset-x-1 -bottom-px h-[2px] rounded-full bg-brand-500" />}
            </button>
            {!v.builtin && (
              <button
                onClick={() => {
                  s.removeView(v.id);
                  if (viewId === v.id) applyView(builtin[0]);
                }}
                className="absolute -right-1 top-1.5 hidden rounded p-0.5 text-ink-300 hover:bg-ink-100 hover:text-ink-700 group-hover:block"
                aria-label="刪除檢視"
              >
                <X className="size-3" />
              </button>
            )}
          </div>
        ))}
        <SaveView
          disabled={!dirty}
          onSave={(name) => {
            const v: SavedView = { id: uid("v"), owner: s.me.id, name, filters, dates, group, layout };
            s.saveView(v);
            setViewId(v.id);
            s.toast(`已儲存檢視「${name}」`);
          }}
        />
      </div>

      <div className="px-8 pt-4">
        <Toolbar
          search={<SearchInput value={q} onChange={setQ} placeholder="搜尋案件編號、客戶、驗證項目" className="w-72" />}
          filter={<FilterMenu facets={facets} f={f} />}
          extra={<DatePanel dates={dates} setDates={setDates} />}
          right={
            <>
              {layout !== "calendar" && (
                <Popover
                  align="right"
                  width={200}
                  trigger={({ toggle: t }) => (
                    <Button onClick={t} icon={<Rows3 className="size-3.5" />}>
                      分組：{GROUPS.find((g) => g.value === group)?.label}
                      <ChevronDown className="size-3.5 text-ink-400" />
                    </Button>
                  )}
                >
                  {(close) =>
                    GROUPS.filter((g) => layout !== "board" || g.value !== "none").map((g) => (
                      <MenuItem key={g.value} active={group === g.value} onClick={() => (setGroup(g.value), close())}>
                        {g.label}
                      </MenuItem>
                    ))
                  }
                </Popover>
              )}
              <Segmented
                value={layout}
                onChange={setLayout}
                items={LAYOUTS.map((l) => ({ value: l.value, label: <span className="flex items-center gap-1.5">{l.icon}{l.label}</span> }))}
              />
            </>
          }
          count={`${list.length} 件`}
        />
        <FilterChips
          facets={facets}
          f={f}
          onClearAll={() => (setPreset(null), setDates([]))}
          extra={[
            ...(preset ? [{ key: "preset", label: <><span className="text-brand-600">總覽</span>{preset.label}</>, onRemove: () => setPreset(null) }] : []),
            ...dates.map((d) => ({ key: d.id, label: dateChip(d), onRemove: () => setDates((x) => x.filter((y) => y.id !== d.id)) })),
          ]}
        />
      </div>

      <div className="flex-1 px-8 pb-8">
        {list.length === 0 ? (
          <Empty icon={<Search />} title="沒有符合條件的案件" />
        ) : layout === "list" ? (
          <ListView groups={groups} />
        ) : layout === "board" ? (
          <BoardView groups={groups} />
        ) : layout === "gantt" ? (
          <GanttView groups={groups} />
        ) : (
          <CalendarView cases={list} />
        )}
      </div>
      <NewCaseModal open={creating} onClose={() => setCreating(false)} preset={openParam("copyCase") ? { mode: "copy", copyFrom: "LISHENG-大社廠-ISO14001-2025-01" } : undefined} />
    </div>
  );
}

const caseValues = (c: Case, k: keyof CaseFilters, s: ReturnType<typeof useStore>): string[] => {
  const cu = s.customerOf(c);
  return { status: [s.statusOf(c)], item: [c.item], line: [lineOf(c.item)], member: [c.owner, ...c.coOwners], industry: [cu.industry], region: [cu.region], verifier: [c.verifier], year: [c.year] }[k];
};

type Group = { key: string; label: string; status?: CaseStatus; cases: Case[] };
// 看板依狀態分組時保留空欄，10 種狀態全部顯示
function groupCases(list: Case[], group: CaseGroup, s: ReturnType<typeof useStore>, keepEmpty = false): Group[] {
  if (group === "none") return [{ key: "all", label: "全部", cases: list }];
  if (group === "status") return STATUSES.map((st) => ({ key: st, label: st, status: st, cases: list.filter((c) => s.statusOf(c) === st) })).filter((g) => keepEmpty || g.cases.length);
  if (group === "phase") {
    const phases = [...new Set(STATUSES.map((x) => STATUS_PHASE[x]))];
    return phases.map((ph) => ({ key: ph, label: ph, cases: list.filter((c) => STATUS_PHASE[s.statusOf(c)] === ph) })).filter((g) => g.cases.length);
  }
  const keyOf = (c: Case) => (group === "item" ? c.item : group === "line" ? lineOf(c.item) : c.owner);
  return [...new Set(list.map(keyOf))].map((k) => ({ key: k, label: group === "owner" ? s.memberOf(k)?.name ?? k : k, cases: list.filter((c) => keyOf(c) === k) }));
}

function SaveView({ disabled, onSave }: { disabled: boolean; onSave: (name: string) => void }) {
  const [name, setName] = useState("");
  return (
    <Popover
      width={260}
      trigger={({ toggle }) => (
        <button onClick={toggle} disabled={disabled} className="ml-1 flex items-center gap-1 rounded-md px-2 py-1.5 text-[12.5px] text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-800 disabled:opacity-40">
          <Plus className="size-3.5" />
          儲存為檢視
        </button>
      )}
    >
      {(close) => (
        <form
          className="space-y-2 p-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            onSave(name.trim());
            setName("");
            close();
          }}
        >
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="檢視名稱" autoFocus />
          <div className="flex justify-end">
            <Button size="sm" variant="dark" type="submit" disabled={!name.trim()}>
              儲存
            </Button>
          </div>
        </form>
      )}
    </Popover>
  );
}

function DatePanel({ dates, setDates }: { dates: DateCond[]; setDates: (fn: (d: DateCond[]) => DateCond[]) => void }) {
  const upd = (id: string, patch: Partial<DateCond>) => setDates((x) => x.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  return (
    <Popover
      align="right"
      width={620}
      trigger={({ toggle: t }) => (
        <Button onClick={t} icon={<CalendarDays className="size-3.5" />}>
          日期
          {dates.length > 0 && <span className="rounded-full bg-brand-500 px-1.5 text-[11px] leading-[18px] text-white">{dates.length}</span>}
        </Button>
      )}
    >
      <div className="space-y-2 p-2.5">
        {dates.map((d) => (
          <div key={d.id} className="grid grid-cols-[140px_auto_minmax(0,1fr)_24px] items-center gap-2 whitespace-nowrap">
            <Select value={d.field} onChange={(v) => upd(d.id, { field: v as DateField })} options={DATE_FIELDS} />
            <Segmented
              size="sm"
              value={d.op}
              onChange={(v) => upd(d.id, { op: v })}
              items={[
                { value: "between", label: "期間" },
                { value: "empty", label: "空白" },
                { value: "filled", label: "已填" },
              ]}
            />
            <div className="flex items-center gap-1.5">
              {d.op === "between" && (
                <>
                  <input type="date" value={d.from ?? ""} onChange={(e) => upd(d.id, { from: e.target.value || undefined })} className={cn(inputCls, "h-8 min-w-0 flex-1 px-2 text-[12.5px]")} />
                  <span className="text-ink-400">–</span>
                  <input type="date" value={d.to ?? ""} onChange={(e) => upd(d.id, { to: e.target.value || undefined })} className={cn(inputCls, "h-8 min-w-0 flex-1 px-2 text-[12.5px]")} />
                </>
              )}
            </div>
            <button onClick={() => setDates((x) => x.filter((y) => y.id !== d.id))} className="rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700" aria-label="移除">
              <X className="size-3.5" />
            </button>
          </div>
        ))}
        <Button size="sm" variant="ghost" icon={<Plus className="size-3.5" />} onClick={() => setDates((x) => [...x, { id: uid("d"), field: "proposalSent", op: "between" }])}>
          新增日期條件
        </Button>
      </div>
    </Popover>
  );
}

function GroupHeader({ g, open, onToggle }: { g: Group; open: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className="flex w-full items-center gap-2 rounded-lg px-1 py-1.5 text-left transition-colors hover:bg-ink-50">
      <ChevronRight className={cn("size-3.5 text-ink-400 transition-transform duration-200", open && "rotate-90")} />
      {g.status && <StatusIcon status={g.status} />}
      <span className="text-[13px] font-semibold text-ink-800">{g.label}</span>
      <span className="rounded-md bg-white px-1.5 text-[11.5px] tabular-nums text-ink-500 ring-1 ring-ink-200">{g.cases.length}</span>
    </button>
  );
}

function Members({ c }: { c: Case }) {
  const s = useStore();
  const ids = [c.owner, ...c.coOwners];
  return (
    <span className="flex items-center -space-x-1.5">
      {ids.slice(0, 4).map((id) => (
        <Avatar key={id} m={s.memberOf(id)} size={22} ring />
      ))}
      {ids.length > 4 && <span className="grid size-[22px] place-items-center rounded-full bg-ink-100 text-[10px] text-ink-600 ring-2 ring-white">+{ids.length - 4}</span>}
    </span>
  );
}

function ListView({ groups }: { groups: Group[] }) {
  const s = useStore();
  const [closed, setClosed] = useState<Set<string>>(new Set());
  const change = useStatusChange();
  const fin = s.perms.financeAmounts;
  const cols = fin
    ? "grid-cols-[minmax(0,2.2fr)_minmax(0,1.3fr)_140px_110px_minmax(0,1fr)_minmax(0,0.8fr)_100px_110px]"
    : "grid-cols-[minmax(0,2.2fr)_minmax(0,1.3fr)_140px_110px_minmax(0,1fr)_minmax(0,0.8fr)_100px]";
  return (
    <div className="space-y-4">
      {groups.map((g) => {
        const open = !closed.has(g.key);
        return (
          <section key={g.key}>
            <GroupHeader g={g} open={open} onToggle={() => setClosed((x) => { const n = new Set(x); open ? n.add(g.key) : n.delete(g.key); return n; })} />
            <AnimatePresence initial={false}>
              {open && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22, ease }} className="mt-2 overflow-hidden rounded-xl border border-ink-200 bg-white shadow-card">
                  <div className={cn("grid h-10 items-center gap-3 border-b border-ink-200 bg-ink-25 px-4 text-[12.5px] font-semibold text-ink-700", cols)}>
                    <span>客戶／案件編號</span>
                    <span>驗證項目</span>
                    <span>狀態</span>
                    <span>成員</span>
                    <span>產業別／地區</span>
                    <span>驗證單位</span>
                    <span>回簽日</span>
                    {fin && <span className="text-right">合約金額</span>}
                  </div>
                  {g.cases.map((c, i) => {
                    const cu = s.customerOf(c);
                    return (
                      <motion.div
                        key={c.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.22, ease, delay: Math.min(i, 12) * 0.015 }}
                        onClick={() => s.go({ page: "case", id: c.id })}
                        className={cn("grid min-h-[56px] w-full cursor-pointer items-center gap-3 border-b border-ink-100 px-4 py-2.5 text-left text-[13px] transition-colors last:border-b-0 hover:bg-brand-50/40", cols)}
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-ink-900">
                            {cu.short}
                            {c.site && <span className="font-normal text-ink-500"> ・{c.site}</span>}
                          </span>
                          <span className="block truncate font-mono text-[11.5px] text-ink-400">{c.id}</span>
                        </span>
                        <span className="truncate text-ink-700">{c.item}</span>
                        <span onClick={(e) => e.stopPropagation()}>
                          <StatusSelect c={c} onPick={(st) => change.request(c.id, st)} />
                        </span>
                        <Members c={c} />
                        <span className="truncate text-ink-600">
                          {cu.industry || "—"}・{cu.region || "—"}
                        </span>
                        <span className="truncate text-ink-600">{c.verifier || "—"}</span>
                        <span className="tabular-nums text-ink-600">{fmtDate(c.milestones.signed)}</span>
                        {fin && <span className="text-right tabular-nums text-ink-800">{contractTotal(c) ? money(contractTotal(c)) : "—"}</span>}
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        );
      })}
      {change.modal}
    </div>
  );
}

// 列表的狀態欄：點開可直接改成任何狀態，規則同看板拖動
function StatusSelect({ c, onPick }: { c: Case; onPick: (st: CaseStatus) => void }) {
  const s = useStore();
  const st = s.statusOf(c);
  if (!s.perms.casesEdit) return <StatusPill status={st} />;
  return (
    <Popover
      width={200}
      trigger={({ toggle, open }) => (
        <button onClick={toggle} className={cn("-mx-1 flex items-center gap-1 rounded-md px-1 py-0.5 transition-colors hover:bg-ink-100", open && "bg-ink-100")}>
          <StatusPill status={st} />
          <ChevronDown className="size-3 text-ink-400" />
        </button>
      )}
    >
      {(close) => (
        <OptionList
          options={STATUSES.map((x) => ({ value: x, label: x }))}
          selected={[st]}
          onPick={(x) => {
            close();
            if (x !== st) onPick(x as CaseStatus);
          }}
        />
      )}
    </Popover>
  );
}

// 看板：依狀態分組時可把卡片拖到任何狀態（往前、往後、跳階都可以）；會寄 Email 的先確認
function BoardView({ groups }: { groups: Group[] }) {
  const s = useStore();
  const [over, setOver] = useState<string | null>(null);
  const can = s.perms.casesEdit;
  const change = useStatusChange();
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {groups.map((g) => {
        const droppable = can && !!g.status;
        return (
          <div
            key={g.key}
            onDragOver={(e) => {
              if (!droppable) return;
              e.preventDefault();
              setOver(g.key);
            }}
            onDragLeave={() => setOver((k) => (k === g.key ? null : k))}
            onDrop={(e) => {
              setOver(null);
              const id = e.dataTransfer.getData("text/case");
              if (droppable && id) change.request(id, g.status!);
            }}
            className={cn("flex min-h-[200px] w-[260px] shrink-0 flex-col rounded-xl bg-ink-50 p-2 transition-colors", over === g.key && "bg-brand-50 ring-2 ring-brand-500/40")}
          >
            <div className="flex items-center gap-2 px-2 py-1.5">
              {g.status && <StatusIcon status={g.status} />}
              <span className="truncate text-[12.5px] font-semibold text-ink-800">{g.label}</span>
              <span className="ml-auto text-[12px] tabular-nums text-ink-400">{g.cases.length}</span>
            </div>
            <div className="mt-1 flex flex-col gap-2">
              {g.cases.map((c) => (
                <div
                  key={c.id}
                  draggable={droppable}
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/case", c.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  className={cn(droppable && "cursor-grab active:cursor-grabbing")}
                >
                  <motion.button layout onClick={() => s.go({ page: "case", id: c.id })} className="w-full rounded-lg border border-ink-200 bg-white p-3 text-left shadow-card transition-shadow hover:shadow-pop">
                    <p className="truncate text-[13px] font-medium text-ink-900">
                      {s.customerOf(c).short}
                      {c.site ? ` ${c.site}` : ""}
                    </p>
                    <p className="mt-0.5 truncate text-[12px] text-ink-500">{c.item}</p>
                    <div className="mt-2.5 flex items-center justify-between">
                      {!g.status ? <StatusPill status={s.statusOf(c)} /> : <span className="truncate font-mono text-[11px] text-ink-400">{c.id}</span>}
                      <Members c={c} />
                    </div>
                  </motion.button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {change.modal}
    </div>
  );
}

// 甘特圖：每列一個案件，條為自拜訪（或建立）日起至取證日（未取證則至今天）；今天之後已排的課程以虛線延伸
// 時間軸含過去與未來，開啟時捲到今天附近；里程碑以不同形狀標示，滑過顯示名稱與日期
const MILESTONE: Record<string, string> = {
  企劃書送出: "rounded-full border-2 border-brand-600 bg-white",
  回簽: "rounded-full bg-brand-600",
  開課: "rotate-45 rounded-[2px] bg-brand-600",
  稽核: "rounded-[2px] border-2 border-ink-700 bg-white",
  取證: "rounded-full bg-ink-800",
};

function GanttView({ groups }: { groups: Group[] }) {
  const s = useStore();
  const all = groups.flatMap((g) => g.cases);
  const startOf = (c: Case) => c.milestones.visit ?? c.createdAt.replace(/\//g, "-");
  const endOf = (c: Case) => c.milestones.certified ?? TODAY;
  const futureOf = (c: Case) =>
    c.milestones.certified ? undefined : s.events.filter((e) => e.caseId === c.id && e.date > TODAY).map((e) => e.date).sort().reverse()[0];
  const monthStart = (d: string) => d.slice(0, 7) + "-01";
  const addMonths = (d: string, n: number) => {
    const x = toDate(monthStart(d));
    x.setMonth(x.getMonth() + n);
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-01`;
  };
  const min = [addMonths(TODAY, -6), ...all.map(startOf)].sort()[0];
  const max = [addMonths(TODAY, 4), ...all.map((c) => futureOf(c) ?? endOf(c))].sort().reverse()[0];
  const months: string[] = [];
  for (let cur = monthStart(min); cur <= max; cur = addMonths(cur, 1)) months.push(cur);
  const MW = 112;
  const origin = toDate(months[0]).getTime();
  const span = toDate(addMonths(months[months.length - 1], 1)).getTime() - origin;
  const width = months.length * MW;
  const x = (d: string) => ((toDate(d).getTime() - origin) / span) * width;
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scroller.current) scroller.current.scrollLeft = Math.max(0, x(TODAY) - scroller.current.clientWidth * 0.55);
  }, [width]);
  const dots = (c: Case) =>
    ([["企劃書送出", c.milestones.proposalSent], ["回簽", c.milestones.signed], ["開課", c.milestones.courseStart], ...c.milestones.audits.map((a) => ["稽核", a]), ["取證", c.milestones.certified]].filter((d) => d[1]) as [string, string][]);
  const years = months.reduce<{ y: string; n: number }[]>((acc, m) => {
    const y = m.slice(0, 4);
    if (acc.length && acc[acc.length - 1].y === y) acc[acc.length - 1].n += 1;
    else acc.push({ y, n: 1 });
    return acc;
  }, []);
  const ROW = 52;

  return (
    <div className="overflow-hidden rounded-xl border border-ink-200 bg-white shadow-card">
      <div className="flex items-center justify-end gap-4 border-b border-ink-100 px-4 py-2 text-[11.5px] text-ink-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-6 rounded-full bg-brand-500/80" />
          進行期間
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-6 rounded-full border border-dashed border-brand-500" />
          已排課程
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-6 rounded-full bg-ink-200" />
          已取證
        </span>
        {Object.entries(MILESTONE).map(([k, cls]) => (
          <span key={k} className="flex items-center gap-1.5">
            <span className={cn("size-2.5", cls)} />
            {k}
          </span>
        ))}
      </div>
      <div className="flex">
        <div className="w-[280px] shrink-0 border-r border-ink-200">
          <div className="h-[52px] border-b border-ink-200 bg-ink-25" />
          {groups.map((g) => (
            <div key={g.key}>
              <div className="flex h-9 items-center gap-2 border-b border-ink-100 bg-ink-25 px-4 text-[12px] font-semibold text-ink-700">
                {g.status && <StatusIcon status={g.status} size={12} />}
                {g.label}
                <span className="font-normal text-ink-400">{g.cases.length}</span>
              </div>
              {g.cases.map((c) => (
                <button key={c.id} onClick={() => s.go({ page: "case", id: c.id })} className="flex w-full flex-col justify-center border-b border-ink-100 px-4 text-left transition-colors hover:bg-brand-50/40" style={{ height: ROW }}>
                  <span className="truncate text-[13px] font-medium text-ink-900">
                    {s.customerOf(c).short}
                    {c.site ? ` ${c.site}` : ""} <span className="font-normal text-ink-500">{c.item}</span>
                  </span>
                  <span className="truncate font-mono text-[11px] text-ink-400">{c.id}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
        <div ref={scroller} className="min-w-0 flex-1 overflow-x-auto">
          <div className="relative" style={{ width }}>
            <div className="h-[52px] border-b border-ink-200 bg-ink-25">
              <div className="flex h-6">
                {years.map((y) => (
                  <div key={y.y} className="shrink-0 border-l border-ink-200 px-2 pt-1 text-[11.5px] font-semibold text-ink-700" style={{ width: y.n * MW }}>
                    {y.y}
                  </div>
                ))}
              </div>
              <div className="flex h-[27px]">
                {months.map((m) => (
                  <div key={m} className={cn("shrink-0 border-l border-ink-100 px-2 pt-1 text-[11.5px]", m.slice(0, 7) === TODAY.slice(0, 7) ? "font-semibold text-brand-700" : "text-ink-500")} style={{ width: MW }}>
                    {Number(m.slice(5, 7))} 月
                  </div>
                ))}
              </div>
            </div>
            {/* 月份格線 */}
            <div className="pointer-events-none absolute bottom-0 top-[52px] flex">
              {months.map((m) => (
                <div key={m} className="h-full shrink-0 border-l border-ink-100/70" style={{ width: MW }} />
              ))}
            </div>
            <div className="pointer-events-none absolute bottom-0 top-0 z-10" style={{ left: x(TODAY) }}>
              <span className="absolute -translate-x-1/2 whitespace-nowrap rounded-full bg-brand-600 px-1.5 text-[10.5px] font-medium leading-[18px] text-white" style={{ top: 30 }}>
                今天
              </span>
              <span className="absolute bottom-0 top-[52px] w-px bg-brand-600/60" />
            </div>
            {groups.map((g) => (
              <div key={g.key}>
                <div className="h-9 border-b border-ink-100 bg-ink-25/60" />
                {g.cases.map((c) => {
                  const a = x(startOf(c));
                  const b = x(endOf(c));
                  const f = futureOf(c);
                  return (
                    <div key={c.id} className="relative border-b border-ink-100" style={{ height: ROW }}>
                      {f && <div className="absolute top-[21px] h-2.5 rounded-r-full border border-l-0 border-dashed border-brand-500" style={{ left: b, width: Math.max(0, x(f) - b) }} />}
                      <motion.div
                        className={cn("absolute top-[21px] h-2.5 rounded-full", c.milestones.certified ? "bg-ink-200" : "bg-brand-500/80", f && "rounded-r-none")}
                        style={{ left: a }}
                        initial={{ width: 0 }}
                        animate={{ width: Math.max(8, b - a) }}
                        transition={{ duration: 0.5, ease }}
                      />
                      {dots(c).map(([label, d]) => (
                        <span key={label + d} title={`${label}・${fmtDate(d)}`} className={cn("absolute top-[20px] size-3 -translate-x-1/2 shadow-[0_0_0_2px_white]", MILESTONE[label])} style={{ left: x(d) }} />
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 行事曆：各案件的里程碑日期與上課日
function CalendarView({ cases }: { cases: Case[] }) {
  const s = useStore();
  const [month, setMonth] = useState(TODAY.slice(0, 7));
  const first = toDate(month + "-01");
  const startPad = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((startPad + daysInMonth) / 7) * 7 }, (_, i) => {
    const day = i - startPad + 1;
    return day >= 1 && day <= daysInMonth ? `${month}-${String(day).padStart(2, "0")}` : null;
  });
  const items = useMemo(() => {
    const out: { date: string; label: string; c: Case }[] = [];
    for (const c of cases) {
      const m = c.milestones;
      const push = (d: string | undefined, label: string) => d && out.push({ date: d, label, c });
      push(m.visit, "拜訪");
      push(m.proposalSent, "企劃書送出");
      push(m.signed, "回簽");
      m.audits.forEach((a) => push(a, "稽核"));
      push(m.certified, "取證");
      push(m.certExpiry, "證書到期");
      s.events.filter((e) => e.caseId === c.id && e.kind === "排課").forEach((e) => push(e.date, "上課"));
    }
    return out;
  }, [cases, s.events]);
  const shift = (n: number) => {
    const d = new Date(first);
    d.setMonth(d.getMonth() + n);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };
  return (
    <div className="overflow-hidden rounded-xl border border-ink-200 bg-white shadow-card">
      <div className="flex items-center gap-2 border-b border-ink-100 px-4 py-2.5">
        <p className="text-[14px] font-semibold text-ink-900">
          {first.getFullYear()} 年 {first.getMonth() + 1} 月
        </p>
        <div className="ml-auto flex gap-1">
          <button onClick={() => shift(-1)} className="grid size-8 place-items-center rounded-lg border border-ink-200 text-ink-600 hover:bg-ink-25" aria-label="上個月">
            <ChevronLeft className="size-4" />
          </button>
          <button onClick={() => setMonth(TODAY.slice(0, 7))} className="rounded-lg border border-ink-200 px-2.5 text-[12.5px] text-ink-700 hover:bg-ink-25">
            今天
          </button>
          <button onClick={() => shift(1)} className="grid size-8 place-items-center rounded-lg border border-ink-200 text-ink-600 hover:bg-ink-25" aria-label="下個月">
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 border-b border-ink-100 text-[11.5px] text-ink-500">
        {["一", "二", "三", "四", "五", "六", "日"].map((d) => (
          <div key={d} className="px-2 py-1.5">
            週{d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((d, i) => {
          const list = d ? items.filter((x) => x.date === d) : [];
          return (
            <div key={i} className={cn("min-h-[104px] border-b border-r border-ink-100 p-1.5", !d && "bg-ink-25", i % 7 === 6 && "border-r-0")}>
              {d && <p className={cn("mb-1 text-[11.5px] tabular-nums", d === TODAY ? "inline-grid size-5 place-items-center rounded-full bg-brand-500 font-semibold text-white" : "text-ink-500")}>{Number(d.slice(8))}</p>}
              <div className="space-y-0.5">
                {list.slice(0, 3).map((x, k) => (
                  <button key={k} onClick={() => s.go({ page: "case", id: x.c.id })} className={cn("block w-full truncate rounded px-1.5 py-0.5 text-left text-[11px]", x.label === "證書到期" ? "bg-amber-50 text-amber-800" : "bg-brand-50 text-brand-800 hover:bg-brand-100")}>
                    {x.label}・{s.customerOf(x.c).short}
                  </button>
                ))}
                {list.length > 3 && <p className="px-1.5 text-[11px] text-ink-400">+{list.length - 3}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
