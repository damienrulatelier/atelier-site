import { CartProvider } from "../components/CartContext";
import CartDrawer from "../components/CartDrawer";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import LoyaltyBanner from "../components/LoyaltyBanner";
import ScrollToTop from "../components/ScrollToTop";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <ScrollToTop />
      <LoyaltyBanner />
      <SiteHeader />
      {children}
      <SiteFooter />
      <CartDrawer />
    </CartProvider>
  );
}
