import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, CheckCircle2, Clock, Ellipsis, MailCheck, Plus, Send, ShieldCheck, Trash2, UserPlus, X } from "lucide-react";
import { displayName, useStore } from "../../lib/store";
import { PRESETS, ROLES, countOn, totalPerms } from "../../lib/perms";
import type { Member, RolePreset } from "../../lib/types";
import { Avatar, Badge, Button, MenuItem, Modal, Popover, SearchInput, Segmented, Table, td, th } from "../../components/ui";
import { cn, openParam, param } from "../../lib/utils";
import { MemberDrawer } from "./MemberPermissions";
import { FilterChips, FilterMenu, Toolbar, pass, useFacets, type Facet } from "../../components/filters";


export function MembersPage({ initialId }: { initialId?: string }) {
  const s = useStore();
  const [editing, setEditing] = useState<string | null>(initialId ?? param("drawer"));
  const [q, setQ] = useState("");
  const f = useFacets();
  const [inviting, setInviting] = useState(openParam("invite"));
  const list = useMemo(
    () =>
      s.members.filter(
        (m) =>
          pass(f.value, "status", m.status) &&
          pass(f.value, "role", m.role) &&
          (!q || [m.name, m.email, m.nickname ?? "", m.title].some((x) => x.toLowerCase().includes(q.toLowerCase()))),
      ),
    [s.members, q, f.value],
  );
  const facets: Facet[] = [
    { key: "status", label: "狀態", options: [{ value: "active", label: "已加入" }, { value: "invited", label: "邀請中" }].map((o) => ({ ...o, hint: String(s.members.filter((m) => m.status === o.value).length) })) },
    { key: "role", label: "權限層級", options: ROLES.map((r) => ({ value: r, label: r, hint: String(s.members.filter((m) => m.role === r).length) })) },
  ];

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-[16px] font-semibold text-ink-900">成員與權限</h2>
        </div>
        <Button variant="dark" icon={<UserPlus className="size-4" />} onClick={() => setInviting(true)}>
          邀請成員
        </Button>
      </div>
      <div className="mt-5">
        <Toolbar
          search={<SearchInput value={q} onChange={setQ} placeholder="搜尋姓名、Email、職稱" className="w-72" />}
          filter={<FilterMenu facets={facets} f={f} />}
          count={`${list.length} 位`}
        />
        <FilterChips facets={facets} f={f} />
      </div>
      <Table>
        <thead>
          <tr>
            <th className={cn(th, "px-5 pl-6")}>成員</th>
            <th className={cn(th, "px-5")}>職稱</th>
            <th className={cn(th, "px-5")}>權限層級</th>
            <th className={cn(th, "px-5")}>權限</th>
            <th className={cn(th, "px-5")}>狀態</th>
            <th className={cn(th, "px-5")}>最近活動</th>
            <th className={cn(th, "w-12")} />
          </tr>
        </thead>
        <tbody>
          {list.map((m) => (
            <tr key={m.id} className={cn("cursor-pointer transition-colors hover:bg-ink-25", editing === m.id && "bg-ink-50")} onClick={() => setEditing(m.id)}>
              <td className={cn(td, "h-auto px-5 py-4 pl-6")}>
                <div className="flex items-center gap-3.5">
                  <Avatar m={m} size={36} />
                  <div className="min-w-0 space-y-0.5">
                    <p className="flex items-center gap-2 font-medium text-ink-900">
                      {m.status === "invited" && m.name.includes(".") ? m.email.split("@")[0] : displayName(m)}
                      {m.isOwner && <Badge tone="outline">擁有者</Badge>}
                      {m.id === s.me.id && <span className="text-[11.5px] font-normal text-ink-400">（你）</span>}
                    </p>
                    <p className="text-[12px] text-ink-500">{m.email}</p>
                  </div>
                </div>
              </td>
              <td className={cn(td, "h-auto px-5 py-4")}>{m.status === "invited" ? <span className="text-ink-300">待填寫</span> : m.title}</td>
              <td className={cn(td, "h-auto px-5 py-4")}>
                <Badge tone="outline">{m.role}</Badge>
              </td>
              <td className={cn(td, "h-auto px-5 py-4")}>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-ink-100">
                    <div className="h-full rounded-full bg-ink-700 transition-[width] duration-500" style={{ width: `${(countOn(m.perms) / totalPerms) * 100}%` }} />
                  </div>
                  <span className="text-[12px] tabular-nums text-ink-500">
                    {countOn(m.perms)}/{totalPerms}
                  </span>
                </div>
              </td>
              <td className={cn(td, "h-auto px-5 py-4")}>
                {m.status === "active" ? (
                  <Badge tone="green">已加入</Badge>
                ) : (
                  <Badge tone="amber">邀請中・{m.invitedAt?.slice(5)}</Badge>
                )}
              </td>
              <td className={cn(td, "h-auto px-5 py-4 text-ink-500")}>{m.lastActive ?? "—"}</td>
              <td className={td} onClick={(e) => e.stopPropagation()}>
                <Popover
                  align="right"
                  width={220}
                  trigger={({ toggle }) => (
                    <button onClick={toggle} className="grid size-8 place-items-center rounded-lg text-ink-400 hover:bg-ink-100 hover:text-ink-700">
                      <Ellipsis className="size-4" />
                    </button>
                  )}
                >
                  {(close) => (
                    <>
                      <MenuItem icon={<ShieldCheck />} onClick={() => setEditing(m.id)}>
                        編輯權限
                      </MenuItem>
                      {m.status === "invited" && (
                        <>
                          <MenuItem
                            icon={<Send />}
                            onClick={() => {
                              s.toast(`已重新寄送邀請至 ${m.email}`);
                              close();
                            }}
                          >
                            重新寄送邀請
                          </MenuItem>
                          <MenuItem icon={<ArrowUpRight />} onClick={() => s.openInvite(m.id)}>
                            開啟邀請連結
                          </MenuItem>
                        </>
                      )}
                      {!m.isOwner && (
                        <MenuItem
                          danger
                          icon={<Trash2 />}
                          onClick={() => {
                            s.removeMember(m.id);
                            s.log({ module: "成員與權限", target: m.email, action: m.status === "invited" ? "取消邀請" : "移除成員" });
                            s.toast(m.status === "invited" ? "已取消邀請" : "已移除成員");
                            close();
                          }}
                        >
                          {m.status === "invited" ? "取消邀請" : "移除成員"}
                        </MenuItem>
                      )}
                    </>
                  )}
                </Popover>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      <InviteModal open={inviting} onClose={() => setInviting(false)} />
      <MemberDrawer id={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

function InviteModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useStore();
  const [emails, setEmails] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [role, setRole] = useState<RolePreset>("顧問");
  const [sent, setSent] = useState<Member[] | null>(null);
  const [error, setError] = useState("");

  const reset = () => {
    setEmails([]);
    setDraft("");
    setRole("顧問");
    setSent(null);
    setError("");
  };
  const close = () => {
    onClose();
    setTimeout(reset, 200);
  };
  const addDraft = () => {
    const parts = draft.split(/[\s,;]+/).filter(Boolean);
    const bad = parts.find((p) => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(p));
    if (bad) return setError(`「${bad}」不是有效的 Email`);
    const dup = parts.find((p) => s.members.some((m) => m.email === p));
    if (dup) return setError(`${dup} 已經是成員或已在邀請中`);
    setEmails((e) => [...new Set([...e, ...parts])]);
    setDraft("");
    setError("");
  };
  const send = () => {
    const all = draft.trim() ? [...emails, ...draft.split(/[\s,;]+/).filter(Boolean)] : emails;
    if (!all.length) return setError("請輸入至少一個 Email");
    if (all.some((p) => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(p))) return setError("請確認 Email 格式");
    setSent(s.inviteMembers([...new Set(all)], role));
  };

  return (
    <Modal
      open={open}
      onClose={close}
      width={600}
      title={sent ? "邀請已寄出" : "邀請成員"}
      footer={
        sent ? (
          <>
            <Button variant="ghost" onClick={reset}>
              繼續邀請
            </Button>
            <Button variant="dark" onClick={close}>
              完成
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={close}>
              取消
            </Button>
            <Button variant="brand" icon={<Send className="size-4" />} onClick={send}>
              寄送邀請{emails.length > 1 ? `（${emails.length}）` : ""}
            </Button>
          </>
        )
      }
    >
      {sent ? (
        <div className="animate-rise">
          <div className="flex flex-col items-center py-2 text-center">
            <MailCheck className="size-9 stroke-[1.5] text-brand-600" />
            <p className="mt-4 text-[16px] font-semibold text-ink-900">已寄送 {sent.length} 封邀請郵件</p>
          </div>
          <div className="mt-5 divide-y divide-ink-100 rounded-xl border border-ink-200">
            {sent.map((m) => (
              <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar m={{ name: m.email, color: m.color }} size={30} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-ink-900">{m.email}</p>
                  <p className="flex items-center gap-1.5 text-[12px] text-ink-500">
                    <CheckCircle2 className="size-3.5 text-brand-500" />
                    已寄送・{m.role}
                  </p>
                </div>
                <button onClick={() => s.openInvite(m.id)} className="flex items-center gap-1 rounded-lg border border-ink-200 px-2.5 py-1.5 text-[12.5px] font-medium text-ink-800 transition hover:bg-ink-50">
                  開啟邀請連結
                  <ArrowUpRight className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div>
            <p className="mb-1.5 text-[12.5px] font-medium text-ink-700">Email</p>
            <div
              className={cn(
                "flex min-h-[44px] flex-wrap items-center gap-1.5 rounded-lg border bg-white px-2 py-1.5 shadow-card focus-within:border-ink-400 focus-within:ring-[3px] focus-within:ring-ink-100",
                error ? "border-rose-300" : "border-ink-200",
              )}
            >
              {emails.map((e) => (
                <span key={e} className="flex items-center gap-1 rounded-md bg-ink-100 py-1 pl-2 pr-1 text-[12.5px] text-ink-800">
                  {e}
                  <button onClick={() => setEmails((x) => x.filter((y) => y !== e))} className="rounded p-0.5 text-ink-400 hover:bg-ink-200 hover:text-ink-700" aria-label="移除">
                    <X className="size-3" />
                  </button>
                </span>
              ))}
              <input
                id="invite-email"
                value={draft}
                autoFocus
                onChange={(e) => {
                  setDraft(e.target.value);
                  setError("");
                }}
                onKeyDown={(e) => {
                  if (["Enter", ",", " "].includes(e.key) && draft.trim()) {
                    e.preventDefault();
                    addDraft();
                  }
                  if (e.key === "Backspace" && !draft && emails.length) setEmails((x) => x.slice(0, -1));
                }}
                placeholder={emails.length ? "" : "name@staygold-demo.com"}
                className="h-7 min-w-[200px] flex-1 bg-transparent px-1 text-[13px] outline-none placeholder:text-ink-400"
              />
            </div>
            {error ? <p className="mt-1.5 text-[12px] text-rose-600">{error}</p> : null}
          </div>
          <div>
            <p className="mb-1.5 text-[12.5px] font-medium text-ink-700">權限層級</p>
            <div className="grid grid-cols-3 gap-2">
              {ROLES.map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={cn(
                    "rounded-xl border px-3.5 py-3 text-left transition duration-150",
                    role === r ? "border-brand-500 bg-brand-50/40 ring-1 ring-brand-500" : "border-ink-200 hover:border-ink-300 hover:bg-ink-25",
                  )}
                >
                  <span className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-ink-900">{r}</span>
                    <span className="text-[11.5px] tabular-nums text-ink-400">
                      {countOn(PRESETS[r])}/{totalPerms} 項
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
