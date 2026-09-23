import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const token = process.env.SUPABASE_ACCESS_TOKEN;
const ref = "dhjagyucjockzipwsrsb";

if (!token) {
  console.error("No token");
  process.exit(1);
}

async function run() {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/query`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      query: "NOTIFY pgrst, 'reload schema';"
    })
  });
  
  if (!res.ok) {
    const err = await res.text();
    console.error("API error:", res.status, err);
  } else {
    console.log("Success! Schema reloaded.");
  }
}

run();
