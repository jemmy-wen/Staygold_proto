import type { Store } from "./store";
import type { Case } from "./types";
import { casePrefix, nextCaseId, nowStamp } from "./utils";

// 續證：以「複製舊案件」建立新案件並關聯前案，客戶主檔欄位沿用，其餘因案而異的欄位清空
export function createRenewal(s: Store, prev: Case, opts: { owner?: string; year?: string } = {}) {
  const cu = s.customers.find((c) => c.id === prev.customerId)!;
  const year = opts.year ?? (prev.milestones.certExpiry?.slice(0, 4) ?? String(Number(prev.year) + 1));
  const id = nextCaseId(casePrefix(cu, prev.site, prev.item, year), s.cases.map((c) => c.id));
  const owner = opts.owner ?? prev.owner;
  const next: Case = {
    id,
    customerId: prev.customerId,
    site: prev.site,
    item: prev.item,
    category: "續證",
    year,
    owner,
    coOwners: owner === s.me.id ? [] : [s.me.id],
    verifier: prev.verifier,
    contractSessions: 0,
    review: "none",
    reviewLog: [],
    pricing: { coaching: { list: 0, base: 0, special: 0 }, audit: { list: 0, base: 0, special: 0 } },
    milestones: { audits: [] },
    periods: [],
    invoiceItem: prev.invoiceItem,
    invoiceNote: "",
    previousCase: prev.id,
    ownerLog: [{ time: nowStamp(), from: "—", to: owner, by: s.me.id }],
    createdAt: nowStamp().slice(0, 10),
    createdBy: s.me.id,
  };
  s.addCase(next);
  s.log({ module: "案件", caseId: id, target: "案件", action: "複製舊案件建立續證案件", before: prev.id, after: id });
  return next;
}
