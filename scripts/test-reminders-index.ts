import { collections } from "../src/lib/firestore";
import { config } from "dotenv";

config({ path: ".env.local" });

async function testIndex() {
  try {
    const now = new Date();
    await collections.reminders()
      .where("status", "==", "active")
      .where("triggerAt", "<=", now)
      .limit(50)
      .get();
    console.log("Query succeeded! Index exists.");
  } catch (err: any) {
    console.error("Query failed!");
    console.error(err.message);
  }
}

testIndex().then(() => process.exit(0)).catch(console.error);
