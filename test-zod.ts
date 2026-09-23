import { OpenAI } from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

const schema = z.object({ answer: z.string() });
const zf = zodResponseFormat(schema, "my_name");
console.log(JSON.stringify(zf, null, 2));
