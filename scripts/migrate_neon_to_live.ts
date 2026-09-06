import { PrismaClient } from '@prisma/client';

async function main() {
  console.log("Connecting to databases...");
  const neon = new PrismaClient({
    datasources: { db: { url: "postgresql://neondb_owner:npg_Qtok2RmWK4uT@ep-purple-frost-aimotyfv.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require" } }
  });
  const live = new PrismaClient();

  console.log("Migrating product types...");
  const productTypes = await neon.productType.findMany();
  for (const pt of productTypes) {
    await live.productType.upsert({ where: { id: pt.id }, update: pt, create: pt });
  }

  console.log("Migrating subscription plans...");
  const plans = await neon.subscriptionPlan.findMany();
  for (const p of plans) {
    await live.subscriptionPlan.upsert({ where: { id: p.id }, update: p, create: p });
  }

  console.log("Migrating strategies...");
  const strategies = await neon.strategy.findMany();
  for (const s of strategies) {
    await live.strategy.upsert({ where: { id: s.id }, update: s, create: s });
  }

  console.log("Migrating strategy conditions...");
  const conditions = await neon.strategyCondition.findMany();
  for (const c of conditions) {
    await live.strategyCondition.upsert({ where: { id: c.id }, update: c, create: c });
  }

  console.log("Migrating strategy templates...");
  const templates = await neon.strategyTemplate.findMany();
  for (const t of templates) {
    await live.strategyTemplate.upsert({ where: { id: t.id }, update: t, create: t });
  }

  console.log("Migrating app settings...");
  const settings = await neon.appSettings.findMany();
  for (const s of settings) {
    await live.appSettings.upsert({ where: { id: s.id }, update: s, create: s });
  }

  console.log("Migrating testimonials...");
  const testimonials = await neon.testimonial.findMany();
  for (const t of testimonials) {
    await live.testimonial.upsert({ where: { id: t.id }, update: t, create: t });
  }
  
  console.log("Migrating strategy preselections...");
  const preselections = await neon.strategyPreselect.findMany();
  for (const p of preselections) {
    await live.strategyPreselect.upsert({ where: { id: p.id }, update: p, create: p });
  }

  console.log("Migration successfully completed!");
}

main().catch(console.error).finally(() => process.exit(0));
