import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { useStore } from "../../lib/store";
import { PERM_GROUPS } from "../../lib/perms";
import type { Member } from "../../lib/types";
import { Avatar, Button, Field, Input, Segmented } from "../../components/ui";
import { cn } from "../../lib/utils";

const COLORS = ["#32716A", "#3B6FB6", "#7C5CBF", "#C2733D", "#B4536A", "#5E8C3A", "#2F8F9D", "#535C5A"];

export function Onboarding() {
  const s = useStore();
  const inv = s.members.find((m) => m.id === s.inviteId)!;
  const owner = s.members.find((m) => m.isOwner);
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState({
    name: inv.name.includes("@") || /^[a-z.]+$/i.test(inv.name) ? "" : inv.name,
    nickname: "",
    title: "",
    phone: "",
    color: inv.color,
  });
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));
  const valid = form.name.trim() && form.title.trim();

  return (
    <div className="flex h-screen min-w-[1280px] flex-col bg-ink-50">
      <header className="flex h-16 items-center justify-between border-b border-ink-200 bg-white px-8">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-ink-900 text-[14px] font-bold text-white">恆</span>
          <span className="text-[14px] font-semibold text-ink-900">{s.settings.workspaceName}</span>
        </div>
        <div className="flex items-center gap-6 text-[13px]">
          {["個人資料", "確認權限"].map((l, i) => (
            <span key={l} className={cn("flex items-center gap-2", step === i + 1 ? "font-medium text-ink-900" : "text-ink-400")}>
              <span className={cn("grid size-6 place-items-center rounded-full text-[12px]", step > i + 1 ? "bg-brand-500 text-white" : step === i + 1 ? "bg-ink-900 text-white" : "bg-ink-200 text-ink-500")}>
                {step > i + 1 ? <Check className="size-3.5" /> : i + 1}
              </span>
              {l}
            </span>
          ))}
        </div>
        <span className="w-64 truncate text-right text-[12px] text-ink-400">{inv.email}</span>
      </header>
      <div className="flex flex-1 justify-center overflow-y-auto py-12">
        {step === 1 ? (
          <div className="w-[560px] animate-rise">
            <h1 className="text-[24px] font-semibold tracking-tight text-ink-900">歡迎加入，先設定你的個人資料</h1>
            <div className="mt-8 rounded-2xl border border-ink-200 bg-white p-6 shadow-card">
              <div className="flex items-center gap-4 border-b border-ink-100 pb-5">
                <Avatar m={{ name: form.nickname || form.name || "?" }} size={52} />
                <div>
                  <p className="text-[13.5px] font-medium text-ink-900">{form.nickname || form.name || "你的名字"}</p>
                  <p className="text-[12px] text-ink-500">{form.title || "職稱"}・{inv.role}</p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-4">
                <Field label="姓名" required>
                  <Input id="ob-name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="例：周建宏" />
                </Field>
                <Field label="英文名／暱稱">
                  <Input id="ob-nick" value={form.nickname} onChange={(e) => set("nickname", e.target.value)} placeholder="例：Kevin" />
                </Field>
                <Field label="職稱" required>
                  <Input id="ob-title" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="例：顧問" />
                </Field>
                <Field label="手機">
                  <Input id="ob-phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="09xx-xxx-xxx" />
                </Field>
                <Field label="公司 Email" className="col-span-2">
                  <Input id="ob-email" value={inv.email} disabled />
                </Field>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button variant="dark" size="lg" disabled={!valid} onClick={() => setStep(2)}>
                下一步 <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="w-[640px] animate-rise">
            <h1 className="text-[24px] font-semibold tracking-tight text-ink-900">你可以使用的功能</h1>
            <div className="mt-8 space-y-4">
              {PERM_GROUPS.map((g) => {
                const on = g.items.filter((i) => inv.perms[i.key] === true && (!i.parent || inv.perms[i.parent] === true));
                if (!on.length) return null;
                return (
                  <div key={g.title} className="rounded-2xl border border-ink-200 bg-white shadow-card">
                    <p className="border-b border-ink-100 px-5 py-3 text-[13px] font-semibold text-ink-900">{g.title}</p>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 px-5 py-4">
                      {on.map((i) => (
                        <div key={i.key} className="flex items-center gap-2 text-[13px] text-ink-800">
                          <Check className="size-3.5 text-brand-600" strokeWidth={3} />
                          {i.label}
                          {i.key === "cases" && <span className="text-[11.5px] text-ink-400">（{inv.perms.casesScope === "all" ? "全部案件" : "僅參與的案件"}）</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 flex justify-between">
              <Button variant="ghost" onClick={() => setStep(1)}>
                上一步
              </Button>
              <Button
                variant="dark"
                size="lg"
                onClick={() => {
                  s.finishOnboarding(inv.id, { name: form.name.trim(), nickname: form.nickname.trim() || undefined, title: form.title.trim(), phone: form.phone, color: form.color });
                  s.toast("已加入工作空間");
                }}
              >
                進入工作空間 <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
