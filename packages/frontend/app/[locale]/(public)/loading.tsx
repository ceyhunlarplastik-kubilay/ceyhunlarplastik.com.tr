/**
 * Public rotalar için genel navigasyon iskeleti (kategori sayfasının kendi
 * loading.tsx'i var; o daha spesifik olduğu için önceliklidir).
 *
 * Amaç: Link'e tıklandığı anda geri bildirim vermek. Aksi halde App Router,
 * RSC yanıtı gelene kadar kullanıcıyı eski sayfada bekletir.
 */
export default function PublicLoading() {
    return (
        <main aria-busy="true" aria-live="polite">
            {/* PageHero yerleşimi (public sayfaların çoğu bununla başlar) */}
            <div className="h-25 animate-pulse bg-neutral-200 sm:h-32.5 md:h-40 g:h-45" />

            <div className="mx-auto max-w-7xl space-y-6 px-6 py-12">
                <div className="h-8 w-2/5 animate-pulse rounded-lg bg-neutral-100" />
                <div className="h-4 w-full animate-pulse rounded bg-neutral-100" />
                <div className="h-4 w-4/5 animate-pulse rounded bg-neutral-100" />
                <div className="grid gap-6 pt-4 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div
                            key={i}
                            className="h-48 animate-pulse rounded-2xl bg-neutral-100"
                        />
                    ))}
                </div>
            </div>
        </main>
    )
}
