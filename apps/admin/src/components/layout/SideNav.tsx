import { Menu, type MenuProps } from "antd";
import { useNavigate } from "react-router";
import { navGroups } from "@/config/navigation";

type SideNavProps = {
  activeGroupKey?: string;
  collapsed: boolean;
  selectedItemKey?: string;
};

/**
 * 侧栏两级导航：一级是业务分组，二级是具体页面。
 * 当前路由所在分组默认展开；切换分组时以当前分组重新初始化展开状态。
 */
export default function SideNav({
  activeGroupKey,
  collapsed,
  selectedItemKey,
}: SideNavProps) {
  const navigate = useNavigate();

  const items: MenuProps["items"] = navGroups.map((group) => {
    const GroupIcon = group.icon;

    return {
      key: group.key,
      icon: <GroupIcon />,
      label: group.label,
      children: group.items.map((item) => {
        const Icon = item.icon;

        return {
          key: item.key,
          icon: <Icon />,
          label: item.label,
        };
      }),
    };
  });

  return (
    <Menu
      defaultOpenKeys={activeGroupKey ? [activeGroupKey] : []}
      inlineCollapsed={collapsed}
      items={items}
      key={activeGroupKey ?? "nav"}
      mode="inline"
      onClick={({ key }) => {
        const target = navGroups
          .flatMap((group) => group.items)
          .find((item) => item.key === key);

        if (target) {
          navigate(target.path);
        }
      }}
      selectedKeys={selectedItemKey ? [selectedItemKey] : []}
    />
  );
}
