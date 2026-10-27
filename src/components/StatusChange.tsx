import { useState } from "react";
import { Mail } from "lucide-react";
import { useStore } from "../lib/store";
import { RECIPIENT_LABEL } from "../lib/rules";
import type { CaseStatus, NotifHit } from "../lib/types";
import { Button, Modal } from "./ui";

// 改案件狀態：會觸發 Email 通知的先確認，其餘直接改（皆寫入異動紀錄）
export function useStatusChange() {
  const s = useStore();
  const [pending, setPending] = useState<{ id: string; status: CaseStatus; mails: NotifHit[] } | null>(null);
  const request = (id: string, status: CaseStatus) => {
    const mails = s.emailImpact(id, status);
    if (mails.length) setPending({ id, status, mails });
    else s.setStatus(id, status);
  };
  const modal = (
    <Modal
      open={!!pending}
      onClose={() => setPending(null)}
      title={pending ? `改為「${pending.status}」` : ""}
      width={480}
      footer={
        <>
          <Button variant="ghost" onClick={() => setPending(null)}>
            取消
          </Button>
          <Button
            variant="dark"
            onClick={() => {
              if (pending) s.setStatus(pending.id, pending.status);
              setPending(null);
            }}
          >
            確認並寄出
          </Button>
        </>
      }
    >
      <p className="text-[13px] text-ink-600">{pending?.id}</p>
      <div className="mt-3 divide-y divide-ink-100 rounded-lg border border-ink-200">
        {pending?.mails.map((m) => (
          <div key={m.key} className="flex items-center gap-3 px-3.5 py-2.5 text-[13px]">
            <Mail className="size-4 shrink-0 text-ink-400" />
            <span className="flex-1 font-medium text-ink-900">{m.type}</span>
            <span className="text-ink-500">{m.recipients.map((r) => RECIPIENT_LABEL[r]).join("、")}</span>
          </div>
        ))}
      </div>
    </Modal>
  );
  return { request, modal };
}
