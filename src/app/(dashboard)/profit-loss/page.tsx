import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions, isExecutive } from "@/lib/auth";
import { PLClient } from "@/modules/profit-loss/components/pl-client";

export const metadata = { title: "Profit & Loss · CoalTrade OS" };

export default async function ProfitLossPage() {
  const session = await getServerSession(authOptions);
  if (!session || !isExecutive(session.user.role)) {
    redirect("/");
  }

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="page__header">
        <h1 className="page__title text-2xl font-semibold">
          Profit & Loss <span className="text-muted-foreground font-normal text-base">— Financial Summary</span>
        </h1>
      </div>
      <PLClient />
    </div>
  );
}
