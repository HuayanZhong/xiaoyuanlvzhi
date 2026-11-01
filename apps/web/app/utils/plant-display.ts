const DIFFICULTY_LABELS: Record<string, string> = {
  EASY: "容易",
  MEDIUM: "适中",
  HARD: "需要照料",
};

/** 把后端的难度枚举转成学生能读的中文。 */
export function difficultyLabel(value: string | null | undefined): string {
  const key = value?.trim().toUpperCase();

  return (key && DIFFICULTY_LABELS[key]) || "未标注";
}

/** 品种画框左下角的编号。 */
export function speciesCode(id: number): string {
  return `SP-${String(id).padStart(3, "0")}`;
}
