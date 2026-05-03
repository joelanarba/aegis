import { NextRequest, NextResponse } from "next/server";
import { collections } from "@/lib/firestore";
import { setupGmailWatch } from "@/lib/gmail";
import { upsertUser } from "@/lib/firestore";
import { getConfig } from "@/lib/config";

/**
 * POST /api/cron/watch-refresh
 *
 * Renews Gmail Pub/Sub watch for all users.
 * Gmail watch expires every 7 days — this should run every 6 days.
 *
 * Protected by CRON_SECRET.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const config = getConfig();
    if (!config.GOOGLE_PUBSUB_TOPIC) {
      return NextResponse.json({ error: "GOOGLE_PUBSUB_TOPIC not configured" }, { status: 500 });
    }

    const usersSnapshot = await collections.users().get();
    let renewed = 0;

    for (const userDoc of usersSnapshot.docs) {
      try {
        const userId = userDoc.id;
        const result = await setupGmailWatch(userId, config.GOOGLE_PUBSUB_TOPIC);

        await upsertUser(userId, {
          lastHistoryId: result.historyId,
          updatedAt: new Date(),
        });

        console.log(`🔄 Renewed Gmail watch for user ${userId}, expires: ${result.expiration}`);
        renewed++;
      } catch (err) {
        console.error(`Failed to renew watch for user ${userDoc.id}:`, err);
      }
    }

    return NextResponse.json({ status: "ok", renewed });
  } catch (error) {
    console.error("Watch refresh error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
