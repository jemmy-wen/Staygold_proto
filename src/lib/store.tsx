import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { PRESETS, effectivePerms } from "./perms";
import { computeNotifications, isRecipient } from "./rules";
import {
  auditSeed,
  casesSeed,
  customersSeed,
  eventsSeed,
  membersSeed,
  notifHistorySeed,
  payablesSeed,
  relationsSeed,
  settingsSeed,
  threadsSeed,
  travelSeed,
} from "./seed";
import type {
  AuditEntry,
  CalEvent,
  Case,
  CaseGroup,
  CaseLayout,
  CaseStatus,
  Customer,
  CustomerRelation,
  SavedView,
  EmailThread,
  Member,
  Notif,
  NotifHit,
  Payable,
  RolePreset,
  Settings,
  Travel,
} from "./types";
import { caseStatus, deriveStatus, nowStamp, param, uid } from "./utils";

// 從總覽帶入案件列表的條件：ids 為總覽已算好的案件，label 顯示在篩選列
export type CaseFilter = { status?: CaseStatus[]; view?: string; ids?: string[]; label?: string; layout?: CaseLayout; group?: CaseGroup };

export type Route =
  | { page: "dashboard" }
  | { page: "cases"; filter?: CaseFilter }
  | { page: "case"; id: string; tab?: string }
  | { page: "customers" }
  | { page: "customer"; id: string; tab?: string }
  | { page: "travel" }
  | { page: "finance"; tab?: string }
  | { page: "notifications" }
  | { page: "profile" }
  | { page: "audit" }
  | { page: "gmail"; threadId?: string }
  | { page: "settings"; tab?: "members" | "notify" | "items" | "workspace"; memberId?: string };

export type Screen = "login" | "invite" | "onboarding" | "app";

type Guard = { count: number; save: () => void; discard: () => void };

type Toast = { id: string; text: string; tone: "success" | "info" | "warn"; action?: { label: string; run: () => void } };

type State = {
  members: Member[];
  customers: Customer[];
  cases: Case[];
  events: CalEvent[];
  threads: EmailThread[];
  travel: Travel[];
  payables: Payable[];
  relations: CustomerRelation[];
  views: SavedView[];
  audit: AuditEntry[];
  settings: Settings;
};

const initialState = (): State => ({
  members: structuredClone(membersSeed),
  customers: structuredClone(customersSeed),
  cases: structuredClone(casesSeed),
  events: structuredClone(eventsSeed),
  threads: structuredClone(threadsSeed),
  travel: structuredClone(travelSeed),
  payables: structuredClone(payablesSeed),
  relations: structuredClone(relationsSeed),
  views: [],
  audit: structuredClone(auditSeed),
  settings: structuredClone(settingsSeed),
});

function hitsOf(s: State) {
  return computeNotifications(s);
}

function initialNotifs(s: State): Record<string, Notif> {
  const map: Record<string, Notif> = {};
  for (const n of notifHistorySeed) map[n.key] = n;
  const hits = hitsOf(s);
  hits.forEach((h, i) => {
    // 讓示範資料有「已讀但未處理」與「未讀」兩種
    const read = h.type === "差旅費填報提醒" || h.type === "收款逾期" || i % 4 === 3;
    map[h.key] = { ...h, status: read ? "已讀" : "未讀", createdAt: `2026/10/${String(29 - (i % 5)).padStart(2, "0")} 0${8 + (i % 2)}:${String(10 + i).slice(-2)}` };
  });
  return map;
}

function useStoreValue() {
  const [state, setState] = useState<State>(initialState);
  const [screen, setScreen] = useState<Screen>(() => (param("screen") as Screen) ?? (param("as") ? "app" : "login"));
  const [userId, setUserId] = useState<string>(() => param("as") ?? "exec1");
  const [inviteId, setInviteId] = useState<string | null>(() => param("member"));
  const [route, setRoute] = useState<Route>(() => {
    const page = param("page");
    if (!page) return { page: "dashboard" };
    return { page, id: param("id") ?? undefined, tab: param("tab") ?? undefined, threadId: param("thread") ?? undefined, memberId: param("memberId") ?? undefined } as Route;
  });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [notifMap, setNotifMap] = useState<Record<string, Notif>>(() => initialNotifs(state));
  // 未儲存變更：各頁面的編輯區各自登記暫存，右上角統一儲存；換頁、切換身分或登出前先詢問
  const [guards, setGuards] = useState<Record<string, Guard>>({});
  const guardsRef = useRef(guards);
  guardsRef.current = guards;
  const dirtyCount = Object.values(guards).reduce((n, g) => n + g.count, 0);
  const saveAll = () => Object.values(guardsRef.current).forEach((g) => g.save());
  const discardAll = () => Object.values(guardsRef.current).forEach((g) => g.discard());
  const [pendingLeave, setPendingLeave] = useState<{ run: () => void; count: number } | null>(null);
  const guarded = (run: () => void) => {
    const count = Object.values(guardsRef.current).reduce((n, g) => n + g.count, 0);
    if (count > 0) return setPendingLeave({ run, count });
    run();
  };

  const me = state.members.find((m) => m.id === userId) ?? state.members[0];
  const perms = useMemo(() => effectivePerms(me.perms), [me.perms]);

  const toast = useCallback((text: string, tone: Toast["tone"] = "success", action?: Toast["action"]) => {
    const id = uid("t");
    setToasts((t) => [...t, { id, text, tone, action }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), action ? 10000 : 3200);
  }, []);
  const dismissToast = (id: string) => setToasts((t) => t.filter((x) => x.id !== id));

  const log = useCallback(
    (e: Omit<AuditEntry, "id" | "time" | "actor">) =>
      setState((s) => ({ ...s, audit: [{ ...e, id: uid("a"), time: nowStamp(), actor: userId }, ...s.audit] })),
    [userId],
  );

  // 通知狀態：觸發條件成立時產生（未讀），完成條件成立時自動轉為已完成
  const hits = useMemo(() => hitsOf(state), [state]);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setNotifMap((prev) => {
      const next = { ...prev };
      const live = new Set(hits.map((h) => h.key));
      for (const h of hits) {
        const old = next[h.key];
        if (!old || old.status === "已完成") next[h.key] = { ...h, status: "未讀", createdAt: nowStamp() };
        else next[h.key] = { ...old, ...h };
      }
      for (const [k, n] of Object.entries(next))
        if (n.status !== "已完成" && !live.has(k)) next[k] = { ...n, status: "已完成", completedAt: nowStamp() };
      return next;
    });
  }, [hits]);

  const notifs = useMemo(
    () => Object.values(notifMap).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [notifMap],
  );
  const myNotifs = useMemo(() => notifs.filter((n) => isRecipient(n as NotifHit, me)), [notifs, me]);

  const visibleCases = useMemo(() => {
    if (!perms.cases) return [];
    if (perms.casesScope === "all") return state.cases;
    return state.cases.filter((c) => c.owner === me.id || c.coOwners.includes(me.id));
  }, [state.cases, perms, me.id]);

  const statusOf = useCallback((c: Case) => caseStatus(c, state.settings), [state.settings]);
  const customerOf = useCallback(
    (c: Case) => state.customers.find((x) => x.id === c.customerId)!,
    [state.customers],
  );
  const memberOf = useCallback((id?: string) => state.members.find((x) => x.id === id), [state.members]);

  const actions = {
    go: (r: Route) =>
      guarded(() => {
        setRoute(r);
        document.querySelector("main")?.scrollTo({ top: 0 });
      }),
    guarded,
    registerGuard: (id: string, g: Guard | null) =>
      setGuards((all) => {
        if (!g || g.count === 0) {
          if (!(id in all)) return all;
          const { [id]: _, ...rest } = all;
          return rest;
        }
        return { ...all, [id]: g };
      }),
    saveAll,
    discardAll,
    resolveLeave: (mode: "save" | "discard" | "cancel") => {
      const p = pendingLeave;
      setPendingLeave(null);
      if (!p || mode === "cancel") return;
      if (mode === "save") saveAll();
      else discardAll();
      p.run();
    },
    toast,
    dismissToast,
    log,
    // 改狀態前試算：改了之後會新增哪些要寄 Email 的通知（供確認視窗列出）
    emailImpact: (id: string, status: CaseStatus) => {
      const c = state.cases.find((x) => x.id === id);
      if (!c) return [];
      const derived = deriveStatus(c, state.settings);
      const next = status === derived ? { manualStatus: undefined, manualBasis: undefined } : { manualStatus: status, manualBasis: derived };
      const before = new Set(hitsOf(state).map((h) => h.key));
      return hitsOf({ ...state, cases: state.cases.map((x) => (x.id === id ? { ...x, ...next } : x)) }).filter((h) => h.email && h.caseId === id && !before.has(h.key));
    },
    // 手動改狀態：不需任何前置資料；改成與日期推得相同的狀態時，回到自動更新。改錯直接再改回來，異動紀錄保留每一次變更
    setStatus: (id: string, status: CaseStatus) => {
      const c = state.cases.find((x) => x.id === id);
      if (!c) return;
      const from = caseStatus(c, state.settings);
      if (from === status) return;
      const derived = deriveStatus(c, state.settings);
      const next = status === derived ? { manualStatus: undefined, manualBasis: undefined } : { manualStatus: status, manualBasis: derived };
      setState((s) => ({ ...s, cases: s.cases.map((x) => (x.id === id ? { ...x, ...next } : x)) }));
      log({ module: "案件", caseId: id, target: "案件狀態", action: "變更狀態", before: from, after: status });
      toast(`已改為「${status}」`);
    },
    login: (id: string) => {
      setUserId(id);
      setScreen("app");
      setRoute({ page: "dashboard" });
    },
    logout: () => guarded(() => setScreen("login")),
    switchUser: (id: string) => guarded(() => {
      setUserId(id);
      setRoute({ page: "dashboard" });
      const m = state.members.find((x) => x.id === id);
      toast(`已切換為 ${m?.role}・${m?.title}`, "info");
    }),
    openInvite: (id: string) => {
      setInviteId(id);
      setScreen("invite");
    },
    startOnboarding: () => setScreen("onboarding"),
    finishOnboarding: (id: string, patch: Partial<Member>) => {
      setState((s) => ({
        ...s,
        members: s.members.map((m) => (m.id === id ? { ...m, ...patch, status: "active", joinedAt: "2026/10/29", lastActive: "剛剛" } : m)),
        audit: [{ id: uid("a"), time: nowStamp(), actor: id, module: "成員與權限", target: patch.name ?? id, action: "接受邀請並完成個人資料設定" }, ...s.audit],
      }));
      setUserId(id);
      setInviteId(null);
      setScreen("app");
      setRoute({ page: "dashboard" });
    },
    inviteMembers: (emails: string[], role: RolePreset) => {
      const created: Member[] = emails.map((email, i) => ({
        id: uid("m"),
        name: email.split("@")[0],
        email,
        title: role,
        role,
        status: "invited",
        invitedAt: "2026/10/29",
        invitedBy: userId,
        color: ["#3B6FB6", "#C2733D", "#7C5CBF", "#2F8F9D", "#B4536A", "#5E8C3A"][(state.members.length + i) % 6],
        perms: { ...PRESETS[role] },
      }));
      setState((s) => ({
        ...s,
        members: [...s.members, ...created],
        audit: [
          ...created.map((m) => ({ id: uid("a"), time: nowStamp(), actor: userId, module: "成員與權限" as const, target: m.email, action: "寄送邀請", after: role })),
          ...s.audit,
        ],
      }));
      return created;
    },
    updateMember: (id: string, fn: (m: Member) => Member) =>
      setState((s) => ({ ...s, members: s.members.map((m) => (m.id === id ? fn(m) : m)) })),
    removeMember: (id: string) => setState((s) => ({ ...s, members: s.members.filter((m) => m.id !== id) })),
    updateCase: (id: string, fn: (c: Case) => Case) =>
      setState((s) => ({ ...s, cases: s.cases.map((c) => (c.id === id ? fn(c) : c)) })),
    addCase: (c: Case, customer?: Customer) =>
      setState((s) => ({
        ...s,
        customers: customer && !s.customers.some((x) => x.id === customer.id) ? [...s.customers, customer] : s.customers,
        cases: [c, ...s.cases],
      })),
    updateCustomer: (id: string, fn: (c: Customer) => Customer) =>
      setState((s) => ({ ...s, customers: s.customers.map((c) => (c.id === id ? fn(c) : c)) })),
    addCustomer: (c: Customer) => setState((s) => ({ ...s, customers: [c, ...s.customers] })),
    saveView: (v: SavedView) => setState((s) => ({ ...s, views: [...s.views.filter((x) => x.id !== v.id), v] })),
    removeView: (id: string) => setState((s) => ({ ...s, views: s.views.filter((x) => x.id !== id) })),
    addRelation: (r: CustomerRelation) => setState((s) => ({ ...s, relations: [...s.relations, r] })),
    removeRelation: (id: string) => setState((s) => ({ ...s, relations: s.relations.filter((r) => r.id !== id) })),
    updateThread: (id: string, patch: Partial<EmailThread>) =>
      setState((s) => ({ ...s, threads: s.threads.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
    updateEvent: (id: string, patch: Partial<CalEvent>) =>
      setState((s) => ({ ...s, events: s.events.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),
    addTravel: (t: Travel) => setState((s) => ({ ...s, travel: [t, ...s.travel] })),
    updateTravel: (id: string, patch: Partial<Travel>) =>
      setState((s) => ({ ...s, travel: s.travel.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
    updatePayable: (id: string, patch: Partial<Payable>) =>
      setState((s) => ({ ...s, payables: s.payables.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
    updateSettings: (patch: Partial<Settings>) => setState((s) => ({ ...s, settings: { ...s.settings, ...patch } })),
    markRead: (key: string) =>
      setNotifMap((m) => (m[key]?.status === "未讀" ? { ...m, [key]: { ...m[key], status: "已讀" } } : m)),
    markAllRead: () =>
      setNotifMap((m) => {
        const next = { ...m };
        for (const n of myNotifs) if (n.status === "未讀") next[n.key] = { ...n, status: "已讀" };
        return next;
      }),
    reset: () => {
      const s = initialState();
      setState(s);
      setNotifMap(initialNotifs(s));
      first.current = true;
      setRoute({ page: "dashboard" });
      toast("已重設資料", "info");
    },
  };

  return {
    ...state,
    screen,
    pendingLeave,
    dirtyCount,
    me,
    perms,
    route,
    inviteId,
    toasts,
    notifs,
    myNotifs,
    visibleCases,
    statusOf,
    customerOf,
    memberOf,
    ...actions,
  };
}

export type Store = ReturnType<typeof useStoreValue>;
const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const value = useStoreValue();
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("StoreProvider missing");
  return v;
}

// Prototype 測試用：依層級與職稱切換示範帳號
export const DEMO_ACCOUNTS = ["exec1", "partner", "admin1", "fin", "con1", "ext"];

export const displayName = (m?: Member) => (m ? (m.nickname ? `${m.nickname} ${m.name}` : m.name) : "—");
export const shortName = (m?: Member) => (m ? m.nickname ?? m.name : "—");
