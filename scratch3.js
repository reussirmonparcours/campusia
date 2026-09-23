const OpenAI = require('openai');
const { zodResponseFormat } = require('openai/helpers/zod');
const { z } = require('zod');
const client = new OpenAI({apiKey: 'test'});
console.log(typeof client.responses.create);
console.log(Object.keys(client.responses));
