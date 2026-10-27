import { useState } from "react";
import { ArrowUpRight, Building2, CalendarDays, Check, Copy, CopyPlus, Ellipsis, FolderOpen, History, LayoutDashboard, Link2, Mail, UserRoundCog, Wallet } from "lucide-react";
import { useStore } from "../../lib/store";
import { createRenewal } from "../../lib/caseOps";
import { STATUSES, STATUS_PHASE, cn, nowStamp } from "../../lib/utils";
import { motion } from "framer-motion";
import { Avatar, Badge, Button, Empty, MenuItem, Modal, Popover, Select, StatusPill, Tabs } from "../../components/ui";
import { Overview } from "./tabs/Overview";
import { ProgressPanel } from "./ProgressPanel";
import { EmailTab } from "./tabs/EmailTab";
import { DocsTab } from "./tabs/DocsTab";
import { ScheduleTab } from "./tabs/ScheduleTab";
import { FinanceTab } from "./tabs/FinanceTab";
import { HistoryTab } from "./tabs/HistoryTab";
import { CustomerTab } from "./tabs/CustomerTab";

type Tab = "overview" | "email" | "docs" | "schedule" | "finance" | "customer" | "history";

export function CaseDetail({ id, tab: initial }: { id: string; tab?: string }) {
  const s = useStore();
  const c = s.cases.find((x) => x.id === id);
  const [tab, setTab] = useState<Tab>((initial as Tab) ?? "overview");
  const [copied, setCopied] = useState(false);
  const [reassign, setReassign] = useState(false);
  if (!c || !s.visibleCases.some((x) => x.id === id)) return <Empty title="找不到這個案件，或不在你的檢視範圍內" />;
  const cu = s.customerOf(c);
  const st = s.statusOf(c);
  const owner = s.memberOf(c.owner);
  const renewal = s.cases.find((x) => x.previousCase === c.id);
  const pendingMail = s.threads.filter((t) => t.state === "suggested" && t.suggestedCaseIds?.includes(c.id)).length;
  const sessionsLinked = s.events.filter((e) => e.caseId === c.id && e.kind === "排課").length;
  // 從通知或連結指定到沒有權限的分頁時，改顯示概覽，不留空白頁
  const hidden: Partial<Record<Tab, boolean>> = { email: !s.perms.caseEmail, docs: !s.perms.caseDocs, schedule: !s.perms.caseSchedule, finance: !s.perms.financeAmounts, history: !s.perms.audit };
  const current: Tab = hidden[tab] ? "overview" : tab;

  return (
    <div>
      <div className="px-8 pt-6">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[22px] font-semibold tracking-tight text-ink-900">
                {cu.short}
                {c.site && <span className="text-ink-500"> ・{c.site}</span>}
                <span className="font-normal text-ink-400"> ／ </span>
                {c.item}
              </h1>
              <StatusPill status={st} />
              {c.category !== "新案" && <Badge tone="outline">{c.category}</Badge>}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-[12.5px] text-ink-500">
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(c.id).catch(() => undefined);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1200);
                }}
                className="flex items-center gap-1.5 rounded-md bg-ink-50 px-2 py-0.5 font-mono text-[12px] text-ink-700 hover:bg-ink-100"
                title="複製案件編號"
              >
                {c.id}
                {copied ? <Check className="size-3 text-brand-600" /> : <Copy className="size-3 text-ink-400" />}
              </button>
              <span>稽核年度 {c.year}</span>
              <span>驗證單位 {c.verifier || "尚未確定"}</span>
              {c.previousCase && (
                <button onClick={() => s.go({ page: "case", id: c.previousCase! })} className="flex items-center gap-1 text-brand-600 hover:underline">
                  <Link2 className="size-3.5" />
                  前案 {c.previousCase}
                </button>
              )}
              {renewal && (
                <button onClick={() => s.go({ page: "case", id: renewal.id })} className="flex items-center gap-1 text-brand-600 hover:underline">
                  <Link2 className="size-3.5" />
                  續證案件 {renewal.id}
                </button>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div className="mr-1 flex items-center gap-2 rounded-lg border border-ink-200 bg-white py-1 pl-1 pr-3 shadow-card">
              <Avatar m={owner} size={26} />
              <div className="leading-tight">
                <p className="text-[11px] text-ink-400">負責人</p>
                <p className="text-[12.5px] font-medium text-ink-900">{owner?.nickname ?? owner?.name}</p>
              </div>
            </div>
            {c.folder && s.perms.caseDocs && (
              <a href={c.folder.url} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3.5 text-[13px] font-medium text-ink-800 shadow-card hover:bg-ink-25">
                <FolderOpen className="size-4" />
                Drive 資料夾
                <ArrowUpRight className="size-3.5 text-ink-400" />
              </a>
            )}
            <Popover
              align="right"
              width={220}
              trigger={({ toggle }) => (
                <button onClick={toggle} className="grid size-9 place-items-center rounded-lg border border-ink-200 bg-white text-ink-600 shadow-card hover:bg-ink-25" aria-label="更多">
                  <Ellipsis className="size-4" />
                </button>
              )}
            >
              {(close) => (
                <>
                  {s.perms.casesEdit && (
                    <MenuItem icon={<UserRoundCog />} onClick={() => (setReassign(true), close())}>
                      變更負責人
                    </MenuItem>
                  )}
                  {s.perms.casesCreate && !renewal && (
                    <MenuItem
                      icon={<CopyPlus />}
                      onClick={() => {
                        const n = createRenewal(s, c);
                        s.toast(`已建立續證案件 ${n.id}`);
                        s.go({ page: "case", id: n.id });
                      }}
                    >
                      複製為續證案件
                    </MenuItem>
                  )}
                  {s.perms.audit && (
                    <MenuItem icon={<History />} onClick={() => (s.guarded(() => setTab("history")), close())}>
                      檢視異動紀錄
                    </MenuItem>
                  )}
                </>
              )}
            </Popover>
          </div>
        </div>

        <div className="mt-6">
          <ProgressPanel
            c={c}
            goReview={() => {
              s.guarded(() => setTab("overview"));
              setTimeout(() => document.getElementById("review-card")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
            }}
          />
        </div>
      </div>

      <Tabs
        className="mt-5 px-8"
        value={current}
        onChange={(v) => s.guarded(() => setTab(v))}
        items={[
          { value: "overview", label: <><LayoutDashboard />概覽</> },
          { value: "email", label: <><Mail />Email</>, count: pendingMail, hidden: !s.perms.caseEmail },
          { value: "docs", label: <><FolderOpen />文件</>, hidden: !s.perms.caseDocs },
          { value: "schedule", label: <><CalendarDays />排課 {sessionsLinked}/{c.contractSessions || "—"}</>, hidden: !s.perms.caseSchedule },
          { value: "finance", label: <><Wallet />財務</>, hidden: !s.perms.financeAmounts },
          { value: "customer", label: <><Building2 />客戶</> },
          { value: "history", label: <><History />異動紀錄</>, hidden: !s.perms.audit },
        ]}
      />
      <motion.div key={current} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} className="px-8 py-6">
        {current === "overview" && <Overview c={c} />}
        {current === "email" && <EmailTab c={c} />}
        {current === "docs" && <DocsTab c={c} />}
        {current === "schedule" && <ScheduleTab c={c} />}
        {current === "finance" && <FinanceTab c={c} />}
        {current === "customer" && <CustomerTab c={c} />}
        {current === "history" && <HistoryTab c={c} />}
      </motion.div>
      <ReassignModal open={reassign} onClose={() => setReassign(false)} caseId={c.id} />
    </div>
  );
}

function ReassignModal({ open, onClose, caseId }: { open: boolean; onClose: () => void; caseId: string }) {
  const s = useStore();
  const c = s.cases.find((x) => x.id === caseId)!;
  const [to, setTo] = useState("");
  const options = s.members.filter((m) => m.status === "active" && m.id !== c.owner);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="變更負責人"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button
            variant="dark"
            disabled={!to}
            onClick={() => {
              s.updateCase(caseId, (x) => ({ ...x, owner: to, ownerLog: [...x.ownerLog, { time: nowStamp(), from: x.owner, to, by: s.me.id }] }));
              s.log({ module: "案件", caseId, target: "負責人", action: "變更負責人", before: s.memberOf(c.owner)?.name, after: s.memberOf(to)?.name });
              s.toast("已變更負責人");
              onClose();
              if (s.perms.casesScope !== "all" && to !== s.me.id && !c.coOwners.includes(s.me.id)) s.go({ page: "cases" });
            }}
          >
            確認變更
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Select value={to} onChange={setTo} placeholder="選擇新的負責人" options={options.map((m) => ({ value: m.id, label: `${m.nickname ?? m.name}・${m.title}` }))} />
      </div>
    </Modal>
  );
}
