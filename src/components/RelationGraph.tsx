import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, X } from "lucide-react";
import { useStore } from "../lib/store";
import type { Customer, RelationType } from "../lib/types";
import { cn, nowStamp, uid } from "../lib/utils";
import { Button, Field, Input, Popover, Segmented, Select, ease } from "./ui";

const TYPE_COLOR: Record<RelationType, string> = { 集團: "#535C5A", 介紹: "#32716A", 供應鏈: "#9CA5A3" };

// 從目前客戶的角度描述對方：集團（母／子公司）、介紹（介紹人／被介紹）、供應鏈（上游／下游）
const roleOf = (type: RelationType, centerIsFrom: boolean) =>
  type === "集團" ? (centerIsFrom ? "子公司" : "母公司") : type === "介紹" ? (centerIsFrom ? "由本客戶介紹" : "介紹人") : centerIsFrom ? "下游" : "上游";

const DIRECTIONS: Record<RelationType, [string, string]> = {
  集團: ["母公司", "子公司"],
  介紹: ["介紹人", "由本客戶介紹"],
  供應鏈: ["上游", "下游"],
};

const ROW = 64;
const GAP = 12;
const ORDER: RelationType[] = ["集團", "介紹", "供應鏈"];

// 客戶關係：左側為母公司／介紹人／上游，右側為子公司／由本客戶介紹／下游，中間是本客戶
export function RelationGraph({ customerId }: { customerId: string; compact?: boolean }) {
  const s = useStore();
  const center = s.customers.find((c) => c.id === customerId)!;
  const can = s.perms.customersEdit;
  const edges = useMemo(
    () =>
      s.relations
        .filter((r) => r.from === customerId || r.to === customerId)
        .map((r) => {
          const otherId = r.from === customerId ? r.to : r.from;
          return { r, other: s.customers.find((c) => c.id === otherId)!, role: roleOf(r.type, r.from === customerId), right: r.from === customerId };
        })
        .filter((e) => e.other)
        .sort((x, y) => ORDER.indexOf(x.r.type) - ORDER.indexOf(y.r.type)),
    [s.relations, s.customers, customerId],
  );
  const left = edges.filter((e) => !e.right);
  const right = edges.filter((e) => e.right);
  const laneH = (n: number) => (n ? n * ROW + (n - 1) * GAP : 0);
  const H = Math.max(laneH(left.length), laneH(right.length), 96);
  const latest = (c: Customer) => s.cases.filter((x) => x.customerId === c.id).sort((a, b) => b.year.localeCompare(a.year))[0];

  const remove = (e: (typeof edges)[number]) => {
    s.removeRelation(e.r.id);
    s.log({ module: "客戶", target: center.short, action: "移除客戶關係", before: `${e.r.type}・${e.role}・${e.other.short}` });
  };

  const Lane = ({ list, side }: { list: typeof edges; side: "left" | "right" }) => (
    <div className={cn("flex flex-col justify-center", side === "left" ? "items-end" : "items-start")} style={{ height: H, gap: GAP }}>
      {list.map((e, i) => {
        const l = latest(e.other);
        return (
          <motion.div key={e.r.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease, delay: i * 0.04 }} className="group relative w-full max-w-[300px]" style={{ height: ROW }}>
            <button onClick={() => s.go({ page: "customer", id: e.other.id })} className="flex h-full w-full items-center gap-3 rounded-xl border border-ink-200 bg-white px-4 text-left shadow-card transition-colors hover:border-brand-300 hover:bg-brand-50/30">
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="truncate text-[13px] font-semibold text-ink-900">{e.other.short}</span>
                  <span className="shrink-0 rounded-full px-1.5 text-[10.5px] font-medium leading-[18px] text-white" style={{ background: TYPE_COLOR[e.r.type] }}>
                    {e.role}
                  </span>
                </span>
                <span className="mt-0.5 block truncate text-[11.5px] text-ink-500">{l ? `${l.item}・${s.statusOf(l)}` : "尚無案件"}</span>
              </span>
            </button>
            {can && (
              <button onClick={() => remove(e)} className="absolute -right-2 -top-2 hidden size-5 place-items-center rounded-full border border-ink-200 bg-white text-ink-400 shadow-card hover:text-ink-800 group-hover:grid" aria-label="移除關係">
                <X className="size-3" />
              </button>
            )}
          </motion.div>
        );
      })}
    </div>
  );

  // 連接線：每張卡片一段橫線接到中間的直線，再接到本客戶
  const Connector = ({ list, side }: { list: typeof edges; side: "left" | "right" }) => {
    if (!list.length) return <div />;
    const top = (H - laneH(list.length)) / 2;
    const ys = list.map((_, i) => top + i * (ROW + GAP) + ROW / 2);
    const spineX = side === "left" ? "60%" : "40%";
    return (
      <svg width="100%" height={H} className="block overflow-visible">
        {list.map((e, i) => (
          <line key={e.r.id} x1={side === "left" ? "0" : spineX} x2={side === "left" ? spineX : "100%"} y1={ys[i]} y2={ys[i]} stroke={TYPE_COLOR[e.r.type]} strokeWidth="1.5" strokeDasharray={e.r.type === "供應鏈" ? "4 3" : undefined} />
        ))}
        <line x1={spineX} x2={spineX} y1={Math.min(...ys, H / 2)} y2={Math.max(...ys, H / 2)} stroke="#C8CFCE" strokeWidth="1.5" />
        <line x1={side === "left" ? spineX : "0"} x2={side === "left" ? "100%" : spineX} y1={H / 2} y2={H / 2} stroke="#C8CFCE" strokeWidth="1.5" />
      </svg>
    );
  };

  return (
    <div>
      {can && (
        <div className="mb-4 flex justify-end">
          <AddRelation centerId={customerId} />
        </div>
      )}
      {edges.length === 0 ? (
        <div className="grid h-40 place-items-center rounded-xl border border-dashed border-ink-200 text-[13px] text-ink-400">尚無客戶關係</div>
      ) : (
        <div className="grid items-center" style={{ gridTemplateColumns: "minmax(0,1fr) 48px 220px 48px minmax(0,1fr)" }}>
          <Lane list={left} side="left" />
          <Connector list={left} side="left" />
          <div className="flex items-center" style={{ height: H }}>
            <div className="w-full rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 px-4 py-3.5 text-white shadow-pop">
              <p className="truncate text-[14px] font-semibold">{center.short}</p>
              <p className="mt-0.5 truncate text-[11.5px] text-white/75">{center.name || "—"}</p>
            </div>
          </div>
          <Connector list={right} side="right" />
          <Lane list={right} side="right" />
        </div>
      )}
    </div>
  );
}

function AddRelation({ centerId }: { centerId: string }) {
  const s = useStore();
  const [type, setType] = useState<RelationType>("供應鏈");
  const [dir, setDir] = useState<0 | 1>(0);
  const [target, setTarget] = useState("");
  const [newName, setNewName] = useState("");
  const center = s.customers.find((c) => c.id === centerId)!;
  const opts = s.customers.filter((c) => c.id !== centerId).map((c) => ({ value: c.id, label: `${c.short}・${c.name || "—"}` }));
  const reset = () => {
    setTarget("");
    setNewName("");
    setDir(0);
  };
  return (
    <Popover
      align="right"
      width={340}
      trigger={({ toggle }) => (
        <Button size="sm" icon={<Plus className="size-3.5" />} onClick={toggle}>
          新增關係
        </Button>
      )}
    >
      {(close) => (
        <div className="space-y-3 p-2">
          <Field label="關係類型">
            <Segmented
              size="sm"
              value={type}
              onChange={(v) => {
                setType(v);
                setDir(0);
              }}
              items={[
                { value: "集團", label: "集團" },
                { value: "介紹", label: "介紹" },
                { value: "供應鏈", label: "供應鏈" },
              ]}
            />
          </Field>
          <Field label="對方是本客戶的">
            <Segmented
              size="sm"
              value={String(dir) as "0" | "1"}
              onChange={(v) => setDir(Number(v) as 0 | 1)}
              items={[
                { value: "0", label: DIRECTIONS[type][0] },
                { value: "1", label: DIRECTIONS[type][1] },
              ]}
            />
          </Field>
          <Field label="公司">
            <Select value={target} onChange={(v) => (setTarget(v), setNewName(""))} placeholder="選擇既有客戶" options={opts} />
          </Field>
          <Field label="或輸入尚未合作的公司">
            <Input value={newName} onChange={(e) => (setNewName(e.target.value), setTarget(""))} placeholder="公司簡稱" />
          </Field>
          <div className="flex justify-end gap-1.5 pt-1">
            <Button size="sm" variant="ghost" onClick={() => (reset(), close())}>
              取消
            </Button>
            <Button
              size="sm"
              variant="dark"
              disabled={!target && !newName.trim()}
              onClick={() => {
                let otherId = target;
                if (!otherId) {
                  otherId = uid("c");
                  s.addCustomer({
                    id: otherId, code: "", enCode: "", short: newName.trim(), pinyin: "", name: "", taxId: "", industry: "", region: "", sites: [],
                    contact: { name: "", phone: "", email: "" }, address: "", invoiceTitle: "", invoiceAddress: "", referral: { type: "其他", source: "" }, domain: "", createdAt: nowStamp().slice(0, 10),
                  });
                }
                // dir 0：對方為母公司／介紹人／上游（對方在 from）；dir 1：對方為子公司／被介紹／下游
                const r = dir === 0 ? { from: otherId, to: centerId } : { from: centerId, to: otherId };
                s.addRelation({ id: uid("r"), type, ...r });
                const name = target ? s.customers.find((c) => c.id === target)?.short : newName.trim();
                s.log({ module: "客戶", target: center.short, action: "新增客戶關係", after: `${type}・${DIRECTIONS[type][dir]}・${name}` });
                reset();
                close();
              }}
            >
              新增
            </Button>
          </div>
        </div>
      )}
    </Popover>
  );
}

