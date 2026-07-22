import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id }  = await params;
  const body    = await request.json().catch(() => ({}));
  const audioUrl: string | undefined = body.audioUrl;

  const meeting = await prisma.meeting.findUnique({ where: { id } });
  if (!meeting) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // TODO: integrate Groq Whisper API for real transcription
  // Stub: returns placeholder transcription
  const stubTranscript = `[AI Transcription Stub — Groq Whisper integration pending]

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
      transcription: stubTranscript,
      audioUrl: audioUrl ?? meeting.audioUrl,
    },
  });

  return NextResponse.json({ data: { transcription: updated.transcription } });
}
