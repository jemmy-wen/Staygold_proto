import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useStore } from "../../lib/store";
import { Button, Field, Input, ease } from "../../components/ui";
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

export function Login() {
  const s = useStore();
  const [email, setEmail] = useState("yating.lin@staygold-demo.com");
  return (
    <AuthFrame>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }} className="w-[380px]">
        <h2 className="text-[24px] font-semibold tracking-tight text-ink-900">登入</h2>
        <Button variant="default" size="lg" className="mt-8 w-full" icon={<GoogleMark />} onClick={() => s.login("exec1")}>
          使用 Google 帳號登入
        </Button>
        <div className="my-6 flex items-center gap-3 text-[12px] text-ink-400">
          <span className="h-px flex-1 bg-ink-200" />或<span className="h-px flex-1 bg-ink-200" />
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const m = s.members.find((x) => x.email === email.trim() && x.status === "active");
            if (!m) return s.toast("這個 Email 尚未加入工作空間，請向管理員索取邀請", "warn");
            s.login(m.id);
          }}
          className="space-y-4"
        >
          <Field label="公司 Email">
            <Input id="login-email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
          </Field>
          <Button type="submit" variant="dark" size="lg" className="w-full">
            繼續 <ArrowRight className="size-4" />
          </Button>
        </form>
      </motion.div>
    </AuthFrame>
  );
}
