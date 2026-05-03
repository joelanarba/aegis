import { NextRequest, NextResponse } from "next/server";
import { getUser, upsertUser } from "@/lib/firestore";
import type { UserDoc } from "@/types/firestore";

/**
 * POST /api/settings
 * Updates user preferences (Telegram Chat ID, Timezone, Digest Frequency).
 */
export async function POST(request: NextRequest) {
  const userId = request.cookies.get("aegis_user_id")?.value;
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { telegramChatId, timezone, digestFrequency } = body;

    const user = await getUser(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const currentPreferences = user.preferences || {};
    
    const updatedPreferences: UserDoc["preferences"] = {
      ...currentPreferences,
      timezone: timezone || currentPreferences.timezone || "UTC",
      digestFrequency: digestFrequency || currentPreferences.digestFrequency || "daily",
      telegramChatId: telegramChatId || currentPreferences.telegramChatId || null,
      digestTime: currentPreferences.digestTime || "08:00",
      notifyUrgent: currentPreferences.notifyUrgent ?? true,
      replyTone: currentPreferences.replyTone || "both",
    };

    await upsertUser(userId, {
      preferences: updatedPreferences,
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true, preferences: updatedPreferences });
  } catch (error) {
    console.error("Failed to update settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
