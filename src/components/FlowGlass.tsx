import { useEffect, useRef } from "react";
import { cn } from "../lib/utils";

const VERT = `
attribute vec2 a;
void main() { gl_Position = vec4(a, 0.0, 1.0); }
`;

// 流動漸層：多層噪聲互相扭曲，流動不規則也不循環；顏色限主色系（brand-900 → brand-100）
// Fractal glass：比例與數值來自 Figma「PPE Pick N Go」751:1683，1408 寬的畫面約 11.77 條玻璃
const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform float uPx;
uniform float uSidebar;
uniform vec2 uCss;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 3; i++) {
    v += a * noise(p);
    p = p * 2.03 + vec2(17.3, 9.1);
    a *= 0.5;
  }
  return v / 0.875;
}
vec3 overlay(vec3 b, vec3 s) {
  return mix(2.0 * b * s, 1.0 - 2.0 * (1.0 - b) * (1.0 - s), step(0.5, b));
}
float hole(vec2 p, vec2 c, vec2 r) {
  vec2 d = (p - c) / r;
  return exp(-dot(d, d));
}

void main() {
  vec2 p = gl_FragCoord.xy / uRes;
  p.y = 1.0 - p.y;

  // 登入頁：每條玻璃各自折射背後的畫面；sidebar 只有流動漸層，不加玻璃
  bool side = uSidebar > 0.5;
  float fx = fract((p.x + 0.0092) * 11.774);
  vec2 s = side ? p : vec2(p.x + (fx - 0.5) * 0.17, p.y);

  vec2 q = side ? s * uCss / 500.0 : s * vec2(uRes.x / uRes.y, 1.0) * 1.6;
  float t = uTime * 0.075;
  vec2 w1 = vec2(fbm(q + vec2(0.0, t)), fbm(q + vec2(5.2, 1.3) - t * 0.8));
  vec2 w2 = vec2(fbm(q + 2.2 * w1 + vec2(1.7 + t * 0.6, 9.2)), fbm(q + 2.2 * w1 + vec2(8.3, 2.8 - t * 0.5)));
  float v = fbm(q + 2.4 * w2);

  // 大致右上亮、左下暗，再疊上流動
  // sidebar 有導覽文字，亮度設上限，顏色最亮約到 brand-400
  float lum = side ? min(v * 0.95, 0.64) : clamp(v * 0.95 + (s.x * 0.9 + (1.0 - s.y) * 0.55 - 0.72) * 0.75, 0.0, 1.0);
  vec3 c = vec3(0.082, 0.188, 0.176);
  c = mix(c, vec3(0.196, 0.443, 0.416), smoothstep(0.14, 0.5, lum));
  c = mix(c, vec3(0.490, 0.725, 0.698), smoothstep(0.5, 0.76, lum));
  c = mix(c, vec3(0.835, 0.918, 0.906), smoothstep(0.76, 1.0, lum));

  // Logo 與下方文字的位置固定壓深，白字不受流動影響
  float keep = (1.0 - 0.9 * hole(p, vec2(0.14, 0.09), vec2(0.34, 0.16))) * (1.0 - 0.92 * hole(p, vec2(0.28, 0.86), vec2(0.72, 0.42)));
  // sidebar：導覽與帳號後方壓深，流動放在中間的空白區；右緣收回深色，與內容圓角框分開
  float open = smoothstep(400.0, 470.0, p.y * uCss.y) * (1.0 - smoothstep(uCss.y - 170.0, uCss.y - 110.0, p.y * uCss.y));
  if (side) keep = mix(0.38, 1.0, open) * (1.0 - smoothstep(uCss.x - 70.0, uCss.x, p.x * uCss.x));
  c = mix(vec3(0.082, 0.188, 0.176), c, keep);

  if (!side) {
    // 玻璃的明暗：設計稿的 overlay 漸層（白 → 深 → 白），整體 40% 不透明
    float g = 1.0 - fx;
    vec3 tint = g < 0.311 ? mix(vec3(1.0), vec3(0.016, 0.035, 0.078), g / 0.311) : mix(vec3(0.016, 0.035, 0.078), vec3(1.0), (g - 0.311) / 0.796);
    c = mix(c, overlay(c, tint), 0.2 * 0.4 * 2.5);

    // 高光線：左側邊框與右側內陰影，依畫面寬度等比例縮放
    float stripPx = uRes.x / 11.774;
    float px = fx * stripPx;
    float edge = uPx * 1.1;
    c = mix(c, vec3(1.0), 0.16 * (1.0 - smoothstep(edge * 0.75, edge, px)));
    c = mix(c, vec3(1.0), 0.12 * smoothstep(stripPx - edge * 1.2, stripPx, px));
  }

  // 微量抖動，避免深色漸層出現色帶
  c += (hash(gl_FragCoord.xy + fract(uTime)) - 0.5) / 255.0;
  gl_FragColor = vec4(c, 1.0);
}
`;

// 登入頁左側與系統 sidebar 共用的流動漸層與 fractal glass；不支援 WebGL 時顯示底下的 CSS 深色底
export function FlowGlass({ sidebar, className = "inset-0 size-full" }: { sidebar?: boolean; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const gl = canvas?.getContext("webgl", { antialias: false, alpha: false });
    if (!canvas || !gl) return;
    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(sh));
      return sh;
    };
    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(program);
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.bindAttribLocation(program, 0, "a");
    gl.linkProgram(program);
    gl.useProgram(program);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const uRes = gl.getUniformLocation(program, "uRes");
    const uTime = gl.getUniformLocation(program, "uTime");
    const uPx = gl.getUniformLocation(program, "uPx");
    gl.uniform1f(gl.getUniformLocation(program, "uSidebar"), sidebar ? 1 : 0);
    const uCss = gl.getUniformLocation(program, "uCss");

    // 起始時間加一段位移，一打開就是已經流開的畫面
    const draw = (now: number) => {
      gl.uniform1f(uTime, now / 1000 + 40);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uPx, dpr);
      gl.uniform2f(uCss, r.width, r.height);
      draw(performance.now());
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    // 系統設定減少動態時只畫靜態一張；其餘約每秒 30 格，流動很慢不需要更高
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => ro.disconnect();
    let raf = 0;
    let last = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (now - last < 33) return;
      last = now;
      draw(now);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [sidebar]);
  return <canvas ref={ref} aria-hidden className={cn("absolute -z-10", className)} />;
}
