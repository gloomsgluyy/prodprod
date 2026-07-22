import { Suspense } from "react";
import { ExpenseClient } from "@/modules/expenses/components/expense-client";

export const metadata = { title: "Expenses · CoalTrade OS" };

export default function ExpensesPage() {
  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="page__header">
        <h1 className="page__title text-2xl font-semibold">
          Expenses <span className="text-muted-foreground font-normal text-base">— Purchase Requests</span>
        </h1>
      </div>
      <Suspense fallback={<div className="h-64 animate-pulse bg-muted rounded-lg" />}>
        <ExpenseClient />
      </Suspense>
    </div>
  );
}
