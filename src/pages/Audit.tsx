import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useStore } from "../lib/store";
import type { AuditEntry } from "../lib/types";
import { Avatar, Badge, PageHeader, SearchInput, td, th } from "../components/ui";
import { FilterChips, FilterMenu, Toolbar, pass, useFacets, type Facet } from "../components/filters";
import { cn } from "../lib/utils";

const MODULES: AuditEntry["module"][] = ["案件", "客戶", "財務", "差旅費", "Email", "成員與權限", "系統設定"];
const TONE = { 案件: "brand", 客戶: "blue", 財務: "green", 差旅費: "amber", Email: "violet", 成員與權限: "red", 系統設定: "gray" } as const;

export function AuditLog() {
  const s = useStore();
  const [q, setQ] = useState("");
  const f = useFacets();
  const nameOf = (id: string) => s.memberOf(id)?.nickname ?? s.memberOf(id)?.name ?? id;
  const facets: Facet[] = [
    { key: "module", label: "模組", options: MODULES.map((m) => ({ value: m, label: m, hint: String(s.audit.filter((a) => a.module === m).length) })) },
    { key: "actor", label: "人員", options: [...new Set(s.audit.map((a) => a.actor))].map((id) => ({ value: id, label: nameOf(id), hint: String(s.audit.filter((a) => a.actor === id).length) })) },
    { key: "case", label: "案件", options: [...new Set(s.audit.map((a) => a.caseId).filter((x): x is string => !!x))].map((id) => ({ value: id, label: id, hint: String(s.audit.filter((a) => a.caseId === id).length) })) },
  ];
  const list = useMemo(
    () =>
      s.audit.filter(
        (a) =>
          pass(f.value, "module", a.module) &&
          pass(f.value, "actor", a.actor) &&
          pass(f.value, "case", a.caseId ?? "") &&
          (!q || [a.target, a.action, a.caseId ?? "", a.after ?? "", a.before ?? ""].some((x) => x.toLowerCase().includes(q.toLowerCase()))),
      ),
    [s.audit, q, f.value],
  );
  return (
    <div className="pb-10">
      <PageHeader title="異動紀錄" />
      <div className="px-8 pt-5">
        <Toolbar
          search={<SearchInput value={q} onChange={setQ} placeholder="搜尋案件編號、項目、內容" className="w-72" />}
          filter={<FilterMenu facets={facets} f={f} />}
          count={`${list.length} 筆紀錄`}
        />
        <FilterChips facets={facets} f={f} />
      </div>
      <div className="px-8">
        <div className="overflow-x-auto rounded-xl border border-ink-200 bg-white shadow-card">
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr>
                {["時間", "人員", "模組", "案件", "項目", "動作", "變更內容"].map((h, i) => (
                  <th key={h} className={cn(th, i === 0 && "pl-5")}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((a) => {
                const m = s.memberOf(a.actor);
                return (
                  <tr key={a.id} className="hover:bg-ink-25">
                    <td className={cn(td, "pl-5 tabular-nums text-ink-500")}>{a.time}</td>
                    <td className={td}>
                      <span className="flex items-center gap-2">
                        <Avatar m={m} size={22} />
                        {m?.nickname ?? m?.name ?? a.actor}
                      </span>
                    </td>
                    <td className={td}>
                      <Badge tone={TONE[a.module]}>{a.module}</Badge>
                    </td>
                    <td className={cn(td, "font-mono text-[12px]")}>
                      {a.caseId ? (
                        <button onClick={() => s.go({ page: "case", id: a.caseId! })} className="text-ink-600 hover:text-ink-800 hover:underline">
                          {a.caseId}
                        </button>
                      ) : (
                        <span className="text-ink-300">—</span>
                      )}
                    </td>
                    <td className={cn(td, "max-w-[220px] truncate")}>{a.target}</td>
                    <td className={td}>{a.action}</td>
                    <td className={cn(td, "max-w-[280px]")}>
                      {a.before || a.after ? (
                        <span className="flex items-center gap-1.5 truncate">
                          {a.before && <span className="truncate text-ink-400 line-through decoration-ink-300">{a.before}</span>}
                          {a.before && a.after && <ArrowRight className="size-3 shrink-0 text-ink-300" />}
                          {a.after && <span className="truncate text-ink-900">{a.after}</span>}
                        </span>
                      ) : (
                        <span className="text-ink-300">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
