import { Button } from "antd";
import { useAppStore } from "@/stores/app";

export default function ThemeToggle() {
  const isDark = useAppStore((state) => state.themeMode === "dark");
  const toggleTheme = useAppStore((state) => state.toggleTheme);
  const label = isDark ? "切换到亮色模式" : "切换到暗色模式";

  return (
    <Button
      aria-label={label}
      icon={isDark ? <SunIcon /> : <MoonIcon />}
      onClick={toggleTheme}
      shape="circle"
      size="small"
      title={label}
      type="text"
    />
  );
}

function SunIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M20 15.2A8.2 8.2 0 0 1 8.8 4a8.2 8.2 0 1 0 11.2 11.2Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}
