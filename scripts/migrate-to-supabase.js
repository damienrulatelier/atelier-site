/**
 * Script de migration des données JSON vers Supabase
 * Lance avec : node scripts/migrate-to-supabase.js
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Charge le .env.local
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });

const sb = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function migrate() {
  console.log("🚀 Migration vers Supabase...\n");

  // Produits
  const productsPath = path.join(__dirname, "../data/products.json");
  if (fs.existsSync(productsPath)) {
    const { products } = JSON.parse(fs.readFileSync(productsPath, "utf-8"));
    console.log(`📦 ${products.length} produits à migrer...`);
    for (const p of products) {
      const { error } = await sb.from("products").upsert({
        id: p.id,
        data: p,
        created_at: p.createdAt || new Date().toISOString(),
      });
      if (error) console.error(`  ✗ ${p.title}:`, error.message);
      else console.log(`  ✓ ${p.title}`);
    }
  }

  // Commissions confirmées
  const commissionsPath = path.join(__dirname, "../data/commissions.json");
  if (fs.existsSync(commissionsPath)) {
    const commissions = JSON.parse(fs.readFileSync(commissionsPath, "utf-8"));
    console.log(`\n📋 ${commissions.length} commissions à migrer...`);
    for (const c of commissions) {
      const { error } = await sb.from("commissions").upsert({
        id: c.id,
        data: c,
        status: c.status || "paid",
        created_at: c.createdAt || new Date().toISOString(),
      });
      if (error) console.error(`  ✗ ${c.id}:`, error.message);
      else console.log(`  ✓ ${c.id}`);
    }
  }

  console.log("\n✅ Migration terminée !");
}

migrate().catch(console.error);
