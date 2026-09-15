// Cambia la clave de acceso del panel de administración (Setting adminPin).
// Uso: bun scripts/update_admin_pin.ts NUEVA_CLAVE
import { Database } from "bun:sqlite";
import * as path from "path";

const newPin = process.argv[2];
if (!newPin || newPin.trim().length < 6) {
  console.error("Uso: bun scripts/update_admin_pin.ts NUEVA_CLAVE (mínimo 6 caracteres)");
  process.exit(1);
}

const dbPath = path.join(__dirname, "..", "db", "custom.db");
const db = new Database(dbPath);
const value = newPin.trim().toUpperCase();
db.run("INSERT INTO Setting (key, value) VALUES ('adminPin', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", [value]);

const row = db.query("SELECT value FROM Setting WHERE key = 'adminPin'").get() as { value: string };
console.log("adminPin actualizado →", row.value);
db.close();
