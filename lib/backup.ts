import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const BACKUP_DIR = path.join(DATA_DIR, "backups");
const INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 heures

// Fichiers critiques à sauvegarder à chaque cycle.
const FILES_TO_BACKUP = [
  "products.json",
  "customers.json",
  "customer-orders.json",
  "reviews.json",
  "edition-reservations.json",
  "processed-sessions.json",
  "processed-order-emails.json",
];

let initialized = false;

function runBackup() {
  try {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const backupFolder = path.join(BACKUP_DIR, timestamp);
    fs.mkdirSync(backupFolder, { recursive: true });

    let count = 0;
    for (const file of FILES_TO_BACKUP) {
      const src = path.join(DATA_DIR, file);
      if (!fs.existsSync(src)) continue;
      fs.copyFileSync(src, path.join(backupFolder, file));
      count++;
    }

    // Ne garde que les 7 dernières sauvegardes pour ne pas saturer le disque.
    const allBackups = fs
      .readdirSync(BACKUP_DIR)
      .filter((name) => {
        const p = path.join(BACKUP_DIR, name);
        return fs.statSync(p).isDirectory();
      })
      .sort();
    while (allBackups.length > 7) {
      const oldest = allBackups.shift();
      if (oldest) {
        const oldPath = path.join(BACKUP_DIR, oldest);
        fs.rmSync(oldPath, { recursive: true, force: true });
      }
    }

    console.log(`[backup] ${count} fichier(s) sauvegardé(s) dans data/backups/${timestamp}`);
  } catch (err) {
    // On ne laisse jamais une erreur de backup planter le serveur.
    console.error("[backup] Erreur lors de la sauvegarde :", err);
  }
}

// Initialise le système de sauvegarde une seule fois au démarrage du serveur.
// Next.js peut importer ce module plusieurs fois (HMR en développement) —
// le flag "initialized" garantit qu'on ne démarre qu'un seul minuteur.
export function initBackupScheduler() {
  if (initialized) return;
  initialized = true;

  // Première sauvegarde immédiate au démarrage.
  runBackup();
  const bkp = setInterval(runBackup, INTERVAL_MS);
  if (typeof bkp === 'object' && bkp !== null && 'unref' in bkp) (bkp as NodeJS.Timeout).unref();
}
