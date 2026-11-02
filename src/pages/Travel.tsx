import { useMemo, useState } from "react";
import { CalendarX2, Car, Check, ChevronDown, Info, MapPin, Plus, Sparkles } from "lucide-react";
import { useStore } from "../lib/store";
import { travelCandidates } from "../lib/rules";
import { ActivityButton, ActivityTimeline } from "../components/Activity";
import { useGridDraft, type Change, type Grid } from "../components/grid";
import { FilterChips, FilterMenu, Toolbar, pass, useFacets, type Facet } from "../components/filters";
import type { Travel } from "../lib/types";
import { TODAY, openParam, param, cn, daysSince, fmtDate, money, nowStamp, uid, weekday } from "../lib/utils";
import { Avatar, Badge, Button, Drawer, Field, Input, Modal, OptionList, PageHeader, Popover, SearchInput, Select, td, th } from "../components/ui";

const LINK_TONE = { 系統建議已確認: "brand", 人工手動指定: "blue", 未歸戶: "amber" } as const;

export function TravelPage() {
  const s = useStore();
  const f = useFacets();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(openParam("travelNew"));
  const [detailId, setDetailId] = useState<string | null>(param("drawer"));
  const mine = s.perms.travelAll ? s.travel : s.travel.filter((t) => t.memberId === s.me.id);
  const nameOf = (id: string) => s.memberOf(id)?.nickname ?? s.memberOf(id)?.name ?? id;
  const opt = (vals: string[], fn: (t: Travel) => string, label = (v: string) => v) => vals.map((v) => ({ value: v, label: label(v), hint: String(mine.filter((t) => fn(t) === v).length) }));
  const facets: Facet[] = [
    { key: "link", label: "關聯方式", options: opt(["系統建議已確認", "人工手動指定", "未歸戶"], (t) => t.link) },
    { key: "category", label: "類別", options: opt(["交通費", "住宿費", "膳食費", "其他費用"], (t) => t.category) },
    ...(s.perms.travelAll ? [{ key: "member", label: "填報人", options: opt([...new Set(s.travel.map((t) => t.memberId))], (t) => t.memberId, nameOf) }] : []),
    { key: "case", label: "所屬案件", options: opt([...new Set(mine.map((t) => t.caseId ?? "未歸戶"))], (t) => t.caseId ?? "未歸戶") },
  ];
  const list = mine
    .filter((t) => pass(f.value, "link", t.link) && pass(f.value, "category", t.category) && pass(f.value, "member", t.memberId) && pass(f.value, "case", t.caseId ?? "未歸戶"))
    .filter((t) => !q || [t.detail, t.caseId ?? "", nameOf(t.memberId)].some((x) => x.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => b.date.localeCompare(a.date));
  const detail = mine.find((t) => t.id === detailId);
  const grid = useGridDraft((changes: Change[]) => {
    const bad = changes.filter((ch) => travelInvalid(ch.field, ch.value));
    changes
      .filter((ch) => !bad.includes(ch))
      .forEach((ch) => {
        const t = s.travel.find((x) => x.id === ch.row);
        if (!t) return;
        const shown = (v: string) => (ch.field === "amount" ? money(Number(v)) : ch.field === "date" ? fmtDate(v) : v);
        s.updateTravel(ch.row, ch.field === "amount" ? { amount: Number(ch.value) } : { [ch.field]: ch.value.trim() });
        s.log({ module: "差旅費", refId: t.id, caseId: t.caseId, target: `${ch.field === "detail" ? ch.value.trim() : t.detail} ${money(ch.field === "amount" ? Number(ch.value) : t.amount)}`, action: `修改${TRAVEL_FIELDS[ch.field]}`, before: shown(ch.original), after: shown(ch.value) });
      });
    const saved = changes.length - bad.length;
    if (bad.length) s.toast(`${bad.length} 項內容不正確，未儲存${saved ? `；其餘 ${saved} 項已儲存` : ""}`, "info");
    else s.toast(`已儲存 ${saved} 項變更`);
  });

  return (
    <div className="pb-10">
      <PageHeader
        title="差旅費"
        actions={
          <>
            <ActivityButton title="差旅費" match={(a) => a.module === "差旅費"} />
            <Button variant="dark" icon={<Plus className="size-4" />} onClick={() => setOpen(true)}>
              新增差旅費
            </Button>
          </>
        }
      />
      <div className="px-8 pt-5">
        <Toolbar
          search={<SearchInput value={q} onChange={setQ} placeholder="搜尋細項、案件、填報人" className="w-72" />}
          filter={<FilterMenu facets={facets} f={f} />}
          count={`${list.length} 筆`}
        />
        <FilterChips facets={facets} f={f} />
      </div>
      <div className="px-8">
        <div className="glass-card overflow-x-auto rounded-xl">
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr>
                {["日期", "填報人", "類別", "細項", "金額", "所屬案件", "關聯方式"].map((h, i) => (
                  <th key={h} className={cn(th, i === 0 && "pl-5", h === "金額" && "text-right")}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((t) => {
                const m = s.memberOf(t.memberId);
                const editable = t.memberId === s.me.id || s.perms.travelAll;
                return (
                  <tr
                    key={t.id}
                    tabIndex={0}
                    aria-label={`查看 ${t.detail} 的詳情`}
                    onClick={() => setDetailId(t.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.target === e.currentTarget) setDetailId(t.id);
                    }}
                    className={cn("cursor-pointer outline-none transition-colors hover:bg-ink-25 focus-visible:bg-brand-50", detailId === t.id && "bg-brand-50")}
                  >
                    <td className={cn(td, "pl-5 tabular-nums", grid.dirty(t.id, "date") && "bg-brand-50/60")}>
                      {fmtDate(grid.get(t.id, "date", t.date))} <span className="text-ink-500">{weekday(grid.get(t.id, "date", t.date) || t.date)}</span>
                    </td>
                    <td className={td}>
                      <span className="flex items-center gap-2">
                        <Avatar m={m} size={22} />
                        {m?.nickname ?? m?.name}
                      </span>
                    </td>
                    <td className={cn(td, "text-ink-600", grid.dirty(t.id, "category") && "bg-brand-50/60")}>{grid.get(t.id, "category", t.category)}</td>
                    <td className={cn(td, grid.dirty(t.id, "detail") && "bg-brand-50/60")}>{grid.get(t.id, "detail", t.detail)}</td>
                    <td className={cn(td, "text-right font-medium tabular-nums", grid.dirty(t.id, "amount") && "bg-brand-50/60")}>{money(Number(grid.get(t.id, "amount", String(t.amount))))}</td>
                    {/* 改案件是最常見的動作，在列表直接做；不觸發開啟詳情 */}
                    <td className={td} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                      {editable ? <CasePicker t={t} /> : <span className="font-mono text-[12px]">{t.caseId ?? "—"}</span>}
                    </td>
                    <td className={td}>
                      <Badge tone={LINK_TONE[t.link]}>{t.link}</Badge>
                      {t.link === "未歸戶" && daysSince(t.date) > s.settings.unassignedDays && <span className="ml-1.5 text-[11.5px] text-rose-600">已 {daysSince(t.date)} 天</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {open && <NewTravel onClose={() => setOpen(false)} />}
      {detail && <TravelDetail t={detail} grid={grid} onClose={() => setDetailId(null)} />}
    </div>
  );
}

// 所屬案件：候選來自當天行事曆，人選了才算數；隨時可重新指定（PRD 3.7）
function CasePicker({ t, block }: { t: Travel; block?: boolean }) {
  const s = useStore();
  const assign = (caseId: string | undefined) => {
    if (caseId === t.caseId) return;
    s.updateTravel(t.id, { caseId, link: caseId ? "人工手動指定" : "未歸戶" });
    s.log({ module: "差旅費", refId: t.id, caseId, target: `${t.detail} ${money(t.amount)}`, action: caseId ? "手動指定案件" : "改為未歸戶", before: t.caseId ?? "未歸戶", after: caseId ?? "未歸戶" });
    s.toast(caseId ? `已歸戶至 ${caseId}` : "已改為未歸戶", caseId ? "success" : "info");
  };
  return (
    <Popover
      width={320}
      trigger={({ toggle }) => (
        <button
          onClick={toggle}
          className={cn(
            "flex max-w-full items-center gap-1.5 rounded-md border bg-white text-left transition-colors hover:border-ink-300 hover:bg-ink-25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300",
            block ? "h-9 w-full justify-between px-3" : "h-7 px-2",
            t.caseId ? "border-ink-200 font-mono text-[12px] text-ink-800" : "border-dashed border-ink-300 text-[12.5px] font-medium text-ink-700",
          )}
        >
          <span className="truncate">{t.caseId ?? "指定案件"}</span>
          <ChevronDown className="size-3.5 shrink-0 text-ink-500" />
        </button>
      )}
    >
      {(close) => {
        const cands = travelCandidates(t.date, t.memberId, s.events, s.cases, s.customers).map((x) => x.caseId);
        return (
          <OptionList
            searchAt={1}
            placeholder="搜尋案件編號或客戶"
            selected={[t.caseId ?? "__none"]}
            options={[
              ...cands.map((id) => ({ value: id, label: id, hint: "當天行事曆" })),
              ...s.visibleCases.filter((c) => !cands.includes(c.id)).map((c) => ({ value: c.id, label: c.id, hint: s.customerOf(c).short })),
              { value: "__none", label: "標記為未歸戶" },
            ]}
            onPick={(v) => (assign(v === "__none" ? undefined : v), close())}
          />
        );
      }}
    </Popover>
  );
}

const TRAVEL_FIELDS: Record<string, string> = { date: "日期", category: "類別", detail: "細項", amount: "金額" };
const travelInvalid = (field: string, v: string) => (field === "amount" ? (Number(v) > 0 ? "" : "金額需大於 0") : v.trim() ? "" : `${TRAVEL_FIELDS[field]}不可空白`);

// 差旅費詳情：與其他表格同一套規則，改了先暫存、按「儲存變更」才寫入；關閉面板不會遺失，列表與頂列都看得到未儲存
function TravelDetail({ t, grid, onClose }: { t: Travel; grid: Grid; onClose: () => void }) {
  const s = useStore();
  const m = s.memberOf(t.memberId);
  const editable = t.memberId === s.me.id || s.perms.travelAll;
  const history = s.audit.filter((a) => a.refId === t.id);
  const cands = travelCandidates(t.date, t.memberId, s.events, s.cases, s.customers).map((x) => x.caseId);
  const val = (field: keyof typeof TRAVEL_FIELDS & string) => grid.get(t.id, field, String(t[field as keyof Travel] ?? ""));
  const set = (field: string, v: string) => grid.set(t.id, field, String(t[field as keyof Travel] ?? ""), v);
  const ring = (field: string) => (grid.dirty(t.id, field) ? "bg-brand-50/60" : undefined);
  const err = (field: string) => (grid.dirty(t.id, field) ? travelInvalid(field, val(field)) : "");
  return (
    <Drawer
      open
      onClose={onClose}
      title={val("detail") || t.detail}
      desc={`${fmtDate(val("date") || t.date)} ${weekday(val("date") || t.date)}・${m?.nickname ?? m?.name}`}
      width={440}
      footer={
        editable ? (
          <>
            <span className="mr-auto text-[12.5px] text-ink-600">{grid.count ? `${grid.count} 項未儲存` : "沒有未儲存的變更"}</span>
            <Button variant="ghost" disabled={!grid.count} onClick={s.discardAll}>
              捨棄
            </Button>
            <Button variant="dark" disabled={!grid.count} icon={<Check className="size-4" />} onClick={s.saveAll}>
              儲存變更
            </Button>
          </>
        ) : undefined
      }
    >
      <div className="space-y-6 px-5 py-5">
        <div className="grid grid-cols-2 gap-3">
          <Field label="日期">
            <Input type="date" disabled={!editable} className={ring("date")} value={val("date")} onChange={(e) => set("date", e.target.value)} />
            {err("date") && <p className="mt-1 text-[12px] text-rose-600">{err("date")}</p>}
          </Field>
          <Field label="類別">
            <Select disabled={!editable} value={val("category")} onChange={(v) => set("category", v)} options={["交通費", "住宿費", "膳食費", "其他費用"]} />
          </Field>
          <div className="col-span-2">
            <Field label="細項">
              <Input disabled={!editable} className={ring("detail")} value={val("detail")} onChange={(e) => set("detail", e.target.value)} />
              {err("detail") && <p className="mt-1 text-[12px] text-rose-600">{err("detail")}</p>}
            </Field>
          </div>
          <div className="col-span-2">
            <Field label="金額">
              <Input type="number" className={cn("tabular-nums", ring("amount"))} disabled={!editable} value={val("amount")} onChange={(e) => set("amount", e.target.value)} />
              {err("amount") && <p className="mt-1 text-[12px] text-rose-600">{err("amount")}</p>}
            </Field>
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-[12.5px] font-medium text-ink-700">所屬案件</p>
          {editable ? <CasePicker t={t} block /> : <p className="font-mono text-[12.5px] text-ink-800">{t.caseId ?? "未歸戶"}</p>}
          <div className="mt-2 flex items-center gap-2">
            <Badge tone={LINK_TONE[t.link]}>{t.link}</Badge>
            {t.caseId && t.link === "系統建議已確認" && !cands.includes(t.caseId) && (
              <span className="flex items-center gap-1 text-[12px] text-ink-600">
                <Info className="size-3.5 shrink-0" />
                這天的行事曆沒有此案件，可視需要重新指定
              </span>
            )}
          </div>
        </div>

        {s.perms.audit && (
          <div>
            <p className="mb-3 text-[12.5px] font-medium text-ink-700">這筆的異動紀錄</p>
            {history.length ? <ActivityTimeline entries={history} showCase={false} /> : <p className="text-[12.5px] text-ink-600">還沒有異動紀錄</p>}
          </div>
        )}
      </div>
    </Drawer>
  );
}

function NewTravel({ onClose }: { onClose: () => void }) {
  const s = useStore();
  const [date, setDate] = useState(param("date") ?? TODAY);
  const [category, setCategory] = useState<Travel["category"]>("交通費");
  const [detail, setDetail] = useState("");
  const [amount, setAmount] = useState("");
  const cands = useMemo(() => travelCandidates(date, s.me.id, s.events, s.cases, s.customers), [date, s.events, s.cases, s.customers, s.me.id]);
  const [pick, setPick] = useState<string | "none" | null>(null);
  const [manual, setManual] = useState("");
  const chosen = pick ?? (cands.length === 1 ? cands[0].caseId : null);
  const dayEvents = s.events.filter((e) => e.date === date && e.memberId === s.me.id);
  const valid = detail.trim() && Number(amount) > 0;

  const submit = () => {
    let caseId: string | undefined;
    let link: Travel["link"] = "未歸戶";
    if (chosen && chosen !== "none") {
      caseId = chosen;
      link = "系統建議已確認";
    } else if (manual) {
      caseId = manual;
      link = "人工手動指定";
    }
    const t: Travel = { id: uid("t"), date, memberId: s.me.id, category, detail: detail.trim(), amount: Number(amount), caseId, link, createdAt: nowStamp().slice(0, 10) };
    s.addTravel(t);
    s.log({ module: "差旅費", refId: t.id, caseId, target: `${t.detail} ${money(t.amount)}`, action: link === "系統建議已確認" ? "確認系統建議歸戶" : link === "人工手動指定" ? "手動指定案件" : "新增（未歸戶）" });
    s.toast(caseId ? `已填報並歸戶至 ${caseId}` : "已填報，標記為未歸戶", caseId ? "success" : "info");
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      width={620}
      title="新增差旅費"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button variant="dark" disabled={!valid} onClick={submit}>
            {chosen && chosen !== "none" ? "確認並送出" : manual ? "送出" : "送出（未歸戶）"}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="日期">
          <Input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setPick(null);
              setManual("");
            }}
          />
        </Field>
        <Field label="類別">
          <Select value={category} onChange={(v) => setCategory(v as Travel["category"])} options={["交通費", "住宿費", "膳食費", "其他費用"]} />
        </Field>
        <Field label="細項">
          <Input value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="例：高鐵 台北－左營 來回" />
        </Field>
        <Field label="金額">
          <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className="tabular-nums" />
        </Field>
      </div>

      <div className="mt-5 rounded-xl border border-ink-200">
        <div className="flex items-center gap-2 border-b border-ink-100 px-4 py-2.5">
          <Sparkles className="size-4 text-brand-500" />
          <p className="text-[13px] font-semibold text-ink-900">所屬案件</p>
          <span className="text-[12px] text-ink-500">
            ・比對 {fmtDate(date)} 你的 Calendar 行程（{dayEvents.length} 筆）
          </span>
        </div>
        <div className="space-y-2 p-4">
          {cands.length === 1 && (
            <>
              <p className="text-[12.5px] text-ink-600">偵測到候選案件：</p>
              <CandRow sel={chosen === cands[0].caseId} onClick={() => setPick(cands[0].caseId)} caseId={cands[0].caseId} ev={cands[0].event} />
            </>
          )}
          {cands.length > 1 && (
            <>
              <p className="text-[12.5px] text-ink-600">當天有 {cands.length} 個案件行程，請選擇一個，或皆不選：</p>
              {cands.map((x) => (
                <CandRow key={x.caseId} sel={chosen === x.caseId} onClick={() => setPick(x.caseId)} caseId={x.caseId} ev={x.event} />
              ))}
            </>
          )}
          {cands.length === 0 && (
            <div className="flex items-start gap-3 rounded-lg bg-ink-50 px-3 py-3">
              <CalendarX2 className="mt-0.5 size-4 shrink-0 text-ink-400" />
              <div className="flex-1">
                <p className="text-[12.5px] text-ink-700">當天沒有可比對的排課、稽核或拜訪行程</p>
              </div>
            </div>
          )}
          {cands.length > 0 && (
            <button
              onClick={() => setPick("none")}
              className={cn("flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-[12.5px]", chosen === "none" ? "border-ink-900 ring-1 ring-ink-900" : "border-ink-200 hover:bg-ink-25")}
            >
              <span className={cn("grid size-4 place-items-center rounded-full border", chosen === "none" ? "border-brand-500 bg-brand-500" : "border-ink-300")}>{chosen === "none" && <span className="size-1.5 rounded-full bg-white" />}</span>
              皆不是，手動指定或先標記未歸戶
            </button>
          )}
          {(cands.length === 0 || chosen === "none") && (
            <Select value={manual} onChange={setManual} placeholder="手動搜尋指定案件（選填）" options={s.visibleCases.map((c) => ({ value: c.id, label: c.id }))} />
          )}
        </div>
      </div>
    </Modal>
  );
}

function CandRow({ sel, onClick, caseId, ev }: { sel: boolean; onClick: () => void; caseId: string; ev: { title: string; start: string; end: string; location?: string } }) {
  return (
    <button onClick={onClick} className={cn("flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition", sel ? "border-brand-500 bg-brand-50/40 ring-1 ring-brand-500" : "border-ink-200 hover:bg-ink-25")}>
      <span className={cn("grid size-4 shrink-0 place-items-center rounded-full border", sel ? "border-brand-500 bg-brand-500 text-white" : "border-ink-300")}>{sel && <Check className="size-2.5" strokeWidth={4} />}</span>
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[12.5px] font-medium text-ink-900">{caseId}</p>
        <p className="mt-0.5 flex items-center gap-1 truncate text-[11.5px] text-ink-500">
          <Car className="size-3" />
          {ev.title}・{ev.start}–{ev.end}
          {ev.location && (
            <>
              <MapPin className="ml-1 size-3" />
              {ev.location}
            </>
          )}
        </p>
      </div>
    </button>
  );
}
