import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CalendarCheck, ChevronDown, CopyPlus, Mail, X } from "lucide-react";
import { useStore } from "../../lib/store";
import { createRenewal } from "../../lib/caseOps";
import { milestoneCandidates } from "../../lib/rules";
import type { Case, CaseStatus } from "../../lib/types";
import { STATUSES, STATUS_PHASE, TODAY, cn, daysSince, daysUntil, fmtDate, fmtShort, statusSuggestion } from "../../lib/utils";
import { RECIPIENT_LABEL } from "../../lib/rules";
import { Button, Field, Input, Modal, OptionList, Popover, StatusIcon, ease, statusStroke } from "../../components/ui";

type MKey = "visit" | "proposalSent" | "signed" | "courseStart" | "certified" | "certExpiry";
const LABEL: Record<MKey, string> = { visit: "拜訪日", proposalSent: "企劃書送出日", signed: "回簽日", courseStart: "開課日", certified: "取證日", certExpiry: "證書到期日" };

function useMilestone(c: Case) {
  const s = useStore();
  return {
    set: (k: MKey, v: string | undefined, fromCalendar = false) => {
      const before = c.milestones[k];
      s.updateCase(c.id, (x) => ({ ...x, milestones: { ...x.milestones, [k]: v || undefined } }));
      s.log({ module: "案件", caseId: c.id, target: "里程碑", action: `${fromCalendar ? "採用行事曆日期：" : v ? "登記" : "清除"}${LABEL[k]}`, before: fmtDate(before), after: fmtDate(v) });
    },
    addAudit: (v: string, fromCalendar = false) => {
      s.updateCase(c.id, (x) => ({ ...x, milestones: { ...x.milestones, audits: [...x.milestones.audits, v].sort() } }));
      s.log({ module: "案件", caseId: c.id, target: "里程碑", action: `${fromCalendar ? "採用行事曆日期：" : "登記"}稽核日`, after: fmtDate(v) });
    },
    removeAudit: (v: string) => {
      s.updateCase(c.id, (x) => ({ ...x, milestones: { ...x.milestones, audits: x.milestones.audits.filter((a) => a !== v) } }));
      s.log({ module: "案件", caseId: c.id, target: "里程碑", action: "移除稽核日", before: fmtDate(v) });
    },
  };
}

// 日期欄位：點擊展開日期選擇；Calendar 有對應事件時提供一鍵採用（PRD 3.6）
function DateChip({ value, label, can, candidate, onSave, onClear }: { value?: string; label: string; can: boolean; candidate?: { date: string; title: string }; onSave: (v: string, cal: boolean) => void; onClear?: () => void }) {
  const [draft, setDraft] = useState(value ?? TODAY);
  if (!can) return <span className={cn("text-[12px] tabular-nums", value ? "text-ink-800" : "text-ink-300")}>{value ? fmtShort(value) : "—"}</span>;
  return (
    <Popover
      width={260}
      trigger={({ toggle, open }) => (
        <button
          onClick={() => {
            setDraft(value ?? candidate?.date ?? TODAY);
            toggle();
          }}
          className={cn(
            "rounded-md px-1.5 py-0.5 text-[12px] tabular-nums transition-colors",
            value ? "text-ink-800 hover:bg-ink-100" : "text-ink-400 hover:bg-ink-100 hover:text-ink-700",
            open && "bg-ink-100",
            !value && candidate && "text-brand-700",
          )}
        >
          {value ? fmtShort(value) : candidate ? `行事曆 ${fmtShort(candidate.date)}` : "＋ 登記"}
        </button>
      )}
    >
      {(close) => (
        <div className="space-y-2.5 p-1.5">
          <p className="text-[12px] font-medium text-ink-700">{label}</p>
          {candidate && !value && (
            <button
              onClick={() => {
                onSave(candidate.date, true);
                close();
              }}
              className="flex w-full items-center gap-2 rounded-lg bg-brand-50 px-2.5 py-2 text-left text-[12px] text-brand-800 transition-colors hover:bg-brand-100"
            >
              <CalendarCheck className="size-3.5 shrink-0" />
              <span className="min-w-0 flex-1 truncate">
                {fmtDate(candidate.date)} {candidate.title}
              </span>
              <span className="font-semibold">採用</span>
            </button>
          )}
          <Input type="date" value={draft} onChange={(e) => setDraft(e.target.value)} />
          <div className="flex justify-end gap-1.5">
            {value && onClear && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  onClear();
                  close();
                }}
              >
                清除
              </Button>
            )}
            <Button
              size="sm"
              variant="dark"
              disabled={!draft}
              onClick={() => {
                onSave(draft, false);
                close();
              }}
            >
              儲存
            </Button>
          </div>
        </div>
      )}
    </Popover>
  );
}

// 案件進度：10 種狀態（PRD 3.9.4）與各階段的里程碑日期集中在同一處
export function ProgressPanel({ c, goReview }: { c: Case; goReview: () => void }) {
  const s = useStore();
  const st = s.statusOf(c);
  const idx = STATUSES.indexOf(st);
  const m = c.milestones;
  const ms = useMilestone(c);
  const can = s.perms.casesEdit;
  const [target, setTarget] = useState<CaseStatus | null>(null);
  const suggestion = statusSuggestion(c, s.settings);
  const cand = milestoneCandidates(c, s.customerOf(c), s.events);
  const color = "#32716A";
  // 收合狀態記在本機，下次打開案件頁沿用
  const [open, setOpenState] = useState(() => {
    try {
      return localStorage.getItem("progress-open") !== "0";
    } catch {
      return true;
    }
  });
  const setOpen = (v: boolean) => {
    setOpenState(v);
    try {
      localStorage.setItem("progress-open", v ? "1" : "0");
    } catch {
      /* 無法寫入時只影響本次 */
    }
  };
  const phases = [...new Set(STATUSES.map((x) => STATUS_PHASE[x]))];
  const reviewDate = (action: string) => {
    const r = [...c.reviewLog].reverse().find((x) => x.action === action);
    return r ? r.time.slice(5, 10).replace("/", "/") : undefined;
  };
  const chip = (k: MKey, candidate?: { date: string; event: { title: string } }) => (
    <DateChip value={m[k]} label={LABEL[k]} can={can} candidate={candidate && { date: candidate.date, title: candidate.event.title }} onSave={(v, cal) => ms.set(k, v, cal)} onClear={() => ms.set(k, undefined)} />
  );
  const cells: React.ReactNode[] = [
    chip("visit", cand.visit),
    <span className="text-[12px] text-ink-400">{c.review === "drafting" ? "撰寫中" : c.review === "none" ? "—" : "完成"}</span>,
    <span className="text-[12px] tabular-nums text-ink-500">{reviewDate("內容核可") ?? "—"}</span>,
    <span className="text-[12px] tabular-nums text-ink-500">{reviewDate("核價核可") ?? "—"}</span>,
    chip("proposalSent"),
    chip("signed"),
    chip("courseStart", cand.courseStart),
    <div className="flex flex-wrap items-center gap-0.5">
      {m.audits.map((a) => (
        <span key={a} className="group flex items-center rounded-md text-[12px] tabular-nums text-ink-800">
          {fmtShort(a)}
          {can && (
            <button onClick={() => ms.removeAudit(a)} className="ml-0.5 hidden rounded p-0.5 text-ink-400 hover:bg-ink-100 group-hover:block" aria-label="移除">
              <X className="size-3" />
            </button>
          )}
        </span>
      ))}
      {m.audits.length < 4 && (
        <DateChip label="稽核日（最多 4 次）" can={can} candidate={cand.audit && { date: cand.audit.date, title: cand.audit.event.title }} onSave={(v, cal) => ms.addAudit(v, cal)} />
      )}
    </div>,
    chip("certified"),
    chip("certExpiry"),
  ];
  const cellLabel = ["拜訪", "", "內容核可", "核價核可", "送出", "回簽", "開課", "稽核", "取證", "到期"];
  const toggle = (
    <button
      onClick={() => setOpen(!open)}
      className="grid size-7 shrink-0 place-items-center rounded-md text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
      aria-label={open ? "收合進度" : "展開進度"}
    >
      <ChevronDown className={cn("size-4 transition-transform duration-200", open && "rotate-180")} />
    </button>
  );

  return (
    <div className="rounded-xl border border-ink-200 bg-white shadow-card">
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22, ease }} className="overflow-hidden">
      <div className="px-5 pb-3 pt-4">
        <div className="grid gap-x-1" style={{ gridTemplateColumns: "repeat(10, minmax(0, 1fr))" }}>
          {phases.map((ph) => {
            const span = STATUSES.filter((x) => STATUS_PHASE[x] === ph).length;
            return (
              <p key={ph} className={cn("mb-2 truncate text-[11px] font-medium", STATUS_PHASE[st] === ph ? "text-ink-900" : "text-ink-400")} style={{ gridColumn: `span ${span}` }}>
                {ph}
              </p>
            );
          })}
          {STATUSES.map((x, i) => (
            <div key={x} className="min-w-0">
              <div className="h-1.5 overflow-hidden rounded-full bg-ink-100">
                <motion.div className="h-full rounded-full" style={{ background: i <= idx ? color : undefined, opacity: i < idx ? 0.45 : 1 }} initial={{ width: 0 }} animate={{ width: i <= idx ? "100%" : 0 }} transition={{ duration: 0.4, delay: i * 0.03, ease }} />
              </div>
              <button
                disabled={!can || i === idx}
                onClick={() => setTarget(x)}
                className={cn("mt-1 block max-w-full truncate rounded px-1 py-0.5 -mx-1 text-left text-[11.5px] transition-colors enabled:hover:bg-ink-100 disabled:cursor-default", i === idx ? "font-semibold text-ink-900" : i < idx ? "text-ink-500" : "text-ink-300 enabled:hover:text-ink-700")}
              >
                {x}
              </button>
              <div className="mt-1.5 min-h-[22px]">
                {cellLabel[i] && <p className="text-[10.5px] text-ink-400">{cellLabel[i]}</p>}
                {cells[i]}
              </div>
            </div>
          ))}
        </div>
      </div>
          </motion.div>
        )}
      </AnimatePresence>
      {suggestion && can && (
        <div className="flex items-center gap-3 border-t border-ink-100 bg-brand-50/40 px-5 py-2 text-[12.5px]">
          <span className="flex-1 text-ink-700">依登記資料：{suggestion}</span>
          <Button size="sm" variant="ghost" onClick={() => setTarget(suggestion)}>
            採用
          </Button>
        </div>
      )}
      <CurrentAction c={c} goReview={goReview} collapsed={!open} idx={idx} toggle={toggle} onJump={setTarget} />
      {target && <JumpModal c={c} target={target} onClose={() => setTarget(null)} />}
    </div>
  );
}

function CurrentAction({ c, goReview, collapsed, idx, toggle, onJump }: { c: Case; goReview: () => void; collapsed: boolean; idx: number; toggle: React.ReactNode; onJump: (st: CaseStatus) => void }) {
  const s = useStore();
  const st = s.statusOf(c);
  const m = c.milestones;
  const ms = useMilestone(c);
  const [certOpen, setCertOpen] = useState(false);
  const can = s.perms.casesEdit;
  const renewed = s.cases.find((x) => x.previousCase === c.id);
  let text = "";
  let action: React.ReactNode = null;

  if (st === "洽詢中") {
    text = m.visit ? `已於 ${fmtDate(m.visit)} 拜訪` : "尚未登記拜訪";
  } else if (st === "企劃書撰寫中" || st === "內容審核中" || st === "核價審核中") {
    const last = c.reviewLog[c.reviewLog.length - 1];
    text = last?.action === "退回" ? `${last.stage}審核退回` : st;
    action = (
      <Button size="sm" onClick={goReview}>
        企劃書審核與報價
      </Button>
    );
  } else if (st === "已報價待回簽") {
    text = m.proposalSent ? `企劃書已送出 ${daysSince(m.proposalSent)} 天` : "核價已核可，企劃書尚未送出";
  } else if (st === "已簽約排課中") {
    text = `${fmtDate(m.signed)} 回簽`;
  } else if (st === "輔導中") {
    text = `${fmtDate(m.courseStart)} 開課`;
  } else if (st === "稽核中") {
    text = `已稽核 ${m.audits.length} 次`;
    action = can && (
      <Button size="sm" onClick={() => setCertOpen(true)}>
        登記取證
      </Button>
    );
  } else if (st === "已取證") {
    text = m.certExpiry ? `證書 ${daysUntil(m.certExpiry)} 天後到期` : "尚未登記證書到期日";
  } else if (st === "續證期") {
    text = renewed ? `已建立續證案件 ${renewed.id}` : c.noRenew ? "本次不續證" : `證書 ${daysUntil(m.certExpiry!)} 天後到期`;
    if (!renewed && !c.noRenew)
      action = (
        <div className="flex gap-2">
          {s.me.role === "主管" && s.perms.reviewPrice && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                s.updateCase(c.id, (x) => ({ ...x, noRenew: true }));
                s.log({ module: "案件", caseId: c.id, target: "續證", action: "標記本次不續證" });
              }}
            >
              本次不續證
            </Button>
          )}
          {s.perms.casesCreate && (
            <Button
              size="sm"
              variant="dark"
              icon={<CopyPlus className="size-3.5" />}
              onClick={() => {
                const n = createRenewal(s, c);
                s.toast(`已建立續證案件 ${n.id}`);
                s.go({ page: "case", id: n.id });
              }}
            >
              建立續證案件
            </Button>
          )}
        </div>
      );
  }

  return (
    <AnimatePresence initial={false} mode="wait">
      <motion.div key={st + text} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className={cn("flex min-h-[48px] items-center gap-3 border-t border-ink-100 px-5 py-2.5", st === "續證期" && !renewed && !c.noRenew && "bg-amber-50/50")}>
        {collapsed ? (
          <span className="flex shrink-0 items-center gap-2.5">
            <span className="flex gap-0.5">
              {STATUSES.map((x, i) => (
                <span key={x} className="h-1.5 w-3.5 rounded-full" style={{ background: i <= idx ? "#32716A" : "#ECEFEF", opacity: i < idx ? 0.45 : 1 }} />
              ))}
            </span>
            <span className="text-[13px] font-semibold text-ink-900">{st}</span>
            <span className="h-4 w-px bg-ink-200" />
          </span>
        ) : (
          <span className="size-1.5 shrink-0 rounded-full bg-brand-500" />
        )}
        <p className="flex-1 text-[13px] text-ink-700">{text}</p>
        {action}
        {can && <JumpControls st={st} onJump={onJump} />}
        {toggle}
        <CertModal open={certOpen} onClose={() => setCertOpen(false)} c={c} onSave={(cert, exp) => {
          ms.set("certified", cert);
          if (exp) ms.set("certExpiry", exp);
        }} />
      </motion.div>
    </AnimatePresence>
  );
}

function CertModal({ open, onClose, c, onSave }: { open: boolean; onClose: () => void; c: Case; onSave: (cert: string, exp?: string) => void }) {
  const [cert, setCert] = useState(c.milestones.certified ?? TODAY);
  const [exp, setExp] = useState(c.milestones.certExpiry ?? "");
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="登記取證"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button
            variant="dark"
            disabled={!cert}
            onClick={() => {
              onSave(cert, exp || undefined);
              onClose();
            }}
          >
            儲存
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <Field label="取證日">
          <Input type="date" value={cert} onChange={(e) => setCert(e.target.value)} />
        </Field>
        <Field label="證書到期日">
          <Input type="date" value={exp} onChange={(e) => setExp(e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}


// 進入各狀態時通常會一併登記的日期；跳到某狀態時，跳過與到達的階段若沒登記，提醒可以順手補上
const STATUS_FIELDS: Partial<Record<CaseStatus, { key: "visit" | "proposalSent" | "signed" | "courseStart" | "audit" | "certified" | "certExpiry"; label: string }[]>> = {
  已報價待回簽: [{ key: "proposalSent", label: "企劃書送出日" }],
  已簽約排課中: [{ key: "signed", label: "回簽日" }],
  輔導中: [{ key: "courseStart", label: "開課日" }],
  稽核中: [{ key: "audit", label: "稽核日" }],
  已取證: [{ key: "certified", label: "取證日" }, { key: "certExpiry", label: "證書到期日" }],
  續證期: [{ key: "certExpiry", label: "證書到期日" }],
};

// 目前狀態列右側：下一步，或改為任一狀態
function JumpControls({ st, onJump }: { st: CaseStatus; onJump: (st: CaseStatus) => void }) {
  const next = STATUSES[STATUSES.indexOf(st) + 1];
  return (
    <div className="flex shrink-0 items-center">
      {next && (
        <Button size="sm" variant="outline" className="rounded-r-none" icon={<ArrowRight className="size-3.5" />} onClick={() => onJump(next)}>
          下一步：{next}
        </Button>
      )}
      <Popover
        align="right"
        width={220}
        scroll={false}
        trigger={({ toggle }) => (
          <Button size="sm" variant="outline" className={cn(next && "-ml-px rounded-l-none px-2")} onClick={toggle} aria-label="改為其他狀態">
            {!next && "改為其他狀態"}
            <ChevronDown className="size-3.5" />
          </Button>
        )}
      >
        {(close) => (
          <OptionList
            options={STATUSES.map((x) => ({ value: x, label: x }))}
            selected={[st]}
            onPick={(x) => {
              close();
              if (x !== st) onJump(x as CaseStatus);
            }}
          />
        )}
      </Popover>
    </div>
  );
}

// 改狀態確認：列出跳過的階段、建議補登的日期與會寄出的 Email；可補登後改，也可不補直接改
function JumpModal({ c, target, onClose }: { c: Case; target: CaseStatus; onClose: () => void }) {
  const s = useStore();
  const ms = useMilestone(c);
  const from = s.statusOf(c);
  const i = STATUSES.indexOf(from);
  const j = STATUSES.indexOf(target);
  const forward = j > i;
  const skipped = forward ? STATUSES.slice(i + 1, j) : [];
  const missing = forward
    ? STATUSES.slice(i + 1, j + 1)
        .flatMap((x) => (STATUS_FIELDS[x] ?? []).map((f) => ({ ...f, status: x })))
        .filter((f, k, arr) => arr.findIndex((y) => y.key === f.key) === k)
        .filter((f) => (f.key === "audit" ? c.milestones.audits.length === 0 : !c.milestones[f.key]))
    : [];
  const [vals, setVals] = useState<Record<string, string>>({});
  const filled = missing.filter((f) => vals[f.key]);
  const mails = s.emailImpact(c.id, target);
  const apply = (withData: boolean) => {
    if (withData)
      filled.forEach((f) => {
        if (f.key === "audit") ms.addAudit(vals[f.key]);
        else ms.set(f.key, vals[f.key]);
      });
    s.setStatus(c.id, target);
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      width={520}
      title={`改為「${target}」`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          {missing.length > 0 && (
            <Button onClick={() => apply(false)}>
              {filled.length ? "不補登，直接改" : "仍要直接改"}
            </Button>
          )}
          <Button variant="dark" disabled={missing.length > 0 && !filled.length} onClick={() => apply(true)}>
            {missing.length ? "補登並改為此狀態" : mails.length ? "確認並寄出" : "確認"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2 text-[13px]">
          <span className="flex items-center gap-1.5 text-ink-500">
            <StatusIcon status={from} size={13} />
            {from}
          </span>
          <ArrowRight className="size-3.5 text-ink-400" />
          <span className="flex items-center gap-1.5 font-semibold text-ink-900">
            <StatusIcon status={target} size={13} />
            {target}
          </span>
        </div>
        {skipped.length > 0 && (
          <div>
            <p className="mb-1.5 text-[12.5px] font-medium text-ink-600">會跳過</p>
            <div className="flex flex-wrap gap-1.5">
              {skipped.map((x) => (
                <span key={x} className="inline-flex h-6 items-center rounded-full border border-ink-200 px-2.5 text-[12px] text-ink-600">
                  {x}
                </span>
              ))}
            </div>
          </div>
        )}
        {missing.length > 0 && (
          <div>
            <p className="mb-1.5 text-[12.5px] font-medium text-ink-600">尚未登記的日期</p>
            <div className="divide-y divide-ink-100 rounded-xl border border-ink-200">
              {missing.map((f) => (
                <div key={f.key} className="grid grid-cols-[minmax(0,1fr)_160px] items-center gap-3 px-3.5 py-2.5">
                  <span className="text-[13px] text-ink-800">
                    {f.label}
                    <span className="ml-1.5 text-[11.5px] text-ink-400">{f.status}</span>
                  </span>
                  <Input type="date" value={vals[f.key] ?? ""} onChange={(e) => setVals({ ...vals, [f.key]: e.target.value })} className="h-8 text-[12.5px]" />
                </div>
              ))}
            </div>
          </div>
        )}
        {mails.length > 0 && (
          <div>
            <p className="mb-1.5 text-[12.5px] font-medium text-ink-600">會寄出 Email</p>
            <div className="divide-y divide-ink-100 rounded-xl border border-ink-200">
              {mails.map((m) => (
                <div key={m.key} className="flex items-center gap-3 px-3.5 py-2.5 text-[13px]">
                  <Mail className="size-4 shrink-0 text-ink-400" />
                  <span className="flex-1 text-ink-900">{m.type}</span>
                  <span className="text-ink-500">{m.recipients.map((r) => RECIPIENT_LABEL[r]).join("、")}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
