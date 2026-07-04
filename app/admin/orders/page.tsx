"use client";

import { useEffect, useState } from "react";

type Order = {
  id: string;
  customerEmail: string;
  items: { title: string; price: number; qty: number; dedication?: string }[];
  shippingLabel: string;
  total: number;
  status: "paid" | "preparing" | "shipped" | "delivered";
  createdAt: string;
};

const STATUS_OPTIONS: { key: Order["status"]; label: string }[] = [
  { key: "paid", label: "Payée" },
  { key: "preparing", label: "En préparation" },
  { key: "shipped", label: "Expédiée" },
  { key: "delivered", label: "Livrée (envoie l'invitation à l'avis)" },
];

function fmt(n: number) {
  return n.toFixed(2).replace(".", ",") + " €";
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  function load() {
    fetch("/api/admin/orders")
      .then((res) => res.json())
      .then((data) => setOrders(data.orders || []));
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(orderId: string, status: Order["status"]) {
    setUpdating(orderId);
    try {
      await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      load();
    } finally {
      setUpdating(null);
    }
  }

  if (!orders) {
    return <main className="py-24 text-center text-sm text-[#8C8780]">Chargement…</main>;
  }

  return (
    <main className="max-w-4xl mx-auto px-6 md:px-8 py-12">
      <h1 className="font-serif text-[26px] text-[#181614] mb-8">Commandes</h1>

      {orders.length === 0 ? (
        <p className="text-sm text-[#8C8780]">Aucune commande enregistrée pour l&rsquo;instant.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <div key={order.id} className="border border-[#DEDAD1] p-5">
              <div className="flex justify-between items-baseline mb-3 flex-wrap gap-2">
                <span className="font-mono text-xs text-[#8C8780]">
                  {fmtDate(order.createdAt)} · {order.customerEmail}
                </span>
                <span className="font-mono text-sm font-medium">{fmt(order.total)}</span>
              </div>
              <ul className="text-sm text-[#3A3631] mb-4">
                {order.items.map((item, i) => (
                  <li key={i}>
                    {item.qty} × {item.title}
                    {item.dedication && (
                      <span className="text-xs text-[#8C8780]"> — dédicace : {item.dedication}</span>
                    )}
                  </li>
                ))}
              </ul>
              <div className="flex items-center gap-3 flex-wrap">
                <label className="text-xs uppercase tracking-wide font-semibold text-[#3A3631]">
                  Statut :
                </label>
                <select
                  value={order.status}
                  onChange={(e) => updateStatus(order.id, e.target.value as Order["status"])}
                  disabled={updating === order.id}
                  className="border border-[#DEDAD1] px-3 py-1.5 text-sm focus:outline-none focus:border-[#181614]"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
