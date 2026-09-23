const OpenAI = require('openai');
const client = new OpenAI({apiKey: 'test'});
console.log(Object.keys(client));
console.log(Object.keys(client.chat || {}));
console.log(Object.keys(client.responses || {}));
