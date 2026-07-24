import { getTranslations } from "next-intl/server"
import { AnimatedSection } from "@/components/ui/AnimatedSection"
import { ProductHighlights } from "@/components/icons/ProductHighlights"

export async function QualitySection() {
    const t = await getTranslations("home.quality")

    return (
        <AnimatedSection>
            <div className="relative bg-(--color-section-bg) py-24">
                <div className="mx-auto max-w-6xl px-6">
                    {/* Header */}
                    <div className="mb-10 max-w-3xl mx-auto text-center">
                        <h2 className="text-balance text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
                            {t("title")}
                        </h2>

                        <p className="text-pretty text-lg md:text-xl text-muted-foreground leading-relaxed">
                            {t("body")}
                        </p>
                    </div>

                    {/* Divider */}
                    <div className="mb-10 h-px w-full bg-linear-to-r from-transparent via-border to-transparent" />

                    {/* Highlights */}
                    <ProductHighlights />
                </div>
            </div>
        </AnimatedSection>
    );
}
