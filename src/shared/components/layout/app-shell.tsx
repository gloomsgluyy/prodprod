"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useRef } from "react";
import { useAuthStore } from "@/modules/auth/store/auth-store";
import { GlobalMarketScraper } from "@/shared/components/global-market-scraper";

// ── Nav items ─────────────────────────────────────────────────────────────────
const ROLE_PERMISSIONS = {
  ceo: [
    "dashboard", "approval_inbox", "my_tasks", "all_tasks",
    "sales_orders", "purchase_requests", "profit_loss",
    "manage_roles", "audit_logs", "approve_tasks",
    "approve_sales", "approve_purchases", "move_any_task",
    "move_to_done", "chatbot", "view_restricted_finance",
    "sales_monitor", "shipment_monitor", "source_management",
    "quality", "blending_simulation", "market_price", "market_price_edit",
    "meetings", "transshipment", "document_drive", "outstanding_payment",
    "operations", "compliance", "ai_optimization",
  ],
  marketing: [
    "my_tasks", "all_tasks",
    "sales_orders", "purchase_requests", "chatbot",
    "sales_monitor", "shipment_monitor", "source_management",
    "quality", "blending_simulation", "market_price",
    "meetings", "transshipment", "document_drive", "move_any_task",
    "operations", "ai_optimization",
  ],
  purchasing: [
    "my_tasks", "all_tasks",
    "purchase_requests", "profit_loss", "chatbot",
    "source_management", "quality", "market_price",
    "meetings", "document_drive", "approve_purchases",
    "compliance",
  ],
  operation: [
    "my_tasks", "all_tasks",
    "sales_orders", "chatbot",
    "shipment_monitor", "source_management",
    "quality", "meetings", "transshipment",
    "document_drive", "move_any_task", "operations", "ai_optimization",
  ],
  staff: [
    "document_drive",
  ],
};

function hasPermission(userRole: string | null | undefined, permission: string): boolean {
  if (!userRole) return false;
  const role = userRole.toUpperCase();
  let roleKey = "staff";
  if (["CEO", "DIRUT", "ASS_DIRUT", "COO"].includes(role)) roleKey = "ceo";
  else if (role.startsWith("TRADERS_") || role === "CMO" || role === "ADMIN_MARKETING" || role === "JUNIOR_TRADER") roleKey = "marketing";
  else if (role.startsWith("SOURCING_") || role === "SPV_SOURCING" || role === "CPPO") roleKey = "purchasing";
  else if (role.startsWith("TRAFFIC_") || role.startsWith("QC_") || role === "QQ_MANAGER" || role === "ADMIN_OPERATION") roleKey = "operation";
  else if (role === "FINANCE") roleKey = "purchasing";
  else if (role === "STAFF") roleKey = "staff";

  const permissions = ROLE_PERMISSIONS[roleKey as keyof typeof ROLE_PERMISSIONS];
  return permissions?.includes(permission) ?? false;
}

const NAV_GROUPS = [
  {
    title: "Command Center",
    items: [
      { label: "Dashboard", href: "/", icon: IconDashboard, permission: "dashboard" },
    ],
  },
  {
    title: "Commercial",
    items: [
      { label: "Market Price", href: "/market-price", icon: IconMarket, permission: "market_price" },
      { label: "Forecast Sales", href: "/forecast-sales", icon: IconForecast, permission: "sales_monitor" },
      { label: "Sales Monitor", href: "/sales-monitor", icon: IconSales, permission: "sales_monitor" },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Shipment Monitor", href: "/shipment-monitor", icon: IconShipment, permission: "shipment_monitor" },
      { label: "Sources & Supplier", href: "/sources", icon: IconSources, permission: "source_management" },
      { label: "Quality Control", href: "/quality", icon: IconQuality, permission: "quality" },
      { label: "Blending Simulator", href: "/blending", icon: IconBlending, permission: "blending_simulation" },
      { label: "Transshipment", href: "/transshipment", icon: IconTransshipment, permission: "transshipment" },
      { label: "Operations", href: "/operations", icon: IconShipment, permission: "operations" },
    ],
  },
  {
    title: "Finance",
    items: [
      { label: "Outstanding Payment", href: "/outstanding-payment", icon: IconPayment, permission: "outstanding_payment" },
      { label: "Profit & Loss", href: "/profit-loss", icon: IconPL, permission: "profit_loss" },
      { label: "Expenses", href: "/purchase-requests", icon: IconExpenses, permission: "purchase_requests" },
      { label: "Compliance", href: "/compliance", icon: IconDocs, permission: "compliance" },
    ],
  },
  {
    title: "Documents",
    items: [
      { label: "Document Drive", href: "/document-drive", icon: IconDocs, permission: "document_drive" },
      { label: "Directory", href: "/directory", icon: IconDirectory, permission: "source_management" },
    ],
  },
  {
    title: "Collaboration",
    items: [
      { label: "Meetings", href: "/meetings", icon: IconMeetings, permission: "meetings" },
      { label: "Tasks", href: "/all-tasks", icon: IconTasks, permission: "my_tasks" },
      { label: "AI Agent", href: "/ai-agent", icon: IconAI, permission: "chatbot" },
      { label: "AI Optimization", href: "/ai-optimization", icon: IconAI, permission: "ai_optimization" },
    ],
  },
  {
    title: "Approvals",
    items: [
      { label: "Approval Center", href: "/approval-center", icon: IconApproval, permission: "approval_inbox" },
    ],
  },
  {
    title: "Administration",
    items: [
      { label: "Production Readiness", href: "/production-readiness", icon: IconProductionReadiness, permission: "audit_logs" },
      { label: "Users", href: "/users", icon: IconUsers, permission: "manage_roles" },
      { label: "Audit Logs", href: "/audit-logs", icon: IconAudit, permission: "audit_logs" },
    ],
  },
] as const;

// ── AppShell ──────────────────────────────────────────────────────────────────
export function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const setRole = useAuthStore((s) => s.setRole);
  const shellRef = useRef<HTMLDivElement>(null);

  // Sync role into UI store once session is available
  useEffect(() => {
    if (session?.user?.role) setRole(session.user.role);
  }, [session?.user?.role, setRole]);

  if (pathname === "/document-drive" && status !== "authenticated") {
    return <PublicDocumentShell>{children}</PublicDocumentShell>;
  }

  function toggleSidebar() {
    if (window.innerWidth < 1024) {
      shellRef.current?.classList.toggle("is-sidebar-visible");
    } else {
      shellRef.current?.classList.toggle("is-sidebar-collapsed");
    }
  }

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) {
      shellRef.current?.classList.remove("is-sidebar-visible");
    }
  }

  return (
    <div className="app-shell" ref={shellRef} onClick={handleBackdropClick}>
      <GlobalMarketScraper />
      <Sidebar />
      <main className="app-shell__main">
        <Navbar onToggleSidebar={toggleSidebar} userName={session?.user?.name} />
        <div className="flex-1 p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
}

function PublicDocumentShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-background">
      <header className="navbar flex items-center bg-background/80 backdrop-blur-md border-b border-border/40 px-4 lg:px-6">
        <Link className="font-semibold" href="/document-drive">CoalTrade OS Document Drive</Link>
        <Link className="button button--sm button--ghost button--neutral ms-auto" href="/login">Login</Link>
      </header>
      <div className="p-4 lg:p-6">{children}</div>
    </main>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar() {
  const pathname = usePathname();
  const role = useAuthStore((s) => s.role);

  return (
    <aside className="sidebar sidebar--lg sidebar--app" data-stisla-sidebar>
      <header className="sidebar__header">
        <Link className="sidebar__brand" href="/">
          {/* CoalTrade OS brand mark */}
          <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2L4 6v6c0 5.5 3.8 10.7 8 12 4.2-1.3 8-6.5 8-12V6z" opacity=".45" />
            <path d="M12 2l4 2.3V12c0 2.8-1.6 5.5-4 7V2z" />
          </svg>
          <span>CoalTrade OS</span>
        </Link>
      </header>

      <div className="sidebar__content">
        <nav className="sidebar__menu">
          {NAV_GROUPS.map((group) => {
            const visibleItems = group.items.filter((item) => hasPermission(role, item.permission));
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.title} className="sidebar__group">
                <span className="sidebar__group-title">{group.title}</span>
                <ul className="sidebar__list">
                  {visibleItems.map((item) => {
                    const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                    return (
                      <li key={item.href} className="sidebar__item">
                        <Link
                          className="sidebar__button"
                          href={item.href}
                          aria-current={active ? "page" : undefined}
                        >
                          <item.icon />
                          <span>{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>
      </div>

      <footer className="sidebar__footer">
        <ul className="sidebar__list">
          <li className="sidebar__item">
            <button
              type="button"
              className="sidebar__button w-full"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <IconLogout />
              <span>Log out</span>
            </button>
          </li>
        </ul>
      </footer>
    </aside>
  );
}

// ── Navbar ────────────────────────────────────────────────────────────────────
function Navbar({ onToggleSidebar, userName }: { onToggleSidebar: () => void; userName?: string | null }) {
  function toggleTheme() {
    const html = document.documentElement;
    const next = html.dataset.theme === "dark" ? "light" : "dark";
    html.dataset.theme = next;
    localStorage.setItem("stisla-theme", next);
  }

  const initials = userName
    ?.split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() ?? "U";

  return (
    <header className="navbar flex items-center bg-background/70 backdrop-blur-md border-b border-border/40">
      <button
        type="button"
        className="button button--ghost button--neutral button--icon-only button--flush-start"
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar"
      >
        <IconMenu />
      </button>

      <div className="input-group input-group--search hidden lg:flex flex-1 max-w-md mx-4">
        <span className="input-group__text"><IconSearch /></span>
        <input type="search" className="input" placeholder="Search shipments, forecasts…" aria-label="Search" />
      </div>

      <div className="ms-auto flex gap-1 items-center">
        <button
          type="button"
          className="button button--ghost button--neutral button--icon-only"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          <IconMoon />
        </button>

        <div className="avatar" aria-label={userName ?? "User"}>
          <span>{initials}</span>
        </div>
      </div>
    </header>
  );
}

// ── Icons (Solar icon set — inline SVG) ──────────────────────────────────────
function IconDashboard() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M2 6.5c0-2.121 0-3.182.659-3.841S4.379 2 6.5 2s3.182 0 3.841.659S11 4.379 11 6.5s0 3.182-.659 3.841S8.621 11 6.5 11s-3.182 0-3.841-.659S2 8.621 2 6.5m11 11c0-2.121 0-3.182.659-3.841S15.379 13 17.5 13s3.182 0 3.841.659S22 15.379 22 17.5s0 3.182-.659 3.841S19.621 22 17.5 22s-3.182 0-3.841-.659S13 19.621 13 17.5" opacity=".5" />
      <path fill="currentColor" d="M2 17.5c0-2.121 0-3.182.659-3.841S4.379 13 6.5 13s3.182 0 3.841.659S11 15.379 11 17.5s0 3.182-.659 3.841S8.621 22 6.5 22s-3.182 0-3.841-.659S2 19.621 2 17.5m11-11c0-2.121 0-3.182.659-3.841S15.379 2 17.5 2s3.182 0 3.841.659S22 4.379 22 6.5s0 3.182-.659 3.841S19.621 11 17.5 11s-3.182 0-3.841-.659S13 8.621 13 6.5" />
    </svg>
  );
}
function IconMarket() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M3 3h18v3H3zm0 5h18v3H3zm0 5h18v3H3zm0 5h18v3H3z" opacity=".4" />
      <path fill="currentColor" d="M7 5h2v2H7zm0 5h2v2H7zm0 5h2v2H7zm0 5h2v2H7z" />
    </svg>
  );
}
function IconForecast() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M3 13a9 9 0 1 1 18 0" opacity=".5" />
      <path fill="currentColor" d="M3 13h4a5 5 0 0 1 5-5v4l5-5-5-5v3a9 9 0 0 0-9 9z" />
    </svg>
  );
}
function IconSales() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M3 3h18v14H3z" opacity=".4" />
      <path fill="currentColor" d="M7 7h2v6H7zm4-2h2v8h-2zm4 4h2v4h-2z" />
      <path fill="currentColor" d="M3 19h18v2H3z" />
    </svg>
  );
}
function IconShipment() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true">
      {/* TODO: ganti dengan custom illustration Kapal Kargo */}
      <path fill="currentColor" d="M20 21c-1.5 0-2.5-.5-3-1s-1.5-1-3-1-2.5.5-3 1-1.5 1-3 1-2.5-.5-3-1" opacity=".5" />
      <path fill="currentColor" d="M3 16l1.5-5H12V5H8V3h8v2h-4v6h7.5L21 16zm6 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm6 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z" />
    </svg>
  );
}
function IconSources() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true">
      {/* TODO: ganti dengan custom illustration Tumpukan Batubara */}
      <path fill="currentColor" d="M12 2L2 7l10 5 10-5z" opacity=".5" />
      <path fill="currentColor" d="M2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  );
}
function IconQuality() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M9 2h6l1 4H8z" opacity=".5" />
      <path fill="currentColor" d="M8 6h8l2 14H6zm3 4v7h2v-7zm-2 0v7h1v-7zm6 0v7h-1v-7z" />
    </svg>
  );
}
function IconBlending() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true">
      {/* TODO: ganti dengan custom illustration Blending */}
      <path fill="currentColor" d="M7 2h10l2 20H5z" opacity=".4" />
      <path fill="currentColor" d="M9 8h6l1 8H8z" />
    </svg>
  );
}
function IconTransshipment() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true">
      {/* TODO: ganti dengan custom illustration Dermaga */}
      <path fill="currentColor" d="M3 18h18v2H3zm1-2l3-8h12l3 8z" opacity=".5" />
      <path fill="currentColor" d="M12 4a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 2v6" />
    </svg>
  );
}
function IconPayment() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M2 8h20v3H2z" opacity=".5" />
      <path fill="currentColor" d="M2 6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2zm2 7h4v2H4zm6 0h4v2h-4z" />
    </svg>
  );
}
function IconPL() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M3 17l4-8 4 5 4-3 3 6z" opacity=".5" />
      <path fill="currentColor" d="M3 21h18v-2H3zm0-4l4-8 4 5 4-3 3 6z" />
    </svg>
  );
}
function IconExpenses() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" opacity=".4" />
      <path fill="currentColor" d="M8 7h8v2H8zm0 4h8v2H8zm0 4h5v2H8z" />
    </svg>
  );
}
function IconDocs() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true">
      {/* TODO: ganti dengan custom illustration Bundle Dokumen Ekspor */}
      <path fill="currentColor" d="M4 4a2 2 0 0 1 2-2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" opacity=".4" />
      <path fill="currentColor" d="M14 2v6h6M8 13h8v2H8zm0-4h4v2H8z" />
    </svg>
  );
}
function IconDirectory() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3z" opacity=".5" />
      <path fill="currentColor" d="M8 13c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4zm8 0c-.33 0-.71.02-1.12.05C16.19 13.89 17 15.02 17 16.2V19h7v-2c0-2.66-5.33-4-8-4z" />
    </svg>
  );
}
function IconMeetings() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" opacity=".4" />
      <path fill="currentColor" d="M3 10h18M8 2v4m8-4v4" />
    </svg>
  );
}
function IconTasks() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" opacity=".4" />
      <path fill="currentColor" d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2zm-1 7 2 2 4-4" />
    </svg>
  );
}
function IconAI() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z" opacity=".4" />
      <path fill="currentColor" d="M8 10h8v2H8zm2 4h4v2h-4z" />
    </svg>
  );
}
function IconProductionReadiness() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z" opacity=".4" />
      <path fill="currentColor" d="m7 13 3 3 7-7-1.4-1.4L10 13.2l-1.6-1.6z" />
    </svg>
  );
}
function IconUsers() {  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="15" cy="6" r="3" fill="currentColor" opacity=".4" />
      <ellipse cx="16" cy="17" fill="currentColor" opacity=".4" rx="5" ry="3" />
      <circle cx="9" cy="6" r="4" fill="currentColor" />
      <ellipse cx="9" cy="17" fill="currentColor" rx="7" ry="4" />
    </svg>
  );
}
function IconApproval() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" opacity=".4"/>
      <path fill="currentColor" d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2zm-1 8 2 2 4-4"/>
    </svg>
  );
}
function IconAudit() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M3 4a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" opacity=".5" />
      <path fill="currentColor" d="M3 10h18v2H3zm0 4h18v2H3zm0 4h11v2H3z" />
    </svg>
  );
}
function IconLogout() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M16 2h-1c-2.829 0-4.243 0-5.121.879S9 5.172 9 8v8c0 2.829 0 4.243.879 5.122C10.757 22 12.172 22 15 22h1c2.828 0 4.243 0 5.121-.879C22 20.243 22 18.828 22 16V8c0-2.828 0-4.243-.879-5.121S18.828 2 16 2" opacity=".5" />
      <path fill="currentColor" fillRule="evenodd" d="M15.75 12a.75.75 0 0 0-.75-.75H4.027l1.961-1.68a.75.75 0 1 0-.976-1.14l-3.5 3a.75.75 0 0 0 0 1.14l3.5 3a.75.75 0 1 0 .976-1.14l-1.96-1.68H15a.75.75 0 0 0 .75-.75" clipRule="evenodd" />
    </svg>
  );
}
function IconMenu() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" d="M20 7H4m16 5H4m16 5H4" />
    </svg>
  );
}
function IconSearch() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="11.5" cy="11.5" r="9.5" />
        <path strokeLinecap="round" d="M18.5 18.5L22 22" />
      </g>
    </svg>
  );
}
function IconMoon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M21.25 12A9.25 9.25 0 0 1 12 21.25v1.5c5.937 0 10.75-4.813 10.75-10.75zM12 21.25A9.25 9.25 0 0 1 2.75 12h-1.5c0 5.937 4.813 10.75 10.75 10.75zM2.75 12A9.25 9.25 0 0 1 12 2.75v-1.5C6.063 1.25 1.25 6.063 1.25 12zm12.75 2.25A5.75 5.75 0 0 1 9.75 8.5h-1.5a7.25 7.25 0 0 0 7.25 7.25zm4.925-2.781A5.75 5.75 0 0 1 15.5 14.25v1.5a7.25 7.25 0 0 0 6.21-3.505zM9.75 8.5a5.75 5.75 0 0 1 2.781-4.925l-.776-1.284A7.25 7.25 0 0 0 8.25 8.5z" />
    </svg>
  );
}
