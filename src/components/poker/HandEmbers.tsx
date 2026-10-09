import { useEffect, useRef } from "react";

/** Soft rising embers from the Opus reference, scoped behind the voting hand. */
export function HandEmbers() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0;
    let width = 0;
    let height = 0;
    let previous = 0;
    type Ember = {
      x: number;
      y: number;
      radius: number;
      vx: number;
      vy: number;
      life: number;
      max: number;
      magic: boolean;
      phase: number;
    };
    const spawn = (initial: boolean): Ember => {
      const max = 500 + Math.random() * 700;
      return {
        x: Math.random() * width,
        y: initial ? Math.random() * height : height + 12,
        radius: 0.6 + Math.random() * 1.7,
        vx: (Math.random() - 0.5) * 0.18,
        vy: -(0.12 + Math.random() * 0.42),
        life: initial ? Math.random() * max : 0,
        max,
        magic: Math.random() < 0.14,
        phase: Math.random() * Math.PI * 2,
      };
    };
    let particles: Ember[] = [];
    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = Array.from({ length: 34 }, () => spawn(true));
    };
    const tick = (time: number) => {
      const step = previous ? Math.min(42, time - previous) / (1000 / 60) : 1;
      previous = time;
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";
      particles.forEach((p, index) => {
        p.life += step;
        p.x += (p.vx + Math.sin(p.life / 70 + p.phase) * 0.22) * step;
        p.y += p.vy * step;
        const t = p.life / p.max;
        if (t >= 1 || p.y < -12) {
          particles[index] = spawn(false);
          return;
        }
        const alpha = Math.max(
          0,
          Math.sin(Math.PI * t) * (0.45 + 0.4 * Math.sin(p.life / 9 + p.phase)),
        );
        const radius = p.radius * 4;
        const color = p.magic ? "190,225,255" : "255,188,105";
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
        glow.addColorStop(0, `rgba(${color},${alpha})`);
        glow.addColorStop(1, `rgba(${color},0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fill();
      });
      raf = requestAnimationFrame(tick);
    };
    const sync = () => {
      cancelAnimationFrame(raf);
      previous = 0;
      ctx.clearRect(0, 0, width, height);
      if (!motion.matches && !document.hidden) raf = requestAnimationFrame(tick);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    motion.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    sync();
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      motion.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);
  return <canvas ref={ref} className="hand-embers" aria-hidden="true" />;
}
