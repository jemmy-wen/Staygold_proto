import { useState } from "react";
import { CalendarClock, CalendarPlus, Copy, Link2, MapPin, Plus, TriangleAlert, Unlink } from "lucide-react";
import { useStore } from "../../../lib/store";
import { sessionsOf } from "../../../lib/rules";
import type { Case } from "../../../lib/types";
import { TODAY, cn, fmtDate, weekday } from "../../../lib/utils";
import { Badge, Button, Callout, Card, Input, StatGroup } from "../../../components/ui";

export function ScheduleTab({ c }: { c: Case }) {
  const s = useStore();
  const cu = s.customerOf(c);
  const sessions = sessionsOf(c, s.events);
  const done = sessions.filter((e) => e.date <= TODAY).length;
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  const can = s.perms.caseSchedule;
  const candidates = s.events.filter((e) => !e.caseId && e.kind === "排課" && (e.memberId === c.owner || c.coOwners.includes(e.memberId)) && e.title.includes(cu.short));
  const over = c.contractSessions > 0 && sessions.length > c.contractSessions;
  // PRD：事件名稱包含客戶簡稱與驗證項目，系統才比對得到
  const titleFmt = `${cu.short} ${c.item}`;

  const attach = (id: string) => {
    const e = s.events.find((x) => x.id === id)!;
    s.updateEvent(id, { caseId: c.id });
    s.log({ module: "案件", caseId: c.id, target: "排課", action: "加入日程表", after: `${fmtDate(e.date)} ${e.title}` });
    s.toast("已加入日程表");
  };

  return (
    <div className="space-y-5">
      <StatGroup
        items={[
          { label: "合約堂數", value: c.contractSessions || "—" },
          { label: "行事曆已排", value: sessions.length, sub: over ? <span className="text-rose-600">超過合約 {sessions.length - c.contractSessions} 堂</span> : c.contractSessions ? `尚有 ${Math.max(0, c.contractSessions - sessions.length)} 堂未排` : "—" },
          { label: "已上課", value: done, sub: sessions[0] ? `第一堂 ${fmtDate(sessions[0].date)}` : "尚未開課" },
          { label: "下一堂", value: sessions.find((e) => e.date > TODAY) ? fmtDate(sessions.find((e) => e.date > TODAY)!.date).slice(5) : "—", sub: sessions.find((e) => e.date > TODAY)?.location ?? "—" },
        ]}
      />
      {over && (
        <Callout tone="warn" icon={<TriangleAlert />} title={`行事曆排了 ${sessions.length} 堂，合約是 ${c.contractSessions} 堂`} />
      )}

      <div className="grid grid-cols-[minmax(0,1fr)_320px] gap-5">
        <Card title="日程表" pad={false}>
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-12 text-center">
              <CalendarClock className="size-8 text-ink-300" />
              <p className="mt-3 text-[14px] font-medium text-ink-800">還沒有排課</p>
            </div>
          ) : (
            <table className="w-full border-separate border-spacing-0">
              <thead>
                <tr className="text-left text-[12px] text-ink-500">
                  <th className="w-14 border-b border-ink-100 py-2.5 pl-5 font-medium">堂次</th>
                  <th className="border-b border-ink-100 px-3 font-medium">日期</th>
                  <th className="border-b border-ink-100 px-3 font-medium">時間</th>
                  <th className="border-b border-ink-100 px-3 font-medium">事件名稱</th>
                  <th className="border-b border-ink-100 px-3 font-medium">地點</th>
                  <th className="border-b border-ink-100 px-3 font-medium">狀態</th>
                  <th className="w-12 border-b border-ink-100" />
                </tr>
              </thead>
              <tbody>
                {sessions.map((e, i) => {
                  const extra = c.contractSessions > 0 && i >= c.contractSessions;
                  return (
                    <tr key={e.id} className={cn("group", extra && "bg-rose-50/30")}>
                      <td className="border-b border-ink-100 py-3 pl-5 text-[13px] font-medium tabular-nums text-ink-900">{i + 1}</td>
                      <td className="whitespace-nowrap border-b border-ink-100 px-3 text-[13px] tabular-nums">
                        {fmtDate(e.date)} <span className="text-ink-400">{weekday(e.date)}</span>
                      </td>
                      <td className="whitespace-nowrap border-b border-ink-100 px-3 text-[13px] tabular-nums text-ink-600">
                        {e.start}–{e.end}
                      </td>
                      <td className="max-w-[260px] truncate border-b border-ink-100 px-3 text-[13px] text-ink-700">{e.title}</td>
                      <td className="whitespace-nowrap border-b border-ink-100 px-3 text-[12.5px] text-ink-500">{e.location}</td>
                      <td className="border-b border-ink-100 px-3">
                        {extra ? <Badge tone="red">超出合約</Badge> : e.date <= TODAY ? <Badge tone="green">已上課</Badge> : <Badge tone="gray">即將到來</Badge>}
                      </td>
                      <td className="border-b border-ink-100 pr-3">
                        {can && (
                          <button
                            onClick={() => {
                              s.updateEvent(e.id, { caseId: undefined });
                              s.log({ module: "案件", caseId: c.id, target: "排課", action: "移出日程表", before: `${fmtDate(e.date)} ${e.title}` });
                            }}
                            className="rounded p-1 text-ink-300 opacity-0 hover:bg-ink-100 hover:text-ink-600 group-hover:opacity-100"
                            title="移出日程表（不會刪除 Calendar 事件）"
                          >
                            <Unlink className="size-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card>

        <div className="space-y-4">
          {can && (
            <Card title="加入課程">
              <div className="relative mt-3">
                <Link2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
                <Input
                  value={link}
                  onChange={(e) => {
                    setLink(e.target.value);
                    setError("");
                  }}
                  placeholder="https://calendar.google.com/…"
                  className="pl-9"
                />
              </div>
              {error && <p className="mt-1.5 text-[12px] text-rose-600">{error}</p>}
              <Button
                variant="dark"
                className="mt-2 w-full"
                icon={<CalendarPlus className="size-4" />}
                disabled={!link.trim()}
                onClick={() => {
                  const ev = s.events.find((e) => link.includes(e.id) || e.link === link.trim());
                  if (!ev) return setError("找不到這個事件，請確認連結是否來自你的 Google Calendar");
                  if (ev.caseId) return setError(`這個事件已在 ${ev.caseId} 的日程表中`);
                  attach(ev.id);
                  setLink("");
                }}
              >
                加入日程表
              </Button>
              {candidates.length > 0 && (
                <div className="mt-4 border-t border-ink-100 pt-4">
                  <p className="text-[12px] font-medium text-ink-600">行事曆中可能相關的行程</p>
                  <div className="mt-2 space-y-2">
                    {candidates.map((e) => (
                      <div key={e.id} className="flex items-center gap-2 rounded-lg border border-dashed border-ink-300 bg-ink-25 px-3 py-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12.5px] font-medium text-ink-900">{e.title}</p>
                          <p className="flex items-center gap-1 text-[11.5px] text-ink-500">
                            {fmtDate(e.date)} {e.start}
                            <MapPin className="ml-1 size-3" />
                            {e.location}
                          </p>
                        </div>
                        <Button size="sm" variant="soft" icon={<Plus className="size-3.5" />} onClick={() => attach(e.id)}>
                          加入
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}
          <Card title="行事曆事件名稱">
            <div className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-ink-50 px-3 py-2">
              <code className="truncate font-mono text-[12px] text-ink-800">{titleFmt}</code>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(titleFmt).catch(() => undefined);
                  s.toast("已複製事件名稱", "info");
                }}
                className="shrink-0 rounded p-1 text-ink-400 hover:bg-ink-200 hover:text-ink-700"
                aria-label="複製"
              >
                <Copy className="size-3.5" />
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
