import { useMemo, useState } from "react";
import {
  AlarmClock,
  Ban,
  BadgeCheck,
  CalendarX2,
  Car,
  CircleCheck,
  CopyPlus,
  FileClock,
  FileSignature,
  FileWarning,
  Mail,
  MailQuestion,
  Receipt,
  RotateCcw,
  Send,
  ShieldAlert,
  Undo2,
} from "lucide-react";
import { useStore } from "../lib/store";
import { RECIPIENT_LABEL, matchesRecipient } from "../lib/rules";
import { createRenewal } from "../lib/caseOps";
import type { Notif, NotifType } from "../lib/types";
import { AnimatePresence, motion } from "framer-motion";
import { Badge, Button, Empty, Modal, PageHeader, Segmented, Tabs, ease } from "../components/ui";
import { openNotif } from "../components/layout";
import { cn, openParam } from "../lib/utils";
import { BrandMark } from "../components/brand";

const ICONS: Record<NotifType, React.ReactNode> = {
  "待審核（內容）": <FileClock />,
  "待審核（核價）": <FileClock />,
  審核退回: <Undo2 />,
  "審核核可・待寄送企劃書": <Send />,
  待回簽: <FileSignature />,
  堂數不符: <CalendarX2 />,
  信件待確認: <MailQuestion />,
  "發票待開立（第一期）": <Receipt />,
  "發票待開立（取證後各期）": <Receipt />,
  收款逾期: <FileWarning />,
  差旅費填報提醒: <Car />,
  差旅費未歸戶: <Car />,
  續證準備: <RotateCcw />,
  續證再提醒: <AlarmClock />,
  證書即將到期: <ShieldAlert />,
};


// 通知圖示：依類型換圖示，顏色一律中性
export function NotifIcon({ type, done }: { type: NotifType; done?: boolean }) {
  return (
    <span className={cn("mt-0.5 shrink-0 [&>svg]:size-4 [&>svg]:stroke-[1.75]", done ? "text-ink-300" : "text-ink-400")}>
      {ICONS[type]}
    </span>
  );
}


export function NotificationCenter() {
  const s = useStore();
  const [tab, setTab] = useState<"未讀" | "已讀" | "已完成">("未讀");
  const [preview, setPreview] = useState<Notif | null>(() => (openParam("emailPreview") ? s.myNotifs.find((n) => n.email && n.status !== "已完成") ?? null : null));
  const source = s.myNotifs;
  const list = useMemo(() => source.filter((n) => n.status === tab), [source, tab]);
  const count = (st: string) => source.filter((n) => n.status === st).length;

  return (
    <div>
      <PageHeader
        title="通知中心"
        actions={<Button onClick={s.markAllRead}>全部標為已讀</Button>}
      />
      <div className="px-8 py-5">
        <div className="flex items-end justify-between">
          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              { value: "未讀", label: "未讀", count: count("未讀") },
              { value: "已讀", label: "已讀・待處理", count: count("已讀") },
              { value: "已完成", label: "已完成" },
            ]}
            className="flex-1"
          />
        </div>
        <div className="mt-4 overflow-hidden rounded-xl border border-ink-200 bg-white shadow-card">
          {list.length === 0 && <Empty icon={<CircleCheck />} title={tab === "已完成" ? "還沒有已完成的通知" : "沒有需要處理的通知"} />}
          <AnimatePresence initial={false}>
            {list.map((n) => (
              <motion.div key={n.key} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25, ease }}>
                <NotifRow n={n} onPreview={() => setPreview(n)} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
      <EmailPreview n={preview} onClose={() => setPreview(null)} />
    </div>
  );
}

function NotifRow({ n, onPreview }: { n: Notif; onPreview: () => void }) {
  const s = useStore();
  const done = n.status === "已完成";
  const isRenew = n.group === "證書到期與續證" && !done;
  const c = n.caseId ? s.cases.find((x) => x.id === n.caseId) : undefined;
  return (
    <div className="flex gap-4 border-b border-ink-100 px-5 py-4">
      <NotifIcon type={n.type} done={done} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className={cn("text-[13.5px]", done ? "font-medium text-ink-500" : n.status === "未讀" ? "font-semibold text-ink-900" : "font-medium text-ink-900")}>{n.title}</p>
          {n.status === "未讀" && <span className="size-1.5 rounded-full bg-brand-500" />}
        </div>
        <p className="mt-0.5 text-[12.5px] text-ink-500">{n.desc}</p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11.5px] text-ink-400">
          <Badge tone="outline">{n.type}</Badge>
          {n.caseId && <span className="font-mono">{n.caseId}</span>}
          <span>・通知 {n.recipients.map((r) => RECIPIENT_LABEL[r]).join("、")}</span>
          <span>・{n.email ? "系統＋Email" : "系統"}</span>
          <span>・{done ? `${n.completedAt} 完成（${n.done}）` : `${n.createdAt}・完成條件：${n.done}`}</span>
        </div>
      </div>
      <div className="flex shrink-0 items-start gap-2">
        {n.email && (
          <Button size="sm" variant="ghost" icon={<Mail className="size-3.5" />} onClick={onPreview}>
            Email 預覽
          </Button>
        )}
        {isRenew && c && s.perms.casesCreate && (
          <Button
            size="sm"
            icon={<CopyPlus className="size-3.5" />}
            onClick={() => {
              const next = createRenewal(s, c);
              s.toast(`已建立續證案件 ${next.id}`);
              s.go({ page: "case", id: next.id });
            }}
          >
            建立續證案件
          </Button>
        )}
        {isRenew && c && s.me.role === "主管" && s.perms.reviewPrice && (
          <Button
            size="sm"
            variant="ghost"
            icon={<Ban className="size-3.5" />}
            onClick={() => {
              s.updateCase(c.id, (x) => ({ ...x, noRenew: true }));
              s.log({ module: "案件", caseId: c.id, target: "續證", action: "標記本次不續證" });
              s.toast("已標記本次不續證，通知已結束");
            }}
          >
            本次不續證
          </Button>
        )}
        {!done && !isRenew && (
          <Button
            size="sm"
            variant="dark"
            onClick={() => {
              s.markRead(n.key);
              openNotif(s, n);
            }}
          >
            前往處理
          </Button>
        )}
        {done && <BadgeCheck className="mt-1 size-5 text-ink-300" />}
      </div>
    </div>
  );
}

function EmailPreview({ n, onClose }: { n: Notif | null; onClose: () => void }) {
  const s = useStore();
  if (!n) return null;
  const owner = s.memberOf(n.memberId);
  const to = n.recipients
    .map((r) => (r === "owner" || r === "reporter" ? owner?.email : s.members.find((m) => m.status === "active" && matchesRecipient(r, m))?.email))
    .filter(Boolean)
    .join(", ");
  return (
    <Modal open onClose={onClose} title="Email 通知預覽" width={620}>
      <div className="overflow-hidden rounded-xl border border-ink-200">
        <div className="space-y-1 border-b border-ink-100 bg-ink-25 px-5 py-3 text-[12.5px]">
          <p>
            <span className="inline-block w-14 text-ink-400">寄件者</span>恆永顧問內部系統 &lt;no-reply@staygold-demo.com&gt;
          </p>
          <p>
            <span className="inline-block w-14 text-ink-400">收件者</span>
            {to}
          </p>
          <p>
            <span className="inline-block w-14 text-ink-400">主旨</span>
            <span className="font-medium text-ink-900">
              【{n.type}】{n.title}
            </span>
          </p>
        </div>
        <div className="px-6 py-6">
          <div className="flex items-center gap-2">
            <BrandMark size={28} />
            <span className="text-[13px] font-semibold">恆永顧問</span>
          </div>
          <p className="mt-5 text-[16px] font-semibold text-ink-900">{n.title}</p>
          <p className="mt-2 text-[13.5px] leading-relaxed text-ink-600">{n.desc}</p>
          <div className="mt-5 rounded-lg bg-ink-50 px-4 py-3 text-[12.5px] text-ink-600">
            {n.caseId && (
              <p>
                案件編號：<span className="font-mono text-ink-900">{n.caseId}</span>
              </p>
            )}
            <p className="mt-1">完成條件：{n.done}</p>
          </div>
          <span className="mt-6 inline-block rounded-lg bg-brand-500 px-4 py-2.5 text-[13px] font-medium text-white">在系統中開啟</span>
          <p className="mt-6 border-t border-ink-100 pt-4 text-[11.5px] text-ink-400">你收到這封信，是因為你是此案件的{n.recipients.map((r) => RECIPIENT_LABEL[r]).join("／")}。</p>
        </div>
      </div>
    </Modal>
  );
}
