import { PlusOutlined } from "@ant-design/icons";
import { Button, Tabs } from "antd";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { ApiError } from "@/api/client";
import {
  isParticipationStatus,
  listTaskParticipations,
  listTasks,
  stopTask,
  type AdminParticipationView,
  type AdminTaskView,
} from "@/api/tasks";
import ModulePage from "@/components/common/ModulePage";
import { notifyError } from "@/lib/api-feedback";
import { emitToast } from "@/lib/toast-events";
import TaskConfigPanel from "./TaskConfigPanel";
import TaskFormDrawer, { type TaskFormMode } from "./TaskFormDrawer";
import TaskReviewDrawer from "./TaskReviewDrawer";
import TaskReviewPanel, {
  DEFAULT_REVIEW_FILTERS,
  type TaskReviewFilters,
} from "./TaskReviewPanel";

type FormState = {
  open: boolean;
  mode: TaskFormMode;
  task: AdminTaskView | null;
};

function parseReviewStatus(value: string | null) {
  if (value === "all" || isParticipationStatus(value)) {
    return value;
  }

  return "PENDING_REVIEW";
}

function parseTaskId(value: string | null): number | "all" {
  const id = Number(value);

  return Number.isInteger(id) && id > 0 ? id : "all";
}

function initialReviewFilters(
  searchParams: URLSearchParams,
): TaskReviewFilters {
  return {
    ...DEFAULT_REVIEW_FILTERS,
    taskId: parseTaskId(searchParams.get("taskId")),
    status: parseReviewStatus(searchParams.get("status")),
  };
}

/** 环保任务：任务配置与凭证审核两个 tab，URL 保留审核筛选。 */
export default function TasksPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") === "review" ? "review" : "config";
  const [tasks, setTasks] = useState<AdminTaskView[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksFailed, setTasksFailed] = useState(false);
  const [participations, setParticipations] = useState<
    AdminParticipationView[]
  >([]);
  const [participationsLoading, setParticipationsLoading] = useState(true);
  const [participationsFailed, setParticipationsFailed] = useState(false);
  const [formState, setFormState] = useState<FormState>({
    open: false,
    mode: "create",
    task: null,
  });
  const [reviewId, setReviewId] = useState<number | null>(null);
  const [reviewDraft, setReviewDraft] = useState<TaskReviewFilters>(() =>
    initialReviewFilters(searchParams),
  );
  const [reviewFilters, setReviewFilters] = useState<TaskReviewFilters>(() =>
    initialReviewFilters(searchParams),
  );
  const [reviewPage, setReviewPage] = useState(1);

  const loadTasks = useCallback(async () => {
    setTasksLoading(true);
    setTasksFailed(false);

    try {
      setTasks(await listTasks());
    } catch {
      setTasksFailed(true);
    } finally {
      setTasksLoading(false);
    }
  }, []);

  const loadParticipations = useCallback(async () => {
    setParticipationsLoading(true);
    setParticipationsFailed(false);

    try {
      setParticipations(await listTaskParticipations());
    } catch {
      setParticipationsFailed(true);
    } finally {
      setParticipationsLoading(false);
    }
  }, []);

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- 页面首次加载任务和参与记录
    void loadTasks();
    // oxlint-disable-next-line react/set-state-in-effect -- 页面首次加载任务和参与记录
    void loadParticipations();
  }, [loadTasks, loadParticipations]);

  const refreshAll = useCallback(() => {
    void Promise.all([loadTasks(), loadParticipations()]);
  }, [loadTasks, loadParticipations]);

  const writeReviewUrl = useCallback(
    (filters: TaskReviewFilters) => {
      const next = new URLSearchParams();
      next.set("tab", "review");

      if (filters.status !== "all") {
        next.set("status", filters.status);
      }

      if (filters.taskId !== "all") {
        next.set("taskId", String(filters.taskId));
      }

      setSearchParams(next, { replace: true });
    },
    [setSearchParams],
  );

  const handleTabChange = (key: string) => {
    if (key === "review") {
      const next = new URLSearchParams(searchParams);
      next.set("tab", "review");
      setSearchParams(next, { replace: true });
      return;
    }

    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const openCreate = () => {
    setFormState({ open: true, mode: "create", task: null });
  };

  const openEdit = (task: AdminTaskView) => {
    setFormState({
      open: true,
      mode: task.status === "STOPPED" ? "view" : "edit",
      task,
    });
  };

  const openCopy = (task: AdminTaskView) => {
    setFormState({ open: true, mode: "copy", task });
  };

  const handleStop = async (task: AdminTaskView) => {
    try {
      await stopTask(task.id);
      emitToast("success", "任务已停用");
      refreshAll();
    } catch (error) {
      if (error instanceof ApiError && error.code === "TASK_STATUS_INVALID") {
        emitToast("error", "任务状态已变化，已刷新最新状态");
        refreshAll();
        return;
      }

      notifyError(error, "停用失败，请稍后重试");
    }
  };

  const openParticipations = (task: AdminTaskView) => {
    const filters: TaskReviewFilters = {
      ...DEFAULT_REVIEW_FILTERS,
      taskId: task.id,
      status: "all",
    };

    setReviewDraft(filters);
    setReviewFilters(filters);
    setReviewPage(1);
    writeReviewUrl(filters);
  };

  const applyReviewFilters = () => {
    setReviewFilters(reviewDraft);
    setReviewPage(1);
    writeReviewUrl(reviewDraft);
  };

  const resetReviewFilters = () => {
    setReviewDraft(DEFAULT_REVIEW_FILTERS);
    setReviewFilters(DEFAULT_REVIEW_FILTERS);
    setReviewPage(1);
    writeReviewUrl(DEFAULT_REVIEW_FILTERS);
  };

  const tabs = [
    {
      key: "config",
      label: "任务配置",
      children: (
        <TaskConfigPanel
          failed={tasksFailed}
          loading={tasksLoading}
          onCopy={openCopy}
          onCreate={openCreate}
          onEdit={openEdit}
          onRetry={() => {
            void loadTasks();
          }}
          onStop={(task) => {
            void handleStop(task);
          }}
          onViewParticipations={openParticipations}
          tasks={tasks}
        />
      ),
    },
    {
      key: "review",
      label: "凭证审核",
      children: (
        <TaskReviewPanel
          appliedFilters={reviewFilters}
          failed={participationsFailed}
          filters={reviewDraft}
          loading={participationsLoading}
          onChangeFilters={setReviewDraft}
          onOpen={setReviewId}
          onPageChange={setReviewPage}
          onReset={resetReviewFilters}
          onRetry={() => {
            void loadParticipations();
          }}
          onSearch={applyReviewFilters}
          page={reviewPage}
          participations={participations}
          tasks={tasks}
        />
      ),
    },
  ];

  return (
    <ModulePage
      extra={
        activeTab === "config" ? (
          <Button icon={<PlusOutlined />} type="primary" onClick={openCreate}>
            新建任务
          </Button>
        ) : null
      }
      title="环保任务"
    >
      <Tabs activeKey={activeTab} items={tabs} onChange={handleTabChange} />

      <TaskFormDrawer
        mode={formState.mode}
        onClose={() => setFormState((current) => ({ ...current, open: false }))}
        onSaved={() => {
          setSearchParams(new URLSearchParams(), { replace: true });
          refreshAll();
        }}
        open={formState.open}
        task={formState.task}
      />

      {reviewId !== null && (
        <TaskReviewDrawer
          onChanged={refreshAll}
          onClose={() => setReviewId(null)}
          participationId={reviewId}
        />
      )}
    </ModulePage>
  );
}
