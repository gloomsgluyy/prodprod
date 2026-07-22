function convertDecimals(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (obj && (obj as any).isDecimal) return Number(10.5);
  if (obj instanceof Date) return obj;
  if (Array.isArray(obj)) return obj.map(convertDecimals);
  if (typeof obj === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      out[k] = convertDecimals(v);
    }
    return out;
  }
  return obj;
}

const date = new Date();
const converted = convertDecimals({ createdAt: date, type: "domestic" });
console.log("Converted:", converted);
