const PLANT_IMAGES = {
  pothos: "/images/editorial-hero-v2.jpg",
  monstera: "/images/plant-monstera-v2.jpg",
  succulent: "/images/plant-succulent-v2.jpg",
  mint: "/images/plant-mint-v2.jpg",
  snake: "/images/plant-snake-v2.jpg",
  fern: "/images/plant-fern-v2.jpg",
} as const;

const IMAGE_LIST = Object.values(PLANT_IMAGES);

/** 为缺少后端封面的品种提供稳定、真实的本地植物照片。 */
export function fallbackPlantImage(
  name: string | null | undefined,
  id: number | string | null | undefined,
): string {
  const normalized = name?.trim().toLowerCase() ?? "";

  if (normalized.includes("绿萝")) return PLANT_IMAGES.pothos;
  if (normalized.includes("龟背竹")) return PLANT_IMAGES.monstera;
  if (normalized.includes("多肉") || normalized.includes("仙人")) {
    return PLANT_IMAGES.succulent;
  }
  if (normalized.includes("薄荷")) return PLANT_IMAGES.mint;
  if (normalized.includes("虎皮") || normalized.includes("兰")) {
    return PLANT_IMAGES.snake;
  }
  if (normalized.includes("蕨") || normalized.includes("常春藤")) {
    return PLANT_IMAGES.fern;
  }

  const numericId = Number(id);
  const index = Number.isFinite(numericId)
    ? Math.abs(Math.trunc(numericId)) % IMAGE_LIST.length
    : 0;

  return IMAGE_LIST[index] ?? PLANT_IMAGES.fern;
}

export const PLANT_HERO_IMAGE = "/images/editorial-hero-v2.jpg";
export const PLANT_AUTH_IMAGE = "/images/auth-repot-v2.jpg";
export const ECO_ACTION_IMAGE = "/images/action-recycle-v2.jpg";
