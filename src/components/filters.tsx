import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Filter, X } from "lucide-react";
import { cn } from "../lib/utils";
import { Button, OptionList, Popover, ease } from "./ui";

export type FacetOption = { value: string; label: string; hint?: string };
export type Facet = { key: string; label: string; options: FacetOption[] };export type FacetValue = Record<string, string[]>;

// 是否符合某個篩選面向：沒選任何值時一律符合
export const pass = (v: FacetValue, key: string, x: string | string[]) => {
  const sel = v[key] ?? [];
  if (!sel.length) return true;
  return Array.isArray(x) ? x.some((y) => sel.includes(y)) : sel.includes(x);
};

export function useFacets(initial: FacetValue = {}) {
  const [value, setValue] = useState<FacetValue>(initial);
  const toggle = (key: string, v: string) =>
    setValue((x) => {
      const cur = x[key] ?? [];
      return { ...x, [key]: cur.includes(v) ? cur.filter((y) => y !== v) : [...cur, v] };
    });
  const set = (key: string, vals: string[]) => setValue((x) => ({ ...x, [key]: vals }));
  const clear = () => setValue({});
  const count = Object.values(value).reduce((n, a) => n + a.length, 0);
  return { value, setValue, toggle, set, clear, count };
}

// 篩選按鈕：左側選篩選面向，右側為可搜尋、可多選的清單（選項再多也找得到）
export function FilterMenu({ facets, f }: { facets: Facet[]; f: ReturnType<typeof useFacets> }) {
  const [active, setActive] = useState(facets[0]?.key);
  const cur = facets.find((x) => x.key === active) ?? facets[0];
  return (
    <Popover
      width={560}
      scroll={false}
      trigger={({ toggle, open }) => (
        <Button size="md" onClick={toggle} icon={<Filter className="size-3.5" />} className={cn(open && "border-brand-400")}>
          篩選
          {f.count > 0 && <span className="rounded-full bg-brand-500 px-1.5 text-[11px] leading-[18px] text-white">{f.count}</span>}
        </Button>
      )}
    >
      <div className="flex">
        <div className="w-40 shrink-0 space-y-0.5 border-r border-ink-100 pr-1.5">
          {facets.map((x) => {
            const n = f.value[x.key]?.length ?? 0;
            return (
              <button
                key={x.key}
                onClick={() => setActive(x.key)}
                className={cn("flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors", active === x.key ? "bg-brand-50 font-medium text-brand-800" : "text-ink-700 hover:bg-ink-50")}
              >
                <span className="min-w-0 flex-1 truncate">{x.label}</span>
                {n > 0 && <span className="rounded-full bg-brand-500 px-1.5 text-[10.5px] leading-[17px] text-white">{n}</span>}
              </button>
            );
          })}
        </div>
        <div className="min-w-0 flex-1 pl-2">
          {cur && <OptionList key={cur.key} multi searchAt={1} placeholder={`搜尋${cur.label}`} options={cur.options} selected={f.value[cur.key] ?? []} onPick={(v) => f.toggle(cur.key, v)} height={300} />}
        </div>
      </div>
      <div className="mt-1.5 flex items-center justify-between border-t border-ink-100 px-1 pt-1.5">
        {cur && (f.value[cur.key]?.length ?? 0) > 0 ? (
          <Button size="sm" variant="ghost" onClick={() => f.set(cur.key, [])}>
            清除{cur.label}
          </Button>
        ) : (
          <span />
        )}
        <Button size="sm" variant="ghost" onClick={f.clear} disabled={!f.count}>
          清除全部
        </Button>
      </div>
    </Popover>
  );
}

// 已套用的條件：每個值一個標籤，可個別移除或全部清除
export function FilterChips({ facets, f, extra = [], onClearAll }: { facets: Facet[]; f: ReturnType<typeof useFacets>; extra?: { key: string; label: ReactNode; onRemove: () => void }[]; onClearAll?: () => void }) {
  const chips = [
    ...extra,
    ...facets.flatMap((x) =>
      (f.value[x.key] ?? []).map((v) => ({
        key: `${x.key}:${v}`,
        label: (
          <>
            <span className="text-ink-400">{x.label}</span>
            {x.options.find((o) => o.value === v)?.label ?? v}
          </>
        ),
        onRemove: () => f.toggle(x.key, v),
      })),
    ),
  ];
  return (
    <AnimatePresence initial={false}>
      {chips.length > 0 && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease }} className="overflow-hidden">
          <div className="flex flex-wrap items-center gap-1.5 pb-3">
            {chips.map((c) => (
              <span key={c.key} className="flex h-7 items-center gap-1.5 rounded-full border border-ink-200 bg-white pl-2.5 pr-1 text-[12px] text-ink-700 shadow-card">
                {c.label}
                <button onClick={c.onRemove} className="grid size-5 place-items-center rounded-full text-ink-400 hover:bg-ink-100 hover:text-ink-700" aria-label="移除">
                  <X className="size-3" />
                </button>
              </span>
            ))}
            <button
              onClick={() => {
                f.clear();
                onClearAll?.();
              }}
              className="px-1.5 text-[12px] font-medium text-brand-600 hover:text-brand-700"
            >
              清除全部
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// 列表工具列：左側搜尋＋篩選（＋頁面專屬條件），右側檢視控制與筆數
export function Toolbar({ search, filter, extra, right, count }: { search: ReactNode; filter?: ReactNode; extra?: ReactNode; right?: ReactNode; count?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      {search}
      {filter}
      {extra}
      <div className="flex-1" />
      {right}
      {count != null && <span className="pl-1 text-[12.5px] tabular-nums text-ink-500">{count}</span>}
    </div>
  );
}
