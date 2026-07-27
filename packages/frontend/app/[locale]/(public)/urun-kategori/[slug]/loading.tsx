/**
 * Kategori sayfası navigasyon iskeleti.
 *
 * loading.tsx OLMADAN App Router, RSC yanıtı gelene kadar kullanıcıyı ESKİ sayfada
 * hiçbir geri bildirim vermeden bekletir → tıklama "hiçbir şey olmadı" hissi verir.
 * Bu dosya sayesinde tıklama anında iskelet görünür.
 *
 * Ölçüler page.tsx'teki gerçek layout ile birebir aynı (PageHero yükseklikleri +
 * max-w-7xl px-6 py-12 grid grid-cols-12 gap-8 + 3/9 kolon) → içerik gelince layout shift olmaz.
 */
export default function CategoryLoading() {
    return (
        <main aria-busy="true" aria-live="polite">
            {/* PageHero yerleşimi */}
            <div className="h-[100px] animate-pulse bg-neutral-200 sm:h-[130px] md:h-[160px] lg:h-[180px]" />

            <section className="mx-auto grid max-w-7xl grid-cols-12 gap-8 px-6 py-12">
                {/* Sidebar */}
                <aside className="col-span-3">
                    <div className="space-y-4">
                        <div className="h-10 animate-pulse rounded-xl bg-neutral-100" />
                        <div className="h-40 animate-pulse rounded-xl bg-neutral-100" />
                        <div className="h-40 animate-pulse rounded-xl bg-neutral-100" />
                    </div>
                </aside>

                {/* Ürün listesi */}
                <section className="col-span-9 space-y-6">
                    <div className="h-16 animate-pulse rounded-2xl bg-neutral-100" />
                    <ul className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <li
                                key={i}
                                className="h-40 animate-pulse rounded-2xl bg-neutral-100"
                            />
                        ))}
                    </ul>
                </section>
            </section>
        </main>
    )
}
