import { useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, Building2, ChevronRight, CopyPlus, Factory, FolderOpen, IdCard, Lock, MapPin, Network, Plus } from "lucide-react";
import { useStore } from "../lib/store";
import { INDUSTRIES, REGIONS } from "../lib/seed";
import type { Customer } from "../lib/types";
import { CUSTOMER_FIELD_LABEL, REFERRALS, readCustomerField, writeCustomerField } from "../lib/customerFields";
import { cn, daysUntil, fmtDate, folderL1 } from "../lib/utils";
import { Avatar, Badge, Button, Card, Input, StatusPill, Tabs, ease, td, th } from "../components/ui";
import { GridCell, useGridDraft, type Change } from "../components/grid";
import { NewCaseModal } from "./cases/NewCaseModal";
import { RelationGraph } from "../components/RelationGraph";

type Tab = "cases" | "info" | "relations" | "sites";

// 客戶詳情：歷屆案件為預設分頁；客戶資料在「客戶資料」分頁編輯，右上角統一儲存
export function CustomerDetail({ id, tab: initial }: { id: string; tab?: string }) {
  const s = useStore();
  const c = s.customers.find((x) => x.id === id);
  const [tab, setTab] = useState<Tab>((initial as Tab) ?? "cases");
  const [creating, setCreating] = useState(false);
  const [newSite, setNewSite] = useState("");
  const grid = useGridDraft((changes: Change[]) => {
    s.updateCustomer(id, (x) => changes.reduce((acc, ch) => writeCustomerField(acc, ch.field, ch.value), x));
    changes.forEach((ch) => s.log({ module: "客戶", target: c?.short ?? id, action: `修改${CUSTOMER_FIELD_LABEL[ch.field]}`, before: ch.original || "—", after: ch.value || "—" }));
    s.toast(`已儲存 ${changes.length} 項變更`);
  });
  if (!c) return null;
  const can = s.perms.customersEdit;
  const contact = s.perms.customerContact;
  const cases = s.cases.filter((x) => x.customerId === c.id).sort((a, b) => b.year.localeCompare(a.year) || a.id.localeCompare(b.id));
  const upd = (label: string, patch: Partial<Customer>, v: string) => {
    s.updateCustomer(c.id, (x) => ({ ...x, ...patch }));
    s.log({ module: "客戶", target: c.short, action: `修改${label}`, after: v });
  };
  const row = (label: string, field: string, opts: { hidden?: boolean; type?: "select"; options?: string[]; placeholder?: string } = {}) => {
    const orig = readCustomerField(c, field);
    return (
      <div className="grid grid-cols-[110px_minmax(0,1fr)] items-center gap-2 border-b border-ink-100 py-1.5 text-[13px] last:border-b-0">
        <dt className="text-ink-500">{label}</dt>
        <dd className="min-w-0 pl-2">
          {opts.hidden ? (
            <span className="flex h-8 items-center gap-1 text-ink-300">
              <Lock className="size-3" />
              未開放
            </span>
          ) : (
            <GridCell as="div" value={grid.get(c.id, field, orig)} dirty={grid.dirty(c.id, field)} editable={can} type={opts.type} options={opts.options} placeholder={opts.placeholder ?? "—"} onChange={(v) => grid.set(c.id, field, orig, v)} />
          )}
        </dd>
      </div>
    );
  };

  const relCount = s.relations.filter((r) => r.from === c.id || r.to === c.id).length;
  const activeCases = cases.filter((x) => !["已取證", "續證期"].includes(s.statusOf(x))).length;
  const nextExpiry = cases.map((x) => x.milestones.certExpiry).filter((d): d is string => !!d && daysUntil(d) >= 0).sort()[0];

  return (
    <div>
      <div className="border-b border-ink-200 bg-white px-8 pt-6">
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="min-w-0">
              <h1 className="text-[22px] font-semibold tracking-tight text-ink-900">{c.short}</h1>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-[13px] text-ink-500">
                <span>{c.name || "未填公司名稱"}</span>
                {c.industry && <Badge tone="gray">{c.industry}</Badge>}
                {c.region && (
                  <Badge tone="gray">
                    <MapPin className="size-3" />
                    {c.region}
                  </Badge>
                )}
                <Badge tone="brand">{c.referral.type}</Badge>
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {s.perms.casesCreate && cases.length > 0 && (
              <Button variant="outline" icon={<CopyPlus className="size-4" />} onClick={() => setCreating(true)}>
                複製舊案件建立新案
              </Button>
            )}
            {s.perms.casesCreate && (
              <Button variant="dark" icon={<Plus className="size-4" />} onClick={() => setCreating(true)}>
                為此客戶新增案件
              </Button>
            )}
          </div>
        </div>
        <div className="mt-5 grid max-w-2xl grid-cols-3 gap-3">
          {[
            ["歷屆案件", `${cases.length} 件`],
            ["進行中", `${activeCases} 件`],
            ["最近證書到期", nextExpiry ? fmtDate(nextExpiry) : "—"],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl border border-ink-200 bg-ink-25 px-4 py-2.5">
              <p className="text-[12px] text-ink-500">{k}</p>
              <p className="mt-0.5 text-[16px] font-semibold tabular-nums text-ink-900">{v}</p>
            </div>
          ))}
        </div>
        <Tabs
          className="mt-4 border-b-0"
          value={tab}
          onChange={setTab}
          items={[
            { value: "cases", label: <><Briefcase />歷屆案件</>, count: cases.length },
            { value: "info", label: <><IdCard />客戶資料</> },
            { value: "relations", label: <><Network />客戶關係</>, count: relCount },
            { value: "sites", label: <><Factory />集團與廠區</> },
          ]}
        />
      </div>

      <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease }} className="px-8 py-6">
        {tab === "cases" && (
          <div className="overflow-hidden rounded-xl border border-ink-200 bg-white shadow-card">
            <table className="w-full border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className={th}>案件編號</th>
                  <th className={th}>驗證項目</th>
                  <th className={th}>類別</th>
                  <th className={th}>狀態</th>
                  <th className={th}>負責人</th>
                  <th className={th}>歷任顧問</th>
                  <th className={th}>Drive 資料夾</th>
                  <th className={th}>證書到期</th>
                  <th className={cn(th, "w-10")} />
                </tr>
              </thead>
              <tbody>
                {cases.map((x) => {
                  const visible = s.visibleCases.some((v) => v.id === x.id);
                  const past = [...new Set(x.ownerLog.map((o) => o.from).filter((f) => f !== "—"))];
                  return (
                    <tr key={x.id} onClick={() => (visible ? s.go({ page: "case", id: x.id }) : s.toast("此案件不在你的檢視範圍內", "info"))} className="group cursor-pointer transition-colors hover:bg-brand-50/40">
                      <td className={cn(td, "font-mono text-[12px]")}>
                        {x.id}
                        {x.previousCase && <span className="block font-sans text-[11px] text-ink-400">續 {x.previousCase}</span>}
                      </td>
                      <td className={cn(td, "font-medium")}>{x.item}</td>
                      <td className={cn(td, "text-ink-600")}>{x.category}</td>
                      <td className={td}>
                        <StatusPill status={s.statusOf(x)} />
                      </td>
                      <td className={td}>
                        <span className="flex items-center gap-2">
                          <Avatar m={s.memberOf(x.owner)} size={24} />
                          {s.memberOf(x.owner)?.nickname ?? s.memberOf(x.owner)?.name}
                        </span>
                      </td>
                      <td className={cn(td, "text-ink-500")}>{past.length ? past.map((p) => s.memberOf(p)?.nickname ?? s.memberOf(p)?.name).join("、") : "—"}</td>
                      <td className={cn(td, "font-mono text-[11.5px] text-ink-500")}>
                        {x.folder ? (
                          <span className="flex items-center gap-1.5">
                            <FolderOpen className="size-3.5 text-ink-400" />
                            {x.folder.name}
                          </span>
                        ) : (
                          <span className="font-sans text-ink-400">未綁定</span>
                        )}
                      </td>
                      <td className={cn(td, "tabular-nums text-ink-600")}>{fmtDate(x.milestones.certExpiry)}</td>
                      <td className={td}>{visible ? <ChevronRight className="size-4 text-ink-300 group-hover:text-brand-600" /> : <Lock className="size-3.5 text-ink-300" />}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {cases.length === 0 && <p className="px-5 py-10 text-center text-[13px] text-ink-400">這個客戶還沒有案件</p>}
          </div>
        )}

        {tab === "info" && (
          <div className="grid grid-cols-2 items-start gap-5">
            <Card title="基本資料">
              <dl>
                {row("客戶簡稱", "short")}
                {row("公司名稱", "name")}
                {row("英文代碼", "enCode")}
                {row("拼音標頭", "pinyin")}
                {row("產業別", "industry", { type: "select", options: INDUSTRIES })}
                {row("地區", "region", { type: "select", options: REGIONS })}
                {row("公司地址", "address", { hidden: !contact })}
                {row("Email 網域", "domain")}
                {row("介紹來源", "referralType", { type: "select", options: REFERRALS })}
                {row("介紹人", "referralSource")}
                <div className="grid grid-cols-[110px_minmax(0,1fr)] items-center gap-2 py-1.5 text-[13px]">
                  <dt className="text-ink-500">Drive 第 1 層</dt>
                  <dd className="pl-2 font-mono text-[12.5px] text-ink-700">{folderL1(c)}</dd>
                </div>
              </dl>
            </Card>
            <div className="space-y-5">
              <Card title="聯絡人">
                <dl>
                  {row("姓名", "contactName", { hidden: !contact })}
                  {row("職稱", "contactTitle", { hidden: !contact })}
                  {row("電話", "phone", { hidden: !contact })}
                  {row("Email", "email", { hidden: !contact })}
                </dl>
              </Card>
              <Card title="發票資訊">
                <dl>
                  {row("發票抬頭", "invoiceTitle", { hidden: !contact, placeholder: "待補" })}
                  {row("統一編號", "taxId", { hidden: !contact, placeholder: "待補" })}
                  {row("寄送地址", "invoiceAddress", { hidden: !contact, placeholder: "待補" })}
                </dl>
              </Card>
            </div>
          </div>
        )}

        {tab === "relations" && (
          <Card>
            <RelationGraph customerId={c.id} />
          </Card>
        )}

        {tab === "sites" && (
          <Card className="max-w-2xl">
            <div className="text-[13px]">
              <div className="flex items-center gap-2 font-semibold text-ink-900">
                <Building2 className="size-4 text-brand-600" />
                {c.name || c.short}
              </div>
              <div className="ml-2 mt-3 space-y-3 border-l border-ink-200 pl-5">
                {c.sites.map((site) => (
                  <div key={site}>
                    <p className="flex items-center gap-2 font-medium text-ink-800">
                      <Factory className="size-3.5 text-ink-400" />
                      {site}
                    </p>
                    <div className="ml-1.5 mt-1.5 space-y-1 border-l border-dashed border-ink-200 pl-4">
                      {cases.filter((x) => x.site === site).map((x) => (
                        <p key={x.id} className="flex items-center gap-2 text-[12px]">
                          <span className="font-mono text-ink-600">{x.id}</span>
                          <StatusPill status={s.statusOf(x)} />
                        </p>
                      ))}
                      {!cases.some((x) => x.site === site) && <p className="text-[12px] text-ink-300">尚無案件</p>}
                    </div>
                  </div>
                ))}
                {cases.filter((x) => !x.site).map((x) => (
                  <p key={x.id} className="flex items-center gap-2 text-[12px]">
                    <span className="font-mono text-ink-600">{x.id}</span>
                    <StatusPill status={s.statusOf(x)} />
                  </p>
                ))}
                {can && (
                  <div className="flex max-w-sm items-center gap-1.5 pt-1">
                    <Input value={newSite} onChange={(e) => setNewSite(e.target.value)} placeholder="新增廠區，例：觀音廠" className="h-8 text-[12.5px]" />
                    <Button
                      size="sm"
                      disabled={!newSite.trim()}
                      onClick={() => {
                        upd("廠區", { sites: [...c.sites, newSite.trim()] }, newSite.trim());
                        setNewSite("");
                      }}
                    >
                      新增
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}
      </motion.div>
      <NewCaseModal open={creating} onClose={() => setCreating(false)} preset={{ customerId: c.id }} />
    </div>
  );
}
