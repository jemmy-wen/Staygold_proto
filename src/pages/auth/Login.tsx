import { useState } from "react";
import { Lock, UserCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { useStore } from "../../lib/store";
import type { Member } from "../../lib/types";
import { Avatar, Button, ease } from "../../components/ui";
import { BrandLockup } from "../../components/brand";

export function GoogleMark({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

const SERVICES = ["ISO", "FSC", "ISCC", "GRS", "SMETA", "EcoVadis", "HACCP", "FSSC 22000", "碳盤查"];

// 登入與受邀頁共用的版面：左側為企業形象區塊
export function AuthFrame({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="flex h-screen min-w-[1280px] bg-ink-50 p-2">
      <div className="flex w-[44%] flex-col justify-between rounded-2xl bg-ink-900 p-12 text-white">
        <BrandLockup tone="dark" />
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease, delay: 0.1 }}>
          {aside ?? <BrandStatement />}
        </motion.div>
        <p className="text-[12px] text-ink-500">© 2026 恆永企業有限公司 Stay Gold Co., Ltd.</p>
      </div>
      <div className="flex flex-1 items-center justify-center">{children}</div>
    </div>
  );
}

function BrandStatement() {
  return (
    <div className="max-w-md">
      <h1 className="text-[34px] font-semibold leading-[1.25] tracking-tight">
        讓永續成為
        <br />
        企業最閃亮的招牌
      </h1>
      <p className="mt-5 text-[14px] leading-relaxed text-ink-300">做對的事，也能帶來商業價值。從國際驗證、碳管理到品牌策略，陪企業把永續規範轉化為競爭力。</p>
      <div className="mt-8 flex flex-wrap gap-x-4 gap-y-2 text-[12.5px] text-ink-400">
        {SERVICES.map((s) => (
          <span key={s}>{s}</span>
        ))}
      </div>
    </div>
  );
}

// Google 的帳戶選擇畫面（Prototype 模擬）；「使用其他帳戶」示範用非受邀帳號登入
export type GoogleAccount = { email: string; name: string; m?: Pick<Member, "name" | "color" | "avatar"> };

export function GoogleChooser({ accounts, onPick, onOther }: { accounts: GoogleAccount[]; onPick: (a: GoogleAccount) => void; onOther: () => void }) {
  return (
    <div className="w-[420px] animate-rise rounded-2xl border border-ink-200 bg-white p-8 shadow-pop">
      <div className="flex flex-col items-center text-center">
        <GoogleMark className="size-8" />
        <h2 className="mt-4 text-[20px] font-medium text-ink-900">選擇帳戶</h2>
        <p className="mt-1 text-[13px] text-ink-500">以繼續使用「恆永顧問內部系統」</p>
      </div>
      <div className="mt-6 divide-y divide-ink-100 rounded-xl border border-ink-200">
        {accounts.map((a) => (
          <button key={a.email} onClick={() => onPick(a)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-ink-25">
            <Avatar m={a.m ?? { name: a.name, color: "#5f6368" }} size={32} />
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-medium text-ink-900">{a.name}</span>
              <span className="block text-[12px] text-ink-500">{a.email}</span>
            </span>
          </button>
        ))}
        <button onClick={onOther} className="flex w-full items-center gap-3 px-4 py-3 text-left text-[13px] text-ink-600 hover:bg-ink-25">
          <UserCircle2 className="size-8 text-ink-300" />
          使用其他帳戶
        </button>
      </div>
    </div>
  );
}

// 示範用：「使用其他帳戶」代表一個沒有受邀的 Google 帳號
const OUTSIDER_EMAIL = "kevin.lai.tw@gmail.com";
const DEMO_LOGIN = "exec1";

// 只能用 Google 帳號登入，且該帳號必須是受邀並已加入的成員（10/29 會議、Google 整合前置文件）
// Prototype 只放一個帳號進系統，其他權限檢視在左下角帳號卡切換；「使用其他帳戶」用來看無權登入畫面
export function Login() {
  const s = useStore();
  const [stage, setStage] = useState<"start" | "google">("start");
  const m = s.memberOf(DEMO_LOGIN);
  const accounts: GoogleAccount[] = m ? [{ email: m.email, name: m.name, m }] : [];
  return (
    <AuthFrame>
      {stage === "start" ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }} className="w-[380px]">
          <h2 className="text-[24px] font-semibold tracking-tight text-ink-900">登入</h2>
          <p className="mt-2 text-[13px] text-ink-500">請使用受邀加入的 Google 帳號</p>
          <Button variant="default" size="lg" className="mt-8 w-full" icon={<GoogleMark />} onClick={() => setStage("google")}>
            使用 Google 帳號登入
          </Button>
        </motion.div>
      ) : (
        <GoogleChooser accounts={accounts} onPick={() => s.login(DEMO_LOGIN)} onOther={() => s.deny(OUTSIDER_EMAIL)} />
      )}
    </AuthFrame>
  );
}

// 登入被拒：未受邀、邀請過期、停權、移除都顯示同一段文字
export function Denied() {
  const s = useStore();
  return (
    <AuthFrame>
      <div className="w-[400px] animate-rise">
        <span className="grid size-12 place-items-center rounded-xl bg-ink-100 text-ink-500">
          <Lock className="size-5" />
        </span>
        <h2 className="mt-6 text-[22px] font-semibold tracking-tight text-ink-900">此 Google 帳號無權登入此系統</h2>
        {s.deniedEmail && <p className="mt-2 text-[13px] text-ink-500">{s.deniedEmail}</p>}
        <p className="mt-4 text-[13.5px] leading-relaxed text-ink-600">請確認使用的是收到邀請的 Google 帳號。如需使用此系統，請向公司的系統管理員索取邀請。</p>
        <Button variant="dark" size="lg" className="mt-8 w-full" icon={<GoogleMark />} onClick={s.logout}>
          改用其他 Google 帳號登入
        </Button>
      </div>
    </AuthFrame>
  );
}
