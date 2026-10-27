import { useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Info, Search, X } from "lucide-react";
import type { CaseStatus, Member } from "../lib/types";
import { STATUSES, cn, initials } from "../lib/utils";

export const ease = [0.22, 1, 0.36, 1] as const;
export const spring = { type: "spring", stiffness: 520, damping: 38, mass: 0.8 } as const;

type BtnVariant = "default" | "dark" | "brand" | "ghost" | "danger" | "soft" | "outline";
export function Button({
  variant = "default",
  size = "md",
  className,
  icon,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: "sm" | "md" | "lg"; icon?: ReactNode }) {
  return (
    <button
      {...rest}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 disabled:pointer-events-none disabled:opacity-45",
        size === "sm" && "h-8 px-2.5 text-[12.5px]",
        size === "md" && "h-9 px-3.5 text-[13px]",
        size === "lg" && "h-10 px-4 text-sm",
        variant === "default" && "border border-ink-200 bg-white text-ink-800 shadow-card hover:border-ink-300 hover:bg-ink-25",
        variant === "dark" && "bg-brand-500 text-white shadow-card hover:bg-brand-600",
        variant === "brand" && "bg-brand-500 text-white shadow-card hover:bg-brand-600",
        variant === "soft" && "bg-brand-50 text-brand-700 hover:bg-brand-100",
        variant === "outline" && "border border-brand-500 bg-white text-brand-700 shadow-card hover:bg-brand-50",
        variant === "ghost" && "text-ink-600 hover:bg-ink-100 hover:text-ink-900",
        variant === "danger" && "border border-ink-200 bg-white text-rose-600 shadow-card hover:border-rose-200 hover:bg-rose-50",
        className,
      )}
    >
      {icon}
      {children}
    </button>
  );
}

export function IconButton({ className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={cn(
        "relative grid size-9 shrink-0 place-items-center rounded-lg border border-ink-200 bg-white text-ink-600 shadow-card transition duration-150 hover:border-ink-300 hover:text-ink-900 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300",
        className,
      )}
    >
      {children}
    </button>
  );
}

// 案件狀態只用三種色：簽約前（中性）、執行中到取證（主色）、續證期（琥珀）
const STATUS_GROUP: Record<CaseStatus, "neutral" | "run" | "renew"> = {
  洽詢中: "neutral",
  企劃書撰寫中: "neutral",
  內容審核中: "neutral",
  核價審核中: "neutral",
  已報價待回簽: "neutral",
  已簽約排課中: "run",
  輔導中: "run",
  稽核中: "run",
  已取證: "run",
  續證期: "renew",
};
const GROUP_STYLE = {
  neutral: { pill: "bg-ink-100 text-ink-700", stroke: "#6F7977" },
  run: { pill: "bg-brand-50 text-brand-800", stroke: "#32716A" },
  renew: { pill: "bg-amber-50 text-amber-800", stroke: "#D97706" },
};
export const statusStroke = (st: CaseStatus) => GROUP_STYLE[STATUS_GROUP[st]].stroke;

export function StatusIcon({ status, size = 14 }: { status: CaseStatus; size?: number }) {
  const idx = STATUSES.indexOf(status);
  const color = statusStroke(status);
  const r = 5;
  const c = 2 * Math.PI * r;
  if (status === "洽詢中")
    return (
      <svg width={size} height={size} viewBox="0 0 14 14" className="shrink-0">
        <circle cx="7" cy="7" r="5.5" fill="none" stroke={color} strokeWidth="1.5" strokeDasharray="2.2 1.8" />
      </svg>
    );
  if (status === "已取證")
    return (
      <svg width={size} height={size} viewBox="0 0 14 14" className="shrink-0">
        <circle cx="7" cy="7" r="6.25" fill={color} />
        <path d="M4.3 7.2 6.2 9l3.5-3.8" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  if (status === "續證期")
    return (
      <svg width={size} height={size} viewBox="0 0 14 14" className="shrink-0">
        <circle cx="7" cy="7" r="5.5" fill="none" stroke={color} strokeWidth="1.5" />
        <path d="M7 4.3V7l1.8 1.1" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  const frac = idx / 8;
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" className="shrink-0">
      <circle cx="7" cy="7" r="5.75" fill="none" stroke={color} strokeWidth="1.5" />
      <circle cx="7" cy="7" r={r / 2} fill="none" stroke={color} strokeWidth={r} strokeDasharray={`${(c / 2) * frac} ${c}`} transform="rotate(-90 7 7)" />
    </svg>
  );
}

export function StatusPill({ status, className }: { status: CaseStatus; className?: string }) {
  return (
    <span className={cn("inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[12px] font-medium", GROUP_STYLE[STATUS_GROUP[status]].pill, className)}>
      <StatusIcon status={status} size={12} />
      {status}
    </span>
  );
}

// Badge：淡底色語意標籤。只用五種語意：中性、主色（完成／正常）、琥珀（待處理）、紅（風險）、藍（進行中／資訊）
export type Tone = "gray" | "brand" | "green" | "amber" | "red" | "blue" | "violet" | "outline";
const TONE: Record<Tone, string> = {
  gray: "bg-ink-100 text-ink-600",
  outline: "border border-ink-200 bg-white text-ink-600",
  brand: "bg-brand-50 text-brand-700",
  green: "bg-brand-50 text-brand-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-rose-50 text-rose-700",
  blue: "bg-ink-100 text-ink-600",
  violet: "bg-ink-100 text-ink-600",
};
export function Badge({ tone = "gray", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cn("inline-flex h-[22px] items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-[11.5px] font-medium", TONE[tone], className)}>{children}</span>;
}

export function Switch({ checked, onChange, disabled, size = "md", id }: { checked: boolean; onChange?: (v: boolean) => void; disabled?: boolean; size?: "sm" | "md"; id?: string }) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cn(
        "relative inline-flex shrink-0 items-center rounded-full p-[2px] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 disabled:cursor-not-allowed disabled:opacity-40",
        size === "md" ? "h-[22px] w-[38px]" : "h-[18px] w-[30px]",
        checked ? "bg-brand-500" : "bg-ink-200",
        checked ? "justify-end" : "justify-start",
      )}
    >
      <motion.span layout transition={spring} className={cn("block rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,.2)]", size === "md" ? "size-[18px]" : "size-[14px]")} />
    </button>
  );
}

export function Checkbox({ checked, onChange, indeterminate }: { checked: boolean; onChange: (v: boolean) => void; indeterminate?: boolean }) {
  const on = checked || indeterminate;
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={cn(
        "grid size-4 shrink-0 place-items-center rounded-[5px] border transition-colors duration-150",
        on ? "border-brand-500 bg-brand-500 text-white" : "border-ink-300 bg-white hover:border-ink-500",
      )}
    >
      <AnimatePresence initial={false}>
        {on && (
          <motion.span key={indeterminate ? "i" : "c"} initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.4, opacity: 0 }} transition={{ duration: 0.12 }}>
            {indeterminate ? <span className="block h-0.5 w-2 rounded bg-white" /> : <Check className="size-3" strokeWidth={3} />}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

export function Avatar({ m, size = 28, ring }: { m?: Pick<Member, "name" | "nickname"> & { color?: string; avatar?: string }; size?: number; ring?: boolean }) {
  if (!m)
    return (
      <span className="grid shrink-0 place-items-center rounded-full bg-ink-100 text-ink-400" style={{ width: size, height: size, fontSize: size * 0.4 }}>
        ?
      </span>
    );
  const title = m.nickname ? `${m.nickname} ${m.name}` : m.name;
  if (m.avatar)
    return <img src={m.avatar} alt={title} title={title} className={cn("shrink-0 rounded-full bg-ink-100 object-cover", ring && "ring-2 ring-white")} style={{ width: size, height: size }} />;
  return (
    <span
      className={cn("grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-100 to-brand-50 font-semibold text-brand-800 ring-1 ring-brand-200/70", ring && "ring-2 ring-white")}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      title={title}
    >
      {initials(m.nickname ?? m.name)}
    </span>
  );
}

export function useClickOutside(ref: React.RefObject<HTMLElement>, cb: () => void, active = true) {
  useEffect(() => {
    if (!active) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) cb();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [ref, cb, active]);
}

export function Popover({
  trigger,
  children,
  align = "left",
  side = "bottom",
  width = 240,
  open: controlled,
  onOpenChange,
  className,
  scroll = true,
  defaultOpen = false,
  matchWidth = false,
}: {
  matchWidth?: boolean;
  scroll?: boolean;
  defaultOpen?: boolean;
  trigger: (o: { open: boolean; toggle: () => void }) => ReactNode;
  children: ReactNode | ((close: () => void) => ReactNode);
  align?: "left" | "right";
  side?: "bottom" | "top";
  width?: number;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
  className?: string;
}) {
  const [inner, setInner] = useState(defaultOpen);
  const open = controlled ?? inner;
  const set = (v: boolean) => {
    if (controlled === undefined) setInner(v);
    onOpenChange?.(v);
  };
  const anchor = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top?: number; bottom?: number; up: boolean; w: number } | null>(null);

  // 以 portal + fixed 定位，避免被表格的 overflow 裁切；下方空間不足時自動往上展開
  const place = () => {
    const r = anchor.current?.getBoundingClientRect();
    if (!r) return;
    const h = panel.current?.offsetHeight ?? 280;
    const up = side === "top" ? r.top > h + 12 || r.top > window.innerHeight - r.bottom : window.innerHeight - r.bottom < h + 12 && r.top > window.innerHeight - r.bottom;
    const w = matchWidth ? Math.max(width, r.width) : width;
    let left = align === "right" ? r.right - w : r.left;
    left = Math.max(8, Math.min(left, window.innerWidth - w - 8));
    setPos(up ? { left, bottom: window.innerHeight - r.top + 6, up, w } : { left, top: r.bottom + 6, up, w });
  };
  useEffect(() => {
    if (!open) return;
    place();
    const raf = requestAnimationFrame(place);
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (anchor.current?.contains(t) || panel.current?.contains(t)) return;
      set(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && set(false);
    const onScroll = (e: Event) => {
      if (panel.current?.contains(e.target as Node)) return;
      place();
    };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  return (
    <div ref={anchor} className={cn("relative", className)}>
      {trigger({ open, toggle: () => set(!open) })}
      {createPortal(
        <AnimatePresence>
          {open && pos && (
            <motion.div
              ref={panel}
              initial={{ opacity: 0, scale: 0.96, y: pos.up ? 4 : -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.1 } }}
              transition={{ duration: 0.16, ease }}
              className={cn(
                "fixed z-[70] rounded-xl border border-ink-200 bg-white p-1.5 shadow-pop",
                scroll && "max-h-[min(480px,80vh)] overflow-y-auto",
                pos.up ? (align === "right" ? "origin-bottom-right" : "origin-bottom-left") : align === "right" ? "origin-top-right" : "origin-top-left",
              )}
              style={{ width: pos.w, left: pos.left, top: pos.top, bottom: pos.bottom }}
            >
              {typeof children === "function" ? children(() => set(false)) : children}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
}

export function MenuItem({ children, onClick, active, icon, danger, hint }: { children: ReactNode; onClick?: () => void; active?: boolean; icon?: ReactNode; danger?: boolean; hint?: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] transition-colors duration-100 hover:bg-ink-50",
        danger ? "text-rose-600" : "text-ink-700",
        active && "bg-brand-50 font-medium text-brand-800",
      )}
    >
      {icon && <span className="text-ink-400 [&>svg]:size-4">{icon}</span>}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {hint && <span className="text-[11.5px] text-ink-400">{hint}</span>}
      {active && <Check className="size-3.5 text-brand-600" />}
    </button>
  );
}

function useEsc(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
}

export function Modal({
  open,
  onClose,
  title,
  desc,
  children,
  footer,
  width = 560,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  desc?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
}) {
  useEsc(open, onClose);
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="modal"
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-900/25 px-4 py-[6vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
          transition={{ duration: 0.18 }}
          onMouseDown={onClose}
        >
          <motion.div
            className="w-full rounded-2xl border border-ink-200 bg-white shadow-pop"
            style={{ maxWidth: width }}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.99, transition: { duration: 0.12 } }}
            transition={{ duration: 0.24, ease }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-ink-100 px-6 py-4">
              <div className="min-w-0">
                <h2 className="text-[15px] font-semibold text-ink-900">{title}</h2>
                {desc && <p className="mt-0.5 text-[13px] text-ink-500">{desc}</p>}
              </div>
              <button onClick={onClose} className="-mr-2 rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700" aria-label="關閉">
                <X className="size-4" />
              </button>
            </div>
            <div className="px-6 py-5">{children}</div>
            {footer && <div className="flex items-center justify-end gap-2 rounded-b-2xl border-t border-ink-100 bg-ink-25 px-6 py-3.5">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export function Drawer({
  open,
  onClose,
  title,
  desc,
  children,
  footer,
  width = 560,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  desc?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
}) {
  useEsc(open, onClose);
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div key="drawer" className="fixed inset-0 z-50" initial={{ opacity: 1 }} exit={{ opacity: 1 }}>
          <motion.div
            className="absolute inset-0 bg-ink-900/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.18 } }}
            transition={{ duration: 0.2 }}
            onMouseDown={onClose}
          />
          <motion.aside
            className="absolute bottom-2 right-2 top-2 flex flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-pop"
            style={{ width }}
            initial={{ x: width + 24 }}
            animate={{ x: 0 }}
            exit={{ x: width + 24, transition: { duration: 0.22, ease: [0.4, 0, 1, 1] } }}
            transition={{ duration: 0.34, ease }}
          >
            <div className="flex items-start justify-between gap-4 border-b border-ink-100 px-6 py-4">
              <div className="min-w-0">
                <h2 className="text-[15px] font-semibold text-ink-900">{title}</h2>
                {desc && <p className="mt-0.5 text-[12.5px] text-ink-500">{desc}</p>}
              </div>
              <button onClick={onClose} className="-mr-2 rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700" aria-label="關閉">
                <X className="size-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
            {footer && <div className="flex items-center gap-2 border-t border-ink-100 bg-ink-25 px-6 py-3.5">{footer}</div>}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export function Field({ label, hint, children, className, required }: { label: ReactNode; hint?: ReactNode; children: ReactNode; className?: string; required?: boolean }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 flex items-center gap-1 text-[12.5px] font-medium text-ink-700">
        {label}
        {required && <span className="text-ink-400">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-[11.5px] text-ink-400">{hint}</span>}
    </label>
  );
}

export const inputCls =
  "h-9 w-full rounded-lg border border-ink-200 bg-white px-3 text-[13px] text-ink-900 placeholder:text-ink-400 shadow-card outline-none transition-[border-color,box-shadow] duration-150 hover:border-ink-300 focus:border-brand-400 focus:ring-[3px] focus:ring-brand-100 disabled:bg-ink-50 disabled:text-ink-500";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputCls, props.className)} />;
}

export type Opt = string | { value: string; label: string; hint?: string };
const toOpt = (o: Opt) => (typeof o === "string" ? { value: o, label: o } : o);

// 下拉選單：選項超過 6 個時出現搜尋框，可用 ↑↓ 與 Enter 選擇
export function Select({
  value,
  onChange,
  options,
  placeholder,
  className,
  disabled,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Opt[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
}) {
  const opts = options.map(toOpt);
  const current = opts.find((o) => o.value === value);
  return (
    <Popover
      matchWidth
      width={200}
      scroll={false}
      className={className}
      trigger={({ toggle, open }) => (
        <button
          id={id}
          type="button"
          disabled={disabled}
          onClick={toggle}
          className={cn(inputCls, "flex items-center gap-2 pr-2 text-left", open && "border-brand-400 ring-[3px] ring-brand-100", disabled && "cursor-not-allowed")}
        >
          <span className={cn("min-w-0 flex-1 truncate", !current && "text-ink-400")}>{current ? current.label : placeholder ?? "請選擇"}</span>
          <ChevronDown className="size-4 shrink-0 text-ink-400" />
        </button>
      )}
    >
      {(close) => (
        <OptionList
          options={placeholder ? [{ value: "", label: placeholder }, ...opts] : opts}
          selected={[value]}
          onPick={(v) => {
            onChange(v);
            close();
          }}
        />
      )}
    </Popover>
  );
}

// 選項清單：搜尋＋鍵盤選擇；multi 時以勾選框呈現、點了不關閉
export function OptionList({
  options,
  selected,
  onPick,
  multi,
  searchAt = 7,
  placeholder = "搜尋",
  height = 260,
}: {
  options: { value: string; label: string; hint?: string }[];
  selected: string[];
  onPick: (v: string) => void;
  multi?: boolean;
  searchAt?: number;
  placeholder?: string;
  height?: number;
}) {
  const [q, setQ] = useState("");
  const [hi, setHi] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const k = q.trim().toLowerCase();
  const list = options.filter((o) => !k || `${o.label} ${o.hint ?? ""}`.toLowerCase().includes(k));
  const searchable = options.length >= searchAt;
  useEffect(() => setHi(0), [q]);
  useEffect(() => {
    listRef.current?.querySelector(`[data-i="${hi}"]`)?.scrollIntoView({ block: "nearest" });
  }, [hi]);
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") (e.preventDefault(), setHi((h) => Math.min(list.length - 1, h + 1)));
    if (e.key === "ArrowUp") (e.preventDefault(), setHi((h) => Math.max(0, h - 1)));
    if (e.key === "Enter" && list[hi]) (e.preventDefault(), onPick(list[hi].value));
  };
  return (
    <div onKeyDown={onKey}>
      {searchable && (
        <div className="relative mb-1.5">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-400" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} className="h-8 w-full rounded-lg border border-ink-200 bg-ink-25 pl-8 pr-2 text-[12.5px] outline-none focus:border-brand-400 focus:bg-white" />
        </div>
      )}
      <div ref={listRef} className="overflow-y-auto" style={{ maxHeight: height }} tabIndex={searchable ? undefined : 0}>
        {list.length === 0 && <p className="px-2.5 py-3 text-[12.5px] text-ink-400">找不到符合的項目</p>}
        {list.map((o, i) => {
          const on = selected.includes(o.value);
          return (
            <button
              key={o.value || "__none"}
              type="button"
              data-i={i}
              onMouseEnter={() => setHi(i)}
              onClick={() => onPick(o.value)}
              className={cn("flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] transition-colors duration-75", i === hi ? "bg-ink-50" : "", on && !multi && "font-medium text-brand-800", !o.value && "text-ink-500")}
            >
              {multi && (
                <span className={cn("grid size-4 shrink-0 place-items-center rounded-[5px] border", on ? "border-brand-500 bg-brand-500 text-white" : "border-ink-300 bg-white")}>{on && <Check className="size-3" strokeWidth={3} />}</span>
              )}
              <span className="min-w-0 flex-1 truncate">{o.label}</span>
              {o.hint && <span className="shrink-0 text-[11.5px] text-ink-400">{o.hint}</span>}
              {!multi && on && o.value && <Check className="size-3.5 shrink-0 text-brand-600" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder, className }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cn(inputCls, "pl-9")} />
    </div>
  );
}

export function Tabs<T extends string>({ value, onChange, items, className }: { value: T; onChange: (v: T) => void; items: { value: T; label: ReactNode; count?: number; hidden?: boolean }[]; className?: string }) {
  const id = useId();
  return (
    <div className={cn("flex items-center gap-1 border-b border-ink-100", className)}>
      {items
        .filter((i) => !i.hidden)
        .map((i) => (
          <button
            key={i.value}
            onClick={() => onChange(i.value)}
            className={cn("relative flex items-center gap-1.5 px-3 py-3 text-[13px] font-medium transition-colors duration-150 [&>svg]:size-4", value === i.value ? "text-brand-700" : "text-ink-500 hover:text-ink-800")}
          >
            {i.label}
            {i.count != null && i.count > 0 && <span className={cn("rounded-full px-1.5 text-[11px] leading-[18px] tabular-nums transition-colors", value === i.value ? "bg-brand-500 text-white" : "bg-ink-100 text-ink-600")}>{i.count}</span>}
            {value === i.value && <motion.span layoutId={`tab-${id}`} transition={spring} className="absolute inset-x-1 -bottom-px h-[2px] rounded-full bg-brand-500" />}
          </button>
        ))}
    </div>
  );
}

export function Segmented<T extends string>({ value, onChange, items, size = "md" }: { value: T; onChange: (v: T) => void; items: { value: T; label: ReactNode }[]; size?: "sm" | "md" }) {
  const id = useId();
  return (
    <div className="inline-flex rounded-lg border border-ink-200 bg-white p-0.5 shadow-card">
      {items.map((i) => (
        <button
          key={i.value}
          type="button"
          onClick={() => onChange(i.value)}
          className={cn(
            "relative flex items-center gap-1.5 rounded-md font-medium transition-colors duration-150",
            size === "md" ? "px-3 py-1.5 text-[13px]" : "px-2.5 py-1 text-[12px]",
            value === i.value ? "text-white" : "text-ink-500 hover:text-ink-800",
          )}
        >
          {value === i.value && <motion.span layoutId={`seg-${id}`} transition={spring} className="absolute inset-0 rounded-md bg-brand-500 shadow-card" />}
          <span className="relative">{i.label}</span>
        </button>
      ))}
    </div>
  );
}

export function Card({ children, className, title, action, desc, pad = true }: { children: ReactNode; className?: string; title?: ReactNode; action?: ReactNode; desc?: ReactNode; pad?: boolean }) {
  return (
    <section className={cn("rounded-xl border border-ink-200 bg-white shadow-card", className)}>
      {title && (
        <header className="flex min-h-[52px] items-center justify-between gap-3 border-b border-ink-100 px-5 py-3">
          <div className="min-w-0">
            <h3 className="text-[14px] font-semibold text-ink-900">{title}</h3>
            {desc && <p className="mt-0.5 text-[12px] text-ink-500">{desc}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={cn(pad && "p-5")}>{children}</div>
    </section>
  );
}

export function StatGroup({ items }: { items: { label: string; value: ReactNode; sub?: ReactNode; hint?: string; onClick?: () => void }[] }) {
  return (
    <div className="grid rounded-xl border border-ink-200 bg-white shadow-card" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
      {items.map((s, i) => (
        <button
          key={s.label}
          type="button"
          onClick={s.onClick}
          disabled={!s.onClick}
          className={cn("group px-5 py-[18px] text-left transition-colors duration-150 first:rounded-l-xl last:rounded-r-xl disabled:cursor-default", i > 0 && "border-l border-ink-100", s.onClick && "hover:bg-ink-25")}
        >
          <div className="flex items-center gap-1.5 text-[13px] font-medium text-ink-600">
            {s.label}
            {s.hint && (
              <span title={s.hint}>
                <Info className="size-3.5 text-ink-300" />
              </span>
            )}
          </div>
          <motion.div key={String(s.value)} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease }} className="mt-2 text-[28px] font-semibold leading-none tracking-tight text-ink-900 tabular-nums">
            {s.value}
          </motion.div>
          {s.sub && <div className="mt-2 flex items-center gap-1.5 text-[12px] text-ink-500">{s.sub}</div>}
        </button>
      ))}
    </div>
  );
}

export function Delta({ v }: { v: number; suffix?: string }) {
  if (v === 0) return <span className="text-[11.5px] text-ink-400">持平</span>;
  return (
    <span className={cn("text-[11.5px] font-medium tabular-nums", v > 0 ? "text-brand-600" : "text-ink-500")}>
      {v > 0 ? "+" : "−"}
      {Math.abs(v)}
    </span>
  );
}

export function Empty({ icon, title, desc, action }: { icon?: ReactNode; title: string; desc?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      {icon && <div className="mb-2.5 text-ink-300 [&>svg]:size-6 [&>svg]:stroke-[1.5]">{icon}</div>}
      <p className="text-[13.5px] font-medium text-ink-800">{title}</p>
      {desc && <p className="mt-1 max-w-sm text-[12.5px] text-ink-500">{desc}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function PageHeader({ title, desc, actions, back }: { title: ReactNode; desc?: ReactNode; actions?: ReactNode; back?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-ink-100 px-8 pb-5 pt-6">
      <div className="min-w-0">
        {back}
        <h1 className="text-[22px] font-semibold tracking-tight text-ink-900">{title}</h1>
        {desc && <p className="mt-1 text-[13px] text-ink-500">{desc}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export const th = "h-11 whitespace-nowrap border-b border-r border-ink-200 bg-ink-25 px-4 text-left text-[12.5px] font-semibold text-ink-700 last:border-r-0";
export const td = "h-14 whitespace-nowrap border-b border-ink-100 px-4 text-[13px] text-ink-800 transition-colors duration-100";

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto rounded-xl border border-ink-200 bg-white shadow-card", className)}>
      <table className="w-full border-separate border-spacing-0">{children}</table>
    </div>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded border border-ink-200 bg-white px-1 font-sans text-[10.5px] text-ink-400">{children}</kbd>;
}

// Callout：白底細框，語意只放在圖示顏色；danger 才用淡紅底
export function Callout({ tone = "info", icon, title, children, action }: { tone?: "info" | "warn" | "danger" | "success" | "brand"; icon?: ReactNode; title?: ReactNode; children?: ReactNode; action?: ReactNode }) {
  const iconTone = { info: "text-ink-500", warn: "text-amber-600", danger: "text-rose-600", success: "text-brand-600", brand: "text-brand-600" }[tone];
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease }}
      className={cn("flex items-start gap-3 rounded-xl border px-4 py-3", tone === "danger" ? "border-rose-200 bg-rose-50/40" : "border-ink-200 bg-white shadow-card")}
    >
      {icon && <span className={cn("mt-0.5 shrink-0 [&>svg]:size-4", iconTone)}>{icon}</span>}
      <div className="min-w-0 flex-1 text-[13px] text-ink-700">
        {title && <p className="font-semibold text-ink-900">{title}</p>}
        {children && <div className={cn(title && "mt-0.5", "text-ink-600")}>{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </motion.div>
  );
}

export function Dot({ className }: { className?: string }) {
  return <span className={cn("inline-block size-1.5 rounded-full", className)} />;
}

export function Progress({ value, className, tone = "bg-brand-500" }: { value: number; className?: string; tone?: string }) {
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-ink-100", className)}>
      <motion.div className={cn("h-full rounded-full", tone)} initial={{ width: 0 }} animate={{ width: `${Math.max(0, Math.min(100, value))}%` }} transition={{ duration: 0.5, ease }} />
    </div>
  );
}

export function KV({ label, children, className }: { label: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="text-[12px] text-ink-500">{label}</dt>
      <dd className="mt-1 truncate text-[13.5px] text-ink-900">{children}</dd>
    </div>
  );
}

// 列表項目進場：依序淡入
export function Stagger({ children, className, as = "div" }: { children: ReactNode; className?: string; as?: "div" | "tbody" }) {
  const C = as === "tbody" ? motion.tbody : motion.div;
  return (
    <C className={className} initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.025 } } }}>
      {children}
    </C>
  );
}
export const itemVariants = { hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0, transition: { duration: 0.28, ease } } };
