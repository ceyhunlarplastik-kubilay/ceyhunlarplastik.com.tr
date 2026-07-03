import { ImagePlus, Layers3, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"

type Props = {
    hasValues: boolean
    hasActiveFilters: boolean
    currentLabel: string
    onClearFilters: () => void
}

export function ProductAttributeValuesEmptyState({
    hasValues,
    hasActiveFilters,
    currentLabel,
    onClearFilters,
}: Props) {
    const title = hasValues && hasActiveFilters
        ? "Filtre sonucu bulunamadı"
        : `İlk ${currentLabel.toLocaleLowerCase("tr-TR")} değerini ekleyin`

    const description = hasValues && hasActiveFilters
        ? "Arama veya üst ilişki filtresini temizleyerek listeyi tekrar görüntüleyebilirsiniz."
        : "Bu özellik için henüz değer eklenmemiş. Değerleri ekledikten sonra görselleri de aynı kartlardan yönetebilirsiniz."

    return (
        <div className="rounded-[28px] border border-dashed border-neutral-200 bg-white px-6 py-14 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50 text-neutral-500">
                {hasValues ? <Layers3 className="h-6 w-6" /> : <ImagePlus className="h-6 w-6" />}
            </div>
            <h3 className="mt-4 text-base font-semibold text-neutral-950">{title}</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-500">
                {description}
            </p>
            {hasValues && hasActiveFilters ? (
                <Button type="button" variant="outline" className="mt-5 gap-2" onClick={onClearFilters}>
                    <RotateCcw className="h-4 w-4" />
                    Filtreleri temizle
                </Button>
            ) : null}
        </div>
    )
}
