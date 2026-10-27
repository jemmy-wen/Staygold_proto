import { cn } from "../lib/utils";

// 恆永 Stay Gold 標誌。取得正式 logo 檔後，替換這個元件的內容即可全站套用
export function BrandMark({ size = 36, tone = "dark", className }: { size?: number; tone?: "dark" | "light"; className?: string }) {
  return (
    <span
      className={cn("grid shrink-0 place-items-center rounded-[28%] font-bold", tone === "dark" ? "bg-ink-900 text-white" : "bg-white text-ink-900", className)}
      style={{ width: size, height: size, fontSize: size * 0.44 }}
      aria-label="恆永 Stay Gold"
    >
      恆
    </span>
  );
}

export function BrandLockup({ tone = "dark" }: { tone?: "dark" | "light" }) {
  return (
    <div className="flex items-center gap-3">
      <BrandMark size={38} tone={tone === "dark" ? "light" : "dark"} />
      <div className="leading-tight">
        <p className={cn("text-[15px] font-semibold tracking-tight", tone === "dark" ? "text-white" : "text-ink-900")}>恆永 Stay Gold</p>
        <p className={cn("text-[11.5px] tracking-wide", tone === "dark" ? "text-ink-400" : "text-ink-500")}>恆永企業有限公司</p>
      </div>
    </div>
  );
}
