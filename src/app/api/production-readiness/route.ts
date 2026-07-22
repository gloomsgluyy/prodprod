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

  return results;
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

