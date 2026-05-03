import { config } from "dotenv";
config({ path: ".env.local" });

import { collections } from "../src/lib/firestore";

async function checkStatus() {
  console.log("Checking Firestore status...");
  
  const usersSnap = await collections.users().get();
  if (usersSnap.empty) {
    console.log("No users found.");
    return;
  }
  
  const user = usersSnap.docs[0];
  console.log(`User ID: ${user.id}`);
  console.log(`Email: ${user.data().email}`);
  console.log(`Last History ID: ${user.data().lastHistoryId}`);

  const emailsSnap = await collections.emails().get();
  console.log(`\nTotal emails in database: ${emailsSnap.size}`);
  
  let queued = 0;
  let processed = 0;
  let error = 0;
  
  emailsSnap.forEach(doc => {
    const data = doc.data();
    if (data.status === "queued") queued++;
    else if (data.status === "processed") processed++;
    else if (data.status === "error") error++;
    else console.log("Unknown status:", data.status);
  });
  
  console.log(`Queued: ${queued}`);
  console.log(`Processed: ${processed}`);
  console.log(`Error: ${error}`);
}

checkStatus().then(() => process.exit(0)).catch(console.error);
