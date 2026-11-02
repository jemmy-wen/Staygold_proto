import { useState, type ReactNode } from "react";
import { Check } from "lucide-react";
import { displayName, useStore } from "../lib/store";
import { G_LABEL, G_SERVICES, PERM_GROUPS, googleOf } from "../lib/perms";
import type { GConn, GService } from "../lib/types";
import { Badge, Button, Input, inputCls } from "../components/ui";
import { useLeaveGuard } from "../components/grid";
import { cn, initials } from "../lib/utils";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[240px_minmax(0,1fr)] gap-8 border-b border-ink-100 py-6 last:border-b-0">
      <p className="text-[14px] font-semibold text-ink-900">{label}</p>
      <div className="max-w-xl">{children}</div>
    </div>
  );
}

// 個人資料：姓名、暱稱、職稱、手機可自行修改，右上角統一儲存；權限只列出已開放的項目
export function ProfilePage() {
  const s = useStore();
  const me = s.me;
  const init = { name: me.name, nickname: me.nickname ?? "", title: me.title, phone: me.phone ?? "" };
  const [f, setF] = useState(init);
  const changed = (Object.keys(init) as (keyof typeof init)[]).filter((k) => f[k] !== init[k]).length;
  useLeaveGuard(
    changed,
    () => {
      s.updateMember(me.id, (m) => ({ ...m, name: f.name.trim() || m.name, nickname: f.nickname.trim() || undefined, title: f.title.trim() || m.title, phone: f.phone }));
      s.log({ module: "成員與權限", target: me.email, action: "修改個人資料" });
      s.toast("已更新個人資料");
    },
    () => setF(init),
  );
  // 只列出自己的權限會用到的服務；授權或中斷後立即生效（Prototype 以切換狀態模擬 Google 授權畫面）
  const services = G_SERVICES.filter((x) => x.needs(me));
  const connect = (key: GService, st: GConn) => {
    s.updateMember(me.id, (m) => ({ ...m, google: { ...m.google, [key]: st } }));
    const name = G_SERVICES.find((x) => x.key === key)?.name;
    s.log({ module: "成員與權限", target: me.email, action: st === "connected" ? `授權 ${name}` : `中斷 ${name} 連線` });
    s.toast(st === "connected" ? `已連線 ${name}` : `已中斷 ${name}`, st === "connected" ? "success" : "info");
  };
  const field = (k: keyof typeof init, label: string, placeholder?: string) => (
    <label className="block">
      <span className="mb-1.5 block text-[12.5px] font-medium text-ink-600">{label}</span>
      <Input value={f[k]} placeholder={placeholder} onChange={(e) => setF({ ...f, [k]: e.target.value })} className={cn(f[k] !== init[k] && "border-brand-400 bg-brand-50/40")} />
    </label>
  );

  return (
    <div className="px-8 py-6">
      <div className="glass-card overflow-hidden rounded-2xl">
        <div className="h-36 bg-[radial-gradient(120%_140%_at_0%_0%,#23504B_0%,#32716A_35%,#7DB9B2_70%,#EEF6F5_100%)]" />
        <div className="flex items-start justify-between gap-6 px-10 pb-8">
          <div className="flex items-start gap-6">
            <span className="-mt-10 shrink-0 rounded-2xl bg-white p-1 shadow-pop">
              {me.avatar ? (
                <img src={me.avatar} alt="" className="size-[88px] rounded-xl bg-ink-100 object-cover" />
              ) : (
                <span className="grid size-[88px] place-items-center rounded-xl bg-gradient-to-br from-brand-100 to-brand-50 text-[28px] font-semibold text-brand-800">{initials(f.nickname || f.name)}</span>
              )}
            </span>
            <div className="pt-5">
              <p className="flex items-center gap-2 text-[20px] font-semibold tracking-tight text-ink-900">
                {displayName({ ...me, name: f.name, nickname: f.nickname || undefined })}
                <Badge tone="brand">{me.role}</Badge>
                {me.isOwner && <Badge tone="outline">擁有者</Badge>}
              </p>
              <p className="mt-1.5 text-[13px] text-ink-500">
                {me.email}・{f.title}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-ink-100 px-10">
          <Row label="姓名">
            <div className="grid grid-cols-2 gap-4">
              {field("name", "姓名")}
              {field("nickname", "英文名／暱稱")}
            </div>
          </Row>
          <Row label="職稱與聯絡方式">
            <div className="grid grid-cols-2 gap-4">
              {field("title", "職稱")}
              {field("phone", "手機", "09xx-xxx-xxx")}
            </div>
          </Row>
          <Row label="登入帳號">
            <span className="mb-1.5 block text-[12.5px] font-medium text-ink-600">Google 帳號</span>
            <input value={me.email} disabled className={inputCls} />
          </Row>
          {services.length > 0 && (
            <Row label="Google 服務連線">
              <div className="divide-y divide-ink-100 overflow-hidden rounded-xl border border-ink-200">
                {services.map((x) => {
                  const st = googleOf(me, x.key);
                  return (
                    <div key={x.key} className="flex items-center gap-4 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 text-[13px] font-medium text-ink-900">
                          {x.name}
                          <Badge tone={st === "connected" ? "green" : st === "expired" ? "amber" : "gray"}>{G_LABEL[st]}</Badge>
                        </p>
                        <p className="mt-0.5 text-[12px] text-ink-500">{x.scope}</p>
                      </div>
                      {st === "connected" ? (
                        <Button size="sm" variant="ghost" onClick={() => connect(x.key, "none")}>
                          中斷連線
                        </Button>
                      ) : (
                        <Button size="sm" onClick={() => connect(x.key, "connected")}>
                          {st === "expired" ? "重新連線" : "授權"}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </Row>
          )}
          <Row label="權限">
            <div className="flex items-center gap-2 text-[13px]">
              <Badge tone="brand">{me.role}</Badge>
              <span className="text-ink-600">
                案件範圍：{me.perms.casesScope === "all" ? "全部案件" : "僅參與的案件"}
              </span>
            </div>
            <div className="mt-4 space-y-4">
              {PERM_GROUPS.map((g) => {
                const on = g.items.filter((i) => me.perms[i.key] === true && (!i.parent || me.perms[i.parent] === true));
                if (!on.length) return null;
                return (
                  <div key={g.title}>
                    <p className="mb-2 text-[12px] font-medium text-ink-500">{g.title}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {on.map((i) => (
                        <span key={i.key} className="inline-flex h-7 items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-2.5 text-[12px] text-brand-800">
                          <Check className="size-3" strokeWidth={3} />
                          {i.label}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </Row>
        </div>
      </div>
    </div>
  );
}
