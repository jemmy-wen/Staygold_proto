import { useMemo, useState } from "react";
import { BellRing, Building, Calendar, CheckCircle2, HardDrive, ListChecks, Mail, Plus, Users } from "lucide-react";
import { useStore } from "../../lib/store";
import { RECIPIENT_LABEL } from "../../lib/rules";
import type { NotifType, Recipient, Settings } from "../../lib/types";
import { Badge, Button, Field, Input, PageHeader, SearchInput, Table, td, th } from "../../components/ui";
import { useLeaveGuard } from "../../components/grid";
import { cn, itemCode } from "../../lib/utils";
import { MembersPage } from "./Members";

type Tab = "members" | "notify" | "items" | "workspace";

export function SettingsPage({ tab, memberId }: { tab?: Tab; memberId?: string }) {
  const s = useStore();
  const current: Tab = tab ?? (s.perms.members ? "members" : "notify");
  const items: { value: Tab; label: string; icon: React.ReactNode; hidden?: boolean }[] = [
    { value: "members", label: "成員與權限", icon: <Users />, hidden: !s.perms.members },
    { value: "notify", label: "通知規則", icon: <BellRing />, hidden: !s.perms.settings },
    { value: "items", label: "驗證項目選單", icon: <ListChecks />, hidden: !s.perms.settings },
    { value: "workspace", label: "公司與工作空間", icon: <Building />, hidden: !s.perms.settings },
  ];
  return (
    <div>
      <PageHeader title="設定" />
      <div className="flex gap-8 px-8 py-6">
        <nav className="w-52 shrink-0 space-y-0.5">
          {items
            .filter((i) => !i.hidden)
            .map((i) => (
              <button
                key={i.value}
                onClick={() => s.go({ page: "settings", tab: i.value })}
                className={cn(
                  "flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-[13.5px] transition-colors [&>svg]:size-4",
                  current === i.value ? "bg-ink-100 font-medium text-ink-900" : "text-ink-600 hover:bg-ink-50",
                )}
              >
                {i.icon}
                {i.label}
              </button>
            ))}
        </nav>
        <div className="min-w-0 flex-1">
          {current === "members" && <MembersPage initialId={memberId} />}
          {current === "notify" && <NotifySettings />}
          {current === "items" && <ItemsSettings />}
          {current === "workspace" && <WorkspaceSettings />}
        </div>
      </div>
    </div>
  );
}

const NOTIF_SPEC: { type: NotifType; group: string; when: (st: Settings) => string; to: Recipient[]; email: boolean; done: string }[] = [
  { type: "待審核（內容）", group: "案件進度", when: () => "案件轉為「內容審核中」", to: ["partner"], email: true, done: "內容審核通過或退回" },
  { type: "待審核（核價）", group: "案件進度", when: () => "案件轉為「核價審核中」", to: ["exec"], email: true, done: "核價核可或退回" },
  { type: "審核退回", group: "案件進度", when: () => "內容或核價被退回", to: ["owner"], email: true, done: "顧問重新送出審核" },
  { type: "審核核可・待寄送企劃書", group: "案件進度", when: () => "核價核可且尚未登記送出日", to: ["admin", "owner"], email: true, done: "登記企劃書送出日" },
  { type: "待回簽", group: "案件進度", when: (st) => `企劃書送出超過 ${st.signWaitDays} 天未回簽`, to: ["owner", "admin"], email: false, done: "登記客戶已回簽" },
  { type: "堂數不符", group: "案件進度", when: () => "Calendar 已排堂數超過合約堂數", to: ["owner"], email: false, done: "堂數一致" },
  { type: "信件待確認", group: "案件進度", when: () => "有系統建議、尚未確認的信件", to: ["owner"], email: false, done: "確認或忽略所有建議" },
  { type: "發票待開立（第一期）", group: "發票與請款", when: () => "第一堂課開課當月", to: ["finance", "admin"], email: true, done: "登記發票已開立" },
  { type: "發票待開立（取證後各期）", group: "發票與請款", when: () => "案件轉為「已取證」或到達約定日", to: ["finance", "admin"], email: true, done: "登記發票已開立" },
  { type: "收款逾期", group: "發票與請款", when: (st) => `待收款超過 ${st.overdueDays} 天`, to: ["finance", "exec"], email: false, done: "登記已收款" },
  { type: "差旅費填報提醒", group: "差旅費報帳", when: (st) => `每月 ${st.travelRemindDay} 日`, to: ["reporter"], email: false, done: "次月 1 日自動結束" },
  { type: "差旅費未歸戶", group: "差旅費報帳", when: (st) => `標記未歸戶超過 ${st.unassignedDays} 天`, to: ["reporter", "admin"], email: false, done: "指定所屬案件" },
  { type: "續證準備", group: "證書到期與續證", when: (st) => `證書到期前 ${st.renewDays[0]} 天`, to: ["owner", "admin"], email: true, done: "已建立續證案件" },
  { type: "續證再提醒", group: "證書到期與續證", when: (st) => `到期前 ${st.renewDays[1]} 天仍未建立續證案件`, to: ["owner", "admin"], email: true, done: "已建立續證案件" },
  { type: "證書即將到期", group: "證書到期與續證", when: (st) => `到期前 ${st.renewDays[2]} 天仍未建立續證案件`, to: ["owner", "admin", "exec"], email: true, done: "建立續證案件或標記本次不續證" },
];

function NumberField({ label, value, onChange, suffix }: { label: string; value: number; onChange: (n: number) => void; suffix: string }) {
  return (
    <Field label={label}>
      <div className="relative">
        <Input type="number" value={value} min={1} onChange={(e) => onChange(Number(e.target.value))} className="pr-10 tabular-nums" />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-ink-400">{suffix}</span>
      </div>
    </Field>
  );
}

function NotifySettings() {
  const s = useStore();
  const [d, setD] = useState(s.settings);
  const changed = (["renewDays", "signWaitDays", "overdueDays", "unassignedDays", "travelRemindDay"] as const).filter((k) => JSON.stringify(d[k]) !== JSON.stringify(s.settings[k])).length;
  useLeaveGuard(
    changed,
    () => {
      s.updateSettings({ renewDays: d.renewDays, signWaitDays: d.signWaitDays, overdueDays: d.overdueDays, unassignedDays: d.unassignedDays, travelRemindDay: d.travelRemindDay });
      s.log({ module: "系統設定", target: "通知規則", action: "調整提醒天數", after: `續證 ${d.renewDays.join("／")} 天・回簽 ${d.signWaitDays} 天・逾期 ${d.overdueDays} 天` });
      s.toast("已儲存通知規則");
    },
    () => setD(s.settings),
  );
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[16px] font-semibold text-ink-900">通知規則</h2>
      </div>
      <div className="rounded-xl border border-ink-200 bg-white p-5 shadow-card">
        <p className="text-[14px] font-semibold text-ink-900">證書到期提醒</p>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <NumberField label="續證準備" value={d.renewDays[0]} suffix="天前" onChange={(n) => setD({ ...d, renewDays: [n, d.renewDays[1], d.renewDays[2]] })} />
          <NumberField label="續證再提醒" value={d.renewDays[1]} suffix="天前" onChange={(n) => setD({ ...d, renewDays: [d.renewDays[0], n, d.renewDays[2]] })} />
          <NumberField label="證書即將到期（加通知核價主管）" value={d.renewDays[2]} suffix="天前" onChange={(n) => setD({ ...d, renewDays: [d.renewDays[0], d.renewDays[1], n] })} />
        </div>
        <p className="mt-5 text-[14px] font-semibold text-ink-900">其他門檻</p>
        <div className="mt-3 grid grid-cols-4 gap-4">
          <NumberField label="待回簽提醒" value={d.signWaitDays} suffix="天" onChange={(n) => setD({ ...d, signWaitDays: n })} />
          <NumberField label="收款逾期" value={d.overdueDays} suffix="天" onChange={(n) => setD({ ...d, overdueDays: n })} />
          <NumberField label="差旅費未歸戶" value={d.unassignedDays} suffix="天" onChange={(n) => setD({ ...d, unassignedDays: n })} />
          <NumberField label="差旅費填報提醒" value={d.travelRemindDay} suffix="日" onChange={(n) => setD({ ...d, travelRemindDay: n })} />
        </div>
      </div>
      <Table>
        <thead>
          <tr>
            <th className={cn(th, "pl-5")}>通知</th>
            <th className={th}>出現時機</th>
            <th className={th}>通知對象</th>
            <th className={th}>管道</th>
            <th className={th}>消失時機</th>
          </tr>
        </thead>
        <tbody>
          {NOTIF_SPEC.map((n, i) => (
            <tr key={n.type}>
              <td className={cn(td, "pl-5")}>
                <div>
                  {(i === 0 || NOTIF_SPEC[i - 1].group !== n.group) && <p className="text-[11px] font-medium text-ink-400">{n.group}</p>}
                  <p className="font-medium">{n.type}</p>
                </div>
              </td>
              <td className={cn(td, "text-ink-600")}>{n.when(d)}</td>
              <td className={td}>
                <div className="flex gap-1">
                  {n.to.map((r) => (
                    <Badge key={r} tone="outline">
                      {RECIPIENT_LABEL[r]}
                    </Badge>
                  ))}
                </div>
              </td>
              <td className={td}>{n.email ? <Badge tone="brand">系統＋Email</Badge> : <Badge>系統</Badge>}</td>
              <td className={cn(td, "text-ink-600")}>{n.done}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

function ItemsSettings() {
  const s = useStore();
  const [q, setQ] = useState("");
  const [draft, setDraft] = useState("");
  const usage = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of s.cases) m.set(c.item, (m.get(c.item) ?? 0) + 1);
    return m;
  }, [s.cases]);
  const list = s.settings.items.filter((i) => i.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[16px] font-semibold text-ink-900">驗證項目選單</h2>
      </div>
      <div className="flex items-end gap-2">
        <SearchInput value={q} onChange={setQ} placeholder="搜尋驗證項目" className="w-72" />
        <div className="flex-1" />
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="新增驗證項目，例：ISO 50001" className="w-72" />
        <Button
          variant="dark"
          icon={<Plus className="size-4" />}
          disabled={!draft.trim() || s.settings.items.includes(draft.trim())}
          onClick={() => {
            s.updateSettings({ items: [...s.settings.items, draft.trim()] });
            s.log({ module: "系統設定", target: "驗證項目選單", action: "新增選項", after: draft.trim() });
            s.toast(`已新增「${draft.trim()}」`);
            setDraft("");
          }}
        >
          新增
        </Button>
      </div>
      <Table>
        <thead>
          <tr>
            <th className={cn(th, "w-14 pl-5")}>#</th>
            <th className={th}>驗證項目</th>
            <th className={th}>案件編號代碼</th>
            <th className={cn(th, "text-right")}>使用中案件</th>
          </tr>
        </thead>
        <tbody>
          {list.map((i) => (
            <tr key={i}>
              <td className={cn(td, "pl-5 text-ink-400")}>{s.settings.items.indexOf(i) + 1}</td>
              <td className={cn(td, "font-medium")}>{i}</td>
              <td className={td}>
                <code className="rounded bg-ink-50 px-1.5 py-0.5 font-mono text-[12px] text-ink-600">{itemCode(i)}</code>
              </td>
              <td className={cn(td, "text-right tabular-nums text-ink-600")}>{usage.get(i) ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

function WorkspaceSettings() {
  const s = useStore();
  const owner = s.members.find((m) => m.isOwner);
  const [name, setName] = useState(s.settings.workspaceName);
  useLeaveGuard(
    name.trim() && name !== s.settings.workspaceName ? 1 : 0,
    () => {
      s.updateSettings({ workspaceName: name.trim() });
      s.log({ module: "系統設定", target: "工作空間", action: "修改工作空間名稱", before: s.settings.workspaceName, after: name.trim() });
      s.toast("已儲存變更");
    },
    () => setName(s.settings.workspaceName),
  );
  const svc = [
    { icon: <Mail />, name: "Gmail", scope: "讀取信件中繼資料、主旨與內文，用於比對候選案件" },
    { icon: <HardDrive />, name: "Google Drive", scope: "讀取已綁定資料夾的檔案清單" },
    { icon: <Calendar />, name: "Google Calendar", scope: "讀取排課、稽核、拜訪事件" },
  ];
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[16px] font-semibold text-ink-900">工作空間與串接</h2>
      </div>
      <div className="grid grid-cols-2 gap-4 rounded-xl border border-ink-200 bg-white p-5 shadow-card">
        <Field label="工作空間名稱">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="擁有者">
          <Input value={`${owner?.name}（${owner?.email}）`} disabled />
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {svc.map((x) => (
          <div key={x.name} className="rounded-xl border border-ink-200 bg-white p-5 shadow-card">
            <div className="flex items-center justify-between">
              <span className="text-ink-500 [&>svg]:size-5 [&>svg]:stroke-[1.75]">{x.icon}</span>
              <Badge tone="green">
                <CheckCircle2 className="size-3" />
                已串接・唯讀
              </Badge>
            </div>
            <p className="mt-3 text-[14px] font-semibold text-ink-900">{x.name}</p>
            <p className="mt-1 text-[12.5px] text-ink-600">{x.scope}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
