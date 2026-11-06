const fs = require('fs');
const path = 'backend/apps/factorygrid-api/src/config/env.ts';
let code = fs.readFileSync(path, 'utf8');

const oldFunc = `export function validateEnv(raw: Record<string, unknown>): Env {
  const jwtSecret = required(raw, 'JWT_SECRET');`;

const newFunc = `export function validateEnv(raw: Record<string, unknown>): Env {
  // Support Spring Boot / separate database environment variables as well as DATABASE_URL
  if (!raw.DATABASE_URL && raw.DB_HOST) {
    const user = raw.DB_USERNAME ? encodeURIComponent(String(raw.DB_USERNAME)) : 'factorygrid';
    const pass = raw.DB_PASSWORD ? \`:\${encodeURIComponent(String(raw.DB_PASSWORD))}\` : '';
    const port = raw.DB_PORT || 5432;
    const name = raw.DB_NAME || 'factorygrid';
    raw.DATABASE_URL = \`postgresql://\${user}\${pass}@\${raw.DB_HOST}:\${port}/\${name}\`;
  }

  // Support SERVER_PORT as fallback for PORT
  if (!raw.PORT && raw.SERVER_PORT) {
    raw.PORT = raw.SERVER_PORT;
  }

  const jwtSecret = required(raw, 'JWT_SECRET');`;

code = code.replace(oldFunc, newFunc);
fs.writeFileSync(path, code, 'utf8');
console.log('env.ts updated to support Spring Boot style DB and SERVER_PORT environment variables.');

