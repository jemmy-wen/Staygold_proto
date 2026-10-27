import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { BadgeCheck, FolderOpen, Send, Undo2, X } from "lucide-react";
import { useStore } from "../../../lib/store";
import { createRenewal } from "../../../lib/caseOps";
import { milestoneCandidates } from "../../../lib/rules";
import type { Case, Milestones, PriceTier } from "../../../lib/types";
import { TODAY, addDays, cn, daysSince, daysUntil, fmtDate, fmtShort, money, nowStamp } from "../../../lib/utils";
import { VERIFIERS } from "../../../lib/seed";
import { Avatar, Badge, Button, Card, KV, OptionList, Popover } from "../../../components/ui";
import { GridCell, useGridDraft, type Change } from "../../../components/grid";


const PRICE_LABEL: Record<string, string> = {
  "coaching.list": "輔導牌價", "coaching.base": "輔導報價基準", "coaching.special": "輔導特惠價",
  "audit.list": "陪同稽核牌價", "audit.base": "陪同稽核報價基準", "audit.special": "陪同稽核特惠價",
  contractSessions: "合約堂數",
};

export function Overview({ c }: { c: Case; goTab?: (t: string) => void }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-5">
      <div className="min-w-0">
        <ReviewCard c={c} />
      </div>
      <div className="space-y-5">
        <InfoCard c={c} />
        <OwnerCard c={c} />
      </div>
    </div>
  );
}

function ReviewCard({ c }: { c: Case }) {
  const s = useStore();
  const st = s.statusOf(c);
  const isOwner = s.me.id === c.owner;
  const seePrice = s.perms.financeAmounts || s.perms.reviewPrice || isOwner;
  const editable = isOwner || (s.perms.casesEdit && s.perms.financeAmounts);
  const [note, setNote] = useState("");
  const total = c.pricing.coaching.special + c.pricing.audit.special;

  const grid = useGridDraft((changes: Change[]) => {
    s.updateCase(c.id, (x) =>
      changes.reduce((acc, ch) => {
        if (ch.field === "contractSessions") return { ...acc, contractSessions: Number(ch.value) || 0 };
        const [k, f] = ch.field.split(".") as ["coaching" | "audit", keyof PriceTier];
        return { ...acc, pricing: { ...acc.pricing, [k]: { ...acc.pricing[k], [f]: Number(ch.value) || 0 } } };
      }, x),
    );
    changes.forEach((ch) => s.log({ module: "案件", caseId: c.id, target: "報價", action: `修改${PRICE_LABEL[ch.field]}`, before: ch.original || "—", after: ch.value || "—" }));
    s.toast(`已儲存 ${changes.length} 項變更`);
  });

  const act = (action: "送出審核" | "內容核可" | "核價核可" | "退回") => {
    const stage = c.review === "content" ? "內容" : c.review === "price" ? "核價" : undefined;
    const next = action === "送出審核" ? "content" : action === "內容核可" ? "price" : action === "核價核可" ? "approved" : "drafting";
    s.updateCase(c.id, (x) => ({
      ...x,
      manualStatus: undefined,
      manualBasis: undefined,
      review: next,
      reviewLog: [...x.reviewLog, { time: nowStamp(), by: s.me.id, action, stage: action === "送出審核" ? undefined : stage, note: note || undefined }],
    }));
    s.log({ module: "案件", caseId: c.id, target: "審核", action: action === "退回" ? `${stage}退回` : action, before: st, after: note || undefined });
    s.toast(action === "送出審核" ? "已送出審核" : action === "退回" ? "已退回" : action === "核價核可" ? "已核可報價" : "內容已核可");
    setNote("");
  };

  return (
    <Card
      title={<span id="review-card">企劃書審核與報價</span>}
      action={
        <Badge tone={c.review === "approved" ? "green" : c.review === "content" || c.review === "price" ? "amber" : "gray"}>
          {c.review === "none" ? "尚未開始" : c.review === "drafting" ? "撰寫中" : c.review === "content" ? "內容審核中" : c.review === "price" ? "核價審核中" : "已核可"}
        </Badge>
      }
    >
      {seePrice ? (
        <div className="overflow-hidden rounded-lg border border-ink-200">
          <table className="w-full border-separate border-spacing-0 text-[13px]">
            <thead>
              <tr className="bg-ink-25 text-[12px] text-ink-500">
                <th className="border-b border-ink-200 px-4 py-2 text-left font-medium">項目</th>
                <th className="border-b border-ink-200 px-3 py-2 text-right font-medium">牌價</th>
                <th className="border-b border-ink-200 px-3 py-2 text-right font-medium">報價基準</th>
                <th className="border-b border-ink-200 px-3 py-2 text-right font-medium">特惠價（報價）</th>
                <th className="border-b border-ink-200 px-4 py-2 text-right font-medium">折讓</th>
              </tr>
            </thead>
            <tbody>
              {(["coaching", "audit"] as const).map((k, r) => {
                const t = c.pricing[k];
                const off = t.base ? Math.round(((t.special - t.base) / t.base) * 100) : 0;
                return (
                  <tr key={k}>
                    <td className="border-b border-ink-100 px-4 py-2 font-medium text-ink-800">{k === "coaching" ? "輔導" : "陪同稽核"}</td>
                    {(["list", "base", "special"] as const).map((f, i) => {
                      const field = `${k}.${f}`;
                      const orig = t[f] ? String(t[f]) : "";
                      return (
                        <GridCell
                          key={f}
                          pos={[r, i]}
                          type="number"
                          align="right"
                          value={grid.get(c.id, field, orig)}
                          dirty={grid.dirty(c.id, field)}
                          editable={editable}
                          placeholder="—"
                          format={(v) => money(Number(v))}
                          className={cn("tabular-nums", f === "special" && "font-semibold text-ink-900")}
                          onChange={(v) => grid.set(c.id, field, orig, v)}
                        />
                      );
                    })}
                    <td className={cn("border-b border-ink-100 px-4 text-right text-[12.5px] tabular-nums", off < -10 ? "font-medium text-rose-600" : "text-ink-500")}>{t.base ? `${off}%` : "—"}</td>
                  </tr>
                );
              })}
              <tr className="bg-ink-25">
                <td className="px-4 py-2.5 font-semibold text-ink-900">合計（未稅）</td>
                <td className="px-3 text-right tabular-nums text-ink-600">{money(c.pricing.coaching.list + c.pricing.audit.list)}</td>
                <td className="px-3 text-right tabular-nums text-ink-600">{money(c.pricing.coaching.base + c.pricing.audit.base)}</td>
                <td className="px-3 text-right text-[14px] font-semibold tabular-nums text-ink-900">{money(total)}</td>
                <td />
              </tr>
            </tbody>
          </table>
          <div className="flex items-center gap-3 border-t border-ink-100 px-4 py-2.5 text-[12.5px]">
            <span className="text-ink-500">合約堂數</span>
            <div className="w-24 pl-2">
              <GridCell
                as="div"
                type="number"
                value={grid.get(c.id, "contractSessions", c.contractSessions ? String(c.contractSessions) : "")}
                dirty={grid.dirty(c.id, "contractSessions")}
                editable={editable}
                placeholder="—"
                format={(v) => `${v} 堂`}
                onChange={(v) => grid.set(c.id, "contractSessions", c.contractSessions ? String(c.contractSessions) : "", v)}
              />
            </div>
          </div>
        </div>
      ) : null}
      {(c.review === "none" || c.review === "drafting") && (isOwner || s.perms.casesEdit) && (
        <div className="mt-4 flex items-center justify-end gap-3">
          <Button variant="dark" icon={<Send className="size-4" />} onClick={() => act("送出審核")}>
            送出審核
          </Button>
        </div>
      )}
      {((c.review === "content" && s.perms.reviewContent) || (c.review === "price" && s.perms.reviewPrice)) && (
        <div className="mt-4 rounded-lg border border-ink-200 bg-ink-25 p-4">
          <p className="text-[13px] font-semibold text-ink-900">{c.review === "content" ? "審核輔導內容" : "最終審核與核價"}</p>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="審核意見" className="mt-3 h-16 w-full resize-none rounded-lg border border-ink-200 bg-white px-3 py-2 text-[13px] outline-none focus:border-ink-400 focus:ring-[3px] focus:ring-ink-100" />
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="danger" icon={<Undo2 className="size-4" />} onClick={() => act("退回")}>
              退回修改
            </Button>
            <Button variant="brand" icon={<BadgeCheck className="size-4" />} onClick={() => act(c.review === "content" ? "內容核可" : "核價核可")}>
              {c.review === "content" ? "內容核可" : "核可報價"}
            </Button>
          </div>
        </div>
      )}

      {c.reviewLog.length > 0 && (
        <div className="mt-5 border-t border-ink-100 pt-4">
          <p className="mb-3 text-[12px] font-medium text-ink-500">審核紀錄</p>
          <ol className="space-y-3">
            {[...c.reviewLog].reverse().map((r, i) => {
              const who = s.memberOf(r.by);
              return (
                <li key={i} className="flex gap-3">
                  <Avatar m={who} size={24} />
                  <div className="min-w-0 flex-1 text-[12.5px]">
                    <p>
                      <span className="font-medium text-ink-900">{who?.nickname ?? who?.name}</span>
                      <span className={cn("ml-1.5", r.action === "退回" ? "text-rose-600" : "text-ink-600")}>
                        {r.action === "退回" ? `退回（${r.stage}）` : r.action}
                      </span>
                      <span className="ml-2 text-ink-400">{r.time}</span>
                    </p>
                    {r.note && <p className="mt-1 rounded-md bg-ink-50 px-2.5 py-1.5 text-ink-700">{r.note}</p>}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </Card>
  );
}


function InfoCard({ c }: { c: Case }) {
  const s = useStore();
  const cu = s.customerOf(c);
  const can = s.perms.casesEdit;
  const grid = useGridDraft((changes: Change[]) => {
    changes.forEach((ch) => {
      s.updateCase(c.id, (x) => ({ ...x, verifier: ch.value }));
      s.log({ module: "案件", caseId: c.id, target: "驗證單位", action: "修改驗證單位", before: ch.original || "—", after: ch.value || "—" });
    });
    s.toast("已儲存變更");
  });
  return (
    <Card title="案件資訊">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
        <KV label="客戶" className="col-span-2">
          {s.perms.customers ? (
            <button onClick={() => s.go({ page: "customer", id: cu.id })} className="text-ink-800 hover:underline">
              {cu.name}
            </button>
          ) : (
            cu.name
          )}
        </KV>
        <KV label="部門／廠區">{c.site ?? "—"}</KV>
        <KV label="類別">{c.category}</KV>
        <KV label="驗證項目">{c.item}</KV>
        <KV label="稽核年度">{c.year}</KV>
        <KV label="驗證單位">
          <div className="pl-2">
            <GridCell as="div" type="select" options={VERIFIERS} value={grid.get(c.id, "verifier", c.verifier)} dirty={grid.dirty(c.id, "verifier")} editable={can} placeholder="尚未確定" onChange={(v) => grid.set(c.id, "verifier", c.verifier, v)} />
          </div>
        </KV>
        <KV label="合約堂數">{c.contractSessions ? `${c.contractSessions} 堂` : "—"}</KV>
        <KV label="協作者" className="col-span-2">
          <CoOwners c={c} />
        </KV>
        <KV label="介紹來源" className="col-span-2">
          <span className="flex items-center gap-1.5">
            <Badge tone="outline">{cu.referral.type}</Badge>
            {cu.referral.source}
          </span>
        </KV>
        <KV label="Drive 資料夾" className="col-span-2">
          {c.folder ? (
            <span className="flex items-center gap-1.5 font-mono text-[12.5px]">
              <FolderOpen className="size-3.5 text-ink-400" />
              {c.folder.name}
            </span>
          ) : (
            <span className="text-ink-500">尚未綁定</span>
          )}
        </KV>
        <KV label="建立">
          {c.createdAt}・{s.memberOf(c.createdBy)?.nickname ?? s.memberOf(c.createdBy)?.name}
        </KV>
      </dl>
    </Card>
  );
}


function OwnerCard({ c }: { c: Case }) {
  const s = useStore();
  return (
    <Card title="負責人異動紀錄">
      <ol className="relative space-y-4 before:absolute before:bottom-2 before:left-[11px] before:top-2 before:w-px before:bg-ink-200">
        {[...c.ownerLog].reverse().map((o, i) => {
          const to = s.memberOf(o.to);
          return (
            <li key={i} className="relative flex gap-3">
              <Avatar m={to} size={23} ring />
              <div className="min-w-0 text-[12.5px]">
                <p className="text-ink-900">
                  {o.from === "—" ? (
                    <>
                      指派給 <span className="font-medium">{to?.nickname ?? to?.name}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-ink-500">{s.memberOf(o.from)?.nickname ?? s.memberOf(o.from)?.name}</span> → <span className="font-medium">{to?.nickname ?? to?.name}</span>
                    </>
                  )}
                  {i === 0 && <Badge tone="brand" className="ml-1.5">目前</Badge>}
                </p>
                <p className="text-ink-400">
                  {o.time}・{s.memberOf(o.by)?.nickname ?? s.memberOf(o.by)?.name}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}


function CoOwners({ c }: { c: Case }) {
  const s = useStore();
  const can = s.perms.casesEdit;
  const options = s.members.filter((m) => m.status === "active" && m.id !== c.owner && !c.coOwners.includes(m.id));
  const update = (ids: string[], action: string, who: string) => {
    s.updateCase(c.id, (x) => ({ ...x, coOwners: ids }));
    s.log({ module: "案件", caseId: c.id, target: "協作者", action, after: who });
  };
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {c.coOwners.length === 0 && !can && <span className="text-ink-400">—</span>}
      {c.coOwners.map((id) => {
        const m = s.memberOf(id);
        return (
          <span key={id} className="flex items-center gap-1.5 rounded-md border border-ink-200 py-0.5 pl-1 pr-1.5 text-[12.5px]">
            <Avatar m={m} size={18} />
            {m?.nickname ?? m?.name}
            {can && (
              <button onClick={() => update(c.coOwners.filter((x) => x !== id), "移除協作者", m?.name ?? id)} className="rounded p-0.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700" aria-label="移除">
                <X className="size-3" />
              </button>
            )}
          </span>
        );
      })}
      {can && options.length > 0 && (
        <Popover
          width={280}
          trigger={({ toggle }) => (
            <button onClick={toggle} className="rounded-md border border-dashed border-ink-300 px-2 py-0.5 text-[12.5px] text-ink-500 transition-colors hover:border-ink-400 hover:text-ink-800">
              ＋ 新增
            </button>
          )}
        >
          {(close) => (
            <OptionList
              placeholder="搜尋成員"
              selected={[]}
              options={options.map((m) => ({ value: m.id, label: m.nickname ?? m.name, hint: `${m.role}・${m.title}` }))}
              onPick={(id) => {
                const m = s.memberOf(id);
                update([...c.coOwners, id], "新增協作者", m?.name ?? id);
                s.toast(`已加入 ${m?.nickname ?? m?.name}`);
                close();
              }}
            />
          )}
        </Popover>
      )}
    </div>
  );
}
