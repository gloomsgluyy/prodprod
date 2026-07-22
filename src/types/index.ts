// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  error: string;
}

// ─── Shipment ─────────────────────────────────────────────────────────────────

export type ShipmentStatus = "upcoming" | "loading" | "in_transit" | "completed" | "cancelled";
export type ShipmentType = "export" | "domestic";

export interface ShipmentListItem {
  id: string;
  shipmentNumber: string;
  type: ShipmentType;
  buyer: string;
  buyerCountry: string | null;
  vesselName: string | null;
  bargeName: string | null;
  pol: string | null;
  qtyPlan: number | null;
  qtyLoaded: number | null;
  blDate: string | null;
  laycanStart: string | null;
  laycanEnd: string | null;
  source: string | null;
  supplier: string | null;
  status: ShipmentStatus;
  completionScore: number | null;
  // Executive-only
  salesPrice?: number | null;
  buyingPrice?: number | null;
  marginMt?: number | null;
}

// ─── Market Price ─────────────────────────────────────────────────────────────

export interface MarketPriceEntry {
  id: string;
  date: string;
  ici1: number | null;
  ici2: number | null;
  ici3: number | null;
  ici4: number | null;
  ici5: number | null;
  newcastle: number | null;
  hba: number | null;
  hba1: number | null;
  hba2: number | null;
  hba3: number | null;
  source: string;
  createdAt: string;
}

export interface MarketPriceDelta extends MarketPriceEntry {
  delta: {
    ici1: number | null;
    ici2: number | null;
    ici3: number | null;
    ici4: number | null;
    ici5: number | null;
    newcastle: number | null;
    hba: number | null;
    hba1: number | null;
    hba2: number | null;
    hba3: number | null;
  };
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export interface DashboardMetrics {
  totalShipments: number;
  activeShipments: number;
  totalVolumeMt: number;
  // Executive-only — undefined if not executive
  revenueUsd?: number;
  avgMarginMt?: number;
}

export interface BlockerAlert {
  id: string;
  category: "payment" | "quality" | "source" | "barge" | "closing" | "domestic";
  severity: "critical" | "warning" | "info";
  title: string;
  message: string;
  owner: string | null;
  dueDate: string | null;
  shipmentId: string | null;
  shipmentNumber: string | null;
  link: string;
}

export interface DocumentAgingAlert {
  shipmentId: string;
  shipmentNumber: string;
  requirementCode: string;
  label: string;
  owner: string | null;
  pic: string | null;
  hardcopyStatus: string | null;
  agingDays: number;
  severity: "critical" | "warning";
}

// ─── Forecast ────────────────────────────────────────────────────────────────

export type ForecastStatus =
  | "draft"
  | "submitted"
  | "waiting_approval"
  | "approved"
  | "rejected"
  | "revision"
  | "deal"
  | "failed"
  | "cancelled";

export interface ForecastProjectListItem {
  id: string;
  projectName: string;
  buyer: string;
  buyerCountry: string | null;
  quantity: number | null;
  laycanStart: string | null;
  laycanEnd: string | null;
  status: ForecastStatus;
  createdAt: string;
}

// ─── Task ────────────────────────────────────────────────────────────────────

export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskStatus = "todo" | "in_progress" | "review" | "done";

export interface TaskItem {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: { id: string; name: string } | null;
  dueDate: string | null;
}

// ─── Meeting ─────────────────────────────────────────────────────────────────

export interface MeetingItem {
  id: string;
  title: string;
  scheduledAt: string;
  participants: string[];
}

// ─── User ────────────────────────────────────────────────────────────────────

export interface UserListItem {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}
