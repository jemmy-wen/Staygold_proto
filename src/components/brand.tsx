import { cn } from "../lib/utils";

// 恆永 Stay Gold 標誌：logo-mark.png 為依圖形實際範圍裁切並置中的版本（原檔 logo.png 四周留白不均）
export function BrandMark({ size = 36, className }: { size?: number; tone?: "dark" | "light"; className?: string }) {
  return (
    <span className={cn("grid shrink-0 place-items-center overflow-hidden rounded-[24%] border border-ink-200 bg-white", className)} style={{ width: size, height: size }}>
      <img src="/logo-mark.png" alt="恆永 Stay Gold" className="size-full object-contain" />
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
