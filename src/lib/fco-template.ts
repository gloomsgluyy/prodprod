import fs from "fs/promises";
import path from "path";
import PizZip from "pizzip";
import { DOMParser, XMLSerializer } from "@xmldom/xmldom";

export type FcoTemplateProfile = "mse" | "camaraderie";

const TEMPLATE_DIR = path.join(process.cwd(), "fco_template");
const TEMPLATES: Record<FcoTemplateProfile, string> = {
  mse: "26007-FCO_E_MSE-GT (3800 GAR FOBV)_Aug 26 (1).docx",
  camaraderie: "FCO.C2603-QPPL (FOBMV 4600GAR) (1).docx",
};

export function fcoTemplateName(profile: FcoTemplateProfile) { return TEMPLATES[profile]; }

export function resolveFcoTemplate(entity?: string | null, segment?: string | null): FcoTemplateProfile {
  const value = `${entity ?? ""} ${segment ?? ""}`.toLowerCase();
  return value.includes("camaraderie") || value.includes("qppl") ? "camaraderie" : "mse";
}

function replaceText(xml: string, replacements: Record<string, string>) {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const paragraphs = Array.from(doc.getElementsByTagName("w:p"));
  for (const paragraph of paragraphs) {
    const nodes = Array.from(paragraph.getElementsByTagName("w:t"));
    const source = nodes.map((node) => node.textContent ?? "").join("");
    let result = source;
    for (const [from, to] of Object.entries(replacements)) result = result.split(from).join(to);
    if (result !== source && nodes.length) {
      nodes[0].textContent = result;
      for (const node of nodes.slice(1)) node.textContent = "";
    }
  }
  return new XMLSerializer().serializeToString(doc);
}

export async function renderFcoDocx(profile: FcoTemplateProfile, replacements: Record<string, string>) {
  const source = await fs.readFile(path.join(TEMPLATE_DIR, TEMPLATES[profile]));
  const zip = new PizZip(source);
  const documentXml = zip.file("word/document.xml")?.asText();
  if (!documentXml) throw new Error("FCO template document.xml missing");

  const rendered = replaceText(documentXml, replacements);
  zip.file("word/document.xml", rendered);
  return zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
}
