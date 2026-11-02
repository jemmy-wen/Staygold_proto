import { useState, type ReactNode } from "react";
import { ArrowRight, ArrowUpRight, Briefcase, Building2, Car, History, Mail, Settings, Users, Wallet } from "lucide-react";
import { useStore } from "../lib/store";
import type { AuditEntry } from "../lib/types";
import { TODAY, addDays, cn, openParam } from "../lib/utils";
import { Avatar, Button, Drawer, Empty } from "./ui";

const ICON: Record<AuditEntry["module"], ReactNode> = {
  案件: <Briefcase />,
  客戶: <Building2 />,
  財務: <Wallet />,
  差旅費: <Car />,
  Email: <Mail />,
  成員與權限: <Users />,
  系統設定: <Settings />,
};

export const auditDay = (a: AuditEntry) => a.time.slice(0, 10).replace(/\//g, "-");

const dayLabel = (d: string) => (d === TODAY ? "今天" : d === addDays(TODAY, -1) ? "昨天" : d.slice(0, 4) === TODAY.slice(0, 4) ? d.slice(5).replace("-", "/") : d.replace(/-/g, "/"));

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <dt className="w-10 shrink-0 text-[12.5px] leading-6 text-ink-600">{label}</dt>
      <dd className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 text-[12.5px] leading-6 text-ink-800">{children}</dd>
    </div>
  );
}

function Chip({ children }: { children: ReactNode }) {
  return <span className="max-w-full truncate rounded-md bg-ink-100 px-1.5 text-[12px] leading-[22px] text-ink-700">{children}</span>;
}

// 時間軸：標題是做了什麼，時間在標題下方，人員、項目與變更內容收在下方的卡片；showCase 為 false 表示已在該案件內，不重複顯示案件
export function ActivityTimeline({ entries, showCase = true, dayHeaders = false }: { entries: AuditEntry[]; showCase?: boolean; dayHeaders?: boolean }) {
  const s = useStore();
  return (
    <ol>
      {entries.map((a, i) => {
        const m = s.memberOf(a.actor);
        const day = auditDay(a);
        const hour = a.time.slice(11);
        const before = a.before && a.before !== "—" ? a.before : undefined;
        const newDay = dayHeaders && (i === 0 || auditDay(entries[i - 1]) !== day);
        return (
          <li key={a.id}>
            {newDay && <p className={cn("pb-3 text-[13px] font-semibold text-ink-900", i > 0 && "pt-1")}>{dayLabel(day)}</p>}
            <div className="relative pb-5 pl-9">
              {i < entries.length - 1 && <span aria-hidden className="absolute bottom-0 left-3 top-7 w-px -translate-x-1/2 bg-ink-200" />}
              <span className="absolute left-0 top-0 grid size-6 place-items-center rounded-full bg-ink-100 text-ink-600 [&>svg]:size-3.5">{ICON[a.module]}</span>
              <p className="text-[13px] font-medium leading-6 text-ink-900">{a.action}</p>
              <p className="text-[12px] tabular-nums text-ink-600">{dayHeaders ? hour : `${dayLabel(day)} ${hour}`}</p>
              <div className="mt-2 overflow-hidden rounded-xl border border-ink-200 bg-white">
                <dl className="space-y-1 px-3.5 py-3">
                  <Row label="人員">
                    <Avatar m={m} size={20} />
                    {m?.nickname ?? m?.name ?? a.actor}
                  </Row>
                  <Row label="項目">
                    <Chip>{a.module}</Chip>
                    <Chip>{a.target}</Chip>
                  </Row>
                  {showCase && a.caseId && (
                    <Row label="案件">
                      <span className="truncate font-mono text-[12px]">{a.caseId}</span>
                    </Row>
                  )}
                  {(before || a.after) && (
                    <Row label="變更">
                      {before && <span className="text-ink-600">{before}</span>}
                      {before && a.after && <ArrowRight className="size-3 shrink-0 text-ink-400" />}
                      {a.after && <span className="font-medium text-ink-900">{a.after}</span>}
                    </Row>
                  )}
                </dl>
                {showCase && a.caseId && (
                  <div className="border-t border-ink-100 p-1.5">
                    <button
                      onClick={() => s.go({ page: "case", id: a.caseId! })}
                      className="flex h-8 w-full items-center justify-center gap-1 rounded-lg text-[12.5px] font-medium text-ink-700 transition-colors duration-150 hover:bg-ink-50 hover:text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
                    >
                      開啟案件
                      <ArrowUpRight className="size-3.5 text-ink-500" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// 各功能頁首的入口：從右側滑出這個功能的異動紀錄，完整查詢在異動紀錄總覽
export function ActivityButton({ title, match, showCase = true }: { title: string; match: (a: AuditEntry) => boolean; showCase?: boolean }) {
  const s = useStore();
  const [open, setOpen] = useState(openParam("activity"));
  if (!s.perms.audit) return null;
  const entries = s.audit.filter(match);
  return (
    <>
      <Button icon={<History className="size-4" />} onClick={() => setOpen(true)}>
        異動紀錄
      </Button>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={`${title}異動紀錄`}
        desc={`${entries.length} 筆`}
        width={440}
        footer={
          <Button className="ml-auto" onClick={() => s.go({ page: "audit" })}>
            前往紀錄總覽
          </Button>
        }
      >
        <div className="px-5 py-5">{entries.length ? <ActivityTimeline entries={entries} showCase={showCase} /> : <Empty icon={<History />} title="還沒有異動紀錄" />}</div>
      </Drawer>
    </>
  );
}
