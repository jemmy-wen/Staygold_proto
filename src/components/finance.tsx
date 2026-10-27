import { useEffect, useState } from "react";
import { useStore, type Store } from "../lib/store";
import type { Change } from "./grid";
import type { Case, Period } from "../lib/types";
import { TODAY, money, tax, withTax, type InvoiceStatus, type PayStatus } from "../lib/utils";
import { Badge, Button, Field, Input, Modal, Segmented } from "./ui";

export function InvoicePill({ v }: { v: InvoiceStatus }) {
  return <Badge tone={v === "待開立" ? "amber" : v === "已開立" ? "outline" : "gray"}>{v}</Badge>;
}
export function PayPill({ v, overdue = 0, limit = 30 }: { v: PayStatus; overdue?: number; limit?: number }) {
  if (v === "—") return <span className="text-ink-300">—</span>;
  if (v === "已收款") return <Badge tone="green">已收款</Badge>;
  return <Badge tone={overdue > limit ? "red" : "blue"}>{overdue > limit ? `逾期 ${overdue} 天` : "待收款"}</Badge>;
}

export const PERIOD_FIELDS: Record<string, string> = { notifyDate: "通知開票日", amount: "金額（未稅）", invoiceNo: "發票號碼", invoiceDate: "開立日期", paidDate: "收款日期" };

// 分期欄位的暫存變更寫回案件；列鍵為「案件編號:期別 id」。填了發票號碼而未填開立日期時，以儲存當日帶入
export function savePeriodChanges(s: Store, changes: Change[]) {
  const byRow = new Map<string, Change[]>();
  changes.forEach((ch) => byRow.set(ch.row, [...(byRow.get(ch.row) ?? []), ch]));
  byRow.forEach((list, key) => {
    const [caseId, periodId] = key.split(":");
    s.updateCase(caseId, (x) => ({
      ...x,
      periods: x.periods.map((y) => {
        if (y.id !== periodId) return y;
        const n: Period = { ...y };
        list.forEach((ch) => {
          if (ch.field === "amount") n.amount = Number(ch.value) || 0;
          else (n as Record<string, unknown>)[ch.field] = ch.value || undefined;
        });
        if (!n.invoiceNo) n.invoiceDate = undefined;
        else if (!n.invoiceDate) n.invoiceDate = TODAY;
        return n;
      }),
    }));
    const p = s.cases.find((c) => c.id === caseId)?.periods.find((y) => y.id === periodId);
    list.forEach((ch) => s.log({ module: "財務", caseId, target: `第 ${p?.n} 期`, action: `修改${PERIOD_FIELDS[ch.field]}`, before: ch.original || "—", after: ch.value || "清除" }));
  });
  s.toast(`已儲存 ${changes.length} 項變更`);
}

export function InvoiceModal({ c, p, onClose }: { c: Case; p: Period | null; onClose: () => void }) {
  const s = useStore();
  const cu = s.customerOf(c);
  const [no, setNo] = useState("");
  const [date, setDate] = useState(TODAY);
  const [kind, setKind] = useState<"電子發票" | "紙本">("電子發票");
  const [title, setTitle] = useState(cu.invoiceTitle);
  const [taxId, setTaxId] = useState(cu.taxId);
  const [addr, setAddr] = useState(cu.invoiceAddress);
  useEffect(() => {
    setNo("");
    setTitle(cu.invoiceTitle);
    setTaxId(cu.taxId);
    setAddr(cu.invoiceAddress);
  }, [p?.id, cu]);
  if (!p) return null;
  const missing = !cu.invoiceTitle || !cu.taxId || !cu.invoiceAddress;
  return (
    <Modal
      open
      onClose={onClose}
      title={`登記第 ${p.n} 期發票已開立`}
      desc={`${c.id}・${p.pct}%・未稅 ${money(p.amount)}／含稅 ${money(withTax(p.amount))}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button
            variant="dark"
            disabled={!no.trim() || !title || !taxId}
            onClick={() => {
              if (missing) {
                s.updateCustomer(cu.id, (x) => ({ ...x, invoiceTitle: title, taxId, invoiceAddress: addr }));
                s.log({ module: "客戶", target: cu.short, action: "補齊發票資訊", after: `${title}／${taxId}` });
              }
              s.updateCase(c.id, (x) => ({ ...x, periods: x.periods.map((y) => (y.id === p.id ? { ...y, invoiceNo: no.trim(), invoiceDate: date, invoiceKind: kind } : y)) }));
              s.log({ module: "財務", caseId: c.id, target: `第 ${p.n} 期發票`, action: "登記發票已開立", after: no.trim() });
              s.toast(`第 ${p.n} 期已登記開立`);
              onClose();
            }}
          >
            登記已開立
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-ink-200 bg-ink-25 p-4">
          <p className="text-[12.5px] font-semibold text-ink-800">{missing ? "發票資訊待補" : "發票資訊"}</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field label="發票抬頭">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} disabled={!missing} />
            </Field>
            <Field label="統一編號">
              <Input value={taxId} onChange={(e) => setTaxId(e.target.value)} disabled={!missing} />
            </Field>
            <Field label="寄送地址" className="col-span-2">
              <Input value={addr} onChange={(e) => setAddr(e.target.value)} disabled={!missing} />
            </Field>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="發票號碼" required>
            <Input value={no} onChange={(e) => setNo(e.target.value.toUpperCase())} placeholder="例：QA-28104435" autoFocus />
          </Field>
          <Field label="開立日期">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>
        <Field label="發票類型">
          <Segmented
            value={kind}
            onChange={setKind}
            items={[
              { value: "電子發票", label: "電子發票（寄 mail）" },
              { value: "紙本", label: "紙本" },
            ]}
          />
        </Field>
        <div className="grid grid-cols-3 gap-3 rounded-lg bg-ink-50 px-4 py-3 text-[12.5px]">
          <div>
            <p className="text-ink-500">未稅</p>
            <p className="font-medium tabular-nums">{money(p.amount)}</p>
          </div>
          <div>
            <p className="text-ink-500">稅金 5%</p>
            <p className="font-medium tabular-nums">{money(tax(p.amount))}</p>
          </div>
          <div>
            <p className="text-ink-500">含稅</p>
            <p className="font-semibold tabular-nums">{money(withTax(p.amount))}</p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
