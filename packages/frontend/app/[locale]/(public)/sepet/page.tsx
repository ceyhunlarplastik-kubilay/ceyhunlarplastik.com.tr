import { PageHero } from "@/components/sections/PageHero"
import InquiryCartPageClient from "@/features/public/cart/components/InquiryCartPageClient"

export default function CartPage() {
    return (
        <main>
            <PageHero
                title="Talep Sepeti"
                breadcrumbs={[
                    { label: "Ana Sayfa", href: "/" },
                    { label: "Talep Sepeti" },
                ]}
            />
            <InquiryCartPageClient />
        </main>
    )
}

