import { NextResponse } from "next/server";
import { collections } from "@/lib/firestore";

export async function GET() {
  try {
    const usersSnap = await collections.users().get();
    if (usersSnap.empty) {
      return NextResponse.json({ error: "No users found" });
    }
    
    const user = usersSnap.docs[0];
    const emailsSnap = await collections.emails().get();
    
    let queued = 0;
    let processed = 0;
    let error = 0;
    
    emailsSnap.forEach(doc => {
      const data = doc.data();
      if (data.status === "queued") queued++;
      else if (data.status === "processed") processed++;
      else if (data.status === "error") error++;
    });
    
    return NextResponse.json({
      userId: user.id,
      email: user.data().email,
      lastHistoryId: user.data().lastHistoryId,
      totalEmails: emailsSnap.size,
      queued,
      processed,
      error
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
