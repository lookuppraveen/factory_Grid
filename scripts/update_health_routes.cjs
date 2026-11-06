const fs = require('fs');

// 1. Update health.controller.ts
const healthPath = 'backend/apps/factorygrid-api/src/health/health.controller.ts';
let healthCode = fs.readFileSync(healthPath, 'utf8');
healthCode = healthCode.replace("@Controller('health')", "@Controller(['health', 'actuator/health'])");
fs.writeFileSync(healthPath, healthCode, 'utf8');

// 2. Update bootstrap.ts
const bootstrapPath = 'backend/apps/factorygrid-api/src/bootstrap.ts';
let bootstrapCode = fs.readFileSync(bootstrapPath, 'utf8');
bootstrapCode = bootstrapCode.replace(
  "app.setGlobalPrefix(API_PREFIX, { exclude: [{ path: 'health', method: RequestMethod.GET }] });",
  "app.setGlobalPrefix(API_PREFIX, { exclude: [{ path: 'health', method: RequestMethod.GET }, { path: 'actuator/health', method: RequestMethod.GET }] });"
);
fs.writeFileSync(bootstrapPath, bootstrapCode, 'utf8');

console.log('health.controller.ts and bootstrap.ts updated to support /actuator/health.');

