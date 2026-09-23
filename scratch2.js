const OpenAI = require('openai');
const client = new OpenAI({apiKey: 'test'});
console.log(Object.keys(client.responses.__proto__));
console.log(typeof client.responses.create);
console.log(typeof client.chat.completions.create);
