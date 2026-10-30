import {
  LogoutOutlined,
  MoonOutlined,
  SunOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Dropdown, Space } from "antd";
import { useNavigate } from "react-router";
import { emitToast } from "@/lib/toast-events";
import { useAppStore } from "@/stores/app";
import { useAuthStore } from "@/stores/auth";
import HeaderButton from "./HeaderButton";

export default function HeaderActions() {
  const navigate = useNavigate();
  const isDark = useAppStore((state) => state.themeMode === "dark");
  const toggleTheme = useAppStore((state) => state.toggleTheme);
  const account = useAuthStore((state) => state.account);
  const logout = useAuthStore((state) => state.logout);
  const themeLabel = isDark ? "切换到亮色模式" : "切换到暗色模式";
  const accountLabel = account?.fullName ?? account?.email ?? "管理员";

  const handleLogout = async () => {
    const { revokeFailed } = await logout();

    // 提示挂在 body 上，紧接着的跳转不会把它打断。
    emitToast(
      revokeFailed ? "warning" : "success",
      revokeFailed ? "已退出本地登录，但服务端令牌可能仍未失效" : "已退出登录",
    );
    navigate("/login", { replace: true });
  };

  return (
    <Space size={8}>
      <HeaderButton
        aria-label={themeLabel}
        icon={isDark ? <SunOutlined /> : <MoonOutlined />}
        onClick={toggleTheme}
        title={themeLabel}
      />
      <Dropdown
        menu={{
          items: [
            {
              disabled: true,
              key: "account",
              label: accountLabel,
            },
            { type: "divider" },
            {
              key: "logout",
              icon: <LogoutOutlined />,
              label: "退出登录",
            },
          ],
          onClick: ({ key }) => {
            if (key === "logout") {
              void handleLogout();
            }
          },
        }}
        placement="bottomRight"
        trigger={["click"]}
      >
        <HeaderButton aria-label="账号菜单" icon={<UserOutlined />} />
      </Dropdown>
    </Space>
  );
}
