import { Database } from 'bun:sqlite';
import { createClient } from '@libsql/client';
import path from 'path';

const url = process.env.TURSO_DATABASE_URL || 'libsql://baskula-nicoasd.aws-ap-northeast-1.turso.io';
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!authToken) {
  console.error('ERROR: Debes definir la variable TURSO_AUTH_TOKEN');
  process.exit(1);
}

async function migrate() {
  console.log('--- Conectando a Turso y SQLite Local ---');
  const localDb = new Database(path.resolve('db/custom.db'));
  const turso = createClient({ url, authToken });

  // 1. Obtener DDL de SQLite local
  const schemaItems = localDb.query(
    "SELECT type, name, sql FROM sqlite_master WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%' ORDER BY CASE type WHEN 'table' THEN 1 WHEN 'index' THEN 2 ELSE 3 END;"
  ).all();

  console.log(`Aplicando ${schemaItems.length} estructuras (tablas e índices) en Turso...`);
  for (const item of schemaItems) {
    try {
      await turso.execute(item.sql);
      console.log(`  ✓ ${item.type} ${item.name} creada`);
    } catch (err) {
      if (err.message && err.message.includes('already exists')) {
        console.log(`  - ${item.type} ${item.name} ya existía`);
      } else {
        throw err;
      }
    }
  }

  // 2. Tablas a migrar en orden de dependencia
  const tables = [
    'Setting',
    'Client',
    'Product',
    'ClientNote',
    'Favorite',
    'SharedList',
    'ListItem',
    'CuratedItem',
    'Visit'
  ];

  console.log('\n--- Migrando datos ---');

  for (const tableName of tables) {
    const rows = localDb.query(`SELECT * FROM "${tableName}"`).all();
    console.log(`Migrando ${tableName}: ${rows.length} registros...`);

    if (rows.length === 0) continue;

    // Obtener columnas
    const sample = rows[0];
    const columns = Object.keys(sample);
    const colsSql = columns.map(c => `"${c}"`).join(', ');
    const placeholders = columns.map(() => '?').join(', ');
    const insertSql = `INSERT OR REPLACE INTO "${tableName}" (${colsSql}) VALUES (${placeholders})`;

    // Enviar en lotes de 50
    const batchSize = 50;
    for (let i = 0; i < rows.length; i += batchSize) {
      const slice = rows.slice(i, i + batchSize);
      const stmts = slice.map(row => ({
        sql: insertSql,
        args: columns.map(col => row[col])
      }));
      await turso.batch(stmts, 'write');
    }
    console.log(`  ✓ ${tableName} migrado con éxito`);
  }

  // 3. Verificación final
  console.log('\n--- Verificando conteos en Turso ---');
  for (const tableName of tables) {
    const localCount = localDb.query(`SELECT COUNT(*) as c FROM "${tableName}"`).get().c;
    const tursoRes = await turso.execute(`SELECT COUNT(*) as c FROM "${tableName}"`);
    const tursoCount = Number(tursoRes.rows[0].c);
    const match = localCount === tursoCount ? '✓ OK' : '✗ ERROR';
    console.log(`  ${tableName}: Local = ${localCount} | Turso = ${tursoCount}  ${match}`);
  }

  console.log('\n¡Migración a Turso completada al 100%!');
}

migrate().catch(err => {
  console.error('Error durante la migración:', err);
  process.exit(1);
});
