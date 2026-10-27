import { useState } from "react";
import { ArrowUpRight, Check, EyeOff, Mail, MailCheck, Paperclip, Sparkles, Unlink } from "lucide-react";
import { useStore } from "../../../lib/store";
import type { Case, EmailThread } from "../../../lib/types";
import { cn, fmtShort, nowStamp } from "../../../lib/utils";
import { Avatar, Badge, Button, Card, Empty, OptionList, Popover } from "../../../components/ui";

export function EmailTab({ c }: { c: Case }) {
  const s = useStore();
  const suggested = s.threads.filter((t) => t.state === "suggested" && t.suggestedCaseIds?.includes(c.id));
  const linked = s.threads.filter((t) => t.state === "linked" && t.caseId === c.id).sort((a, b) => b.date.localeCompare(a.date));
  const others = s.visibleCases.filter((x) => x.id !== c.id);

  const link = (t: EmailThread, caseId: string, how: string) => {
    s.updateThread(t.id, { state: "linked", caseId, linkedBy: s.me.id, linkedAt: nowStamp() });
    s.log({ module: "Email", caseId, target: t.subject, action: how });
    s.toast(caseId === c.id ? "已歸檔" : `已歸檔至 ${caseId}`);
  };

  return (
    <div className="space-y-5">
      <div className="min-w-0 space-y-5">
        <Card
          title={
            <span className="flex items-center gap-2">
              建議關聯信件
              {suggested.length > 0 && <Badge tone="amber">{suggested.length} 封待確認</Badge>}
            </span>
          }
          pad={false}
        >
          {suggested.length === 0 && <Empty icon={<MailCheck />} title="沒有待確認的信件" />}
          {suggested.map((t) => (
            <div key={t.id} className="border-b border-ink-100 px-5 py-4 last:border-b-0">
              <div className="flex items-start gap-3">
                <Avatar m={{ name: t.fromName, color: "#9CA5A3" }} size={32} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-[13.5px] font-medium text-ink-900">{t.fromName}</p>
                    <p className="truncate text-[12px] text-ink-400">{t.fromEmail}</p>
                    <span className="ml-auto shrink-0 text-[12px] text-ink-400">
                      {fmtShort(t.date)} {t.time}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[13px] font-medium text-ink-800">
                    {t.subject}
                    {t.count > 1 && <span className="ml-1.5 text-[12px] font-normal text-ink-400">（{t.count} 封往來）</span>}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-[12.5px] text-ink-500">{t.snippet}</p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    <Sparkles className="size-3.5 text-brand-500" />
                    {t.reasons?.map((r) => (
                      <span key={r} className="rounded-md bg-ink-50 px-1.5 py-0.5 text-[11.5px] text-ink-800">
                        {r}
                      </span>
                    ))}
                    {(t.suggestedCaseIds?.length ?? 0) > 1 && <span className="text-[11.5px] text-ink-400">・另有 {t.suggestedCaseIds!.length - 1} 個候選案件</span>}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-end gap-2 pl-11">
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<EyeOff className="size-3.5" />}
                  onClick={() => {
                    s.updateThread(t.id, { state: "ignored" });
                    s.log({ module: "Email", caseId: c.id, target: t.subject, action: "忽略建議" });
                    s.toast("已忽略", "info");
                  }}
                >
                  忽略
                </Button>
                <Popover
                  align="right"
                  width={320}
                  trigger={({ toggle }) => (
                    <Button size="sm" onClick={toggle}>
                      改選其他案件
                    </Button>
                  )}
                >
                  {(close) => (
                    <OptionList
                      searchAt={1}
                      placeholder="搜尋案件編號或客戶"
                      selected={[]}
                      options={[
                        ...(t.suggestedCaseIds ?? []).filter((x) => x !== c.id && others.some((o) => o.id === x)).map((id) => ({ value: id, label: id, hint: "候選" })),
                        ...others.filter((o) => !t.suggestedCaseIds?.includes(o.id)).map((o) => ({ value: o.id, label: o.id, hint: s.customerOf(o).short })),
                      ]}
                      onPick={(id) => (link(t, id, "改選案件後歸檔"), close())}
                    />
                  )}
                </Popover>
                <Button size="sm" variant="brand" icon={<Check className="size-3.5" />} onClick={() => link(t, c.id, "確認系統建議並歸檔")}>
                  確認歸檔到本案
                </Button>
              </div>
            </div>
          ))}
        </Card>

        <Card title={`已關聯信件・${linked.length} 串`} pad={false}>
          {linked.length === 0 && <Empty icon={<Mail />} title="還沒有關聯的信件" />}
          {linked.map((t) => (
            <LinkedRow key={t.id} t={t} c={c} />
          ))}
        </Card>
      </div>

    </div>
  );
}

function LinkedRow({ t, c }: { t: EmailThread; c: Case }) {
  const s = useStore();
  const [hover, setHover] = useState(false);
  const by = s.memberOf(t.linkedBy);
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} className="flex items-center gap-3 border-b border-ink-100 px-5 py-3 last:border-b-0 hover:bg-ink-25">
      <Avatar m={{ name: t.fromName, color: "#9CA5A3" }} size={30} />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-[13px]">
          <span className="font-medium text-ink-900">{t.fromName}</span>
          <span className="truncate text-ink-800">{t.subject}</span>
          {t.count > 1 && <span className="shrink-0 rounded bg-ink-100 px-1.5 text-[11px] text-ink-500">{t.count}</span>}
          {t.hasAttachment && <Paperclip className="size-3.5 shrink-0 text-ink-400" />}
        </p>
        <p className="mt-0.5 truncate text-[12px] text-ink-500">
          {t.snippet}
        </p>
        <p className="mt-0.5 text-[11.5px] text-ink-400">
          {by?.nickname ?? by?.name} 於 {t.linkedAt} 確認歸檔
        </p>
      </div>
      <span className="shrink-0 text-[12px] tabular-nums text-ink-400">{fmtShort(t.date)}</span>
      <div className={cn("flex shrink-0 gap-1 transition-opacity", hover ? "opacity-100" : "opacity-0")}>
        <Popover
          align="right"
          width={300}
          trigger={({ toggle }) => (
            <Button size="sm" variant="ghost" onClick={toggle}>
              重新指定
            </Button>
          )}
        >
          {(close) => (
            <OptionList
              searchAt={1}
              placeholder="搜尋案件編號或客戶"
              selected={[]}
              options={s.visibleCases.filter((x) => x.id !== c.id).map((o) => ({ value: o.id, label: o.id, hint: s.customerOf(o).short }))}
              onPick={(id) => {
                s.updateThread(t.id, { caseId: id, linkedBy: s.me.id, linkedAt: nowStamp() });
                s.log({ module: "Email", caseId: id, target: t.subject, action: "重新指定案件", before: c.id, after: id });
                s.toast(`已改歸檔至 ${id}`);
                close();
              }}
            />
          )}
        </Popover>
        <Button
          size="sm"
          variant="ghost"
          icon={<Unlink className="size-3.5" />}
          onClick={() => {
            s.updateThread(t.id, { state: "none", caseId: undefined });
            s.log({ module: "Email", caseId: c.id, target: t.subject, action: "移除關聯" });
            s.toast("已移除關聯", "info");
          }}
        >
          移除
        </Button>
      </div>
    </div>
  );
}
