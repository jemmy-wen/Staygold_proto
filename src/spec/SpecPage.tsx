import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, Lock, MousePointerClick, RotateCcw, Target } from "lucide-react";
import { GROUPS, NOTE_LABEL, NOTIFS, type Note, type Screen, type Table } from "./screens";
import { BrandMark } from "../components/brand";
import { cn } from "../lib/utils";

const W = 1440;
const H = 900;

// 以 iframe 嵌入可操作的 prototype，依容器寬度等比縮放；進入可視範圍才載入
function LiveFrame({ src, title }: { src: string; title: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);
  const [nonce, setNonce] = useState(0);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "900px 0px" });
    io.observe(el);
    return () => {
      ro.disconnect();
      io.disconnect();
    };
  }, []);
  const scale = width / W;
  return (
    <div className="overflow-hidden rounded-xl border border-ink-200 bg-white shadow-card">
      <div className="flex h-9 items-center gap-2 border-b border-ink-100 bg-ink-25 px-3">
        <span className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-ink-200" />
          <span className="size-2.5 rounded-full bg-ink-200" />
          <span className="size-2.5 rounded-full bg-ink-200" />
        </span>
        <span className="ml-2 flex items-center gap-1.5 text-[11.5px] text-ink-500">
          <MousePointerClick className="size-3.5" />
          可直接操作
        </span>
        <span className="ml-auto flex items-center gap-1">
          <button onClick={() => setNonce((n) => n + 1)} className="flex items-center gap-1 rounded-md px-2 py-1 text-[11.5px] text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-800" title="回到初始狀態">
            <RotateCcw className="size-3.5" />
            重設
          </button>
          <a href={src} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-md px-2 py-1 text-[11.5px] text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-800">
            全螢幕開啟
            <ArrowUpRight className="size-3.5" />
          </a>
        </span>
      </div>
      <div ref={box} className="relative w-full bg-ink-50" style={{ height: H * scale || 300 }}>
        {visible && width > 0 ? (
          <iframe
            key={nonce}
            title={title}
            src={src}
            className="absolute left-0 top-0 origin-top-left border-0"
            style={{ width: W, height: H, transform: `scale(${scale})` }}
          />
        ) : (
          <div className="grid h-full place-items-center text-[12px] text-ink-400">載入畫面中…</div>
        )}
      </div>
    </div>
  );
}

function NoteTag({ n }: { n: Note }) {
  const tone = { outside: "bg-ink-100 text-ink-700", decided: "bg-brand-50 text-brand-700", pending: "bg-amber-50 text-amber-800", added: "bg-ink-100 text-ink-700" }[n.kind];
  return (
    <div className="flex items-start gap-2 text-[12.5px] leading-relaxed">
      <span className={cn("mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium", tone)}>{NOTE_LABEL[n.kind]}</span>
      <span className="text-ink-600">{n.text}</span>
    </div>
  );
}

function ScreenSection({ s, index }: { s: Screen; index: string }) {
  return (
    <section id={s.id} className="scroll-mt-6 border-t border-ink-200 py-10 first:border-t-0">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
        <span className="font-mono text-[12px] text-ink-400">{index}</span>
        <h3 className="text-[19px] font-semibold tracking-tight text-ink-900">{s.title}</h3>
        <div className="flex flex-wrap gap-1.5">
          {s.prd.map((p) => (
            <span key={p.sec} className="rounded-md bg-brand-50 px-1.5 py-0.5 text-[11.5px] font-medium text-brand-700">
              PRD {p.sec} {p.title}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-3 flex max-w-3xl items-start gap-2.5 rounded-xl border border-brand-200 bg-brand-50/60 px-4 py-3">
        <Target className="mt-0.5 size-4 shrink-0 text-brand-600" />
        <div>
          <p className="text-[11.5px] font-semibold uppercase tracking-wider text-brand-700">使用者目標</p>
          <p className="mt-0.5 text-[13.5px] leading-relaxed text-ink-800">{s.goal}</p>
        </div>
      </div>
      <p className="mt-3 max-w-3xl text-[13.5px] leading-relaxed text-ink-600">{s.summary}</p>

      <div className="mt-5 grid grid-cols-[minmax(0,1.55fr)_minmax(320px,1fr)] gap-8">
        <div className="min-w-0">
          <div className="sticky top-6">
            <LiveFrame src={s.src} title={s.title} />
          </div>
        </div>
        <div className="min-w-0 space-y-6">
          <div>
            <p className="text-[11.5px] font-semibold uppercase tracking-wider text-ink-400">功能</p>
            <ul className="mt-2 space-y-1.5">
              {s.features.map((f) => (
                <li key={f} className="flex gap-2 text-[13px] leading-relaxed text-ink-800">
                  <span className="mt-[9px] size-1 shrink-0 rounded-full bg-ink-400" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[11.5px] font-semibold uppercase tracking-wider text-ink-400">User Flow</p>
            <ol className="mt-2 space-y-2">
              {s.flow.map((f, i) => (
                <li key={f} className="flex gap-2.5 text-[13px] leading-relaxed text-ink-800">
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-brand-500 text-[11px] font-semibold text-white">{i + 1}</span>
                  {f}
                </li>
              ))}
            </ol>
          </div>
          <div>
            <p className="text-[11.5px] font-semibold uppercase tracking-wider text-ink-400">對應 PRD v1.0</p>
            <div className="mt-2 space-y-2.5">
              {s.prd.map((p) => (
                <div key={p.sec} className="rounded-lg border border-ink-200 bg-white px-3.5 py-2.5">
                  <p className="text-[12.5px] font-semibold text-ink-900">
                    {p.sec} {p.title}
                  </p>
                  {p.quote && <p className="mt-1 text-[12.5px] leading-relaxed text-ink-600">「{p.quote}」</p>}
                </div>
              ))}
            </div>
          </div>
          {s.access && (
            <div>
              <p className="text-[11.5px] font-semibold uppercase tracking-wider text-ink-400">權限</p>
              <p className="mt-2 flex items-start gap-2 text-[13px] text-ink-700">
                <Lock className="mt-0.5 size-3.5 shrink-0 text-ink-400" />
                {s.access}
              </p>
            </div>
          )}
          {s.notes && (
            <div className="space-y-2">
              <p className="text-[11.5px] font-semibold uppercase tracking-wider text-ink-400">備註</p>
              {s.notes.map((n) => (
                <NoteTag key={n.text} n={n} />
              ))}
            </div>
          )}
        </div>
      </div>
      {s.tables?.map((t) => <RuleTable key={t.title} t={t} />)}
      {s.notifs && <NotifTable types={s.notifs} />}
    </section>
  );
}

function RuleTable({ t }: { t: Table }) {
  return (
    <div className="mt-8">
      <p className="text-[11.5px] font-semibold uppercase tracking-wider text-ink-400">{t.title}</p>
      <div className="mt-2 overflow-hidden rounded-xl border border-ink-200 bg-white shadow-card">
        <table className="w-full border-separate border-spacing-0 text-[12.5px]">
          <thead>
            <tr className="bg-ink-25 text-left text-[12px] text-ink-600">
              {t.head.map((h) => (
                <th key={h} className="border-b border-r border-ink-200 px-3.5 py-2.5 font-semibold last:border-r-0">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {t.rows.map((r) => (
              <tr key={r[0]}>
                {r.map((c, i) => (
                  <td key={i} className={cn("border-b border-r border-ink-100 px-3.5 py-2.5 align-top leading-relaxed last:border-r-0", i === 0 ? "whitespace-nowrap font-medium text-ink-900" : i === 1 && r.length > 2 ? "whitespace-nowrap text-ink-700" : "text-ink-700")}>
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 此畫面相關的通知（PRD 3.11）；"*" 表示全部 15 種
function NotifTable({ types }: { types: string[] }) {
  const list = types.includes("*") ? NOTIFS : NOTIFS.filter((n) => types.includes(n.type));
  return (
    <RuleTable
      t={{
        title: types.includes("*") ? "通知一覽（PRD 3.11，共 15 種）" : "相關通知（PRD 3.11）",
        head: ["通知", "分類", "出現時機", "通知對象", "管道", "消失時機"],
        rows: list.map((n) => [n.type, n.group, n.when, n.to, n.channel, n.done]),
      }}
    />
  );
}

const PRD_SECTIONS: [string, string][] = [
  ["1.4", "系統流程優化"],
  ["1.6", "產品資訊架構圖"],
  ["2.2", "使用者權限需求對照"],
  ["3.1", "案件與檔案命名規則"],
  ["3.2", "總覽 Dashboard"],
  ["3.3", "案件建立"],
  ["3.4", "Email 與案件的關聯"],
  ["3.5", "文件與案件的關聯"],
  ["3.6", "進度與金額登記"],
  ["3.7", "差旅費與案件的關聯"],
  ["3.8", "AI 應用範圍"],
  ["3.9.1", "排課與輔導執行"],
  ["3.9.2", "稽核取證與款項流程"],
  ["3.9.3", "發票與請款狀態欄位"],
  ["3.9.4", "案件狀態總覽"],
  ["3.10", "財務中心"],
  ["3.11", "通知規格"],
  ["4.3", "角色權限的技術實作"],
];

export function SpecPage() {
  const flat = useMemo(() => GROUPS.flatMap((g, gi) => g.screens.map((s, si) => ({ g, s, index: `S${gi + 1}.${si + 1}` }))), []);
  const [active, setActive] = useState(flat[0].s.id);
  useEffect(() => {
    document.title = "恆永顧問內部系統・畫面規格";
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (hit) setActive(hit.target.id);
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );
    flat.forEach(({ s }) => {
      const el = document.getElementById(s.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [flat]);

  const coverage = PRD_SECTIONS.map(([sec, title]) => ({
    sec,
    title,
    screens: flat.filter(({ s }) => s.prd.some((p) => p.sec === sec)),
  }));

  return (
    <div className="flex min-h-screen min-w-[1280px] bg-ink-50 text-ink-900">
      <aside className="sticky top-0 h-screen w-[264px] shrink-0 overflow-y-auto border-r border-ink-200 bg-white px-4 py-6">
        <div className="flex items-center gap-2.5 px-2">
          <BrandMark size={30} />
          <div className="leading-tight">
            <p className="text-[13px] font-semibold">恆永顧問內部系統</p>
            <p className="text-[11.5px] text-ink-500">畫面規格</p>
          </div>
        </div>
        <nav className="mt-6 space-y-5">
          {GROUPS.map((g, gi) => (
            <div key={g.id}>
              <p className="px-2 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
                {gi + 1}. {g.title}
              </p>
              <div className="mt-1.5 space-y-0.5">
                {g.screens.map((s, si) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className={cn("flex gap-2 rounded-md px-2 py-1.5 text-[12.5px] transition-colors", active === s.id ? "bg-brand-50 font-medium text-brand-800" : "text-ink-600 hover:bg-ink-50 hover:text-ink-900")}
                  >
                    <span className="w-9 shrink-0 font-mono text-[11px] text-ink-400">
                      S{gi + 1}.{si + 1}
                    </span>
                    {s.title}
                  </a>
                ))}
              </div>
            </div>
          ))}
          <a href="#coverage" className="block rounded-md px-2 py-1.5 text-[12.5px] font-medium text-ink-700 hover:bg-ink-50">
            PRD 節次對照表
          </a>
        </nav>
      </aside>

      <main className="min-w-0 flex-1 px-12 py-10">
        <header className="max-w-4xl">
          <p className="text-[12px] font-medium text-brand-700">PRD v1.0 對照・High-fidelity Prototype</p>
          <h1 className="mt-2 text-[32px] font-semibold tracking-tight">畫面規格</h1>
          <p className="mt-3 text-[14px] leading-relaxed text-ink-600">
            列出系統的每一個畫面：開頭是該畫面的使用者目標，左側是可直接操作的 prototype，右側是功能、User Flow、對應的 PRD v1.0 節次與原文；涉及流程的畫面另附狀態規則與相關通知。各畫面的操作互不影響，按「重設」可回到初始狀態。
          </p>
          <div className="mt-5 flex flex-wrap gap-4 text-[12.5px] text-ink-600">
            <span>
              畫面 <b className="tabular-nums text-ink-900">{flat.length}</b> 個
            </span>
            <span>
              對應 PRD 節次 <b className="tabular-nums text-ink-900">{coverage.filter((c) => c.screens.length).length}</b> / {coverage.length}
            </span>
            <span className="flex items-center gap-1.5">
              {(["outside", "decided", "added", "pending"] as const).map((k) => (
                <NoteTag key={k} n={{ kind: k, text: "" }} />
              ))}
            </span>
          </div>
        </header>

        <div className="mt-6">
          {GROUPS.map((g, gi) => (
            <div key={g.id} className="mt-10">
              <div className="flex items-baseline gap-3 border-b-2 border-ink-900 pb-3">
                <h2 className="text-[22px] font-semibold tracking-tight">
                  {gi + 1}. {g.title}
                </h2>
                <span className="text-[12.5px] text-ink-500">PRD {g.prd}</span>
              </div>
              {g.screens.map((s, si) => (
                <ScreenSection key={s.id} s={s} index={`S${gi + 1}.${si + 1}`} />
              ))}
            </div>
          ))}
        </div>

        <section id="coverage" className="mt-16 scroll-mt-6">
          <div className="border-b-2 border-ink-900 pb-3">
            <h2 className="text-[22px] font-semibold tracking-tight">PRD 節次對照表</h2>
            <p className="mt-1 text-[13px] text-ink-500">PRD v1.0 第 1～6 節中定義功能的節次，與本文件畫面的對應。</p>
          </div>
          <div className="mt-5 overflow-hidden rounded-xl border border-ink-200 bg-white shadow-card">
            <table className="w-full border-separate border-spacing-0 text-[13px]">
              <thead>
                <tr className="bg-ink-25 text-left text-[12px] text-ink-500">
                  <th className="w-24 border-b border-ink-200 px-5 py-2.5 font-medium">節次</th>
                  <th className="w-56 border-b border-ink-200 px-3 py-2.5 font-medium">PRD 標題</th>
                  <th className="border-b border-ink-200 px-3 py-2.5 font-medium">對應畫面</th>
                </tr>
              </thead>
              <tbody>
                {coverage.map((c) => (
                  <tr key={c.sec}>
                    <td className="border-b border-ink-100 px-5 py-3 font-mono text-[12px] text-ink-700">{c.sec}</td>
                    <td className="border-b border-ink-100 px-3 py-3 font-medium">{c.title}</td>
                    <td className="border-b border-ink-100 px-3 py-3">
                      {c.sec === "3.8" ? (
                        <span className="text-ink-500">AI 摘要與 AI 進階比對不在第一階段範圍；跨案件查詢以「案件列表」的篩選與關鍵字搜尋處理。</span>
                      ) : c.screens.length ? (
                        <div className="flex flex-wrap gap-1.5">
                          {c.screens.map(({ s, index }) => (
                            <a key={s.id} href={`#${s.id}`} className="rounded-md border border-ink-200 px-2 py-0.5 text-[12px] text-ink-700 transition-colors hover:border-brand-400 hover:text-brand-700">
                              {index} {s.title}
                            </a>
                          ))}
                        </div>
                      ) : (
                        <span className="text-ink-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
