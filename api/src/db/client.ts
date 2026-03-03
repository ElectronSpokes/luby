import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL || 'postgresql://luby:luby_secure_2026@localhost:5432/luby';

export const sql = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export async function testConnection(): Promise<boolean> {
  try {
    await sql`SELECT 1`;
    console.log('Database connection established');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

export async function closeConnection(): Promise<void> {
  await sql.end();
  console.log('Database connection closed');
}
