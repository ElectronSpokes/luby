import { sql } from './client';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

const MIGRATIONS_DIR = join(import.meta.dir, '../../migrations');

export async function runMigrations(): Promise<void> {
  // Ensure migrations table exists
  await sql`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  const applied = await sql<{ name: string }[]>`SELECT name FROM _migrations ORDER BY name`;
  const appliedSet = new Set(applied.map(r => r.name));

  const files = (await readdir(MIGRATIONS_DIR)).filter(f => f.endsWith('.sql')).sort();

  for (const file of files) {
    if (appliedSet.has(file)) {
      console.log(`  skip: ${file} (already applied)`);
      continue;
    }

    console.log(`  applying: ${file}`);
    const content = await readFile(join(MIGRATIONS_DIR, file), 'utf-8');
    await sql.unsafe(content);
    await sql`INSERT INTO _migrations (name) VALUES (${file})`;
    console.log(`  done: ${file}`);
  }
}

// Run directly if executed as script
if (import.meta.main) {
  console.log('Running migrations...');
  await runMigrations();
  console.log('Migrations complete');
  await sql.end();
  process.exit(0);
}
