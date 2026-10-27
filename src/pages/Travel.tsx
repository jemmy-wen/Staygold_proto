import { useMemo, useState } from "react";
import { CalendarCheck, CalendarX2, Car, Check, MapPin, Plus, Sparkles } from "lucide-react";
import { useStore } from "../lib/store";
import { travelCandidates } from "../lib/rules";
import { FilterChips, FilterMenu, Toolbar, pass, useFacets, type Facet } from "../components/filters";
import type { Travel } from "../lib/types";
import { TODAY, openParam, param, cn, daysSince, fmtDate, money, nowStamp, uid, weekday } from "../lib/utils";
import { Avatar, Badge, Button, Field, Input, MenuItem, Modal, OptionList, PageHeader, Popover, SearchInput, Segmented, Select, StatGroup, td, th } from "../components/ui";

const LINK_TONE = { 系統建議已確認: "brand", 人工手動指定: "gray", 未歸戶: "amber" } as const;

export function TravelPage() {
  const s = useStore();
  const f = useFacets();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(openParam("travelNew"));
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
  const month = mine.filter((t) => t.date.startsWith(TODAY.slice(0, 7)));
  const confirmed = mine.filter((t) => t.link === "系統建議已確認").length;

  const assign = (t: Travel, caseId: string | undefined) => {
    s.updateTravel(t.id, { caseId, link: caseId ? "人工手動指定" : "未歸戶" });
    s.log({ module: "差旅費", caseId, target: `${t.detail} ${money(t.amount)}`, action: caseId ? "手動指定案件" : "改為未歸戶", before: t.caseId ?? "未歸戶", after: caseId ?? "未歸戶" });
    s.toast(caseId ? `已歸戶至 ${caseId}` : "已改為未歸戶", caseId ? "success" : "info");
  };
  const assignable = s.visibleCases;

  return (
    <div className="pb-10">
      <PageHeader
        title="差旅費"
        actions={
          <Button variant="dark" icon={<Plus className="size-4" />} onClick={() => setOpen(true)}>
            新增差旅費
          </Button>
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
        <div className="overflow-x-auto rounded-xl border border-ink-200 bg-white shadow-card">
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
                  <tr key={t.id} className="hover:bg-ink-25">
                    <td className={cn(td, "pl-5 tabular-nums")}>
                      {fmtDate(t.date)} <span className="text-ink-400">{weekday(t.date)}</span>
                    </td>
                    <td className={td}>
                      <span className="flex items-center gap-2">
                        <Avatar m={m} size={22} />
                        {m?.nickname ?? m?.name}
                      </span>
                    </td>
                    <td className={cn(td, "text-ink-600")}>{t.category}</td>
                    <td className={td}>{t.detail}</td>
                    <td className={cn(td, "text-right font-medium tabular-nums")}>{money(t.amount)}</td>
                    <td className={td}>
                      {editable ? (
                        <Popover
                          width={320}
                          trigger={({ toggle }) => (
                            <button onClick={toggle} className={cn("-mx-1.5 rounded-md px-1.5 py-1 text-left hover:bg-ink-50 hover:ring-1 hover:ring-ink-200", t.caseId ? "font-mono text-[12px] text-ink-800" : "text-[12.5px] text-ink-500")}>
                              {t.caseId ?? "指定案件"}
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
                                  ...assignable.filter((c) => !cands.includes(c.id)).map((c) => ({ value: c.id, label: c.id, hint: s.customerOf(c).short })),
                                  { value: "__none", label: "標記為未歸戶" },
                                ]}
                                onPick={(v) => (assign(t, v === "__none" ? undefined : v), close())}
                              />
                            );
                          }}
                        </Popover>
                      ) : (
                        <span className="font-mono text-[12px]">{t.caseId ?? "—"}</span>
                      )}
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
    </div>
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
    s.log({ module: "差旅費", caseId, target: `${t.detail} ${money(t.amount)}`, action: link === "系統建議已確認" ? "確認系統建議歸戶" : link === "人工手動指定" ? "手動指定案件" : "新增（未歸戶）" });
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
