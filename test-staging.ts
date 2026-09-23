import { createClient } from "@supabase/supabase-js";
import { OpenAIProvider } from "./src/lib/ai/openai-provider";
import { AIRequest } from "./src/types/ai";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function runTest() {
  console.log("Staging Test for OpenAI Provider...");
  
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY missing");
    process.exit(1);
  }

  const provider = new OpenAIProvider();

  const request: AIRequest = {
    mode: "explain",
    userMessage: "Explique-moi ce qu'est le Taux de Rentabilité Interne selon le cours, et quelles en sont les limites.",
    studentContext: {
      program: "Licence Eco-Gestion",
    },
    academicContext: {
      subjectName: "Analyse Financière",
    },
    sourceContext: [
      {
        ref: "REF_OFF_1",
        content: "Le Taux de Rentabilité Interne (TRI) est le taux d'actualisation qui annule la Valeur Actuelle Nette (VAN). L'une des limites majeures est l'hypothèse de réinvestissement des flux de trésorerie au même taux (le TRI).",
        provenance: "OFFICIAL",
        sourceLabel: "Cours Magistral - Chapitre 4"
      }
    ],
    _internalMapping: {
      "REF_OFF_1": {
        ref: "REF_OFF_1",
        documentId: "00000000-0000-0000-0000-000000000001",
        chunkId: "chunk-staging-1",
        content: "Le Taux de Rentabilité Interne (TRI)...",
        similarity: 0.92,
        pageNumber: 4,
        provenance: "OFFICIAL",
        metadata: { file_name: "Chapitre4.pdf" },
      }
    }
  };

  try {
    console.log("Generating response...");
    const response = await provider.generate(request);
    console.log("========== RESPONSE ==========");
    console.log("Answer:", response.message);
    console.log("Sources Used:", response.sourceProvenance);
    console.log("Warnings:", response.warnings);
    console.log("Suggested Actions:", response.suggestedActions);
    console.log("==============================");
  } catch (error) {
    console.error("Error generating response:", error);
  }
}

runTest();
