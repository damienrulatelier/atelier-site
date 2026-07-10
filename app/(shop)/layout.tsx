import { getActiveProductsAsync } from "@/lib/products";
import { CartProvider } from "../components/CartContext";
import CartDrawer from "../components/CartDrawer";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import LoyaltyBanner from "../components/LoyaltyBanner";
import ScrollToTop from "../components/ScrollToTop";
export const dynamic = "force-dynamic";
export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const products = await getActiveProductsAsync();
  const now = Date.now();
  const hasActiveDrop = products.some(p =>
    p.active && (p.type === "drop" || (p.temporaryUntil && new Date(p.temporaryUntil).getTime() > now))
  );
  return (
    <CartProvider>
      <ScrollToTop />
      <LoyaltyBanner />
      <SiteHeader hasActiveDrop={hasActiveDrop} />
      {children}
      <SiteFooter />
      <CartDrawer />
    </CartProvider>
  );
}
