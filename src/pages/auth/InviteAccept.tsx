import { useState } from "react";
import { ArrowLeft, Check, Mail, UserCircle2 } from "lucide-react";
import { displayName, useStore } from "../../lib/store";
import { Avatar, Badge, Button } from "../../components/ui";
import { AuthFrame, GoogleMark } from "./Login";
import { BrandMark } from "../../components/brand";

export function InviteAccept() {
  const s = useStore();
  const inv = s.members.find((m) => m.id === s.inviteId);
  const inviter = s.memberOf(inv?.invitedBy);
  const [stage, setStage] = useState<"landing" | "google">("landing");
  if (!inv) return null;
  return (
    <AuthFrame
      aside={
        <div className="max-w-md">
          <p className="flex items-center gap-2 text-[12px] text-ink-400">
            <Mail className="size-4" />
            你收到的邀請信
          </p>
          <div className="mt-4 rounded-xl bg-white p-5 text-ink-800">
            <p className="text-[12px] text-ink-400">寄件者：恆永顧問內部系統 &lt;no-reply@staygold-demo.com&gt;</p>
            <p className="mt-1 text-[14px] font-semibold">{inviter?.name ?? "工作空間擁有者"} 邀請你加入「{s.settings.workspaceName}」</p>
            <p className="mt-3 text-[13px] leading-relaxed text-ink-600">
              你好，{inviter?.name} 邀請你以「{inv.role}」權限層級加入恆永顧問的內部資訊系統。點擊下方按鈕即可設定你的個人資料並開始使用。
            </p>
            <span className="mt-4 inline-block rounded-lg bg-brand-500 px-4 py-2 text-[13px] font-medium text-white">接受邀請</span>
            <p className="mt-3 text-[11.5px] text-ink-400">此邀請連結將於 7 天後失效。</p>
          </div>
        </div>
      }
    >
      {stage === "landing" ? (
        <div className="w-[420px] animate-rise">
          <BrandMark size={48} />
          <h2 className="mt-6 text-[24px] font-semibold tracking-tight text-ink-900">加入「{s.settings.workspaceName}」</h2>
          <p className="mt-2 text-[13.5px] leading-relaxed text-ink-500">
            <span className="font-medium text-ink-800">{displayName(inviter)}</span> 邀請你加入工作空間。
          </p>
          <div className="mt-6 space-y-3 rounded-xl border border-ink-200 bg-white p-4 shadow-card">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-ink-500">受邀 Email</span>
              <span className="font-medium text-ink-900">{inv.email}</span>
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-ink-500">權限層級</span>
              <Badge tone="outline">{inv.role}</Badge>
            </div>
          </div>
          <Button variant="dark" size="lg" className="mt-6 w-full" icon={<GoogleMark />} onClick={() => setStage("google")}>
            以 Google 帳號接受邀請
          </Button>
        </div>
      ) : (
        <div className="w-[420px] animate-rise rounded-2xl border border-ink-200 bg-white p-8 shadow-pop">
          <div className="flex flex-col items-center text-center">
            <GoogleMark className="size-8" />
            <h2 className="mt-4 text-[20px] font-medium text-ink-900">選擇帳戶</h2>
            <p className="mt-1 text-[13px] text-ink-500">以繼續使用「恆永顧問內部系統」</p>
          </div>
          <div className="mt-6 divide-y divide-ink-100 rounded-xl border border-ink-200">
            <button onClick={s.startOnboarding} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-ink-25">
              <Avatar m={inv} size={32} />
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-medium text-ink-900">{inv.email.split("@")[0]}</span>
                <span className="block text-[12px] text-ink-500">{inv.email}</span>
              </span>
              <Check className="size-4 text-ink-700" />
            </button>
            <div className="flex items-center gap-3 px-4 py-3 text-[13px] text-ink-400">
              <UserCircle2 className="size-8 text-ink-300" />
              使用其他帳戶
            </div>
          </div>
        </div>
      )}
    </AuthFrame>
  );
}
