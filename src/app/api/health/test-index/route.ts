import { NextResponse } from "next/server";
import { collections } from "@/lib/firestore";

export async function GET() {
  try {
    const now = new Date();
    await collections.reminders()
      .where("status", "==", "active")
      .where("triggerAt", "<=", now)
      .limit(50)
      .get();
    return NextResponse.json({ success: true, message: "Query succeeded! Index exists." });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}
