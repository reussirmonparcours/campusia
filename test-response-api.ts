import { OpenAI } from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const schema = z.object({ answer: z.string() });
  const zf = zodResponseFormat(schema, "my_name");
  try {
    const res = await (client as any).responses.create({
      model: "gpt-4o-mini",
      input: [{ role: "user", content: "hello" }],
      text: { 
        format: {
          type: "json_schema",
          name: zf.json_schema.name,
          strict: zf.json_schema.strict,
          schema: zf.json_schema.schema
        }
      },
      max_output_tokens: 100
    });
    console.log(JSON.stringify(res, null, 2));
  } catch(e) { console.error(e); }
}
run();
