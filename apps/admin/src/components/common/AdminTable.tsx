import { Table, type TableProps } from "antd";
import { useTableScrollY } from "@/hooks/useTableScrollY";

/**
 * 管理端表格容器：表头固定，仅表格主体滚动。
 *
 * <p>高度按表格在页面中的实际位置计算，自动扣掉分页和内容区留白，
 * 页面本身不产生纵向滚动。
 */
export default function AdminTable<T extends Record<string, any>>(
  props: TableProps<T>,
) {
  const { containerRef, scrollY } = useTableScrollY();

  return (
    <div className="admin-table-scroll" ref={containerRef}>
      <Table<T> {...props} scroll={{ ...props.scroll, y: scrollY }} />
    </div>
  );
}
