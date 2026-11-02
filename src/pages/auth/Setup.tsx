import { useState } from "react";
import { CircleAlert, CircleCheck, Rocket } from "lucide-react";
import { useStore } from "../../lib/store";
import { Avatar, Button, Field, Input } from "../../components/ui";
import { AuthFrame } from "./Login";
import { cn } from "../../lib/utils";

// 系統自動檢查 Phase 0 的 Google 設定結果；未完成的項目只提示，不擋進入系統
const CHECKS: { name: string; ok: boolean; desc: string }[] = [
  { name: "Google 登入（OAuth）", ok: true, desc: "已以擁有者帳號完成登入" },
  { name: "Google Drive API", ok: true, desc: "已啟用" },
  { name: "Google Calendar API", ok: true, desc: "已啟用" },
  { name: "Gmail 擴充功能", ok: false, desc: "尚未部署到 Google Workspace，可之後在「公司與工作空間」重新檢查" },
];

// 首次啟動：部署時（Phase 0）指定的擁有者 Email 第一次以 Google 登入時進入，完成後才開始邀請同仁
export function Setup() {
  const s = useStore();
  const owner = s.memberOf("exec1");
  const [name, setName] = useState(s.settings.workspaceName);
  return (
    <AuthFrame
      aside={
        <div className="max-w-md">
          <p className="flex items-center gap-2 text-[12px] text-white/70">
            <Rocket className="size-4" />
            首次啟動
          </p>
          <h1 className="mt-4 text-[28px] font-semibold leading-[1.3] tracking-tight">歡迎使用恆永顧問內部系統</h1>
          <p className="mt-4 text-[14px] leading-[1.7] text-white/80">這個帳號在系統部署時被指定為擁有者。確認公司名稱與 Google 串接狀態後，就可以開始邀請同仁加入。</p>
        </div>
      }
    >
      <div className="w-[460px] animate-rise space-y-6">
        <div>
          <p className="text-[12px] font-medium text-ink-500">擁有者帳號</p>
          <div className="mt-2 flex items-center gap-3 rounded-xl border border-ink-200 bg-white px-4 py-3 shadow-card">
            <Avatar m={owner} size={32} />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-ink-900">{owner?.name}</p>
              <p className="text-[12px] text-ink-500">{owner?.email}</p>
            </div>
            <span className="text-[11.5px] text-ink-400">部署時指定</span>
          </div>
        </div>
        <Field label="公司／工作空間名稱">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <div>
          <p className="text-[12px] font-medium text-ink-500">Google 串接檢查</p>
          <div className="mt-2 divide-y divide-ink-100 rounded-xl border border-ink-200 bg-white shadow-card">
            {CHECKS.map((c) => (
              <div key={c.name} className="flex items-start gap-3 px-4 py-3">
                {c.ok ? <CircleCheck className="mt-0.5 size-4 shrink-0 text-brand-600" /> : <CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" />}
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-ink-900">{c.name}</p>
                  <p className={cn("text-[12px]", c.ok ? "text-ink-500" : "text-amber-700")}>{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <Button variant="dark" size="lg" className="w-full" disabled={!name.trim()} onClick={() => s.finishSetup(name.trim())}>
          完成設定，開始邀請同仁
        </Button>
      </div>
    </AuthFrame>
  );
}
