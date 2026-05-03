import { NextRequest, NextResponse } from "next/server";
import { conductResearch } from "@/agents/researcher";

/**
 * POST /api/research
 * Submit a research query and get synthesized results.
 *
 * Body: { query: string }
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get("aegis_user_id")?.value;
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { query } = await request.json();
    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
    }

    const result = await conductResearch(userId, query.trim());

    return NextResponse.json(result);
  } catch (error) {
    console.error("Research error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
