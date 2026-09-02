export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED = ["CEO","DIRUT","ASS_DIRUT","ADMIN_OPERATION","STAFF"];

export interface HealthCheckResult {
  id:          string;
  label:       string;
  description: string;
  status:      "pass" | "warn" | "fail";
  detail:      string;
  checkedAt:   string;
}

async function runChecks(): Promise<HealthCheckResult[]> {
  const now = new Date().toISOString();
  const results: HealthCheckResult[] = [];

  // ── 1. Database Connection ──────────────────────────────────────────────────
  try {
    await prisma.$queryRaw`SELECT 1`;
    results.push({
      id: "database", label: "Database Connection", description: "PostgreSQL accessible via Prisma",
      status: "pass", detail: "Connected successfully", checkedAt: now,
    });
  } catch (e) {
    results.push({
      id: "database", label: "Database Connection", description: "PostgreSQL accessible via Prisma",
      status: "fail", detail: `Connection failed: ${(e as Error).message}`, checkedAt: now,
    });
  }

  // ── 2. Required Environment Variables ─────────────────────────────────────
  const requiredEnvs = ["DATABASE_URL","NEXTAUTH_SECRET","NEXTAUTH_URL"];
  const optionalEnvs = ["GROQ_API_KEY","UPSTASH_REDIS_REST_URL","UPSTASH_REDIS_REST_TOKEN","DIRECT_URL"];
  const missingRequired = requiredEnvs.filter((k) => !process.env[k]);
  const missingOptional = optionalEnvs.filter((k) => !process.env[k]);

  if (missingRequired.length > 0) {
    results.push({
      id: "env", label: "Environment Variables", description: "Required env vars configured",
      status: "fail",
      detail: `Missing required: ${missingRequired.join(", ")}`,
      checkedAt: now,
    });
  } else if (missingOptional.length > 0) {
    results.push({
      id: "env", label: "Environment Variables", description: "Required env vars configured",
      status: "warn",
      detail: `All required set. Optional missing: ${missingOptional.join(", ")}`,
      checkedAt: now,
    });
  } else {
    results.push({
      id: "env", label: "Environment Variables", description: "Required env vars configured",
      status: "pass", detail: "All required and optional variables set", checkedAt: now,
    });
  }

  // ── 3. Auth Provider ──────────────────────────────────────────────────────
  const hasAuthSecret = !!process.env.NEXTAUTH_SECRET;
  const hasAuthUrl    = !!process.env.NEXTAUTH_URL;
  results.push({
    id: "auth", label: "Auth Provider", description: "NextAuth.js configured",
    status: hasAuthSecret && hasAuthUrl ? "pass" : "fail",
    detail: hasAuthSecret && hasAuthUrl
      ? `NextAuth configured · URL: ${process.env.NEXTAUTH_URL}`
      : `Missing: ${!hasAuthSecret ? "NEXTAUTH_SECRET " : ""}${!hasAuthUrl ? "NEXTAUTH_URL" : ""}`,
    checkedAt: now,
  });

  // ── 4. AI Service (Groq) ──────────────────────────────────────────────────
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    results.push({
      id: "groq", label: "AI Service (Groq)", description: "Groq API key configured",
      status: "warn",
      detail: "GROQ_API_KEY not set — AI features (transcription, task extraction, due diligence, market scraping) will run in stub mode",
      checkedAt: now,
    });
  } else {
    // Light connectivity check — HEAD only, no credits consumed
    try {
      const resp = await fetch("https://api.groq.com/openai/v1/models", {
        method: "GET",
        headers: { "Authorization": `Bearer ${groqKey}` },
        signal: AbortSignal.timeout(5000),
      });
      results.push({
        id: "groq", label: "AI Service (Groq)", description: "Groq API key configured",
        status: resp.ok ? "pass" : "warn",
        detail: resp.ok ? "Groq API reachable and key valid" : `Groq responded with ${resp.status}`,
        checkedAt: now,
      });
    } catch {
      results.push({
        id: "groq", label: "AI Service (Groq)", description: "Groq API key configured",
        status: "warn", detail: "GROQ_API_KEY set but API unreachable (network issue or timeout)", checkedAt: now,
      });
    }
  }

  // ── 5. Redis Cache (Upstash) ──────────────────────────────────────────────
  const redisUrl   = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!redisUrl || !redisToken) {
    results.push({
      id: "redis", label: "Redis Cache (Upstash)", description: "Edge cache layer configured",
      status: "warn",
      detail: "Upstash Redis not configured — caching disabled, all requests hit PostgreSQL directly",
      checkedAt: now,
    });
  } else {
    try {
      const resp = await fetch(`${redisUrl}/ping`, {
        headers: { Authorization: `Bearer ${redisToken}` },
        signal: AbortSignal.timeout(5000),
      });
      const body = await resp.json().catch(() => ({}));
      const ok   = body?.result === "PONG";
      results.push({
        id: "redis", label: "Redis Cache (Upstash)", description: "Edge cache layer configured",
        status: ok ? "pass" : "warn",
        detail: ok ? "Upstash Redis reachable — PONG received" : `Unexpected response: ${JSON.stringify(body)}`,
        checkedAt: now,
      });
    } catch {
      results.push({
        id: "redis", label: "Redis Cache (Upstash)", description: "Edge cache layer configured",
        status: "warn", detail: "Redis URL set but unreachable", checkedAt: now,
      });
    }
  }

  // ── 6. Seed Data / User Count ─────────────────────────────────────────────
  try {
    const userCount = await prisma.user.count();
    results.push({
      id: "seed", label: "Seed Data", description: "At least one user exists in database",
      status: userCount > 0 ? "pass" : "warn",
      detail: userCount > 0
        ? `${userCount} user${userCount > 1 ? "s" : ""} in database`
        : "No users found — run `npm run db:seed` to create demo accounts",
      checkedAt: now,
    });
  } catch {
    results.push({
      id: "seed", label: "Seed Data", description: "At least one user exists in database",
      status: "fail", detail: "Could not query user count — database issue", checkedAt: now,
    });
  }

  // ── 7. Schema — DocumentFile table exists ─────────────────────────────────
  try {
    await prisma.documentFile.count();
    results.push({
      id: "schema_docfile", label: "Schema: DocumentFile", description: "document_files table exists and is accessible",
      status: "pass", detail: "DocumentFile model accessible — migration applied", checkedAt: now,
    });
  } catch {
    results.push({
      id: "schema_docfile", label: "Schema: DocumentFile", description: "document_files table exists and is accessible",
      status: "fail", detail: "DocumentFile table missing — run migration 20260725020000_document_file_foundation", checkedAt: now,
    });
  }

  // ── 8. Schema — MarketPrice mgoUsd/usdIdr columns ────────────────────────
  try {
    const mp = await prisma.marketPrice.findFirst({ select: { mgoUsd: true, usdIdr: true, notes: true } });
    results.push({
      id: "schema_marketprice", label: "Schema: MarketPrice MGO/FX", description: "mgoUsd, usdIdr, notes columns exist",
      status: "pass", detail: mp !== undefined ? "Columns accessible" : "Table empty but columns present", checkedAt: now,
    });
  } catch {
    results.push({
      id: "schema_marketprice", label: "Schema: MarketPrice MGO/FX", description: "mgoUsd, usdIdr, notes columns exist",
      status: "fail", detail: "mgoUsd/usdIdr columns missing — run migration 20260724170000_market_price_manual_input", checkedAt: now,
    });
  }

  // ── 9. Object Storage — stub warning ─────────────────────────────────────
  const hasStorage = !!(process.env.STORAGE_PROVIDER ||
    process.env.S3_BUCKET || process.env.SUPABASE_STORAGE_BUCKET ||
    process.env.R2_BUCKET);
  results.push({
    id: "storage", label: "Object Storage", description: "Binary file storage configured",
    status: hasStorage ? "warn" : "fail",
    detail: hasStorage
      ? "Storage env detected — verify write/download works end-to-end"
      : "No storage provider env set — document upload is URL-backed only; binary upload/ZIP pending",
    checkedAt: now,
  });

  // Code-inspection checks are warnings until runtime API tests prove denial.
  results.push({
    id: "rbac_fco", label: "RBAC: FCO Approved-Only", description: "FCO generation blocked for non-approved forecasts",
    status: "warn",
    detail: "Code gate present; runtime denial test still required",
    checkedAt: now,
  });

  // ── 11. RBAC — Public Document Drive critical leak ────────────────────────
  results.push({
    id: "rbac_docrive_public", label: "RBAC: Public Doc Drive", description: "Critical docs hidden from public/unauthenticated",
    status: "warn",
    detail: "Code gate present; runtime public/critical isolation test still required",
    checkedAt: now,
  });

  // ── 12. Market Price manual input ────────────────────────────────────────
  try {
    const mpCount = await prisma.marketPrice.count();
    results.push({
      id: "market_price_input", label: "Market Price Manual Input", description: "Manual price entries exist or schema ready",
      status: "pass",
      detail: mpCount > 0 ? `${mpCount} price entries in DB` : "Schema ready; no entries yet — input price via /market-price",
      checkedAt: now,
    });
  } catch {
    results.push({
      id: "market_price_input", label: "Market Price Manual Input", description: "Manual price entries exist or schema ready",
      status: "fail", detail: "Cannot query market_prices table", checkedAt: now,
    });
  }

  return results;
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ALLOWED.includes(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const checks  = await runChecks();
  const overall = checks.some((c) => c.status === "fail")  ? "fail"
                : checks.some((c) => c.status === "warn")  ? "warn"
                : "pass";

  return NextResponse.json({ data: { checks, overall, checkedAt: new Date().toISOString() } });
}

export async function POST(request: Request) {
  // Same as GET but forces a fresh check (no cache)
  return GET(request);
}

