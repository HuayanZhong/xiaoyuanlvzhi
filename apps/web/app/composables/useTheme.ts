type Theme = "light" | "dark";

const THEME_KEY = "student-theme";

/**
 * 学生端的日间/暗夜主题状态。
 *
 * 首屏由 `nuxt.config.ts` 的内联脚本在绘制前写入 `data-theme`；
 * 这里在挂载后同步按钮状态，避免服务端与客户端首帧不一致。
 */
export function useTheme() {
  const theme = useState<Theme>("student-theme", () => "light");
  const isDark = computed(() => theme.value === "dark");

  onMounted(() => {
    // oxlint-disable-next-line react/immutability -- Vue ref 需要直接赋值
    theme.value =
      document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  });

  function setTheme(next: Theme) {
    // oxlint-disable-next-line react/immutability -- Vue ref 需要直接赋值
    theme.value = next;
    document.documentElement.dataset.theme = next;

    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // 存储不可用时主题仍在当前页面生效。
    }
  }

  function toggleTheme() {
    setTheme(isDark.value ? "light" : "dark");
  }

  return { theme, isDark, setTheme, toggleTheme };
}
