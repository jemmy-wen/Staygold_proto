import { Lock } from "lucide-react";
import { Shell, Toasts } from "./components/layout";
import { LeaveModal } from "./components/grid";
import { Empty } from "./components/ui";
import { StoreProvider, useStore } from "./lib/store";
import { Login } from "./pages/auth/Login";
import { InviteAccept } from "./pages/auth/InviteAccept";
import { Onboarding } from "./pages/auth/Onboarding";
import { Dashboard } from "./pages/Dashboard";
import { CaseList } from "./pages/cases/CaseList";
import { CaseDetail } from "./pages/cases/CaseDetail";
import { CustomerList } from "./pages/CustomerList";
import { CustomerDetail } from "./pages/CustomerDetail";
import { TravelPage } from "./pages/Travel";
import { FinanceCenter } from "./pages/Finance";
import { ProfilePage } from "./pages/Profile";
import { NotificationCenter } from "./pages/Notifications";
import { AuditLog } from "./pages/Audit";
import { GmailMock } from "./pages/Gmail";
import { SettingsPage } from "./pages/settings/Settings";

function NoAccess() {
  return <Empty icon={<Lock />} title="你目前沒有這個頁面的權限" desc="如需開通，請聯絡工作空間擁有者調整你的權限設定。" />;
}

function Router() {
  const s = useStore();
  const r = s.route;
  const p = s.perms;
  switch (r.page) {
    case "dashboard":
      return p.dashboard ? <Dashboard /> : p.cases ? <CaseList /> : <NoAccess />;
    case "cases":
      return p.cases ? <CaseList key={JSON.stringify(r.filter ?? {})} filter={r.filter} /> : <NoAccess />;
    case "case":
      return p.cases ? <CaseDetail key={r.id} id={r.id} tab={r.tab} /> : <NoAccess />;
    case "customers":
      return p.customers ? <CustomerList /> : <NoAccess />;
    case "customer":
      return p.customers ? <CustomerDetail key={r.id} id={r.id} tab={r.tab} /> : <NoAccess />;
    case "travel":
      return p.travel ? <TravelPage /> : <NoAccess />;
    case "finance":
      return p.financeCenter ? <FinanceCenter tab={r.tab} /> : <NoAccess />;
    case "notifications":
      return <NotificationCenter />;
    case "profile":
      return <ProfilePage />;
    case "audit":
      return p.audit ? <AuditLog /> : <NoAccess />;
    case "settings":
      return p.members || p.settings ? <SettingsPage tab={r.tab} memberId={r.memberId} /> : <NoAccess />;
    case "gmail":
      return null;
  }
}

function Root() {
  const s = useStore();
  if (s.screen === "login") return <Login />;
  if (s.screen === "invite") return <InviteAccept />;
  if (s.screen === "onboarding") return <Onboarding />;
  if (s.route.page === "gmail" && s.perms.gmail) return <GmailMock threadId={s.route.threadId} />;
  return (
    <Shell>
      <Router />
    </Shell>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Root />
      <Toasts />
      <LeaveModal />
    </StoreProvider>
  );
}
