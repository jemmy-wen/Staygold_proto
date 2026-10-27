import type { Customer } from "./types";

// 客戶欄位：列表與詳情頁共用的讀寫方式，聯絡人與介紹來源為巢狀欄位
export const REFERRALS = ["驗證單位介紹", "舊客戶轉介", "官網", "其他"];
export const CUSTOMER_FIELD_LABEL: Record<string, string> = {
  short: "客戶簡稱", name: "公司名稱", enCode: "英文代碼", pinyin: "拼音標頭", industry: "產業別", region: "地區", address: "公司地址", domain: "Email 網域",
  referralType: "介紹來源", referralSource: "介紹人", contactName: "聯絡人", contactTitle: "聯絡人職稱", phone: "電話", email: "Email",
  invoiceTitle: "發票抬頭", taxId: "統一編號", invoiceAddress: "發票地址",
};

export const readCustomerField = (c: Customer, f: string): string =>
  ({ contactName: c.contact.name, contactTitle: c.contact.title ?? "", phone: c.contact.phone, email: c.contact.email, referralType: c.referral.type, referralSource: c.referral.source })[f] ??
  String((c as unknown as Record<string, unknown>)[f] ?? "");

export const writeCustomerField = (c: Customer, f: string, v: string): Customer => {
  if (f === "contactName") return { ...c, contact: { ...c.contact, name: v } };
  if (f === "contactTitle") return { ...c, contact: { ...c.contact, title: v } };
  if (f === "phone") return { ...c, contact: { ...c.contact, phone: v } };
  if (f === "email") return { ...c, contact: { ...c.contact, email: v } };
  if (f === "referralType") return { ...c, referral: { ...c.referral, type: v as Customer["referral"]["type"] } };
  if (f === "referralSource") return { ...c, referral: { ...c.referral, source: v } };
  if (f === "enCode" || f === "pinyin") return { ...c, [f]: v.toUpperCase() };
  return { ...c, [f]: v };
};
