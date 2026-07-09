import { getActiveProductsAsync } from "@/lib/products";
import Client from "./Client";
export const dynamic = "force-dynamic";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const all = await getActiveProductsAsync();
  const product = all.find(p => p.id === id) ?? null;
  const similar = all
    .filter(p => p.id !== id && p.active)
    .map(p => ({ p, s: (p.medium === product?.medium ? 3 : 0) + (p.type === product?.type ? 2 : 0) + (p.editionSold || 0) }))
    .sort((a, b) => b.s - a.s).slice(0, 3).map(x => x.p);
  return <Client product={product} similar={similar} />;
}
