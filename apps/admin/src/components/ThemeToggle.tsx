import { MoonOutlined, SunOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { useAppStore } from "@/stores/app";

export default function ThemeToggle() {
  const isDark = useAppStore((state) => state.themeMode === "dark");
  const toggleTheme = useAppStore((state) => state.toggleTheme);
  const label = isDark ? "切换到亮色模式" : "切换到暗色模式";

  return (
    <Button
      aria-label={label}
      icon={isDark ? <SunOutlined /> : <MoonOutlined />}
      onClick={toggleTheme}
      shape="circle"
      size="middle"
      title={label}
      type="default"
    />
  );
}
