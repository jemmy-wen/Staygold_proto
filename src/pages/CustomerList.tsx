import { useMemo, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Briefcase, Building2, ChevronRight, ChevronsUpDown, Mail, MapPin, Phone, Plus, Tag, UserRound } from "lucide-react";
import { useStore } from "../lib/store";
import { INDUSTRIES, REGIONS } from "../lib/seed";
import { FilterChips, FilterMenu, Toolbar, pass, useFacets, type Facet } from "../components/filters";
import { REFERRALS } from "../lib/customerFields";
import type { Customer } from "../lib/types";
import { STATUSES, cn, nowStamp, uid } from "../lib/utils";
import { Badge, Button, PageHeader, SearchInput, StatusPill, ease } from "../components/ui";

type SortKey = "short" | "industry" | "referral" | "cases";

// 客戶列表：只供瀏覽與搜尋，點一列進入客戶詳情後再編輯
export function CustomerList() {
  const s = useStore();
  const [q, setQ] = useState("");
  const f = useFacets();
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "short", dir: 1 });
  const contact = s.perms.customerContact;
  const casesOf = (id: string) => s.cases.filter((c) => c.customerId === id);

  const latestOf = (id: string) => [...casesOf(id)].sort((a, b) => b.year.localeCompare(a.year) || b.id.localeCompare(a.id))[0];
  const uniq = (a: string[]) => [...new Set(a.filter(Boolean))].sort((x, y) => x.localeCompare(y, "zh-Hant"));
  const countBy = (fn: (c: Customer) => string[]) => (v: string) => `${s.customers.filter((c) => fn(c).includes(v)).length}`;
  const facets: Facet[] = useMemo(() => {
    const opt = (vals: string[], fn: (c: Customer) => string[]) => vals.map((v) => ({ value: v, label: v, hint: countBy(fn)(v) }));
    const items = (c: Customer) => casesOf(c.id).map((x) => x.item);
    const status = (c: Customer) => {
      const l = latestOf(c.id);
      return l ? [s.statusOf(l)] : [];
    };
    return [
      { key: "industry", label: "產業別", options: opt(uniq([...INDUSTRIES, ...s.customers.map((c) => c.industry)]), (c) => [c.industry]) },
      { key: "region", label: "地區", options: opt(uniq([...REGIONS, ...s.customers.map((c) => c.region)]), (c) => [c.region]) },
      { key: "referral", label: "介紹來源", options: opt(REFERRALS, (c) => [c.referral.type]) },
      { key: "item", label: "驗證項目", options: opt(uniq(s.cases.map((x) => x.item)), items) },
      { key: "status", label: "最新案件狀態", options: opt(STATUSES.filter((st) => s.customers.some((c) => status(c).includes(st))), status) },
    ];
  }, [s.customers, s.cases]);

  const list = useMemo(() => {
    const k = q.trim().toLowerCase();
    const rows = s.customers.filter((c) => {
      const l = latestOf(c.id);
      return (
        pass(f.value, "industry", c.industry) &&
        pass(f.value, "region", c.region) &&
        pass(f.value, "referral", c.referral.type) &&
        pass(f.value, "item", casesOf(c.id).map((x) => x.item)) &&
        pass(f.value, "status", l ? s.statusOf(l) : "") &&
        (!k || [c.short, c.name, c.contact.name, c.referral.source, c.enCode].some((x) => x.toLowerCase().includes(k)))
      );
    });
    const val = (c: Customer): string | number =>
      sort.key === "cases" ? s.cases.filter((x) => x.customerId === c.id).length : sort.key === "industry" ? c.industry : sort.key === "referral" ? c.referral.type : c.short;
    return [...rows].sort((a, b) => {
      const x = val(a);
      const y = val(b);
      return (typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "zh-Hant")) * sort.dir;
    });
  }, [s.customers, s.cases, q, f.value, sort]);

  const create = () => {
    const id = uid("c");
    s.addCustomer({
      id, code: "", enCode: "", short: "新客戶", pinyin: "", name: "", taxId: "", industry: "", region: "", sites: [],
      contact: { name: "", phone: "", email: "" }, address: "", invoiceTitle: "", invoiceAddress: "", referral: { type: "其他", source: "" }, domain: "", createdAt: nowStamp().slice(0, 10),
    });
    s.log({ module: "客戶", target: "新客戶", action: "新增客戶" });
    s.go({ page: "customer", id, tab: "info" });
  };

  const Head = ({ icon, label, k }: { icon: ReactNode; label: string; k?: SortKey }) => (
    <th className="h-11 border-b border-r border-ink-200 bg-ink-25 px-4 text-left text-[12.5px] font-semibold text-ink-700">
      <button
        disabled={!k}
        onClick={() => k && setSort((x) => ({ key: k, dir: x.key === k ? ((-x.dir) as 1 | -1) : 1 }))}
        className="flex w-full items-center gap-2 disabled:cursor-default [&>svg:first-child]:size-4 [&>svg:first-child]:text-ink-400"
      >
        {icon}
        <span className="flex-1 text-left">{label}</span>
        {k && <ChevronsUpDown className={cn("size-3.5", sort.key === k ? "text-brand-600" : "text-ink-300")} />}
      </button>
    </th>
  );

  return (
    <div>
      <PageHeader
        title="客戶資料"
        actions={
          s.perms.customersEdit && (
            <Button variant="dark" icon={<Plus className="size-4" />} onClick={create}>
              新增客戶
            </Button>
          )
        }
      />
      <div className="px-8 py-5">
        <Toolbar
          search={<SearchInput value={q} onChange={setQ} placeholder="搜尋簡稱、公司、聯絡人、介紹人" className="w-72" />}
          filter={<FilterMenu facets={facets} f={f} />}
          count={`${list.length} 家客戶`}
        />
        <FilterChips facets={facets} f={f} />
        <div className="overflow-hidden rounded-xl border border-ink-200 bg-white shadow-card">
          <table className="w-full table-fixed border-separate border-spacing-0">
            <colgroup>
              <col />
              <col style={{ width: 260 }} />
              <col style={{ width: 170 }} />
              <col style={{ width: 200 }} />
              <col style={{ width: 210 }} />
              <col style={{ width: 44 }} />
            </colgroup>
            <thead>
              <tr>
                <Head icon={<Building2 />} label="客戶" k="short" />
                <Head icon={<UserRound />} label="聯絡人" />
                <Head icon={<MapPin />} label="產業別／地區" k="industry" />
                <Head icon={<Tag />} label="介紹來源" k="referral" />
                <Head icon={<Briefcase />} label="案件" k="cases" />
                <th className="h-11 border-b border-ink-200 bg-ink-25" />
              </tr>
            </thead>
            <tbody>
              {list.map((c, i) => {
                const cs = casesOf(c.id);
                const latest = [...cs].sort((a, b) => b.year.localeCompare(a.year) || b.id.localeCompare(a.id))[0];
                return (
                  <motion.tr
                    key={c.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, ease, delay: Math.min(i, 12) * 0.015 }}
                    onClick={() => s.go({ page: "customer", id: c.id })}
                    className="group cursor-pointer transition-colors hover:bg-brand-50/40"
                  >
                    <td className="border-b border-ink-100 px-4 py-3">
                      <p className="truncate text-[13.5px] font-semibold text-ink-900">{c.short}</p>
                      <p className="truncate text-[12px] text-ink-500">{c.name || "—"}</p>
                    </td>
                    <td className="border-b border-ink-100 px-4 py-3 text-[12.5px]">
                      {contact ? (
                        <div className="min-w-0 space-y-0.5">
                          <p className="truncate font-medium text-ink-900">{c.contact.name || "—"}</p>
                          <p className="flex items-center gap-1.5 truncate text-ink-500">
                            <Mail className="size-3.5 shrink-0 text-ink-400" />
                            <span className="truncate">{c.contact.email || "—"}</span>
                          </p>
                          <p className="flex items-center gap-1.5 truncate text-ink-500">
                            <Phone className="size-3.5 shrink-0 text-ink-400" />
                            {c.contact.phone || "—"}
                          </p>
                        </div>
                      ) : (
                        <span className="text-ink-300">未開放</span>
                      )}
                    </td>
                    <td className="border-b border-ink-100 px-4 py-3 text-[12.5px]">
                      <p className="truncate font-medium text-ink-800">{c.industry || "—"}</p>
                      <p className="mt-0.5 truncate text-ink-500">{c.region || "—"}</p>
                    </td>
                    <td className="border-b border-ink-100 px-4 py-3 text-[12.5px]">
                      <Badge tone={c.referral.type === "驗證單位介紹" || c.referral.type === "舊客戶轉介" ? "brand" : "gray"}>{c.referral.type}</Badge>
                      <p className="mt-1 truncate text-ink-500">{c.referral.source || "—"}</p>
                    </td>
                    <td className="border-b border-ink-100 px-4 py-3 text-[12.5px]">
                      {latest ? (
                        <div className="min-w-0">
                          <StatusPill status={s.statusOf(latest)} />
                          <p className="mt-1 truncate text-ink-500">
                            共 {cs.length} 件・{latest.item}
                          </p>
                        </div>
                      ) : (
                        <span className="text-ink-300">尚無案件</span>
                      )}
                    </td>
                    <td className="border-b border-ink-100 pr-3 text-right">
                      <ChevronRight className="ml-auto size-4 text-ink-300 transition-colors group-hover:text-brand-600" />
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
          {list.length === 0 && <p className="py-12 text-center text-[13px] text-ink-400">沒有符合條件的客戶</p>}
        </div>
      </div>
    </div>
  );
}
