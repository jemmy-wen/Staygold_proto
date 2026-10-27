import { useState } from "react";
import { CircleAlert, Pencil, Plus, Trash2 } from "lucide-react";
import { useStore } from "../../../lib/store";
import type { Case, Period } from "../../../lib/types";
import { cn, contractTotal, fmtDate, money, periodState, tax, triggerLabel, uid, withTax } from "../../../lib/utils";
import { Badge, Button, Card, StatGroup } from "../../../components/ui";
import { InvoicePill, PayPill, savePeriodChanges } from "../../../components/finance";
import { GridCell, useGridDraft, useLeaveGuard, type Change } from "../../../components/grid";

export function FinanceTab({ c }: { c: Case }) {
  const s = useStore();
  const cu = s.customerOf(c);
  const total = contractTotal(c);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Period[]>(c.periods);
  const rows = c.periods.map((p) => ({ p, st: periodState(c, p) }));
  const invoiced = rows.filter((r) => r.p.invoiceNo).reduce((n, r) => n + withTax(r.p.amount), 0);
  const paid = rows.filter((r) => r.p.paidDate).reduce((n, r) => n + withTax(r.p.amount), 0);
  const canPlan = s.perms.casesEdit || s.perms.financeRecord;
  const can = s.perms.financeRecord;
  const grid = useGridDraft((changes: Change[]) => savePeriodChanges(s, changes));
  const info = useGridDraft((changes: Change[]) => {
    s.updateCase(c.id, (x) => changes.reduce((acc, ch) => ({ ...acc, [ch.field]: ch.value }), x));
    changes.forEach((ch) => s.log({ module: "財務", caseId: c.id, target: "開票內容", action: `修改${ch.field === "invoiceItem" ? "品名" : "發票備註"}`, before: ch.original || "—", after: ch.value || "清除" }));
    s.toast(`已儲存 ${changes.length} 項變更`);
  });
  const savePlan = () => {
    s.updateCase(c.id, (x) => ({ ...x, periods: draft.map((p, i) => ({ ...p, n: i + 1 })) }));
    s.log({ module: "財務", caseId: c.id, target: "分期請款", action: "調整分期", after: draft.map((p) => `${p.pct}%`).join("／") });
    s.toast("已更新分期設定");
    setEditing(false);
  };
  useLeaveGuard(editing && JSON.stringify(draft) !== JSON.stringify(c.periods) ? 1 : 0, savePlan, () => setEditing(false));
  const travel = s.travel.filter((t) => t.caseId === c.id);
  const payables = s.payables.filter((p) => p.caseId === c.id);
  const pctSum = draft.reduce((n, p) => n + p.pct, 0);
  const missingInvoiceInfo = !cu.invoiceTitle || !cu.taxId;

  const startEdit = () => {
    setDraft(c.periods.length ? c.periods.map((p) => ({ ...p })) : [{ id: uid("p"), n: 1, pct: 50, amount: Math.round(total * 0.5), trigger: "開課" }, { id: uid("p"), n: 2, pct: 50, amount: Math.round(total * 0.5), trigger: "取證" }]);
    setEditing(true);
  };
  const upd = (id: string, patch: Partial<Period>) =>
    setDraft((d) => d.map((p) => (p.id === id ? { ...p, ...patch, ...(patch.pct != null ? { amount: Math.round((total * patch.pct) / 100) } : {}) } : p)));

  return (
    <div className="space-y-5">
      <StatGroup
        items={[
          { label: "合約總額（未稅）", value: money(total), sub: `含稅 ${money(withTax(total))}` },
          { label: "已開票（含稅）", value: money(invoiced), sub: `${rows.filter((r) => r.p.invoiceNo).length}/${rows.length} 期` },
          { label: "已收款（含稅）", value: money(paid), sub: `${rows.filter((r) => r.p.paidDate).length}/${rows.length} 期` },
          { label: "未收（含稅）", value: money(invoiced - paid), sub: rows.some((r) => r.st.overdue > s.settings.overdueDays) ? <span className="text-rose-600">有逾期款項</span> : "—" },
        ]}
      />

      {missingInvoiceInfo && (
        <div className="flex items-center gap-3 rounded-xl border border-ink-200 bg-white px-4 py-3 text-[13px] text-ink-700">
          <CircleAlert className="size-4 shrink-0" />
          <span className="flex-1">發票抬頭、統一編號待補</span>
          {s.perms.customers && (
            <Button size="sm" onClick={() => s.go({ page: "customer", id: cu.id })}>
              前往客戶主檔
            </Button>
          )}
        </div>
      )}

      <Card
        title="分期請款"
        pad={false}
        action={
          canPlan &&
          !editing && (
            <Button size="sm" icon={<Pencil className="size-3.5" />} onClick={startEdit} disabled={!total}>
              {c.periods.length ? "調整分期" : "設定分期"}
            </Button>
          )
        }
      >
        {editing ? (
          <div className="p-5">
            <table className="w-full border-separate border-spacing-0 text-[13px]">
              <thead>
                <tr className="text-left text-[12px] text-ink-500">
                  <th className="pb-2 font-medium">期數</th>
                  <th className="pb-2 font-medium">比例</th>
                  <th className="pb-2 font-medium">金額（未稅）</th>
                  <th className="pb-2 font-medium">開票時機</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody>
                {draft.map((p, i) => (
                  <tr key={p.id}>
                    <td className="py-1.5 font-medium">第 {i + 1} 期</td>
                    <td className="py-1.5">
                      <div className="relative w-24">
                        <input type="number" value={p.pct} onChange={(e) => upd(p.id, { pct: Number(e.target.value) })} className="h-8 w-full rounded-md border border-ink-200 pl-2 pr-6 text-right outline-none focus:border-ink-400 disabled:bg-ink-50" />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-400">%</span>
                      </div>
                    </td>
                    <td className="py-1.5">
                      <input type="number" value={p.amount || ""} onChange={(e) => setDraft((d) => d.map((x) => (x.id === p.id ? { ...x, amount: Number(e.target.value), pct: total ? Math.round((Number(e.target.value) / total) * 100) : x.pct } : x)))} className="h-8 w-32 rounded-md border border-ink-200 px-2 text-right tabular-nums outline-none focus:border-brand-400 disabled:bg-ink-50" />
                    </td>
                    <td className="py-1.5">
                      <div className="flex items-center gap-2">
                        <select value={p.trigger} onChange={(e) => upd(p.id, { trigger: e.target.value as Period["trigger"] })} className="h-8 rounded-md border border-ink-200 px-2 outline-none focus:border-ink-400 disabled:bg-ink-50">
                          <option value="開課">第一堂課開課當月</option>
                          <option value="取證">取證後</option>
                          <option value="自訂">自訂日期</option>
                        </select>
                        {p.trigger === "自訂" && <input type="date" value={p.customDate ?? ""} onChange={(e) => upd(p.id, { customDate: e.target.value })} className="h-8 rounded-md border border-ink-200 px-2 outline-none" />}
                      </div>
                    </td>
                    <td className="py-1.5 text-right">
                      {draft.length > 1 && (
                        <button onClick={() => setDraft((d) => d.filter((x) => x.id !== p.id))} className="rounded p-1.5 text-ink-400 hover:bg-ink-100 hover:text-rose-600" aria-label="刪除">
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 flex items-center justify-between">
              <Button size="sm" variant="ghost" icon={<Plus className="size-3.5" />} onClick={() => setDraft((d) => [...d, { id: uid("p"), n: d.length + 1, pct: 0, amount: 0, trigger: "自訂" }])}>
                新增一期
              </Button>
              <div className="flex items-center gap-3">
                <span className={cn("text-[12.5px] tabular-nums", pctSum === 100 ? "text-ink-500" : "text-amber-700")}>合計 {pctSum}%</span>
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                  取消
                </Button>
                <Button size="sm" variant="dark" onClick={savePlan}>
                  儲存分期
                </Button>
              </div>
            </div>
          </div>
        ) : rows.length === 0 ? (
          <p className="px-5 py-10 text-center text-[13px] text-ink-400">尚未設定分期</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] table-fixed border-separate border-spacing-0">
              <colgroup>
                {[130, 150, 130, 120, 90, 110, 100, 140, 120, 130, 120].map((w, i) => (
                  <col key={i} style={{ width: w }} />
                ))}
              </colgroup>
              <thead>
                <tr>
                  {["期數", "開票時機", "通知開票日", "未稅", "稅金", "含稅", "發票狀態", "發票號碼", "開立日期", "請款狀態", "收款日期"].map((h, i) => (
                    <th key={h} className={cn("h-10 border-b border-r border-ink-200 bg-ink-25 px-3 text-left text-[12px] font-medium text-ink-500 last:border-r-0", i === 0 && "pl-5", [3, 4, 5].includes(i) && "text-right")}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(({ p, st }, r) => {
                  const key = `${c.id}:${p.id}`;
                  const cell = (field: "notifyDate" | "amount" | "invoiceNo" | "invoiceDate" | "paidDate", col: number, extra: Partial<Parameters<typeof GridCell>[0]> = {}) => {
                    const orig = String(p[field] ?? "");
                    return <GridCell pos={[r, col]} value={grid.get(key, field, orig)} dirty={grid.dirty(key, field)} editable={can} type="date" format={fmtDate} onChange={(v) => grid.set(key, field, orig, v)} {...extra} />;
                  };
                  const invoiced = !!grid.get(key, "invoiceNo", p.invoiceNo ?? "");
                  const plain = "h-11 border-b border-r border-ink-100 px-3 text-[13px]";
                  return (
                    <tr key={p.id}>
                      <td className={cn(plain, "whitespace-nowrap pl-5")}>
                        <span className="font-medium">第 {p.n} 期</span>
                        <span className="ml-1.5 text-ink-400">{p.pct}%</span>
                      </td>
                      <td className={cn(plain, "truncate text-ink-600")} title={st.triggered && st.triggeredOn ? `已觸發 ${fmtDate(st.triggeredOn)}` : undefined}>
                        {triggerLabel(p)}
                      </td>
                      {cell("notifyDate", 2)}
                      {cell("amount", 3, { type: "number", align: "right", format: (v) => money(Number(v)) })}
                      <td className={cn(plain, "text-right tabular-nums text-ink-500")}>{money(tax(p.amount))}</td>
                      <td className={cn(plain, "text-right font-medium tabular-nums")}>{money(withTax(p.amount))}</td>
                      <td className={plain}>
                        <InvoicePill v={st.invoice} />
                      </td>
                      {cell("invoiceNo", 7, { type: "text", format: undefined, className: "font-mono text-[12.5px]" })}
                      {cell("invoiceDate", 8, { editable: can && invoiced })}
                      <td className={plain}>
                        <PayPill v={st.pay} overdue={st.overdue} limit={s.settings.overdueDays} />
                      </td>
                      {cell("paidDate", 10, { editable: can && invoiced, className: "border-r-0" })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-5">
        <Card title="開票內容">
          <dl className="space-y-3 text-[13px]">
            <div className="grid grid-cols-[88px_minmax(0,1fr)] items-center gap-2">
              <dt className="text-ink-500">品名</dt>
              <GridCell as="div" value={info.get(c.id, "invoiceItem", c.invoiceItem)} dirty={info.dirty(c.id, "invoiceItem")} editable={can} onChange={(v) => info.set(c.id, "invoiceItem", c.invoiceItem, v)} />
            </div>
            <div className="grid grid-cols-[88px_minmax(0,1fr)] items-center gap-2">
              <dt className="text-ink-500">發票備註</dt>
              <GridCell as="div" value={info.get(c.id, "invoiceNote", c.invoiceNote)} dirty={info.dirty(c.id, "invoiceNote")} editable={can} placeholder="例：ISO 9001 輔導 5 堂" onChange={(v) => info.set(c.id, "invoiceNote", c.invoiceNote, v)} />
            </div>
            <div className="grid grid-cols-[88px_minmax(0,1fr)] items-center gap-2">
              <dt className="text-ink-500">發票抬頭</dt>
              <dd className={cn(!cu.invoiceTitle && "text-ink-500")}>{cu.invoiceTitle || "待補"}</dd>
            </div>
            <div className="grid grid-cols-[88px_minmax(0,1fr)] items-center gap-2">
              <dt className="text-ink-500">統一編號</dt>
              <dd className={cn("tabular-nums", !cu.taxId && "text-ink-500")}>{cu.taxId || "待補"}</dd>
            </div>
          </dl>
        </Card>
        <Card title="案件成本" pad={false}>
          <div className="divide-y divide-ink-100">
            <div className="flex items-center justify-between px-5 py-3 text-[13px]">
              <span className="text-ink-600">差旅費（{travel.length} 筆）</span>
              <span className="font-medium tabular-nums">{money(travel.reduce((n, t) => n + t.amount, 0))}</span>
            </div>
            {s.perms.payables &&
              payables.map((p) => (
                <div key={p.id} className="flex items-center justify-between px-5 py-3 text-[13px]">
                  <span className="text-ink-600">
                    {s.memberOf(p.memberId)?.nickname ?? s.memberOf(p.memberId)?.name}・{p.desc}
                  </span>
                  <span className="flex items-center gap-2">
                    <Badge tone={p.status === "已付款" ? "green" : p.status === "已核准" ? "gray" : "amber"}>{p.status}</Badge>
                    <span className="font-medium tabular-nums">{money(p.amount)}</span>
                  </span>
                </div>
              ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
