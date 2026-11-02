import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, CircleAlert, Download, FileSpreadsheet, Plus, Receipt, Users } from "lucide-react";
import { useStore } from "../lib/store";
import type { Case, Period } from "../lib/types";
import { TODAY, openParam, agingBucket, dueDateOf, cn, contractTotal, fmtDate, missingInvoice, money, periodState, triggerLabel, uid, withTax } from "../lib/utils";
import { Avatar, Badge, Button, Checkbox, Empty, Field, Input, Modal, PageHeader, SearchInput, Segmented, Select, StatGroup, StatusPill, Tabs, ease, td, th } from "../components/ui";
import { InvoiceModal, InvoicePill, PayPill, RequestCell, savePeriodChanges } from "../components/finance";
import { GridCell, useGridDraft, type Change, type Grid } from "../components/grid";
import { FilterChips, FilterMenu, Toolbar, pass, useFacets, type Facet } from "../components/filters";

type Row = { c: Case; p: Period; st: ReturnType<typeof periodState> };

export function FinanceCenter({ tab: initial }: { tab?: string }) {
  const s = useStore();
  const [tab, setTab] = useState<"todo" | "billing" | "payables">((initial as "todo") ?? "todo");
  const [exporting, setExporting] = useState(openParam("export"));
  const [newInvoice, setNewInvoice] = useState<{ caseId?: string } | null>(null);
  const canAddInvoice = s.perms.financeRecord || s.perms.casesEdit;
  const rows: Row[] = useMemo(() => s.cases.flatMap((c) => c.periods.map((p) => ({ c, p, st: periodState(p, s.settings.payDays) }))), [s.cases, s.settings.payDays]);
  const todo = rows.filter((r) => r.st.invoice === "待開立");
  const ar = rows.filter((r) => r.st.pay === "待收款");
  const overdue = ar.filter((r) => r.st.overdue > 0);
  const paidThisMonth = rows.filter((r) => r.p.paidDate?.startsWith(TODAY.slice(0, 7)));
  const grid = useGridDraft((changes: Change[]) => savePeriodChanges(s, changes));
  const switchTab = (v: typeof tab) => s.guarded(() => setTab(v));

  return (
    <div>
      <PageHeader
        title="財務中心"
        actions={
          <>
            {canAddInvoice && tab !== "payables" && (
              <Button variant="outline" icon={<Plus className="size-4" />} onClick={() => setNewInvoice({})}>
                新增發票
              </Button>
            )}
            {s.perms.exportExcel && (
              <Button variant="dark" icon={<FileSpreadsheet className="size-4" />} onClick={() => setExporting(true)}>
                匯出待開發票清單
              </Button>
            )}
          </>
        }
      />
      <div className="px-8 pt-5">
        <StatGroup
          items={[
            { label: "待開立發票", value: todo.length, sub: <>含稅 {money(todo.reduce((n, r) => n + withTax(r.p.amount), 0))}</>, onClick: () => switchTab("todo") },
            { label: "應收未收（含稅）", value: money(ar.reduce((n, r) => n + withTax(r.p.amount), 0)), sub: <>{ar.length} 筆已開票</>, onClick: () => switchTab("billing") },
            { label: "已逾期", value: overdue.length, sub: <span className="text-rose-600">{money(overdue.reduce((n, r) => n + withTax(r.p.amount), 0))}</span> },
            { label: "本月已收款", value: money(paidThisMonth.reduce((n, r) => n + withTax(r.p.amount), 0)), sub: <>{paidThisMonth.length} 筆</> },
          ]}
        />
      </div>
      <Tabs
        className="mt-5 px-8"
        value={tab}
        onChange={switchTab}
        items={[
          { value: "todo", label: <><Receipt />開票待辦</>, count: todo.length },
          { value: "billing", label: <><FileSpreadsheet />請款總表</> },
          { value: "payables", label: <><Users />外聘顧問請款</>, count: s.payables.filter((p) => p.status === "待核准").length, hidden: !s.perms.payables },
        ]}
      />
      <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease }} className="px-8 py-5">
        {tab === "todo" && <TodoList rows={todo} onNew={canAddInvoice ? (caseId) => setNewInvoice({ caseId }) : undefined} />}
        {tab === "billing" && <BillingTable rows={rows} grid={grid} />}
        {tab === "payables" && <Payables />}
      </motion.div>
      {exporting && <ExportModal onClose={() => setExporting(false)} />}
      {newInvoice && <NewInvoiceModal caseId={newInvoice.caseId} onClose={() => setNewInvoice(null)} />}
    </div>
  );
}

function TodoList({ rows, onNew }: { rows: Row[]; onNew?: (caseId: string) => void }) {
  const s = useStore();
  const [inv, setInv] = useState<Row | null>(null);
  // 進入輔導中以後仍未申請任何一期的案件：系統不代為申請，由財務判斷是否直接新增發票
  const missing = s.cases.filter((c) => missingInvoice(c, s.statusOf(c)));
  const groups = [
    { title: "待開立", list: [...rows].sort((a, b) => (a.p.requestedAt ?? "").localeCompare(b.p.requestedAt ?? "")) },
  ];
  return (
    <div className="space-y-5">
      {!rows.length && <Empty icon={<CheckCircle2 />} title="目前沒有待開立的發票" />}
      {groups
        .filter((g) => g.list.length)
        .map((g) => (
          <div key={g.title}>
            <p className="mb-2 text-[12.5px] font-medium text-ink-500">
              {g.title}・{g.list.length} 筆
            </p>
            <div className="overflow-hidden rounded-xl border border-ink-200 bg-white shadow-card">
              {g.list.map((r) => {
                const cu = s.customerOf(r.c);
                const ready = !!cu.invoiceTitle && !!cu.taxId && !!cu.invoiceAddress;
                const by = s.memberOf(r.p.requestedBy);
                return (
                  <div key={r.c.id + r.p.id} className="flex items-center gap-4 border-b border-ink-100 px-5 py-3.5 last:border-b-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-medium text-ink-900">
                        {cu.short}
                        {r.c.site ? ` ${r.c.site}` : ""} {r.c.item}・第 {r.p.n} 期（{r.p.pct}%）
                      </p>
                      <p className="mt-0.5 text-[12px] text-ink-500">
                        <button onClick={() => s.go({ page: "case", id: r.c.id, tab: "finance" })} className="font-mono hover:text-ink-800 hover:underline">
                          {r.c.id}
                        </button>
                        ・{by?.nickname ?? by?.name} 於 {fmtDate(r.p.requestedAt)} {r.p.addedByFinance ? "新增" : "申請"}・品名「{r.c.invoiceItem}」
                      </p>
                      {r.p.requestNote && <p className="mt-1 text-[12px] text-ink-700">備註：{r.p.requestNote}</p>}
                    </div>
                    {ready ? (
                      <Badge tone="green">
                        <CheckCircle2 className="size-3" />
                        發票資訊已齊
                      </Badge>
                    ) : (
                      <Badge tone="amber">
                        <CircleAlert className="size-3" />
                        新客戶・待補發票資訊
                      </Badge>
                    )}
                    <span className="w-28 text-right text-[14px] font-semibold tabular-nums text-ink-900">{money(withTax(r.p.amount))}</span>
                    {s.perms.financeRecord && (
                      <Button variant="dark" size="sm" onClick={() => setInv(r)}>
                        登記開立
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      {missing.length > 0 && (
        <div>
          <p className="mb-2 text-[12.5px] font-medium text-ink-500">已進入輔導階段、尚未申請任何一期・{missing.length} 件</p>
          <div className="overflow-hidden rounded-xl border border-ink-200 bg-white shadow-card">
            {missing.map((c) => {
              const cu = s.customerOf(c);
              const owner = s.memberOf(c.owner);
              return (
                <div key={c.id} className="flex items-center gap-4 border-b border-ink-100 px-5 py-3 last:border-b-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] text-ink-900">
                      {cu.short}
                      {c.site ? ` ${c.site}` : ""} {c.item}
                    </p>
                    <p className="mt-0.5 text-[12px] text-ink-500">
                      <button onClick={() => s.go({ page: "case", id: c.id, tab: "finance" })} className="font-mono hover:text-ink-800 hover:underline">
                        {c.id}
                      </button>
                      ・負責人 {owner?.nickname ?? owner?.name}
                    </p>
                  </div>
                  <StatusPill status={s.statusOf(c)} />
                  {onNew && (
                    <Button size="sm" variant="outline" onClick={() => onNew(c.id)}>
                      新增發票
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {inv && <InvoiceModal c={inv.c} p={inv.p} onClose={() => setInv(null)} />}
    </div>
  );
}

function BillingTable({ rows, grid }: { rows: Row[]; grid: Grid }) {
  const s = useStore();
  const f = useFacets();
  const [q, setQ] = useState("");
  const can = s.perms.financeRecord;
  const payOf = (r: Row) => (r.st.pay === "待收款" && r.st.overdue > 0 ? "逾期" : r.st.pay);
  const trig = (r: Row) => (r.p.trigger === "開課" ? "第一堂課開課當月" : r.p.trigger === "取證" ? "取證後" : "自訂日期");
  const base = rows.filter((r) => r.st.invoice !== "未申請");
  const opt = (vals: string[], fn: (r: Row) => string) => vals.map((v) => ({ value: v, label: v, hint: String(base.filter((r) => fn(r) === v).length) }));
  const facets: Facet[] = [
    { key: "invoice", label: "發票狀態", options: opt(["待開立", "已開立"], (r) => r.st.invoice) },
    { key: "pay", label: "請款狀態", options: opt(["待收款", "逾期", "已收款"], payOf) },
    { key: "trigger", label: "預計開票時機", options: opt(["第一堂課開課當月", "取證後", "自訂日期"], trig) },
    { key: "customer", label: "客戶", options: [...new Set(base.map((r) => s.customerOf(r.c).short))].map((v) => ({ value: v, label: v, hint: String(base.filter((r) => s.customerOf(r.c).short === v).length) })) },
  ];
  const list = base
    .filter((r) => pass(f.value, "invoice", r.st.invoice) && pass(f.value, "pay", payOf(r)) && pass(f.value, "trigger", trig(r)) && pass(f.value, "customer", s.customerOf(r.c).short))
    .filter((r) => !q || [r.c.id, s.customerOf(r.c).short, r.p.invoiceNo ?? ""].some((x) => x.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => (b.p.invoiceDate ?? b.p.requestedAt ?? "").localeCompare(a.p.invoiceDate ?? a.p.requestedAt ?? ""));
  const cols: [string, number, boolean?][] = [
    ["客戶／案件", 200], ["期數", 100], ["預計開票時機", 120], ["含稅金額", 120, true], ["申請開票", 130], ["發票狀態", 110],
    ["發票號碼", 140], ["開立日期", 130], ["約定付款日", 130], ["請款狀態", 150], ["收款日期", 130], ["帳齡", 130],
  ];
  const plain = "h-11 border-b border-r border-ink-100 px-3 text-[13px]";
  return (
    <div>
      <Toolbar
        search={<SearchInput value={q} onChange={setQ} placeholder="搜尋客戶、案件、發票號碼" className="w-72" />}
        filter={<FilterMenu facets={facets} f={f} />}
        count={`${list.length} 筆`}
      />
      <FilterChips facets={facets} f={f} />
      <div className="overflow-x-auto rounded-xl border border-ink-200 bg-white shadow-card">
        <table className="w-full min-w-[1590px] table-fixed border-separate border-spacing-0">
          <colgroup>
            {cols.map(([h, w]) => (
              <col key={h} style={{ width: w }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              {cols.map(([h, , right], i) => (
                <th key={h} className={cn("h-10 border-b border-r border-ink-200 bg-ink-25 px-3 text-left text-[12.5px] font-medium text-ink-500 last:border-r-0", i === 0 && "pl-5", right && "text-right")}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.map((r, ri) => {
              const cu = s.customerOf(r.c);
              const key = `${r.c.id}:${r.p.id}`;
              const cell = (field: keyof typeof r.p & string, col: number, extra: Partial<Parameters<typeof GridCell>[0]> = {}) => {
                const orig = String((field === "dueDate" ? dueDateOf(r.p, s.settings.payDays) : r.p[field]) ?? "");
                return (
                  <GridCell
                    pos={[ri, col]}
                    value={grid.get(key, field, orig)}
                    dirty={grid.dirty(key, field)}
                    editable={can}
                    type="date"
                    format={fmtDate}
                    onChange={(v) => grid.set(key, field, orig, v)}
                    {...extra}
                  />
                );
              };
              const invoiced = !!grid.get(key, "invoiceNo", r.p.invoiceNo ?? "");
              return (
                <tr key={key}>
                  <td className={cn(plain, "pl-5")}>
                    <button onClick={() => s.go({ page: "case", id: r.c.id, tab: "finance" })} className="block w-full truncate text-left leading-tight">
                      <span className="font-medium text-ink-900 hover:underline">
                        {cu.short}
                        {r.c.site ? ` ${r.c.site}` : ""}
                      </span>
                      <span className="ml-2 font-mono text-[11.5px] text-ink-400">{r.c.id}</span>
                    </button>
                  </td>
                  <td className={plain}>
                    第 {r.p.n} 期 <span className="text-ink-400">{r.p.pct}%</span>
                  </td>
                  <td className={cn(plain, "truncate text-ink-600")}>{triggerLabel(r.p)}</td>
                  <td className={cn(plain, "text-right font-medium tabular-nums")}>{money(withTax(r.p.amount))}</td>
                  <td className={plain}>
                    <RequestCell c={r.c} p={r.p} />
                  </td>
                  <td className={plain}>
                    <InvoicePill v={r.st.invoice} />
                  </td>
                  {cell("invoiceNo", 6, { type: "text", format: undefined, className: "font-mono text-[12.5px]" })}
                  {cell("invoiceDate", 7, { editable: can && invoiced })}
                  {cell("dueDate", 8, { editable: can && invoiced })}
                  <td className={plain}>
                    <PayPill v={r.st.pay} overdue={r.st.overdue} />
                  </td>
                  {cell("paidDate", 10, { editable: can && invoiced })}
                  <td className={cn(plain, "border-r-0 tabular-nums")}>
                    {r.st.pay === "待收款" ? <span className={cn(r.st.overdue > 90 ? "text-rose-600" : r.st.overdue > 0 ? "text-ink-900" : "text-ink-500")}>{agingBucket(r.st.overdue)}</span> : <span className="text-ink-300">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {list.length === 0 && <Empty title="沒有符合條件的請款紀錄" />}
      </div>
    </div>
  );
}

const PAY_FIELDS: Record<string, string> = { desc: "請款內容", amount: "金額", invoiceNo: "發票號碼" };

function Payables() {
  const s = useStore();
  const isExec = s.me.role === "主管" && s.perms.reviewPrice;
  const can = s.perms.financeRecord;
  const grid = useGridDraft((changes: Change[]) => {
    changes.forEach((ch) => {
      const p = s.payables.find((x) => x.id === ch.row);
      s.updatePayable(ch.row, ch.field === "amount" ? { amount: Number(ch.value) } : { [ch.field]: ch.value || undefined });
      s.log({ module: "財務", caseId: p?.caseId, target: "外聘顧問請款", action: `修改${PAY_FIELDS[ch.field]}`, before: ch.original || "—", after: ch.value || "清除" });
    });
    s.toast(`已儲存 ${changes.length} 項變更`);
  });
  const cols: [string, number, boolean?][] = [
    ["顧問", 150], ["案件", 200], ["請款內容", 220], ["請款日", 110], ["金額", 120, true], ["發票抬頭", 190], ["統一編號", 110], ["發票號碼", 140], ["收款帳戶", 200], ["狀態", 130], ["", 110],
  ];
  const plain = "h-11 border-b border-r border-ink-100 px-3 text-[13px]";
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);
  const f = useFacets();
  const nameOf = (id: string) => s.memberOf(id)?.nickname ?? s.memberOf(id)?.name ?? id;
  const facets: Facet[] = [
    { key: "status", label: "狀態", options: ["待核准", "已核准", "已付款"].map((v) => ({ value: v, label: v, hint: String(s.payables.filter((p) => p.status === v).length) })) },
    { key: "member", label: "顧問", options: [...new Set(s.payables.map((p) => p.memberId))].map((id) => ({ value: id, label: nameOf(id), hint: String(s.payables.filter((p) => p.memberId === id).length) })) },
  ];
  const shown = s.payables.filter(
    (p) => pass(f.value, "status", p.status) && pass(f.value, "member", p.memberId) && (!q || [p.caseId, p.desc, nameOf(p.memberId), p.invoiceNo ?? ""].some((x) => x.toLowerCase().includes(q.toLowerCase()))),
  );
  return (
    <div>
    <Toolbar
      search={<SearchInput value={q} onChange={setQ} placeholder="搜尋顧問、案件、請款內容" className="w-72" />}
      filter={<FilterMenu facets={facets} f={f} />}
      right={
        can && (
          <Button variant="outline" icon={<Plus className="size-4" />} onClick={() => setAdding(true)}>
            新增請款
          </Button>
        )
      }
      count={`${shown.length} 筆`}
    />
    <FilterChips facets={facets} f={f} />
    {adding && <NewPayableModal onClose={() => setAdding(false)} />}
    <div className="overflow-x-auto rounded-xl border border-ink-200 bg-white shadow-card">
      <table className="w-full min-w-[1680px] table-fixed border-separate border-spacing-0">
        <colgroup>
          {cols.map(([h, w], i) => (
            <col key={i} style={{ width: w }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {cols.map(([h, , right], i) => (
              <th key={i} className={cn("h-10 border-b border-r border-ink-200 bg-ink-25 px-3 text-left text-[12.5px] font-medium text-ink-500 last:border-r-0", i === 0 && "pl-5", right && "text-right")}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {shown.map((p, r) => {
            const m = s.memberOf(p.memberId);
            const cell = (field: "desc" | "amount" | "invoiceNo", col: number, extra: Partial<Parameters<typeof GridCell>[0]> = {}) => {
              const orig = String(p[field] ?? "");
              return <GridCell pos={[r, col]} value={grid.get(p.id, field, orig)} dirty={grid.dirty(p.id, field)} editable={can} onChange={(v) => grid.set(p.id, field, orig, v)} {...extra} />;
            };
            return (
              <tr key={p.id}>
                <td className={cn(plain, "pl-5")}>
                  <span className="flex items-center gap-2 truncate">
                    <Avatar m={m} size={22} />
                    {m?.nickname ?? m?.name}
                  </span>
                </td>
                <td className={cn(plain, "truncate font-mono text-[12px] text-ink-500")}>{p.caseId}</td>
                {cell("desc", 2)}
                <td className={cn(plain, "tabular-nums text-ink-600")}>{fmtDate(p.requestDate)}</td>
                {cell("amount", 4, { type: "number", align: "right", format: (v) => money(Number(v)) })}
                <td className={cn(plain, "truncate text-ink-600")}>{p.invoiceTitle}</td>
                <td className={cn(plain, "tabular-nums text-ink-600")}>{p.taxId}</td>
                {cell("invoiceNo", 7, { placeholder: "待補", className: "font-mono text-[12px]" })}
                <td className={cn(plain, "truncate text-ink-600")}>{p.account}</td>
                <td className={plain}>
                  <Badge tone={p.status === "已付款" ? "green" : p.status === "已核准" ? "gray" : "amber"}>{p.status}</Badge>
                  {p.paidDate && <span className="ml-1.5 text-[11.5px] text-ink-400">{fmtDate(p.paidDate).slice(5)}</span>}
                </td>
                <td className={cn(plain, "border-r-0 text-right")}>
                  {p.status === "待核准" && isExec && (
                    <Button
                      size="sm"
                      variant="brand"
                      onClick={() => {
                        s.updatePayable(p.id, { status: "已核准" });
                        s.log({ module: "財務", caseId: p.caseId, target: `${m?.name} 請款 ${money(p.amount)}`, action: "核准顧問請款" });
                        s.toast("已核准請款");
                      }}
                    >
                      核准
                    </Button>
                  )}
                  {p.status === "已核准" && can && (
                    <Button
                      size="sm"
                      onClick={() => {
                        s.updatePayable(p.id, { status: "已付款", paidDate: TODAY });
                        s.log({ module: "財務", caseId: p.caseId, target: `${m?.name} 請款 ${money(p.amount)}`, action: "登記已付款" });
                        s.toast("已登記付款");
                      }}
                    >
                      登記付款
                    </Button>
                  )}
                  {p.status === "待核准" && !isExec && <span className="text-[12px] text-ink-400">待核准</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
    </div>
  );
}

// 新增外聘顧問請款：由財務依顧問開來的發票登記；一口價，不計算分潤（10/29 會議）
function NewPayableModal({ onClose }: { onClose: () => void }) {
  const s = useStore();
  const consultants = s.members.filter((m) => m.status === "active" && (m.role === "顧問" || m.role === "外部顧問"));
  const [memberId, setMemberId] = useState("");
  const [caseId, setCaseId] = useState("");
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [requestDate, setRequestDate] = useState(TODAY);
  const [invoiceTitle, setInvoiceTitle] = useState("");
  const [taxId, setTaxId] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [account, setAccount] = useState("");
  const n = Number(amount) || 0;
  const valid = !!memberId && !!caseId && !!desc.trim() && n > 0;
  // 選顧問時帶入上一筆請款的發票抬頭、統編與收款帳戶
  const pickMember = (id: string) => {
    setMemberId(id);
    const last = s.payables.find((p) => p.memberId === id);
    setInvoiceTitle(last?.invoiceTitle ?? "");
    setTaxId(last?.taxId ?? "");
    setAccount(last?.account ?? "");
  };
  const save = () => {
    const m = s.memberOf(memberId);
    s.addPayable({ id: uid("ap"), memberId, caseId, desc: desc.trim(), requestDate, amount: n, invoiceTitle, taxId, invoiceNo: invoiceNo.trim() || undefined, account, status: "待核准" });
    s.log({ module: "財務", caseId, target: "外聘顧問請款", action: "新增請款", after: `${m?.name}・${desc.trim()}・${money(n)}` });
    s.toast("已新增請款，待核價主管核准");
    onClose();
  };
  return (
    <Modal
      open
      onClose={onClose}
      width={600}
      title="新增外聘顧問請款"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button variant="dark" disabled={!valid} onClick={save}>
            新增
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="顧問" required>
            <Select value={memberId} onChange={pickMember} placeholder="選擇顧問" options={consultants.map((m) => ({ value: m.id, label: m.name, hint: m.title }))} />
          </Field>
          <Field label="案件" required>
            <Select value={caseId} onChange={setCaseId} placeholder="搜尋案件編號或客戶" options={s.cases.map((x) => ({ value: x.id, label: x.id, hint: s.customerOf(x).short }))} />
          </Field>
        </div>
        <Field label="請款內容" required>
          <Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="例：第 1–4 堂輔導費" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="金額" required>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className="tabular-nums" />
          </Field>
          <Field label="請款日">
            <Input type="date" value={requestDate} onChange={(e) => setRequestDate(e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="發票抬頭">
            <Input value={invoiceTitle} onChange={(e) => setInvoiceTitle(e.target.value)} />
          </Field>
          <Field label="統一編號">
            <Input value={taxId} onChange={(e) => setTaxId(e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="發票號碼">
            <Input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value.toUpperCase())} placeholder="可之後再補" />
          </Field>
          <Field label="收款帳戶">
            <Input value={account} onChange={(e) => setAccount(e.target.value)} />
          </Field>
        </div>
      </div>
    </Modal>
  );
}

// 新增發票：財務不必等負責人申請。一期對應一張發票與一筆收款，所以是選一期還沒開立的，或新增一期；沒有發票號碼時先存成待開立
function NewInvoiceModal({ caseId: initial, onClose }: { caseId?: string; onClose: () => void }) {
  const s = useStore();
  const can = s.perms.financeRecord;
  const firstOpen = (id?: string) => s.cases.find((x) => x.id === id)?.periods.find((p) => !p.invoiceNo);
  const [caseId, setCaseId] = useState(initial ?? "");
  const [periodId, setPeriodId] = useState(firstOpen(initial)?.id ?? "new");
  const [amount, setAmount] = useState(String(firstOpen(initial)?.amount ?? ""));
  const [no, setNo] = useState("");
  const [date, setDate] = useState(TODAY);
  const [kind, setKind] = useState<"電子發票" | "紙本">("電子發票");
  const c = s.cases.find((x) => x.id === caseId);
  const target = c?.periods.find((p) => p.id === periodId);
  const total = c ? contractTotal(c) : 0;
  const n = Number(amount) || 0;
  const pct = total ? Math.round((n / total) * 100) : (target?.pct ?? 0);
  const planned = c ? c.periods.reduce((acc, p) => acc + p.amount, 0) : 0;
  const cu = c && s.customerOf(c);
  const number = no.trim();
  const pickCase = (id: string) => {
    const first = firstOpen(id);
    setCaseId(id);
    setPeriodId(first?.id ?? "new");
    setAmount(String(first?.amount ?? ""));
  };
  const pickPeriod = (id: string) => {
    setPeriodId(id);
    setAmount(String(c?.periods.find((p) => p.id === id)?.amount ?? ""));
  };

  const save = () => {
    if (!c) return;
    const before = c.periods;
    const label = target ? target.n : c.periods.length + 1;
    const patch = {
      amount: n,
      pct,
      requestedAt: target?.requestedAt ?? TODAY,
      requestedBy: target?.requestedBy ?? s.me.id,
      addedByFinance: target?.requestedAt ? target.addedByFinance : true,
      ...(number ? { invoiceNo: number, invoiceDate: date, invoiceKind: kind } : {}),
    };
    s.updateCase(c.id, (x) => ({
      ...x,
      periods: target ? x.periods.map((y) => (y.id === target.id ? { ...y, ...patch } : y)) : [...x.periods, { id: uid("p"), n: label, trigger: "自訂" as const, customDate: date, ...patch }],
    }));
    s.log({ module: "財務", caseId: c.id, target: `第 ${label} 期發票`, action: "新增發票", after: `未稅 ${money(n)}・${number || "待開立"}` });
    s.toast(number ? `已新增 ${c.id} 第 ${label} 期發票` : `已新增 ${c.id} 第 ${label} 期，待開立`, "success", {
      label: "復原",
      run: () => {
        s.updateCase(c.id, (x) => ({ ...x, periods: before }));
        s.log({ module: "財務", caseId: c.id, target: `第 ${label} 期發票`, action: "復原新增發票" });
      },
    });
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      width={560}
      title="新增發票"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button variant="dark" disabled={!c || n <= 0} onClick={save}>
            {number ? "新增發票" : "存為待開立"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="案件" required>
          <Select value={caseId} onChange={pickCase} placeholder="搜尋案件編號或客戶" options={s.visibleCases.map((x) => ({ value: x.id, label: x.id, hint: s.customerOf(x).short }))} />
        </Field>
        {c && (
          <div className="rounded-xl border border-ink-200 bg-ink-25 px-4 py-3 text-[12.5px]">
            <div className="flex items-center justify-between">
              <span className="text-ink-500">合約總額（未稅）</span>
              <span className="font-medium tabular-nums text-ink-900">{money(total)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-ink-500">已設定 {c.periods.length} 期</span>
              <span className="tabular-nums text-ink-700">{money(planned)}</span>
            </div>
          </div>
        )}
        {c && (
          <Field label="期別" required>
            <Select
              value={periodId}
              onChange={pickPeriod}
              options={[
                ...c.periods.filter((p) => !p.invoiceNo).map((p) => ({ value: p.id, label: `第 ${p.n} 期・${money(p.amount)}`, hint: p.requestedAt ? "待開立" : "未申請" })),
                { value: "new", label: "新增一期" },
              ]}
            />
          </Field>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="金額（未稅）" required>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className="tabular-nums" />
          </Field>
          <Field label="含稅">
            <Input value={n ? `${money(withTax(n))}${total ? `・${pct}%` : ""}` : ""} disabled />
          </Field>
        </div>
        {can && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field label="發票號碼">
                <Input value={no} onChange={(e) => setNo(e.target.value.toUpperCase())} placeholder="還沒拿到可之後再補" />
              </Field>
              <Field label="開立日期">
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled={!number} />
              </Field>
            </div>
            {number && (
              <Field label="發票類型">
                <Segmented
                  value={kind}
                  onChange={setKind}
                  items={[
                    { value: "電子發票", label: "電子發票" },
                    { value: "紙本", label: "紙本" },
                  ]}
                />
              </Field>
            )}
          </>
        )}
        {cu && (!cu.invoiceTitle || !cu.taxId || !cu.invoiceAddress) && <p className="text-[12.5px] text-amber-700">這個客戶的發票抬頭、統編或地址還沒補齊，可以先新增，開票前再到客戶資料補上。</p>}
      </div>
    </Modal>
  );
}

const CHECKS = ["已開立並付款", "已開立尚未付款", "本次開立（紙本）", "本次應開立（電子發票）", "已開立電子發票（寄mail）"];

function ExportModal({ onClose }: { onClose: () => void }) {
  const s = useStore();
  const [scope, setScope] = useState<"todo" | "all">("todo");
  const [picked, setPicked] = useState<Set<string> | null>(null);
  const base = s.cases.filter((c) => c.periods.length && (scope === "all" || c.periods.some((p) => periodState(p, s.settings.payDays).invoice === "待開立")));
  const sel = picked ?? new Set(base.map((c) => c.id));
  const list = base.filter((c) => sel.has(c.id));
  const N = Math.max(1, ...list.map((c) => c.periods.length));
  const head = [
    "簡稱", "編號", "公司名稱", "統一編號", "姓名", "電話", "地址", "信箱", "輔導顧問", "驗證項目", "類別", "發票上的備註（輔導內容）", "品名", "總費用（未稅）",
    ...Array.from({ length: N }, (_, i) => [`第${i + 1}期費用`, `第${i + 1}期開立日期`, `第${i + 1}期發票號碼`, `第${i + 1}期付款日期`]).flat(),
    ...CHECKS,
    "備註",
  ];
  const rowOf = (c: Case) => {
    const cu = s.customerOf(c);
    const st = c.periods.map((p) => periodState(p, s.settings.payDays));
    const kind = [...c.periods].reverse().find((p) => p.invoiceKind)?.invoiceKind ?? "電子發票";
    const pending = st.some((x) => x.invoice === "待開立");
    const checks = [
      st.some((x) => x.invoice === "已開立") && st.filter((x) => x.invoice === "已開立").every((x) => x.pay === "已收款"),
      st.some((x) => x.pay === "待收款"),
      pending && kind === "紙本",
      pending && kind === "電子發票",
      c.periods.some((p) => p.invoiceNo && p.invoiceKind === "電子發票"),
    ];
    return [
      cu.short, cu.code, cu.name, cu.taxId, cu.contact.name, cu.contact.phone, cu.invoiceAddress || cu.address, cu.contact.email,
      s.memberOf(c.owner)?.name ?? "", c.item, c.category, c.invoiceNote, c.invoiceItem, String(contractTotal(c)),
      ...Array.from({ length: N }, (_, i) => {
        const p = c.periods[i];
        return p ? [String(p.amount), fmtDate(p.invoiceDate).replace("—", ""), p.invoiceNo ?? "", fmtDate(p.paidDate).replace("—", "")] : ["", "", "", ""];
      }).flat(),
      ...checks.map((b) => (b ? "✓" : "")),
      "",
    ];
  };
  const download = () => {
    const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
    const csv = "﻿" + [head, ...list.map(rowOf)].map((r) => r.map(esc).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `恆永_待開發票清單_${TODAY.replace(/-/g, "")}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    s.log({ module: "財務", target: "待開發票清單", action: "匯出 Excel", after: `${list.length} 筆` });
    s.toast(`已匯出 ${list.length} 筆，欄位與「會計」分頁一致`);
    onClose();
  };
  return (
    <Modal
      open
      onClose={onClose}
      width={1080}
      title="匯出待開發票清單"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} className="ml-auto">
            取消
          </Button>
          <Button variant="dark" icon={<Download className="size-4" />} disabled={!list.length} onClick={download}>
            下載 Excel（{list.length} 筆）
          </Button>
        </>
      }
    >
      <div className="mb-3 flex items-center gap-3">
        <Segmented
          value={scope}
          onChange={(v) => {
            setScope(v);
            setPicked(null);
          }}
          items={[
            { value: "todo", label: "僅含待開立的案件" },
            { value: "all", label: "所有有分期的案件" },
          ]}
        />
        <span className="text-[12.5px] text-ink-500">
          已選 {list.length}/{base.length} 筆
        </span>
      </div>
      <div className="max-h-[52vh] overflow-auto rounded-xl border border-ink-200">
        <table className="border-separate border-spacing-0 text-[12px]">
          <thead className="sticky top-0 z-10">
            <tr>
              <th className="sticky left-0 z-10 border-b border-r border-ink-200 bg-ink-50 px-3 py-2">
                <Checkbox checked={list.length === base.length && base.length > 0} indeterminate={list.length > 0 && list.length < base.length} onChange={(v) => setPicked(v ? null : new Set())} />
              </th>
              {head.map((h) => (
                <th key={h} className={cn("whitespace-nowrap border-b border-r border-ink-200 bg-ink-50 px-3 py-2 text-left font-medium text-ink-600", h.startsWith("第") && "bg-ink-50 text-ink-800", CHECKS.includes(h) && "bg-amber-50/70")}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {base.map((c) => {
              const on = sel.has(c.id);
              return (
                <tr key={c.id} className={cn(!on && "opacity-40")}>
                  <td className="sticky left-0 border-b border-r border-ink-100 bg-white px-3 py-2">
                    <Checkbox checked={on} onChange={(v) => setPicked(() => { const n = new Set(sel); v ? n.add(c.id) : n.delete(c.id); return n; })} />
                  </td>
                  {rowOf(c).map((v, i) => (
                    <td key={i} className={cn("max-w-[220px] truncate whitespace-nowrap border-b border-r border-ink-100 px-3 py-2 tabular-nums", v === "✓" && "text-center font-semibold text-brand-600", !v && "text-ink-300")}>
                      {v || "—"}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}
