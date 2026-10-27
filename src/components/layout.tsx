import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  Briefcase,
  Building2,
  Car,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  CircleCheck,
  Eye,
  History,
  Info,
  Repeat,
  UserRound,
  Users,
  LayoutDashboard,
  LogOut,
  Mail,
  RotateCcw,
  Search,
  Settings,
  TriangleAlert,
  UserPlus,
  Wallet,
} from "lucide-react";
import { DEMO_ACCOUNTS, useStore, type Route } from "../lib/store";
import { cn, openParam } from "../lib/utils";
import { Avatar, Badge, Button, Field, Input, Kbd, MenuItem, Modal, Popover, Segmented, ease, spring } from "./ui";
import { BrandMark } from "./brand";
import { SaveBar } from "./grid";
import { NotifIcon } from "../pages/Notifications";

function NavItem({ icon, label, active, count, onClick, strong }: { icon: ReactNode; label: string; active?: boolean; count?: number; onClick: () => void; strong?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn("relative flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-[13.5px] transition-colors duration-150", active ? "font-semibold text-brand-700" : "text-ink-600 hover:bg-ink-50 hover:text-ink-900")}
    >
      {active && <motion.span layoutId="nav-active" transition={spring} className="absolute inset-0 rounded-lg bg-brand-50" />}
      <span className={cn("relative [&>svg]:size-[17px]", active ? "text-brand-600" : "text-ink-400")}>{icon}</span>
      <span className="relative flex-1 truncate text-left">{label}</span>
      {count != null && count > 0 && (
        <span className={cn("relative rounded-md px-1.5 text-[11px] leading-5 tabular-nums", strong ? "bg-brand-500 text-white" : "bg-ink-100 text-ink-500")}>{count}</span>
      )}
    </button>
  );
}

function Sidebar() {
  const s = useStore();
  const { perms, route } = s;
  const p = route.page;
  const unread = s.myNotifs.filter((n) => n.status === "未讀").length;


  return (
    <aside className="flex h-full w-[252px] shrink-0 flex-col gap-4 overflow-y-auto border-r border-ink-200 bg-white px-3 py-3">
      <div className="flex h-10 items-center gap-2.5 px-2.5">
        <BrandMark size={28} />
        <p className="truncate text-[15px] font-semibold tracking-tight text-ink-900">{s.settings.workspaceName}</p>
      </div>
      <nav className="flex flex-col gap-0.5">
        <p className="px-2.5 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-ink-400">主選單</p>
        {perms.dashboard && <NavItem icon={<LayoutDashboard />} label="總覽" active={p === "dashboard"} onClick={() => s.go({ page: "dashboard" })} />}
        {perms.cases && <NavItem icon={<Briefcase />} label="案件" active={p === "cases" || p === "case"} count={s.visibleCases.length} onClick={() => s.go({ page: "cases" })} />}
        {perms.customers && <NavItem icon={<Building2 />} label="客戶資料" active={p === "customers" || p === "customer"} onClick={() => s.go({ page: "customers" })} />}
        {perms.travel && <NavItem icon={<Car />} label="差旅費" active={p === "travel"} onClick={() => s.go({ page: "travel" })} />}
        {perms.financeCenter && <NavItem icon={<Wallet />} label="財務中心" active={p === "finance"} onClick={() => s.go({ page: "finance" })} />}
      </nav>
      <div className="mx-2.5 h-px bg-ink-200" />
      <nav className="flex flex-col gap-0.5">
        <p className="px-2.5 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-ink-400">工具</p>
        <NavItem icon={<Bell />} label="通知中心" active={p === "notifications"} count={unread} strong onClick={() => s.go({ page: "notifications" })} />
        {perms.audit && <NavItem icon={<History />} label="異動紀錄" active={p === "audit"} onClick={() => s.go({ page: "audit" })} />}
      </nav>
      <div className="mt-auto flex flex-col gap-0.5">
        {(perms.members || perms.settings) && <NavItem icon={<Settings />} label="設定" active={p === "settings"} onClick={() => s.go({ page: "settings", tab: perms.members ? "members" : "notify" })} />}
        <AccountCard />
      </div>
    </aside>
  );
}

function RoleList({ close }: { close: () => void }) {
  const s = useStore();
  return (
    <div>
      <p className="px-2.5 pb-1.5 pt-1 text-[11.5px] font-medium text-ink-400">僅供 Prototype 測試</p>
      {DEMO_ACCOUNTS.map((id) => {
        const m = s.memberOf(id);
        if (!m || m.status !== "active") return null;
        const active = s.me.id === id;
        return (
          <button
            key={id}
            onClick={() => {
              if (!active) s.switchUser(id);
              close();
            }}
            className={cn("flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[13px] transition-colors duration-100 hover:bg-ink-50", active ? "font-semibold text-ink-900" : "text-ink-600")}
          >
            <span className={cn("size-1.5 shrink-0 rounded-full", active ? "bg-brand-500" : "bg-ink-300")} />
            <span className="flex-1">
              {m.role}・{m.title}
            </span>
            {m.isOwner && <span className="text-[11px] font-normal text-ink-400">擁有者</span>}
          </button>
        );
      })}
      <div className="my-1 h-px bg-ink-100" />
      <MenuItem
        icon={<RotateCcw />}
        onClick={() => {
          s.reset();
          close();
        }}
      >
        重設資料
      </MenuItem>
    </div>
  );
}

function AccountCard() {
  const s = useStore();
  const [sub, setSub] = useState(openParam("roles"));
  return (
    <>
      <Popover
        side="top"
        width={280}
        scroll={false}
        defaultOpen={openParam("account") || openParam("roles")}
        className="mt-2"
        onOpenChange={(v) => !v && setSub(false)}
        trigger={({ toggle, open }) => (
          <button
            onClick={toggle}
            className={cn("flex w-full items-center gap-2.5 rounded-xl border bg-white px-3 py-2.5 text-left shadow-card transition-colors duration-150 hover:bg-ink-25", open ? "border-ink-300" : "border-ink-200")}
          >
            <Avatar m={s.me} size={32} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-ink-900">{s.me.role}</p>
              <p className="truncate text-[11.5px] text-ink-500">{s.me.title}</p>
            </div>
            <ChevronsUpDown className="size-4 text-ink-400" />
          </button>
        )}
      >
        {(close) => (
          <div>
            <div className="px-2.5 pb-3 pt-2">
              <p className="truncate text-[12px] text-ink-500">{s.me.email}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <Badge tone="brand">{s.me.role}</Badge>
                {s.me.isOwner && <Badge tone="outline">擁有者</Badge>}
                <span className="text-[12px] text-ink-600">{s.me.title}</span>
              </div>
            </div>
            <div className="h-px bg-ink-100" />
            <div className="py-1">
              <MenuItem
                icon={<UserRound />}
                onClick={() => {
                  s.go({ page: "profile" });
                  close();
                }}
              >
                個人資料
              </MenuItem>
              <MenuItem
                icon={<Bell />}
                onClick={() => {
                  s.go({ page: "notifications" });
                  close();
                }}
              >
                通知
              </MenuItem>
              {s.perms.members && (
                <MenuItem
                  icon={<Users />}
                  onClick={() => {
                    s.go({ page: "settings", tab: "members" });
                    close();
                  }}
                >
                  成員與權限
                </MenuItem>
              )}
              {s.perms.settings && (
                <MenuItem
                  icon={<Building2 />}
                  onClick={() => {
                    s.go({ page: "settings", tab: "workspace" });
                    close();
                  }}
                >
                  公司與工作空間設定
                </MenuItem>
              )}
            </div>
            <div className="h-px bg-ink-100" />
            {s.perms.gmail && (
              <div className="pt-1">
                <button
                  onClick={() => {
                    s.go({ page: "gmail" });
                    close();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] text-ink-700 transition-colors duration-100 hover:bg-ink-50"
                >
                  <Mail className="size-4 text-ink-400" />
                  <span className="flex-1">Gmail 擴充功能預覽</span>
                  <span className="rounded border border-dashed border-ink-300 px-1 text-[10.5px] text-ink-400">測試</span>
                </button>
              </div>
            )}
            <div className="relative pb-1" onMouseEnter={() => setSub(true)} onMouseLeave={() => setSub(false)}>
              <button
                onClick={() => setSub((v) => !v)}
                className={cn("flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] text-ink-700 transition-colors duration-100 hover:bg-ink-50", sub && "bg-ink-50")}
              >
                <Repeat className="size-4 text-ink-400" />
                <span className="flex-1">切換檢視角色</span>
                <span className="rounded border border-dashed border-ink-300 px-1 text-[10.5px] text-ink-400">測試</span>
                <ChevronRight className="size-3.5 text-ink-400" />
              </button>
              <AnimatePresence>
                {sub && (
                  <motion.div
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -4, transition: { duration: 0.1 } }}
                    transition={{ duration: 0.16, ease }}
                    className="absolute bottom-0 left-full z-10 pl-2"
                  >
                    <div className="w-[220px] rounded-xl border border-ink-200 bg-white p-1.5 shadow-pop">
                      <RoleList close={close} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="h-px bg-ink-100" />
            <div className="pt-1">
              <MenuItem icon={<LogOut />} onClick={s.logout}>
                登出
              </MenuItem>
            </div>
          </div>
        )}
      </Popover>
    </>
  );
}

export function NotifBell() {
  const s = useStore();
  const open = s.myNotifs.filter((n) => n.status !== "已完成");
  const unread = open.filter((n) => n.status === "未讀").length;
  return (
    <Popover
      align="right"
      width={380}
      defaultOpen={openParam("bell")}
      trigger={({ toggle }) => (
        <button onClick={toggle} className="relative grid size-9 place-items-center rounded-lg border border-ink-200 bg-white text-ink-600 shadow-card transition duration-150 hover:text-ink-900 active:scale-95" aria-label="通知">
          <Bell className="size-[17px]" />
          <AnimatePresence>
            {unread > 0 && (
              <motion.span
                key={unread}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={spring}
                className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-rose-500 px-1 text-[10.5px] font-semibold tabular-nums text-white ring-2 ring-white"
              >
                {unread}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      )}
    >
      {(close) => (
        <div>
          <div className="flex items-center justify-between px-2.5 pb-2 pt-1">
            <p className="text-[13.5px] font-semibold text-ink-900">通知</p>
            <button onClick={s.markAllRead} className="text-[12px] text-ink-500 hover:text-ink-900">
              全部標為已讀
            </button>
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            {open.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-10 text-[12.5px] text-ink-400">
                <CircleCheck className="size-6 text-ink-300" />
                目前沒有待處理的通知
              </div>
            )}
            {open.slice(0, 8).map((n) => (
              <button
                key={n.key}
                onClick={() => {
                  s.markRead(n.key);
                  close();
                  openNotif(s, n);
                }}
                className="flex w-full gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors duration-100 hover:bg-ink-50"
              >
                <NotifIcon type={n.type} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className={cn("truncate text-[13px] text-ink-900", n.status === "未讀" ? "font-semibold" : "font-medium")}>{n.title}</span>
                    {n.status === "未讀" && <span className="size-1.5 shrink-0 rounded-full bg-brand-500" />}
                  </span>
                  <span className="mt-0.5 line-clamp-1 block text-[12px] text-ink-500">{n.desc}</span>
                  <span className="mt-1 block text-[11px] text-ink-400">
                    {n.type}・{n.createdAt.slice(5)}
                  </span>
                </span>
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              close();
              s.go({ page: "notifications" });
            }}
            className="mt-1 flex w-full items-center justify-center gap-1 rounded-lg border-t border-ink-100 py-2.5 text-[12.5px] font-medium text-ink-700 transition-colors hover:bg-ink-50"
          >
            查看全部通知 <ChevronRight className="size-3.5" />
          </button>
        </div>
      )}
    </Popover>
  );
}

export function openNotif(s: ReturnType<typeof useStore>, n: { goto: string; caseId?: string; tab?: string }) {
  if (n.goto === "travel") return s.go({ page: "travel" });
  if (n.goto === "email") return s.go({ page: s.perms.gmail ? "gmail" : "dashboard" });
  if (n.goto === "finance" && s.perms.financeCenter) return s.go({ page: "finance", tab: "todo" });
  if (n.caseId) {
    const visible = s.visibleCases.some((c) => c.id === n.caseId);
    if (!visible) return s.toast("此案件不在你的檢視範圍內", "warn");
    return s.go({ page: "case", id: n.caseId, tab: n.goto === "finance" ? "finance" : n.tab });
  }
}

function Crumbs() {
  const s = useStore();
  const r = s.route;
  const map: Record<string, string> = {
    dashboard: "總覽",
    cases: "案件",
    case: "案件",
    customers: "客戶資料",
    customer: "客戶資料",
    travel: "差旅費",
    finance: "財務中心",
    notifications: "通知中心",
    profile: "個人資料",
    audit: "異動紀錄",
    gmail: "Gmail 擴充功能",
    settings: "設定",
  };
  const parts: { label: string; go?: () => void }[] = [{ label: map[r.page], go: r.page === "case" ? () => s.go({ page: "cases" }) : r.page === "customer" ? () => s.go({ page: "customers" }) : undefined }];
  if (r.page === "case") parts.push({ label: r.id });
  if (r.page === "customer") parts.push({ label: s.customers.find((c) => c.id === r.id)?.short ?? "" });
  return (
    <div className="flex min-w-0 items-center gap-1.5 text-[14px]">
      {parts.map((x, i) => (
        <span key={i} className="flex min-w-0 items-center gap-1.5">
          {i > 0 && <ChevronRight className="size-3.5 text-ink-300" />}
          {x.go ? (
            <button onClick={x.go} className="text-ink-500 transition-colors hover:text-ink-900">
              {x.label}
            </button>
          ) : (
            <span className={cn("truncate", i === parts.length - 1 ? "font-semibold text-brand-700" : "text-ink-500")}>{x.label}</span>
          )}
        </span>
      ))}
    </div>
  );
}

function TopBar() {
  return (
    <div className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-ink-200 bg-white px-8">
      <Crumbs />
      <div className="flex items-center gap-3">
        <SaveBar />
        <NotifBell />
      </div>
    </div>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const s = useStore();
  const key = JSON.stringify({ r: s.route.page, id: "id" in s.route ? s.route.id : undefined, u: s.me.id });
  return (
    <div className="flex h-screen min-w-[1280px] bg-white">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="min-h-0 flex-1 overflow-y-auto bg-ink-25">
          <motion.div key={key} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease }}>
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

export function Toasts() {
  const { toasts, dismissToast } = useStore();
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[60] flex flex-col items-end gap-2">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 24, transition: { duration: 0.16 } }}
            transition={{ duration: 0.28, ease }}
            className="pointer-events-auto flex items-center gap-2.5 rounded-xl bg-ink-900 px-4 py-3 text-[13px] font-medium text-white shadow-pop"
          >
            {t.tone === "success" ? <CircleCheck className="size-4 text-brand-300" /> : t.tone === "warn" ? <TriangleAlert className="size-4 text-amber-400" /> : <Info className="size-4 text-ink-300" />}
            {t.text}
            {t.action && (
              <button
                onClick={() => {
                  t.action!.run();
                  dismissToast(t.id);
                }}
                className="-my-1 ml-2 rounded-md px-2 py-1 text-[12.5px] font-semibold text-brand-300 transition-colors hover:bg-white/10"
              >
                {t.action.label}
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
