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

  const tables = [
    'product_types',
    'subscription_plans',
    'strategies',
    'strategy_conditions',
    'strategy_templates',
    'app_settings',
    'testimonials',
    'strategy_preselections'
  ];

  for (const table of tables) {
    console.log(`Migrating ${table}...`);
    const { rows } = await neon.query(`SELECT * FROM ${table}`);
    
    if (rows.length === 0) continue;

    const columns = Object.keys(rows[0]);
    
    for (const row of rows) {
      const values = columns.map(col => row[col]);
      
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
      const setClause = columns.map((col, i) => `"${col}" = EXCLUDED."${col}"`).join(', ');
      
      const query = `
        INSERT INTO ${table} ("${columns.join('", "')}")
        VALUES (${placeholders})
        ON CONFLICT (id) DO UPDATE SET ${setClause}
      `;
      
      // Handle the fact that some tables might have different conflict targets
      // (Like app_settings uses setting_key as unique, not just id)
      let actualQuery = query;
      if (table === 'app_settings') {
        actualQuery = `
          INSERT INTO ${table} ("${columns.join('", "')}")
          VALUES (${placeholders})
          ON CONFLICT (setting_key) DO UPDATE SET ${setClause}
        `;
      } else if (table === 'strategy_preselections') {
         actualQuery = `
          INSERT INTO ${table} ("${columns.join('", "')}")
          VALUES (${placeholders})
          ON CONFLICT (strategy_id) DO UPDATE SET ${setClause}
        `;
      }

      await live.query(actualQuery, values);
    }
  }

  await neon.end();
  await live.end();
  console.log("Migration successfully completed!");
}

main().catch(console.error);
