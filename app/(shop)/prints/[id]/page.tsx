import { getAllProductsAsync } from "@/lib/products";
import dynamic from "next/dynamic";
export const dynamic_config = "force-dynamic";
const PrintPage = dynamic(() => import("./PrintPage"), { ssr: false });
export default async function PrintDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const products = await getAllProductsAsync();
  const product = products.find((p) => p.id === id) ?? null;
  return <PrintPage product={product} allProducts={products} />;
}
