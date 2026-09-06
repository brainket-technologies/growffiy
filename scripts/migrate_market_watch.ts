import { Client } from 'pg';

async function main() {
  const neon = new Client({
    connectionString: "postgresql://neondb_owner:npg_Qtok2RmWK4uT@ep-purple-frost-aimotyfv.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require"
  });
  
  const live = new Client({
    connectionString: process.env.DATABASE_URL || "postgresql://growffiy_user:growffiy_live_pass_2026@localhost:5432/growffiy_com_db"
  });

  await neon.connect();
  await live.connect();

  const tables = ['market_watch_snapshots'];

  for (const table of tables) {
    console.log(`Migrating ${table}...`);
    const { rows } = await neon.query(`SELECT * FROM ${table}`);
    
    if (rows.length === 0) continue;

    const columns = Object.keys(rows[0]);
    
    for (const row of rows) {
      const values = columns.map(col => row[col]);
      
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
      
      const query = `
        INSERT INTO ${table} ("${columns.join('", "')}")
        VALUES (${placeholders})
        ON CONFLICT (index_name, date, time_slot) DO NOTHING
      `;

      await live.query(query, values);
    }
  }

  await neon.end();
  await live.end();
  console.log("Migration successfully completed for market watch!");
}

main().catch(console.error);
