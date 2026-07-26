export interface TemplateItem {
  code: string;
  label: string;
  owner: string;
  required: boolean;
  done: boolean;
}

export const FORECAST_TEMPLATES: Record<string, TemplateItem[]> = {
  export_shipment: [
    { code: "a", label: "COPY OF LAPORAN HASIL VERIFIKASI", owner: "QC / Surveyor", required: true, done: false },
    { code: "b", label: "1 ORIGINAL DRAUGHT SURVEY REPORT", owner: "Traffic / Surveyor", required: true, done: false },
    { code: "c", label: "1 ORIGINAL SURAT KETERANGAN ASAL BARANG", owner: "Sourcing", required: true, done: false },
    { code: "d", label: "1 ORIGINAL SURAT KEBENARAN DOKUMEN", owner: "Operation", required: true, done: false },
    { code: "e", label: "1 ORIGINAL SURAT KIRIM BARANG", owner: "Operation", required: true, done: false },
    { code: "f", label: "1 ORIGINAL BUKTI BAYAR ROYALTI", owner: "Finance / Sourcing", required: true, done: false },
    { code: "g", label: "3/3 ORIGINAL BILL OF LADING ISSUED BY LOADPORT AGENT", owner: "Traffic", required: true, done: false },
    { code: "h", label: "3/3 COPIES NON NEGOTIABLE BILL OF LADING ISSUED BY LOADPORT AGENT", owner: "Traffic", required: true, done: false },
    { code: "i", label: "1 ORIGINAL AND 4 COPIES OF CERTIFICATE OF SAMPLING AND ANALYSIS ISSUED BY INDEPENDENT SURVEYOR AT LOADING PORT (IF ANY)", owner: "QC", required: true, done: false },
    { code: "j", label: "1 ORIGINAL AND 4 COPIES OF CERTIFICATE OF WEIGHT ISSUED BY INDEPENDENT SURVEYOR AT LOADING PORT (IF ANY)", owner: "QC", required: true, done: false },
    { code: "k", label: "1 ORIGINAL AND 2 COPIES OF CERTIFICATE OF DRAUGHT SURVEY REPORT BY INDEPENDENT SURVEYOR AT LOADING PORT", owner: "QC / Surveyor", required: true, done: false },
  ],
  domestic_delivery: [
    { code: "a", label: "Buyer PO and delivery schedule confirmed", owner: "Trader", required: true, done: false },
    { code: "b", label: "Supplier stock and loading window confirmed", owner: "Sourcing", required: true, done: false },
    { code: "c", label: "Transport/fleet readiness confirmed", owner: "Traffic", required: true, done: false },
    { code: "d", label: "Operational Info updated", owner: "Operation", required: true, done: false },
    { code: "e", label: "Payment terms and due date reviewed", owner: "Finance/Admin", required: true, done: false },
  ],
  spot_purchase: [
    { code: "a", label: "Supplier KYC/legal documents checked", owner: "Sourcing", required: true, done: false },
    { code: "b", label: "Coal specs and price index benchmarked", owner: "QC/Trader", required: true, done: false },
    { code: "c", label: "Purchase request submitted", owner: "Sourcing", required: true, done: false },
    { code: "d", label: "Logistics and demurrage assumptions captured", owner: "Traffic", required: true, done: false },
    { code: "e", label: "Approval decision recorded", owner: "Executive", required: true, done: false },
  ],
};

export const TEMPLATE_OPTIONS = [
  { value: "export_shipment", label: "Export Shipment" },
  { value: "domestic_delivery", label: "Domestic Delivery" },
  { value: "spot_purchase", label: "Spot Purchase" },
];
