<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

/**
 * 点击火花层（ClickSpark 的 Vue 移植）。
 *
 * 默认插槽是应用内容；在内容区域点击时，于点击处播放一次画布火花。
 * 颜色默认读取 `--color-leaf` / `--color-sticker`，因此明暗主题切换后仍然正确；
 * `prefers-reduced-motion: reduce` 下不注册监听，完全关闭装饰动画。
 *
 * 用法：
 * ```vue
 * <ClickSpark :spark-count="8" :duration="360">
 *   <slot />
 * </ClickSpark>
 * ```
 */
type SparkShape = "line" | "streak" | "dot" | "star";
type SparkEasing = "linear" | "ease-in" | "ease-out" | "ease-in-out" | "spring";

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
  shape: SparkShape;
  randomness: number;
  gravity: number;
  spread: number;
  direction: number;
  glow: number;
  ring: boolean;
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

interface SparkEngine {
  spark: (x?: number, y?: number) => void;
}

const EASINGS: Record<SparkEasing, (t: number) => number> = {
  linear: (t) => t,
  "ease-in": (t) => t * t,
  "ease-out": (t) => 1 - (1 - t) ** 3,
  "ease-in-out": (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
  spring: (t) => 1 + 2.4 * (t - 1) ** 3 + 1.4 * (t - 1) ** 2,
};

const SHAPES = new Set<SparkShape>(["line", "streak", "dot", "star"]);
const DEFAULT_SPARK_COLORS = ["var(--color-leaf)", "var(--color-sticker)"];
const MAX_BURSTS = 32;
const MAX_SPARK_COUNT = 64;
const MIN_DURATION = 60;
const GRAVITY = 500;

const props = withDefaults(
  defineProps<{
    sparkColor?: string | string[];
    shape?: SparkShape;
    sparkCount?: number;
    sparkSize?: number;
    sparkWidth?: number;
    sparkRadius?: number;
    duration?: number;
    easing?: SparkEasing;
    randomness?: number;
    gravity?: number;
    spread?: number;
    direction?: number;
    glow?: number;
    ring?: boolean;
    layer?: "front" | "back";
    extraScale?: number;
    disabled?: boolean;
  }>(),
  {
    shape: "line",
    sparkCount: 8,
    sparkSize: 14,
    sparkWidth: 2,
    sparkRadius: 30,
    duration: 500,
    easing: "ease-out",
    randomness: 0.2,
    gravity: 0,
    spread: 360,
    direction: 0,
    glow: 0,
    ring: false,
    layer: "front",
    extraScale: 1,
    disabled: false,
  },
);

const rootRef = ref<HTMLElement | null>(null);
const layerRef = ref<HTMLElement | null>(null);
let engine: SparkEngine | null = null;
let cleanup: (() => void) | null = null;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

function resolveColor(value: string, element: HTMLElement): string {
  const token = /^var\(\s*(--[\w-]+)\s*\)$/.exec(value.trim());
  if (!token) return value;

  return getComputedStyle(element)
    .getPropertyValue(token[1] ?? "")
    .trim();
}

function resolveColors(
  value: string | readonly string[],
  element: HTMLElement,
): string[] {
  const values: readonly string[] = typeof value === "string" ? [value] : value;
  const list = values
    .map((color) => resolveColor(color, element))
    .filter(Boolean);

  return list.length > 0 ? list : ["black"];
}

function starPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  rotation: number,
) {
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
}

function channels(
  ctx: CanvasRenderingContext2D,
  color: string,
): [number, number, number] {
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
}

function drop(settings: SparkSettings, seconds: number): number {
  return 0.5 * settings.gravity * GRAVITY * seconds * seconds;
}

function position(
  burst: SparkBurst,
  spark: Spark,
  distance: number,
  seconds: number,
): [number, number] {
  return [
    burst.x + Math.cos(spark.angle) * distance,
    burst.y + Math.sin(spark.angle) * distance + drop(burst.settings, seconds),
  ];
}

function drawSpark(
  ctx: CanvasRenderingContext2D,
  burst: SparkBurst,
  spark: Spark,
  elapsed: number,
): boolean {
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
}

function drawRing(
  ctx: CanvasRenderingContext2D,
  burst: SparkBurst,
  elapsed: number,
): boolean {
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
}

function removeBurst(bursts: SparkBurst[], burst: SparkBurst) {
  burst.canvas.remove();
  const index = bursts.indexOf(burst);
  if (index >= 0) bursts.splice(index, 1);
}

onMounted(() => {
  const rootElement = rootRef.value;
  const layerElement = layerRef.value;
  if (!rootElement || !layerElement) return;

  // 固定为非空别名，嵌套函数中不再反复收窄。
  const root: HTMLElement = rootElement;
  const layer: HTMLElement = layerElement;

  const reduced =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return;

  const bursts: SparkBurst[] = [];
  let raf = 0;
  let lastPress = { time: -1e9, x: 0, y: 0 };

  function currentSettings(): SparkSettings {
    const shape = SHAPES.has(props.shape) ? props.shape : "line";

    return {
      colors: resolveColors(props.sparkColor ?? DEFAULT_SPARK_COLORS, root),
      size: Math.max(0, props.sparkSize),
      radius: Math.max(0, props.sparkRadius) * Math.max(0, props.extraScale),
      count: clamp(Math.round(props.sparkCount), 1, MAX_SPARK_COUNT),
      width: Math.max(0.5, props.sparkWidth),
      duration: Math.max(MIN_DURATION, props.duration),
      ease: EASINGS[props.easing] ?? EASINGS["ease-out"],
      shape,
      randomness: clamp(props.randomness, 0, 1),
      gravity: Math.max(0, props.gravity),
      spread: clamp(props.spread, 0, 360),
      direction: props.direction,
      glow: clamp(props.glow, 0, 1),
      ring: props.ring,
    };
  }

  function frame(now: number) {
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
  }

  function spawn(clientX: number, clientY: number) {
    if (props.disabled) return;

    const settings = currentSettings();
    const rect = root.getBoundingClientRect();
    const offset = Math.floor(Math.random() * settings.colors.length);
    const full = settings.spread >= 359.5;
    const arc = (settings.spread * Math.PI) / 180;
    const heading = ((settings.direction - 90) * Math.PI) / 180;
    const step = full
      ? (Math.PI * 2) / settings.count
      : settings.count > 1
        ? arc / (settings.count - 1)
        : 0;

    const sparks = Array.from({ length: settings.count }, (_, index) => {
      const base = full
        ? heading + step * index
        : settings.count > 1
          ? heading - arc / 2 + step * index
          : heading;
      const jitter = (Math.random() - 0.5) * settings.randomness;

      return {
        angle: base + jitter * (step || arc || 1) * 0.9,
        reach: 1 + (Math.random() - 0.5) * 0.7 * settings.randomness,
        scale: 1 + (Math.random() - 0.5) * 0.8 * settings.randomness,
        life: 1 + (Math.random() - 0.5) * 0.5 * settings.randomness,
        spin: Math.random() - 0.5,
        color:
          settings.colors[(index + offset) % settings.colors.length] ?? "black",
        clear: "",
        glow: 0,
      };
    });

    const longest = settings.duration * (1 + 0.25 * settings.randomness);
    const fall = drop(settings, longest / 1000);
    const reach =
      settings.radius *
        (1 + 0.35 * settings.randomness) *
        (settings.ease === EASINGS.spring ? 1.15 : 1) +
      settings.size * (1 + 0.4 * settings.randomness) +
      settings.width * (settings.glow > 0 ? 6 : 2) +
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
    layer.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      canvas.remove();
      return;
    }

    for (const spark of sparks) {
      const [r, g, b] = channels(ctx, spark.color);
      spark.clear = `rgba(${r}, ${g}, ${b}, 0)`;
      spark.glow =
        settings.glow *
        (0.35 + (0.65 * (0.2126 * r + 0.7152 * g + 0.0722 * b)) / 255);
    }

    bursts.push({
      x: clientX,
      y: clientY,
      start: performance.now(),
      sparks,
      settings: { ...settings },
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
  }

  function onPointerDown(event: PointerEvent) {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    lastPress = {
      time: performance.now(),
      x: event.clientX,
      y: event.clientY,
    };
    spawn(event.clientX, event.clientY);
  }

  function onClick(event: MouseEvent) {
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
      Math.hypot(event.clientX - lastPress.x, event.clientY - lastPress.y) < 12;
    if (!recent) spawn(event.clientX, event.clientY);
  }

  root.addEventListener("pointerdown", onPointerDown);
  root.addEventListener("click", onClick);

  engine = {
    spark: (x, y) => {
      const rect = root.getBoundingClientRect();
      spawn(
        rect.left + (x ?? rect.width / 2),
        rect.top + (y ?? rect.height / 2),
      );
    },
  };

  cleanup = () => {
    root.removeEventListener("pointerdown", onPointerDown);
    root.removeEventListener("click", onClick);
    cancelAnimationFrame(raf);
    while (bursts.length > 0) {
      const burst = bursts[0];
      if (!burst) break;
      removeBurst(bursts, burst);
    }
    engine = null;
  };
});

onBeforeUnmount(() => {
  cleanup?.();
  cleanup = null;
});

defineExpose({
  spark: (x?: number, y?: number) => engine?.spark(x, y),
});
</script>

<template>
  <div ref="rootRef" class="click-spark">
    <slot />
    <span
      ref="layerRef"
      class="click-spark__layer"
      :class="`click-spark__layer--${layer}`"
      aria-hidden="true"
    />
  </div>
</template>

<style scoped>
.click-spark {
  position: relative;
  width: 100%;
  height: 100%;
}

.click-spark__layer {
  position: absolute;
  inset: 0;
  overflow: visible;
  pointer-events: none;
}

.click-spark__layer--front {
  z-index: 1;
}

.click-spark__layer--back {
  z-index: -1;
}
</style>
