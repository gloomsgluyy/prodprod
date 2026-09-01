import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { notify } from "@/lib/notify";
import type { PaginatedResponse } from "@/types";

export interface ShipmentListItem {
  id: string; shipmentNumber: string; shipmentClass?: string; type: string; buyer: string; buyerCountry: string | null;
  vesselName: string | null; bargeName: string | null; pol: string | null; pod: string | null;
  qtyPlan: number | null; qtyLoaded: number | null; qtyFinal: number | null;
  blDate: string | null; laycanStart: string | null; laycanEnd: string | null;
  source: string | null; supplier: string | null; region: string | null;
  status: string; completionScore: number | null; pic: string | null; createdAt: string; childNominationCount?: number;
  salesPrice?: number | null; buyingPrice?: number | null; marginMt?: number | null;
}

export interface ShipmentDocument {
  id: string; shipmentId: string; requirementCode: string; label: string;
  status: string; receivedDate: string | null; submittedDate: string | null;
  submittedTo: string | null; fileUrl: string | null; fileName: string | null;
  fileSize: number | null; hardcopyStatus: string | null; owner: string | null;
  pic: string | null; notes: string | null; uploadedBy: string | null;
  uploadedAt: string | null; agingDays: number | null; fileCount: number;
  files: DocumentFile[];
}

export interface DocumentFile {
  id: string;
  requirementId: string;
  sourceModule: string;
  sourceEntityId: string | null;
  title: string | null;
  originalName: string | null;
  mimeType: string | null;
  size: number | null;
  provider: string;
  bucket: string | null;
  objectKey: string | null;
  publicUrl: string | null;
  visibility: string;
  version: number;
  isDeleted: boolean;
  uploadedBy: string | null;
  uploadedAt: string;
  deletedAt: string | null;
}

export interface ShipmentDetail extends ShipmentListItem {
  projectId: string | null; product: string; iupOp: string | null;
  specGar: number | null; specTs: number | null; specAsh: number | null; specTm: number | null;
  shippingTerm: string | null; paymentTerm: string | null; etd: string | null; eta: string | null;
  freightRate: number | null; royaltyCost: number | null; taxExportCost: number | null;
  surveyCost: number | null; financeCost: number | null;
  createdBy:    { id: string; name: string };
  domHandover?: { track: string; stages: unknown }[] | null;
}

export interface SourceChange {
  id: string; currentSource: string; currentSupplier: string; newSource: string; newSupplier: string;
  requestedBy: { name: string }; requestDate: string; reasonCategory: string; reasonDetail: string;
  evidenceFileUrl: string | null; impactDescription: string;
  ceoApprovalStatus: string; ceoApprovedBy: { name: string } | null;
  ceoApprovedAt: string | null; ceoComment: string | null; activeVersion: number;
}

export interface BargeChange {
  id: string; oldBarge: string; newBarge: string; changeDatetime: string;
  changedBy: { name: string }; department: string; reasonCategory: string; reasonDetail: string;
  evidenceFileUrl: string | null; approvalRequired: boolean;
  approvedBy: { name: string } | null; status: string;
}

export interface ShipmentIssue {
  id: string; category: string; description: string; impact: string; actionPlan: string;
  pic: { id: string; name: string }; targetDate: string; status: string;
  evidenceFileUrl: string | null; resolvedAt: string | null; resolvedBy: { name: string } | null;
  createdAt: string;
}

export interface DomHandover {
  id: string; shipmentId: string; track: string; stages: unknown[]; createdAt: string;
}

export interface SI {
  id: string; siNumber: string; version: number; shipmentId: string;
  buyer: string; supplier: string; source: string; pol: string; pod: string;
  laycanStart: string; laycanEnd: string; product: string; coalSpec: unknown;
  quantity: number; tolerance: string | null; vesselBarge: string; contractReference: string;
  documentRequired: string | null; remarks: string | null;
  approvalStatus: string; approvedBy: { name: string } | null;
  approvedAt: string | null; isEarly: boolean; earlyReason: string | null; createdAt: string;
}

export interface PolTimeline {
  arrivePol: string | null; norPol: string | null; berthing: string | null;
  commenceLoading: string | null; completeLoading: string | null;
  blDate: string | null; peb: string | null; lhv: string | null;
}

export interface PodTimeline {
  etaPod: string | null; arrivePod: string | null; norPod: string | null;
  inPosition: string | null; dischargeStart: string | null; dischargeComplete: string | null;
  factoryDate: string | null;
}

interface ShipmentFilters {
  page?: number; pageSize?: number; status?: string; search?: string; region?: string; year?: string;
}

export const SHIPMENT_KEYS = {
  list:         (f: ShipmentFilters) => ["shipments", "list", f],
  detail:       (id: string)         => ["shipments", "detail", id],
  documents:    (id: string)         => ["shipments", "documents", id],
  issues:       (id: string)         => ["shipments", "issues", id],
  sourceChanges:(id: string)         => ["shipments", "source-changes", id],
  bargeChanges: (id: string)         => ["shipments", "barge-changes", id],
  si:           (id: string)         => ["shipments", "si", id],
  timelines:    (id: string)         => ["shipments", "timelines", id],
  completeness: (id: string)         => ["shipments", "completeness", id],
};

export function useShipmentList(filters: ShipmentFilters = {}) {
  const params = new URLSearchParams({
    page: String(filters.page ?? 1),
    pageSize: String(filters.pageSize ?? 25),
    ...(filters.status && filters.status !== "all" ? { status: filters.status } : {}),
    ...(filters.search ? { search: filters.search } : {}),
    ...(filters.region ? { region: filters.region } : {}),
    ...(filters.year   ? { year:   filters.year   } : {}),
  }).toString();

  return useQuery({
    queryKey: SHIPMENT_KEYS.list(filters),
    queryFn: () => api.get<PaginatedResponse<ShipmentListItem>>(`/api/shipments?${params}`),
    placeholderData: (prev) => prev,
    staleTime: 2 * 60 * 1000,
  });
}

export function useShipmentDetail(id: string) {
  return useQuery({
    queryKey: SHIPMENT_KEYS.detail(id),
    queryFn: () => api.get<{ data: ShipmentDetail }>(`/api/shipments/${id}`),
    enabled: !!id,
  });
}

export function useShipmentDocuments(id: string) {
  return useQuery({
    queryKey: SHIPMENT_KEYS.documents(id),
    queryFn: () => api.get<{ data: ShipmentDocument[] }>(`/api/shipments/${id}/documents`),
    enabled: !!id,
  });
}

export function useShipmentIssues(id: string) {
  return useQuery({
    queryKey: SHIPMENT_KEYS.issues(id),
    queryFn: () => api.get<{ data: ShipmentIssue[] }>(`/api/shipments/${id}/issues`),
    enabled: !!id,
  });
}

export function useShipmentSI(id: string) {
  return useQuery({
    queryKey: SHIPMENT_KEYS.si(id),
    queryFn: () => api.get<{ data: SI[] }>(`/api/shipments/${id}/si`),
    enabled: !!id,
  });
}

export function useShipmentTimelines(id: string) {
  return useQuery({
    queryKey: SHIPMENT_KEYS.timelines(id),
    queryFn: () => api.get<{ data: { pol: PolTimeline | null; pod: PodTimeline | null } }>(`/api/shipments/${id}/timelines`),
    enabled: !!id,
  });
}

export function useShipmentSourceChanges(id: string) {
  return useQuery({
    queryKey: SHIPMENT_KEYS.sourceChanges(id),
    queryFn: () => api.get<{ data: SourceChange[] }>(`/api/shipments/${id}/source-changes`),
    enabled: !!id,
  });
}

export function useShipmentBargeChanges(id: string) {
  return useQuery({
    queryKey: SHIPMENT_KEYS.bargeChanges(id),
    queryFn: () => api.get<{ data: BargeChange[] }>(`/api/shipments/${id}/barge-changes`),
    enabled: !!id,
  });
}

export function useCreateShipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ShipmentDetail>) =>
      api.post<{ data: ShipmentDetail }>("/api/shipments", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["shipments"] }); notify("Shipment created"); },
    onError: () => notify("Shipment create failed", "error"),
  });
}

export function useUpdateShipment(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ShipmentDetail>) =>
      api.patch<{ data: ShipmentDetail }>(`/api/shipments/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shipments", "list"] });
      qc.invalidateQueries({ queryKey: SHIPMENT_KEYS.detail(id) });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      notify("Shipment updated");
    },
    onError: () => notify("Shipment update failed", "error"),
  });
}

export function useUpdateDocument(shipmentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { requirementCode: string } & Partial<ShipmentDocument>) =>
      api.patch<{ data: ShipmentDocument }>(`/api/shipments/${shipmentId}/documents`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SHIPMENT_KEYS.documents(shipmentId) });
      qc.invalidateQueries({ queryKey: ["document-drive"] });
      notify("Document updated");
    },
    onError: () => notify("Document update failed", "error"),
  });
}

export function useAddDocumentFile(shipmentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      requirementCode: string;
      fileUrl: string;
      fileName?: string;
      fileTitle?: string;
      fileSize?: number;
      visibility?: "public" | "internal" | "critical";
    }) => api.patch<{ data: ShipmentDocument }>(`/api/shipments/${shipmentId}/documents`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SHIPMENT_KEYS.documents(shipmentId) });
      qc.invalidateQueries({ queryKey: ["document-drive"] });
      notify("File added");
    },
    onError: () => notify("File add failed", "error"),
  });
}

export function useDeleteDocumentFile(shipmentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (fileId: string) =>
      api.delete<{ data: DocumentFile }>(`/api/shipments/${shipmentId}/documents/files/${fileId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SHIPMENT_KEYS.documents(shipmentId) });
      qc.invalidateQueries({ queryKey: ["document-drive"] });
      notify("File deleted");
    },
    onError: () => notify("File delete failed", "error"),
  });
}

export function useUploadDocumentFile(shipmentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      file: File | File[];
      requirementCode: string;
      fileTitle?: string;
      visibility?: "public" | "internal" | "critical";
    }) => {
      const fd = new FormData();
      for (const file of Array.isArray(data.file) ? data.file : [data.file]) fd.append("file", file);
      fd.append("requirementCode", data.requirementCode);
      if (data.fileTitle) fd.append("fileTitle", data.fileTitle);
      fd.append("visibility", data.visibility ?? "internal");

      const res = await fetch(`/api/shipments/${shipmentId}/documents/upload`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(err.error ?? "Upload failed");
      }
      return res.json() as Promise<{ data: DocumentFile | DocumentFile[] }>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SHIPMENT_KEYS.documents(shipmentId) });
      qc.invalidateQueries({ queryKey: ["document-drive"] });
      notify("File uploaded");
    },
    onError: () => notify("Upload failed", "error"),
  });
}

/** Triggers a ZIP download for all documents in a shipment. Returns error message or null. */
export async function downloadAllDocumentsZip(shipmentId: string, shipmentNumber: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/shipments/${shipmentId}/documents/download-all`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Download failed" }));
      return err.error ?? "Download failed";
    }
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `docs-${shipmentNumber}.zip`;
    a.click();
    URL.revokeObjectURL(url);
    return null;
  } catch (e) {
    return String(e);
  }
}


export function useCreateIssue(shipmentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ShipmentIssue> & { picId: string }) =>
      api.post<{ data: ShipmentIssue }>(`/api/shipments/${shipmentId}/issues`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SHIPMENT_KEYS.issues(shipmentId) });
      qc.invalidateQueries({ queryKey: ["dashboard", "blockers"] });
      notify("Issue added");
    },
    onError: () => notify("Issue add failed", "error"),
  });
}

export function useUpdateIssue(shipmentId: string, issueId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ShipmentIssue>) =>
      api.patch<{ data: ShipmentIssue }>(`/api/shipments/${shipmentId}/issues/${issueId}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SHIPMENT_KEYS.issues(shipmentId) });
      qc.invalidateQueries({ queryKey: ["dashboard", "blockers"] });
      notify("Issue updated");
    },
    onError: () => notify("Issue update failed", "error"),
  });
}

export function useRequestSourceChange(shipmentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SourceChange>) =>
      api.post<{ data: SourceChange }>(`/api/shipments/${shipmentId}/source-changes`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: SHIPMENT_KEYS.sourceChanges(shipmentId) }); notify("Source change requested"); },
    onError: () => notify("Source change failed", "error"),
  });
}

export function useLogBargeChange(shipmentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<BargeChange>) =>
      api.post<{ data: BargeChange }>(`/api/shipments/${shipmentId}/barge-changes`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SHIPMENT_KEYS.bargeChanges(shipmentId) });
      qc.invalidateQueries({ queryKey: SHIPMENT_KEYS.detail(shipmentId) });
      notify("Barge change logged");
    },
    onError: () => notify("Barge change failed", "error"),
  });
}

export function useUpdateTimelines(shipmentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { type: "pol" | "pod" } & Record<string, unknown>) =>
      api.patch<{ data: unknown }>(`/api/shipments/${shipmentId}/timelines`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SHIPMENT_KEYS.timelines(shipmentId) });
      qc.invalidateQueries({ queryKey: SHIPMENT_KEYS.detail(shipmentId) });
      qc.invalidateQueries({ queryKey: ["shipments", "list"] });
      notify("Timeline updated");
    },
    onError: () => notify("Timeline update failed", "error"),
  });
}

export function useGenerateSI(shipmentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post<{ data: SI }>(`/api/shipments/${shipmentId}/si`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: SHIPMENT_KEYS.si(shipmentId) }); notify("SI generated"); },
    onError: () => notify("SI generation failed", "error"),
  });
}

export function useCloseShipment(shipmentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<{ data: ShipmentDetail } | { error: string; code: string; blockers: { check: string; message: string }[] }>(`/api/shipments/${shipmentId}/close`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shipments"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      notify("Shipment closed");
    },
    onError: () => notify("Shipment close failed", "error"),
  });
}

// ─── FR-SHIP-018: Commercial Reference ───────────────────────────────────────

export interface CommercialReference {
  linked: boolean;
  message?: string;
  projectId?: string;
  projectName?: string;
  buyer?: string;
  buyerCountry?: string | null;
  salesTerm?: string | null;
  targetSellingPrice?: number | null;
  priceBasis?: string | null;
  paymentTerms?: string | null;
  actualSalesPrice?: number | null;
  marginMt?: number | null;
  laycanStart?: string | null;
  laycanEnd?: string | null;
  quantity?: number | null;
  specGar?: number | null;
  specTs?: number | null;
  specAsh?: number | null;
  specTm?: number | null;
  fcoNumber?: string | null;
  fcoVersion?: number | null;
  fcoPdfUrl?: string | null;
  fcoSentDate?: string | null;
  fcoHistory?: { id: string; fcoNumber: string; version: number; action: string; pdfUrl: string | null; generatedAt: string; generatedBy: string }[];
  projectStatus?: string;
  shipmentRef?: { shippingTerm: string | null; paymentTerm: string | null; salesPrice: number | null };
}

export function useShipmentCommercialRef(id: string) {
  return useQuery({
    queryKey: ["shipments", "commercial-reference", id],
    queryFn: () => api.get<{ data: CommercialReference }>(`/api/shipments/${id}/commercial-reference`),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}
