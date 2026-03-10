import { AnimatedSection } from "@/components/ui/AnimatedSection"
import { ProductHighlights } from "@/components/icons/ProductHighlights"

export function QualitySection() {
    return (
        <AnimatedSection>
            <section className="relative bg-[var(--color-section-bg)] py-24">
                <div className="mx-auto max-w-6xl px-6">
                    {/* Header */}
                    <div className="mb-10 max-w-3xl mx-auto text-center">
                        <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-4">
                            Kalite Politikamız
                        </h2>

                        <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
                            ISO standartlarına uygun üretim süreçleri, sürekli iyileştirme
                            yaklaşımı ve tam izlenebilirlik prensipleri ile kaliteyi garanti
                            altına alıyoruz.
                        </p>
                    </div>

                    {/* Divider */}
                    <div className="mb-10 h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

                    {/* Highlights */}
                    <ProductHighlights />
                </div>
            </section>
        </AnimatedSection>
    );
}
