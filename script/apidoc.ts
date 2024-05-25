import { writeFileSync } from 'fs';
import { testClient } from 'hono/testing';

import { app } from '../main.js';

const client = testClient(app);
const res = await client.doc.$get();
const schema = await res.json();
writeFileSync('./resources/schema.json', JSON.stringify(schema, null, 2));
console.log('API Schema has been generated successfully.');
process.exit(0);
