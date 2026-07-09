import { getActiveProductsAsync } from "@/lib/products";
import AtelierClient from "./AtelierClient";
export const dynamic = "force-dynamic";
export default async function AtelierPage() {
  const products = await getActiveProductsAsync();
  return <AtelierClient products={products} />;
}
