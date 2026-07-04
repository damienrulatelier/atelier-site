"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type CustomerOrder = {
  id: string;
  items: { title: string; price: number; qty: number; dedication?: string }[];
  shippingLabel: string;
  shippingPrice: number;
  total: number;
  status: "paid" | "preparing" | "shipped";
  createdAt: string;
};

type Account = {
  email: string;
  name: string;
  address: { name: string; line1: string; line2?: string; postalCode: string; city: string; country: string } | null;
  orders: CustomerOrder[];
};

function fmt(n: number) {
  return n.toFixed(2).replace(".", ",") + " €";
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

const STATUS_LABEL: Record<CustomerOrder["status"], string> = {
  paid: "Payée — en préparation",
  preparing: "En préparation",
  shipped: "Expédiée",
};

export default function ComptePage() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null | undefined>(undefined);
  const [mode, setMode] = useState<"login" | "signup">("login");

  // Champs formulaire
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function loadAccount() {
    fetch("/api/account/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setAccount(data || null))
      .catch(() => setAccount(null));
  }

  useEffect(() => {
    loadAccount();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const url = mode === "login" ? "/api/account/login" : "/api/account/signup";
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Une erreur est survenue.");

      // Inscription comme connexion ramènent directement vers la boutique :
      // dans les deux cas, le client était probablement déjà en train de
      // naviguer/acheter, donc il veut continuer plutôt que de voir un
      // tableau de bord — celui-ci reste accessible via l'icône "Mon compte".
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/account/logout", { method: "POST" });
    setAccount(null);
    setEmail("");
    setPassword("");
    setName("");
  }

  if (account === undefined) {
    return <main className="py-24 text-center text-sm text-[#8C8780]">Chargement…</main>;
  }

  // --- Connecté : tableau de bord ---
  if (account) {
    return (
      <main className="max-w-3xl mx-auto px-6 md:px-8 py-16">
        <div className="flex justify-between items-baseline mb-10 border-b border-[#DEDAD1] pb-6">
          <div>
            <h1 className="font-serif text-[28px] text-[#181614]">Bonjour {account.name}</h1>
            <p className="text-sm text-[#8C8780] mt-1">{account.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs uppercase tracking-wide font-medium text-[#8C8780] hover:text-[#B23A24]"
          >
            Se déconnecter
          </button>
        </div>

        <h2 className="font-serif text-[20px] text-[#181614] mb-5">Mes commandes</h2>
        {account.orders.length === 0 ? (
          <p className="text-sm text-[#8C8780]">Tu n&rsquo;as pas encore passé de commande.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {account.orders.map((order) => (
              <div key={order.id} className="border border-[#DEDAD1] p-5">
                <div className="flex justify-between items-baseline mb-3 flex-wrap gap-2">
                  <span className="font-mono text-xs text-[#8C8780]">{fmtDate(order.createdAt)}</span>
                  <span className="text-xs uppercase tracking-wide font-medium text-[#B23A24]">
                    {STATUS_LABEL[order.status]}
                  </span>
                </div>
                <ul className="text-sm text-[#3A3631] flex flex-col gap-1 mb-3">
                  {order.items.map((item, i) => (
                    <li key={i}>
                      {item.qty} × {item.title} — {fmt(item.price * item.qty)}
                      {item.dedication && (
                        <span className="block text-xs text-[#8C8780]">Dédicace : {item.dedication}</span>
                      )}
                    </li>
                  ))}
                </ul>
                <div className="flex justify-between text-sm border-t border-[#DEDAD1] pt-3">
                  <span className="text-[#8C8780]">{order.shippingLabel} ({fmt(order.shippingPrice)})</span>
                  <span className="font-mono font-medium">{fmt(order.total)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    );
  }

  // --- Non connecté : formulaire de connexion / inscription ---
  return (
    <main className="max-w-md mx-auto px-6 md:px-8 py-20">
      <h1 className="font-serif text-[28px] text-[#181614] mb-2 text-center">
        {mode === "login" ? "Mon compte" : "Créer un compte"}
      </h1>
      <p className="text-sm text-[#8C8780] text-center mb-8">
        Retrouve ici l&rsquo;historique de tes commandes.
      </p>

      <div className="flex border border-[#DEDAD1] mb-8">
        <button
          onClick={() => setMode("login")}
          className={`flex-1 py-2.5 text-xs uppercase tracking-wide font-medium ${
            mode === "login" ? "bg-[#181614] text-white" : "text-[#3A3631]"
          }`}
        >
          Se connecter
        </button>
        <button
          onClick={() => setMode("signup")}
          className={`flex-1 py-2.5 text-xs uppercase tracking-wide font-medium ${
            mode === "signup" ? "bg-[#181614] text-white" : "text-[#3A3631]"
          }`}
        >
          Créer un compte
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {mode === "signup" && (
          <div>
            <label className="block text-xs uppercase tracking-wide font-semibold text-[#3A3631] mb-2">
              Prénom
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border border-[#DEDAD1] px-3 py-2.5 text-sm focus:outline-none focus:border-[#181614]"
            />
          </div>
        )}
        <div>
          <label className="block text-xs uppercase tracking-wide font-semibold text-[#3A3631] mb-2">
            E-mail
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-[#DEDAD1] px-3 py-2.5 text-sm focus:outline-none focus:border-[#181614]"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wide font-semibold text-[#3A3631] mb-2">
            Mot de passe
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full border border-[#DEDAD1] px-3 py-2.5 text-sm focus:outline-none focus:border-[#181614]"
          />
        </div>

        {error && <p className="text-sm text-[#B23A24]">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 px-6 py-3.5 text-sm uppercase tracking-wide font-semibold bg-[#181614] text-white hover:bg-[#B23A24] transition-colors disabled:opacity-50"
        >
          {submitting ? "Un instant…" : mode === "login" ? "Se connecter" : "Créer mon compte"}
        </button>
      </form>
    </main>
  );
}
