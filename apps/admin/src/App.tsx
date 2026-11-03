import { App as AntdApp, ConfigProvider, theme as antdTheme } from "antd";
import zhCN from "antd/locale/zh_CN";
import { useLayoutEffect } from "react";
import { RouterProvider } from "react-router/dom";
import SessionGate from "@/components/auth/SessionGate";
import ToastBridge from "@/components/auth/ToastBridge";
import ClickSpark from "@/components/ClickSpark";
import ThemeTokenBridge from "@/components/ThemeTokenBridge";
import { router } from "@/router";
import { useAppStore } from "@/stores/app";

// 点击火花保持克制：主色短线，短暂、无发光，减少动态时由组件自行关闭。
const clickSparkOptions = {
  sparkCount: 8,
  sparkSize: 10,
  sparkWidth: 1.5,
  sparkRadius: 24,
  duration: 360,
  randomness: 0.35,
} as const;

export default function App() {
  const isDark = useAppStore((state) => state.themeMode === "dark");

  useLayoutEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: isDark
          ? antdTheme.darkAlgorithm
          : antdTheme.defaultAlgorithm,
      }}
    >
      <AntdApp>
        <ThemeTokenBridge />
        <ToastBridge />
        <ClickSpark
          global
          style={{ minHeight: "100vh" }}
          {...clickSparkOptions}
        >
          <SessionGate>
            <RouterProvider router={router} />
          </SessionGate>
        </ClickSpark>
      </AntdApp>
    </ConfigProvider>
  );
}
