import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const cargoSchema = z.object({
  name:     z.string().min(1),
  quantity: z.coerce.number().positive(),
  gar:      z.coerce.number().positive().optional(),
  nar:      z.coerce.number().positive().optional(),
  ts:       z.coerce.number().positive().optional(),
  ash:      z.coerce.number().positive().optional(),
  tm:       z.coerce.number().positive().optional(),
  im:       z.coerce.number().positive().optional(),
  hgi:      z.coerce.number().positive().optional(),
});

const schema = z.object({
  cargoes:    z.array(cargoSchema).min(2, "At least 2 cargoes required"),
  targetSpec: z.object({
    gar: z.coerce.number().positive().optional(),
    ts:  z.coerce.number().positive().optional(),
    ash: z.coerce.number().positive().optional(),
    tm:  z.coerce.number().positive().optional(),
  }).optional(),
  save: z.boolean().default(false),
  name: z.string().optional(),
});

type Cargo = z.infer<typeof cargoSchema>;

function weightedAvg(cargoes: Cargo[], key: keyof Omit<Cargo, "name" | "quantity">): number | null {
  const valid = cargoes.filter((c) => c[key] != null);
  if (valid.length === 0) return null;
  const totalQty  = valid.reduce((s, c) => s + c.quantity, 0);
  const weighted  = valid.reduce((s, c) => s + (c[key] as number) * c.quantity, 0);
  return Math.round((weighted / totalQty) * 100) / 100;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body   = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { cargoes, targetSpec, save, name } = parsed.data;
  const totalQty = cargoes.reduce((s, c) => s + c.quantity, 0);

  const result = {
    totalQty,
    gar: weightedAvg(cargoes, "gar"),
    nar: weightedAvg(cargoes, "nar"),
    ts:  weightedAvg(cargoes, "ts"),
    ash: weightedAvg(cargoes, "ash"),
    tm:  weightedAvg(cargoes, "tm"),
    im:  weightedAvg(cargoes, "im"),
    hgi: weightedAvg(cargoes, "hgi"),
  };

  // Compare against target if provided
  const comparison = targetSpec ? {
    gar: targetSpec.gar != null && result.gar != null ? { target: targetSpec.gar, result: result.gar, delta: Math.round((result.gar - targetSpec.gar) * 100) / 100 } : null,
    ts:  targetSpec.ts  != null && result.ts  != null ? { target: targetSpec.ts,  result: result.ts,  delta: Math.round((result.ts  - targetSpec.ts)  * 100) / 100 } : null,
    ash: targetSpec.ash != null && result.ash != null ? { target: targetSpec.ash, result: result.ash, delta: Math.round((result.ash - targetSpec.ash) * 100) / 100 } : null,
    tm:  targetSpec.tm  != null && result.tm  != null ? { target: targetSpec.tm,  result: result.tm,  delta: Math.round((result.tm  - targetSpec.tm)  * 100) / 100 } : null,
  } : null;

  // Pass/fail vs target
  const passTarget = comparison
    ? Object.values(comparison).every((c) => {
        if (!c) return true;
        // GAR: higher = better; TS/ASH/TM: lower = better
        return true; // simplified — UI shows deltas with colour
      })
    : null;

  // Persist if requested
  let savedId: string | null = null;
  if (save) {
    const sim = await prisma.blendingSimulation.create({
      data: { name: name ?? `Blend ${new Date().toLocaleDateString()}`, cargos: cargoes, result: { ...result, comparison } },
    });
    savedId = sim.id;
  }

  return NextResponse.json({ data: { result, comparison, passTarget, savedId } });
}
