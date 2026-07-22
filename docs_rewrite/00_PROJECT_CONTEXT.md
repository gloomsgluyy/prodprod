---
inclusion: auto
---

# CoalTrade OS — Project Context

**Version:** 2.0 (Rewrite)
**Tanggal:** Juli 2026
**Status:** Rewrite Planning

---

## 1. Latar Belakang

CoalTrade OS adalah **operating system internal** untuk perusahaan trading batubara yang mengelola seluruh siklus bisnis — dari peluang/deal hingga closing shipment dan kalkulasi Profit & Loss.

### Mengapa Rewrite?

Versi pertama CoalTrade OS dibangun secara iteratif dengan pendekatan rapid development. Meskipun telah berhasil mencakup 21 modul dengan fitur yang sudah di-ACC oleh client, terdapat beberapa masalah arsitektur dan teknis yang memerlukan rewrite:

1. **Code complexity** — Beberapa halaman sangat besar (Shipment Monitor: 4700 baris/400KB, Forecast Sales: 3275 baris/183KB)
2. **Tight coupling** — Store monolitik (`commercial-store`) menangani terlalu banyak modul
3. **Performance** — Data loading tanpa proper caching dan pagination di beberapa modul
4. **Maintainability** — Sulit untuk tim baru memahami codebase tanpa dokumentasi yang memadai
5. **Scalability** — Perlu arsitektur yang lebih modular untuk penambahan fitur di masa depan

### Tujuan Rewrite

- Memisahkan modul menjadi komponen yang lebih modular dan maintainable
- Meningkatkan performance dengan proper caching, lazy loading, dan optimized queries
- Mempertahankan **100% fitur existing** yang sudah di-ACC client
- Mengimplementasikan semua revisi dari Revision Matrix yang belum tercakup
- Membuat codebase yang mudah di-onboard oleh developer baru

---

## 2. Business Domain

### Industri

**Coal Trading** — Perdagangan batubara nasional (domestik) dan internasional (ekspor). Perusahaan bertindak sebagai trader/intermediary yang membeli batubara dari supplier/tambang dan menjualnya kepada buyer di Indonesia maupun luar negeri.

### Proses Bisnis Inti

```
Market Analysis → Forecast/Offer → CEO Approval → FCO → Buyer Feedback → Deal →
Shipment Creation → Source Confirmation → Quality Check → SI Issuance →
Loading → Transit → Discharge → Document Processing → Payment → P&L → Closing
```

### Tipe Transaksi

| Tipe | Deskripsi | Shipping Term |
|------|-----------|---------------|
| **Export** | Penjualan ke luar negeri (Cambodia, Philippines, South Korea, India, China, Japan, Thailand, Vietnam) | FOB, CIF, CFR |
| **Domestic/Local** | Penjualan dalam negeri Indonesia | FOB, FAS |

---

## 3. Struktur Tim Komersial (Commercial Team)

### Organisasi

```
COMMERCIAL TEAM
├── Sales / Marketing
│   ├── Chief Marketing Officer (CMO)
│   ├── Head of Traffic
│   ├── Junior Trader (PA CMO)
│   ├── Traffic Admin
│   ├── Commercial Admin
│   └── Stockpile Management
│
├── Purchasing
│   ├── Chief Purchasing Officer (CPO)
│   ├── Purchase Supervisor
│   └── Supplier Admin
│
├── Operation
│   ├── Chief Operation Officer (COO)
│   ├── Traffic (overlap dengan Sales)
│   └── Region Head
│
└── Executive
    ├── CEO (DIRUT)
    └── Assistant CEO (Ass. DIRUT)
```

### Role-to-System Mapping

| Role Bisnis | System Role | Tanggung Jawab Utama di Sistem |
|-------------|-------------|-------------------------------|
| CEO / DIRUT | `CEO`, `DIRUT` | Approval FCO, SI, Source Change; Akses P&L; Dashboard full |
| Ass. DIRUT | `ASS_DIRUT` | Co-approval, review P&L, dashboard full |
| CMO | `CMO`, `TRADERS_4` | Sales monitor, market price, P&L forecast |
| COO | `COO`, `TRADERS_3` | Operational oversight, quality approval |
| CPPO | `CPPO`, `TRADERS_2` | Project strategy, blending approval |
| Traders | `TRADERS_1` | Sales offer, shipment, FCO, SI |
| Junior Trader | `JUNIOR_TRADER` | Assist CMO, basic sales input |
| Head of Traffic | `TRAFFIC_HEAD` | Shipment approve, transshipment |
| Traffic Team | `TRAFFIC_1..4` | Shipment tracking, barge management |
| Admin Marketing | `ADMIN_MARKETING` | Market price update, directory, clerical |
| Spv. Sourcing | `SPV_SOURCING` | Source validation, purchase approval |
| Sourcing Officer | `SOURCING_1..4` | Source input, supplier management |
| Q&Q Manager | `QQ_MANAGER` | Quality final report validation |
| QC Manager | `QC_MANAGER` | COA validation, quality comparison |
| QC Admin | `QC_ADMIN_1..2` | Quality data input |
| Admin Operation | `ADMIN_OPERATION` | Operational documentation |
| Finance | `FINANCE` | Payment, expenses, P&L support |

---

## 4. System Vision

### Dari Excel ke Operating System

> **"Sistem tidak boleh lagi terasa seperti tabel Excel panjang."**

CoalTrade OS harus menjadi **workflow-driven operating system** di mana:

1. Setiap data penting memiliki **owner modul** dan **owner role**
2. Perubahan berisiko tinggi memiliki **audit trail** dan **approval workflow**
3. Dashboard berfungsi sebagai **control tower berbasis alert**, bukan hanya angka summary
4. Dokumen memiliki **status, tanggal, aging, upload**, dan **blocker rule**
5. Shipment tidak bisa closed jika **mandatory data belum lengkap**

### Core Principles

| ID | Prinsip | Deskripsi |
|----|---------|-----------|
| CP-01 | **Workflow, Not Spreadsheet** | Modul besar dibagi ke sub-tab/section workflow yang jelas |
| CP-02 | **Module Ownership** | Data diinput di modul yang memiliki proses tersebut |
| CP-03 | **No Overwrite for Revisions** | Source change, barge change, SI revision, price revision menyimpan history |
| CP-04 | **Closing Must Be Controlled** | Shipment close hanya jika semua mandatory data lengkap |
| CP-05 | **Dashboard Must Show Blockers** | Alert untuk source pending, quality warning, doc aging, payment overdue |
| CP-06 | **Approval & Audit Trail** | Critical actions memerlukan approval dan tercatat di audit log |

---

## 5. Performance & Architecture Guidelines

### Prinsip Utama Rewrite

> **"Write only what the task needs, and never cut validation, error handling, security, or accessibility."**

CoalTrade OS v2 dibangun dengan prinsip **performance-first**, **maintainability**, dan **token-efficient development**.

### Development Philosophy (Ponytail Integration)

Rewrite menggunakan **Ponytail methodology** untuk menghemat token AI dan menciptakan kode yang efisien:

```
1. Does this need to exist?   → no: skip it (YAGNI)
2. Already in this codebase?  → reuse it, don't rewrite
3. Stdlib does it?            → use it
4. Native platform feature?   → use it
5. Installed dependency?      → use it
6. One line?                  → one line
7. Only then: the minimum that works
```

**Ponytail Setup:**
- Install: `/plugin marketplace add DietrichGebert/ponytail` → `/plugin install ponytail@ponytail`
- Mode: `/ponytail full` (default untuk development)
- Review: `/ponytail-review` sebelum commit untuk deteksi over-engineering
- Audit: `/ponytail-audit` untuk review codebase secara menyeluruh

**Key Benefits:**
- ~54% less code (up to 94% pada over-engineered components)
- ~20% cheaper development cost
- ~27% faster execution
- 100% safe (tidak mengorbankan validation, error handling, security)

### Frontend Architecture

#### State Management Separation

**Masalah v1:** Zustand store monolitik mencampur UI state dengan server state.

**Solusi v2:**

```
TanStack Query (React Query v5)  →  Server state (fetching, caching, refetch, optimistic updates)
Zustand (per-modul)              →  UI state ONLY (sidebar, modal, active tab, filters)
```

**Struktur Store:**

```typescript
// ❌ BURUK (v1 approach)
const useCommercialStore = create((set) => ({
  shipments: [],        // server state
  forecasts: [],        // server state
  isLoading: false,     // server state
  sidebarOpen: true,    // UI state
  activeTab: 'all',     // UI state
}));

// ✅ BAGUS (v2 approach)
// Server state via React Query
const useShipments = () => useQuery({
  queryKey: ['shipments'],
  queryFn: fetchShipments,
  staleTime: 5 * 60 * 1000, // 5 menit
});

// UI state via Zustand
const useShipmentUIStore = create((set) => ({
  sidebarOpen: true,
  activeTab: 'all',
  selectedFilters: {},
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}));
```

#### Component Architecture

**Modular Structure Per-Modul:**

```
src/
  modules/
    shipment-monitor/
      components/
        ShipmentTable.tsx           ← Main table dengan TanStack Table
        ShipmentDetail.tsx
        ShipmentFilters.tsx
        tabs/
          GeneralInfoTab.tsx        ← Sub-tab components
          SourceTab.tsx
          QualityTab.tsx
      hooks/
        useShipments.ts             ← React Query hooks
        useShipmentDetail.ts
        useShipmentMutations.ts     ← Create, Update, Delete
      api/
        shipment-api.ts             ← API client functions
      store/
        shipment-ui-store.ts        ← Zustand UI state only
      types/
        shipment.types.ts
      utils/
        shipment-calculations.ts
    forecast-sales/
    quality-control/
    ...
  shared/
    components/
      ui/                           ← Shadcn/ui components
        Button.tsx
        Table.tsx
        Modal.tsx
      data-table/                   ← Reusable TanStack Table wrapper
        DataTable.tsx
        DataTablePagination.tsx
    hooks/
      useDebounce.ts
      useIntersectionObserver.ts
    lib/
      react-query.ts               ← Query client config
      api-client.ts                ← Axios instance
```

#### Data Loading Strategy

**Pagination & Virtualization:**

```typescript
// TanStack Table dengan server-side pagination
const {
  data,
  isLoading,
  isFetching,
} = useQuery({
  queryKey: ['shipments', page, pageSize, filters],
  queryFn: () => fetchShipments({ page, pageSize, filters }),
  placeholderData: keepPreviousData, // Smooth pagination
});

// TanStack Virtual untuk list panjang
const rowVirtualizer = useVirtualizer({
  count: data?.items.length ?? 0,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 50,
  overscan: 10,
});
```

**Lazy Loading & Code Splitting:**

```typescript
// Route-level code splitting
const ShipmentMonitor = lazy(() => import('@/modules/shipment-monitor'));
const ForecastSales = lazy(() => import('@/modules/forecast-sales'));

// Component-level lazy load untuk heavy components
const BlendingSimulator = lazy(() => import('./BlendingSimulator'));
```

**Skeleton Loading per Section:**

```tsx
{isLoading ? (
  <ShipmentTableSkeleton />
) : (
  <ShipmentTable data={data} />
)}
```

### Backend Architecture

#### API Layer Structure

```
/api/
  shipments/
    route.ts              ← GET (list, paginated), POST
    [id]/
      route.ts            ← GET, PATCH, DELETE
      quality/
        route.ts          ← Sub-resource quality data
      documents/
        route.ts
      source/
        route.ts
  forecasts/
    route.ts
    [id]/
      route.ts
      fco/
        route.ts          ← FCO generation endpoint
  market-prices/
  sources/
  quality/
  ...
```

#### Query Optimization (Prisma)

**❌ BURUK — N+1 Query Problem:**

```typescript
// Fetch shipments
const shipments = await prisma.shipment.findMany();

// Loop dan fetch related data (N+1!)
for (const shipment of shipments) {
  const quality = await prisma.quality.findFirst({
    where: { shipmentId: shipment.id }
  });
  const source = await prisma.source.findFirst({
    where: { shipmentId: shipment.id }
  });
}
```

**✅ BAGUS — Single Query dengan Include:**

```typescript
const shipments = await prisma.shipment.findMany({
  where: { status: { in: ['active', 'transit'] } },
  include: {
    quality: {
      select: {
        status: true,
        gar: true,
        tm: true,
        ts: true,
        ash: true,
      }
    },
    source: {
      select: {
        supplierName: true,
        stockLocation: true,
        status: true,
      }
    },
    buyer: {
      select: { name: true, country: true }
    },
  },
  take: pageSize,
  skip: (page - 1) * pageSize,
  orderBy: { createdAt: 'desc' },
});

// Total count untuk pagination (query terpisah lebih cepat)
const totalCount = await prisma.shipment.count({
  where: { status: { in: ['active', 'transit'] } }
});
```

**Field Selection — Hanya Ambil Data yang Dibutuhkan:**

```typescript
// ❌ BURUK — fetch all fields (berat, banyak data tidak terpakai)
const shipments = await prisma.shipment.findMany();

// ✅ BAGUS — select hanya field yang dibutuhkan di UI
const shipments = await prisma.shipment.findMany({
  select: {
    id: true,
    shipmentNumber: true,
    buyer: { select: { name: true } },
    quantity: true,
    status: true,
    etd: true,
    eta: true,
  }
});
```

**Connection Pooler (Wajib untuk Production):**

```env
# .env
# ❌ Direct connection (akan hit connection limit di serverless)
DATABASE_URL="postgresql://user:pass@host:5432/db"

# ✅ Connection pooler (Supabase, Neon, atau PgBouncer)
DATABASE_URL="postgresql://user:pass@pooler-host:6543/db?pgbouncer=true"
DIRECT_URL="postgresql://user:pass@host:5432/db"  # untuk migrations
```

#### Response Optimization

**Compression & Streaming:**

```typescript
// api/shipments/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const data = await fetchShipments();
  
  // Return with compression hint
  return NextResponse.json(data, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'private, max-age=0, must-revalidate',
    }
  });
}

// Enable compression di next.config.js
module.exports = {
  compress: true, // Gzip compression
};
```

**Incremental Static Regeneration (ISR) untuk Data Semi-Static:**

```typescript
// app/market-prices/page.tsx (data yang jarang berubah)
export const revalidate = 3600; // Revalidate setiap 1 jam

export async function generateStaticParams() {
  return [];
}
```

### Caching Strategy

#### Three-Tier Caching

```
Request Flow:
  1. React Query Cache (Client, 5-15 menit)
      ↓ cache miss
  2. Upstash Redis (Edge, 1-5 menit)
      ↓ cache miss
  3. PostgreSQL Database
      ↑ write-through
```

**Implementation:**

```typescript
// lib/cache.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300 // 5 menit default
): Promise<T> {
  // Try cache first
  const cached = await redis.get<T>(key);
  if (cached) return cached;

  // Cache miss, fetch fresh data
  const data = await fetcher();
  
  // Store in cache
  await redis.setex(key, ttl, data);
  
  return data;
}

// Usage di API route
export async function GET() {
  const marketPrices = await getCachedData(
    'market-prices:latest',
    async () => {
      return await prisma.marketPrice.findMany({
        orderBy: { date: 'desc' },
        take: 30,
      });
    },
    300 // Cache 5 menit
  );

  return NextResponse.json(marketPrices);
}
```

**React Query Configuration:**

```typescript
// lib/react-query.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,        // 5 menit (data dianggap fresh)
      gcTime: 10 * 60 * 1000,          // 10 menit (cache garbage collection)
      refetchOnWindowFocus: false,      // Jangan auto-refetch saat window focus
      retry: 1,                         // Retry 1x jika error
    },
  },
});
```

**Cache Invalidation Strategy:**

```typescript
// hooks/useShipmentMutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useUpdateShipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateShipment,
    onSuccess: (data) => {
      // Invalidate semua query terkait shipments
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      
      // Update cache detail shipment secara optimistik
      queryClient.setQueryData(['shipment', data.id], data);
    },
  });
}
```

**Cache Keys Convention:**

```typescript
// Query keys harus konsisten dan hierarkis
const queryKeys = {
  shipments: {
    all: ['shipments'],
    lists: () => [...queryKeys.shipments.all, 'list'],
    list: (filters: Filter) => [...queryKeys.shipments.lists(), filters],
    details: () => [...queryKeys.shipments.all, 'detail'],
    detail: (id: string) => [...queryKeys.shipments.details(), id],
  },
  forecasts: {
    all: ['forecasts'],
    // ...
  },
};

// Usage
useQuery({
  queryKey: queryKeys.shipments.list({ status: 'active' }),
  queryFn: () => fetchShipments({ status: 'active' }),
});
```

### Background Jobs & Long-Running Tasks

**Vercel Cron Jobs (untuk scheduled tasks):**

```typescript
// api/cron/market-price-scrape/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Verify cron secret untuk security
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Run scraping
  await scrapeMarketPrices();

  return NextResponse.json({ success: true });
}

// vercel.json
{
  "crons": [{
    "path": "/api/cron/market-price-scrape",
    "schedule": "0 9 * * *"  // Every day at 9 AM
  }]
}
```

**Queue Pattern untuk AI Processing:**

```typescript
// Hindari blocking API route dengan AI processing
// Pattern: store task → return task ID → client polling

// api/meetings/transcribe/route.ts
export async function POST(request: Request) {
  const { meetingId, audioUrl } = await request.json();

  // Store transcription task
  const task = await prisma.transcriptionTask.create({
    data: {
      meetingId,
      audioUrl,
      status: 'pending',
    }
  });

  // Trigger background processing (jangan await)
  processTranscription(task.id).catch(console.error);

  // Return task ID immediately
  return NextResponse.json({ taskId: task.id });
}

// Client polling untuk status
const { data } = useQuery({
  queryKey: ['transcription-task', taskId],
  queryFn: () => fetchTaskStatus(taskId),
  refetchInterval: (data) => {
    // Stop polling jika sudah complete atau error
    return data?.status === 'pending' ? 2000 : false;
  },
});
```

### Performance Monitoring

**Key Metrics to Track:**

```typescript
// lib/monitoring.ts
export function trackPerformance(metricName: string, value: number) {
  if (typeof window !== 'undefined' && window.performance) {
    performance.mark(`${metricName}-${value}`);
  }
  
  // Log ke analytics (Vercel Analytics, Posthog, dll.)
  console.log(`[PERF] ${metricName}:`, value);
}

// Usage di component
useEffect(() => {
  const start = performance.now();
  
  // Operation
  loadData();
  
  const end = performance.now();
  trackPerformance('data-load-time', end - start);
}, []);
```

---

## 6. Tech Stack

### Current Stack (v1)

| Layer | Teknologi | Keterangan |
|-------|-----------|------------|
| **Frontend** | Next.js (App Router) | React-based, SSR/SSG support |
| **Styling** | Tailwind CSS | Utility-first CSS |
| **State Management** | Zustand | Stores: `commercial-store`, `task-store`, `auth-store`, dll. |
| **Charts** | Recharts | BarChart, LineChart, PieChart, AreaChart, ComposedChart |
| **Drag & Drop** | @hello-pangea/dnd | Kanban board Tasks |
| **PDF Generation** | jsPDF | FCO, MOM, Shipping Instruction, Reports |
| **Auth** | NextAuth.js | Credentials Provider, JWT session |
| **Database** | PostgreSQL | via Prisma ORM |
| **ORM** | Prisma | Schema-first, migrations |
| **AI** | Groq (LLM) | Market scraping, MOM transcription, task extraction, due diligence |
| **Deployment** | Vercel | Edge runtime |

### V2 Tech Stack (Additions)

| Layer | Teknologi | Keterangan | Priority |
|-------|-----------|------------|----------|
| **Server State** | TanStack Query v5 | Caching, refetching, optimistic updates | 🔥 Critical |
| **Data Tables** | TanStack Table v8 | Sorting, filtering, pagination, virtualization | 🔥 Critical |
| **Virtualization** | TanStack Virtual | Virtual scrolling untuk list panjang | High |
| **Forms** | React Hook Form | Form state management | High |
| **Validation** | Zod | Type-safe schema validation | High |
| **Caching** | Upstash Redis | Edge-compatible Redis caching | 🔥 Critical |
| **Compression** | Built-in Next.js | Gzip compression | Default |
| **Development** | Ponytail | AI-assisted development methodology | Recommended |

### Rewrite Strategy

Rewrite mempertahankan **tech stack core yang sama**, focus pada:

✅ **Architecture Improvements:**
- Pisahkan server state (React Query) dari UI state (Zustand per-modul)
- Modular folder structure per-modul
- Proper API layer dengan REST conventions
- Connection pooler untuk database

✅ **Performance Optimizations:**
- Three-tier caching (React Query → Redis → PostgreSQL)
- Server-side pagination untuk semua tabel besar
- TanStack Virtual untuk list 100+ items
- Prisma query optimization (include + select)
- Lazy loading & code splitting per route

✅ **Developer Experience:**
- Ponytail methodology untuk efficient code generation
- TypeScript strict mode
- Consistent query key conventions
- Reusable component library (shared/components)

### Database Hosting Requirements

**Spesifikasi Minimum untuk Production:**

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **Database (PostgreSQL)** | 2 vCPU, 4 GB RAM, 50 GB SSD | 4 vCPU, 8 GB RAM, 100 GB NVMe |
| **Connection Pooler** | Required | PgBouncer or Supabase built-in |
| **Backups** | Daily | Automated continuous |

**Recommended Database Providers:**

1. **Supabase** (Easiest)
   - Built-in connection pooler
   - Built-in storage untuk documents
   - Built-in auth (jika ingin migrate dari NextAuth)
   - Free tier: 500 MB, 2 CPU, connection pooler included

2. **Neon** (Serverless)
   - Auto-scaling (cold start ada delay ~100ms)
   - Branch per PR (bagus untuk development)
   - Built-in connection pooler
   - Free tier: 0.5 GB

3. **Railway** (Simple & Affordable)
   - Fixed pricing $5-20/month untuk starter
   - Easy setup, good DX
   - Manual PgBouncer setup needed

**Vercel Deployment:**

- **Hobby Plan:** ❌ Tidak cukup (timeout 10s, no background functions)
- **Pro Plan:** ✅ Recommended ($20/bulan)
  - 60s function timeout
  - Background functions
  - Cron jobs
  - Edge config untuk feature flags

### Connection Pooler Setup (Critical)

**Mengapa Wajib:**
Next.js serverless functions membuka koneksi baru setiap request. Tanpa pooler, PostgreSQL akan hit max connections (default 100) dalam hitungan menit di production.

**Setup dengan Supabase:**

```env
# .env
DATABASE_URL="postgresql://postgres.xxx:password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xxx:password@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
```

**Setup dengan PgBouncer (self-hosted):**

```ini
# pgbouncer.ini
[databases]
coalos = host=localhost port=5432 dbname=coalos

[pgbouncer]
listen_port = 6543
listen_addr = *
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 20
```

```env
# .env
DATABASE_URL="postgresql://user:pass@pgbouncer-host:6543/coalos?pgbouncer=true"
DIRECT_URL="postgresql://user:pass@postgres-host:5432/coalos"
```

---

## 7. Module Overview (21 Modul)

```mermaid
graph TB
    subgraph "Command Center"
        DASH[Dashboard]
    end

    subgraph "Commercial Pipeline"
        MKT[Market Price]
        FS[Forecast Sales]
        SM[Sales Monitor]
    end

    subgraph "Operational Core"
        SHIP[Shipment Monitor]
        SRC[Sources & Supplier]
        QC[Quality Control]
        BLEND[Blending Simulator]
        TRANS[Transshipment & Freight]
    end

    subgraph "Document & Compliance"
        DOC[Document Drive]
        SI[Shipping Instruction*]
        DDH[Domestic Handover*]
        BCL[Barge Change Log*]
        SCT[Source Change Trace*]
    end

    subgraph "Financial"
        PAY[Outstanding Payment]
        PL[Profit & Loss]
        EXP[Expenses]
    end

    subgraph "Collaboration"
        MEET[Meetings & MOM]
        TASK[Tasks]
        AI[AI Excel Agent]
    end

    subgraph "Administration"
        DIR[Partners & Directory]
        USR[User Management]
        AUDIT[Audit Logs]
        PROD[Production Readiness]
    end

    subgraph "Authentication"
        LOGIN[Login]
    end

    MKT --> FS
    FS --> SM
    SM --> SHIP
    SHIP --> SRC
    SHIP --> QC
    SHIP --> TRANS
    SHIP --> PAY
    QC --> BLEND
    PAY --> PL
    EXP --> PL
    TRANS --> PL
    MEET --> TASK
```

*\* = Sub-modul di dalam Shipment Monitor*

### Daftar Modul

| # | Modul | Route | Deskripsi Singkat |
|---|-------|-------|-------------------|
| 1 | **Dashboard** | `/` | Command center dengan alert-based widgets, metrik, shipment table, blocker control tower |
| 2 | **Login** | `/login` | Autentikasi NextAuth.js, credentials provider |
| 3 | **Shipment Monitor** | `/shipment-monitor` | Pusat kontrol operasional shipment end-to-end dengan 7+ sub-tab |
| 4 | **Market Price** | `/market-price` | Tracking harga batubara global (ICI, NEWC, HBA), calculator, scraping AI |
| 5 | **Sales Monitor** | `/sales-monitor` | Monitoring deal/transaksi penjualan, pipeline view |
| 6 | **Forecast Sales** | `/forecast-sales`, `/projects` | Manajemen forecast, offer profile, FCO, approval, buyer feedback |
| 7 | **Outstanding Payment** | `/outstanding-payment` | Tracking pembayaran DP/outstanding buyer & vendor |
| 8 | **Sources & Supplier** | `/sources` | Manajemen supplier batubara, stok, spesifikasi, KYC/PSI |
| 9 | **Quality Control** | `/quality` | Workflow QC multi-stage (QC, PSI, COA POL, COA POD), comparison |
| 10 | **Blending Simulator** | `/blending` | Simulasi pencampuran cargo batubara, weighted average calculation |
| 11 | **Meetings & MOM** | `/meetings` | Meeting management, AI transcription, MOM PDF, task extraction |
| 12 | **AI Excel Agent** | `/ai-agent` | AI assistant untuk query data Excel, context-aware |
| 13 | **Document Drive** | `/document-drive` | Repository agregasi seluruh dokumen operasional |
| 14 | **Partners & Directory** | `/directory` | CRM master data buyer, supplier, vendor, surveyor |
| 15 | **Transshipment & Freight** | `/transshipment` | Manajemen freight, vessel allocation, milestone tracking |
| 16 | **Tasks** | `/all-tasks`, `/my-tasks` | Kanban board task management dengan drag-and-drop |
| 17 | **Profit & Loss** | `/profit-loss` | Laporan keuangan revenue vs expense, margin monitoring |
| 18 | **Expenses** | `/purchase-requests` | Pengajuan dan approval pembelian operasional |
| 19 | **User Management** | `/users` | Kontrol role dan akses user (CEO only) |
| 20 | **Production Readiness** | `/production-readiness` | Health check dan readiness checklist sistem |
| 21 | **Audit Logs** | `/audit-logs` | Pencatatan rekam jejak aktivitas user |

### Referensi Detail Per Modul

Setiap modul memiliki dokumen detail di direktori `docs/`. **Wajib dibaca sebelum mengimplementasi modul apapun** — berisi fitur lengkap, field data, workflow, dan catatan dari client.

| # | Modul | File Referensi |
|---|-------|---------------|
| 1 | Dashboard | `docs/01-dashboard.md` |
| 2 | Login / Auth | `docs/02-login.md` |
| 3 | Shipment Monitor | `docs/03-shipment-monitor.md` |
| 4 | Market Price | `docs/04-market-price.md` |
| 5 | Sales Monitor | `docs/05-sales-monitor.md` |
| 6 | Forecast Sales & Projects | `docs/06-forecast-sales-projects.md` |
| 7 | Outstanding Payment | `docs/07-outstanding-payment.md` |
| 8 | Sources & Supplier | `docs/08-sources-supplier.md` |
| 9 | Quality Control | `docs/09-quality-control.md` |
| 10 | Blending Simulator | `docs/10-blending.md` |
| 11 | Meetings & MOM | `docs/11-meetings.md` |
| 12 | AI Excel Agent | `docs/12-ai-agent.md` |
| 13 | Document Drive | `docs/13-document-drive.md` |
| 14 | Partners & Directory | `docs/14-directory.md` |
| 15 | Transshipment & Freight | `docs/15-transshipment.md` |
| 16 | Tasks | `docs/16-tasks.md` |
| 17 | Profit & Loss | `docs/17-profit-loss.md` |
| 18 | Expenses | `docs/18-expenses.md` |
| 19 | User Management | `docs/19-user-management.md` |
| 20 | Production Readiness | `docs/20-production-readiness.md` |
| 21 | Audit Logs | `docs/21-audit-logs.md` |

> **Rule:** Setiap kali akan mengimplementasi sebuah modul, baca `docs/[XX]-[modul].md` yang relevan **sebelum** menulis satu baris kode. Jika ada konflik antara `docs/` dan SRS di `docs_rewrite/`, SRS (`docs_rewrite/SRS_XX_*.md`) menang karena lebih up-to-date.

---

## 8. High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                      │
│  ┌───────────┐  ┌───────────┐  ┌──────────────────────┐ │
│  │ Next.js   │  │ React     │  │ UI Components        │ │
│  │ App Router│  │ Query +   │  │ (TanStack Table,     │ │
│  │ (Pages)   │  │ Zustand   │  │  Virtual, Recharts,  │ │
│  │           │  │ (UI only) │  │  jsPDF, Forms)       │ │
│  └─────┬─────┘  └─────┬─────┘  └──────────┬───────────┘ │
│        │              │                     │             │
│        └──────────────┼─────────────────────┘             │
│                       │                                   │
│              ┌────────▼────────┐                          │
│              │ React Query     │                          │
│              │ Cache (5-15min) │                          │
│              └────────┬────────┘                          │
├───────────────────────┼───────────────────────────────────┤
│                  API LAYER                                │
│  ┌────────────────────┼────────────────────────────────┐  │
│  │     Next.js API Routes (/api/*)                     │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐            │  │
│  │  │ Auth     │ │ RBAC     │ │ Audit    │            │  │
│  │  │ Middleware│ │ Guard    │ │ Logger   │            │  │
│  │  └──────────┘ └──────────┘ └──────────┘            │  │
│  │                                                      │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │ Upstash Redis Cache (1-5min)                 │  │  │
│  │  └────────────────┬─────────────────────────────┘  │  │
│  └───────────────────┼────────────────────────────────┘  │
│                      │                                   │
├──────────────────────┼───────────────────────────────────┤
│                  DATA LAYER                               │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐   │
│  │ Prisma ORM   │  │ File Storage │  │ External APIs │   │
│  │ (PostgreSQL  │  │ (Supabase    │  │ (Groq AI)     │   │
│  │ + Pooler)    │  │  Storage)    │  │               │   │
│  └──────────────┘  └──────────────┘  └───────────────┘   │
└───────────────────────────────────────────────────────────┘
```

**Architecture Improvements di v2:**

1. **Three-Tier Caching:**
   - React Query cache di client (5-15 menit)
   - Upstash Redis di edge (1-5 menit)
   - PostgreSQL sebagai source of truth

2. **Connection Pooler:**
   - Semua database connections melalui pooler (PgBouncer/Supabase)
   - Mencegah connection exhaustion di serverless environment

3. **State Separation:**
   - Server state → React Query
   - UI state → Zustand (per-modul, minimal)

4. **Query Optimization:**
   - Prisma include + select (tidak fetch semua fields)
   - Pagination mandatory untuk list endpoints
   - N+1 query elimination

---

## 9. End-to-End Business Flow

```mermaid
flowchart LR
    A[Market Price Update] --> B[Forecast Sales / Offer]
    B --> C{CEO Approval}
    C -->|Approved| D[Generate FCO]
    C -->|Rejected| B
    D --> E[Buyer Feedback]
    E -->|Deal| F[Create Shipment]
    E -->|Failed| G[Record Reason]
    F --> H[Source Confirmation]
    H --> I[Quality Check]
    I --> J[Issue SI]
    J --> K[Shipment Execution]
    K --> L[Document Processing]
    L --> M[Payment Tracking]
    M --> N{Closing Checklist}
    N -->|Pass| O[Shipment Closed]
    N -->|Fail| P[Resolve Blockers]
    P --> N
    O --> Q[P&L Calculation]
```

### Step-by-Step

| Step | Modul | Owner | Input | Output |
|------|-------|-------|-------|--------|
| 1 | Market Price | Sales/Admin | ICI, NEWC, HBA, MGO, FX rate | Price reference |
| 2 | Forecast Sales | Sales/Traffic | Buyer, qty, harga, laycan, spec, supplier candidates | Offer profile |
| 3 | Forecast Sales | CEO | Review offer | Approved / Rejected / Revision |
| 4 | Forecast Sales | Sales/Traffic | Data offer → FCO template | FCO PDF |
| 5 | Forecast Sales | Sales/Traffic | Kirim FCO ke buyer | Buyer feedback |
| 6 | Shipment Monitor | System + Sales | Auto-create dari deal confirmed | Shipment ID |
| 7 | Source | Source Team | Supplier, IUP, stock, cargo readiness | Source submitted |
| 8 | Quality | Quality Team | QC, PSI, COA POL, COA POD | Quality status |
| 9 | Shipment Monitor | Sales/Traffic | Generate SI per shipment | SI PDF |
| 10 | Shipment Monitor | Sales/Traffic | Nomination, loading, BL, transit, discharge | Shipment progress |
| 11 | Document Checklist | Per owner | Upload docs, status, tanggal | Docs controlled |
| 12 | Outstanding Payment | Sales/Finance | Invoice, due date, payment proof | Payment status |
| 13 | Shipment Monitor | Sales/Traffic | Final qty, docs, quality, payment check | Shipment closed |
| 14 | P&L | Management | Auto-pull data | Margin report |

---

## 10. RBAC Summary

### Access Matrix Overview

| Modul | CEO/DIRUT | C-Level | Traders | Traffic | Source | Quality | Admin | Finance |
|-------|-----------|---------|---------|---------|--------|---------|-------|---------|
| Dashboard | Full + Restricted | Full | Standard | Standard | Standard | Standard | Limited | Limited |
| Market Price | Read | Read | Read | Read | Read | Read | Read/Write | Read |
| Forecast Sales | Approve | Approve | Read/Write | Read/Write | Read | Read | Read | Read |
| Sales Monitor | Read | Read/Approve | Read/Write | Read | Read | Read | Read/Write | Read |
| Shipment Monitor | Read | Read/Approve | Read/Write | Read/Write | Read | Read | Read/Write | Read |
| Source | Read | Read | Read | Read | Read/Write | Read | Read | Read |
| Quality | Read | Read/Approve | Read | Read | Read | Read/Write | Read | Read |
| Outstanding Payment | Read | Read | Read/Write | Read | - | - | Read | Read/Write |
| P&L | Full | Read | Restricted | - | - | - | - | Read |
| User Management | Full | - | - | - | - | - | - | - |
| Audit Logs | Full | Read | - | - | - | - | - | - |

### Restricted Access Rules

- **Revenue, Gross Profit, Margin, P&L** — Hanya CEO, DIRUT, ASS_DIRUT, COO
- **User Management** — Hanya CEO
- **Audit Logs** — Hanya executive level + admin
- **Approval Center** — CEO untuk FCO, SI early, SI revision, source change

---

## 11. Glossary

| Istilah | Definisi |
|---------|----------|
| **GAR** | Gross As Received — nilai kalori batubara |
| **NAR** | Net As Received — nilai kalori setelah dikurangi moisture |
| **TM** | Total Moisture — kadar air total |
| **IM** | Inherent Moisture — kadar air bawaan |
| **TS** | Total Sulphur — kadar belerang |
| **ASH** | Ash Content — kadar abu |
| **VM** | Volatile Matter — zat terbang |
| **HGI** | Hardgrove Grindability Index — indeks kekerasan |
| **ADB** | Air Dried Basis — basis pengeringan udara |
| **ICI** | Indonesian Coal Index — indeks harga batubara Indonesia |
| **NEWC** | Newcastle Coal Index — indeks harga batubara Newcastle |
| **HBA** | Harga Batubara Acuan — harga referensi pemerintah Indonesia |
| **HPB** | Harga Patokan Batubara — harga patokan per kualitas |
| **FCO** | Full Corporate Offer — dokumen penawaran resmi |
| **SI** | Shipping Instruction — instruksi pengiriman |
| **BL** | Bill of Lading — dokumen pengiriman kapal |
| **COA** | Certificate of Analysis — sertifikat hasil analisis lab |
| **POL** | Port of Loading — pelabuhan muat |
| **POD** | Port of Discharge — pelabuhan bongkar |
| **NOR** | Notice of Readiness — pemberitahuan kapal siap |
| **ETA** | Estimated Time of Arrival — perkiraan waktu tiba |
| **IUP** | Izin Usaha Pertambangan — izin tambang |
| **RKAB** | Rencana Kerja dan Anggaran Biaya — rencana kerja tambang |
| **COB** | Coal on Barge — batubara di atas tongkang |
| **MV** | Mother Vessel — kapal induk |
| **TB** | Tug Boat — kapal tarik |
| **BG** | Barge — tongkang |
| **PEB** | Pemberitahuan Ekspor Barang — dokumen ekspor |
| **LHV** | Laporan Hasil Verifikasi — laporan verifikasi |
| **DSR** | Draught Survey Report — laporan survei muat |
| **SKAB** | Surat Keterangan Asal Barang — surat asal barang |
| **KYC** | Know Your Customer — verifikasi identitas supplier |
| **PSI** | Pre-Shipment Inspection — inspeksi sebelum pengiriman |
| **FOB** | Free on Board — pengiriman sampai pelabuhan muat |
| **CIF** | Cost, Insurance, and Freight — harga termasuk asuransi dan freight |
| **CFR** | Cost and Freight — harga termasuk freight |
| **FAS** | Free Alongside Ship — pengiriman sampai sisi kapal |
| **DP** | Down Payment — uang muka |
| **MOM** | Minutes of Meeting — notulen rapat |
| **PBM** | Perusahaan Bongkar Muat — perusahaan stevedoring |
| **PNBP** | Penerimaan Negara Bukan Pajak — biaya non-pajak negara |
| **SPAL** | Surat Perjanjian Angkutan Laut — kontrak angkutan laut |
| **PPh** | Pajak Penghasilan — pajak pendapatan |
| **RBAC** | Role-Based Access Control — kontrol akses berbasis peran |
| **SRS** | Software Requirements Specification — spesifikasi kebutuhan perangkat lunak |
| **PRD** | Product Requirements Document — dokumen kebutuhan produk |

---

## 12. Konvensi Dokumen

### Naming Convention

- **Requirement ID**: `FR-[MODULE]-[NUMBER]` (Functional Requirement)
- **Business Rule ID**: `BR-[MODULE]-[NUMBER]`
- **Acceptance Criteria ID**: `AC-[MODULE]-[NUMBER]`
- **Workflow ID**: `WF-[MODULE]-[NUMBER]`

### Module Code

| Code | Modul |
|------|-------|
| DASH | Dashboard |
| AUTH | Authentication |
| SHIP | Shipment Monitor |
| MKT | Market Price |
| SAL | Sales Monitor |
| FS | Forecast Sales |
| PAY | Outstanding Payment |
| SRC | Sources & Supplier |
| QC | Quality Control |
| BLD | Blending Simulator |
| MTG | Meetings |
| AI | AI Excel Agent |
| DOC | Document Drive |
| DIR | Directory |
| TSH | Transshipment |
| TSK | Tasks |
| PL | Profit & Loss |
| EXP | Expenses |
| USR | User Management |
| PRD | Production Readiness |
| AUD | Audit Logs |

---

## 13. Ponytail AI Development Methodology

### Setup Instructions

**Install Ponytail (Kiro IDE):**

```bash
# Step 1: Add marketplace
/plugin marketplace add DietrichGebert/ponytail

# Step 2: Install plugin (send as separate message)
/plugin install ponytail@ponytail
```

### Ponytail Commands

| Command | Usage | Purpose |
|---------|-------|---------|
| `/ponytail` | Show current mode | Check active level |
| `/ponytail lite` | Moderate optimization | Basic YAGNI checks |
| `/ponytail full` | **Default (recommended)** | Full ladder (YAGNI → stdlib → platform → one-liner) |
| `/ponytail ultra` | Maximum optimization | For refactoring bloated code |
| `/ponytail off` | Disable | Temporary disable |
| `/ponytail-review` | Review current diff | Deteksi over-engineering sebelum commit |
| `/ponytail-audit` | Audit entire codebase | Scan full repo untuk bloat |
| `/ponytail-debt` | Show deferred shortcuts | Harvest `ponytail:` comments |
| `/ponytail-help` | Quick reference | Command help |

### Development Workflow dengan Ponytail

```
1. Set mode: /ponytail full

2. Develop feature:
   - AI akan otomatis apply ladder:
     • Does this need to exist? (YAGNI)
     • Already in codebase? (reuse)
     • Stdlib has it? (use built-in)
     • Native platform? (HTML5, CSS3, Browser API)
     • Installed dependency? (leverage existing)
     • Can be one line? (terseness)
     • Minimum that works (no premature abstraction)

3. Pre-commit review:
   /ponytail-review
   
   Output: List of over-engineered code untuk di-refactor

4. Before merge/PR:
   /ponytail-audit
   
   Output: Full codebase bloat report

5. Periodic maintenance:
   /ponytail-debt
   
   Output: Technical shortcuts yang perlu di-address
```

### Ponytail Rules untuk CoalTrade OS

**Prinsip Inti:**

1. **YAGNI (You Aren't Gonna Need It)**
   - Jangan buat abstraction layer kecuali 3+ use cases nyata
   - Jangan buat wrapper component kecuali ada custom logic
   - Jangan buat utility function untuk operation yang cuma dipanggil 1x

2. **Reuse Before Write**
   - Cek `shared/components` sebelum buat component baru
   - Cek `shared/hooks` sebelum buat custom hook baru
   - Cek existing API client patterns sebelum buat baru

3. **Platform First**
   ```tsx
   // ❌ Install library untuk date picker
   import DatePicker from 'react-datepicker';
   
   // ✅ Native browser has one (ponytail: browser has one)
   <input type="date" />
   
   // ❌ Install library untuk color picker
   import ColorPicker from 'react-color';
   
   // ✅ Native (ponytail: browser has one)
   <input type="color" />
   ```

4. **Leverage Dependencies**
   ```typescript
   // ❌ Manual pagination logic (300 lines)
   const [page, setPage] = useState(1);
   const [data, setData] = useState([]);
   // ... banyak useEffect, loading state, error handling
   
   // ✅ React Query handles it (ponytail: installed dependency)
   const { data, isLoading } = useQuery({
     queryKey: ['shipments', page],
     queryFn: () => fetchShipments(page),
   });
   ```

5. **One-Liner When Possible**
   ```typescript
   // ❌ Helper function untuk 1 operasi
   function formatCurrency(value: number) {
     return new Intl.NumberFormat('id-ID', {
       style: 'currency',
       currency: 'IDR'
     }).format(value);
   }
   
   // ✅ Inline (ponytail: one line)
   {new Intl.NumberFormat('id-ID', { 
     style: 'currency', currency: 'IDR' 
   }).format(value)}
   
   // ✅ OK to extract jika dipakai 5+ kali di banyak file
   // (then it passes "reuse" rung)
   ```

6. **No Premature Abstraction**
   ```typescript
   // ❌ Generic reusable "DataService" (YAGNI)
   class DataService<T> {
     async get(id: string): Promise<T> { ... }
     async list(filters: Filter): Promise<T[]> { ... }
     async create(data: Partial<T>): Promise<T> { ... }
     // 500 lines of generic CRUD logic
   }
   
   // ✅ Direct API calls (ponytail: does this need to exist? → no)
   const shipment = await prisma.shipment.findUnique({ 
     where: { id } 
   });
   ```

### Safe Guards (Never Skip)

Ponytail **TIDAK pernah mengorbankan:**

- ✅ Input validation (Zod schema)
- ✅ Error handling (try-catch, error boundaries)
- ✅ Security (auth checks, RBAC, SQL injection prevention)
- ✅ Accessibility (ARIA labels, keyboard navigation)
- ✅ Data loss prevention (confirmation modals untuk delete)

### Example: Ponytail-Optimized Component

**❌ BURUK (Over-Engineered):**

```tsx
// 450 lines component dengan abstraction layer
import { useShipmentDataService } from '@/services/ShipmentDataService';
import { ShipmentTablePresenter } from '@/presenters/ShipmentTablePresenter';
import { ShipmentTableView } from '@/views/ShipmentTableView';
import { DataTableAdapter } from '@/adapters/DataTableAdapter';
// ... 20+ imports

export function ShipmentMonitor() {
  const service = useShipmentDataService();
  const presenter = new ShipmentTablePresenter(service);
  const adapter = new DataTableAdapter(presenter);
  
  // 400 lines of abstraction layer
}
```

**✅ BAGUS (Ponytail-Optimized):**

```tsx
// 80 lines component, direct & clear
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '@/shared/components/DataTable';

export function ShipmentMonitor() {
  const { data, isLoading } = useQuery({
    queryKey: ['shipments'],
    queryFn: fetchShipments,
  });

  if (isLoading) return <Skeleton />;

  return (
    <DataTable
      columns={shipmentColumns}
      data={data}
      onRowClick={(row) => router.push(`/shipment/${row.id}`)}
    />
  );
}
```

**Penghematan:**
- 450 lines → 80 lines (82% reduction)
- 20+ dependencies → 3 dependencies
- 5 abstraction layers → 0 abstraction layers
- Maintainability: ⬆️ (lebih mudah dibaca)
- Performance: ⬆️ (less overhead)

### When to Break Ponytail Rules

Ponytail adalah **guideline, bukan dogma**. OK untuk break rules jika:

1. **Security requirement:** Custom encryption, RBAC logic yang kompleks
2. **Business domain complexity:** Blending calculation, P&L formula yang spesifik
3. **Third-party integration:** Wrapper untuk API eksternal yang unstable
4. **Performance critical:** Custom optimization untuk 10k+ rows rendering

**Cara break rules dengan benar:**

```typescript
// ponytail: custom logic needed for coal blending calculation
// JUSTIFICATION: Domain-specific weighted average formula
// that handles TM, ASH, TS, GAR interaction uniquely

function calculateBlendedQuality(cargos: Cargo[]): BlendedQuality {
  // Complex 150-line calculation
  // Not available in stdlib or existing dependencies
}
```

### Metrics Tracking

Track Ponytail impact per PR:

```bash
# Before commit
git diff --stat

# After ponytail-review dan refactor
git diff --stat

# Expected reduction: 30-60% LOC pada feature baru
# Expected reduction: 70-90% LOC pada refactoring existing bloat
```

**Target KPIs untuk Rewrite:**

- Average component size: **< 200 lines** (v1 avg: 800+ lines)
- Code reuse ratio: **> 60%** (shared components usage)
- Bundle size: **< 500 KB** initial load (gzip)
- Time to Interactive: **< 2s** (lighthouse)

---

## 14. UI / Frontend Design Rules

### Design System — Meridian (Stisla)

CoalTrade OS v2 menggunakan **Meridian** sebagai base template admin panel, dibangun di atas **Stisla** framework dengan **Tailwind CSS v4** dan **Inter** sebagai font utama.

**Source:** `C:\Users\Glooms\Downloads\CoalOS\meridian\`

### Komponen yang Tersedia (Reuse First)

Sebelum membuat komponen baru, cek apakah sudah ada di Meridian:

| Komponen | File Referensi | Digunakan Di |
|----------|---------------|--------------|
| Sidebar + Navbar | `index.html` | Layout semua modul |
| Data Table (sortable, selectable) | `orders.html`, `customers.html` | Semua list view |
| Form (input, select, textarea) | `order-new.html`, `product-new.html` | Semua form input |
| Cards + Stat Cards | `index.html` | Dashboard, summary widgets |
| Badges + Indicators | `index.html` | Status, alert labels |
| Charts (ApexCharts) | `index.html`, `reports.html` | Dashboard, P&L, Market Price |
| Popover + Notification | `index.html` | Notifikasi, message panel |
| Profile / User Menu | `index.html` | Navbar user dropdown |
| Error Pages (403, 404, 500) | `403.html`, `404.html`, `500.html` | Error handling pages |
| Login / Auth | `login.html`, `forgot.html` | Auth module |
| Timeline | `index.html` (Recent Activity) | Audit logs, activity feed |
| Avatar + Media | `index.html` | User list, directory |
| Skeleton / Loading | Stisla built-in | Loading states |

### Template Mapping ke CoalTrade OS Modules

**Gunakan langsung (template sesuai):**

| Meridian Template | CoalTrade OS Module |
|-------------------|---------------------|
| `index.html` (Dashboard) | Dashboard — widget layout, stat cards, recent activity |
| `orders.html` (table + filter + pagination) | Shipment Monitor list, Sales Monitor, Forecast Sales list |
| `order-detail.html` (detail view + tabs) | Shipment detail, Source detail, Quality detail |
| `order-new.html` (form + line items) | Create Shipment, Create Forecast, Add Source |
| `customers.html` (contact list) | Partners & Directory, Supplier list |
| `reports.html` (charts + metrics) | Market Price, P&L, Expenses |
| `profile.html` | User profile, User Management |
| `settings.html` | System settings, Production Readiness |
| `login.html` | Login page |

**Butuh desain baru** (tidak ada template yang relevan):

| CoalTrade OS Module | Alasan | Pendekatan |
|---------------------|--------|------------|
| Blending Simulator | Input multi-cargo + weighted average calculator | Custom layout, ikuti card + form style Meridian |
| Quality Control multi-stage | Multi-tab workflow QC → PSI → COA POL → COA POD | Extend order-detail tabs pattern |
| Kanban Tasks Board | Drag-and-drop kanban | Custom layout, ikuti warna + typography |
| AI Excel Agent | Chat-like interface | Custom layout, card + media style |
| Shipment sub-tabs (SI, BCL, Source Change) | Complex nested tabs | Extend order-detail pattern |

### Design Rules

1. **Typography — Inter (wajib konsisten)**
   ```css
   /* Sudah di-load di layout, jangan tambah font lain */
   font-family: 'Inter', sans-serif;
   
   /* Gunakan class yang sudah ada */
   .text-xs        /* 12px — meta, label kecil */
   .text-sm        /* 14px — body, tabel */
   .text-base      /* 16px — default */
   .text-lg        /* 18px — sub-heading */
   .text-eyebrow   /* uppercase tracking, label kategori */
   .font-medium    /* 500 */
   .font-semibold  /* 600 */
   ```

2. **Color — CSS Variables dari Stisla (jangan hardcode hex)**
   ```css
   var(--color-primary)    /* Brand blue */
   var(--color-success)    /* Green — completed, approved */
   var(--color-warning)    /* Amber — pending, caution */
   var(--color-danger)     /* Red — error, rejected, overdue */
   var(--color-info)       /* Blue — informational */
   var(--color-foreground) /* Text utama */
   var(--color-muted-foreground) /* Text sekunder */
   ```

3. **Dark Mode — Sudah built-in**
   - Template menggunakan `data-theme="light/dark"` di `<html>`
   - Simpan preference ke `localStorage` key `stisla-theme`
   - Jangan hardcode warna — selalu pakai CSS variables

4. **Charts — ApexCharts (sudah included)**
   ```javascript
   // ✅ Pakai ApexCharts yang sudah di-load via CDN
   // Lihat contoh di assets/js/charts.js
   
   // ❌ Jangan tambah library chart lain (Recharts, Chart.js)
   // kecuali ada kebutuhan spesifik yang tidak bisa dipenuhi ApexCharts
   ```

5. **Icons — Solar Icon Set (inline SVG)**
   - Template menggunakan **Solar** icons (CC BY 4.0) sebagai inline `<svg>`
   - Tidak perlu icon library, tidak perlu CDN
   - Cari icon di: https://icon-sets.iconify.design/solar/
   - Copy SVG markup langsung ke HTML/JSX
   - Gunakan `fill="currentColor"` atau `stroke="currentColor"` agar icon mengikuti warna tema

6. **Layout Grid — Tailwind CSS**
   ```html
   <!-- Template menggunakan 12-column grid -->
   <div class="grid grid-cols-12 gap-4">
     <div class="col-span-12 xl:col-span-8">...</div>
     <div class="col-span-12 xl:col-span-4">...</div>
   </div>
   ```

7. **Responsiveness — Mobile-first**
   - Sidebar auto-collapse di mobile
   - Gunakan `hidden lg:flex` untuk elemen desktop-only
   - Breakpoints: `sm:` (640px), `lg:` (1024px), `xl:` (1280px)

### Illustrations (Stisla / Nauval)

Asset ilustrasi tersedia dari **Stisla Illustrations (Beta)** — recolorable SVG spot illustrations.

#### Cara Kerja Asset Ilustrasi

**Rule (urutan wajib):**
1. **Cek tabel Available dulu** — jika ada yang cocok, minta SVG ke user: *"Butuh ilustrasi [Nama], tolong paste SVG-nya"*
2. **Jika tidak ada yang cocok** → pakai Solar icon sebagai placeholder sementara, catat di tabel Custom Icons Needed
3. **Jangan install library icon baru** — Solar sudah tersedia, cukup

#### Available Illustrations (Tinggal Minta SVG)

| Nama | Kegunaan di CoalTrade OS |
|------|--------------------------|
| `Folder` | Document Drive empty state |
| `No results` | Search/filter tidak ada hasil |
| `No messages` | Notifikasi kosong |
| `Empty` | List kosong (shipments, forecasts) |
| `No events` | Meeting list kosong |
| `404` | 404 error page |
| `No connection` | Offline / API error state |
| `Upload` | Document upload area |
| `Trash` | Konfirmasi delete |
| `Get started` | Onboarding, production readiness |
| `No data` | Chart tanpa data, P&L kosong |
| `Locked` | Akses ditolak / RBAC block |
| `Success` | Shipment closed, approval granted |
| `Warning` | Quality warning, payment overdue |
| `Celebrate` | Deal confirmed, shipment completed |
| `Secure` | Auth, security notice |
| `Notifications` | Notification empty state |
| `Settings` | Settings, production readiness |
| `Media` | Document preview |
| `Chat` | AI Agent, MOM chat |

#### Custom Icons Needed (Belum Ada di Stisla)

Ilustrasi ini tidak tersedia di Stisla. Gunakan Solar icon sebagai placeholder selama implementasi, tandai dengan komentar `{/* TODO: ganti dengan custom illustration [nama] */}`.

| # | Ilustrasi | Modul | Deskripsi | Solar Placeholder |
|---|-----------|-------|-----------|------------------|
| 1 | Kapal Kargo sedang berlayar | Shipment Monitor | Mother vessel di laut, empty state shipment aktif | `solar:ship-bold` |
| 2 | Tongkang (Barge) di sungai | Shipment Monitor | Barge transport, barge assignment section | `solar:waterdrops-bold` |
| 3 | Tumpukan Batubara | Dashboard, Sources | Material batubara, source empty state | `solar:layers-bold` |
| 4 | Timbangan / Survei Muatan | Quality Control | Draft survey / timbangan kargo, QC empty state | `solar:scale-bold` |
| 5 | Dermaga / Pelabuhan | Transshipment | Port illustration, freight empty state | `solar:map-point-bold` |
| 6 | Blending / Mixing | Blending Simulator | Dua material dicampur, simulator empty state | `solar:test-tube-bold` |
| 7 | Bundle Dokumen Ekspor | Document Drive | Stack dokumen shipping (BL, SI, COA) | `solar:document-bold` |

---

## 15. Execution Docs Rules

### Tujuan

Setiap eksekusi — implementasi SRS, refactoring modul, setup infrastruktur, atau perubahan arsitektur — **WAJIB dicatat** di Execution Docs. Ini adalah "flight log" dari seluruh proses rewrite agar:

1. **AI handover** tidak kehilangan context — AI baru bisa langsung lanjut tanpa re-read semua file
2. **Tidak ada code penumpukan** — jelas apa yang sudah dikerjakan, apa yang belum
3. **Debugging lebih cepat** — tahu kapan dan kenapa perubahan dilakukan
4. **Tim onboarding** — developer baru tahu status project tanpa tanya

### Lokasi File

```
docs_rewrite/
  EXECUTION_LOG.md          ← Log utama semua eksekusi (wajib ada)
  execution/
    EXEC_001_setup.md       ← Detail eksekusi per task (opsional, untuk task besar)
    EXEC_002_dashboard.md
    EXEC_003_shipment.md
    ...
```

### Format Entry di EXECUTION_LOG.md

Setiap entry harus menggunakan format ini:

```markdown
## [EXEC-XXX] Nama Task
**Tanggal:** YYYY-MM-DD
**Status:** ✅ Done | 🔄 In Progress | ⏸ Blocked | ❌ Cancelled
**Module:** [Module Code] — Nama Modul
**Tipe:** SRS Implementation | Refactor | Setup | Bugfix | Feature | Hotfix

### Yang Dikerjakan
- [Bullet list perubahan konkrit]
- File yang dibuat: `path/to/file.tsx`
- File yang dimodifikasi: `path/to/other.tsx`
- File yang dihapus: `path/to/old.tsx`

### Keputusan Teknis
- [Alasan kenapa pendekatan X dipilih vs Y]

### Dependensi
- Bergantung pada: EXEC-001
- Dibutuhkan oleh: EXEC-005

### Known Issues / Catatan
- [Hal yang perlu diperhatikan atau follow-up]
```

### Rules

1. **Log sebelum eksekusi dimulai** — buat entry dengan status `🔄 In Progress`
2. **Update segera setelah selesai** — ubah status ke `✅ Done`, lengkapi file list
3. **Setiap file baru/modified wajib dicatat** — path lengkap relatif dari root project
4. **Satu entry per task/SRS** — jangan gabung banyak modul dalam satu entry
5. **Keputusan teknis wajib dicatat** — kenapa pakai React Query bukan SWR, kenapa struktur tabel X, dll.
6. **AI yang mengerjakan wajib menulis log** — ini bukan optional, ini mandatory

### Contoh Entry

```markdown
## [EXEC-003] Shipment Monitor — SRS Implementation
**Tanggal:** 2026-07-15
**Status:** ✅ Done
**Module:** SHIP — Shipment Monitor
**Tipe:** SRS Implementation

### Yang Dikerjakan
- Implementasi halaman list shipment dengan pagination server-side
- File dibuat:
  - `src/modules/shipment-monitor/components/ShipmentTable.tsx`
  - `src/modules/shipment-monitor/hooks/useShipments.ts`
  - `src/modules/shipment-monitor/api/shipment-api.ts`
  - `src/modules/shipment-monitor/store/shipment-ui-store.ts`
  - `src/app/api/shipments/route.ts`
- File dimodifikasi:
  - `src/app/(dashboard)/shipment-monitor/page.tsx`

### Keputusan Teknis
- Menggunakan TanStack Table v8 untuk sorting/filtering karena sudah ada di dependencies
- Pagination server-side (bukan client-side) karena data bisa 1000+ rows
- Status filter menggunakan URL searchParams agar bisa di-share via URL

### Dependensi
- Bergantung pada: EXEC-001 (project setup), EXEC-002 (shared components)

### Known Issues
- Sub-tab (Quality, Source, Documents) belum diimplementasi — jadwal EXEC-004
```

### Kapan Buat Execution Log

| Event | Wajib Log? |
|-------|-----------|
| Implementasi SRS modul baru | ✅ Ya |
| Refactoring komponen existing | ✅ Ya |
| Setup infrastruktur (Redis, DB, dll.) | ✅ Ya |
| Bug fix minor (< 5 lines) | ❌ Tidak perlu |
| Update styling/warna | ❌ Tidak perlu |
| Perubahan konfigurasi (env, next.config) | ✅ Ya |
| Database migration | ✅ Ya |
| Penambahan dependency baru | ✅ Ya, catat alasannya |

---

*Dokumen ini menjadi referensi utama untuk seluruh tim development dalam memahami konteks, arsitektur, dan metodologi development CoalTrade OS Rewrite.*

---

## 16. Layout Fidelity Rules (Client-Approved Screenshots)

### Prinsip Utama

Layout yang **sudah di-ACC oleh client** adalah **sumber kebenaran tertinggi**. Tidak boleh ada deviation tanpa explicit approval baru dari client.

**Hierarki prioritas layout:**

```
1. Client-approved screenshots  →  WAJIB diikuti 1:1
2. Meridian template            →  Dipakai sebagai base/komponen
3. Desain baru                  →  Hanya jika screenshot tidak cover use case tersebut
```

Template Meridian dipakai sebagai **foundation** (komponen, warna, spacing), tapi jika layout screenshot client berbeda dari template default Meridian — **screenshot client menang**.

### Lokasi Screenshots

```
docs/screenshots/
  01-Dashboard.png
  02-Drive Documents.png
  03-Unfined Directory.png
  04-Forecast Sales.png
  05-Shipment Monitor.png
  06-Transhipment.png
  07-Source.png
  08-Quality (When Click Add Result).png
  09-Blending Simulation.png
  10-Sales Monitor.png
  11-Market Price.png
  12-Meeting.png
  13-My Task.png
  14-P&L.png
  15-User Management.png
  16-Audit Logs.png
  Notification.png
```

### Rules Per Implementasi

Setiap kali mengimplementasi sebuah modul/halaman, AI **wajib**:

1. **Baca screenshot yang relevan** sebelum menulis satu baris JSX
2. **Identifikasi layout struktur** — grid, panel kiri/kanan, tab, card layout, dll.
3. **Identifikasi komponen kritis** — tabel, chart, badge status, filter bar, action buttons
4. **Cocokkan warna & badge** — status badges, severity colors, harus sama persis dengan screenshot
5. **Cocokkan hierarki typography** — heading besar, subheading, label kecil

### Dashboard — Highest Fidelity Required

Dashboard (`01-Dashboard.png`) adalah halaman **paling kritis** — client sudah approve layout ini dan merupakan landing page utama. Implementasi harus **pixel-perfect** terhadap screenshot.

Hal yang wajib diperhatikan di Dashboard:
- Susunan metric cards (KPI boxes) — jumlah card, urutan, isi metric
- Layout chart — posisi relatif chart satu sama lain
- Color coding status shipment
- Sidebar navigation — item urutan, icon, active state
- Header bar — user avatar, notification bell, search

### Cara Kerja Saat Implementasi

```
Before writing any layout code:
  1. Open docs/screenshots/<module>.png
  2. Identify: grid structure, panels, key components
  3. Match: table columns, badge colors, button positions
  4. Use Meridian components that match the screenshot
  5. If Meridian default conflicts with screenshot → override, document why

During implementation:
  - Comment: "// Layout per approved screenshot 05-Shipment Monitor.png"
  - If adding NEW UI not in screenshot → flag it, keep it minimal
```

### Deviasi yang Diizinkan

Deviasi dari screenshot **boleh** dilakukan HANYA jika:

1. **Responsive layout** — screenshot adalah desktop view; mobile adaptation boleh berbeda
2. **UX improvement** yang tidak mengubah informasi atau workflow (mis: loading skeleton)
3. **Fitur baru dari Revision Matrix** — yang belum ada di screenshot original
4. **Bug fix** — jika screenshot menunjukkan layout yang secara teknis impossible

Semua deviasi **wajib dicatat** di EXECUTION_LOG.md dengan justifikasi.

---

## 17. SRS Status Labeling Convention

### Tujuan

Setiap FR (Functional Requirement) di semua SRS file harus memiliki status label yang mencerminkan kondisi implementasi aktual di codebase. Ini memudahkan developer, AI, dan tim untuk langsung melihat mana yang sudah selesai dan mana yang masih perlu dikerjakan — tanpa harus cross-reference ke execution log.

### Format Label

Label ditulis **di akhir judul heading FR**, dengan format:

```markdown
### FR-XXX-NNN: Nama Fitur (Status: Done)
### FR-XXX-NNN: Nama Fitur (Status: Partial — keterangan singkat)
### FR-XXX-NNN: Nama Fitur (Status: Pending — keterangan singkat)
```

### Nilai Status yang Valid

| Status | Arti | Kapan Dipakai |
|--------|------|---------------|
| `(Status: Done)` | Implementasi lengkap dan terverifikasi di codebase | Route/component/API exists dan berfungsi sesuai SRS |
| `(Status: Partial)` | Sebagian diimplementasi, detail kekurangan tercantum | Feature exists tapi ada field/endpoint/behavior yang belum lengkap |
| `(Status: Pending)` | Belum diimplementasi sama sekali | Route/component tidak ditemukan di codebase |
| `(Status: Pending — Groq stub)` | Endpoint ada tapi AI integration belum aktif | Groq API belum diintegrasikan, menunggu GROQ_API_KEY |

### Format Implementation Status di Header Modul

Setiap SRS file memiliki baris `Implementation Status:` di header modul, tepat di bawah versi:

```markdown
**Versi:** 2.x
**Terakhir Diperbarui:** Juli 2026
**Implementation Status:** Done | Mostly Done — FR-XXX Pending | Partial — FR-XXX/YYY Pending | ❌ NOT IMPLEMENTED
```
  
### Rules untuk AI dan Developer

1. **Saat mengimplementasi FR** — update label di SRS dari `Pending` → `Done` atau `Partial` setelah implementasi selesai dan terverifikasi
2. **Saat audit** — verifikasi label dengan membaca codebase aktual (jangan hanya percaya execution log)
3. **Saat menemukan gap** — jika label `Done` tapi route tidak ada di codebase, update ke `Pending` dan catat di EXECUTION_LOG
4. **Jangan skip label** — setiap FR heading **wajib** punya status label; FR tanpa label dianggap belum diaudit
5. **Groq stubs** — label sebagai `(Status: Pending — Groq stub)` bukan `Done`; akan aktif setelah `GROQ_API_KEY` diset

### Contoh Lengkap

```markdown
### FR-SHIP-012: Shipping Instruction (SI) (Status: Done)

### FR-SHIP-015: Closing Checklist (Status: Partial — 4 of 8 checks implemented; quality/payment/SI checks pending)

### FR-TSH-005: Freight Cost Breakdown (Status: Pending — /api/transshipment/:id/freight-cost route not built)

### FR-MTG-003: Audio Transcription (Status: Pending — Groq stub; endpoint exists but no real transcription without GROQ_API_KEY)
```

### Referensi Gap Audit Terakhir

Gap audit terakhir dilakukan di **EXEC-035** (Juli 2026). Lihat `docs_rewrite/EXECUTION_LOG.md` untuk daftar lengkap semua Pending items beserta prioritas pengerjaan.

**Summary singkat per Juli 2026:**
- ~70% FR: `Done`
- ~9% FR: `Partial` atau Groq stub
- ~21% FR: `Pending` — belum diimplementasi
- ❌ **Approval Center (SRS_22)**: Seluruh modul tidak ada di codebase
