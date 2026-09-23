import { OpenAIEmbeddingProvider } from "../src/lib/rag/embeddings/openai-provider";
import { parse } from "dotenv";
import { readFileSync } from "fs";
import { join } from "path";

// Load local env manually
const envPath = join(process.cwd(), ".env.local");
const envVars = parse(readFileSync(envPath));
process.env.OPENAI_API_KEY = envVars.OPENAI_API_KEY;

async function runLiveTest() {
  console.log("=== TEST M10.3 OPENAI LIVE ===");
  if (!process.env.OPENAI_API_KEY) {
    console.log("No OPENAI_API_KEY found. Skipping live test.");
    return;
  }

  try {
    const provider = new OpenAIEmbeddingProvider();
    const texts = ["Hello world", "Machine learning is fascinating"];
    
    console.log("Calling OpenAI Embeddings API...");
    const embeddings = await provider.embedBatch(texts);
    
    if (embeddings.length === 2 && embeddings[0].length === 1536) {
      console.log("PASS: OpenAI Embeddings API returned correctly sized vectors (1536).");
    } else {
      console.log(`FAIL: Expected 2 vectors of size 1536, got ${embeddings.length} of size ${embeddings[0]?.length}`);
    }

  } catch (error) {
    console.error("Live test failed:", error);
  }
}

runLiveTest();
