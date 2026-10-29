import {
  LogoutOutlined,
  MoonOutlined,
  SunOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Dropdown, Space } from "antd";
import { useNavigate } from "react-router";
import { useAppStore } from "@/stores/app";
import HeaderButton from "./HeaderButton";

export default function HeaderActions() {
  const navigate = useNavigate();
  const isDark = useAppStore((state) => state.themeMode === "dark");
  const toggleTheme = useAppStore((state) => state.toggleTheme);
  const themeLabel = isDark ? "切换到亮色模式" : "切换到暗色模式";

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
              key: "logout",
              icon: <LogoutOutlined />,
              label: "退出登录",
            },
          ],
          onClick: ({ key }) => {
            if (key === "logout") {
              navigate("/login", { replace: true });
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
