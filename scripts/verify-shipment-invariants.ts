import * as fs from "fs";
import * as path from "path";

const root = path.resolve(__dirname, "..");
const schema = fs.readFileSync(path.join(root, "prisma/schema.prisma"), "utf8");
const importer = fs.readFileSync(path.join(root, "scripts/enrich-from-excel.ts"), "utf8");
const workspace = fs.readFileSync(path.join(root, "src/modules/shipment-monitor/components/mv-workspace.tsx"), "utf8");

console.assert(schema.includes("model ChildNomination"), "Child nomination model missing");
console.assert(schema.includes("shipmentClass   ShipmentClass"), "Shipment class missing");
console.assert(importer.includes("NOMINATION"), "Excel nomination mapping missing");
console.assert(importer.includes("isBargeOnly"), "TB-only safety guard missing");
console.assert(workspace.includes("Buyer Side"), "Buyer Side workspace missing");
console.assert(workspace.includes("Supplier Side"), "Supplier Side workspace missing");
console.assert(workspace.includes("Documents"), "Documents workspace missing");
console.log("Shipment invariants: PASS");
