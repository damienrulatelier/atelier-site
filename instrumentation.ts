// Ce fichier est chargé automatiquement par Next.js au démarrage du serveur
// (uniquement côté serveur, jamais côté client) grâce à la convention de
// nommage "instrumentation.ts" à la racine du projet.
// Documentation : https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Sauvegarde automatique des données JSON toutes les 24h
    const { initBackupScheduler } = await import("./lib/backup");
    initBackupScheduler();

    // Vérification toutes les heures des paniers abandonnés à relancer
    async function checkAbandonedCarts() {
      try {
        const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
        await fetch(`${base}/api/abandoned-cart/remind`, { method: "POST" });
      } catch {
        // Silencieux si le serveur n'est pas encore prêt au premier cycle.
      }
    }
    setTimeout(() => {
      checkAbandonedCarts();
      const i1 = setInterval(checkAbandonedCarts, 60 * 60 * 1000);
      if (typeof i1 === 'object' && i1 !== null && 'unref' in i1) (i1 as NodeJS.Timeout).unref();
    }, 30_000);

    async function checkLimitedEditions() {
      try {
        const { checkAndCloseExpiredEditions } = await import("./lib/limited-editions");
        await checkAndCloseExpiredEditions();
      } catch { /* silencieux */ }
    }
    setTimeout(() => {
      checkLimitedEditions();
      const i2 = setInterval(checkLimitedEditions, 60 * 1000);
      if (typeof i2 === 'object' && i2 !== null && 'unref' in i2) (i2 as NodeJS.Timeout).unref();
    }, 15_000);

    // Simulation d'activité — pour les prints et drops avec 15+ exemplaires vendus,
    // augmente editionSold de 1 à 5 à intervalles aléatoires (entre 2h et 8h)
    async function simulateActivity() {
      try {
        const fs = await import("fs");
        const path = await import("path");
        const dataPath = path.join(process.cwd(), "data", "products.json");
        if (!fs.existsSync(dataPath)) return;
        const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
        let changed = false;
        for (const p of data.products) {
          // Uniquement prints et drops avec édition limitée et 15+ exemplaires vendus
          const isDrop = p.temporaryUntil && new Date(p.temporaryUntil).getTime() > Date.now();
          const isPrint = p.type === "print" || p.type === "autre";
          if (!(isPrint || isDrop)) continue;
          if (!p.editionTotal || p.editionSold < 15) continue;
          if (p.editionSold >= p.editionTotal) continue;
          // Incrémenter de 1 à 5 aléatoirement
          const increment = Math.floor(Math.random() * 5) + 1;
          p.editionSold = Math.min(p.editionTotal, p.editionSold + increment);
          changed = true;
        }
        if (changed) {
          fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
        }
      } catch { /* silencieux */ }

      // Reprogram le prochain cycle entre 2h et 8h aléatoirement
      const nextIn = (2 + Math.random() * 6) * 60 * 60 * 1000;
      setTimeout(simulateActivity, nextIn);
    }

    // Premier déclenchement après 2h minimum
    setTimeout(simulateActivity, (2 + Math.random() * 2) * 60 * 60 * 1000);
  }
}
