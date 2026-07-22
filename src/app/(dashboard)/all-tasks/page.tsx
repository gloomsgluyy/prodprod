import { Suspense } from "react";
import { TasksClient } from "@/modules/tasks/components/tasks-client";

export const metadata = { title: "All Tasks · CoalTrade OS" };

export default function AllTasksPage() {
  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="page__header">
        <h1 className="page__title text-2xl font-semibold">
          All Tasks <span className="text-muted-foreground font-normal text-base">— Kanban Board</span>
        </h1>
      </div>
      <Suspense fallback={<div className="h-64 animate-pulse bg-muted rounded-lg" />}>
        <TasksClient mine={false} />
      </Suspense>
    </div>
  );
}
