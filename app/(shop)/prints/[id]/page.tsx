import { getAllProductsAsync } from "@/lib/products";
import Client from "./Client";
export const dynamic = "force-dynamic";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const all = await getAllProductsAsync();
  const product = all.find(p => p.id === id) ?? null;
  return <Client product={product} all={all} />;
}
