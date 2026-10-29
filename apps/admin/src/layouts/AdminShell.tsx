import {
  MenuFoldOutlined,
  MenuOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import { Flex, Layout } from "antd";
import { useState } from "react";
import { Outlet } from "react-router";
import BrandMark from "@/components/BrandMark";
import HeaderActions from "@/components/layout/HeaderActions";
import HeaderButton from "@/components/layout/HeaderButton";
import HeaderNav from "@/components/layout/HeaderNav";
import MobileNavDrawer from "@/components/layout/MobileNavDrawer";
import SideNav from "@/components/layout/SideNav";
import { useIsMobile } from "@/hooks/useIsMobile";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useAppStore } from "@/stores/app";

const { Content, Header, Sider } = Layout;

export default function AdminShell() {
  const { group, item } = usePageMeta();
  const isMobile = useIsMobile();
  const sidebarCollapsed = useAppStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useAppStore((state) => state.toggleSidebar);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleLabel = isMobile
    ? "打开导航"
    : sidebarCollapsed
      ? "展开导航"
      : "折叠导航";

  const toggleNavigation = () => {
    if (isMobile) {
      setDrawerOpen(true);
      return;
    }

    toggleSidebar();
  };

  return (
    <Layout>
      <Header>
        <Flex align="center" flex="auto" gap={12} justify="space-between">
          <Flex align="center" gap={12}>
            <HeaderButton
              aria-label={toggleLabel}
              icon={
                isMobile ? (
                  <MenuOutlined />
                ) : sidebarCollapsed ? (
                  <MenuUnfoldOutlined />
                ) : (
                  <MenuFoldOutlined />
                )
              }
              onClick={toggleNavigation}
              title={toggleLabel}
            />
            {!isMobile && <BrandMark tone="dark" />}
            {!isMobile && <HeaderNav activeGroupKey={group?.key} />}
          </Flex>
          <HeaderActions />
        </Flex>
      </Header>

      <Layout>
        {!isMobile && (
          <Sider
            collapsed={sidebarCollapsed}
            collapsedWidth={64}
            collapsible
            theme="light"
            trigger={null}
            width={208}
          >
            <SideNav
              collapsed={sidebarCollapsed}
              group={group}
              selectedItemKey={item?.key}
            />
          </Sider>
        )}

        <Content style={{ padding: 24 }}>
          <Outlet />
        </Content>
      </Layout>

      {isMobile && (
        <MobileNavDrawer
          activeItemKey={item?.key}
          onClose={() => setDrawerOpen(false)}
          open={drawerOpen}
        />
      )}
    </Layout>
  );
}
