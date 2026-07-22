import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { LoginForm } from "@/modules/auth/components/login-form";

export const metadata = { title: "Sign in · CoalTrade OS" };

export default async function LoginPage() {
  // Already logged in → go to dashboard
  const session = await getServerSession(authOptions);
  if (session) redirect("/");

  return (
    <main className="auth">
      <section className="auth__panel">
        <div className="auth__form">
          <div>
            <h1 className="text-2xl font-semibold">Welcome back</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Sign in to your CoalTrade OS account.
            </p>
          </div>
          <LoginForm />
        </div>
      </section>

      <aside className="auth__aside">
        <div className="auth__brand">
          {/* CoalTrade OS brand mark */}
          <span className="auth__brand-mark">
            <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2L4 6v6c0 5.5 3.8 10.7 8 12 4.2-1.3 8-6.5 8-12V6z" opacity=".45" />
              <path d="M12 2l4 2.3V12c0 2.8-1.6 5.5-4 7V2z" />
            </svg>
          </span>
          <span>
            <span className="auth__brand-name">CoalTrade OS</span>
          </span>
        </div>
        <div className="auth__pitch">
          <h2 className="auth__pitch-title">
            Run your <span>coal trade, calmly.</span>
          </h2>
          <p className="auth__pitch-lede">
            Shipments, forecasts, quality, payments — the full trading cycle observed from one
            integrated operating system.
          </p>
        </div>
      </aside>
    </main>
  );
}
