import { Footer } from "@/components/store/footer";
import { Header } from "@/components/store/header";
import { CartDrawer } from "@/components/store/cart-view";
import { StoreProviders } from "@/components/store/providers";
import { getCatalog } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const catalog = await getCatalog();
  return (
    <StoreProviders catalog={catalog}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header />
      <main id="main">{children}</main>
      <Footer />
      <CartDrawer />
    </StoreProviders>
  );
}
