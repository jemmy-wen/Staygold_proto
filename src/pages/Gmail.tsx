import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CircleCheck,
  Contact,
  StickyNote,
  X,
  Archive,
  ArrowUpRight,
  Check,
  Clock,
  EyeOff,
  File,
  Inbox,
  Info,
  Mail,
  Menu,
  Paperclip,
  Pencil,
  Plus,
  Search,
  Send,
  Sparkles,
  Star,
  Tag,
  Trash2,
} from "lucide-react";
import { useStore } from "../lib/store";
import type { Case, Customer, EmailThread } from "../lib/types";
import { casePrefix, cn, fmtShort, nextCaseId, nowStamp, uid } from "../lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Avatar, Button, Field, Input, Popover, Select, StatusPill, ease } from "../components/ui";
import { BrandMark } from "../components/brand";

// Gmail 擴充功能：依 Gmail 內嵌擴充功能的常見做法放三個位置
// 1. 搜尋列旁的擴充功能圖示（待確認數＋快速選單）  2. 信件列表與信件標題旁的關聯標籤  3. 右側擴充功能欄的面板（點右側圖示列開合）
export function GmailMock({ threadId }: { threadId?: string }) {
  const s = useStore();
  const own = s.threads.filter((t) => t.mailbox === s.me.id);
  const mailboxId = own.length ? s.me.id : "con1";
  const box = s.threads.filter((t) => t.mailbox === mailboxId).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  const [openId, setOpenId] = useState<string | null>(threadId ?? null);
  const [panel, setPanel] = useState(true);
  const open = box.find((t) => t.id === openId) ?? null;
  const pending = box.filter((t) => t.state === "suggested");
  const owner = s.memberOf(mailboxId);
  const openThread = (id: string) => {
    setOpenId(id);
    const t = box.find((x) => x.id === id);
    if (t?.unread) s.updateThread(id, { unread: false });
  };

  return (
    <div className="flex h-screen min-w-[1280px] flex-col bg-[#F6F8FC] font-[Roboto,'Noto_Sans_TC',sans-serif] text-[#1f1f1f]">
      <div className="flex h-10 shrink-0 items-end gap-1 bg-[#DEE3EA] px-2 pt-1.5 text-[12.5px]">
        <button onClick={() => s.go({ page: "dashboard" })} className="flex h-full w-56 items-center gap-2 rounded-t-lg px-3 text-[#3c4043] transition-colors hover:bg-white/50">
          <BrandMark size={16} />
          <span className="truncate">恆永顧問內部系統</span>
        </button>
        <div className="flex h-full w-56 items-center gap-2 rounded-t-lg bg-[#F6F8FC] px-3 text-[#1f1f1f]">
          <Mail className="size-4 text-rose-500" />
          <span className="truncate">收件匣 - {owner?.email}</span>
        </div>
      </div>
      <header className="flex h-16 shrink-0 items-center gap-4 px-4">
        <button className="grid size-10 place-items-center rounded-full hover:bg-black/5">
          <Menu className="size-5 text-[#444]" />
        </button>
        <div className="flex w-[180px] items-center gap-2">
          <Mail className="size-7 text-rose-500" />
          <span className="text-[21px] text-[#444]">Gmail</span>
        </div>
        <div className="flex h-12 max-w-[720px] flex-1 items-center gap-3 rounded-full bg-[#EAF1FB] px-4">
          <Search className="size-5 text-[#444]" />
          <span className="text-[15px] text-[#5f6368]">搜尋郵件</span>
        </div>
        <QuickMenu pending={pending} onOpen={(id) => (openThread(id), setPanel(true))} />
        <div className="ml-auto flex items-center gap-1">
          <Avatar m={owner} size={34} />
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <nav className="w-[232px] shrink-0 px-3">
          <button className="mb-4 flex h-14 items-center gap-3 rounded-2xl bg-[#C2E7FF] px-5 text-[14px] font-medium text-[#001d35] shadow-sm">
            <Pencil className="size-5" />
            撰寫
          </button>
          {[
            [Inbox, "收件匣", box.filter((t) => t.unread).length, true],
            [Star, "已加星號"],
            [Clock, "已延後"],
            [Send, "寄件備份"],
            [File, "草稿"],
          ].map(([Icon, label, n, active]) => {
            const I = Icon as typeof Inbox;
            return (
              <div key={label as string} onClick={() => active && setOpenId(null)} className={cn("flex h-8 cursor-pointer items-center gap-4 rounded-full px-4 text-[14px]", active ? "bg-[#D3E3FD] font-semibold" : "text-[#444] hover:bg-black/5")}>
                <I className="size-[18px]" />
                <span className="flex-1">{label as string}</span>
                {!!n && <span className="text-[12px]">{n as number}</span>}
              </div>
            );
          })}
          <p className="mb-1 mt-5 px-4 text-[14px] font-medium text-[#444]">標籤</p>
          {["客戶往來", "驗證單位", "內部"].map((l) => (
            <div key={l} className="flex h-8 items-center gap-4 rounded-full px-4 text-[14px] text-[#444] hover:bg-black/5">
              <Tag className="size-[18px]" />
              {l}
            </div>
          ))}
        </nav>

        <main className="mr-2 flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl bg-white">
          {open ? (
            <ThreadView t={open} onBack={() => setOpenId(null)} onPanel={() => setPanel(true)} />
          ) : (
            <div className="overflow-y-auto">
              <div className="flex h-12 items-center gap-4 border-b border-[#eceff1] px-4 text-[#444]">
                <span className="size-4 rounded-sm border-2 border-[#9aa0a6]" />
                <Archive className="size-[18px]" />
                <Trash2 className="size-[18px]" />
              </div>
              {box.map((t) => (
                <button
                  key={t.id}
                  onClick={() => openThread(t.id)}
                  className={cn("flex h-11 w-full items-center gap-3 border-b border-[#f1f3f4] px-4 text-left text-[14px] hover:shadow-[inset_1px_0_0_#dadce0,inset_-1px_0_0_#dadce0,0_1px_2px_0_rgba(60,64,67,.3)]", t.unread ? "bg-white font-semibold" : "bg-[#F2F6FC] text-[#444]")}
                >
                  <span className="size-4 shrink-0 rounded-sm border-2 border-[#c4c7c5]" />
                  <Star className="size-4 shrink-0 text-[#c4c7c5]" />
                  <span className="w-44 shrink-0 truncate">
                    {t.fromName}
                    {t.count > 1 && <span className="ml-1 font-normal text-[#5f6368]">{t.count}</span>}
                  </span>
                  <span className="min-w-0 flex-1 truncate">
                    <ThreadChip t={t} />
                    {t.subject}
                    <span className="font-normal text-[#5f6368]"> - {t.snippet}</span>
                  </span>
                  {t.hasAttachment && <Paperclip className="size-4 shrink-0 text-[#5f6368]" />}
                  <span className="w-14 shrink-0 text-right text-[12px]">{t.date === "2026-10-29" ? t.time : fmtShort(t.date)}</span>
                </button>
              ))}
            </div>
          )}
        </main>

        <AnimatePresence initial={false}>
          {panel && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease }}
              className="mr-1 flex shrink-0 flex-col overflow-hidden rounded-2xl bg-white"
            >
              <div className="flex h-14 shrink-0 items-center gap-2 border-b border-[#eceff1] pl-4 pr-2">
                <BrandMark size={24} />
                <p className="flex-1 text-[14px] font-medium text-[#1f1f1f]">恆永顧問</p>
                <button onClick={() => s.go({ page: "dashboard" })} className="grid size-8 place-items-center rounded-full text-[#444] hover:bg-black/5" title="在系統開啟">
                  <ArrowUpRight className="size-4" />
                </button>
                <button onClick={() => setPanel(false)} className="grid size-8 place-items-center rounded-full text-[#444] hover:bg-black/5" aria-label="關閉">
                  <X className="size-4" />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-4 [&_button.inline-flex]:rounded-full">{open ? <Panel key={open.id + open.state} t={open} /> : <Summary pending={pending} onOpen={openThread} />}</div>
            </motion.aside>
          )}
        </AnimatePresence>

        <aside className="flex w-14 shrink-0 flex-col items-center gap-2 pt-1">
          {[
            ["#1A73E8", <CalendarDays key="c" className="size-[18px]" />],
            ["#FBBC04", <StickyNote key="k" className="size-[18px]" />],
            ["#1A73E8", <CircleCheck key="t" className="size-[18px]" />],
            ["#1A73E8", <Contact key="p" className="size-[18px]" />],
          ].map(([color, icon], i) => (
            <span key={i} className="grid size-10 place-items-center rounded-full hover:bg-black/5" style={{ color: color as string }}>
              {icon}
            </span>
          ))}
          <span className="my-1 h-px w-5 bg-[#c4c7c5]" />
          <button onClick={() => setPanel((v) => !v)} className={cn("relative grid size-10 place-items-center rounded-full transition-colors", panel ? "bg-[#D3E3FD]" : "hover:bg-black/5")} title="恆永顧問">
            <BrandMark size={24} />
            {pending.length > 0 && !panel && <span className="absolute right-1 top-1 size-2 rounded-full bg-rose-500 ring-2 ring-[#F6F8FC]" />}
          </button>
          <span className="grid size-10 place-items-center rounded-full text-[#444] hover:bg-black/5">
            <Plus className="size-[18px]" />
          </span>
        </aside>
      </div>
    </div>
  );
}

// 搜尋列旁的擴充功能圖示：待確認數＋快速選單
function QuickMenu({ pending, onOpen }: { pending: EmailThread[]; onOpen: (id: string) => void }) {
  const s = useStore();
  return (
    <Popover
      width={320}
      trigger={({ toggle, open }) => (
        <button onClick={toggle} className={cn("relative flex h-10 items-center gap-2 rounded-full px-3 text-[13px] text-[#444] transition-colors", open ? "bg-[#D3E3FD]" : "hover:bg-black/5")} title="恆永顧問">
          <BrandMark size={24} />
          {pending.length > 0 && <span className="rounded-full bg-rose-500 px-1.5 text-[11px] font-medium leading-[18px] text-white">{pending.length}</span>}
        </button>
      )}
    >
      {(close) => (
        <div className="p-1">
          <p className="px-2 pb-2 pt-1 text-[13px] font-medium text-[#1f1f1f]">{pending.length} 封信件待確認關聯</p>
          {pending.map((t) => (
            <button key={t.id} onClick={() => (onOpen(t.id), close())} className="block w-full rounded-lg px-2 py-2 text-left hover:bg-[#F2F6FC]">
              <p className="truncate text-[13px] font-medium text-[#1f1f1f]">{t.subject}</p>
              <p className="truncate text-[12px] text-[#5f6368]">
                {t.fromName}・建議 <span className="font-mono">{t.suggestedCaseIds?.[0]}</span>
              </p>
            </button>
          ))}
          <div className="mt-1 border-t border-[#eceff1] pt-1">
            <button onClick={() => s.go({ page: "dashboard" })} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[13px] text-[#1f1f1f] hover:bg-[#F2F6FC]">
              <ArrowUpRight className="size-4 text-[#5f6368]" />
              開啟恆永顧問系統
            </button>
          </div>
        </div>
      )}
    </Popover>
  );
}

// 信件列表與信件標題旁的關聯標籤（Gmail 標籤樣式）
function ThreadChip({ t }: { t: EmailThread }) {
  if (t.state === "linked") return <span className="mr-1.5 rounded bg-[#E6F4F1] px-1.5 py-0.5 text-[11px] font-medium text-brand-800">恆永・{t.caseId?.split("-")[0]}</span>;
  if (t.state === "suggested") return <span className="mr-1.5 rounded bg-[#FEF7E0] px-1.5 py-0.5 text-[11px] font-medium text-[#8a5a00]">恆永・待確認</span>;
  return null;
}

function ThreadView({ t, onBack, onPanel }: { t: EmailThread; onBack: () => void; onPanel: () => void }) {
  const s = useStore();
  const primary = t.suggestedCaseIds?.[0];
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="flex h-12 shrink-0 items-center gap-4 border-b border-[#eceff1] px-4 text-[#444]">
        <button onClick={onBack} className="grid size-9 place-items-center rounded-full hover:bg-black/5">
          <ArrowLeft className="size-[18px]" />
        </button>
        <Archive className="size-[18px]" />
        <Trash2 className="size-[18px]" />
      </div>
      <div className="px-16 py-6">
        <h2 className="flex flex-wrap items-center gap-2 text-[22px] text-[#1f1f1f]">
          {t.subject}
          <ThreadChip t={t} />
        </h2>
        {t.state === "suggested" && primary && (
          <div className="mt-3 flex items-center gap-3 rounded-xl border border-[#e3e3e3] bg-[#F8FAFD] px-4 py-2.5 text-[13px]">
            <BrandMark size={20} />
            <span className="min-w-0 flex-1 truncate text-[#1f1f1f]">
              建議歸檔至 <span className="font-mono font-medium">{primary}</span>
            </span>
            <button onClick={onPanel} className="rounded-full px-3 py-1.5 text-[13px] font-medium text-brand-700 hover:bg-brand-50">
              改選
            </button>
            <button
              onClick={() => {
                s.updateThread(t.id, { state: "linked", caseId: primary, linkedBy: s.me.id, linkedAt: nowStamp() });
                s.log({ module: "Email", caseId: primary, target: t.subject, action: "確認系統建議並歸檔" });
                s.toast(`已歸檔至 ${primary}`);
              }}
              className="rounded-full bg-brand-600 px-4 py-1.5 text-[13px] font-medium text-white hover:bg-brand-700"
            >
              確認歸檔
            </button>
          </div>
        )}
        <div className="mt-6 flex items-start gap-3">
          <Avatar m={{ name: t.fromName, color: "#5f6368" }} size={40} />
          <div className="flex-1">
            <p className="text-[14px]">
              <span className="font-semibold">{t.fromName}</span> <span className="text-[12px] text-[#5f6368]">&lt;{t.fromEmail}&gt;</span>
            </p>
            <p className="text-[12px] text-[#5f6368]">寄給 我</p>
          </div>
          <span className="text-[12px] text-[#5f6368]">
            {t.date.replace(/-/g, "/")} {t.time}
          </span>
        </div>
        <div className="ml-[52px] mt-5 space-y-3 text-[14px] leading-relaxed text-[#222]">
          {t.body.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          {t.signature && (
            <div className="pt-3 text-[13px] text-[#5f6368]">
              <p>--</p>
              {t.signature.map((l) => (
                <p key={l}>{l}</p>
              ))}
            </div>
          )}
          {t.hasAttachment && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[#dadce0] px-3 py-2 text-[13px]">
              <Paperclip className="size-4 text-[#5f6368]" />
              {t.hasAttachment}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Summary({ pending, onOpen }: { pending: EmailThread[]; onOpen: (id: string) => void }) {
  return (
    <div>
      <p className="text-[13px] font-medium text-[#1f1f1f]">{pending.length} 封信件待確認關聯</p>
      <div className="mt-3 space-y-2">
        {pending.map((t) => (
          <button key={t.id} onClick={() => onOpen(t.id)} className="w-full rounded-xl border border-[#e3e3e3] px-3 py-2.5 text-left hover:bg-[#F8FAFD]">
            <p className="truncate text-[13px] font-medium text-[#1f1f1f]">{t.subject}</p>
            <p className="mt-0.5 truncate text-[12px] text-[#5f6368]">
              {t.fromName}・建議 <span className="font-mono">{t.suggestedCaseIds?.[0]}</span>
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

function CaseMini({ c }: { c: Case }) {
  const s = useStore();
  const st = s.statusOf(c);
  return (
    <div className="rounded-xl border border-ink-200 p-3.5">
      <p className="font-mono text-[12px] text-ink-500">{c.id}</p>
      <p className="mt-1 text-[14px] font-semibold text-ink-900">
        {s.customerOf(c).short}
        {c.site ? ` ${c.site}` : ""} · {c.item}
      </p>
      <div className="mt-2 flex items-center justify-between">
        <StatusPill status={st} />
        <Avatar m={s.memberOf(c.owner)} size={22} />
      </div>
    </div>
  );
}

function Panel({ t }: { t: EmailThread }) {
  const s = useStore();
  const [changing, setChanging] = useState(false);
  const [alt, setAlt] = useState("");
  const [creating, setCreating] = useState(false);
  const all = s.visibleCases;

  const link = (caseId: string, how: string) => {
    s.updateThread(t.id, { state: "linked", caseId, linkedBy: s.me.id, linkedAt: nowStamp() });
    s.log({ module: "Email", caseId, target: t.subject, action: how });
    s.toast(`已歸檔至 ${caseId}`);
  };

  if (t.state === "linked" && t.caseId) {
    const c = s.cases.find((x) => x.id === t.caseId);
    return (
      <div className="space-y-3">
        <p className="flex items-center gap-1.5 text-[12.5px] font-medium text-ink-800">
          <Check className="size-4" />
          已歸檔至案件
        </p>
        {c && <CaseMini c={c} />}
        <p className="text-[11.5px] text-ink-400">
          {s.memberOf(t.linkedBy)?.nickname ?? s.memberOf(t.linkedBy)?.name} 於 {t.linkedAt} 確認
        </p>
        <div className="flex gap-2">
          <Button size="sm" className="flex-1" onClick={() => s.go({ page: "case", id: t.caseId!, tab: "email" })}>
            在系統開啟 <ArrowUpRight className="size-3.5" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => s.updateThread(t.id, { state: "suggested", suggestedCaseIds: [t.caseId!], reasons: t.reasons ?? ["先前由顧問指定"] })}>
            變更
          </Button>
        </div>
      </div>
    );
  }

  if (t.state === "ignored")
    return (
      <div className="space-y-3 text-center">
        <EyeOff className="mx-auto mt-6 size-7 text-ink-300" />
        <p className="text-[13px] font-medium text-ink-700">已忽略這封信的建議</p>
        <Button size="sm" onClick={() => s.updateThread(t.id, { state: "none" })}>
          手動指定案件
        </Button>
      </div>
    );

  if (t.state === "suggested") {
    const primary = s.cases.find((x) => x.id === t.suggestedCaseIds?.[0]);
    return (
      <div className="space-y-4">
        <div>
          <p className="flex items-center gap-1.5 text-[12.5px] font-medium text-ink-700">
            <Sparkles className="size-4 text-brand-500" />
            建議關聯至
          </p>
          <div className="mt-2">{primary && <CaseMini c={primary} />}</div>
        </div>
        <div>
          <p className="text-[11.5px] font-medium text-ink-500">比對依據</p>
          <ul className="mt-1.5 space-y-1">
            {t.reasons?.map((r) => (
              <li key={r} className="flex items-start gap-1.5 text-[12px] text-ink-700">
                <Check className="mt-0.5 size-3.5 shrink-0 text-brand-500" />
                {r}
              </li>
            ))}
          </ul>
        </div>
        {changing ? (
          <div className="space-y-2 rounded-xl border border-ink-200 p-3">
            <p className="text-[12px] font-medium text-ink-700">改選案件</p>
            <Select
              value={alt}
              onChange={setAlt}
              placeholder="選擇案件"
              options={[
                ...(t.suggestedCaseIds ?? []).slice(1).map((id) => ({ value: id, label: `${id}（候選）` })),
                ...all.filter((c) => !t.suggestedCaseIds?.includes(c.id)).map((c) => ({ value: c.id, label: c.id })),
              ]}
            />
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" className="flex-1" onClick={() => setChanging(false)}>
                取消
              </Button>
              <Button size="sm" variant="dark" className="flex-1" disabled={!alt} onClick={() => link(alt, "改選案件後歸檔")}>
                歸檔
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Button variant="brand" className="w-full" icon={<Check className="size-4" />} onClick={() => primary && link(primary.id, "確認系統建議並歸檔")}>
              確認歸檔
            </Button>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => setChanging(true)}>
                改選
              </Button>
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => {
                  s.updateThread(t.id, { state: "ignored" });
                  s.log({ module: "Email", target: t.subject, action: "忽略建議" });
                  s.toast("已忽略", "info");
                }}
              >
                忽略
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 沒有候選案件：指定既有案件，或直接建立新案件
  return creating ? (
    <CreateFromMail t={t} onDone={(id) => link(id, "從信件建立新案件並歸檔")} onCancel={() => setCreating(false)} />
  ) : (
    <div className="space-y-4">
      <div className="rounded-xl bg-ink-50 p-3.5">
        <p className="text-[13px] font-medium text-ink-800">找不到候選案件</p>
      </div>
      <div className="space-y-2">
        <p className="text-[12px] font-medium text-ink-700">指定既有案件</p>
        <Select value={alt} onChange={setAlt} placeholder="搜尋案件" options={all.map((c) => ({ value: c.id, label: c.id }))} />
        <Button size="sm" className="w-full" disabled={!alt} onClick={() => link(alt, "手動指定案件並歸檔")}>
          歸檔到此案件
        </Button>
      </div>
      {s.perms.casesCreate && (
        <>
          <div className="flex items-center gap-2 text-[11.5px] text-ink-400">
            <span className="h-px flex-1 bg-ink-200" />或<span className="h-px flex-1 bg-ink-200" />
          </div>
          <Button variant="dark" className="w-full" icon={<Plus className="size-4" />} onClick={() => setCreating(true)}>
            建立新案件
          </Button>
        </>
      )}
    </div>
  );
}

function CreateFromMail({ t, onDone, onCancel }: { t: EmailThread; onDone: (caseId: string) => void; onCancel: () => void }) {
  const s = useStore();
  const company = t.signature?.find((l) => /公司/.test(l))?.split(" ")[0] ?? "";
  const shortGuess = company.replace(/(股份有限公司|有限公司)$/, "");
  const domain = t.fromEmail.split("@")[1];
  const enGuess = domain.split(".")[0].split("-")[0].toUpperCase();
  const itemGuess = s.settings.items.find((i) => t.subject.includes(i)) ?? "";
  const [short, setShort] = useState(shortGuess);
  const [enCode, setEnCode] = useState(enGuess);
  const [item, setItem] = useState(itemGuess);
  const [year, setYear] = useState("2026");
  const referral = useMemo(() => {
    const m = t.body.join("").match(/經\s*(\S+?)\s*的\s*(\S+?)\s*介紹/);
    return m ? `${m[1]} / ${m[2]}` : "";
  }, [t]);
  const prefix = short && enCode && item ? casePrefix({ enCode }, undefined, item, year) : "";
  const caseId = prefix ? nextCaseId(prefix, s.cases.map((c) => c.id)) : "";

  return (
    <div className="space-y-3">
      <p className="text-[13px] font-semibold text-ink-900">從這封信建立新案件</p>
      <Field label="客戶簡稱">
        <Input value={short} onChange={(e) => setShort(e.target.value)} />
      </Field>
      <Field label="英文代碼">
        <Input value={enCode} onChange={(e) => setEnCode(e.target.value.toUpperCase())} className="font-mono" />
      </Field>
      <Field label="驗證項目">
        <Select value={item} onChange={setItem} placeholder="選擇" options={s.settings.items} />
      </Field>
      <Field label="稽核年度">
        <Select value={year} onChange={setYear} options={["2026", "2027"]} />
      </Field>
      {referral && (
        <p className="text-[11.5px] text-ink-500">
          介紹來源：驗證單位介紹・{referral}
        </p>
      )}
      <div className="rounded-lg border border-dashed border-ink-300 px-3 py-2">
        <p className="text-[11px] text-ink-400">案件編號</p>
        <p className={cn("font-mono text-[13px]", caseId ? "text-ink-900" : "text-ink-300")}>{caseId || "—"}</p>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="ghost" className="flex-1" onClick={onCancel}>
          取消
        </Button>
        <Button
          size="sm"
          variant="dark"
          className="flex-1"
          disabled={!caseId}
          onClick={() => {
            const cu: Customer = {
              id: uid("c"), code: "", enCode, short, pinyin: enCode[0], name: company || short, taxId: "", industry: "", region: "", sites: [],
              contact: { name: t.fromName, title: t.signature?.[0]?.split(" ")[1], phone: t.signature?.[2] ?? "", email: t.fromEmail }, address: "", invoiceTitle: "", invoiceAddress: "",
              referral: { type: referral ? "驗證單位介紹" : "其他", source: referral }, domain, createdAt: nowStamp().slice(0, 10),
            };
            const c: Case = {
              id: caseId, customerId: cu.id, item, category: "新案", year, owner: s.me.id, coOwners: [], verifier: "", contractSessions: 0, review: "none", reviewLog: [],
              pricing: { coaching: { list: 0, base: 0, special: 0 }, audit: { list: 0, base: 0, special: 0 } }, milestones: { audits: [] }, periods: [],
              invoiceItem: `${item} 輔導服務費`, invoiceNote: "", ownerLog: [{ time: nowStamp(), from: "—", to: s.me.id, by: s.me.id }], createdAt: nowStamp().slice(0, 10), createdBy: s.me.id,
            };
            s.addCase(c, cu);
            s.log({ module: "案件", caseId, target: "案件", action: "從 Gmail 建立案件", after: caseId });
            onDone(caseId);
          }}
        >
          建立並歸檔
        </Button>
      </div>
    </div>
  );
}
