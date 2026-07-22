import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { AuditLogsClient } from "@/modules/audit-logs/components/audit-logs-client";

export const metadata = { title: "Audit Logs · CoalTrade OS" };

export default async function AuditLogsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !["CEO","DIRUT","ASS_DIRUT"].includes(session.user.role)) {
    redirect("/");
  }
  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="page__header">
        <h1 className="page__title text-2xl font-semibold">
          Audit Logs <span className="text-muted-foreground font-normal text-base">— Activity Trail</span>
        </h1>
      </div>
      <AuditLogsClient />
    </div>
  );
}
