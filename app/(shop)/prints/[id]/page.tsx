import { getAllProductsAsync } from "@/lib/products";
import PrintPage from "./PrintPage";
export const dynamic = "force-dynamic";
export default async function PrintDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const products = await getAllProductsAsync();
  const product = products.find((p) => p.id === id) ?? null;
  return <PrintPage product={product} allProducts={products} />;
}
