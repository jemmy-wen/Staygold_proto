import { useMemo, useState } from "react";
import { CheckCircle2, CopyPlus, FilePlus2, FolderTree, Hash } from "lucide-react";
import { useStore } from "../../lib/store";
import { INDUSTRIES, REGIONS, VERIFIERS } from "../../lib/seed";
import type { Case, Customer } from "../../lib/types";
import { Button, Field, Input, Modal, Segmented, Select } from "../../components/ui";
import { casePrefix, cn, folderL3, nextCaseId, nowStamp, uid } from "../../lib/utils";

type Mode = "new" | "copy";

export function NewCaseModal({
  open,
  onClose,
  preset,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  preset?: { customerId?: string; newCustomer?: Partial<Customer>; item?: string; mode?: Mode; copyFrom?: string };
  onCreated?: (c: Case) => void;
}) {
  const s = useStore();
  const consultants = s.members.filter((m) => m.status === "active");
  const defaultOwner = consultants.some((m) => m.id === s.me.id) ? s.me.id : "";
  const [mode, setMode] = useState<Mode>(preset?.mode ?? "new");
  const [custMode, setCustMode] = useState<"exist" | "new">(preset?.newCustomer ? "new" : "exist");
  const [customerId, setCustomerId] = useState(preset?.customerId ?? "");
  const [nc, setNc] = useState({
    short: preset?.newCustomer?.short ?? "",
    enCode: preset?.newCustomer?.enCode ?? "",
    pinyin: preset?.newCustomer?.pinyin ?? "",
    name: preset?.newCustomer?.name ?? "",
    industry: preset?.newCustomer?.industry ?? "",
    region: preset?.newCustomer?.region ?? "",
    referralType: (preset?.newCustomer?.referral?.type ?? "驗證單位介紹") as Customer["referral"]["type"],
    referral: preset?.newCustomer?.referral?.source ?? "",
    contactName: preset?.newCustomer?.contact?.name ?? "",
    contactEmail: preset?.newCustomer?.contact?.email ?? "",
  });
  const [copyFrom, setCopyFrom] = useState(preset?.copyFrom ?? "");
  const [site, setSite] = useState("");
  const [item, setItem] = useState(preset?.item ?? "");
  const [category, setCategory] = useState<Case["category"]>(preset?.mode === "copy" ? "續證" : "新案");
  const [year, setYear] = useState("2026");
  const [owner, setOwner] = useState(defaultOwner);
  const [verifier, setVerifier] = useState("");

  const prev = s.cases.find((c) => c.id === copyFrom);
  const existing = mode === "copy" ? s.customers.find((c) => c.id === prev?.customerId) : s.customers.find((c) => c.id === customerId);
  const draftCustomer: Customer | undefined =
    mode === "new" && custMode === "new"
      ? nc.short && nc.enCode
        ? {
            id: uid("c"),
            code: "",
            enCode: nc.enCode.toUpperCase().replace(/[^A-Z0-9]/g, ""),
            short: nc.short,
            pinyin: (nc.pinyin || nc.enCode[0] || "").toUpperCase(),
            name: nc.name || nc.short,
            taxId: "",
            industry: nc.industry,
            region: nc.region,
            sites: site ? [site] : [],
            contact: { name: nc.contactName, phone: "", email: nc.contactEmail },
            address: "",
            invoiceTitle: "",
            invoiceAddress: "",
            referral: { type: nc.referralType, source: nc.referral },
            domain: nc.contactEmail.split("@")[1] ?? "",
            createdAt: nowStamp().slice(0, 10),
          }
        : undefined
      : existing;

  const effectiveSite = mode === "copy" ? prev?.site : site || undefined;
  const prefix = draftCustomer && item ? casePrefix(draftCustomer, effectiveSite, item, year) : "";
  const caseId = prefix ? nextCaseId(prefix, s.cases.map((c) => c.id)) : "";
  const folderName = draftCustomer && item ? folderL3(draftCustomer, effectiveSite, item, year) : "";
  const valid = !!caseId && !!owner && (mode === "new" || !!prev);

  const copyable = useMemo(() => s.visibleCases.filter((c) => !s.cases.some((x) => x.previousCase === c.id)).sort((a, b) => b.year.localeCompare(a.year)), [s.visibleCases, s.cases]);

  const reset = () => {
    setMode(preset?.mode ?? "new");
    setCustomerId(preset?.customerId ?? "");
    setCopyFrom(preset?.copyFrom ?? "");
    setItem(preset?.item ?? "");
    setSite("");
    setOwner(defaultOwner);
    setVerifier("");
  };

  const create = () => {
    if (!valid || !draftCustomer) return;
    const c: Case = {
      id: caseId,
      customerId: draftCustomer.id,
      site: effectiveSite,
      item,
      category,
      year,
      owner,
      coOwners: owner === s.me.id ? [] : [s.me.id],
      verifier: verifier || prev?.verifier || "",
      contractSessions: 0,
      review: "none",
      reviewLog: [],
      pricing: { coaching: { list: 0, base: 0, special: 0 }, audit: { list: 0, base: 0, special: 0 } },
      milestones: { audits: [] },
      periods: [],
      invoiceItem: `${item} 輔導服務費`,
      invoiceNote: "",
      previousCase: mode === "copy" ? prev?.id : undefined,
      ownerLog: [{ time: nowStamp(), from: "—", to: owner, by: s.me.id }],
      createdAt: nowStamp().slice(0, 10),
      createdBy: s.me.id,
    };
    s.addCase(c, custMode === "new" && mode === "new" ? draftCustomer : undefined);
    s.log({ module: "案件", caseId: c.id, target: "案件", action: mode === "copy" ? "複製舊案件建立案件" : "建立案件", before: prev?.id, after: c.id });
    if (custMode === "new" && mode === "new") s.log({ module: "客戶", target: draftCustomer.short, action: "新增客戶" });
    s.toast(`已建立案件 ${c.id}`);
    onClose();
    reset();
    if (onCreated) onCreated(c);
    else s.go({ page: "case", id: c.id });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      width={720}
      title="新增案件"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button variant="dark" disabled={!valid} onClick={create}>
            建立案件
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-2">
        {(
          [
            ["new", <FilePlus2 key="i" />, "新案件"],
            ["copy", <CopyPlus key="i" />, "複製舊案件"],
          ] as const
        ).map(([v, icon, t]) => (
          <button
            key={v}
            onClick={() => {
              setMode(v);
              setCategory(v === "copy" ? "續證" : "新案");
            }}
            className={cn("flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition", mode === v ? "border-brand-500 bg-brand-50/40 ring-1 ring-brand-500" : "border-ink-200 hover:bg-ink-25")}
          >
            <span className={cn("[&>svg]:size-[18px]", mode === v ? "text-brand-600" : "text-ink-400")}>{icon}</span>
            <span className="text-[13.5px] font-semibold text-ink-900">{t}</span>
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-4">
        {mode === "new" ? (
          <>
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-semibold text-ink-900">客戶</p>
              <Segmented
                size="sm"
                value={custMode}
                onChange={setCustMode}
                items={[
                  { value: "exist", label: "既有客戶" },
                  { value: "new", label: "新客戶" },
                ]}
              />
            </div>
            {custMode === "exist" ? (
              <div className="grid grid-cols-2 gap-3">
                <Field label="客戶" required>
                  <Select value={customerId} onChange={(v) => { setCustomerId(v); setSite(""); }} placeholder="選擇客戶" options={s.customers.map((c) => ({ value: c.id, label: `${c.short}・${c.name}` }))} />
                </Field>
                <Field label="部門／廠區">
                  <Select value={site} onChange={setSite} placeholder={existing?.sites.length ? "不分廠區" : "—"} options={existing?.sites ?? []} disabled={!existing?.sites.length} />
                </Field>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 rounded-xl border border-ink-200 bg-ink-25 p-4">
                <Field label="客戶簡稱" required>
                  <Input value={nc.short} onChange={(e) => setNc({ ...nc, short: e.target.value })} placeholder="例：興達鋼鐵" />
                </Field>
                <Field label="英文代碼" required>
                  <Input value={nc.enCode} onChange={(e) => setNc({ ...nc, enCode: e.target.value.toUpperCase() })} placeholder="例：HSINGDA" className="font-mono uppercase" />
                </Field>
                <Field label="拼音首字母">
                  <Input value={nc.pinyin} maxLength={1} onChange={(e) => setNc({ ...nc, pinyin: e.target.value.toUpperCase() })} placeholder="X" />
                </Field>
                <Field label="公司全名" className="col-span-2">
                  <Input value={nc.name} onChange={(e) => setNc({ ...nc, name: e.target.value })} placeholder="例：興達鋼鐵股份有限公司" />
                </Field>
                <Field label="部門／廠區">
                  <Input value={site} onChange={(e) => setSite(e.target.value)} placeholder="非集團可留空" />
                </Field>
                <Field label="產業別">
                  <Select value={nc.industry} onChange={(v) => setNc({ ...nc, industry: v })} placeholder="選擇" options={INDUSTRIES} />
                </Field>
                <Field label="地區">
                  <Select value={nc.region} onChange={(v) => setNc({ ...nc, region: v })} placeholder="選擇" options={REGIONS} />
                </Field>
                <Field label="介紹來源">
                  <Select value={nc.referralType} onChange={(v) => setNc({ ...nc, referralType: v as Customer["referral"]["type"] })} options={["驗證單位介紹", "舊客戶轉介", "官網", "其他"]} />
                </Field>
                <Field label="介紹人" className="col-span-3">
                  <Input value={nc.referral} onChange={(e) => setNc({ ...nc, referral: e.target.value })} />
                </Field>
              </div>
            )}
          </>
        ) : (
          <>
            <Field label="複製哪一個舊案件" required>
              <Select value={copyFrom} onChange={setCopyFrom} placeholder="選擇前案" options={copyable.map((c) => ({ value: c.id, label: `${c.id}（${s.statusOf(c)}）` }))} />
            </Field>
            {existing && (
              <div className="rounded-xl border border-ink-200 bg-ink-25 p-4">
                <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-800">
                  <CheckCircle2 className="size-4" />
                  自動帶入客戶主檔
                </p>
                <dl className="mt-3 grid grid-cols-4 gap-x-4 gap-y-2.5 text-[12.5px]">
                  {[
                    ["客戶簡稱", existing.short],
                    ["統一編號", existing.taxId || "—"],
                    ["廠區", prev?.site ?? "—"],
                    ["公司名稱", existing.name],
                    ["聯絡人", existing.contact.name],
                    ["電話", existing.contact.phone],
                    ["Email", existing.contact.email],
                  ].map(([k, v]) => (
                    <div key={k} className={cn("min-w-0", k === "公司名稱" || k === "Email" ? "col-span-2" : "")}>
                      <dt className="text-ink-500">{k}</dt>
                      <dd className="truncate font-medium text-ink-900">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </>
        )}

        <div>
          <p className="mb-2 text-[13px] font-semibold text-ink-900">案件內容</p>
          <div className="grid grid-cols-3 gap-3">
            <Field label="驗證項目" required>
              <Select value={item} onChange={setItem} placeholder="選擇驗證項目" options={s.settings.items} />
            </Field>
            <Field label="類別">
              <Select value={category} onChange={(v) => setCategory(v as Case["category"])} options={["新案", "續證", "追加輔導", "轉證"]} />
            </Field>
            <Field label="稽核年度" required>
              <Select value={year} onChange={setYear} options={["2026", "2027", "2028"]} />
            </Field>
            <Field label="負責人" required>
              <Select value={owner} onChange={setOwner} placeholder="指定負責人" options={consultants.map((m) => ({ value: m.id, label: `${m.nickname ?? m.name}・${m.title}` }))} />
            </Field>
            <Field label="驗證單位">
              <Select value={verifier} onChange={setVerifier} placeholder={prev?.verifier || "尚未確定"} options={VERIFIERS} />
            </Field>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-xl border border-dashed border-ink-300 bg-white p-4">
          <div>
            <p className="flex items-center gap-1.5 text-[12px] text-ink-500">
              <Hash className="size-3.5" />
              系統產生的案件編號
            </p>
            <p className={cn("mt-1.5 font-mono text-[15px] font-medium", caseId ? "text-ink-900" : "text-ink-300")}>{caseId || "選擇客戶與驗證項目後產生"}</p>
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-[12px] text-ink-500">
              <FolderTree className="size-3.5" />
              對應 Drive 第 3 層資料夾
            </p>
            <p className={cn("mt-1.5 font-mono text-[13px]", folderName ? "text-ink-700" : "text-ink-300")}>{folderName || "—"}</p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
