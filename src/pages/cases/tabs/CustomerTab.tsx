import { Building2, Factory, FolderOpen, Lock } from "lucide-react";
import { useStore } from "../../../lib/store";
import type { Case } from "../../../lib/types";
import { cn, fmtDate } from "../../../lib/utils";
import { Avatar, Badge, Button, Card, KV, StatusPill, td, th } from "../../../components/ui";
import { RelationGraph } from "../../../components/RelationGraph";

// PRD 1.6 案件詳情「客戶」分頁：客戶主檔、歷屆案件、客戶關係
export function CustomerTab({ c }: { c: Case }) {
  const s = useStore();
  const cu = s.customerOf(c);
  const contact = s.perms.customerContact;
  const history = s.cases.filter((x) => x.customerId === cu.id).sort((a, b) => b.year.localeCompare(a.year) || a.id.localeCompare(b.id));
  const hidden = (
    <span className="flex items-center gap-1 text-ink-300">
      <Lock className="size-3" />
      未開放
    </span>
  );

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-5">
      <div className="min-w-0 space-y-5">
        <Card
          title="客戶主檔"
          action={
            s.perms.customers && (
              <Button size="sm" onClick={() => s.go({ page: "customer", id: cu.id })}>
                開啟客戶資料
              </Button>
            )
          }
        >
          <dl className="grid grid-cols-3 gap-x-6 gap-y-4">
            <KV label="客戶簡稱">{cu.short}</KV>
            <KV label="統一編號">{contact ? cu.taxId || "待補" : hidden}</KV>
            <KV label="公司名稱" className="col-span-2">
              {cu.name}
            </KV>
            <KV label="產業別／地區">
              {cu.industry || "—"}・{cu.region || "—"}
            </KV>
            <KV label="聯絡人">{contact ? `${cu.contact.name} ${cu.contact.title ?? ""}` : hidden}</KV>
            <KV label="電話">{contact ? cu.contact.phone : hidden}</KV>
            <KV label="Email">{contact ? cu.contact.email : hidden}</KV>
            <KV label="地址" className="col-span-3">
              {contact ? cu.address || "—" : hidden}
            </KV>
          </dl>
        </Card>

        <Card title="發票資訊">
          <dl className="grid grid-cols-3 gap-x-6 gap-y-4">
            <KV label="發票抬頭" className="col-span-2">
              {contact ? cu.invoiceTitle || <span className="text-ink-500">待補</span> : hidden}
            </KV>
            <KV label="統一編號">{contact ? cu.taxId || <span className="text-ink-500">待補</span> : hidden}</KV>
            <KV label="寄送地址" className="col-span-3">
              {contact ? cu.invoiceAddress || <span className="text-ink-500">待補</span> : hidden}
            </KV>
          </dl>
        </Card>

        <Card title="客戶關係">
          <RelationGraph customerId={cu.id} compact />
        </Card>

        <Card title={`歷屆案件・${history.length} 件`} pad={false}>
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr>
                <th className={cn(th, "pl-5")}>案件編號</th>
                <th className={th}>驗證項目</th>
                <th className={th}>狀態</th>
                <th className={th}>負責人</th>
                <th className={th}>Drive 資料夾</th>
                <th className={th}>證書到期</th>
              </tr>
            </thead>
            <tbody>
              {history.map((x) => {
                const visible = s.visibleCases.some((v) => v.id === x.id);
                return (
                  <tr
                    key={x.id}
                    onClick={() => visible && x.id !== c.id && s.go({ page: "case", id: x.id })}
                    className={cn(x.id === c.id ? "bg-brand-50/40" : visible && "cursor-pointer hover:bg-ink-25")}
                  >
                    <td className={cn(td, "pl-5 font-mono text-[12px]")}>
                      {x.id}
                      {x.id === c.id && <span className="ml-2 font-sans text-[11.5px] text-brand-700">本案</span>}
                    </td>
                    <td className={td}>{x.item}</td>
                    <td className={td}>
                      <StatusPill status={s.statusOf(x)} />
                    </td>
                    <td className={td}>
                      <span className="flex items-center gap-2">
                        <Avatar m={s.memberOf(x.owner)} size={22} />
                        {s.memberOf(x.owner)?.name}
                      </span>
                    </td>
                    <td className={cn(td, "font-mono text-[11.5px] text-ink-500")}>
                      {x.folder ? (
                        <span className="flex items-center gap-1.5">
                          <FolderOpen className="size-3.5 text-ink-400" />
                          {x.folder.name}
                        </span>
                      ) : (
                        <span className="font-sans">未綁定</span>
                      )}
                    </td>
                    <td className={cn(td, "tabular-nums text-ink-600")}>{fmtDate(x.milestones.certExpiry)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </div>

      <div className="space-y-5">
        <Card title="集團與廠區">
          <div className="text-[13px]">
            <p className="flex items-center gap-2 font-medium text-ink-900">
              <Building2 className="size-4 text-ink-500" />
              {cu.name}
            </p>
            {cu.sites.length > 0 ? (
              <div className="ml-2 mt-2 space-y-1.5 border-l border-ink-200 pl-4">
                {cu.sites.map((site) => (
                  <p key={site} className={cn("flex items-center gap-2", site === c.site ? "font-medium text-ink-900" : "text-ink-600")}>
                    <Factory className="size-3.5 text-ink-400" />
                    {site}
                    {site === c.site && <Badge tone="brand">本案</Badge>}
                  </p>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-[12px] text-ink-400">非集團客戶</p>
            )}
          </div>
          <div className="mt-5 border-t border-ink-100 pt-4">
            <p className="text-[12px] text-ink-500">介紹來源</p>
            <p className="mt-1.5 flex items-center gap-2 text-[13.5px] text-ink-900">
              <Badge tone="outline">{cu.referral.type}</Badge>
              {cu.referral.source || "—"}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
