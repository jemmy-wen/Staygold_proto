import { useMemo, useState } from "react";
import { ArrowUpRight, Copy, FileImage, FileSpreadsheet, FileText, Folder, FolderOpen, FolderPlus, Link2, LockKeyhole, RefreshCw, TriangleAlert, Unlink, UserX } from "lucide-react";
import { useStore } from "../../../lib/store";
import { DRIVE_L4, filesFor } from "../../../lib/seed";
import type { Case } from "../../../lib/types";
import { cn, fmtDate, folderL1, folderL3 } from "../../../lib/utils";
import { Avatar, Badge, Button, Callout, Card, Input } from "../../../components/ui";

const STAFF = ["exec1", "partner", "admin1", "admin2", "fin"];

export function DocsTab({ c }: { c: Case }) {
  const s = useStore();
  const cu = s.customerOf(c);
  const [link, setLink] = useState("");
  const [sub, setSub] = useState<string>("全部");
  const suggestedName = folderL3(cu, c.site, c.item, c.year);
  const groups = useMemo(() => (c.folder ? filesFor(c, cu.short) : []), [c, cu.short]);
  const can = s.perms.casesEdit;

  if (!c.folder)
    return (
      <div>
        <Card>
          <div className="flex flex-col items-center px-6 py-8 text-center">
            <FolderPlus className="size-7 stroke-[1.5] text-ink-300" />
            <p className="mt-4 text-[16px] font-semibold text-ink-900">這個案件還沒有綁定 Drive 資料夾</p>
            <div className="mt-6 w-full max-w-lg rounded-xl border border-ink-200 bg-ink-25 p-4 text-left">
              <p className="text-[12px] text-ink-500">第 3 層資料夾</p>
              <div className="mt-1.5 flex items-center justify-between gap-2 rounded-lg border border-ink-200 bg-white px-3 py-2">
                <span className="font-mono text-[13px] text-ink-900">{suggestedName}</span>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(suggestedName).catch(() => undefined);
                    s.toast("已複製資料夾名稱", "info");
                  }}
                  className="flex items-center gap-1 text-[12px] text-brand-600 hover:underline"
                >
                  <Copy className="size-3.5" />
                  複製
                </button>
              </div>
              <p className="mt-1.5 text-[11.5px] text-ink-400">
                位置：{folderL1(cu)}
                {c.site ? ` / ${cu.short}-${c.site}` : ""} / {suggestedName}
              </p>
            </div>
            {can ? (
              <div className="mt-4 flex w-full max-w-lg gap-2">
                <div className="relative flex-1">
                  <Link2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
                  <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="貼上 Drive 資料夾連結" className="pl-9" />
                </div>
                <Button
                  variant="dark"
                  disabled={!link.trim()}
                  onClick={() => {
                    s.updateCase(c.id, (x) => ({ ...x, folder: { url: link.trim(), name: suggestedName, sharedWith: [...STAFF, x.owner] } }));
                    s.log({ module: "案件", caseId: c.id, target: "Drive 資料夾", action: "綁定資料夾", after: suggestedName });
                    s.toast("已綁定資料夾，檔案清單已同步");
                  }}
                >
                  綁定
                </Button>
              </div>
            ) : null}
          </div>
        </Card>
      </div>
    );

  const hasAccess = c.folder.sharedWith.includes(s.me.id);

  if (!hasAccess)
    return (
      <Card>
        <div className="flex flex-col items-center px-6 py-12 text-center">
          <LockKeyhole className="size-7 stroke-[1.5] text-ink-300" />
          <p className="mt-4 text-[16px] font-semibold text-ink-900">此帳號未有雲端存取權限，請聯絡管理員開通</p>
        </div>
      </Card>
    );

  const shown = sub === "全部" ? groups.flatMap((g) => g.files.map((f) => ({ ...f, folder: g.folder }))) : groups.find((g) => g.folder === sub)?.files.map((f) => ({ ...f, folder: sub })) ?? [];

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-ink-200 bg-white shadow-card">
        <div className="flex items-center justify-between gap-4 border-b border-ink-100 px-5 py-3.5">
          <div className="flex min-w-0 items-center gap-2 text-[13px]">
            <FolderOpen className="size-4 text-ink-400" />
            <span className="truncate text-ink-500">{folderL1(cu)}</span>
            {c.site && (
              <>
                <span className="text-ink-300">/</span>
                <span className="truncate text-ink-500">
                  {cu.short}-{c.site}
                </span>
              </>
            )}
            <span className="text-ink-300">/</span>
            <span className="truncate font-medium text-ink-900">{c.folder.name}</span>
            <Badge tone="green" className="ml-1">
              <RefreshCw className="size-3" />
              已同步
            </Badge>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div className="mr-2 flex items-center -space-x-1.5" title="共用名單（以 Google Drive 為準）">
              {c.folder.sharedWith.slice(0, 5).map((id) => (
                <Avatar key={id} m={s.memberOf(id)} size={24} ring />
              ))}
              {c.folder.sharedWith.length > 5 && <span className="grid size-6 place-items-center rounded-full bg-ink-100 text-[10.5px] text-ink-500 ring-2 ring-white">+{c.folder.sharedWith.length - 5}</span>}
            </div>
            {can && (
              <Button
                size="sm"
                variant="ghost"
                icon={<Unlink className="size-3.5" />}
                onClick={() => {
                  s.updateCase(c.id, (x) => ({ ...x, folder: undefined }));
                  s.log({ module: "案件", caseId: c.id, target: "Drive 資料夾", action: "解除綁定", before: c.folder!.name });
                  s.toast("已解除綁定", "info");
                }}
              >
                解除綁定
              </Button>
            )}
            <a href={c.folder.url} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-2.5 text-[12.5px] font-medium text-ink-800 shadow-card hover:bg-ink-25">
              在 Drive 開啟 <ArrowUpRight className="size-3.5 text-ink-400" />
            </a>
          </div>
        </div>
        <div className="grid grid-cols-[230px_minmax(0,1fr)]">
          <nav className="border-r border-ink-100 p-2">
            {["全部", ...DRIVE_L4].map((f) => {
              const n = f === "全部" ? groups.reduce((a, g) => a + g.files.length, 0) : groups.find((g) => g.folder === f)?.files.length ?? 0;
              return (
                <button
                  key={f}
                  onClick={() => setSub(f)}
                  className={cn("flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[12.5px]", sub === f ? "bg-ink-50 font-medium text-ink-800" : "text-ink-600 hover:bg-ink-50", n === 0 && sub !== f && "text-ink-300")}
                >
                  <Folder className={cn("size-3.5 shrink-0", n ? "text-ink-500" : "text-ink-300")} />
                  <span className="min-w-0 flex-1 truncate">{f}</span>
                  <span className="text-[11px] tabular-nums text-ink-400">{n}</span>
                </button>
              );
            })}
          </nav>
          <div className="min-w-0">
            <table className="w-full border-separate border-spacing-0">
              <thead>
                <tr className="text-left text-[12px] text-ink-500">
                  <th className="border-b border-ink-100 px-4 py-2.5 font-medium">檔案名稱</th>
                  <th className="border-b border-ink-100 px-4 py-2.5 font-medium">文件類別</th>
                  <th className="border-b border-ink-100 px-4 py-2.5 font-medium">修改日期</th>
                  <th className="border-b border-ink-100 px-4 py-2.5 font-medium">修改者</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((f) => (
                  <tr key={f.folder + f.name} className="group cursor-pointer hover:bg-ink-25" onClick={() => window.open(c.folder!.url, "_blank", "noopener")}>
                    <td className="border-b border-ink-100 px-4 py-2.5">
                      <span className="flex items-center gap-2.5 text-[13px] text-ink-900">
                        {f.kind === "sheet" ? <FileSpreadsheet className="size-4 shrink-0 text-ink-400" /> : f.kind === "image" ? <FileImage className="size-4 shrink-0 text-ink-400" /> : f.kind === "pdf" ? <FileText className="size-4 shrink-0 text-rose-500" /> : <FileText className="size-4 shrink-0 text-ink-400" />}
                        <span className="truncate group-hover:text-ink-800 group-hover:underline">{f.name}</span>
                      </span>
                    </td>
                    <td className="border-b border-ink-100 px-4 text-[12.5px] text-ink-500">{f.folder}</td>
                    <td className="border-b border-ink-100 px-4 text-[12.5px] tabular-nums text-ink-500">{fmtDate(f.modified)}</td>
                    <td className="border-b border-ink-100 px-4 text-[12.5px] text-ink-500">{f.by === "顧問" ? s.memberOf(c.owner)?.nickname ?? s.memberOf(c.owner)?.name : f.by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {shown.length === 0 && <p className="px-4 py-10 text-center text-[12.5px] text-ink-400">「{sub}」資料夾目前沒有檔案</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
