import { Drawer, Menu, type MenuProps } from "antd";
import { useNavigate } from "react-router";
import { navGroups } from "@/config/navigation";

type MobileNavDrawerProps = {
  activeItemKey?: string;
  onClose: () => void;
  open: boolean;
};

export default function MobileNavDrawer({
  activeItemKey,
  onClose,
  open,
}: MobileNavDrawerProps) {
  const navigate = useNavigate();

  const items: MenuProps["items"] = navGroups.map((group) => ({
    type: "group",
    key: group.key,
    label: group.label,
    children: group.items.map((item) => {
      const Icon = item.icon;

      return {
        key: item.key,
        icon: <Icon />,
        label: item.label,
      };
    }),
  }));

  return (
    <Drawer
      onClose={onClose}
      open={open}
      placement="left"
      size={288}
      title="导航"
    >
      <Menu
        items={items}
        mode="inline"
        onClick={({ key }) => {
          const target = navGroups
            .flatMap((group) => group.items)
            .find((item) => item.key === key);

          if (target) {
            navigate(target.path);
            onClose();
          }
        }}
        selectedKeys={activeItemKey ? [activeItemKey] : []}
      />
    </Drawer>
  );
}
