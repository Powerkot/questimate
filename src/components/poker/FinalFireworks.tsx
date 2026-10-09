import { useEffect, useRef } from "react";
const T_FLASH = 2.05;
export function FinalFireworks() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motion.matches) return;
    const color = "#f4c479";
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let w = 0;
    let h = 0;
    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const hex = color.replace("#", "");
    const gem = [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
    ];
    const palette = [[255, 214, 140], [255, 240, 205], gem];
    const R = Math.hypot(w, h) * 0.55;

    type G = { a: number; r0: number; spin: number; delay: number; size: number; col: number[] };
    const gather: G[] = Array.from({ length: 150 }, () => ({
      a: Math.random() * Math.PI * 2,
      r0: R * (0.6 + Math.random() * 0.5),
      spin: (Math.random() < 0.5 ? -1 : 1) * (1.5 + Math.random() * 2),
      delay: Math.random() * 0.5,
      size: 1 + Math.random() * 2.4,
      col: palette[Math.floor(Math.random() * palette.length)],
    }));
    type S = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      max: number;
      size: number;
      col: number[];
    };
    const sparks: S[] = [];
    let burst = false;
    const start = performance.now();
    let raf = 0;

    const dot = (x: number, y: number, size: number, col: number[], alpha: number) => {
      const rad = size * 4;
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
      g.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},${alpha})`);
      g.addColorStop(1, `rgba(${col[0]},${col[1]},${col[2]},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fill();
    };

    const frame = (now: number) => {
      const t = (now - start) / 1000;
      if (motion.matches || t > 5.5) {
        ctx.clearRect(0, 0, w, h);
        return;
      }
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      const cx = w / 2;
      const cy = h / 2;

      if (t < T_FLASH) {
        for (const p of gather) {
          const local = Math.max(0, Math.min(1, (t - 0.35 - p.delay) / (T_FLASH - 0.45 - p.delay)));
          if (local <= 0) continue;
          const e = 1 - Math.pow(1 - local, 3);
          const r = p.r0 * (1 - e) + 6;
          const ang = p.a + p.spin * e;
          dot(
            cx + Math.cos(ang) * r,
            cy + Math.sin(ang) * r * 0.85,
            p.size * (0.6 + e),
            p.col,
            Math.min(1, local * 2) * 0.9,
          );
        }
      } else if (!burst) {
        burst = true;
        for (let i = 0; i < 170; i++) {
          const a = Math.random() * Math.PI * 2;
          const sp = 2 + Math.random() * 9;
          sparks.push({
            x: cx,
            y: cy,
            vx: Math.cos(a) * sp,
            vy: Math.sin(a) * sp,
            life: 0,
            max: 50 + Math.random() * 70,
            size: 0.8 + Math.random() * 2.2,
            col: palette[i % 3],
          });
        }
      }

      if (t > T_FLASH + 0.4 && Math.random() < 0.55) {
        const a = Math.random() * Math.PI * 2;
        const rr = 130 + Math.random() * Math.min(w, h) * 0.32;
        sparks.push({
          x: cx + Math.cos(a) * rr,
          y: cy + Math.sin(a) * rr,
          vx: (Math.random() - 0.5) * 0.4,
          vy: -0.3 - Math.random() * 0.6,
          life: 0,
          max: 70 + Math.random() * 60,
          size: 0.7 + Math.random() * 1.6,
          col: palette[Math.floor(Math.random() * 3)],
        });
      }

      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.life++;
        s.x += s.vx;
        s.y += s.vy;
        s.vx *= 0.965;
        s.vy = s.vy * 0.965 + 0.02;
        const k = s.life / s.max;
        if (k >= 1) {
          sparks.splice(i, 1);
          continue;
        }
        dot(s.x, s.y, s.size, s.col, Math.sin(Math.PI * k) * 0.95);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} className="final-fireworks" aria-hidden="true" />;
}
