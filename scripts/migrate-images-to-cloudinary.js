/**
 * Script de migration des images locales vers Cloudinary
 * Lance avec : node scripts/migrate-images-to-cloudinary.js
 */

const cloudinary = require("cloudinary").v2;
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "../.env.local") });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const sb = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const UPLOADS_DIR = path.join(__dirname, "../public/uploads");

async function migrate() {
  console.log("🖼️  Migration des images vers Cloudinary...\n");

  // Charger tous les produits depuis Supabase
  const { data: rows, error } = await sb.from("products").select("id, data");
  if (error) { console.error("Erreur Supabase:", error); return; }

  for (const row of rows) {
    const product = row.data;
    let changed = false;

    // Migrer chaque image du produit
    async function migrateImage(url) {
      if (!url || url.startsWith("http")) return url; // déjà une URL externe
      const filename = url.replace("/uploads/", "");
      const localPath = path.join(UPLOADS_DIR, filename);
      if (!fs.existsSync(localPath)) {
        console.log(`  ⚠ Fichier introuvable: ${filename}`);
        return url;
      }
      try {
        const result = await cloudinary.uploader.upload(localPath, {
          folder: "damien-rul-atelier",
          public_id: filename.replace(/\.[^.]+$/, ""),
          resource_type: "image",
          overwrite: false,
        });
        console.log(`  ✓ ${filename} → Cloudinary`);
        return result.secure_url;
      } catch (e) {
        console.error(`  ✗ ${filename}:`, e.message);
        return url;
      }
    }

    if (product.images?.length) {
      product.images = await Promise.all(product.images.map(migrateImage));
      changed = true;
    }
    if (product.imagesOriginal?.length) {
      product.imagesOriginal = await Promise.all(product.imagesOriginal.map(migrateImage));
      changed = true;
    }
    if (product.imagesPrint?.length) {
      product.imagesPrint = await Promise.all(product.imagesPrint.map(migrateImage));
      changed = true;
    }

    if (changed) {
      await sb.from("products").upsert({ id: row.id, data: product, created_at: product.createdAt });
      console.log(`  💾 ${product.title} mis à jour dans Supabase\n`);
    }
  }

  console.log("✅ Migration des images terminée !");
}

migrate().catch(console.error);
