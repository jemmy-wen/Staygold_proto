import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Clock, Lock, RotateCcw, Send, ShieldCheck } from "lucide-react";
import { displayName, useStore } from "../../lib/store";
import { PERM_GROUPS, PRESETS, ROLES, countOn, totalPerms } from "../../lib/perms";
import type { Perms, RolePreset } from "../../lib/types";
import { Avatar, Badge, Button, Drawer, Segmented, Select, Switch, ease } from "../../components/ui";
import { useLeaveGuard } from "../../components/grid";
import { cn } from "../../lib/utils";

const LABEL: Record<string, string> = Object.fromEntries(PERM_GROUPS.flatMap((g) => g.items.map((i) => [i.key, i.label])));

export function MemberDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const s = useStore();
  const m = s.members.find((x) => x.id === id);
  const [draft, setDraft] = useState<Perms | null>(null);
  const [role, setRole] = useState<RolePreset>("顧問");
  useEffect(() => {
    if (m) {
      setDraft({ ...m.perms });
      setRole(m.role);
    }
  }, [m?.id]);

  const changes = useMemo(() => (m && draft ? (Object.keys(draft) as (keyof Perms)[]).filter((k) => draft[k] !== m.perms[k]) : []), [m, draft]);
  const dirty = !!m && (changes.length > 0 || role !== m.role);
  const matchesPreset = draft && JSON.stringify(draft) === JSON.stringify(PRESETS[role]);
  // 擁有者固定保有成員與權限、系統設定，避免沒有人能管理工作空間；其餘可依實際分工調整
  const owner = !!m?.isOwner;
  const fixed = (k: keyof Perms) => owner && (k === "members" || k === "settings");
  const set = (k: keyof Perms, v: boolean | "all" | "own") => setDraft((d) => (d ? { ...d, [k]: v } : d));

  const save = () => {
    if (!m || !draft) return;
    s.updateMember(m.id, (x) => ({ ...x, perms: draft, role }));
    const summary = changes
      .slice(0, 4)
      .map((k) => (k === "casesScope" ? `案件範圍→${draft.casesScope === "all" ? "全部" : "僅參與"}` : `${LABEL[k]}${draft[k] ? "開啟" : "關閉"}`))
      .join("、");
    s.log({ module: "成員與權限", target: m.name, action: "調整權限", before: role !== m.role ? m.role : undefined, after: (summary + (changes.length > 4 ? ` 等 ${changes.length} 項` : "")) || role });
    s.toast(`已更新 ${m.nickname ?? m.name} 的權限`);
    onClose();
  };

  useLeaveGuard(dirty ? changes.length + (m && role !== m.role ? 1 : 0) : 0, save, () => m && (setDraft({ ...m.perms }), setRole(m.role)));
  const close = () => s.guarded(onClose);

  return (
    <Drawer
      open={!!m}
      onClose={close}
      width={600}
      title="成員權限"
      footer={
        m && (
          <>
            <AnimatePresence>
              {dirty && (
                <motion.span initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="text-[12.5px] text-ink-600">
                  {changes.length + (role !== m.role ? 1 : 0)} 項未儲存的變更
                </motion.span>
              )}
            </AnimatePresence>
            <div className="flex-1" />
            <Button variant="ghost" onClick={close}>
              取消
            </Button>
            <Button variant="dark" disabled={!dirty} onClick={save}>
              儲存變更
            </Button>
          </>
        )
      }
    >
      {m && draft && (
        <div className="space-y-5 px-6 py-5">
          <div className="flex items-center gap-3.5">
            <Avatar m={m} size={44} />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-[15px] font-semibold text-ink-900">
                {displayName(m)}
                {m.isOwner && <Badge tone="outline">擁有者</Badge>}
                {m.status === "invited" && (
                  <Badge tone="amber">邀請中</Badge>
                )}
              </p>
              <p className="text-[12.5px] text-ink-500">
                {m.email}
                {m.status === "active" && `・${m.title}`}
              </p>
            </div>
            {m.status === "invited" && (
              <div className="flex gap-1.5">
                <Button size="sm" icon={<Send className="size-3.5" />} onClick={() => s.toast(`已重新寄送邀請至 ${m.email}`)}>
                  重寄
                </Button>
                <Button size="sm" variant="soft" onClick={() => s.openInvite(m.id)}>
                  開啟邀請連結 <ArrowUpRight className="size-3.5" />
                </Button>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-ink-200 p-4">
            <div className="flex items-center justify-between gap-4">
              <p className="text-[13.5px] font-semibold text-ink-900">權限層級</p>
              <div className="flex items-center gap-1.5">
                {!matchesPreset && (
                  <Button size="md" variant="ghost" icon={<RotateCcw className="size-3.5" />} onClick={() => setDraft({ ...PRESETS[role] })}>
                    還原預設
                  </Button>
                )}
                <Select
                  value={role}
                  disabled={owner}
                  onChange={(v) => {
                    setRole(v as RolePreset);
                    setDraft({ ...PRESETS[v as RolePreset] });
                  }}
                  options={ROLES}
                  className="w-32"
                />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-[12px] text-ink-500">
              <Badge tone={matchesPreset ? "gray" : "amber"}>{matchesPreset ? "預設" : "已自訂"}</Badge>
              <span className="ml-auto tabular-nums">
                {countOn(draft)}/{totalPerms} 項
              </span>
            </div>
          </div>

          {PERM_GROUPS.map((g) => (
            <section key={g.title}>
              <p className="mb-2 px-1 text-[12.5px] font-semibold text-ink-900">{g.title}</p>
              <div className="divide-y divide-ink-100 rounded-xl border border-ink-200">
                {g.items.map((i) => {
                  const parentOff = !!i.parent && !draft[i.parent];
                  const on = draft[i.key] === true;
                  return (
                    <div key={i.key}>
                      <label htmlFor={`perm-${i.key}`} className={cn("flex cursor-pointer items-center gap-4 px-4 py-3 transition-colors duration-100 hover:bg-ink-25", (fixed(i.key) || parentOff) && "cursor-not-allowed hover:bg-transparent")}>
                        <div className={cn("min-w-0 flex-1 transition-opacity duration-200", parentOff && "opacity-40")}>
                          <p className="flex items-center gap-2 text-[13px] font-medium text-ink-900">
                            {i.label}
                            <AnimatePresence>
                              {changes.includes(i.key) && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="size-1.5 rounded-full bg-amber-500" title="未儲存" />}
                            </AnimatePresence>
                          </p>
                          <p className="text-[12px] text-ink-500">
                            {i.desc}
                            
                          </p>
                        </div>
                        <Switch id={`perm-${i.key}`} checked={on && !parentOff} disabled={fixed(i.key) || parentOff} onChange={(v) => set(i.key, v)} />
                      </label>
                      <AnimatePresence initial={false}>
                        {i.key === "cases" && draft.cases && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22, ease }} className="overflow-hidden">
                            <div className="flex items-center justify-between gap-4 border-t border-ink-100 bg-ink-25 px-4 py-3 pl-8">
                              <p className="text-[12.5px] font-medium text-ink-800">案件範圍</p>
                              <Segmented
                                size="sm"
                                value={draft.casesScope}
                                onChange={(v) => set("casesScope", v)}
                                items={[
                                  { value: "all", label: "全部案件" },
                                  { value: "own", label: "僅參與的案件" },
                                ]}
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </Drawer>
  );
}
