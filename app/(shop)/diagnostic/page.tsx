"use client";
import { useState } from "react";
const SITE = "https://damienrulatelier.fr";
export default function DiagnosticPage() {
  const [log, setLog] = useState("");
  const [cards, setCards] = useState<{type:string,title:string,detail:string}[]>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  function addLog(msg: string) { setLog(prev => prev + msg + "\n"); }
  function addCard(type: string, title: string, detail: string) {
    setCards(prev => [...prev, {type, title, detail}]);
  }
  async function runAll() {
    setLog(""); setCards([]); setRunning(true); setDone(false);
    const ua = navigator.userAgent;
    const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);
    const isIOS = /iPhone|iPad|iPod/.test(ua);
    addLog("=== DIAGNOSTIC ===");
    addLog("Date: " + new Date().toISOString());
    addLog("UA: " + ua);
    addLog("Safari: " + isSafari + " | iOS: " + isIOS);
    addCard(isSafari ? "warn" : "ok", isSafari ? "⚠ Safari détecté" : "✓ Pas Safari", ua.substring(0, 80));
    // localStorage
    let ls = false;
    try { localStorage.setItem("_t","1"); localStorage.removeItem("_t"); ls = true; } catch(e) {}
    addLog("localStorage: " + (ls ? "OK" : "BLOQUÉ"));
    addCard(ls ? "ok" : "fail", ls ? "✓ localStorage OK" : "✗ localStorage bloqué", ls ? "Panier sauvegardable" : "Panier perdu à chaque session");
    // fetch API
    addLog("fetch /api/products...");
    try {
      const t = Date.now();
      const r = await fetch(SITE + "/api/products", {cache:"no-store"});
      const ms = Date.now() - t;
      addLog("  → status " + r.status + " en " + ms + "ms");
      addCard(r.ok ? "ok" : "fail", r.ok ? "✓ API produits OK" : "✗ API produits FAIL", "status " + r.status + " en " + ms + "ms");
    } catch(e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      addLog("  → ERREUR: " + msg);
      addCard("fail", "✗ API produits BLOQUÉE", msg);
    }
    // fetch atelier
    addLog("fetch /atelier...");
    try {
      const t = Date.now();
      const r = await fetch(SITE + "/atelier", {cache:"no-store"});
      const ms = Date.now() - t;
      addLog("  → status " + r.status + " en " + ms + "ms");
      addCard(r.ok ? "ok" : "fail", r.ok ? "✓ /atelier OK" : "✗ /atelier FAIL", "status " + r.status + " en " + ms + "ms");
    } catch(e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      addLog("  → ERREUR: " + msg);
      addCard("fail", "✗ /atelier BLOQUÉE", msg);
    }
    // bouton
    const btnOk = await new Promise<boolean>(resolve => {
      const b = document.createElement("button");
      b.style.cssText = "position:fixed;top:-200px";
      let clicked = false;
      b.addEventListener("click", () => { clicked = true; document.body.removeChild(b); resolve(true); });
      document.body.appendChild(b);
      b.click();
      setTimeout(() => { if (!clicked) { if (document.body.contains(b)) document.body.removeChild(b); resolve(false); } }, 300);
    });
    addLog("onClick: " + (btnOk ? "OK" : "BLOQUÉ"));
    addCard(btnOk ? "ok" : "fail", btnOk ? "✓ Boutons fonctionnent" : "✗ Boutons bloqués", btnOk ? "Les événements touch/click marchent" : "Problème d'hydratation React sur ce navigateur");
    addLog("=== FIN ===");
    setRunning(false); setDone(true);
  }
  return (
    <main className="max-w-lg mx-auto px-6 py-10">
      <h1 className="font-serif text-2xl text-[#181614] mb-2">Diagnostic Safari</h1>
      <p className="text-sm text-[#8C8780] mb-6">Teste les problèmes du site sur ce navigateur</p>
      <button
        onClick={runAll}
        disabled={running}
        className="w-full py-4 bg-[#181614] text-white font-semibold text-sm uppercase tracking-wide mb-4 disabled:opacity-50"
        style={{WebkitTapHighlightColor:"transparent",touchAction:"manipulation"}}
      >
        {running ? "En cours..." : "▶ Lancer le diagnostic"}
      </button>
      {cards.map((c,i) => (
        <div key={i} className={`p-4 mb-3 border-l-4 rounded-r ${c.type==="ok"?"border-green-600 bg-green-50":c.type==="fail"?"border-red-600 bg-red-50":"border-orange-500 bg-orange-50"}`}>
          <div className={`font-semibold text-sm ${c.type==="ok"?"text-green-700":c.type==="fail"?"text-red-700":"text-orange-700"}`}>{c.title}</div>
          <div className="text-xs text-gray-600 mt-1">{c.detail}</div>
        </div>
      ))}
      {done && (
        <div>
          <p className="text-xs text-[#8C8780] mb-2">Log complet — copie et envoie :</p>
          <textarea
            readOnly
            value={log}
            className="w-full h-48 text-xs font-mono border border-[#DEDAD1] p-3 bg-[#F2F0EA]"
            onClick={e => (e.target as HTMLTextAreaElement).select()}
          />
        </div>
      )}
    </main>
  );
}
