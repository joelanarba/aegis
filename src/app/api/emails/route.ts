import { NextRequest, NextResponse } from "next/server";
import { getProcessedEmails } from "@/lib/firestore";

/**
 * GET /api/emails
 * Returns processed emails with summaries and triage data.
 */
export async function GET(request: NextRequest) {
  const userId = request.cookies.get("aegis_user_id")?.value;
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const limit = parseInt(request.nextUrl.searchParams.get("limit") || "20");
  const emails = await getProcessedEmails(userId, Math.min(limit, 50));

  return NextResponse.json({ emails });
}
