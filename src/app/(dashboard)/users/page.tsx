import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { UsersClient } from "@/modules/user-management/components/users-client";

export const metadata = { title: "User Management · CoalTrade OS" };

export default async function UsersPage() {
  const session = await getServerSession(authOptions);
  if (!session || !["CEO","DIRUT"].includes(session.user.role)) {
    redirect("/");
  }

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="page__header">
        <h1 className="page__title text-2xl font-semibold">
          User Management <span className="text-muted-foreground font-normal text-base">— Roles & Access</span>
        </h1>
      </div>
      <UsersClient currentUserId={session.user.id} />
    </div>
  );
}
