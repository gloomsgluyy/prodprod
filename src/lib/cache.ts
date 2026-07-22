// Three-tier cache: React Query (client) → Redis (server) → PostgreSQL (DB)
// Supports both local Redis (ioredis) and Upstash Redis (HTTP-based).
// If neither is configured, getCached() falls through to the fetcher directly.

// ── Mode Detection ───────────────────────────────────────────────────────────
const useLocalRedis = !!process.env.REDIS_URL;
const useUpstash =
  !useLocalRedis &&
  !!process.env.UPSTASH_REDIS_REST_URL &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN;
const redisEnabled = useLocalRedis || useUpstash;

// ── Unified Cache Interface ──────────────────────────────────────────────────
interface CacheClient {
  get<T>(key: string): Promise<T | null>;
  setex(key: string, ttl: number, value: string): Promise<void>;
  del(key: string): Promise<void>;
}

let _client: CacheClient | null = null;

async function getClient(): Promise<CacheClient | null> {
  if (!redisEnabled) return null;
  if (_client) return _client;

  if (useUpstash) {
    const { Redis } = await import("@upstash/redis");
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    _client = {
      get: <T>(key: string) => redis.get<T>(key),
      setex: async (key, ttl, val) => {
        await redis.setex(key, ttl, val);
      },
      del: async (key) => {
        await redis.del(key);
      },
    };
  } else if (useLocalRedis) {
    // Dynamic import — ioredis must be installed: npm i ioredis
    const { default: IORedis } = await import("ioredis");
    const redis = new IORedis(process.env.REDIS_URL!);
    _client = {
      get: async <T>(key: string): Promise<T | null> => {
        const val = await redis.get(key);
        if (val === null) return null;
        try {
          return JSON.parse(val) as T;
        } catch {
          return val as unknown as T;
        }
      },
      setex: async (key, ttl, val) => {
        await redis.setex(key, ttl, val);
      },
      del: async (key) => {
        await redis.del(key);
      },
    };
  }

  return _client;
}

// ── TTL Constants (seconds) ──────────────────────────────────────────────────
export const TTL = {
  MARKET_PRICE: 5 * 60, //  5 min — changes daily
  DIRECTORY: 15 * 60, // 15 min — rarely changes
  SHIPMENT_LIST: 60, //  1 min — frequent updates
  DASHBOARD_METRICS: 2 * 60, //  2 min
  DASHBOARD_BLOCKERS: 2 * 60, //  2 min
  QUALITY_LIST: 3 * 60, //  3 min
  SOURCE_LIST: 5 * 60, //  5 min
  FORECAST_LIST: 3 * 60, //  3 min
  DEAL_LIST: 3 * 60, //  3 min
  PARTNER_LIST: 10 * 60, // 10 min
} as const;

// ── Core Cache Functions ─────────────────────────────────────────────────────
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number
): Promise<T> {
  const client = await getClient();

  // No Redis → skip cache, go straight to DB
  if (!client) return fetcher();

  try {
    const cached = await client.get<T>(key);
    if (cached !== null) return cached;

    const data = await fetcher();
    await client.setex(key, ttl, JSON.stringify(data));
    return data;
  } catch {
    // Redis error → fall through to DB (never fail the request)
    return fetcher();
  }
}

export async function invalidate(key: string): Promise<void> {
  const client = await getClient();
  if (!client) return; // no-op without Redis
  try {
    await client.del(key);
  } catch {
    // Silently ignore cache invalidation failures
  }
}

export async function invalidateMany(keys: string[]): Promise<void> {
  const client = await getClient();
  if (!client) return;
  try {
    await Promise.allSettled(keys.map((k) => client.del(k)));
  } catch {
    // Silently ignore
  }
}

// Direct client access for advanced usage (may be null if not configured)
export { getClient as getRedis };
