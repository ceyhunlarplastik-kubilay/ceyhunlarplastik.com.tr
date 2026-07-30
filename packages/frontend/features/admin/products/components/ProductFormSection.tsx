import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type Props = {
    title: string
    description?: string
    /** Başlık hizasında sağa yerleşen kontrol (ör. locale sekmeleri, sayaç). */
    actions?: ReactNode
    children: ReactNode
    className?: string
    /**
     * Metin alanları için içeriği okunabilir bir genişlikte tutar.
     * Bölümler tek kolonda alt alta dizildiği için input'lar aksi hâlde
     * dialog genişliği boyunca (~1100px) uzuyor.
     */
    narrow?: boolean
}

/**
 * Ürün dialog'larındaki bölümlerin ortak kabuğu.
 *
 * Tek nötr yüzey kullanılır: dialog daha önce nötr + mavi (EN çevirisi) + amber
 * (endüstriyel kullanım) olmak üzere üç ayrı renk ailesi barındırıyordu ve
 * bölümler kopyala-yapıştır gibi görünüyordu. Vurgu artık yalnız marka rengiyle
 * ve yalnız ikon/gösterge seviyesinde veriliyor.
 */
export function ProductFormSection({
    title,
    description,
    actions,
    children,
    className,
    narrow = false,
}: Props) {
    return (
        <section className={cn("rounded-xl border border-neutral-200 bg-white p-5 shadow-sm", className)}>
            <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                    <h3 className="text-sm font-semibold tracking-tight text-neutral-900">{title}</h3>
                    {description ? (
                        <p className="max-w-prose text-xs leading-5 text-neutral-500">{description}</p>
                    ) : null}
                </div>

                {actions ? <div className="shrink-0">{actions}</div> : null}
            </header>

            <div className={cn(narrow && "max-w-2xl")}>{children}</div>
        </section>
    )
}
