import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/home/Footer";

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <Navbar />
            {/* {children} */}
            <main className="pt-[var(--navbar-height)]">{children}</main>
            <Footer />
        </>
    );
}
