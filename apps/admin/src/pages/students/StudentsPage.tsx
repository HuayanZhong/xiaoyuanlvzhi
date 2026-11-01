import { SearchOutlined } from "@ant-design/icons";
import {
  Button,
  Empty,
  Flex,
  Input,
  Select,
  Tag,
  Typography,
  type TableColumnsType,
} from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { listStudentRecords, type StudentRecordView } from "@/api/accounts";
import AdminTable from "@/components/common/AdminTable";
import LoadFailure from "@/components/common/LoadFailure";
import ModulePage from "@/components/common/ModulePage";
import { formatDateTime } from "@/lib/format";
import StudentDetailDrawer from "./StudentDetailDrawer";
import {
  STUDENT_STATUS_OPTIONS,
  studentDisplayName,
  studentStatusColor,
  studentStatusLabel,
  type StudentStatusFilter,
} from "./labels";

const PAGE_SIZE = 10;

type StudentFilters = {
  keyword: string;
  department: string;
  status: StudentStatusFilter;
  from: string;
  to: string;
};

const EMPTY_FILTERS: StudentFilters = {
  keyword: "",
  department: "all",
  status: "all",
  from: "",
  to: "",
};

function sortStudents(items: StudentRecordView[]): StudentRecordView[] {
  return (
    [...items]
      // oxlint-disable-next-line unicorn/no-array-sort -- tsconfig lib 低于 ES2023
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
  );
}

/** 学生管理：账号目录、筛选、详情和启用/禁用。 */
export default function StudentsPage() {
  const [students, setStudents] = useState<StudentRecordView[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [draft, setDraft] = useState<StudentFilters>(EMPTY_FILTERS);
  const [filters, setFilters] = useState<StudentFilters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<number | null>(null);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    setFailed(false);

    try {
      setStudents(sortStudents(await listStudentRecords()));
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // 首次进入学生管理页时加载学生目录；setState 发生在 await 之后。
    // oxlint-disable-next-line react/set-state-in-effect -- 页面首次加载学生列表
    void loadStudents();
  }, [loadStudents]);

  const departmentOptions = useMemo(() => {
    const departments = [
      ...new Set(
        students
          .map((student) => student.department)
          .filter((value): value is string => Boolean(value)),
      ),
    ];
    // oxlint-disable-next-line unicorn/no-array-sort -- tsconfig lib 低于 ES2023
    departments.sort((left, right) => left.localeCompare(right, "zh-CN"));

    return [
      { value: "all", label: "全部院系" },
      ...departments.map((department) => ({
        value: department,
        label: department,
      })),
    ];
  }, [students]);

  const filtered = useMemo(() => {
    const keyword = filters.keyword.trim().toLowerCase();

    return students.filter((student) => {
      const matchesKeyword =
        !keyword ||
        [student.fullName, student.studentNumber, student.email].some((value) =>
          value?.toLowerCase().includes(keyword),
        );
      const matchesDepartment =
        filters.department === "all" ||
        student.department === filters.department;
      const matchesStatus =
        filters.status === "all" || student.status === filters.status;
      const day = student.createdAt.slice(0, 10);
      const matchesDate =
        (!filters.from || day >= filters.from) &&
        (!filters.to || day <= filters.to);

      return (
        matchesKeyword && matchesDepartment && matchesStatus && matchesDate
      );
    });
  }, [filters, students]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const applyFilters = () => {
    setFilters(draft);
    setPage(1);
  };

  const resetFilters = () => {
    setDraft(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
    setPage(1);
  };

  const handleChanged = useCallback((updated: StudentRecordView) => {
    setStudents((current) =>
      current.map((student) => (student.id === updated.id ? updated : student)),
    );
  }, []);

  const retry = () => {
    void loadStudents();
  };

  const columns: TableColumnsType<StudentRecordView> = [
    {
      title: "姓名",
      key: "name",
      width: 120,
      render: (_: unknown, record) => studentDisplayName(record),
    },
    {
      title: "学号",
      dataIndex: "studentNumber",
      width: 120,
      render: (value: string | null) => value || "—",
    },
    {
      title: "院系",
      dataIndex: "department",
      width: 140,
      render: (value: string | null) => value || "—",
    },
    {
      title: "班级",
      dataIndex: "className",
      width: 140,
      render: (value: string | null) => value || "—",
    },
    {
      title: "手机号",
      dataIndex: "phone",
      width: 140,
      render: (value: string | null) => value || "—",
    },
    {
      title: "当前积分",
      dataIndex: "pointsBalance",
      width: 100,
    },
    {
      title: "在养绿植数",
      dataIndex: "activeAdoptionCount",
      width: 110,
    },
    {
      title: "账号状态",
      dataIndex: "status",
      width: 100,
      render: (value: string) => (
        <Tag color={studentStatusColor(value)}>{studentStatusLabel(value)}</Tag>
      ),
    },
    {
      title: "注册时间",
      dataIndex: "createdAt",
      width: 160,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: "操作",
      key: "actions",
      width: 90,
      render: (_: unknown, record) => (
        <Button size="small" onClick={() => setDetailId(record.id)}>
          查看
        </Button>
      ),
    },
  ];

  const emptyState = (
    <Empty
      description={
        students.length === 0 ? "暂无学生" : "没有符合筛选条件的学生"
      }
      image={Empty.PRESENTED_IMAGE_SIMPLE}
    >
      <Flex gap={8} justify="center" wrap>
        <Button onClick={() => void loadStudents()}>刷新</Button>
        <Button onClick={resetFilters}>清空筛选</Button>
      </Flex>
    </Empty>
  );

  return (
    <ModulePage title="学生管理">
      <Flex gap={16} vertical>
        <Flex align="center" gap={12} wrap>
          <Input
            allowClear
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                keyword: event.target.value,
              }))
            }
            onPressEnter={applyFilters}
            placeholder="姓名、学号或邮箱"
            prefix={<SearchOutlined />}
            style={{ width: 240 }}
            value={draft.keyword}
          />
          <Select
            onChange={(department) =>
              setDraft((current) => ({ ...current, department }))
            }
            options={departmentOptions}
            style={{ width: 160 }}
            value={draft.department}
          />
          <Select<StudentStatusFilter>
            onChange={(status) =>
              setDraft((current) => ({ ...current, status }))
            }
            options={[...STUDENT_STATUS_OPTIONS]}
            style={{ width: 140 }}
            value={draft.status}
          />
          <Input
            aria-label="注册日期起"
            max={draft.to || undefined}
            onChange={(event) =>
              setDraft((current) => ({ ...current, from: event.target.value }))
            }
            style={{ width: 150 }}
            type="date"
            value={draft.from}
          />
          <Typography.Text type="secondary">至</Typography.Text>
          <Input
            aria-label="注册日期止"
            min={draft.from || undefined}
            onChange={(event) =>
              setDraft((current) => ({ ...current, to: event.target.value }))
            }
            style={{ width: 150 }}
            type="date"
            value={draft.to}
          />
          <Button type="primary" onClick={applyFilters}>
            查询
          </Button>
          <Button onClick={resetFilters}>重置</Button>
        </Flex>

        {failed ? (
          <LoadFailure message="学生列表加载失败，请稍后重试" onRetry={retry} />
        ) : (
          <AdminTable<StudentRecordView>
            columns={columns}
            dataSource={filtered}
            loading={loading}
            locale={{ emptyText: emptyState }}
            pagination={{
              current: currentPage,
              pageSize: PAGE_SIZE,
              total: filtered.length,
              showTotal: (total) => `共 ${total} 条`,
              onChange: setPage,
            }}
            rowKey="id"
            scroll={{ x: 1220 }}
          />
        )}
      </Flex>

      <StudentDetailDrawer
        onChanged={handleChanged}
        onClose={() => setDetailId(null)}
        onRefresh={retry}
        open={detailId !== null}
        studentId={detailId}
      />
    </ModulePage>
  );
}
