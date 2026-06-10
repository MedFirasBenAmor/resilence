"use client";
import { StatusBadge } from "@/components/ui/status-badge";
import { taskStatusLabels, taskStatusTones } from "@/lib/ui/status-labels";

type TaskStatusValue = "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED";

type ProjectTaskStatusBadgeProps = {
  status: TaskStatusValue;
};

export function ProjectTaskStatusBadge({
  status,
}: ProjectTaskStatusBadgeProps) {
  return <StatusBadge label={taskStatusLabels[status]} tone={taskStatusTones[status]} />;
}
