// import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/home/Footer";
import { Navbar } from "@/components/navigation/NavbarServer";
import { NavigationProgress } from "@/components/navigation/NavigationProgress";
import { getCategories } from "@/features/public/categories/server/getCategories";
import { setRequestLocale } from "next-intl/server";

export default async function PublicLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    setRequestLocale(locale);
    // Kategoriler server'da (cache'li) çekilip Footer'a prop geçilir. Footer eskiden
    // useCategories() client hook'u kullanıyordu; ProductsSection'ın initialData'sı aynı
    // query cache'ini client'ta doldurunca server (data yok) ile client (data var) HTML'i
    // uyuşmuyordu (hydration mismatch). Prop ile server/client aynı render eder + ekstra
    // client fetch de gitmez.
    const categories = await getCategories(locale);

    return (
        <>
            {/* Tıklama anında görünen navigasyon göstergesi (navbar ve mega-dropdown'ın üstünde) */}
            <NavigationProgress />
            <Navbar />
            {/* {children} */}
            <main className="pt-(--navbar-height)">{children}</main>
            <Footer categories={categories} />
        </>
    );
}
