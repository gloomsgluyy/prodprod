import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchExternalNews } from "@/lib/external-news";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const query = new URL(request.url).searchParams.get("q")?.trim();
  if (!query) return NextResponse.json({ error: "q required" }, { status: 422 });
  return NextResponse.json({ data: await fetchExternalNews(query) });
}
