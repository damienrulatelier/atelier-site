"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Connexion impossible.");
        setLoading(false);
        return;
      }
      router.push("/admin/products");
      router.refresh();
    } catch {
      setError("Erreur de connexion au serveur.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8] px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm border border-[#DEDAD1] bg-white p-8"
      >
        <h1 className="font-serif text-2xl mb-1 text-[#181614]">Espace atelier</h1>
        <p className="text-sm text-[#8C8780] mb-6">Connecte-toi pour gérer ton catalogue.</p>

        <label className="block text-xs uppercase tracking-wide font-semibold text-[#3A3631] mb-2">
          Mot de passe
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          className="w-full border border-[#DEDAD1] px-3 py-2.5 mb-4 text-sm focus:outline-none focus:border-[#181614]"
        />

        {error && <p className="text-sm text-[#B23A24] mb-4">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#181614] text-white py-3 text-sm uppercase tracking-wide font-semibold hover:bg-[#B23A24] transition-colors disabled:opacity-50"
        >
          {loading ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </div>
  );
}
