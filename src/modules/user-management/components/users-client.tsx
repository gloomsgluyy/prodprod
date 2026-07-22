"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api-client";

interface UserItem {
  id: string; name: string; email: string; role: string; createdAt: string;
}

const ALL_ROLES = [
  "CEO","DIRUT","ASS_DIRUT","COO","CMO","CPPO",
  "TRADERS_1","TRADERS_2","TRADERS_3","TRADERS_4","JUNIOR_TRADER",
  "ADMIN_MARKETING","TRAFFIC_HEAD","TRAFFIC_1","TRAFFIC_2","TRAFFIC_3","TRAFFIC_4",
  "ADMIN_OPERATION","SPV_SOURCING","SOURCING_1","SOURCING_2","SOURCING_3","SOURCING_4",
  "QQ_MANAGER","QC_MANAGER","QC_ADMIN_1","QC_ADMIN_2","FINANCE","STAFF",
] as const;

const EXECUTIVE_ROLES = ["CEO","DIRUT","ASS_DIRUT","COO"];

const ROLE_BADGE: Record<string, string> = {
  CEO:      "badge--danger",
  DIRUT:    "badge--danger",
  ASS_DIRUT:"badge--danger",
  COO:      "badge--warning",
  CMO:      "badge--warning",
  FINANCE:  "badge--info",
  STAFF:    "badge--neutral",
};

function getBadge(role: string) {
  if (EXECUTIVE_ROLES.includes(role)) return "badge--danger";
  return ROLE_BADGE[role] ?? "badge--neutral";
}

// ── Create user form ──────────────────────────────────────────────────────────
const createSchema = z.object({
  name:     z.string().min(1, "Required"),
  email:    z.string().email("Valid email required"),
  password: z.string().min(8, "Minimum 8 characters"),
  role:     z.enum(ALL_ROLES).default("STAFF"),
});
type CreateForm = z.infer<typeof createSchema>;

function CreateUserForm({ onSuccess }: { onSuccess: () => void }) {
  const qc = useQueryClient();
  const { mutate, isPending, error } = useMutation({
    mutationFn: (data: CreateForm) => api.post<{ data: UserItem }>("/api/users", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); onSuccess(); },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { role: "STAFF" },
  });

  function onSubmit(d: CreateForm) {
    mutate(d, { onSuccess: () => reset() });
  }

  return (
    <div className="card">
      <div className="card__body gap-4">
        <p className="font-medium text-sm">Add New User</p>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="field">
            <label className="field__label text-xs" htmlFor="usr-name">Name *</label>
            <input id="usr-name" type="text" className={`input ${errors.name?"input--invalid":""}`}
              placeholder="Full name" {...register("name")} />
            {errors.name && <p className="text-xs text-danger mt-0.5">{errors.name.message}</p>}
          </div>
          <div className="field">
            <label className="field__label text-xs" htmlFor="usr-email">Email *</label>
            <input id="usr-email" type="email" className={`input ${errors.email?"input--invalid":""}`}
              placeholder="user@company.com" {...register("email")} />
            {errors.email && <p className="text-xs text-danger mt-0.5">{errors.email.message}</p>}
          </div>
          <div className="field">
            <label className="field__label text-xs" htmlFor="usr-pass">Password *</label>
            <input id="usr-pass" type="password" className={`input ${errors.password?"input--invalid":""}`}
              placeholder="min 8 chars" {...register("password")} />
            {errors.password && <p className="text-xs text-danger mt-0.5">{errors.password.message}</p>}
          </div>
          <div className="field">
            <label className="field__label text-xs" htmlFor="usr-role">Role</label>
            <select id="usr-role" className="select" {...register("role")}>
              {ALL_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="col-span-2 sm:col-span-4 flex items-center gap-3">
            <button type="submit" className="button button--primary" disabled={isPending} aria-busy={isPending}>
              {isPending ? <><span className="spinner spinner--sm" aria-hidden="true" /> Creating…</> : "Create User"}
            </button>
            {error && (
              <p className="text-sm text-danger" role="alert">
                {(error as Error).message}
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Inline role dropdown ──────────────────────────────────────────────────────
function RoleDropdown({ user, currentUserId }: { user: UserItem; currentUserId: string }) {
  const qc = useQueryClient();
  const [localRole, setLocalRole] = useState(user.role);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const isSelf = user.id === currentUserId;

  async function handleChange(newRole: string) {
    if (newRole === localRole) return;
    setError(null);
    setSaving(true);
    try {
      await api.patch(`/api/users/${user.id}/role`, { role: newRole });
      setLocalRole(newRole);
      qc.invalidateQueries({ queryKey: ["users"] });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (isSelf) {
    return <span className={`badge badge--sm ${getBadge(localRole)}`}>{localRole}</span>;
  }

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1.5">
        <select
          className="select select--sm"
          value={localRole}
          disabled={saving}
          onChange={(e) => handleChange(e.target.value)}
          aria-label={`Role for ${user.name}`}
        >
          {ALL_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        {saving && <span className="spinner spinner--sm" aria-label="Saving…" />}
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

// ── Main client ───────────────────────────────────────────────────────────────
export function UsersClient({ currentUserId }: { currentUserId: string }) {
  const [search, setSearch]       = useState("");
  const [page, setPage]           = useState(1);
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["users", search, page],
    queryFn: () => api.get<{ data: UserItem[]; meta: { total: number; page: number; totalPages: number } }>(
      `/api/users?page=${page}&search=${encodeURIComponent(search)}`
    ),
    placeholderData: (prev) => prev,
  });

  const items = data?.data ?? [];
  const meta  = data?.meta;

  return (
    <div className="flex flex-col gap-6">
      {/* Header actions */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="input-group flex-1 min-w-48">
          <span className="input-group__text">
            <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true">
              <g fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11.5" cy="11.5" r="9.5"/><path strokeLinecap="round" d="M18.5 18.5L22 22"/></g>
            </svg>
          </span>
          <input type="search" className="input" placeholder="Search name, email…"
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            aria-label="Search users" />
        </div>
        <button type="button"
          className={`button ${showCreate ? "button--ghost button--neutral" : "button--primary"}`}
          onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? "Cancel" : "+ Add User"}
        </button>
      </div>

      {/* Create user form */}
      {showCreate && <CreateUserForm onSuccess={() => setShowCreate(false)} />}

      {/* Notice */}
      <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800 text-sm text-amber-700 dark:text-amber-400">
        ⚠️ Role changes take effect after the user logs out and logs back in.
      </div>

      {/* Table */}
      <div className="card">
        <div className="card__body gap-3">
          {isLoading ? (
            <div className="space-y-2 animate-pulse">
              {Array.from({length:8}).map((_,i) => <div key={i} className="h-10 bg-muted rounded" />)}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="table table--striped text-sm" aria-label="Users table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Current Role</th>
                      <th>Change Role</th>
                      <th>Member Since</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center text-muted-foreground py-8">No users found</td>
                      </tr>
                    ) : (
                      items.map((user) => (
                        <tr key={user.id}>
                          <td>
                            <div className="flex items-center gap-2">
                              <span className="h-7 w-7 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-semibold flex-shrink-0">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                              <span className="font-medium">
                                {user.name}
                                {user.id === currentUserId && (
                                  <span className="badge badge--neutral badge--xs ml-1">You</span>
                                )}
                              </span>
                            </div>
                          </td>
                          <td className="text-muted-foreground">{user.email}</td>
                          <td>
                            <span className={`badge badge--sm ${getBadge(user.role)}`}>
                              {user.role}
                            </span>
                          </td>
                          <td>
                            <RoleDropdown user={user} currentUserId={currentUserId} />
                          </td>
                          <td className="text-xs text-muted-foreground">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {meta && meta.totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-muted-foreground">
                    {meta.total} users · Page {meta.page} of {meta.totalPages}
                  </p>
                  <div className="flex gap-1">
                    <button type="button"
                      className="button button--sm button--ghost button--neutral"
                      disabled={meta.page <= 1}
                      onClick={() => setPage(p => p - 1)}>←</button>
                    <button type="button"
                      className="button button--sm button--ghost button--neutral"
                      disabled={meta.page >= meta.totalPages}
                      onClick={() => setPage(p => p + 1)}>→</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
