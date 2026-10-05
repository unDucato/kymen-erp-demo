// Читает tokens.env из корня проекта и пишет config.js (только публичный ключ карты).
// Запуск из корня проекта:  node scripts/gen-config.mjs
// Нужен Node 18+, зависимостей нет.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)));
const envPath = resolve(root, "tokens.env");

if (!existsSync(envPath)) {
  console.error(`tokens.env не найден: ${envPath}`);
  process.exit(1);
}

const env = {};
for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
  if (!m || line.trim().startsWith("#")) continue;
  env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, "$2");
}

const key = env.DEV_MAPTILER_TOKEN || env.MAPTILER_TOKEN;
if (!key) {
  console.error("В tokens.env нет DEV_MAPTILER_TOKEN (или MAPTILER_TOKEN).");
  process.exit(1);
}

// В config.js попадает ТОЛЬКО ключ карты, остальные секреты из tokens.env не выгружаются.
const out = `// Автогенерация: node scripts/gen-config.mjs. Не коммитить.
window.KTP_CONFIG = ${JSON.stringify({ maptilerKey: key }, null, 2)};
`;
writeFileSync(resolve(root, "config.js"), out);
console.log("config.js создан.");
