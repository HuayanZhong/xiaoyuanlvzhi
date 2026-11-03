import { theme } from "antd";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";

/**
 * 点击火花层（React Bits ClickSpark 的 TypeScript 移植）。
 *
 * 包裹内容后，在内容区域点击时于点击处绘制一次画布火花；默认颜色取 antd 主色
 * token，亮暗主题切换后仍然正确。`prefers-reduced-motion: reduce` 下不注册监听，
 * 完全关闭装饰动画。
 */
export type ClickSparkShape = "line" | "streak" | "dot" | "star";
export type ClickSparkEasing =
  | "linear"
  | "ease-in"
  | "ease-out"
  | "ease-in-out"
  | "spring";

interface Spark {
  angle: number;
  reach: number;
  scale: number;
  life: number;
  spin: number;
  color: string;
  clear: string;
  glow: number;
}

interface SparkSettings {
  colors: string[];
  size: number;
  radius: number;
  count: number;
  width: number;
  duration: number;
  ease: (t: number) => number;
  shape: ClickSparkShape;
  randomness: number;
  gravity: number;
  spread: number;
  direction: number;
  glow: number;
  ring: boolean;
  disabled: boolean;
}

interface SparkBurst {
  x: number;
  y: number;
  start: number;
  sparks: Spark[];
  settings: SparkSettings;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  ratio: number;
  left: number;
  top: number;
}

export interface ClickSparkHandle {
  spark: (x?: number, y?: number) => void;
}

export interface ClickSparkProps {
  sparkColor?: string | string[];
  shape?: ClickSparkShape;
  sparkCount?: number;
  sparkSize?: number;
  sparkWidth?: number;
  sparkRadius?: number;
  duration?: number;
  easing?: ClickSparkEasing;
  randomness?: number;
  gravity?: number;
  spread?: number;
  direction?: number;
  glow?: number;
  ring?: boolean;
  layer?: "front" | "back";
  extraScale?: number;
  disabled?: boolean;
  /** 监听整页点击（含 portal 弹层）；默认只监听包裹区域。 */
  global?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

const EASINGS: Record<ClickSparkEasing, (t: number) => number> = {
  linear: (t) => t,
  "ease-in": (t) => t * t,
  "ease-out": (t) => 1 - (1 - t) ** 3,
  "ease-in-out": (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
  spring: (t) => 1 + 2.4 * (t - 1) ** 3 + 1.4 * (t - 1) ** 2,
};

const SHAPES = new Set<ClickSparkShape>(["line", "streak", "dot", "star"]);
const MAX_BURSTS = 32;
const MAX_SPARK_COUNT = 64;
const MIN_DURATION = 60;
const GRAVITY = 500;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

const toColors = (value: string | string[]): string[] => {
  const list = (Array.isArray(value) ? value : [value]).filter(Boolean);
  return list.length > 0 ? list : ["black"];
};

const starPath = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  rotation: number,
) => {
  const pinch = radius * 0.16;
  ctx.beginPath();
  ctx.moveTo(x + Math.cos(rotation) * radius, y + Math.sin(rotation) * radius);
  for (let index = 1; index <= 4; index += 1) {
    const angle = rotation + (index * Math.PI) / 2;
    const mid = angle - Math.PI / 4;
    ctx.quadraticCurveTo(
      x + Math.cos(mid) * pinch,
      y + Math.sin(mid) * pinch,
      x + Math.cos(angle) * radius,
      y + Math.sin(angle) * radius,
    );
  }
  ctx.closePath();
};

const channels = (
  ctx: CanvasRenderingContext2D,
  color: string,
): [number, number, number] => {
  ctx.fillStyle = color;
  const normal = String(ctx.fillStyle);
  const hex = /^#([0-9a-f]{6})$/i.exec(normal);
  if (hex) {
    const value = Number.parseInt(hex[1] ?? "0", 16);
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
  }

  const rgb = /^rgba?\(([^)]+)\)$/i.exec(normal);
  if (rgb) {
    const parts = (rgb[1] ?? "")
      .split(",")
      .slice(0, 3)
      .map((part) => Number.parseFloat(part));
    return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
  }

  return [0, 0, 0];
};

const drop = (settings: SparkSettings, seconds: number): number =>
  0.5 * settings.gravity * GRAVITY * seconds * seconds;

const position = (
  burst: SparkBurst,
  spark: Spark,
  distance: number,
  seconds: number,
): [number, number] => [
  burst.x + Math.cos(spark.angle) * distance,
  burst.y + Math.sin(spark.angle) * distance + drop(burst.settings, seconds),
];

const drawSpark = (
  ctx: CanvasRenderingContext2D,
  burst: SparkBurst,
  spark: Spark,
  elapsed: number,
): boolean => {
  const settings = burst.settings;
  const life = settings.duration * spark.life;
  const progress = elapsed / life;
  if (progress >= 1) return false;

  const eased = settings.ease(clamp(progress, 0, 1));
  const seconds = elapsed / 1000;
  const distance = settings.radius * spark.reach * eased;
  const width = settings.width * spark.scale;
  const fade =
    1 - smoothstep(settings.shape === "line" ? 0.55 : 0.7, 1, progress);
  if (fade <= 0) return true;

  ctx.strokeStyle = spark.color;
  ctx.fillStyle = spark.color;

  if (settings.shape === "line") {
    const length = settings.size * spark.scale * (1 - progress) ** 1.6;
    const [x1, y1] = position(burst, spark, distance, seconds);
    const [x2, y2] = position(
      burst,
      spark,
      distance + Math.max(0.01, length),
      seconds,
    );
    ctx.lineCap = "round";

    if (spark.glow > 0) {
      ctx.globalAlpha = fade * 0.14 * spark.glow;
      ctx.lineWidth = width * 4.5;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    ctx.globalAlpha = fade;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    return true;
  }

  if (settings.shape === "streak") {
    const lag = Math.min(elapsed, 70 + settings.size * 4 * spark.scale);
    const back = settings.ease(clamp((elapsed - lag) / life, 0, 1));
    const [headX, headY] = position(burst, spark, distance, seconds);
    const [tailX, tailY] = position(
      burst,
      spark,
      settings.radius * spark.reach * back,
      Math.max(0, seconds - lag / 1000),
    );
    const dx = headX - tailX;
    const dy = headY - tailY;
    const length = Math.hypot(dx, dy) || 1;
    const nx = (-dy / length) * width * 0.5;
    const ny = (dx / length) * width * 0.5;

    const paint = (spreadWidth: number, alpha: number) => {
      const gradient = ctx.createLinearGradient(tailX, tailY, headX, headY);
      gradient.addColorStop(0, spark.clear);
      gradient.addColorStop(1, spark.color);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(headX + nx * spreadWidth, headY + ny * spreadWidth);
      ctx.lineTo(headX - nx * spreadWidth, headY - ny * spreadWidth);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = spark.color;
      ctx.beginPath();
      ctx.arc(headX, headY, width * 0.5 * spreadWidth, 0, Math.PI * 2);
      ctx.fill();
    };

    if (spark.glow > 0) paint(3.2, fade * 0.16 * spark.glow);
    paint(1, fade);
    return true;
  }

  if (settings.shape === "dot") {
    const [x, y] = position(burst, spark, distance, seconds);
    const radius = width * 1.25 * (1 - 0.5 * eased);

    if (spark.glow > 0) {
      ctx.globalAlpha = fade * 0.18 * spark.glow;
      ctx.beginPath();
      ctx.arc(x, y, radius * 2.6, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = fade;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    return true;
  }

  const [x, y] = position(burst, spark, distance, seconds);
  const twinkle = Math.sin(Math.PI * clamp(progress * 1.1, 0, 1)) ** 0.7;
  const radius = settings.size * 0.6 * spark.scale * twinkle;
  const rotation = spark.angle + spark.spin * progress * Math.PI * 0.5;
  if (radius <= 0.05) return true;

  if (spark.glow > 0) {
    ctx.globalAlpha = fade * 0.2 * spark.glow;
    ctx.beginPath();
    ctx.arc(x, y, radius * 1.1, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = fade;
  starPath(ctx, x, y, radius, rotation);
  ctx.fill();
  return true;
};

const drawRing = (
  ctx: CanvasRenderingContext2D,
  burst: SparkBurst,
  elapsed: number,
): boolean => {
  const settings = burst.settings;
  const life = settings.duration * 0.8;
  const progress = elapsed / life;
  if (progress >= 1) return false;

  const radius = 2 + settings.radius * 0.6 * EASINGS["ease-out"](progress);
  ctx.globalAlpha = (1 - progress) ** 2 * 0.7;
  ctx.strokeStyle = burst.sparks[0]?.color ?? settings.colors[0] ?? "black";
  ctx.lineWidth = Math.max(0.5, settings.width * (1 - progress) * 0.9);
  ctx.beginPath();
  ctx.arc(burst.x, burst.y, radius, 0, Math.PI * 2);
  ctx.stroke();
  return true;
};

const removeBurst = (bursts: SparkBurst[], burst: SparkBurst) => {
  burst.canvas.remove();
  const index = bursts.indexOf(burst);
  if (index >= 0) bursts.splice(index, 1);
};

const ClickSpark = forwardRef<ClickSparkHandle, ClickSparkProps>(
  function ClickSpark(
    {
      sparkColor,
      sparkSize = 14,
      sparkRadius = 30,
      sparkCount = 8,
      sparkWidth = 2,
      duration = 500,
      easing = "ease-out",
      extraScale = 1,
      shape = "line",
      randomness = 0.2,
      gravity = 0,
      spread = 360,
      direction = 0,
      glow = 0,
      ring = false,
      layer = "front",
      disabled = false,
      global = false,
      className,
      style,
      children,
    },
    ref,
  ) {
    const { token } = theme.useToken();
    const rootRef = useRef<HTMLDivElement>(null);
    const layerRef = useRef<HTMLSpanElement>(null);
    const engineRef = useRef<ClickSparkHandle | null>(null);

    const settings: SparkSettings = {
      colors: toColors(sparkColor ?? [token.colorPrimary]),
      size: Math.max(0, sparkSize),
      radius: Math.max(0, sparkRadius) * Math.max(0, extraScale),
      count: clamp(Math.round(sparkCount), 1, MAX_SPARK_COUNT),
      width: Math.max(0.5, sparkWidth),
      duration: Math.max(MIN_DURATION, duration),
      ease: EASINGS[easing] ?? EASINGS["ease-out"],
      shape: SHAPES.has(shape) ? shape : "line",
      randomness: clamp(randomness, 0, 1),
      gravity: Math.max(0, gravity),
      spread: clamp(spread, 0, 360),
      direction,
      glow: clamp(glow, 0, 1),
      ring,
      disabled,
    };
    const settingsRef = useRef(settings);
    useEffect(() => {
      settingsRef.current = settings;
    });

    useEffect(() => {
      const root = rootRef.current;
      const layerElement = layerRef.current;
      if (!root || !layerElement) return;

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }

      const sparkLayer: HTMLSpanElement = layerElement;
      const bursts: SparkBurst[] = [];
      let raf = 0;
      let lastPress = { time: -1e9, x: 0, y: 0 };

      const frame = (now: number) => {
        raf = 0;

        // 迭代中会移除结束的 burst，复制后遍历避免跳过元素。
        // oxlint-disable-next-line unicorn/no-useless-spread
        for (const burst of [...bursts]) {
          const elapsed = now - burst.start;
          const ctx = burst.ctx;
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.clearRect(0, 0, burst.canvas.width, burst.canvas.height);
          ctx.setTransform(
            burst.ratio,
            0,
            0,
            burst.ratio,
            -burst.left * burst.ratio,
            -burst.top * burst.ratio,
          );

          let alive = false;
          if (burst.settings.ring && drawRing(ctx, burst, elapsed)) {
            alive = true;
          }

          for (const spark of burst.sparks) {
            if (drawSpark(ctx, burst, spark, elapsed)) alive = true;
          }

          ctx.globalAlpha = 1;
          if (!alive) removeBurst(bursts, burst);
        }

        if (bursts.length > 0) raf = requestAnimationFrame(frame);
      };

      const spawn = (clientX: number, clientY: number) => {
        const current = settingsRef.current;
        if (current.disabled) return;

        const rect = root.getBoundingClientRect();
        const offset = Math.floor(Math.random() * current.colors.length);
        const full = current.spread >= 359.5;
        const arc = (current.spread * Math.PI) / 180;
        const heading = ((current.direction - 90) * Math.PI) / 180;
        const step = full
          ? (Math.PI * 2) / current.count
          : current.count > 1
            ? arc / (current.count - 1)
            : 0;

        const sparks = Array.from({ length: current.count }, (_, index) => {
          const base = full
            ? heading + step * index
            : current.count > 1
              ? heading - arc / 2 + step * index
              : heading;
          const jitter = (Math.random() - 0.5) * current.randomness;

          return {
            angle: base + jitter * (step || arc || 1) * 0.9,
            reach: 1 + (Math.random() - 0.5) * 0.7 * current.randomness,
            scale: 1 + (Math.random() - 0.5) * 0.8 * current.randomness,
            life: 1 + (Math.random() - 0.5) * 0.5 * current.randomness,
            spin: Math.random() - 0.5,
            color:
              current.colors[(index + offset) % current.colors.length] ??
              "black",
            clear: "",
            glow: 0,
          };
        });

        const longest = current.duration * (1 + 0.25 * current.randomness);
        const fall = drop(current, longest / 1000);
        const reach =
          current.radius *
            (1 + 0.35 * current.randomness) *
            (current.ease === EASINGS.spring ? 1.15 : 1) +
          current.size * (1 + 0.4 * current.randomness) +
          current.width * (current.glow > 0 ? 6 : 2) +
          6;
        const box = {
          left: Math.max(clientX - reach, 0),
          top: Math.max(clientY - reach, 0),
          right: Math.min(clientX + reach, window.innerWidth),
          bottom: Math.min(clientY + reach + fall, window.innerHeight),
        };
        if (box.right - box.left < 1 || box.bottom - box.top < 1) return;

        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil((box.right - box.left) * ratio);
        canvas.height = Math.ceil((box.bottom - box.top) * ratio);
        Object.assign(canvas.style, {
          position: "absolute",
          left: `${box.left - rect.left}px`,
          top: `${box.top - rect.top}px`,
          width: `${box.right - box.left}px`,
          height: `${box.bottom - box.top}px`,
          display: "block",
          pointerEvents: "none",
        });
        canvas.setAttribute("aria-hidden", "true");
        sparkLayer.appendChild(canvas);

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          canvas.remove();
          return;
        }

        for (const spark of sparks) {
          const [r, g, b] = channels(ctx, spark.color);
          spark.clear = `rgba(${r}, ${g}, ${b}, 0)`;
          spark.glow =
            current.glow *
            (0.35 + (0.65 * (0.2126 * r + 0.7152 * g + 0.0722 * b)) / 255);
        }

        bursts.push({
          x: clientX,
          y: clientY,
          start: performance.now(),
          sparks,
          settings: { ...current },
          canvas,
          ctx,
          ratio,
          left: box.left,
          top: box.top,
        });

        while (bursts.length > MAX_BURSTS) {
          const oldest = bursts[0];
          if (!oldest) break;
          removeBurst(bursts, oldest);
        }

        if (raf === 0) raf = requestAnimationFrame(frame);
      };

      const onPointerDown = (event: PointerEvent) => {
        if (event.pointerType !== "mouse" || event.button !== 0) return;
        lastPress = {
          time: performance.now(),
          x: event.clientX,
          y: event.clientY,
        };
        spawn(event.clientX, event.clientY);
      };

      const onClick = (event: MouseEvent) => {
        if (
          "pointerType" in event &&
          (event as PointerEvent).pointerType === "mouse"
        ) {
          return;
        }

        if (event.detail === 0) {
          const target = event.target instanceof Element ? event.target : root;
          const rect = target.getBoundingClientRect();
          spawn(rect.left + rect.width / 2, rect.top + rect.height / 2);
          return;
        }

        const recent =
          performance.now() - lastPress.time < 700 &&
          Math.hypot(event.clientX - lastPress.x, event.clientY - lastPress.y) <
            12;
        if (!recent) spawn(event.clientX, event.clientY);
      };

      if (global) {
        document.addEventListener("pointerdown", onPointerDown);
        document.addEventListener("click", onClick);
      } else {
        root.addEventListener("pointerdown", onPointerDown);
        root.addEventListener("click", onClick);
      }

      engineRef.current = {
        spark: (x, y) => {
          const rect = root.getBoundingClientRect();
          spawn(
            rect.left + (x ?? rect.width / 2),
            rect.top + (y ?? rect.height / 2),
          );
        },
      };

      return () => {
        if (global) {
          document.removeEventListener("pointerdown", onPointerDown);
          document.removeEventListener("click", onClick);
        } else {
          root.removeEventListener("pointerdown", onPointerDown);
          root.removeEventListener("click", onClick);
        }
        cancelAnimationFrame(raf);
        while (bursts.length > 0) {
          const burst = bursts[0];
          if (!burst) break;
          removeBurst(bursts, burst);
        }
        engineRef.current = null;
      };
    }, [global]);

    useImperativeHandle(
      ref,
      () => ({
        spark: (x?: number, y?: number) => engineRef.current?.spark(x, y),
      }),
      [],
    );

    return (
      <div
        ref={rootRef}
        className={className ? `click-spark ${className}` : "click-spark"}
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          ...style,
        }}
      >
        {children}
        <span
          ref={layerRef}
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: layer === "back" ? -1 : 1,
            overflow: "visible",
            pointerEvents: "none",
          }}
        />
      </div>
    );
  },
);

export default ClickSpark;
