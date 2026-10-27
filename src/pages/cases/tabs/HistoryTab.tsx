import { History } from "lucide-react";
import { useStore } from "../../../lib/store";
import type { Case } from "../../../lib/types";
import { Avatar, Badge, Empty, Table, td, th } from "../../../components/ui";
import { cn } from "../../../lib/utils";

export function HistoryTab({ c }: { c: Case }) {
  const s = useStore();
  const list = s.audit.filter((a) => a.caseId === c.id);
  if (!list.length) return <Empty icon={<History />} title="這個案件還沒有異動紀錄" />;
  return (
    <Table>
      <thead>
        <tr>
          <th className={cn(th, "pl-5")}>時間</th>
          <th className={th}>人員</th>
          <th className={th}>項目</th>
          <th className={th}>動作</th>
          <th className={th}>變更前</th>
          <th className={th}>變更後</th>
        </tr>
      </thead>
      <tbody>
        {list.map((a) => {
          const m = s.memberOf(a.actor);
          return (
            <tr key={a.id}>
              <td className={cn(td, "pl-5 tabular-nums text-ink-500")}>{a.time}</td>
              <td className={td}>
                <span className="flex items-center gap-2">
                  <Avatar m={m} size={22} />
                  {m?.nickname ?? m?.name}
                </span>
              </td>
              <td className={td}>
                <Badge tone="outline">{a.target}</Badge>
              </td>
              <td className={td}>{a.action}</td>
              <td className={cn(td, "text-ink-400")}>{a.before ?? "—"}</td>
              <td className={cn(td, "text-ink-900")}>{a.after ?? "—"}</td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}
