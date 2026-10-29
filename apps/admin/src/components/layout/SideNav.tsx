import { Menu } from "antd";
import { useNavigate } from "react-router";
import type { NavGroup } from "@/config/navigation";

type SideNavProps = {
  collapsed: boolean;
  group?: NavGroup;
  selectedItemKey?: string;
};

export default function SideNav({
  collapsed,
  group,
  selectedItemKey,
}: SideNavProps) {
  const navigate = useNavigate();

  const items = (group?.items ?? []).map((item) => {
    const Icon = item.icon;

    return {
      key: item.key,
      icon: <Icon />,
      label: item.label,
    };
  });

  return (
    <Menu
      inlineCollapsed={collapsed}
      items={items}
      mode="inline"
      onClick={({ key }) => {
        const target = group?.items.find((item) => item.key === key);

        if (target) {
          navigate(target.path);
        }
      }}
      selectedKeys={selectedItemKey ? [selectedItemKey] : []}
    />
  );
}
