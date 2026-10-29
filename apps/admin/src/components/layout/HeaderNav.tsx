import { Menu } from "antd";
import { useNavigate } from "react-router";
import { navGroups } from "@/config/navigation";

type HeaderNavProps = {
  activeGroupKey?: string;
};

export default function HeaderNav({ activeGroupKey }: HeaderNavProps) {
  const navigate = useNavigate();

  const items = navGroups.map((group) => {
    const Icon = group.icon;

    return {
      key: group.key,
      icon: <Icon />,
      label: group.label,
    };
  });

  return (
    <Menu
      items={items}
      mode="horizontal"
      onClick={({ key }) => {
        const firstItem = navGroups.find((group) => group.key === key)
          ?.items[0];

        if (firstItem) {
          navigate(firstItem.path);
        }
      }}
      selectedKeys={activeGroupKey ? [activeGroupKey] : []}
      theme="dark"
    />
  );
}
