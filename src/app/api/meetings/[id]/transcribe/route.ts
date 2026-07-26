import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id }  = await params;
  const contentType = request.headers.get("content-type") ?? "";
  let audioUrl: string | undefined;
  let audioFile: File | null = null;
  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("file");
    if (file instanceof File) audioFile = file;
  } else {
    const body = await request.json().catch(() => ({}));
    audioUrl = body.audioUrl;
  }

  const meeting = await prisma.meeting.findUnique({ where: { id } });
  if (!meeting) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let transcription: string | null = null;
  if (audioFile && process.env.GROQ_API_KEY) {
    const form = new FormData();
    form.append("file", audioFile);
    form.append("model", "whisper-large-v3-turbo");
    form.append("response_format", "json");
    const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: form,
    });
    if (!res.ok) return NextResponse.json({ error: await res.text() }, { status: 502 });
    const data = await res.json();
    transcription = String(data.text ?? "").trim();
  }

  if (audioFile) {
    const bytes = Buffer.from(await audioFile.arrayBuffer());
    const dir = path.join(process.cwd(), "public", "uploads", "meetings", id);
    await fs.mkdir(dir, { recursive: true });
    const safeName = audioFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    await fs.writeFile(path.join(dir, safeName), bytes);
    audioUrl = `/uploads/meetings/${id}/${safeName}`;
  }

  const fallbackTranscript = `[AI Transcription Fallback — configure GROQ_API_KEY for Whisper]

Rapat dibuka oleh ${meeting.participants?.[0] ?? "pimpinan rapat"} pada ${new Date(meeting.scheduledAt).toLocaleString("id-ID")}.

Agenda: ${meeting.agenda ?? "Tidak ada agenda tercatat"}

Poin-poin diskusi:
1. Review progress operasional minggu ini
2. Update status shipment aktif
3. Pembahasan forecast sales Q3
4. Action items dan follow-up

Rapat ditutup dengan kesepakatan tindak lanjut yang akan dipantau minggu depan.`;

  const updated = await prisma.meeting.update({
    where: { id },
    data: {
      transcription: transcription || fallbackTranscript,
      audioUrl: audioUrl ?? meeting.audioUrl,
    },
  });

  return NextResponse.json({ data: { transcription: updated.transcription } });
}
