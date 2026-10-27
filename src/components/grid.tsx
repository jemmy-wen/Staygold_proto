import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { useStore } from "../lib/store";
import { cn } from "../lib/utils";
import { Button, Modal, OptionList, Popover, ease } from "./ui";

export type Change = { row: string; field: string; value: string; original: string };

// 未儲存變更登記：有變更時右上角出現「儲存變更」，離開頁面前會詢問
export function useLeaveGuard(count: number, save: () => void, discard: () => void) {
  const s = useStore();
  const id = useId();
  const ref = useRef({ save, discard });
  ref.current = { save, discard };
  useEffect(() => {
    s.registerGuard(id, count > 0 ? { count, save: () => ref.current.save(), discard: () => ref.current.discard() } : null);
  }, [count]);
  useEffect(() => () => s.registerGuard(id, null), []);
}

// 欄位暫存：編輯先存在畫面上，按「儲存變更」才寫入
export function useGridDraft(onSave: (changes: Change[]) => void) {
  const [drafts, setDrafts] = useState<Record<string, Change>>({});
  const ref = useRef({ drafts, onSave });
  ref.current = { drafts, onSave };
  const count = Object.keys(drafts).length;
  const save = () => {
    const list = Object.values(ref.current.drafts);
    if (!list.length) return;
    ref.current.onSave(list);
    setDrafts({});
  };
  const discard = () => setDrafts({});
  useLeaveGuard(count, save, discard);

  return {
    count,
    get: (row: string, field: string, original: string) => drafts[`${row}|${field}`]?.value ?? original,
    dirty: (row: string, field: string) => !!drafts[`${row}|${field}`],
    set: (row: string, field: string, original: string, value: string) =>
      setDrafts((d) => {
        const k = `${row}|${field}`;
        const n = { ...d };
        if (value === original) delete n[k];
        else n[k] = { row, field, value, original };
        return n;
      }),
  };
}

export type Grid = ReturnType<typeof useGridDraft>;

export function SaveBar() {
  const s = useStore();
  const count = s.dirtyCount;
  useEffect(() => {
    if (!count) return;
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [count]);
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} transition={{ duration: 0.2, ease }} className="flex items-center gap-2">
          <span className="text-[12.5px] text-ink-500">{count} 項未儲存</span>
          <Button size="sm" variant="ghost" onClick={s.discardAll}>
            捨棄
          </Button>
          <Button size="sm" variant="dark" icon={<Check className="size-3.5" />} onClick={s.saveAll}>
            儲存變更
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function LeaveModal() {
  const s = useStore();
  return (
    <Modal
      open={!!s.pendingLeave}
      onClose={() => s.resolveLeave("cancel")}
      title={`有 ${s.pendingLeave?.count ?? 0} 項未儲存的變更`}
      width={440}
      footer={
        <>
          <Button variant="ghost" onClick={() => s.resolveLeave("cancel")}>
            取消
          </Button>
          <Button onClick={() => s.resolveLeave("discard")}>不儲存</Button>
          <Button variant="dark" onClick={() => s.resolveLeave("save")}>
            儲存
          </Button>
        </>
      }
    >
      <p className="text-[13px] text-ink-600">離開前要儲存剛剛的變更嗎？</p>
    </Modal>
  );
}

const move = (pos: [number, number], dr: number, dc: number) => {
  for (let step = 1; step < 30; step++) {
    const el = document.querySelector<HTMLElement>(`[data-cell="${pos[0] + dr * step}:${pos[1] + dc * (dr ? 0 : step)}"]`);
    if (el) return el.click();
    if (dr) return;
  }
};

// 儲存格：點擊即在原位編輯（不改變欄寬與列高）；Enter 移到下一列、Tab 移到下一欄、Esc 取消
export function GridCell({
  value,
  dirty,
  onChange,
  editable = true,
  type = "text",
  options,
  format,
  align = "left",
  className,
  pos,
  placeholder = "",
  as = "td",
}: {
  value: string;
  dirty?: boolean;
  onChange: (v: string) => void;
  editable?: boolean;
  type?: "text" | "number" | "date" | "select";
  options?: string[];
  format?: (v: string) => ReactNode;
  align?: "left" | "right";
  className?: string;
  pos?: [number, number];
  placeholder?: string;
  as?: "td" | "div";
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const shown = value ? (format ? format(value) : value) : <span className="text-ink-300">{placeholder}</span>;
  const Wrap = as;
  const base = cn(as === "td" ? "relative h-11 border-b border-r border-ink-100 p-0 text-[13px]" : "relative -mx-2 h-8 rounded-md text-[13px]", dirty && "bg-brand-50/60", className);
  const inner = cn("flex h-full w-full items-center truncate", as === "td" ? "px-3" : "rounded-md px-2", align === "right" && "justify-end text-right");
  const cell = pos ? `${pos[0]}:${pos[1]}` : undefined;

  if (!editable) return <Wrap className={base}><div className={cn(inner, "text-ink-700")}>{shown}</div></Wrap>;

  if (type === "select")
    return (
      <Wrap className={base}>
        <Popover
          width={200}
          open={editing}
          onOpenChange={setEditing}
          className="h-full"
          trigger={({ toggle }) => (
            <div data-cell={cell} onClick={toggle} className={cn(inner, "cursor-default", editing && "shadow-[inset_0_0_0_2px_#32716A]")}>
              {shown}
              {dirty && <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-brand-500" />}
            </div>
          )}
        >
          {(close) => (
            <OptionList
              options={(options ?? []).map((o) => ({ value: o, label: o }))}
              selected={[value]}
              onPick={(v) => {
                onChange(v);
                close();
              }}
            />
          )}
        </Popover>
      </Wrap>
    );

  return (
    <Wrap className={base}>
      {editing ? (
        <input
          autoFocus
          type={type}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            setEditing(false);
            if (draft !== value) onChange(draft);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setDraft(value);
              setEditing(false);
            }
            if (e.key === "Enter" || e.key === "Tab") {
              e.preventDefault();
              (e.target as HTMLInputElement).blur();
              if (pos) setTimeout(() => (e.key === "Enter" ? move(pos, 1, 0) : move(pos, 0, e.shiftKey ? -1 : 1)), 0);
            }
          }}
          className={cn("absolute inset-0 h-full w-full bg-white text-[13px]", as === "td" ? "px-3" : "rounded-md px-2", " text-ink-900 outline-none shadow-[inset_0_0_0_2px_#32716A]", align === "right" && "text-right")}
        />
      ) : (
        <div data-cell={cell} onClick={() => setEditing(true)} className={cn(inner, "cursor-text hover:bg-ink-50/70")}>
          {shown}
          {dirty && <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-brand-500" />}
        </div>
      )}
    </Wrap>
  );
}
