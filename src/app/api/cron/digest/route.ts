import { NextRequest, NextResponse } from "next/server";
import { generateDigest } from "@/agents/digest-generator";
import { storeDigest, collections, getUser } from "@/lib/firestore";
import { sendDigestMessage } from "@/lib/telegram";

/**
 * POST /api/cron/digest
 *
 * Generates a daily digest for all users and sends it via Telegram.
 * Protected by CRON_SECRET.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const usersSnapshot = await collections.users().get();
    let sent = 0;

    for (const userDoc of usersSnapshot.docs) {
      try {
        const userId = userDoc.id;
        const user = await getUser(userId);
        if (!user) continue;

        // Generate digest
        const digest = await generateDigest(userId);

        // Store in Firestore
        await storeDigest({
          userId,
          generatedAt: new Date(),
          summary: digest.summary,
          urgentItems: digest.urgentItems,
          actionItems: digest.actionItems,
          upcomingDeadlines: digest.upcomingDeadlines,
          dueReminders: digest.dueReminders,
          sentVia: user.preferences?.telegramChatId ? "both" : "dashboard",
        });

        // Send via Telegram if configured
        const chatId = user.preferences?.telegramChatId;
        if (chatId) {
          await sendDigestMessage(chatId, digest);
          sent++;
        }

        console.log(`📊 Digest generated for user ${userId}`);
      } catch (err) {
        console.error(`Failed to generate digest for user ${userDoc.id}:`, err);
      }
    }

    return NextResponse.json({ status: "ok", sent });
  } catch (error) {
    console.error("Digest cron error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
